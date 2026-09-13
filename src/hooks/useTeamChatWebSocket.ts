import { useCallback, useEffect, useRef, useState } from "react";
import { Client, IMessage, IFrame } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useSelector } from "react-redux";
import { API_URL } from "../settings";
import { selectLoginInfo } from "../state/slices/loginInfoSlice";
import { ITeamChatMessage } from "../state/features/teamChat/teamChatSlice";
import { getFreshAccessToken, refreshSession } from "../state/api/sessionManager";

/** Sent by the server when the tournament concludes and the room is destroyed. */
interface RoomClosedFrame {
    type: "ROOM_CLOSED";
    teamId: number;
}

type TeamChatFrame = ITeamChatMessage | RoomClosedFrame;

const isRoomClosed = (frame: TeamChatFrame): frame is RoomClosedFrame =>
    (frame as RoomClosedFrame).type === "ROOM_CLOSED";

/**
 * Why the room is not live, when it is not.
 *
 * `expired` is recoverable and handled without the reader doing anything; `denied` never is, so the
 * socket stops rather than asking the same refused question every five seconds.
 */
export type TeamChatConnectionError = "expired" | "denied" | "unreachable";

interface UseTeamChatWebSocketOptions {
    teamId?: number;
    onMessage: (message: ITeamChatMessage) => void;
    /** Fires when the room is purged out from under the reader. */
    onRoomClosed?: () => void;
    enabled?: boolean;
}

/**
 * The server's own words when it turns a frame down. The two cases could not be further apart —
 * one clears itself in a round trip, the other never will — so they are told apart here rather
 * than both becoming a silent dead room.
 */
const isAuthzFailure = (message: string | undefined) =>
    !!message && message.toLowerCase().includes("only open to the players");

const isAuthFailure = (message: string | undefined) =>
    !!message &&
    (message.toLowerCase().includes("session has expired") ||
        message.toLowerCase().includes("sign in"));

/**
 * Live connection to one team's room.
 *
 * <p>The token travels as a STOMP header on CONNECT rather than on the handshake, because a browser
 * cannot set headers on a WebSocket upgrade. The server authenticates there and checks squad
 * membership again on SUBSCRIBE, so an unauthorised subscribe fails the frame rather than silently
 * delivering another team's conversation.
 *
 * <p>Because that credential is only read at CONNECT, a socket that reconnects has to present a
 * *current* token — and the one captured when the client was built may be an hour stale by then.
 * `beforeConnect` is the hook stompjs provides for exactly this: it runs before every CONNECT,
 * including every automatic reconnect, and it may be async, so the token is renewed there rather
 * than replayed. Without it an expired token turns `reconnectDelay` into an endless loop of failed
 * logins, five seconds apart, that only ended when something else in the app happened to 401.
 *
 * <p>Callbacks are held in a ref so that a parent re-render does not tear the socket down and
 * reconnect — which, with a dependency on an inline handler, is exactly what would happen on every
 * keystroke in the composer.
 */
export const useTeamChatWebSocket = ({
    teamId,
    onMessage,
    onRoomClosed,
    enabled = true,
}: UseTeamChatWebSocketOptions) => {
    const clientRef = useRef<Client | null>(null);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState<TeamChatConnectionError | null>(null);

    // Only used to decide whether there is a session at all, and to rebuild on sign-in/sign-out.
    // The token actually presented is fetched fresh in `beforeConnect`.
    const token = useSelector(selectLoginInfo).token;
    const hasSession = !!token;

    const handlersRef = useRef({ onMessage, onRoomClosed });
    handlersRef.current = { onMessage, onRoomClosed };

    useEffect(() => {
        if (!enabled || !teamId || !hasSession) {
            return;
        }

        const wsUrl =
            API_URL.replace(/\/api$/, "").replace(/\/$/, "") + "/ws/team-chat";

        let stopped = false;

        const client = new Client({
            webSocketFactory: () => new SockJS(wsUrl),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,

            // Runs before the first CONNECT and before every reconnect. Renewing here rather than
            // reacting to a rejection means the common case — a tab left open past the hour —
            // never produces a failed frame at all.
            beforeConnect: async () => {
                const fresh = await getFreshAccessToken();
                if (!fresh) {
                    // Nothing left to present. Stop rather than hammer the server with a
                    // credential we already know it will refuse; `sessionManager` has already
                    // decided whether this ends the session or is just a blip it can retry.
                    setError("expired");
                    void client.deactivate();
                    return;
                }
                client.connectHeaders = { Authorization: `Bearer ${fresh}` };
            },

            onConnect: () => {
                if (stopped) {
                    return;
                }
                setConnected(true);
                setError(null);
                client.subscribe(`/topic/team-chat/${teamId}`, (frame: IMessage) => {
                    try {
                        const parsed: TeamChatFrame = JSON.parse(frame.body);
                        if (isRoomClosed(parsed)) {
                            handlersRef.current.onRoomClosed?.();
                            return;
                        }
                        handlersRef.current.onMessage(parsed);
                    } catch (parseError) {
                        console.error("Failed to parse team chat message:", parseError);
                    }
                });
            },

            onDisconnect: () => setConnected(false),
            onWebSocketClose: () => setConnected(false),

            onStompError: (frame: IFrame) => {
                setConnected(false);
                const message = frame.headers["message"];

                if (isAuthzFailure(message)) {
                    // Not a member of this team, and no amount of reconnecting will change that.
                    setError("denied");
                    void client.deactivate();
                    return;
                }

                if (isAuthFailure(message)) {
                    // The token lapsed between `beforeConnect` and the server reading it, or was
                    // revoked outright. One renewal decides which: a fresh token means the next
                    // automatic reconnect succeeds, and no token means the session is over and
                    // `sessionManager` is already acting on it.
                    setError("expired");
                    void refreshSession().then((renewed) => {
                        if (!renewed) {
                            void client.deactivate();
                        }
                    });
                    return;
                }

                console.error("Team chat socket error:", message);
                setError("unreachable");
            },
        });

        client.activate();
        clientRef.current = client;

        return () => {
            stopped = true;
            clientRef.current?.deactivate();
            clientRef.current = null;
            setConnected(false);
            setError(null);
        };
    }, [teamId, hasSession, enabled]);

    /** Lets a reader who was refused for a recoverable reason ask again without a page reload. */
    const retry = useCallback(() => {
        const client = clientRef.current;
        if (!client || client.active) {
            return;
        }
        setError(null);
        client.activate();
    }, []);

    return { connected, error, retry };
};

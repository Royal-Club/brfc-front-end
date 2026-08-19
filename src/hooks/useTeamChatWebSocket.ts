import { useEffect, useRef, useState } from "react";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useSelector } from "react-redux";
import { API_URL } from "../settings";
import { selectLoginInfo } from "../state/slices/loginInfoSlice";
import { ITeamChatMessage } from "../state/features/teamChat/teamChatSlice";

/** Sent by the server when the tournament concludes and the room is destroyed. */
interface RoomClosedFrame {
    type: "ROOM_CLOSED";
    teamId: number;
}

type TeamChatFrame = ITeamChatMessage | RoomClosedFrame;

const isRoomClosed = (frame: TeamChatFrame): frame is RoomClosedFrame =>
    (frame as RoomClosedFrame).type === "ROOM_CLOSED";

interface UseTeamChatWebSocketOptions {
    teamId?: number;
    onMessage: (message: ITeamChatMessage) => void;
    /** Fires when the room is purged out from under the reader. */
    onRoomClosed?: () => void;
    enabled?: boolean;
}

/**
 * Live connection to one team's room.
 *
 * <p>The token travels as a STOMP header on CONNECT rather than on the handshake, because a browser
 * cannot set headers on a WebSocket upgrade. The server authenticates there and checks squad
 * membership again on SUBSCRIBE, so an unauthorised subscribe fails the frame rather than silently
 * delivering another team's conversation.
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

    const token = useSelector(selectLoginInfo).token;

    const handlersRef = useRef({ onMessage, onRoomClosed });
    handlersRef.current = { onMessage, onRoomClosed };

    useEffect(() => {
        if (!enabled || !teamId || !token) {
            return;
        }

        const wsUrl =
            API_URL.replace(/\/api$/, "").replace(/\/$/, "") + "/ws/team-chat";

        const client = new Client({
            webSocketFactory: () => new SockJS(wsUrl),
            connectHeaders: { Authorization: `Bearer ${token}` },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                setConnected(true);
                client.subscribe(`/topic/team-chat/${teamId}`, (frame: IMessage) => {
                    try {
                        const parsed: TeamChatFrame = JSON.parse(frame.body);
                        if (isRoomClosed(parsed)) {
                            handlersRef.current.onRoomClosed?.();
                            return;
                        }
                        handlersRef.current.onMessage(parsed);
                    } catch (error) {
                        console.error("Failed to parse team chat message:", error);
                    }
                });
            },
            onDisconnect: () => setConnected(false),
            onStompError: (frame) => {
                // The server refuses a subscription to a room the player is not in, and refuses the
                // connection outright once their token has expired. Both arrive here.
                console.error("Team chat socket error:", frame.headers["message"]);
                setConnected(false);
            },
        });

        client.activate();
        clientRef.current = client;

        return () => {
            clientRef.current?.deactivate();
            clientRef.current = null;
            setConnected(false);
        };
    }, [teamId, token, enabled]);

    return { connected };
};

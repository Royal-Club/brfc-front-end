import React, { Suspense, lazy, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Badge, Button, Dropdown, Skeleton, Tooltip } from "antd";
import {
    ExpandOutlined,
    MessageOutlined,
    MinusOutlined,
    TeamOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { useGetMyOpenTeamChatRoomsQuery } from "../../state/features/teamChat/teamChatSlice";
import { club } from "../../theme/clubTheme";
import {
    selectDockOpen,
    selectDockTeamId,
    setDockOpen,
    setDockRoom,
} from "../../state/features/teamChat/teamChatUISlice";
import "./teamChatDock.css";

// Loaded only when the panel is first opened. The dock itself is on every page, but the room drags
// in the STOMP client and the socket transport, which nobody who never opens it should pay for.
const TeamChatRoom = lazy(() => import("./TeamChatRoom"));

/** The full-page view of the same room; the dock stands down there so two do not run at once. */
const FULL_PAGE_PREFIX = "/tournaments/team-chat/";

/**
 * How often the dock re-checks whether a room has opened.
 *
 * <p>A room appears the moment an admin publishes a line-up, which happens while players are already
 * sitting on some other page. Without this the dock would only appear on their next full reload,
 * which for a tab left open all evening may be never. Five minutes is far longer than the request
 * costs and far shorter than the wait it removes.
 */
const ROOM_POLL_MS = 5 * 60 * 1000;

/**
 * The chat dock: a launcher pinned to the bottom-right of every page, and the panel it opens.
 *
 * <p>Renders nothing at all when the player is in no open room, which is most of the week - an
 * always-present button that always says "nothing here" is worse than no button.
 */
export default function TeamChatDock() {
    const location = useLocation();
    const navigate = useNavigate();

    const { data: rooms = [], refetch } = useGetMyOpenTeamChatRoomsQuery(undefined, {
        pollingInterval: ROOM_POLL_MS,
        refetchOnMountOrArgChange: true,
    });

    // Held in the store, not here: expanding to the full page unmounts nothing but does move the
    // player away from the dock, and the page's "minimise" has to be able to bring it back open.
    const dispatch = useDispatch();
    const open = useSelector(selectDockOpen);
    const activeTeamId = useSelector(selectDockTeamId);
    const setOpen = useCallback(
        (next: boolean) => dispatch(setDockOpen(next)),
        [dispatch]
    );

    // A room can close under the dock - the tournament concludes while someone has the panel up -
    // and the poll above is what notices. Falling back to the first still-open room, or to none,
    // keeps the panel from pointing at something the server would now refuse.
    const activeRoom =
        rooms.find((room) => room.teamId === activeTeamId) ?? rooms[0];

    useEffect(() => {
        if (!activeRoom) {
            setOpen(false);
        }
    }, [activeRoom, setOpen]);

    // Two live rooms would mean two sockets on the same subscription, and every message arriving
    // twice over. The page is the better view when it is on screen, so the dock yields to it.
    if (!activeRoom || location.pathname.startsWith(FULL_PAGE_PREFIX)) {
        return null;
    }

    if (!open) {
        // Labelled, not a bare icon. A circle with a speech bubble in the corner of a page is a
        // thing people have learned to ignore as a support widget; the squad's own name on it is
        // what says this is their team room and that there is a chat here at all.
        return (
            <Tooltip title="Open your team chat" placement="left">
                <Button
                    type="primary"
                    size="large"
                    className="team-chat-dock__launcher"
                    icon={<MessageOutlined />}
                    onClick={() => setOpen(true)}
                >
                    {activeRoom.teamName}
                </Button>
            </Tooltip>
        );
    }

    return (
        <div className="team-chat-dock" role="complementary" aria-label="Team chat">
            <div className="team-chat-dock__bar">
                {rooms.length > 1 ? (
                    // Only when there is a choice to make. Two tournaments can be live at once, and
                    // the dock has no URL to tell it which one the player means.
                    <Dropdown
                        trigger={["click"]}
                        menu={{
                            selectedKeys: [String(activeRoom.teamId)],
                            items: rooms.map((room) => ({
                                key: String(room.teamId),
                                label: `${room.teamName} — ${
                                    room.tournamentName ?? "Tournament"
                                }`,
                            })),
                            onClick: ({ key }) => dispatch(setDockRoom(Number(key))),
                        }}
                    >
                        <button type="button" className="team-chat-dock__title">
                            <TeamOutlined style={{ color: club.gold }} />
                            <span>{activeRoom.teamName}</span>
                            <Badge count={rooms.length} size="small" />
                        </button>
                    </Dropdown>
                ) : (
                    <span className="team-chat-dock__title">
                        <TeamOutlined style={{ color: club.gold }} />
                        <span>{activeRoom.teamName}</span>
                    </span>
                )}

                <div className="team-chat-dock__actions">
                    <Tooltip title="Open full view">
                        <Button
                            type="text"
                            size="small"
                            icon={<ExpandOutlined />}
                            // By tournament, not by team: the full page resolves the squad from the
                            // caller's own token, so there is no team id to leak into a URL.
                            onClick={() =>
                                navigate(
                                    `${FULL_PAGE_PREFIX}${activeRoom.tournamentId}`
                                )
                            }
                            // The dock is left marked open on purpose: coming back from the full
                            // page should restore the panel the player was looking at, not drop
                            // them to a launcher they have to click again.
                        />
                    </Tooltip>
                    {/* One control, not the minimise-and-close pair a window usually has. There is
                        nothing for "close" to mean here that "minimise" does not already do: the
                        launcher is always there to reopen from, so a second button would just be a
                        second way to collapse the same panel. */}
                    <Tooltip title="Minimise to the launcher">
                        <Button
                            type="text"
                            size="small"
                            icon={<MinusOutlined />}
                            onClick={() => setOpen(false)}
                        />
                    </Tooltip>
                </div>
            </div>

            <div className="team-chat-dock__body">
                <Suspense fallback={<Skeleton active paragraph={{ rows: 6 }} />}>
                    {/* Keyed by room, so switching tournaments tears the socket and the message
                        list down rather than showing one room's history under another's name. */}
                    <TeamChatRoom
                        key={activeRoom.teamId}
                        room={activeRoom}
                        // The socket says so the moment a tournament is concluded, which is sooner
                        // than the poll would notice. Refetching drops the room from the list, and
                        // the effect above closes the panel behind it.
                        onRoomClosed={refetch}
                        compact
                    />
                </Suspense>
            </div>
        </div>
    );
}

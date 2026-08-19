import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Alert, Button, Card, Skeleton, Tooltip } from "antd";
import { ShrinkOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { useGetMyTeamChatRoomQuery } from "../../state/features/teamChat/teamChatSlice";
import { setDockOpen } from "../../state/features/teamChat/teamChatUISlice";
import TeamChatRoom from "./TeamChatRoom";

/**
 * The player's own team room for a tournament.
 *
 * <p>Addressed by tournament rather than by team: a player should not have to know their team's id
 * to reach their own chat, and the server resolves the squad from their token anyway. That also
 * means the URL cannot be edited into somebody else's room.
 */
export default function TeamChatPage() {
    const { tournamentId = "" } = useParams();
    const id = Number(tournamentId);
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();

    const { data: room, isLoading, refetch } = useGetMyTeamChatRoomQuery(id, {
        skip: !id,
    });

    /**
     * Back to wherever the player expanded from, with the dock panel open behind them.
     *
     * <p>Going back rather than to a fixed route is what makes this the reverse of expanding: an
     * admin who came from team building lands on team building, and a player who came from the join
     * page lands there. React Router leaves `key` as "default" on an entry it did not push, which is
     * how a cold load - a refresh, or a pasted link - is told apart from a step within the app;
     * there is no history to go back through in that case, so the tournament page stands in.
     */
    const handleMinimise = () => {
        dispatch(setDockOpen(true));
        if (location.key === "default") {
            navigate(`/tournaments/join-tournament/${id}`);
            return;
        }
        navigate(-1);
    };

    if (isLoading) {
        return (
            <Card>
                <Skeleton active paragraph={{ rows: 8 }} />
            </Card>
        );
    }

    // 204 from the server: the player is not on a team in this tournament at all.
    if (!room) {
        return (
            <Card>
                <Alert
                    type="info"
                    showIcon
                    message="No team chat"
                    description="You are not part of a team in this tournament yet. The chat opens for your team once its line-up is published."
                />
            </Card>
        );
    }

    // The card is painted with the room rather than left as a default: the chat carries its own
    // navy palette now, and a grey frame around it reads as a mistake.
    return (
        <Card className="team-chat-page" styles={{ body: { padding: 16 } }}>
            {/* The counterpart to the dock's expand button. Without it the full view is a one-way
                trip, and the only way back to the conversation-plus-page layout is the browser's
                own back button - which is not somewhere a control should hide. */}
            <div className="team-chat-page__toolbar">
                <Tooltip title="Back to the corner panel">
                    <Button
                        size="small"
                        icon={<ShrinkOutlined />}
                        onClick={handleMinimise}
                    >
                        Minimise to dock
                    </Button>
                </Tooltip>
            </div>

            {/* Refetching on close swaps the room for its "deleted" message without a reload. */}
            <TeamChatRoom room={room} onRoomClosed={refetch} />
        </Card>
    );
}

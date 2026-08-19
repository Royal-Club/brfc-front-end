import React from "react";
import { useParams } from "react-router-dom";
import { Alert, Card, Skeleton } from "antd";
import { useGetMyTeamChatRoomQuery } from "../../state/features/teamChat/teamChatSlice";
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

    const { data: room, isLoading, refetch } = useGetMyTeamChatRoomQuery(id, {
        skip: !id,
    });

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

    return (
        <Card styles={{ body: { padding: 16 } }}>
            {/* Refetching on close swaps the room for its "deleted" message without a reload. */}
            <TeamChatRoom room={room} onRoomClosed={refetch} />
        </Card>
    );
}

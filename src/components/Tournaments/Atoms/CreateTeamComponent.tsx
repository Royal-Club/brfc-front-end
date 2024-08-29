import React from "react";
import { Button, message } from "antd";
import { useCreateTournamentTeamMutation } from "../../../state/features/tournaments/tournamentTeamSlice";

export default function CreateTeamComponent({
    tournamentId,
    existingTeams,
    refetchSummary,
}: {
    tournamentId: number;
    existingTeams: string[];
    refetchSummary: () => void;
}) {
    const [createTeam, { isLoading: isCreating }] =
        useCreateTournamentTeamMutation();

    const handleCreateTeam = () => {
        const teamName = `Team ${String.fromCharCode(
            65 + existingTeams.length
        )}`;
        const teamData = { tournamentId, teamName };
        createTeam(teamData)
            .unwrap()
            .then(() => {
                message.success("Team created successfully");
                refetchSummary();
            })
            .catch(() => {
                message.error("Failed to create team");
            });
    };

    return (
        <Button
            onClick={handleCreateTeam}
            loading={isCreating}
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            + Add Team
        </Button>
    );
}

import React from "react";
import { Button, message } from "antd";
import { useCreateTournamentTeamMutation } from "../../../state/features/tournaments/tournamentTeamSlice";
import { normalizeErrorMessage } from "../../../utils/normalizeErrorMessage";

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

    const getErrorMessage = (error: any) => {
        return normalizeErrorMessage(error, "Failed to create team");
    };
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
            .catch((error) => {
                message.error(getErrorMessage(error));
            });
    };

    return (
        <Button
            onClick={handleCreateTeam}
            disabled={isCreating}
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

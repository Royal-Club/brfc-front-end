import React, { useCallback } from "react";
import { Empty, Spin, message } from "antd";
import {
    useSaveTeamDefaultFormationMutation,
    useTeamDefaultFormationQuery,
    type ITeamFormationPayload,
} from "../../../state/features/tournaments/teamFormationSlice";
import { normalizeErrorMessage } from "../../../utils/normalizeErrorMessage";
import FormationBoard from "./FormationBoard";

interface TeamFormationPanelProps {
    teamId: number;
}

/**
 * A team's default line-up — the one every new match starts from. Captains and
 * admins can edit it; everyone else sees it read-only.
 */
const TeamFormationPanel: React.FC<TeamFormationPanelProps> = ({ teamId }) => {
    // Always re-read on open. Tag invalidation covers the squad changes made in
    // this app, but a line-up carries its squad inside it and can go stale for
    // reasons no tag knows about — another admin's edit, a sleeping laptop — and
    // a captain picking from a squad that no longer exists is worth one request.
    const { data, isLoading, isFetching } = useTeamDefaultFormationQuery(
        { teamId },
        { refetchOnMountOrArgChange: true }
    );
    const [saveFormation, { isLoading: saving }] = useSaveTeamDefaultFormationMutation();

    const handleSave = useCallback(
        async (payload: ITeamFormationPayload) => {
            try {
                await saveFormation({ teamId, body: payload }).unwrap();
                message.success("Line-up saved");
            } catch (error: any) {
                message.error(
                    normalizeErrorMessage(error?.data || error, "Could not save the line-up")
                );
            }
        },
        [saveFormation, teamId]
    );

    if (isLoading) {
        return (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
                <Spin />
            </div>
        );
    }

    if (!data?.content) {
        return <Empty description="No line-up available for this team" />;
    }

    return (
        <Spin spinning={isFetching && !isLoading}>
            {/* No heading: the modal this opens in already names the team. */}
            <FormationBoard formation={data.content} saving={saving} onSave={handleSave} />
        </Spin>
    );
};

export default TeamFormationPanel;

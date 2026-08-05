import React, { useCallback, useState } from "react";
import { Empty, Segmented, Spin, Typography, message } from "antd";
import useIsMobile from "../../../hooks/useIsMobile";
import {
    useMatchFormationsQuery,
    useResetMatchTeamFormationMutation,
    useSaveMatchTeamFormationMutation,
    type ITeamFormationPayload,
} from "../../../state/features/tournaments/teamFormationSlice";
import { normalizeErrorMessage } from "../../../utils/normalizeErrorMessage";
import FormationBoard from "./FormationBoard";

const { Text } = Typography;

interface MatchFormationsPanelProps {
    matchId: number;
}

/**
 * Both sides' line-ups for one fixture. Each starts as a copy of that team's
 * default until its captain saves something match-specific.
 */
const MatchFormationsPanel: React.FC<MatchFormationsPanelProps> = ({ matchId }) => {
    const isMobile = useIsMobile(992);
    const { data, isLoading, isFetching } = useMatchFormationsQuery({ matchId });
    const [saveFormation, { isLoading: saving }] = useSaveMatchTeamFormationMutation();
    const [resetFormation, { isLoading: resetting }] = useResetMatchTeamFormationMutation();
    const [activeTeamId, setActiveTeamId] = useState<number | null>(null);

    const formations = data?.content || [];

    const handleSave = useCallback(
        async (teamId: number, payload: ITeamFormationPayload) => {
            try {
                await saveFormation({ matchId, teamId, body: payload }).unwrap();
                message.success("Line-up saved");
            } catch (error: any) {
                message.error(
                    normalizeErrorMessage(error?.data || error, "Could not save the line-up")
                );
            }
        },
        [matchId, saveFormation]
    );

    const handleReset = useCallback(
        async (teamId: number) => {
            try {
                await resetFormation({ matchId, teamId }).unwrap();
                message.success("Back to the team's default line-up");
            } catch (error: any) {
                message.error(
                    normalizeErrorMessage(error?.data || error, "Could not reset the line-up")
                );
            }
        },
        [matchId, resetFormation]
    );

    if (isLoading) {
        return (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
                <Spin />
            </div>
        );
    }

    if (formations.length === 0) {
        return <Empty description="No line-ups for this match yet" />;
    }

    // Two pitches side by side has room on a desktop; phones get a team switch.
    const activeId = activeTeamId ?? formations[0].teamId;
    const visible = isMobile
        ? formations.filter((formation) => formation.teamId === activeId)
        : formations;

    return (
        <Spin spinning={isFetching && !isLoading}>
            {isMobile && formations.length > 1 && (
                <Segmented
                    block
                    style={{ marginBottom: 12 }}
                    value={activeId}
                    onChange={(value) => setActiveTeamId(Number(value))}
                    options={formations.map((formation) => ({
                        label: formation.teamName,
                        value: formation.teamId,
                    }))}
                />
            )}

            <div
                style={{
                    display: "grid",
                    gap: 24,
                    gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
                }}
            >
                {visible.map((formation) => (
                    <FormationBoard
                        key={formation.teamId}
                        formation={formation}
                        saving={saving}
                        resetting={resetting}
                        onSave={(payload) => handleSave(formation.teamId, payload)}
                        onResetToDefault={() => handleReset(formation.teamId)}
                        title={
                            <Text strong style={{ display: "block" }}>
                                {formation.teamName}
                            </Text>
                        }
                    />
                ))}
            </div>
        </Spin>
    );
};

export default MatchFormationsPanel;

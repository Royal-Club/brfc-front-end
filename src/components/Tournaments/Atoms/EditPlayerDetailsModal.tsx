import React, { useEffect } from "react";
import { Modal, Form, InputNumber, Select, Switch, message } from "antd";
import { Player } from "../tournamentTypes";

interface EditPlayerDetailsModalProps {
    visible: boolean;
    player: Player | null;
    onClose: () => void;
    onSave: (
        playerId: number,
        teamId: number,
        playingPosition: string,
        id: number,
        isCaptain: boolean,
        teamPlayerRole: string,
        jerseyNumber?: number
    ) => void;
}

const EditPlayerDetailsModal: React.FC<EditPlayerDetailsModalProps> = ({
    visible,
    player,
    onClose,
    onSave,
}) => {
    const [form] = Form.useForm();

    useEffect(() => {
        if (player && visible) {
            form.setFieldsValue({
                jerseyNumber: player.jerseyNumber,
                isCaptain: player.isCaptain || false,
                teamPlayerRole: player.teamPlayerRole || "PLAYER",
            });
        }
    }, [player, visible, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            if (!player?.id || !player?.teamId) {
                message.error("Invalid player data");
                return;
            }

            // Sync isCaptain with teamPlayerRole
            const isCaptain = values.teamPlayerRole === "CAPTAIN";

            onSave(
                player.playerId,
                player.teamId,
                player.playingPosition || "UNASSIGNED",
                player.id,
                isCaptain,
                values.teamPlayerRole,
                values.jerseyNumber
            );
            onClose();
        } catch (error) {
            console.error("Validation failed:", error);
        }
    };

    // Handle team role change to sync with isCaptain
    const handleTeamRoleChange = (value: string) => {
        form.setFieldsValue({
            isCaptain: value === "CAPTAIN",
        });
    };

    return (
        <Modal
            title={`Edit Player Details - ${player?.playerName}`}
            open={visible}
            onCancel={onClose}
            onOk={handleSubmit}
            okText="Save"
            cancelText="Cancel"
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    label="Jersey Number"
                    name="jerseyNumber"
                    rules={[
                        {
                            type: "number",
                            min: 1,
                            max: 99,
                            message: "Jersey number must be between 1 and 99",
                        },
                    ]}
                >
                    <InputNumber
                        placeholder="Enter jersey number"
                        style={{ width: "100%" }}
                        min={1}
                        max={99}
                    />
                </Form.Item>

                <Form.Item
                    label="Team Role"
                    name="teamPlayerRole"
                    rules={[{ required: true, message: "Please select a role" }]}
                >
                    <Select
                        placeholder="Select role"
                        onChange={handleTeamRoleChange}
                    >
                        <Select.Option value="PLAYER">Player</Select.Option>
                        <Select.Option value="CAPTAIN">Captain</Select.Option>
                    </Select>
                </Form.Item>

                <Form.Item
                    label="Captain"
                    name="isCaptain"
                    valuePropName="checked"
                    tooltip="This is automatically set to true when role is Captain"
                >
                    <Switch disabled />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default EditPlayerDetailsModal;

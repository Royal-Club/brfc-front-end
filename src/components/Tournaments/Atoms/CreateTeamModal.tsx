import React, { useState } from "react";
import { Modal, Form, Input, Button, message } from "antd";
import Title from "antd/es/typography/Title";
import { useCreateTournamentTeamMutation } from "../../../state/features/tournaments/tournamentTeamSlice";

export default function CreateTeamModal({
    tournamentId,
    tournamentName,
    refetchSummary,
}: {
    tournamentId: number;
    tournamentName: string;
    refetchSummary: () => void;
}) {
    const [createTeam, { isLoading: isCreating }] =
        useCreateTournamentTeamMutation();
    const [open, setOpen] = useState(false);
    const [form] = Form.useForm();

    const handleCreateTeam = (values: { teamName: string }) => {
        const teamData = { tournamentId, ...values };
        console.log("Team data:", teamData);
        createTeam(teamData)
            .unwrap()
            .then(() => {
                message.success("Team created successfully");
                refetchSummary();
                setOpen(false);
                form.resetFields();
            })
            .catch(() => {
                message.error("Failed to create team");
            });
    };

    return (
        <div>
            <Button onClick={() => setOpen(true)}>Create Team</Button>
            <Modal
                title={
                    <Title level={3}>Create Team for {tournamentName}</Title>
                }
                open={open}
                onCancel={() => setOpen(false)}
                footer={null}
            >
                <Form form={form} onFinish={handleCreateTeam} layout="vertical">
                    <Form.Item
                        name="teamName"
                        label="Team Name"
                        rules={[
                            {
                                required: true,
                                message: "Please input the team name!",
                            },
                        ]}
                    >
                        <Input placeholder="Enter team name" />
                    </Form.Item>
                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            block
                            loading={isCreating}
                        >
                            Create Team
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

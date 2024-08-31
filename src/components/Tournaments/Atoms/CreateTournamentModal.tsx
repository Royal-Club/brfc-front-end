import React, { useState } from "react";
import { Modal, Form, Input, Select, DatePicker, Button, message } from "antd";
import { useGetVanuesQuery } from "../../../state/features/vanues/vanuesSlice";
import Title from "antd/es/typography/Title";
import { useCreateTournamentMutation } from "../../../state/features/tournaments/tournamentsSlice";

const { Option } = Select;

export default function CreateTournament() {
    const { data: venuesData, isLoading } = useGetVanuesQuery();
    const [createTournament, { isLoading: isCreating }] =
        useCreateTournamentMutation();
    const [open, setOpen] = useState(false);
    const [form] = Form.useForm();

    const handleCreateTournament = (values: {
        tournamentName: string;
        tournamentDate: Date;
        venueId: number;
    }) => {
        console.log("Tournament data:", values);
        createTournament(values)
            .unwrap()
            .then(() => {
                message.success("Tournament created successfully");
                setOpen(false);
                form.resetFields();
            })
            .catch((err) => {
                message.error("Failed to create tournament");
            });
    };

    return (
        <div>
            <Button onClick={() => setOpen(true)}> + New Tournament</Button>
            <Modal
                title={<Title level={3}>Create Tournament</Title>}
                open={open}
                onCancel={() => setOpen(false)}
                footer={null}
            >
                <Form
                    form={form}
                    onFinish={handleCreateTournament}
                    layout="vertical"
                >
                    <Form.Item
                        name="tournamentName"
                        label="Tournament Name"
                        rules={[
                            {
                                required: true,
                                message: "Please input the tournament name!",
                            },
                        ]}
                    >
                        <Input placeholder="Enter tournament name" />
                    </Form.Item>
                    <Form.Item
                        name="tournamentDate"
                        label="Tournament Date"
                        rules={[
                            {
                                required: true,
                                message: "Please select the tournament date!",
                            },
                        ]}
                    >
                        <DatePicker style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item
                        name="venueId"
                        label="Venue"
                        rules={[
                            {
                                required: true,
                                message: "Please select a venue!",
                            },
                        ]}
                    >
                        <Select loading={isLoading}>
                            {venuesData?.content.map((venue) => (
                                <Option key={venue.id} value={venue.id}>
                                    {venue.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            block
                            loading={isCreating}
                        >
                            Create Tournament
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

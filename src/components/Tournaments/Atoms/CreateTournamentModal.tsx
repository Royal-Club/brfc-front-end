import React, { useEffect, useState } from "react";
import {
    Modal,
    Form,
    Input,
    Select,
    DatePicker,
    Button,
    message,
    Spin,
} from "antd";
import { useGetVanuesQuery } from "../../../state/features/vanues/vanuesSlice";
import Title from "antd/es/typography/Title";
import moment from "moment";
import {
    useCreateTournamentMutation,
    useUpdateTournamentMutation,
} from "../../../state/features/tournaments/tournamentsSlice";
import { IoTournamentSingleSummaryType } from "../../../state/features/tournaments/tournamentTypes";

const { Option } = Select;

interface CreateTournamentProps {
    tournamentId?: number;
    isUpdateModalVisible?: boolean;
    handleSetIsUpdateModalVisible?: (value: boolean) => void;
    tournamentData?: IoTournamentSingleSummaryType;
}

export default function CreateTournament({
    tournamentId,
    isUpdateModalVisible,
    handleSetIsUpdateModalVisible,
    tournamentData,
}: CreateTournamentProps) {
    const { data: venuesData, isLoading: isVenuesLoading } =
        useGetVanuesQuery();
    const [createTournament, { isLoading: isCreating }] =
        useCreateTournamentMutation();
    const [updateTournament, { isLoading: isUpdating }] =
        useUpdateTournamentMutation();
    const [open, setOpen] = useState(false);
    const [form] = Form.useForm();

    const handleCreateOrUpdateTournament = (values: {
        tournamentName: string;
        tournamentDate: Date;
        venueId: number;
    }) => {
        if (tournamentId) {
            updateTournament({ id: tournamentId, ...values })
                .unwrap()
                .then(() => {
                    message.success("Tournament updated successfully");
                    setOpen(false);
                    form.resetFields();
                    if (handleSetIsUpdateModalVisible) {
                        handleSetIsUpdateModalVisible(false);
                    }
                })
                .catch((err) => {
                    message.error("Failed to update tournament");
                });
        } else {
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
        }
    };

    useEffect(() => {
        if (isUpdateModalVisible) {
            setOpen(true);
        }
    }, [isUpdateModalVisible]);

    useEffect(() => {
        if (tournamentData && venuesData) {
            form.setFieldsValue({
                tournamentName: tournamentData.name,
                tournamentDate: moment(tournamentData.tournamentDate),
                venueId: venuesData.content.find(
                    (venue) => venue.name === tournamentData.venueName
                )?.id,
            });
        }
    }, [tournamentData, venuesData, form]);

    return (
        <div>
            {!tournamentId && (
                <Button onClick={() => setOpen(true)}> + New Tournament</Button>
            )}
            <Modal
                title={
                    <Title level={3}>
                        {tournamentId
                            ? "Update Tournament"
                            : "Create Tournament"}
                    </Title>
                }
                open={open}
                onCancel={() => {
                    setOpen(false);
                    if (handleSetIsUpdateModalVisible) {
                        handleSetIsUpdateModalVisible(false);
                    }
                }}
                footer={null}
            >
                {/* Show loading spinner if venues are being fetched */}
                {isVenuesLoading ? (
                    <Spin tip="Loading venues..." />
                ) : (
                    <Form
                        form={form}
                        onFinish={handleCreateOrUpdateTournament}
                        layout="vertical"
                    >
                        <Form.Item
                            name="tournamentName"
                            label="Tournament Name"
                            rules={[
                                {
                                    required: true,
                                    message:
                                        "Please input the tournament name!",
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
                                    message:
                                        "Please select the tournament date!",
                                },
                            ]}
                        >
                            <DatePicker
                                showTime={{ format: "HH:mm" }}
                                format="YYYY-MM-DD HH:mm"
                                style={{ width: "100%" }}
                            />
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
                            <Select loading={isVenuesLoading}>
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
                                loading={isCreating || isUpdating}
                            >
                                {tournamentId
                                    ? "Update Tournament"
                                    : "Create Tournament"}
                            </Button>
                        </Form.Item>
                    </Form>
                )}
            </Modal>
        </div>
    );
}

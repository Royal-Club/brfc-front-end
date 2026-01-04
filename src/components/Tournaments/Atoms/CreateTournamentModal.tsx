import React, { useEffect, useState } from "react";
import {
    Modal,
    Form,
    Input,
    Select,
    DatePicker,
    TimePicker,
    Button,
    message,
    Spin,
    Row,
    Col,
    Space,
} from "antd";
import { CalendarOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { useGetVanuesQuery } from "../../../state/features/vanues/vanuesSlice";
import Title from "antd/es/typography/Title";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import {
    useCreateTournamentMutation,
    useUpdateTournamentMutation,
} from "../../../state/features/tournaments/tournamentsSlice";
import { IoTournamentSingleSummaryType } from "../../../state/features/tournaments/tournamentTypes";

dayjs.extend(utc);

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

    const handleCreateOrUpdateTournament = async (values: {
        tournamentName: string;
        tournamentDate: any;
        tournamentTime: any;
        venueId: number;
    }) => {
        if (!values.tournamentDate || !values.tournamentTime) {
            message.error("Please select both date and time");
            return;
        }

        // Combine date and time as LOCAL time first
        const localDateTime = values.tournamentDate.clone()
            .hour(values.tournamentTime.hour())
            .minute(values.tournamentTime.minute())
            .second(0)
            .millisecond(0);

        // Convert local time to UTC for API
        const tournamentDateUTC = localDateTime.utc().format("YYYY-MM-DDTHH:mm:ss");

        const payload = {
            tournamentName: values.tournamentName,
            tournamentDate: tournamentDateUTC,
            venueId: values.venueId,
        };

        if (tournamentId) {
            updateTournament({ id: tournamentId, ...payload })
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
                    console.error(err);
                });
        } else {
            createTournament(payload)
                .unwrap()
                .then(() => {
                    message.success("Tournament created successfully");
                    setOpen(false);
                    form.resetFields();
                })
                .catch((err) => {
                    console.error(err);

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
            // Parse tournament date from UTC to local
            const tournamentDateTime = dayjs.utc(tournamentData.tournamentDate).local();

            form.setFieldsValue({
                tournamentName: tournamentData.name,
                tournamentDate: tournamentDateTime,
                tournamentTime: tournamentDateTime,
                venueId: venuesData.content.find(
                    (venue: any) => venue.name === tournamentData.venueName
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

                        <Row gutter={12}>
                            <Col span={12}>
                                <Form.Item
                                    name="tournamentDate"
                                    label={
                                        <Space>
                                            <CalendarOutlined />
                                            Tournament Date
                                        </Space>
                                    }
                                    rules={[
                                        {
                                            required: true,
                                            message: "Please select the tournament date!",
                                        },
                                    ]}
                                >
                                    <DatePicker
                                        format="YYYY-MM-DD"
                                        style={{ width: "100%" }}
                                        placeholder="Select date"
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="tournamentTime"
                                    label={
                                        <Space>
                                            <ClockCircleOutlined />
                                            Tournament Time
                                        </Space>
                                    }
                                    rules={[
                                        {
                                            required: true,
                                            message: "Please select the tournament time!",
                                        },
                                    ]}
                                >
                                    <TimePicker
                                        format="h:mm A"
                                        use12Hours
                                        style={{ width: "100%" }}
                                        placeholder="Select time"
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
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
                                {venuesData?.content.map((venue: any) => (
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

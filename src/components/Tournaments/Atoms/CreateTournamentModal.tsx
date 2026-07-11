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
    Switch,
    Upload,
    Image,
} from "antd";
import { CalendarOutlined, ClockCircleOutlined, UploadOutlined, DeleteOutlined } from "@ant-design/icons";
import { useGetVanuesQuery } from "../../../state/features/vanues/vanuesSlice";
import Title from "antd/es/typography/Title";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import {
    useCreateTournamentMutation,
    useUpdateTournamentMutation,
    usePresignRoadmapImageUploadMutation,
} from "../../../state/features/tournaments/tournamentsSlice";
import { IoTournamentSingleSummaryType } from "../../../state/features/tournaments/tournamentTypes";
import { toAbsoluteLogoUrl } from "../../TournamentViewer/teamLogoUtils";
import { validateImageFile, compressImage } from "../../../utils/imageUploadUtils";

const MAX_ROADMAP_IMAGE_SIZE = 8 * 1024 * 1024;

dayjs.extend(utc);

const { Option } = Select;

interface CreateTournamentProps {
    tournamentId?: number;
    isUpdateModalVisible?: boolean;
    handleSetIsUpdateModalVisible?: (value: boolean) => void;
    tournamentData?: IoTournamentSingleSummaryType;
}

interface FormValues {
    tournamentName: string;
    tournamentDate: any;
    tournamentTime: any;
    venueId: number;
    auctionMode: boolean; // Added auctionMode to the form values
    defaultTournament?: boolean;
    season?: string;
    description?: string;
    rules?: string;
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
    const [presignRoadmapImageUpload] = usePresignRoadmapImageUploadMutation();
    const [open, setOpen] = useState(false);
    const [form] = Form.useForm();
    const [roadmapImageUrl, setRoadmapImageUrl] = useState<string | undefined>(undefined);
    const [isUploadingRoadmapImage, setIsUploadingRoadmapImage] = useState(false);

    const handleCreateOrUpdateTournament = async (values: FormValues) => {
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
            auctionMode: values.auctionMode || false,
            defaultTournament: Boolean(values.defaultTournament),
            season: values.season,
            description: values.description,
            rules: values.rules,
            roadmapImageUrl,
        };

        if (tournamentId) {
            updateTournament({ id: tournamentId, ...payload })
                .unwrap()
                .then(() => {
                    message.success("Tournament updated successfully");
                    setOpen(false);
                    form.resetFields();
                    setRoadmapImageUrl(undefined);
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
                    setRoadmapImageUrl(undefined);
                })
                .catch((err) => {
                    console.error(err);

                });
        }
    };

    const handleUploadRoadmapImage = async (file: File) => {
        try {
            setIsUploadingRoadmapImage(true);
            validateImageFile(file, MAX_ROADMAP_IMAGE_SIZE);

            const optimizedFile = await compressImage(file, 1600);

            const uploadResponse = await presignRoadmapImageUpload({
                fileName: optimizedFile.name,
                contentType: optimizedFile.type || "image/jpeg",
            }).unwrap();

            const key = uploadResponse?.content?.key;
            const uploadUrl = uploadResponse?.content?.uploadUrl;
            const url = uploadResponse?.content?.url;

            if (!key || !uploadUrl || !url) {
                throw new Error("Roadmap image upload failed");
            }

            const putResponse = await fetch(uploadUrl, {
                method: "PUT",
                body: optimizedFile,
                headers: {
                    "Content-Type": optimizedFile.type || "image/jpeg",
                },
            });

            if (!putResponse.ok) {
                throw new Error(`Upload failed with status ${putResponse.status}`);
            }

            setRoadmapImageUrl(url);
            message.success("Roadmap image uploaded successfully");
        } catch (error: any) {
            message.error(error?.message || "Roadmap image upload failed");
        } finally {
            setIsUploadingRoadmapImage(false);
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
                defaultTournament: Boolean(tournamentData.defaultTournament),
                season: tournamentData.season,
                description: tournamentData.description,
                rules: tournamentData.rules,
                venueId: venuesData.content.find(
                    (venue: any) => venue.name === tournamentData.venueName
                )?.id,
                auctionMode: tournamentData.auctionMode || false,
            });
            setRoadmapImageUrl(tournamentData.roadmapImageUrl);
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
                    if (!tournamentId) {
                        setRoadmapImageUrl(undefined);
                    }
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
                        <Form.Item
                            name="auctionMode"
                            label="Auction Mode"
                            valuePropName="checked"
                            extra="Enable if teams will be formed by bidding auction instead of manual selection"
                        >
                            <Switch checkedChildren="Auction" unCheckedChildren="Normal" />
                        </Form.Item>

                        <Form.Item
                            name="defaultTournament"
                            label="Default Tournament"
                            valuePropName="checked"
                        >
                            <Switch checkedChildren="Yes" unCheckedChildren="No" />
                        </Form.Item>

                        <Form.Item
                            name="season"
                            label="Season"
                            extra="Optional. e.g. 'Season 2026' — shown under the title on the Tournament Viewer Home tab."
                        >
                            <Input placeholder="e.g. Season 2026" />
                        </Form.Item>

                        <Form.Item
                            name="description"
                            label="Description / Session Message"
                            extra="Optional. Shown on the Tournament Viewer Home tab below the title."
                        >
                            <Input.TextArea
                                rows={3}
                                placeholder="Enter a short description or session message"
                            />
                        </Form.Item>

                        <Form.Item
                            name="rules"
                            label="Tournament Rules"
                            extra="Optional. Supports Markdown formatting (headings, lists, bold, etc.). If left empty, the Rules tab will be hidden on the viewer page."
                        >
                            <Input.TextArea
                                rows={8}
                                placeholder="Enter tournament rules in Markdown format"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Roadmap Image"
                            extra="Optional. Upload a static roadmap/bracket image. If uploaded, viewers can switch between this image and the live flow chart in the Roadmap tab."
                        >
                            {roadmapImageUrl ? (
                                <Space direction="vertical">
                                    <Image
                                        src={toAbsoluteLogoUrl(roadmapImageUrl)}
                                        alt="Roadmap"
                                        width={200}
                                        style={{ borderRadius: 4 }}
                                    />
                                    <Button
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => setRoadmapImageUrl(undefined)}
                                    >
                                        Remove Image
                                    </Button>
                                </Space>
                            ) : (
                                <Upload
                                    accept="image/png,image/jpeg,image/webp"
                                    showUploadList={false}
                                    beforeUpload={(file) => {
                                        handleUploadRoadmapImage(file);
                                        return false;
                                    }}
                                >
                                    <Button
                                        icon={<UploadOutlined />}
                                        loading={isUploadingRoadmapImage}
                                    >
                                        Upload Roadmap Image
                                    </Button>
                                </Upload>
                            )}
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

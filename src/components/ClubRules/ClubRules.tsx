import {
    Button,
    Modal,
    Form,
    Input,
    Typography,
    message,
    Skeleton,
    Empty,
    Tooltip,
    theme,
} from "antd";
import { useState, CSSProperties } from "react";
import { useSelector } from "react-redux";
import {
    useGetClubRulesQuery,
    useCreateClubRulesMutation,
    useUpdateClubRulesMutation,
    IClubRules,
} from "../../state/features/clubRules/clubRulesSlice";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import Title from "antd/es/typography/Title";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";
import clubRulesCover from "../../assets/club-rules-cover.png";
import "./ClubRules.css";

const { Text } = Typography;

export default function ClubRules() {
    const loginInfo = useSelector(selectLoginInfo);
    const { data: clubRules, refetch, isLoading, isFetching } =
        useGetClubRulesQuery();
    const [createClubRules] = useCreateClubRulesMutation();
    const [updateClubRules] = useUpdateClubRulesMutation();

    const [modalOpen, setModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [isEdit, setIsEdit] = useState(false);
    const [currentRule, setCurrentRule] = useState<IClubRules | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const { token } = theme.useToken();

    const isAdmin =
        loginInfo.roles.includes("ADMIN") ||
        loginInfo.roles.includes("SUPERADMIN");

    const rules = clubRules?.content ?? [];

    // Theme tokens exposed to CSS so the page is correct in dark & light mode.
    const themeVars = {
        "--cr-surface": token.colorBgElevated,
        "--cr-surface-hover": token.colorFillQuaternary,
        "--cr-border": token.colorBorderSecondary,
        "--cr-primary": token.colorPrimary,
        "--cr-primary-bg": token.colorPrimaryBg,
        "--cr-text": token.colorText,
        "--cr-text-secondary": token.colorTextSecondary,
        "--cr-radius": `${token.borderRadiusLG}px`,
    } as CSSProperties;

    const showModal = (rule: IClubRules | null = null) => {
        clearModalField();
        setIsEdit(!!rule);
        setCurrentRule(rule);
        if (rule) {
            form.setFieldsValue({ description: rule.description });
        }
        setModalOpen(true);
    };

    const clearModalField = () => {
        form.resetFields();
        setCurrentRule(null);
    };

    const handleOk = async () => {
        let values;
        try {
            values = await form.validateFields();
        } catch {
            // Form validation errors are shown inline by antd.
            return;
        }

        setSubmitting(true);
        try {
            if (isEdit && currentRule) {
                await updateClubRules({ ...currentRule, ...values }).unwrap();
                message.success("Club rule updated successfully");
            } else {
                await createClubRules(values).unwrap();
                message.success("Club rule created successfully");
            }
            refetch();
            setModalOpen(false);
            clearModalField();
        } catch {
            message.error("Failed to save club rule.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="club-rules-page" style={themeVars}>
            {/* Hero banner */}
            <div className="club-rules-hero">
                <img
                    src={clubRulesCover}
                    alt="Club Rules"
                    className="club-rules-hero-img"
                />
                <div className="club-rules-hero-overlay">
                    <Title level={2} className="club-rules-hero-title">
                        Club Rules
                    </Title>
                    <Text className="club-rules-hero-subtitle">
                        Guidelines every member is expected to follow — on and
                        off the pitch.
                    </Text>
                </div>
            </div>

            <div className="club-rules-wrapper">
                <div className="club-rules-bar">
                    <Text className="club-rules-count">
                        {rules.length}{" "}
                        {rules.length === 1 ? "rule" : "rules"}
                    </Text>
                    {isAdmin && (
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => showModal()}
                            className="club-rules-add-btn"
                        >
                            Add Rule
                        </Button>
                    )}
                </div>

                {isLoading || isFetching ? (
                    <div className="club-rules-grid">
                        {[1, 2, 3, 4].map((i) => (
                            <div className="club-rules-card" key={i}>
                                <Skeleton active title={false} paragraph={{ rows: 2 }} />
                            </div>
                        ))}
                    </div>
                ) : rules.length === 0 ? (
                    <div className="club-rules-empty">
                        <Empty
                            description="No club rules added yet."
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        >
                            {isAdmin && (
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={() => showModal()}
                                >
                                    Add the first rule
                                </Button>
                            )}
                        </Empty>
                    </div>
                ) : (
                    <ol className="club-rules-grid">
                        {rules.map((rule, index) => (
                            <li className="club-rules-card" key={rule.id ?? index}>
                                <span className="club-rules-number">
                                    {index + 1}
                                </span>
                                <Text className="club-rules-text">
                                    {rule.description}
                                </Text>
                                {isAdmin && (
                                    <Tooltip title="Edit rule">
                                        <Button
                                            type="text"
                                            shape="circle"
                                            icon={<EditOutlined />}
                                            onClick={() => showModal(rule)}
                                            className="club-rules-edit"
                                            aria-label="Edit rule"
                                        />
                                    </Tooltip>
                                )}
                            </li>
                        ))}
                    </ol>
                )}
            </div>

            {/* Floating add button (mobile-friendly shortcut) */}
            {isAdmin && (
                <Tooltip title="Add new rule" placement="left">
                    <Button
                        type="primary"
                        shape="circle"
                        icon={<PlusOutlined />}
                        className="club-rules-fab"
                        onClick={() => showModal()}
                        aria-label="Add new rule"
                    />
                </Tooltip>
            )}

            <Modal
                title={isEdit ? "Edit Club Rule" : "Create Club Rule"}
                open={modalOpen}
                onOk={handleOk}
                confirmLoading={submitting}
                onCancel={() => setModalOpen(false)}
                okText={isEdit ? "Update" : "Create"}
                className="club-rules-modal"
                destroyOnClose
                centered
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="description"
                        label="Description"
                        rules={[
                            {
                                required: true,
                                message: "Please enter the rule description",
                            },
                        ]}
                    >
                        <Input.TextArea
                            placeholder="Enter club rule description"
                            autoSize={{ minRows: 3, maxRows: 6 }}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

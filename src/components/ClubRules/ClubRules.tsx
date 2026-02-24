import {
    Button,
    Row,
    Modal,
    Form,
    Input,
    List,
    Typography,
    message,
} from "antd";
import { useState } from "react";
import { useSelector } from "react-redux";
import {
    useGetClubRulesQuery,
    useCreateClubRulesMutation,
    useUpdateClubRulesMutation,
    IClubRules,
} from "../../state/features/clubRules/clubRulesSlice";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import Title from "antd/es/typography/Title";
import { FileTextOutlined } from "@ant-design/icons"; // Adding an icon for each rule
import clubRulesCover from "../../assets/club-rules-cover.png";
import "./ClubRules.css";

const { Text } = Typography;

export default function ClubRules() {
    const loginInfo = useSelector(selectLoginInfo);
    const { data: clubRules, refetch } = useGetClubRulesQuery();
    const [createClubRules, { isSuccess: isCreated, isError: isCreateError }] =
        useCreateClubRulesMutation();
    const [updateClubRules, { isSuccess: isUpdated, isError: isUpdateError }] =
        useUpdateClubRulesMutation();

    const [modalOpen, setModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [isEdit, setIsEdit] = useState(false);
    const [currentRule, setCurrentRule] = useState<IClubRules | null>(null);

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
        try {
            const values = await form.validateFields();
            if (isEdit && currentRule) {
                await updateClubRules({ ...currentRule, ...values });
                if (isCreateError) {
                    message.error("Failed to save club rule.");
                } else {
                    message.success("Club rule updated successfully");
                }
            } else {
                await createClubRules(values);
                if (isCreateError) {
                    message.error("Failed to save club rule.");
                } else {
                    message.success("Club rule created successfully");
                }
            }
            refetch();
            setModalOpen(false);
            clearModalField();
        } catch (error) {
            message.error("Failed to save club rule.");
        }
    };

    return (
        <div className="club-rules-container">
            <img
                src={clubRulesCover}
                alt="Club Rules Cover"
                className="club-rules-cover"
            />

            {(loginInfo.roles.includes("ADMIN") || loginInfo.roles.includes("SUPERADMIN")) && (
                <Button
                    type="primary"
                    className="club-rules-fab"
                    onClick={() => showModal()}
                >
                    +
                </Button>
            )}

            <List
                className="club-rules-list"
                dataSource={clubRules?.content}
                renderItem={(rule) => (
                    <List.Item className="club-rules-item">
                        <div className="club-rules-content">
                            <FileTextOutlined className="club-rules-icon" />
                            <Text className="club-rules-text">{rule.description}</Text>
                        </div>
                        {(loginInfo.roles.includes("ADMIN") || loginInfo.roles.includes("SUPERADMIN")) && (
                            <div className="club-rules-actions">
                                <Button
                                    type="link"
                                    onClick={() => showModal(rule)}
                                    size="small"
                                >
                                    Edit
                                </Button>
                            </div>
                        )}
                    </List.Item>
                )}
            />

            <Modal
                title={isEdit ? "Edit Club Rule" : "Create Club Rule"}
                visible={modalOpen}
                onOk={handleOk}
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
                            rows={4}
                            placeholder="Enter club rule description"
                            autoSize={{ minRows: 3, maxRows: 6 }}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
              
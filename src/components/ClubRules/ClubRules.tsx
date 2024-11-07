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

const { Text } = Typography;

export default function ClubRules() {
    const loginInfo = useSelector(selectLoginInfo);
    const { data: clubRules, refetch } = useGetClubRulesQuery();
    const [createClubRules, { isSuccess: isCreated }] =
        useCreateClubRulesMutation();
    const [updateClubRules, { isSuccess: isUpdated }] =
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
                if (isUpdated) {
                    message.success("Club rule updated successfully");
                }
            } else {
                await createClubRules(values);
                if (isCreated) {
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
        <>
            <img
                src={clubRulesCover}
                alt="Club Rules Cover"
                style={{ width: "100%" }}
            />

            {loginInfo.roles.includes("ADMIN") && (
                <Button
                    type="primary"
                    style={{
                        position: "absolute",
                        bottom: "0px",
                        right: "0px",
                        transform: "translate(-50%, -50%)",
                        height: "60px",
                        width: "60px",
                        borderRadius: "50%",
                        border: "none",
                        color: "white",
                        fontSize: "24px",
                        zIndex: 10,
                        cursor: "pointer",
                    }}
                    onClick={() => showModal()}
                >
                    +
                </Button>
            )}

            <List
                style={{ marginBottom: "80px", marginTop: "10px" }}
                dataSource={clubRules?.content}
                renderItem={(rule) => (
                    <List.Item
                        style={{
                            padding: "12px",
                            marginBottom: "12px",
                            display: "flex",
                        }}
                        actions={
                            loginInfo.roles.includes("ADMIN")
                                ? [
                                      <Button
                                          type="link"
                                          onClick={() => showModal(rule)}
                                      >
                                          Edit
                                      </Button>,
                                  ]
                                : []
                        }
                    >
                        <Row
                            style={{
                                display: "flex",
                                gap: "10px",
                            }}
                        >
                            <FileTextOutlined
                                style={{
                                    color: "#1890ff",
                                }}
                            />
                            <Text>{rule.description}</Text>
                        </Row>
                    </List.Item>
                )}
            />

            <Modal
                title={isEdit ? "Edit Club Rule" : "Create Club Rule"}
                visible={modalOpen}
                onOk={handleOk}
                onCancel={() => setModalOpen(false)}
                okText={isEdit ? "Update" : "Create"}
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
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
}

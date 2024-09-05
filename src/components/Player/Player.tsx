import {
    Button,
    Card,
    Col,
    Form,
    Input,
    InputNumber,
    Row,
    Select,
    Space,
    Spin,
    message,
    notification,
} from "antd";
import axios from "axios";

import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { MailOutlined } from "@ant-design/icons";
import IFootballPosition from "../../interfaces/IFootballPosition";
import { API_URL } from "../../settings";
import { checkTockenValidity } from "../../utils/utils";

function Player() {
    const navigate = useNavigate();
    const [notificationApi, contextHolder] = notification.useNotification();
    //   const [notificationApi, contextHolder] = notification.useNotification();

    const [footballPositions, setFootballPositions] = useState<
        IFootballPosition[]
    >([]);
    var [formState, setFormState] = useState("CREATE");
    const [formSubmitButtonText, setFormSubmitButtonText] = useState("Create");
    const [playerLoading, setPlayerLoading] = React.useState<boolean>(false);
    const [playerForm] = Form.useForm();

    const tokenContent = localStorage.getItem("tokenContent");

    if (!tokenContent || !checkTockenValidity(tokenContent)) {
        navigate("/login");
    }

    function getTokenFromLocalStorage(tokenContent: string | null) {
        if (tokenContent) {
            const contentData = JSON.parse(tokenContent);
            return contentData.token;
        }

        return null;
    }

    const onResetPlayerForm = () => {
        playerForm.resetFields();
    };

    let { id } = useParams();

    const onFinishPlayerForm = (values: any) => {
        const playerData = {
            name: playerForm.getFieldValue("name"),
            email: playerForm.getFieldValue("email"),
            employeeId: playerForm.getFieldValue("employeeId"),
            skypeId: playerForm.getFieldValue("skypeId"),
            mobileNo: playerForm.getFieldValue("mobileNo"),
            password: playerForm.getFieldValue("name") + "@123",
            playingPosition:
                playerForm.getFieldValue("playingPosition") || "UNASSIGNED", // Default to avoid undefined
        };

        if (!id) {
            axios
                .post(`${API_URL}/players`, playerData, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${getTokenFromLocalStorage(
                            tokenContent
                        )}`,
                    },
                })
                .then((response) => {
                    message.success(response.data.message);
                    navigate("/players");
                })
                .catch((err) => {
                    console.error("Server error:", err);
                    notificationApi.error({
                        message: "Error creating player",
                        description: err.message,
                    });
                });
        } else {
            axios
                .put(`${API_URL}/players/${id}`, playerData, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${getTokenFromLocalStorage(
                            tokenContent
                        )}`,
                    },
                })
                .then((response) => {
                    // Call to update the player's active status
                    axios
                        .put(
                            `${API_URL}/players/${id}/status?active=${values.active}`,
                            {},
                            {
                                headers: {
                                    Authorization: `Bearer ${getTokenFromLocalStorage(
                                        tokenContent
                                    )}`,
                                },
                            }
                        )
                        .then((statusResponse) => {
                            console.log(
                                "Player status updated successfully:",
                                statusResponse.data
                            );
                            message.success(response.data.message);
                            navigate("/players");
                        })
                        .catch((statusError) => {
                            console.error(
                                "Error updating player status:",
                                statusError
                            );
                            notificationApi.error({
                                message: "Error updating player status",
                                description: statusError.message,
                            });
                        });
                })
                .catch((err) => {
                    console.error("Server error:", err);
                    notificationApi.error({
                        message: "Error updating player",
                        description: err.message,
                    });
                });
        }
    };

    const getPlayer = () => {
        setPlayerLoading(true);
        axios
            .get(`${API_URL}/players/${id}`, {
                headers: {
                    Authorization: `Bearer ${getTokenFromLocalStorage(
                        tokenContent
                    )}`,
                },
            })
            .then((response) => {
                playerForm.setFieldsValue({
                    name: response.data.content.name,
                    email: response.data.content.email,
                    skypeId: response.data.content.skypeId,
                    mobileNo: response.data.content.mobileNo,
                    employeeId: response.data.content.employeeId,
                    active: response.data.content.active,
                    playingPosition: response.data.content.playingPosition,
                });
                setPlayerLoading(false);
                setFormSubmitButtonText("Change");
            })
            .catch((err) => {
                // Handle error
                console.log("server error");
                setPlayerLoading(false);
            });
    };

    const getFootballPositions = () => {
        // setPlayerLoading(true);
        axios
            .get(`${API_URL}/football-positions`)
            .then((response) => {
                setFootballPositions(response.data.content);
                // setPlayerLoading(false);
            })
            .catch((err) => {
                // Handle error
                console.log("server error");
                // setPlayerLoading(false);
            });
    };

    const onResetProjectForm = () => {
        playerForm.resetFields();
    };

    useEffect(() => {
        onResetProjectForm();
        getFootballPositions();
        if (id) {
            getPlayer();
            setFormState("UPDATE");
        }
        return () => {};
    }, [id]);

    const requiredFieldRule = (label: String) => ({
        required: true,
        message: `Please input your ${label}!`,
    });

    return (
        <>
            {contextHolder}
            <Form
                layout="vertical"
                name="realEstateConfigForm"
                form={playerForm}
                initialValues={{ remember: 1 }}
                autoComplete="off"
                onFinish={onFinishPlayerForm}
            >
                <Row gutter={10}>
                    <Col span={24}>
                        <Card title="Player Information" bordered={true}>
                            <Spin spinning={playerLoading}>
                                <Row gutter={10}>
                                    <Col md={12} lg={8}>
                                        <Form.Item
                                            name="name"
                                            label="Name"
                                            rules={[requiredFieldRule("Name")]}
                                        >
                                            <Input placeholder="Name" />
                                        </Form.Item>
                                    </Col>
                                    <Col md={12} lg={8}>
                                        <Form.Item
                                            name="email"
                                            label="Email"
                                            rules={[
                                                {
                                                    type: "email",
                                                    message:
                                                        "The input is not a valid email!",
                                                },
                                                requiredFieldRule("Email"),
                                            ]}
                                        >
                                            <Input
                                                prefix={<MailOutlined />}
                                                placeholder="Email"
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col md={12} lg={8}>
                                        <Form.Item
                                            name="employeeId"
                                            label="Employee Id"
                                            rules={[
                                                requiredFieldRule(
                                                    "Employee Id"
                                                ),
                                            ]}
                                        >
                                            <InputNumber
                                                style={{ width: "100%" }}
                                                placeholder="Employee Id"
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col md={12} lg={8}>
                                        <Form.Item
                                            name="skypeId"
                                            label="Skype Id"
                                            rules={[
                                                requiredFieldRule("Skype Id"),
                                            ]}
                                        >
                                            <Input placeholder="Skype Id" />
                                        </Form.Item>
                                    </Col>
                                    <Col md={12} lg={8}>
                                        <Form.Item
                                            name="mobileNo"
                                            label="Mobile No"
                                        >
                                            <Input placeholder="Mobile No" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item
                                            name="playingPosition"
                                            label="Playing Position"
                                            rules={[
                                                requiredFieldRule(
                                                    "Playing Position"
                                                ),
                                            ]}
                                            initialValue={"UNASSIGNED"}
                                        >
                                            <Select placeholder="Select a position">
                                                {/* {Object.keys(FootballPosition).map((key) => (
                          <Select.Option key={key} value={FootballPosition[key as keyof typeof FootballPosition]}>
                            {FootballPosition[key as keyof typeof FootballPosition]}
                          </Select.Option>
                        ))} */}
                                                {footballPositions.map(
                                                    (position) => (
                                                        <Select.Option
                                                            key={position.name}
                                                            value={
                                                                position.name
                                                            }
                                                        >
                                                            {
                                                                position.description
                                                            }
                                                        </Select.Option>
                                                    )
                                                )}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    {formState === "UPDATE" && (
                                        <Col span={8}>
                                            <Form.Item
                                                name="active"
                                                label="Active Status"
                                                rules={[
                                                    requiredFieldRule(
                                                        "Active Status"
                                                    ),
                                                ]}
                                                initialValue={false}
                                            >
                                                <Select
                                                    options={[
                                                        {
                                                            value: true,
                                                            label: "Active",
                                                        },
                                                        {
                                                            value: false,
                                                            label: "InActive",
                                                        },
                                                    ]}
                                                />
                                            </Form.Item>
                                        </Col>
                                    )}
                                </Row>
                                <Row>
                                    <Col>
                                        <Form.Item>
                                            <Space>
                                                <Button
                                                    type="primary"
                                                    htmlType="submit"
                                                >
                                                    {formSubmitButtonText}
                                                </Button>
                                                {!id && (
                                                    <Button
                                                        htmlType="button"
                                                        onClick={
                                                            onResetPlayerForm
                                                        }
                                                    >
                                                        Reset
                                                    </Button>
                                                )}

                                                <Link
                                                    className="text-decoration-none"
                                                    to={"/players"}
                                                >
                                                    {" "}
                                                    Cancel
                                                </Link>
                                            </Space>
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Spin>
                        </Card>
                    </Col>
                </Row>
            </Form>
        </>
    );
}

export default Player;

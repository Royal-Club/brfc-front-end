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

import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { MailOutlined } from "@ant-design/icons";
import IFootballPosition from "../../interfaces/IFootballPosition";
import { API_URL, COMMON_PLAYER_PASSWORD } from "../../settings";
import { checkTockenValidity } from "../../utils/utils";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import axiosApi from "../../state/api/axiosBase";

function Player() {
    const loginInfo = useSelector(selectLoginInfo);
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
            password: COMMON_PLAYER_PASSWORD,
            playingPosition:
                playerForm.getFieldValue("playingPosition") || "UNASSIGNED", // Default to avoid undefined
        };

        if (!id) {
            axiosApi
                .post(`${API_URL}/players`, playerData)
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
            axiosApi
                .put(`${API_URL}/players/${id}`, playerData)
                .then((response) => {
                    // Call to update the player's active status
                    axiosApi
                        .put(
                            `${API_URL}/players/${id}/status?active=${values.active}`,
                            {}
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
        axiosApi
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
                console.log("server error");
                setPlayerLoading(false);
            });
    };

    const getFootballPositions = () => {
        // setPlayerLoading(true);
        axiosApi
            .get(`${API_URL}/football-positions`)
            .then((response) => {
                setFootballPositions(response.data.content);
            })
            .catch((err) => {
                console.log("server error");
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
                                    {loginInfo.roles.includes("ADMIN") &&
                                        formState === "UPDATE" && (
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
                                {loginInfo.roles.includes("ADMIN") && (
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
                                )}
                            </Spin>
                        </Card>
                    </Col>
                </Row>
            </Form>
        </>
    );
}

export default Player;

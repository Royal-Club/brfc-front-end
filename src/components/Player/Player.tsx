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
    Breadcrumb,
    Divider,
    Typography,
    Upload,
    Avatar
} from "antd";

import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
    MailOutlined,
    UserOutlined,
    IdcardOutlined,
    SkypeOutlined,
    PhoneOutlined,
    EnvironmentOutlined,
    HomeFilled,
    TeamOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    CameraOutlined,
    LoadingOutlined
} from "@ant-design/icons";
import IFootballPosition from "../../interfaces/IFootballPosition";
import { API_URL, COMMON_PLAYER_PASSWORD } from "../../settings";
import { checkTockenValidity } from "../../utils/utils";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import axiosApi from "../../state/api/axiosBase";
import { usePresignPlayerPhotoUploadMutation } from "../../state/features/player/playerSlice";
import { validatePlayerPhoto, compressPlayerPhoto, toAbsolutePlayerPhotoUrl } from "../../utils/playerPhotoUtils";
import { normalizeErrorMessage } from "../../utils/normalizeErrorMessage";

const { Title } = Typography;

function Player() {
    const loginInfo = useSelector(selectLoginInfo);
    const navigate = useNavigate();
    const [notificationApi, contextHolder] = message.useMessage();

    const [footballPositions, setFootballPositions] = useState<
        IFootballPosition[]
    >([]);
    var [formState, setFormState] = useState("CREATE");
    const [formSubmitButtonText, setFormSubmitButtonText] = useState("Create");
    const [playerLoading, setPlayerLoading] = React.useState<boolean>(false);
    const [playerForm] = Form.useForm();
    const [presignPlayerPhoto] = usePresignPlayerPhotoUploadMutation();
    const [photoKey, setPhotoKey] = useState<string | null>(null);
    const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
    const [photoUploading, setPhotoUploading] = useState(false);

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
                playerForm.getFieldValue("playingPosition") || "UNASSIGNED",
            photoKey: photoKey || undefined,
        };

        if (!id) {
            axiosApi
                .post(`${API_URL}/players`, playerData)
                .then((response) => {
                    message.success(response.data.message);
                    navigate("/players");
                })
                .catch((err: any) => {
                    message.error(
                        normalizeErrorMessage(
                            err?.response?.data || err,
                            "Error creating player"
                        )
                    );
                });
                // .catch((err) => {
                //     console.error("Server error:", err);
                //     notificationApi.error({
                //         message: "Error creating player",
                //         description: err.message,
                //     });
                // });
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
                        .catch((statusError: any) => {
                            message.error(
                                normalizeErrorMessage(
                                    statusError?.response?.data || statusError,
                                    "Error updating player status"
                                )
                            );
                        });
                        // .catch((statusError) => {
                        //     console.error(
                        //         "Error updating player status:",
                        //         statusError
                        //     );
                        //     notificationApi.error({
                        //         message: "Error updating player status",
                        //         description: statusError.message,
                        //     });
                        // });
                })
                .catch((err: any) => {
                    message.error(
                        normalizeErrorMessage(
                            err?.response?.data || err,
                            "Error updating player"
                        )
                    );
                });
                // .catch((err) => {
                //     console.error("Server error:", err);
                //     notificationApi.error({
                //         message: "Error updating player",
                //         description: err.message,
                //     });
                // });
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
                if (response.data.content.photoKey) {
                    setPhotoKey(response.data.content.photoKey);
                    setPhotoPreviewUrl(toAbsolutePlayerPhotoUrl(response.data.content.photoUrl) || null);
                }
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
            <div className="page-container" style={{ maxWidth: '100%', overflow: 'hidden' }}>
                <Breadcrumb 
                    style={{ marginBottom: 16 }}
                    items={[
                        { 
                            title: <Link to="/"><HomeFilled /></Link> 
                        },
                        { 
                            title: <Link to="/players"><TeamOutlined /> Players</Link> 
                        },
                        { 
                            title: id ? 'Edit Player' : 'New Player' 
                        }
                    ]}
                />
                
                <Title level={2} style={{ marginBottom: 24 }}>
                    {id ? 'Edit Player Information' : 'Create New Player'}
                </Title>
                
                <Form
                    layout="vertical"
                    name="realEstateConfigForm"
                    form={playerForm}
                    initialValues={{ remember: 1 }}
                    autoComplete="off"
                    onFinish={onFinishPlayerForm}
                    style={{ width: '100%' }}
                >
                    <Row gutter={[16, 16]} style={{ margin: 0 }}>
                        <Col xs={24}>
                            <Card 
                                title={<div style={{ display: 'flex', alignItems: 'center' }}>
                                    <TeamOutlined style={{ marginRight: 8, fontSize: '18px' }} />
                                    <span>Player Information</span>
                                </div>}
                                bordered={true}
                                style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}
                            >
                                <Spin spinning={playerLoading}>
                                    <Row gutter={[16, 16]}>
                                        {/* Photo upload section */}
                                        <Col xs={24} style={{ marginBottom: 8 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                                <Avatar
                                                    size={80}
                                                    src={photoPreviewUrl || undefined}
                                                    icon={!photoPreviewUrl ? <UserOutlined /> : undefined}
                                                    style={{ border: "2px solid #d9d9d9", flexShrink: 0 }}
                                                />
                                                <Upload
                                                    accept="image/jpeg,image/png,image/webp"
                                                    showUploadList={false}
                                                    beforeUpload={async (file) => {
                                                        const error = validatePlayerPhoto(file);
                                                        if (error) { message.error(error); return false; }
                                                        setPhotoUploading(true);
                                                        try {
                                                            const compressed = await compressPlayerPhoto(file);
                                                            const contentType = file.type === "image/png" ? "image/png" : "image/jpeg";
                                                            const ext = contentType === "image/png" ? ".png" : ".jpg";
                                                            const fileName = file.name.replace(/\.[^.]+$/, ext);
                                                            const res = await presignPlayerPhoto({ fileName, contentType }).unwrap();
                                                            const { key, uploadUrl } = res.content;
                                                            const uploadResp = await fetch(uploadUrl, {
                                                                method: "PUT",
                                                                headers: { "Content-Type": contentType },
                                                                body: compressed,
                                                            });
                                                            if (!uploadResp.ok) throw new Error("Upload failed");
                                                            setPhotoKey(key);
                                                            setPhotoPreviewUrl(URL.createObjectURL(compressed));
                                                            message.success("Photo uploaded");
                                                        } catch (err: any) {
                                                            message.error(err?.message || "Photo upload failed");
                                                        } finally {
                                                            setPhotoUploading(false);
                                                        }
                                                        return false;
                                                    }}
                                                >
                                                    <Button
                                                        icon={photoUploading ? <LoadingOutlined /> : <CameraOutlined />}
                                                        disabled={photoUploading}
                                                    >
                                                        {photoPreviewUrl ? "Change Photo" : "Upload Photo"}
                                                    </Button>
                                                </Upload>
                                                {photoPreviewUrl && (
                                                    <Button
                                                        size="small"
                                                        danger
                                                        onClick={() => { setPhotoKey(null); setPhotoPreviewUrl(null); }}
                                                    >
                                                        Remove
                                                    </Button>
                                                )}
                                            </div>
                                        </Col>
                                        <Col md={12} lg={8}>
                                            <Form.Item
                                                name="name"
                                                label="Name"
                                                rules={[requiredFieldRule("Name")]}
                                            >
                                                <Input 
                                                    prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} 
                                                    placeholder="Player's full name" 
                                                    size="middle"
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col md={12} lg={8}>
                                            <Form.Item
                                                name="email"
                                                label="Email"
                                                rules={[
                                                    {
                                                        type: "email",
                                                        message: "The input is not a valid email!",
                                                    },
                                                    requiredFieldRule("Email"),
                                                ]}
                                            >
                                                <Input
                                                    prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
                                                    placeholder="Email address"
                                                    size="large"
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col md={12} lg={8}>
                                            <Form.Item
                                                name="employeeId"
                                                label="Employee ID"
                                                rules={[requiredFieldRule("Employee Id")]}
                                            >
                                                <InputNumber
                                                    style={{ width: "100%" }}
                                                    placeholder="Employee ID number"
                                                    size="large"
                                                    prefix={<IdcardOutlined style={{ color: '#bfbfbf' }} />}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col md={12} lg={8}>
                                            <Form.Item
                                                name="skypeId"
                                                label="Skype ID"
                                                rules={[requiredFieldRule("Skype Id")]}
                                            >
                                                <Input 
                                                    prefix={<SkypeOutlined style={{ color: '#bfbfbf' }} />} 
                                                    placeholder="Skype username" 
                                                    size="large"
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col md={12} lg={8}>
                                            <Form.Item
                                                name="mobileNo"
                                                label="Mobile Number"
                                            >
                                                <Input 
                                                    prefix={<PhoneOutlined style={{ color: '#bfbfbf' }} />} 
                                                    placeholder="Contact phone number" 
                                                    size="large"
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col md={12} lg={8}>
                                            <Form.Item
                                                name="playingPosition"
                                                label="Playing Position"
                                                rules={[requiredFieldRule("Playing Position")]}
                                                initialValue={"UNASSIGNED"}
                                            >
                                                <Select 
                                                    placeholder="Select a position"
                                                    size="large"
                                                    suffixIcon={<EnvironmentOutlined />}
                                                >
                                                    {footballPositions.map(
                                                        (position) => (
                                                            <Select.Option
                                                                key={position.name}
                                                                value={position.name}
                                                            >
                                                                {position.description}
                                                            </Select.Option>
                                                        )
                                                    )}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                        {(loginInfo.roles.includes("ADMIN") || loginInfo.roles.includes("SUPERADMIN")) &&
                                            formState === "UPDATE" && (
                                                <Col md={12} lg={8}>
                                                    <Form.Item
                                                        name="active"
                                                        label="Status"
                                                        rules={[requiredFieldRule("Active Status")]}
                                                        initialValue={false}
                                                    >
                                                        <Select
                                                            size="large"
                                                            options={[
                                                                {
                                                                    value: true,
                                                                    label: (
                                                                        <span>
                                                                            <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} /> 
                                                                            Active
                                                                        </span>
                                                                    ),
                                                                },
                                                                {
                                                                    value: false,
                                                                    label: (
                                                                        <span>
                                                                            <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} /> 
                                                                            Inactive
                                                                        </span>
                                                                    ),
                                                                },
                                                            ]}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                            )}
                                    </Row>
                                    
                                    {(loginInfo.roles.includes("ADMIN") || loginInfo.roles.includes("SUPERADMIN")) && (
                                        <>
                                            <Divider />
                                            <Row>
                                                <Col>
                                                    <Form.Item style={{ marginBottom: 0 }}>
                                                        <Space size="middle" wrap>
                                                            <Button
                                                                type="primary"
                                                                htmlType="submit"
                                                                size="large"
                                                                style={{ minWidth: 120 }}
                                                            >
                                                                {formSubmitButtonText}
                                                            </Button>
                                                            {!id && (
                                                                <Button
                                                                    htmlType="button"
                                                                    onClick={onResetPlayerForm}
                                                                    size="large"
                                                                    style={{ minWidth: 100 }}
                                                                >
                                                                    Reset
                                                                </Button>
                                                            )}

                                                            <Link
                                                                to={"/players"}
                                                            >
                                                                <Button 
                                                                    type="default"
                                                                    size="large"
                                                                    style={{ minWidth: 100 }}
                                                                >
                                                                    Cancel
                                                                </Button>
                                                            </Link>
                                                        </Space>
                                                    </Form.Item>
                                                </Col>
                                            </Row>
                                        </>
                                    )}
                                </Spin>
                            </Card>
                        </Col>
                    </Row>
                </Form>
            </div>
        </>
    );
}

export default Player;

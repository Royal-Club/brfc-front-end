import React, { useState, useEffect } from "react";
import { Button, Form, Input, message, Space, Spin } from "antd";
import {
    EyeInvisibleOutlined,
    EyeOutlined,
    LockOutlined,
    LogoutOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setResetPassword, removeUser, selectUserEmail, selectUserName } from "../../state/slices/loginInfoSlice";
import { useResetPlayerPasswordMutation } from "../../state/features/auth/authSlice";
import colors from "../../utils/colors";
import logo from "../../assets/logo.png";

const PasswordResetPage: React.FC = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [backgroundLoaded, setBackgroundLoaded] = useState(false);
    const [resetPassword] = useResetPlayerPasswordMutation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const userEmail = useSelector(selectUserEmail);
    const userName = useSelector(selectUserName);

    // Lazy load background image (same as login page)
    useEffect(() => {
        const img = new Image();
        img.onload = () => {
            document.documentElement.style.setProperty('--login-bg-image', `url(${process.env.PUBLIC_URL}/loginBackground.png)`);
            setBackgroundLoaded(true);
        };
        img.src = `${process.env.PUBLIC_URL}/loginBackground.png`;
    }, []);

    const validatePasswordStrength = (password: string): boolean => {
        // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        return passwordRegex.test(password);
    };

    const handleSubmit = async (values: { newPassword: string; confirmPassword: string }) => {
        if (!userEmail) {
            message.error("User email not found. Please login again.");
            return;
        }

        if (values.newPassword !== values.confirmPassword) {
            message.error("Passwords do not match!");
            return;
        }

        if (!validatePasswordStrength(values.newPassword)) {
            message.error(
                "Password must be at least 8 characters and contain uppercase, lowercase, and numbers"
            );
            return;
        }

        setLoading(true);

        try {
            await resetPassword({
                email: userEmail,
                newPassword: values.newPassword,
            }).unwrap();

            message.success("Password reset successfully! Logging you out...");
            dispatch(removeUser());
            dispatch(setResetPassword(false));
            navigate("/login", { replace: true });
        } catch (error: any) {
            console.error(error);
            message.error(
                error?.data?.message || "Failed to reset password. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        dispatch(removeUser());
        navigate("/login", { replace: true });
    };

    return (
        <div className={`password-reset-page-wrapper ${backgroundLoaded ? 'bg-loaded' : ''}`}>
            <div className="password-reset-container">
                <div className="password-reset-card">
                    <div className="password-reset-left-section">
                        <img
                            className="password-reset-logo"
                            src={logo}
                            alt="BRFC Logo"
                        />
                        <h1 className="password-reset-title">Reset Password</h1>
                        <p className="password-reset-description">
                            For security reasons, you must reset your password before
                            accessing the dashboard.
                        </p>
                        <div className="password-reset-user-info">
                            {userName && (
                                <div className="user-info-column">
                                    <span className="user-info-label">Username</span>
                                    <span className="user-info-value">{userName}</span>
                                </div>
                            )}
                            {userEmail && (
                                <div className="user-info-column">
                                    <span className="user-info-label">Email</span>
                                    <span className="user-info-value">{userEmail}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="password-reset-right-section">
                        <Spin spinning={loading} tip="Resetting password...">
                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={handleSubmit}
                                autoComplete="off"
                            >
                            <Form.Item
                                name="newPassword"
                                label={
                                    <span style={{ color: colors.grayDark }}>
                                        <LockOutlined style={{ marginRight: 8 }} />
                                        New Password
                                    </span>
                                }
                                rules={[
                                    {
                                        required: true,
                                        message: "Please enter a new password!",
                                    },
                                    {
                                        min: 8,
                                        message:
                                            "Password must be at least 8 characters long",
                                    },
                                ]}
                            >
                                <Input.Password
                                    placeholder="Enter new password"
                                    iconRender={(visible) =>
                                        visible ? (
                                            <EyeOutlined />
                                        ) : (
                                            <EyeInvisibleOutlined />
                                        )
                                    }
                                    className="password-reset-input"
                                />
                            </Form.Item>

                            <Form.Item
                                name="confirmPassword"
                                label={
                                    <span style={{ color: colors.grayDark }}>
                                        <LockOutlined style={{ marginRight: 8 }} />
                                        Confirm Password
                                    </span>
                                }
                                rules={[
                                    {
                                        required: true,
                                        message: "Please confirm your password!",
                                    },
                                ]}
                            >
                                <Input.Password
                                    placeholder="Confirm your password"
                                    iconRender={(visible) =>
                                        visible ? (
                                            <EyeOutlined />
                                        ) : (
                                            <EyeInvisibleOutlined />
                                        )
                                    }
                                    className="password-reset-input"
                                />
                            </Form.Item>

                            <div className="password-requirements">
                                <p style={{ color: colors.grayDark }}>
                                    <strong>Password Requirements:</strong>
                                </p>
                                <ul style={{ color: colors.grayDark, fontSize: "12px" }}>
                                    <li>At least 8 characters</li>
                                    <li>At least one uppercase letter (A-Z)</li>
                                    <li>At least one lowercase letter (a-z)</li>
                                    <li>At least one number (0-9)</li>
                                </ul>
                            </div>

                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={loading}
                                    block
                                    className="password-reset-btn"
                                    size="large"
                                >
                                    Reset Password
                                </Button>
                            </Form.Item>

                            <Space style={{ width: "100%", justifyContent: "center", gap: "8px" }}>
                                <Button
                                    type="default"
                                    danger
                                    icon={<LogoutOutlined />}
                                    onClick={handleLogout}
                                    disabled={loading}
                                    className="logout-btn"
                                >
                                    Logout
                                </Button>
                            </Space>
                            </Form>
                        </Spin>
                    </div>
                </div>
            </div>

            <style>{`
                .password-reset-page-wrapper {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    background: linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%);
                    padding: 20px;
                    position: relative;
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                    transition: background-image 0.5s ease-in-out;
                }

                .password-reset-page-wrapper.bg-loaded {
                    background-image: var(--login-bg-image), linear-gradient(135deg, rgba(15, 32, 39, 0.8) 0%, rgba(32, 58, 67, 0.8) 50%, rgba(44, 83, 100, 0.8) 100%);
                    background-blend-mode: overlay;
                }

                .password-reset-container {
                    width: 100%;
                    max-width: 850px;
                }

                .password-reset-card {
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 40px;
                    overflow: hidden;
                }

                .password-reset-left-section {
                    padding: 50px 40px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    align-items: center;
                    background: linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%);
                    min-height: 500px;
                }

                .password-reset-right-section {
                    padding: 40px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }

                .password-reset-header {
                    margin-bottom: 0;
                    text-align: center;
                    width: 100%;
                }

                .password-reset-logo {
                    max-width: 120px;
                    height: auto;
                    margin-bottom: 20px;
                    display: block;
                    margin-left: auto;
                    margin-right: auto;
                }

                .password-reset-title {
                    font-size: 28px;
                    font-weight: 600;
                    margin: 0 0 15px 0;
                    color: #1f1f1f;
                }

                .password-reset-user-info {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    padding: 15px;
                    background-color: #f9f9f9;
                    border-radius: 6px;
                    margin-top: auto;
                    width: 100%;
                }

                .user-info-column {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }

                .user-info-label {
                    font-size: 12px;
                    font-weight: 600;
                    color: #999;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .user-info-value {
                    font-size: 15px;
                    font-weight: 500;
                    color: #1f1f1f;
                    word-break: break-word;
                }

                .password-reset-description {
                    color: #666;
                    font-size: 14px;
                    margin: 15px 0 0 0;
                    line-height: 1.6;
                    text-align: center;
                }

                .password-reset-input {
                    height: 40px;
                    font-size: 14px;
                    border-radius: 4px;
                }

                .password-requirements {
                    background: #f5f5f5;
                    padding: 15px;
                    border-radius: 4px;
                    margin-bottom: 20px;
                }

                .password-requirements p {
                    margin: 0 0 10px 0;
                    font-size: 13px;
                }

                .password-requirements ul {
                    margin: 0;
                    padding-left: 20px;
                }

                .password-requirements li {
                    margin: 5px 0;
                }

                .password-reset-btn {
                    height: 40px;
                    font-size: 16px;
                    font-weight: 500;
                    margin-bottom: 20px;
                }

                .logout-btn {
                    border-color: #ff4d4f;
                    color: #ff4d4f;
                }

                .logout-btn:hover {
                    background-color: #fff1f0;
                }

                @media (max-width: 768px) {
                    .password-reset-card {
                        grid-template-columns: 1fr;
                        gap: 0;
                    }

                    .password-reset-left-section {
                        display: none;
                    }

                    .password-reset-container {
                        max-width: 450px;
                    }
                }

                @media (max-width: 480px) {
                    .password-reset-card {
                        border-radius: 4px;
                    }

                    .password-reset-right-section {
                        padding: 20px;
                    }

                    .password-reset-title {
                        font-size: 24px;
                    }

                    .password-reset-logo {
                        max-width: 100px;
                    }

                    .password-reset-user-info {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
};

export default PasswordResetPage;

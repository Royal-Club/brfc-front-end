import React, { useState } from "react";
import { Button, Form, Input } from "antd";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setAccessToken } from "../../state/slices/loginInfoSlice";

const LoginPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const onFinish = (values: any) => {
        setLoading(true);
        // Simulate login API call
        setTimeout(() => {
            // Normally, you would get the token from the API response
            const accessToken = "fake-access-token";
            localStorage.setItem("accessToken", accessToken);
            dispatch(setAccessToken(accessToken));
            setLoading(false);
            navigate("/");
        }, 1000);
    };

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "89vh",
            }}
        >
            <Form
                onFinish={onFinish}
                style={{ maxWidth: 300, width: "100%", height: "100%" }}
            >
                <Form.Item
                    name="username"
                    rules={[
                        {
                            required: true,
                            message: "Please input your username!",
                        },
                    ]}
                >
                    <Input placeholder="Username" />
                </Form.Item>
                <Form.Item
                    name="password"
                    rules={[
                        {
                            required: true,
                            message: "Please input your password!",
                        },
                    ]}
                >
                    <Input.Password placeholder="Password" />
                </Form.Item>
                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        block
                    >
                        Log in
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};

export default LoginPage;

import React, { useState } from "react";
import { Button, Form, Input } from "antd";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setAllData } from "../../state/slices/loginInfoSlice";
import { useLoginMutation } from "../../state/features/auth/authSlice";

const LoginPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [login] = useLoginMutation();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const onFinish = async (values: any) => {
        setLoading(true);

        try {
            const response = await login({
                email: values.email,
                password: values.password,
            }).unwrap();
            const content = response.content;
            dispatch(setAllData(content));

            localStorage.setItem("tokenContent", JSON.stringify(content));

            setLoading(false);
            navigate("/");
        } catch (error) {
            console.log(error);
            setLoading(false);
        }
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
                    name="email"
                    rules={[
                        {
                            required: true,
                            message: "Please input your email!",
                        },
                    ]}
                >
                    <Input
                        placeholder="Enter Email"
                        prefix={
                            <i
                                className="fa fa-envelope"
                                aria-hidden="true"
                            ></i>
                        }
                        type="email"
                    />
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

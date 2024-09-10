import React, { useState } from "react";
import { Button, Form, Input, message, theme } from "antd";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setAllData, setImage } from "../../state/slices/loginInfoSlice";
import { useLoginMutation } from "../../state/features/auth/authSlice";
import colors from "../../utils/colors";

const LoginPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [login] = useLoginMutation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const {
        token: { colorBgContainer },
      } = theme.useToken();
    

    const onFinish = async (values: any) => {
        setLoading(true);

        try {
            const response = await login({
                email: values.email,
                password: values.password,
            }).unwrap();
            const content = response.content;
            dispatch(setAllData(content));
            dispatch(
                setImage(
                    "https://giftolexia.com/wp-content/uploads/2015/11/dummy-profile.png"
                )
            );

            localStorage.setItem("tokenContent", JSON.stringify(content));

            setLoading(false);
            navigate("/");
        } catch (error: any) {
            message.error(error?.data?.message || "Something went wrong");
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "100vh",
            }}
            className="svg_background"
        >
            <Form
                onFinish={onFinish}
                style={{
                    maxWidth: 400,
                    width: "100%",
                    padding: "32px 24px",
                    borderRadius: "8px",
                    background: colorBgContainer,
                    boxShadow: "0px 0px 15px rgba(0, 0, 0, 0.1)",
                }}
            >
                <div style={{ textAlign: "center", marginBottom: 32 }}>
                    <img
                        style={{ maxWidth: "250px" }}
                        src={require("../../assets/logo.png")}
                        alt="royal club football logo"
                    />
                </div>

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
                                style={{ color: colors.grayMedium }}
                            ></i>
                        }
                        type="email"
                        style={{
                            borderRadius: "4px",
                            padding: "10px 12px",
                        }}
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
                    <Input.Password
                        placeholder="Password"
                        style={{
                            borderRadius: "4px",
                            padding: "10px 12px",
                        }}
                    />
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

import React, { useState } from "react";
import { Button } from "antd";
import { EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setAllData, setImage } from "../../state/slices/loginInfoSlice";
import { useLoginMutation } from "../../state/features/auth/authSlice";
import colors from "../../utils/colors";

const LoginPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [loginData, setLoginData] = useState({ email: "", password: "" });
    const [errors, setErrors] = useState({ email: "", password: "" });
    const [passwordVisible, setPasswordVisible] = useState(false); // state for password visibility
    const [login] = useLoginMutation();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLoginData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" })); // reset error for the field
    };

    // Validate email format using regex
    const validateEmail = (email: string) => {
        const emailRegex =
            /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
        return emailRegex.test(email);
    };

    const validateForm = () => {
        let valid = true;
        const newErrors = { email: "", password: "" };

        if (!loginData.email) {
            newErrors.email = "Please input your email!";
            valid = false;
        } else if (!validateEmail(loginData.email)) {
            newErrors.email = "Please enter a valid email!";
            valid = false;
        }

        if (!loginData.password) {
            newErrors.password = "Please input your password!";
            valid = false;
        }

        setErrors(newErrors);
        return valid;
    };

    const onFinish = async () => {
        if (!validateForm()) return;

        setLoading(true);

        try {
            const response = await login({
                email: loginData.email,
                password: loginData.password,
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
            console.error(error?.data?.message || "Something went wrong");
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
            <div
                className="login-form-container"
                style={{
                    maxWidth: 350,
                    width: "100%",
                    padding: "32px 24px",
                    borderRadius: "8px",
                    backgroundColor: colors.white,
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                }}
            >
                <div style={{ textAlign: "center" }}>
                    <img
                        style={{ maxWidth: "250px" }}
                        src={require("../../assets/logo.png")}
                        alt="royal club football logo"
                    />
                </div>

                <div className="form-group">
                    <label
                        htmlFor="email"
                        style={{
                            display: "block",
                            marginBottom: 8,
                            color: colors.grayDark,
                        }}
                    >
                        Email
                    </label>
                    <input
                        type="email"
                        name="email"
                        id="email"
                        placeholder="Enter Email"
                        value={loginData.email}
                        onChange={onInputChange}
                        style={{
                            borderRadius: "4px",
                            padding: "10px 12px",
                            width: "100%",
                            border: `1px solid ${colors.grayLight}`,
                        }}
                    />
                    {errors.email && (
                        <div
                            className="error-message"
                            style={{ color: "red", fontSize: "12px" }}
                        >
                            {errors.email}
                        </div>
                    )}
                </div>

                <div
                    className="form-group"
                    style={{
                        display: "block",
                        marginBottom: 8,
                        color: colors.grayDark,
                    }}
                >
                    <label htmlFor="password">Password</label>
                    <div style={{ position: "relative" }}>
                        <input
                            type={passwordVisible ? "text" : "password"} // toggle input type
                            name="password"
                            id="password"
                            placeholder="Enter Password"
                            value={loginData.password}
                            onChange={onInputChange}
                            style={{
                                borderRadius: "4px",
                                padding: "10px 12px",
                                width: "100%",
                                border: `1px solid ${colors.grayLight}`,
                            }}
                        />
                        <div
                            onClick={() => setPasswordVisible((prev) => !prev)}
                            style={{
                                position: "absolute",
                                right: 10,
                                top: "50%",
                                transform: "translateY(-50%)",
                                cursor: "pointer",
                            }}
                        >
                            {passwordVisible ? (
                                <EyeInvisibleOutlined />
                            ) : (
                                <EyeOutlined />
                            )}
                        </div>
                    </div>
                    {errors.password && (
                        <div
                            className="error-message"
                            style={{ color: "red", fontSize: "12px" }}
                        >
                            {errors.password}
                        </div>
                    )}
                </div>

                <Button
                    type="primary"
                    onClick={onFinish}
                    loading={loading}
                    block
                >
                    Log in
                </Button>
            </div>
        </div>
    );
};

export default LoginPage;

import React, { useState, useEffect } from "react";
import { Button, Checkbox } from "antd";
import {
    EyeInvisibleOutlined,
    EyeOutlined,
    UserOutlined,
    LockOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setAllData, setImage } from "../../state/slices/loginInfoSlice";
import { useLoginMutation } from "../../state/features/auth/authSlice";
import {
    storeCredentials,
    getStoredCredentials,
    hasStoredCredentials,
    clearStoredCredentials,
} from "../../utils/utils";
import colors from "../../utils/colors";

const LoginPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [autoLoginChecked, setAutoLoginChecked] = useState(false);
    const [loginData, setLoginData] = useState({ email: "", password: "" });
    const [errors, setErrors] = useState({ email: "", password: "" });
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [rememberPassword, setRememberPassword] = useState(false);
    const [backgroundLoaded, setBackgroundLoaded] = useState(false);
    const [login] = useLoginMutation();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Load stored credentials and perform auto-login on component mount
    useEffect(() => {
        const storedCredentials = getStoredCredentials();
        
        if (storedCredentials) {
            setLoginData({
                email: storedCredentials.email,
                password: storedCredentials.password
            });
            setRememberPassword(true);
            
            // Auto-login only if the user has stored credentials
            if (!autoLoginChecked && hasStoredCredentials()) {
                setAutoLoginChecked(true); // Prevent multiple auto-login attempts
                handleAutoLogin(storedCredentials.email, storedCredentials.password);
            }
        }
    }, []);

    // Lazy load background image
    useEffect(() => {
        const img = new Image();
        img.onload = () => {
            // Set CSS custom property for background image
            document.documentElement.style.setProperty('--login-bg-image', `url(${process.env.PUBLIC_URL}/loginBackground.png)`);
            setBackgroundLoaded(true);
        };
        img.src = `${process.env.PUBLIC_URL}/loginBackground.png`;
    }, []);

    const handleAutoLogin = async (email: string, password: string) => {
        setLoading(true);

        try {
            const response = await login({
                email,
                password,
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
            navigate(window.location.pathname, { replace: true });
        } catch (error: any) {
            console.error("Auto-login failed:", error?.data?.message || "Something went wrong");
            setLoading(false);
            // If auto-login fails, clear stored credentials as they might be invalid
            clearStoredCredentials();
        }
    };

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLoginData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
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

    const handleRememberPasswordChange = (checked: boolean) => {
        setRememberPassword(checked);
        
        // If unchecked, immediately clear stored credentials
        if (!checked) {
            clearStoredCredentials();
        }
    };

    const onFinish = async (e?: React.FormEvent) => {
        if (e) e.preventDefault(); // prevent form's default submission behavior
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

            // Handle remember password
            if (rememberPassword) {
                storeCredentials(loginData.email, loginData.password);
            } else {
                clearStoredCredentials();
            }

            setLoading(false);
            navigate(window.location.pathname, { replace: true });
        } catch (error: any) {
            console.error(error?.data?.message || "Something went wrong");
            setLoading(false);
        }
    };

    return (
        <div className={`login-page-wrapper ${backgroundLoaded ? 'bg-loaded' : ''}`}>
            <div className="login-form-container">
                {/* Enhanced Left Side - Logo and Branding */}
                <div className="login-left-section">
                    <div className="login-left-content">
                        <img
                            className="club-logo"
                            src={require("../../assets/logo.png")}
                            alt="royal club football logo"
                        />
                        <h1 className="club-title">
                            Royal Football Club
                        </h1>
                        <h3 className="club-subtitle">
                            Management System
                        </h3>
                    </div>
                </div>

                {/* Enhanced Right Side - Login Form */}
                <div className="login-right-section">
                    {/* Enhanced Mobile Logo Section */}
                    <div className="mobile-logo-section">
                        <img
                            className="club-logo"
                            src={require("../../assets/logo.png")}
                            alt="royal club football logo"
                            style={{  objectFit: "cover"}}
                        />
                        <h1 className="mobile-club-title">
                            Royal Football Club
                        </h1>
                    </div>

                    <div className="welcome-section">
                        <h2 className="welcome-back-heading">
                            Welcome Back
                        </h2>
                   
                        <p className="welcome-text">
                            Sign in to access your dashboard and manage your team
                        </p>
                    </div>

                    <form onSubmit={onFinish}>
                        {/* Email Input */}
                        <div className="form-group">
                            <label htmlFor="email" className="form-label" style={{ color: colors.grayDark }}>
                                <UserOutlined style={{ marginRight: 8 }} />
                                Email Address
                            </label>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                placeholder="Enter your email address"
                                value={loginData.email}
                                onChange={onInputChange}
                                className={`underline-input ${errors.email ? 'error' : ''}`}
                            />
                            {errors.email && (
                                <div className="error-message">
                                    {errors.email}
                                </div>
                            )}
                        </div>

                        {/* Password Input */}
                        <div className="form-group">
                            <label htmlFor="password" className="form-label" style={{ color: colors.grayDark }}>
                                <LockOutlined style={{ marginRight: 8 }} />
                                Password
                            </label>
                            <div className="password-input-container">
                                <input
                                    type={passwordVisible ? "text" : "password"}
                                    name="password"
                                    id="password"
                                    placeholder="Enter your password"
                                    value={loginData.password}
                                    onChange={onInputChange}
                                    className={`underline-input password-input ${errors.password ? 'error' : ''}`}
                                />
                                <div
                                    onClick={() => setPasswordVisible((prev) => !prev)}
                                    className="password-toggle"
                                    style={{ color: colors.grayDark }}
                                >
                                    {passwordVisible ? (
                                        <EyeInvisibleOutlined />
                                    ) : (
                                        <EyeOutlined />
                                    )}
                                </div>
                            </div>
                            {errors.password && (
                                <div className="error-message">
                                    {errors.password}
                                </div>
                            )}
                        </div>

                        <div className="checkbox-container">
                            <Checkbox
                                checked={rememberPassword}
                                onChange={(e) => handleRememberPasswordChange(e.target.checked)}
                                style={{ 
                                    color: colors.grayDark,
                                    fontSize: "14px"
                                }}
                            >
                                Enable Auto Login
                            </Checkbox>
                        </div>

                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            block
                            className="login-btn"
                        >
                            {loading ? "Signing In..." : "Sign In to Dashboard"}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};


export default LoginPage;
                             
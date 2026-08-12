import React, { useEffect, useState } from "react";
import { Alert, Button } from "antd";
import { ArrowLeftOutlined, MailOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import {
    PasswordResetContent,
    useRequestPasswordResetMutation,
} from "../../state/features/passwordReset/passwordResetSlice";
import colors from "../../utils/colors";
import "./authStyles.css";

/**
 * Step one of emailed recovery: the member who cannot sign in asks for a link.
 *
 * Distinct from PasswordResetPage, which is the forced change shown *after* a successful login and
 * asks for the old password — no use at all to someone who has forgotten it.
 */
const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [backgroundLoaded, setBackgroundLoaded] = useState(false);
    const [result, setResult] = useState<PasswordResetContent | null>(null);
    const [requestPasswordReset, { isLoading }] = useRequestPasswordResetMutation();

    // Lazy load background image (same as login page)
    useEffect(() => {
        const img = new Image();
        img.onload = () => {
            document.documentElement.style.setProperty(
                "--login-bg-image",
                `url(${process.env.PUBLIC_URL}/loginBackground.png)`
            );
            setBackgroundLoaded(true);
        };
        img.src = `${process.env.PUBLIC_URL}/loginBackground.png`;
    }, []);

    useEffect(() => {
        document.title = "Forgot password | Royal Football Club";
    }, []);

    const validateEmail = (value: string) =>
        /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(value);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            setError("Please input your email!");
            return;
        }
        if (!validateEmail(email)) {
            setError("Please enter a valid email!");
            return;
        }
        setError("");

        try {
            const response = await requestPasswordReset({ email }).unwrap();
            setResult(response.content);
        } catch {
            setResult({
                status: "SEND_FAILED",
                message: "We could not reach the server. Please try again in a moment.",
            });
        }
    };

    // LIMIT_REACHED is the one outcome the member has to act on themselves, so it is called out
    // as a warning rather than folded into the neutral "check your inbox" note.
    const alertType = result
        ? result.status === "SENT"
            ? "success"
            : result.status === "LIMIT_REACHED"
                ? "warning"
                : "error"
        : "info";

    return (
        <div className={`login-page-wrapper ${backgroundLoaded ? "bg-loaded" : ""}`}>
            <div className="login-form-container">
                <div className="login-left-section">
                    <div className="login-left-content">
                        <img
                            className="club-logo"
                            src={require("../../assets/logo.png")}
                            alt="royal club football logo"
                        />
                        <h1 className="club-title">Royal Football Club</h1>
                        <h3 className="club-subtitle">Management System</h3>
                    </div>
                </div>

                <div className="login-right-section">
                    <div className="mobile-logo-section">
                        <img
                            className="club-logo"
                            src={require("../../assets/logo.png")}
                            alt="royal club football logo"
                            style={{ objectFit: "cover" }}
                        />
                        <h1 className="mobile-club-title">Royal Football Club</h1>
                    </div>

                    <div className="welcome-section">
                        <h2 className="welcome-back-heading">Forgot Password</h2>
                        <p className="welcome-text">
                            Enter the email address on your club account and we will send you a
                            link to choose a new password
                        </p>
                    </div>

                    {result ? (
                        <>
                            <Alert
                                type={alertType}
                                showIcon
                                message={
                                    result.status === "SENT"
                                        ? "Check your email"
                                        : result.status === "LIMIT_REACHED"
                                            ? "Reset limit reached"
                                            : "Something went wrong"
                                }
                                description={result.message}
                                style={{ marginBottom: 20 }}
                            />
                            {result.status !== "SENT" && (
                                <Button
                                    block
                                    className="login-btn"
                                    onClick={() => setResult(null)}
                                    style={{ marginBottom: 16 }}
                                >
                                    Try again
                                </Button>
                            )}
                        </>
                    ) : (
                        <form onSubmit={onSubmit}>
                            <div className="form-group">
                                <label
                                    htmlFor="email"
                                    className="form-label"
                                    style={{ color: colors.grayDark }}
                                >
                                    <MailOutlined style={{ marginRight: 8 }} />
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    id="email"
                                    placeholder="Enter your email address"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setError("");
                                    }}
                                    className={`underline-input ${error ? "error" : ""}`}
                                />
                                {error && <div className="error-message">{error}</div>}
                            </div>

                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={isLoading}
                                block
                                className="login-btn"
                            >
                                {isLoading ? "Sending..." : "Send Reset Link"}
                            </Button>
                        </form>
                    )}

                    <div style={{ textAlign: "center", marginTop: 8 }}>
                        <Link to="/login" style={{ fontSize: 14 }}>
                            <ArrowLeftOutlined style={{ marginRight: 6 }} />
                            Back to sign in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;

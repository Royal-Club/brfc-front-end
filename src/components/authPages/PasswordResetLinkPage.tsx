import React, { useEffect, useState } from "react";
import { Alert, Button, Spin } from "antd";
import {
    ArrowLeftOutlined,
    EyeInvisibleOutlined,
    EyeOutlined,
    LockOutlined,
} from "@ant-design/icons";
import { Link, useSearchParams } from "react-router-dom";
import {
    PasswordResetContent,
    useConfirmPasswordResetMutation,
    useValidatePasswordResetTokenQuery,
} from "../../state/features/passwordReset/passwordResetSlice";
import { clearStoredCredentials } from "../../utils/utils";
import colors from "../../utils/colors";
import "./authStyles.css";

/**
 * Landing page for the link in a password-reset email.
 *
 * The signed token in the URL is the only credential — the member reaching this page cannot sign
 * in, so no old password is asked for. Loading the page only validates the link; nothing changes
 * until the form is submitted, because mail scanners follow links in transit.
 */
const PasswordResetLinkPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") ?? "";

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [error, setError] = useState("");
    const [backgroundLoaded, setBackgroundLoaded] = useState(false);
    const [result, setResult] = useState<PasswordResetContent | null>(null);

    const { data, isLoading, isError } = useValidatePasswordResetTokenQuery(
        { token },
        { skip: !token }
    );
    const [confirmPasswordReset, { isLoading: isSubmitting }] = useConfirmPasswordResetMutation();

    const validation = data?.content;

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
        document.title = "Choose a new password | Royal Football Club";
    }, []);

    // Mirrors the backend rule, so the common mistakes never cost a round trip.
    const isStrong = (value: string) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(value);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isStrong(newPassword)) {
            setError(
                "Password must be at least 8 characters and contain uppercase, lowercase and numbers"
            );
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("The two passwords do not match");
            return;
        }
        setError("");

        try {
            const response = await confirmPasswordReset({ token, newPassword }).unwrap();
            if (response.content.status === "WEAK_PASSWORD") {
                setError(response.content.message ?? "Please choose a stronger password");
                return;
            }
            if (response.content.status === "RESET") {
                // The saved auto-login password is now wrong; leaving it would fail the next
                // silent sign-in and wipe itself anyway.
                clearStoredCredentials();
            }
            setResult(response.content);
        } catch {
            setResult({
                status: "INVALID",
                message: "We could not reach the server. Please try again in a moment.",
            });
        }
    };

    const shell = (children: React.ReactNode) => (
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
                    {children}
                </div>
            </div>
        </div>
    );

    const backToLogin = (
        <div style={{ textAlign: "center", marginTop: 8 }}>
            <Link to="/login" style={{ fontSize: 14 }}>
                <ArrowLeftOutlined style={{ marginRight: 6 }} />
                Back to sign in
            </Link>
        </div>
    );

    const askForAnotherLink = (
        <div style={{ textAlign: "center", marginTop: 8 }}>
            <Link to="/forgot-password" style={{ fontSize: 14 }}>
                Request a new reset link
            </Link>
        </div>
    );

    if (!token) {
        return shell(
            <>
                <Alert
                    type="warning"
                    showIcon
                    message="Missing link"
                    description="This page needs the link from your password reset email."
                />
                {askForAnotherLink}
                {backToLogin}
            </>
        );
    }

    if (isLoading) {
        return shell(
            <div style={{ textAlign: "center", padding: 48 }}>
                <Spin size="large" />
            </div>
        );
    }

    if (isError || !validation) {
        return shell(
            <>
                <Alert
                    type="error"
                    showIcon
                    message="Something went wrong"
                    description="We could not open this link. Please try again in a moment."
                />
                {backToLogin}
            </>
        );
    }

    // Once the password is changed, or when the link itself is unusable, show the outcome
    // instead of a form the member cannot submit.
    const outcome = result ?? (validation.status !== "VALID" ? validation : null);

    if (outcome) {
        const done = outcome.status === "RESET";
        return shell(
            <>
                <Alert
                    type={done ? "success" : "error"}
                    showIcon
                    message={done ? "Password updated" : titleFor(outcome.status)}
                    description={outcome.message}
                />
                {!done && askForAnotherLink}
                {backToLogin}
            </>
        );
    }

    return shell(
        <>
            <div className="welcome-section">
                <h2 className="welcome-back-heading">Choose a New Password</h2>
                <p className="welcome-text">
                    {validation.playerName
                        ? `Hi ${validation.playerName}, pick a password you will remember`
                        : "Pick a password you will remember"}
                </p>
            </div>

            <form onSubmit={onSubmit}>
                <div className="form-group">
                    <label
                        htmlFor="newPassword"
                        className="form-label"
                        style={{ color: colors.grayDark }}
                    >
                        <LockOutlined style={{ marginRight: 8 }} />
                        New Password
                    </label>
                    <div className="password-input-container">
                        <input
                            type={passwordVisible ? "text" : "password"}
                            name="newPassword"
                            id="newPassword"
                            placeholder="Enter a new password"
                            value={newPassword}
                            onChange={(e) => {
                                setNewPassword(e.target.value);
                                setError("");
                            }}
                            className={`underline-input password-input ${error ? "error" : ""}`}
                        />
                        <div
                            onClick={() => setPasswordVisible((prev) => !prev)}
                            className="password-toggle"
                            style={{ color: colors.grayDark }}
                        >
                            {passwordVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                        </div>
                    </div>
                </div>

                <div className="form-group">
                    <label
                        htmlFor="confirmPassword"
                        className="form-label"
                        style={{ color: colors.grayDark }}
                    >
                        <LockOutlined style={{ marginRight: 8 }} />
                        Confirm Password
                    </label>
                    <input
                        type={passwordVisible ? "text" : "password"}
                        name="confirmPassword"
                        id="confirmPassword"
                        placeholder="Re-enter the new password"
                        value={confirmPassword}
                        onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            setError("");
                        }}
                        className={`underline-input ${error ? "error" : ""}`}
                    />
                    {error && <div className="error-message">{error}</div>}
                </div>

                <ul
                    style={{
                        color: colors.grayDark,
                        fontSize: 12,
                        margin: "0 0 20px 0",
                        paddingLeft: 20,
                    }}
                >
                    <li>At least 8 characters</li>
                    <li>At least one uppercase letter (A-Z)</li>
                    <li>At least one lowercase letter (a-z)</li>
                    <li>At least one number (0-9)</li>
                </ul>

                <Button
                    type="primary"
                    htmlType="submit"
                    loading={isSubmitting}
                    block
                    className="login-btn"
                >
                    {isSubmitting ? "Saving..." : "Save New Password"}
                </Button>
            </form>

            {backToLogin}
        </>
    );
};

function titleFor(status: PasswordResetContent["status"]): string {
    switch (status) {
        case "EXPIRED":
            return "This link has expired";
        case "ALREADY_USED":
            return "This link has already been used";
        default:
            return "This link is not valid";
    }
}

export default PasswordResetLinkPage;

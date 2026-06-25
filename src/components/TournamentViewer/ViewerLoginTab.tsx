import React, { useState } from "react";
import { Button, Checkbox, Form, Input, message } from "antd";
import {
  EyeInvisibleOutlined,
  EyeOutlined,
  LockOutlined,
  MailOutlined,
} from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { setAllData, setImage } from "../../state/slices/loginInfoSlice";
import { useLoginMutation } from "../../state/features/auth/authSlice";
import { storeCredentials, clearStoredCredentials } from "../../utils/utils";
import logo from "../../assets/logo.png";
import styles from "./ViewerLoginTab.module.css";

export default function ViewerLoginTab() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [login] = useLoginMutation();
  const dispatch = useDispatch();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);

    try {
      const response = await login(values).unwrap();
      const content = response.content;

      dispatch(setAllData(content));
      dispatch(
        setImage(
          "https://giftolexia.com/wp-content/uploads/2015/11/dummy-profile.png",
        ),
      );
      localStorage.setItem("tokenContent", JSON.stringify(content));

      if (content.resetPassword || !rememberMe) {
        clearStoredCredentials();
      } else {
        storeCredentials(values.email, values.password);
      }
    } catch (error: any) {
      message.error(error?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <div
        className={styles.card}
        style={{
          ["--login-bg" as any]: `url(${process.env.PUBLIC_URL}/loginBackground.png)`,
        }}
      >
        {/* Left: Branding */}
        <div className={styles.brandPanel}>
          <div className={styles.brandOverlay} />
          <div className={styles.brandContent}>
            <img src={logo} alt="Royal Football Club" className={styles.brandLogo} />
            <h2 className={styles.brandTitle}>Royal Football Club</h2>
            <p className={styles.brandSubtitle}>Management System</p>
          </div>
        </div>

        {/* Right: Form */}
        <div className={styles.formPanel}>
          <h3 className={styles.title}>Welcome Back</h3>
          <p className={styles.subtitle}>
            Sign in to manage tournaments, fixtures and teams.
          </p>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
            className={styles.form}
            requiredMark={false}
          >
            <Form.Item
              name="email"
              label="Email Address"
              rules={[
                { required: true, message: "Please enter your email" },
                { type: "email", message: "Please enter a valid email" },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="you@example.com"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: "Please enter your password" }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter your password"
                size="large"
                iconRender={(visible) =>
                  visible ? <EyeOutlined /> : <EyeInvisibleOutlined />
                }
              />
            </Form.Item>

            <Form.Item className={styles.rememberRow}>
              <Checkbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              >
                Remember me
              </Checkbox>
            </Form.Item>

            <Form.Item className={styles.submitRow}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
}

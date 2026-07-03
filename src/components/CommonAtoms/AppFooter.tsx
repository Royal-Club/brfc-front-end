import React from "react";
import { Layout, Typography, theme } from "antd";

const { Footer } = Layout;
const { Text } = Typography;

const APP_VERSION = process.env.REACT_APP_VERSION || "0.1.0";

export default function AppFooter() {
  const year = new Date().getFullYear();
  const {
    token: { colorBgContainer, colorBorderSecondary, colorTextSecondary },
  } = theme.useToken();

  return (
    <Footer
      style={{
        background: colorBgContainer,
        borderTop: `1px solid ${colorBorderSecondary}`,
        padding: "14px 24px",
        marginTop: 32,
        textAlign: "center",
      }}
    >
      <Text style={{ color: colorTextSecondary, fontSize: 12 }}>
        &copy; {year} BJIT Royal Football Club. All rights reserved.
        <span style={{ margin: "0 8px", opacity: 0.5 }}>·</span>v{APP_VERSION}
      </Text>
    </Footer>
  );
}

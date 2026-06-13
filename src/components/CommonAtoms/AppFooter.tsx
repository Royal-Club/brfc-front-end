import React from "react";
import { Layout, Typography } from "antd";

const { Footer } = Layout;
const { Text } = Typography;

export default function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <Footer
      style={{
        textAlign: "center",
        background: "transparent",
        padding: "16px 24px",
      }}
    >
      <Text type="secondary" style={{ fontSize: 13 }}>
        BJIT Royal Football Club — Unity. Energy. Legacy.
        <br />
        &copy; {year} BJIT Royal Football Club. All rights reserved.
      </Text>
    </Footer>
  );
}

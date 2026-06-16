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
        marginTop: '24px'
      }}
    >
      <div>
        <Text
          style={{
            color: "#ffffff",
            fontWeight: 700,
            fontSize: 13,
            display: "block",
          }}
        >
          BJIT Royal Football Club — Unity. Energy. Legacy.
        </Text>
        <Text
          type="secondary"
          style={{ fontSize: 13, display: "block", marginTop: 2 }}
        >
          &copy; {year} BJIT Royal Football Club. All rights reserved.
        </Text>
      </div>
    </Footer>
  );
}

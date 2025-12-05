import { toast } from "react-toastify";
import {
  ExclamationCircleOutlined,
  AlertOutlined,
  WarningOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import React from "react";

interface ErrorConfig {
  statusCode?: number;
  message: string;
}

const getErrorConfig = (statusCode?: number) => {
  switch (statusCode) {
    case 400:
      return {
        icon: React.createElement(WarningOutlined, { style: { color: "#faad14", marginRight: "8px" } }),
        title: "Bad Request",
        bgColor: "#fff7e6",
        borderColor: "#faad14",
      };
    case 401:
      return {
        icon: React.createElement(CloseCircleOutlined, { style: { color: "#ff4d4f", marginRight: "8px" } }),
        title: "Unauthorized",
        bgColor: "#fff1f0",
        borderColor: "#ff4d4f",
      };
    case 403:
      return {
        icon: React.createElement(ExclamationCircleOutlined, { style: { color: "#ff7a45", marginRight: "8px" } }),
        title: "Forbidden",
        bgColor: "#fff7e6",
        borderColor: "#ff7a45",
      };
    case 404:
      return {
        icon: React.createElement(WarningOutlined, { style: { color: "#ff9c6e", marginRight: "8px" } }),
        title: "Not Found",
        bgColor: "#fff7e6",
        borderColor: "#ff9c6e",
      };
    case 409:
      return {
        icon: React.createElement(ExclamationCircleOutlined, { style: { color: "#faad14", marginRight: "8px" } }),
        title: "Conflict",
        bgColor: "#fff7e6",
        borderColor: "#faad14",
      };
    case 500:
      return {
        icon: React.createElement(AlertOutlined, { style: { color: "#ff4d4f", marginRight: "8px" } }),
        title: "Server Error",
        bgColor: "#fff1f0",
        borderColor: "#ff4d4f",
      };
    case 503:
      return {
        icon: React.createElement(AlertOutlined, { style: { color: "#ff7a45", marginRight: "8px" } }),
        title: "Service Unavailable",
        bgColor: "#fff7e6",
        borderColor: "#ff7a45",
      };
    default:
      return {
        icon: React.createElement(ExclamationCircleOutlined, { style: { color: "#faad14", marginRight: "8px" } }),
        title: "Error",
        bgColor: "#fff7e6",
        borderColor: "#faad14",
      };
  }
};

const ErrorToastContent = ({ icon, title, message }: { icon: React.ReactNode; title: string; message: string }) => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
    <div style={{ display: "flex", alignItems: "center", marginTop: "2px" }}>
      {icon}
    </div>
    <div>
      <div style={{ fontWeight: "600", marginBottom: "4px" }}>{title}</div>
      <div style={{ fontSize: "14px", lineHeight: "1.5" }}>{message}</div>
    </div>
  </div>
);

export const showErrorNotification = (errorConfig: ErrorConfig) => {
  try {
    const { statusCode, message } = errorConfig;

    // Ensure message is always a string
    const messageText = typeof message === 'string'
      ? message
      : (message ? JSON.stringify(message) : 'An error occurred');

    const { icon, title, bgColor, borderColor } = getErrorConfig(statusCode);

    toast.error(<ErrorToastContent icon={icon} title={title} message={messageText} />, {
      position: "top-right",
      autoClose: 4500,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      style: {
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        color: "#000",
        padding: "12px 16px",
      },
    });
  } catch (error) {
    // Silently fail if toast notification fails
    console.error("Failed to show error notification:", error);
  }
};

import React, { useState } from "react";
import { Modal, Button, Collapse, Input, Space, message } from "antd";
import "./SettingsModal.css"; // Importing the CSS file
import { useChangePasswordMutation } from "../../state/features/auth/authSlice";

const { Panel } = Collapse;

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose }) => {
    const [changePassword, { isLoading: isChangePasswordLoading }] =
        useChangePasswordMutation();

    const [updatePassword, setUpdatePassword] = useState({
        oldPassword: "",
        newPassword: "",
    });

    const handleChangePassword = async () => {
        if (!updatePassword.oldPassword || !updatePassword.newPassword) {
            message.error("Both fields are mandatory!");
            return;
        }

        changePassword(updatePassword)
            .unwrap()
            .then(() => {
                message.success("Password updated successfully");
            })
            .catch((err) => {
                message.error(err.data.message);
            });
    };

    return (
        <Modal
            title="Settings"
            open={visible}
            onCancel={onClose}
            footer={null}
            className="settings-modal"
        >
            <Collapse className="settings-collapse">
                <Panel
                    header="Change Password"
                    key="1"
                    className="settings-panel"
                >
                    <Space direction="vertical" style={{ width: "100%" }}>
                        <Input.Password
                            placeholder="Old Password"
                            className="settings-input"
                            value={updatePassword.oldPassword}
                            onChange={(e) =>
                                setUpdatePassword({
                                    ...updatePassword,
                                    oldPassword: e.target.value,
                                })
                            }
                        />
                        <Input.Password
                            placeholder="New Password"
                            className="settings-input"
                            value={updatePassword.newPassword}
                            onChange={(e) =>
                                setUpdatePassword({
                                    ...updatePassword,
                                    newPassword: e.target.value,
                                })
                            }
                        />
                        <Button
                            type="primary"
                            className="settings-button"
                            loading={isChangePasswordLoading}
                            onClick={handleChangePassword}
                        >
                            Update
                        </Button>
                    </Space>
                </Panel>
            </Collapse>
        </Modal>
    );
};

export default SettingsModal;

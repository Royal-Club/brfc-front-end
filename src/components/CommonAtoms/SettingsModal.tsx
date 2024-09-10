import React, { useState } from "react";
import { Modal, Button, Collapse, Input, Space, message, Select } from "antd";
import "./SettingsModal.css"; // Importing the CSS file
import {
    useChangePasswordMutation,
    useUpdatePlayerDataMutation,
} from "../../state/features/auth/authSlice";
import { useGetPlayerPositionsQuery } from "../../state/features/player/playerSlice";

const { Panel } = Collapse;
const { Option } = Select;

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
    playerData: {
        id: number;
        name: string;
        email: string;
        employeeId: string;
        fullName: string;
        skypeId: string;
        mobileNo: string;
        playingPosition?: string;
    };
}

const SettingsModal: React.FC<SettingsModalProps> = ({
    visible,
    onClose,
    playerData,
}) => {
    const [changePassword, { isLoading: isChangePasswordLoading }] =
        useChangePasswordMutation();
    const [updatePlayerData, { isLoading: isUpdatePlayerLoading }] =
        useUpdatePlayerDataMutation();

    const { data: playerPositions } = useGetPlayerPositionsQuery();

    const [updatePassword, setUpdatePassword] = useState({
        oldPassword: "",
        newPassword: "",
    });

    const [updatedPlayerInfo, setUpdatedPlayerInfo] = useState(playerData);

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

    const handleUpdatePlayerData = async () => {
        if (!updatedPlayerInfo.name || !updatedPlayerInfo.email) {
            message.error("Name and Email are mandatory!");
            return;
        }
        console.log("updatedPlayerInfo", updatedPlayerInfo);

        updatePlayerData({
            id: updatedPlayerInfo.id,
            data: updatedPlayerInfo,
        })
            .unwrap()
            .then(() => {
                message.success("Player data updated successfully");
            })
            .catch((err: any) => {
                message.error(
                    err.data.message || "Failed to update player data"
                );
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
                            Update Password
                        </Button>
                    </Space>
                </Panel>

                <Panel
                    header="Update Player Data"
                    key="2"
                    className="settings-panel"
                >
                    <Space direction="vertical" style={{ width: "100%" }}>
                        <Input
                            placeholder="Name"
                            className="settings-input"
                            value={updatedPlayerInfo.name}
                            onChange={(e) =>
                                setUpdatedPlayerInfo({
                                    ...updatedPlayerInfo,
                                    name: e.target.value,
                                })
                            }
                        />
                        <Input
                            placeholder="Email"
                            className="settings-input"
                            value={updatedPlayerInfo.email}
                            onChange={(e) =>
                                setUpdatedPlayerInfo({
                                    ...updatedPlayerInfo,
                                    email: e.target.value,
                                })
                            }
                        />
                        <Input
                            placeholder="Employee ID"
                            className="settings-input"
                            value={updatedPlayerInfo.employeeId}
                            onChange={(e) =>
                                setUpdatedPlayerInfo({
                                    ...updatedPlayerInfo,
                                    employeeId: e.target.value,
                                })
                            }
                        />
                        <Input
                            placeholder="Skype ID"
                            className="settings-input"
                            value={updatedPlayerInfo.skypeId}
                            onChange={(e) =>
                                setUpdatedPlayerInfo({
                                    ...updatedPlayerInfo,
                                    skypeId: e.target.value,
                                })
                            }
                        />
                        <Input
                            placeholder="Mobile No"
                            className="settings-input"
                            value={updatedPlayerInfo.mobileNo}
                            onChange={(e) =>
                                setUpdatedPlayerInfo({
                                    ...updatedPlayerInfo,
                                    mobileNo: e.target.value,
                                })
                            }
                        />
                        {/* Playing Position Dropdown */}
                        <Select
                            placeholder="Select Playing Position"
                            value={updatedPlayerInfo.playingPosition}
                            onChange={(value) =>
                                setUpdatedPlayerInfo({
                                    ...updatedPlayerInfo,
                                    playingPosition: value,
                                })
                            }
                            className="settings-select"
                        >
                            {playerPositions?.content?.map((position) => (
                                <Option
                                    key={position.name}
                                    value={position.name}
                                >
                                    {position.description}
                                </Option>
                            ))}
                        </Select>

                        <Button
                            type="primary"
                            className="settings-button"
                            loading={isUpdatePlayerLoading}
                            onClick={handleUpdatePlayerData}
                        >
                            Update Player Info
                        </Button>
                    </Space>
                </Panel>
            </Collapse>
        </Modal>
    );
};

export default SettingsModal;

import React from "react";
import { Modal, Button, Collapse, Input, Space } from "antd";

const { Panel } = Collapse;

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose }) => {
    return (
        <Modal
            title="Settings"
            open={visible}
            onCancel={onClose}
            footer={null}
            className="settingsModal"
        >
            <Collapse>
                <Panel
                    header="Change Password"
                    key="1"
                    className="settingsPanel"
                >
                    <Space direction="vertical" style={{ width: "100%" }}>
                        <Input.Password
                            placeholder="New Password"
                            className="settingsInput"
                        />
                        <Input.Password
                            placeholder="Confirm Password"
                            className="settingsInput"
                        />
                        <Button type="primary" className="settingsButton">
                            Update
                        </Button>
                    </Space>
                </Panel>
            </Collapse>
        </Modal>
    );
};

export default SettingsModal;

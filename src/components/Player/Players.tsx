import {
    CheckCircleTwoTone,
    EditTwoTone,
    LockTwoTone,
} from "@ant-design/icons";
import { Button, Col, Modal, Row, Space, Table, Input, message } from "antd";
import Title from "antd/es/typography/Title";
import moment from "moment";
import { Link } from "react-router-dom";
import IPlayer from "../../interfaces/IPlayer";
import { useGetPlayersQuery } from "../../state/features/player/playerSlice";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import { ColumnsType } from "antd/es/table";
import { useResetPlayerPasswordMutation } from "../../state/features/auth/authSlice";

function Players() {
    const { data: playersData, isLoading, refetch } = useGetPlayersQuery();
    const [resetPlayerPassword] = useResetPlayerPasswordMutation();
    const loginInfo = useSelector(selectLoginInfo);

    // State for handling the password change modal
    const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState<IPlayer | null>(null);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    useEffect(() => {
        refetch();
    }, []);

    // Function to handle opening the password modal
    const showPasswordModal = (player: IPlayer) => {
        setSelectedPlayer(player);
        setIsPasswordModalVisible(true);
    };

    // Function to close the password modal
    const handleCancel = () => {
        setIsPasswordModalVisible(false);
        setPassword("");
        setConfirmPassword("");
    };

    // Function to handle password update
    const handlePasswordUpdate = () => {
        if (password !== confirmPassword) {
            message.error("Passwords do not match!");
            return;
        }

        Modal.confirm({
            title: "Are you sure?",
            content: "Do you really want to change the password?",
            onOk: () => {
                if (isPasswordValid()) {
                    resetPlayerPassword({
                        email: selectedPlayer?.email as string,
                        newPassword: password,
                    })
                        .unwrap()
                        .then(() => {
                            message.success("Password updated successfully");
                            handleCancel();
                        })
                        .catch((err) => {
                            message.error(err.data.message);
                        });
                } else {
                    message.error("Passwords do not match!");
                }
            },
        });
    };

    // Validation for the password fields
    const isPasswordValid = () => {
        return password && confirmPassword && password === confirmPassword;
    };

    const CommonColumns: ColumnsType<IPlayer> = [
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
        },
        {
            title: "Skype",
            dataIndex: "skypeId",
            key: "skypeId",
        },
        {
            title: "Email",
            dataIndex: "email",
            key: "email",
        },
        {
            title: "Mobile",
            dataIndex: "mobileNo",
            key: "mobileNo",
        },
        {
            title: "Employee Id",
            dataIndex: "employeeId",
            key: "employeeId",
        },
        {
            title: "Status",
            dataIndex: "active",
            key: "active",
            render: (_: any, record: IPlayer) => {
                if (record.active) {
                    return (
                        <span>
                            <CheckCircleTwoTone twoToneColor="#52c41a" /> Active
                        </span>
                    );
                } else {
                    return (
                        <span>
                            <CheckCircleTwoTone twoToneColor="#eb2f96" />{" "}
                            InActive
                        </span>
                    );
                }
            },
        },
        {
            title: "Created Date",
            dataIndex: "createdDate",
            key: "createdDate",
            render: (_: any, record: IPlayer) =>
                moment.utc(record.createdDate).local().format("DD-MMM-YYYY"),
        },
        {
            title: "Modified Date",
            dataIndex: "lastModifiedDate",
            key: "lastModifiedDate",
            render: (_: any, record: IPlayer) =>
                moment.utc(record.updatedDate).local().format("DD-MMM-YYYY"),
        },
    ];

    const playersColumn: ColumnsType<IPlayer> = loginInfo.roles.includes(
        "ADMIN"
    )
        ? [
              ...CommonColumns,
              {
                  title: "Action",
                  key: "action",
                  render: (_: any, record: IPlayer) => (
                      <Space size="middle">
                          <Link to={`/players/${record.id}`}>
                              <EditTwoTone />
                          </Link>
                          <LockTwoTone
                              onClick={() => showPasswordModal(record)}
                              style={{ cursor: "pointer" }}
                          />
                      </Space>
                  ),
              },
          ]
        : CommonColumns;

    return (
        <>
            <Row>
                <Col md={24}>
                    <div>
                        <Title level={4}>Players</Title>
                        {loginInfo.roles.includes("ADMIN") && (
                            <Link to={"/player"}>
                                <Button type="primary">Create</Button>
                            </Link>
                        )}
                        <Table
                            loading={isLoading}
                            size="large"
                            dataSource={playersData?.content}
                            columns={playersColumn}
                            pagination={{
                                showTotal: (total) => `Total ${total} records`,
                            }}
                            scroll={{ x: "max-content" }}
                        />
                    </div>
                </Col>
            </Row>

            {/* Reset Password modal */}
            <Modal
                title="Reset Password"
                visible={isPasswordModalVisible}
                onCancel={handleCancel}
                onOk={handlePasswordUpdate}
                okText="Reset Password"
                cancelText="Cancel"
                okButtonProps={{ disabled: !isPasswordValid() }} // Disable the button if validation fails
            >
                <p>Please enter the new password twice to confirm.</p>
                <Input.Password
                    placeholder="New Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ marginBottom: "10px" }}
                    required
                />
                <Input.Password
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
            </Modal>
        </>
    );
}

export default Players;

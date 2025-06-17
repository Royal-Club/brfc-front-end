import {
  CheckCircleTwoTone,
  EditTwoTone,
  LockTwoTone,
} from "@ant-design/icons";
import { Button, Col, Modal, Row, Space, Table, Input, message } from "antd";
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
  const [searchTerm, setSearchTerm] = useState(""); // state for the search term
  const [filteredPlayers, setFilteredPlayers] = useState<IPlayer[]>([]); // state for filtered players

  useEffect(() => {
    if (playersData?.content) {
      setFilteredPlayers(playersData.content); // initialize filtered players
    }
  }, [playersData]);

  useEffect(() => {
    refetch();
  }, []);

  // Handle search input change
  const handleSearch = (value: string) => {
    setSearchTerm(value.toLowerCase());

    if (playersData && playersData.content) {
      const filtered = playersData.content.filter(
        (player: IPlayer) =>
          player.name?.toLowerCase().includes(value.toLowerCase()) ||
          player.email?.toLowerCase().includes(value.toLowerCase()) ||
          player.mobileNo?.includes(value)
      );
      setFilteredPlayers(filtered);
    } else {
      setFilteredPlayers([]);
    }
  };

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
              <CheckCircleTwoTone twoToneColor="#eb2f96" /> InActive
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

  const playersColumn: ColumnsType<IPlayer> = loginInfo.roles.includes("ADMIN")
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
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
   
      <h1 style={{
          fontSize: "24px",
          fontWeight: "normal",
        }}>Players</h1>

        <Row
          align="middle"
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "10px",
          }}
        >
          {loginInfo.roles.includes("ADMIN") && (
            <Link to={"/player"}>
              <Button type="primary">Create</Button>
            </Link>
          )}
          {/* Search Bar */}
          <Input.Search
            placeholder="Search players"
            onSearch={handleSearch}
            style={{ width: 300 }}
            enterButton
          />
        </Row>
      </Row>

      <Row>
        <Col md={24}>
          <Table
            loading={isLoading}
            size="large"
            dataSource={filteredPlayers} // filtered data
            columns={playersColumn}
            pagination={{
              showTotal: (total) => `Total ${total} records`,
            }}
            scroll={{ x: "max-content" }}
          />
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

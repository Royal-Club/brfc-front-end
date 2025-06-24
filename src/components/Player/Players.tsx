import {
  EditTwoTone,
  LockTwoTone,
  UserOutlined,
  PlusOutlined,
  TeamOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SkypeOutlined,
  PhoneOutlined
} from "@ant-design/icons";
import { 
  Button, 
  Col, 
  Modal, 
  Row, 
  Space, 
  Table, 
  Input, 
  message,
  Card,
  Tabs,
  Typography,
  Tag,
  Badge,
  Avatar,
  Form
} from "antd";
import moment from "moment";
import { Link, useNavigate } from "react-router-dom";
import IPlayer from "../../interfaces/IPlayer";
import { useGetPlayersQuery } from "../../state/features/player/playerSlice";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import { ColumnsType } from "antd/es/table";
import { useResetPlayerPasswordMutation } from "../../state/features/auth/authSlice";
import "./Players.css";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

function Players() {
  const navigate = useNavigate();
  const { data: playersData, isLoading, refetch } = useGetPlayersQuery();
  const [resetPlayerPassword] = useResetPlayerPasswordMutation();
  const loginInfo = useSelector(selectLoginInfo);

  // State for handling the password change modal
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<IPlayer | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPlayers, setFilteredPlayers] = useState<IPlayer[]>([]);
  const [activeTabKey, setActiveTabKey] = useState("all");

  // Add these new states for password form validation
  const [passwordError, setPasswordError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong" | "">("");
  
  useEffect(() => {
    if (playersData?.content) {
      filterPlayersByTab(activeTabKey, playersData.content);
    }
  }, [playersData, activeTabKey]);

  useEffect(() => {
    refetch();
  }, []);

  // Handle search input change
  const handleSearch = (value: string) => {
    setSearchTerm(value.toLowerCase());

    if (playersData && playersData.content) {
      const filtered = playersData.content.filter(
        (player: IPlayer) =>
          (player.name?.toLowerCase().includes(value.toLowerCase()) ||
          player.email?.toLowerCase().includes(value.toLowerCase()) ||
          player.mobileNo?.includes(value)) &&
          (activeTabKey === "all" || 
          (activeTabKey === "active" && player.active) || 
          (activeTabKey === "inactive" && !player.active))
      );
      setFilteredPlayers(filtered);
    } else {
      setFilteredPlayers([]);
    }
  };

  // Function to filter players based on tab selection
  const filterPlayersByTab = (tabKey: string, players: IPlayer[] = playersData?.content || []) => {
    if (!players) return;
    
    let filtered;
    switch (tabKey) {
      case "active":
        filtered = players.filter(player => player.active);
        break;
      case "inactive":
        filtered = players.filter(player => !player.active);
        break;
      default:
        filtered = players;
    }

    // Apply any existing search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (player: IPlayer) =>
          player.name?.toLowerCase().includes(searchTerm) ||
          player.email?.toLowerCase().includes(searchTerm) ||
          player.mobileNo?.includes(searchTerm)
      );
    }

    setFilteredPlayers(filtered);
  };

  // Tab change handler
  const handleTabChange = (key: string) => {
    setActiveTabKey(key);
    filterPlayersByTab(key);
  };

  // Function to handle opening the password modal
  const showPasswordModal = (player: IPlayer) => {
    setSelectedPlayer(player);
    setIsPasswordModalVisible(true);
  };

  // Function to check password strength
  const checkPasswordStrength = (password: string) => {
    if (!password) {
      setPasswordStrength("");
      return;
    }
    
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasDigits = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const strength = 
      (hasLowerCase ? 1 : 0) + 
      (hasUpperCase ? 1 : 0) + 
      (hasDigits ? 1 : 0) + 
      (hasSpecialChars ? 1 : 0);
    
    if (password.length < 8 || strength < 2) {
      setPasswordStrength("weak");
    } else if (strength < 4) {
      setPasswordStrength("medium");
    } else {
      setPasswordStrength("strong");
    }
  };
  
  // Enhanced password change handler
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    checkPasswordStrength(newPassword);
    
    // Clear error when typing
    if (confirmPassword && confirmPassword === newPassword) {
      setPasswordError("");
    } else if (confirmPassword) {
      setPasswordError("Passwords do not match");
    }
  };
  
  // Enhanced confirm password change handler
  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newConfirmPassword = e.target.value;
    setConfirmPassword(newConfirmPassword);
    
    if (password && password !== newConfirmPassword) {
      setPasswordError("Passwords do not match");
    } else {
      setPasswordError("");
    }
  };
  
  // Function to get color for password strength indicator
  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case "weak": return "#ff4d4f";
      case "medium": return "#faad14";
      case "strong": return "#52c41a";
      default: return "#d9d9d9";
    }
  };

  // Function to close the password modal (update to clear all states)
  const handleCancel = () => {
    setIsPasswordModalVisible(false);
    setPassword("");
    setConfirmPassword("");
    setPasswordStrength("");
    setPasswordError("");
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

  // Get initials from player name for avatar
  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const CommonColumns: ColumnsType<IPlayer> = [
    {
      title: "Player",
      dataIndex: "name",
      key: "name",
      render: (_, record: IPlayer) => (
        <Space>
          <Avatar 
            style={{ 
              backgroundColor: record.active ? '#1890ff' : '#ccc',
              color: '#fff'
            }}
          >
            {getInitials(record.name || "")}
          </Avatar>
          <div>
            <Text strong>{record.name}</Text>
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {record.email}
              </Text>
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "Contact Info",
      key: "contactInfo",
      render: (_, record: IPlayer) => (
        <Space direction="vertical" size="small">
          <div>
            <SkypeOutlined style={{ color: '#1890ff', marginRight: 6 }} />
            <Text>{record.skypeId}</Text>
          </div>
          <div>
            <PhoneOutlined style={{ color: '#1890ff', marginRight: 6 }} />
            <Text>{record.mobileNo}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Employee ID",
      dataIndex: "employeeId",
      key: "employeeId",
      render: (value) => <Tag color="blue">{value}</Tag>,
    },
    {
      title: "Status",
      dataIndex: "active",
      key: "active",
      render: (active: boolean) => (
        <Tag color={active ? "success" : "error"} icon={active ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
          {active ? "Active" : "Inactive"}
        </Tag>
      ),
    },
  ];

  const playersColumn: ColumnsType<IPlayer> = loginInfo.roles.includes("ADMIN")
    ? [
        ...CommonColumns,
        {
          title: "Action",
          key: "action",
          render: (_: any, record: IPlayer) => (
            <Space size="small" className="mobile-action-buttons">
              <Button 
                type="primary" 
                ghost 
                size="small"
                icon={<EditTwoTone />}
                onClick={() => navigate(`/players/${record.id}`)}
              >
                Edit
              </Button>
              <Button
                type="dashed" 
                size="small"
                icon={<LockTwoTone />}
                onClick={() => showPasswordModal(record)}
              >
                Reset
              </Button>
            </Space>
          ),
        },
      ]
    : CommonColumns;

  // Calculate tab counts
  const allCount = playersData?.content?.length || 0;
  const activeCount = playersData?.content?.filter(player => player.active).length || 0;
  const inactiveCount = playersData?.content?.filter(player => !player.active).length || 0;

  return (
    <Card 
      bordered={false}
      className="player-list-card"
    >
      <Row justify="space-between" align="middle" className="player-header-row">
        <Col xs={24} sm={8} md={8}>
          <Space align="center">
            <TeamOutlined style={{ fontSize: 24 }} />
            <Title level={3} className="player-title" style={{ margin: 0 }}>Players</Title>
          </Space>
        </Col>
        <Col xs={24} sm={16} md={16}>
          <div className="player-search-actions">
            <Input.Search
              placeholder="Search players"
              onSearch={handleSearch}
              onChange={(e) => handleSearch(e.target.value)}
              className="player-search-input"
              prefix={<SearchOutlined />}
              allowClear
              size="middle"
            />
            
            {loginInfo.roles.includes("ADMIN") && (
              <Link to={"/player"}>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  size="middle"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  Add Player
                </Button>
              </Link>
            )}
          </div>
        </Col>
      </Row>

      <Row align="middle" style={{ marginBottom: 12 }}>
        <Col flex="auto">
          <Tabs 
            defaultActiveKey="all" 
            onChange={handleTabChange}
            type="card"
            size="small"
            style={{ marginBottom: 0 }}
          >
            <TabPane 
              tab={
                <span>
                  <UserOutlined /> 
                  All
                  <Badge count={allCount} size="small" style={{ marginLeft: 4, backgroundColor: '#1890ff', fontSize: '9px' }} />
                </span>
              } 
              key="all"
            />
            <TabPane 
              tab={
                <span>
                  <CheckCircleOutlined /> 
                  Active 
                  <Badge count={activeCount} size="small" style={{ marginLeft: 4, backgroundColor: '#52c41a', fontSize: '9px' }} />
                </span>
              } 
              key="active"
            />
            <TabPane 
              tab={
                <span>
                  <CloseCircleOutlined /> 
                  Inactive 
                  <Badge count={inactiveCount} size="small" style={{ marginLeft: 4, backgroundColor: '#ff4d4f', fontSize: '9px' }} />
                </span>
              } 
              key="inactive"
            />
          </Tabs>
        </Col>
      </Row>

      <Table
        loading={isLoading}
        dataSource={filteredPlayers}
        columns={playersColumn}
        pagination={{
          showTotal: (total, range) => window.innerWidth < 768 ? `${range[0]}-${range[1]} of ${total}` : `Total ${total} records`,
          pageSize: 9,
          showSizeChanger: window.innerWidth >= 768,
          pageSizeOptions: ['10', '20', '50'],
          responsive: true,
          showLessItems: window.innerWidth < 768,
          size: window.innerWidth < 768 ? 'small' : 'default'
        }}
        rowKey="id"
        scroll={{ x: "max-content" }}
        style={{ 
          borderRadius: 4,
          overflow: 'hidden'
        }}
        size="small"
        className="compact-table"
      />

      {/* Updated Reset Password modal */}
      <Modal
        title={
          <Space align="center">
            <LockTwoTone twoToneColor="#1890ff" style={{ fontSize: 20 }} />
            <span style={{ fontSize: 16 }}>Reset Password for <strong>{selectedPlayer?.name}</strong></span>
          </Space>
        }
        visible={isPasswordModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            onClick={handlePasswordUpdate}
            disabled={!isPasswordValid() || passwordStrength === "weak"}
            loading={false}
          >
            Reset Password
          </Button>
        ]}
        width={500}
        maskClosable={false}
        destroyOnClose={true}
        className="reset-password-modal"
      >
        <div style={{ marginBottom: 24 }}>
          <p>Please create a new password for this user. It should be:</p>
          <ul style={{ paddingLeft: 20, color: '#666' }}>
            <li>At least 8 characters long</li>
            <li>Include a mix of letters, numbers, and symbols</li>
          </ul>
        </div>
        
        <Form layout="vertical">
          <Form.Item 
            label="New Password" 
            validateStatus={passwordStrength === "weak" ? "error" : "success"}
            help={passwordStrength === "weak" ? "Password is too weak" : null}
          >
            <Input.Password
              placeholder="Enter new password"
              value={password}
              onChange={handlePasswordChange}
              autoComplete="new-password"
              prefix={<LockTwoTone twoToneColor={getPasswordStrengthColor()} />}
            />
            {password && (
              <div style={{ marginTop: 8 }}>
                <Space>
                  <div>Strength:</div>
                  <div 
                    style={{ 
                      width: 60, 
                      height: 6, 
                      background: getPasswordStrengthColor(), 
                      borderRadius: 3 
                    }} 
                  />
                  <div style={{ color: getPasswordStrengthColor() }}>
                    {passwordStrength === "weak" && "Weak"}
                    {passwordStrength === "medium" && "Medium"}
                    {passwordStrength === "strong" && "Strong"}
                  </div>
                </Space>
              </div>
            )}
          </Form.Item>
          
          <Form.Item 
            label="Confirm Password" 
            validateStatus={passwordError ? "error" : confirmPassword ? "success" : ""}
            help={passwordError || null}
          >
            <Input.Password
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              autoComplete="new-password"
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

export default Players;
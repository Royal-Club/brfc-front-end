import {
  EditOutlined,
  LockOutlined,
  LockTwoTone,
  PlusOutlined,
  SearchOutlined,
  SkypeOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  SafetyCertificateTwoTone
} from "@ant-design/icons";
import {
  Button,
  Modal,
  Space,
  Table,
  Input,
  message,
  Typography,
  Tag,
  Avatar,
  Form,
  Select,
  Segmented,
  Pagination,
  Spin,
  Empty
} from "antd";
import { Link, useNavigate } from "react-router-dom";
import IPlayer from "../../interfaces/IPlayer";
import { useGetPlayersQuery } from "../../state/features/player/playerSlice";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import { ColumnsType } from "antd/es/table";
import { useResetPlayerPasswordMutation } from "../../state/features/auth/authSlice";
import { useGetRolesQuery, useAssignRolesMutation } from "../../state/features/roles/rolesSlice";
import { toAbsolutePlayerPhotoUrl } from "../../utils/playerPhotoUtils";
import { club, scoreNum } from "../../theme/clubTheme";
import useIsMobile from "../../hooks/useIsMobile";
import "./Players.css";

const { Title, Text } = Typography;

function Players() {
  const navigate = useNavigate();
  const { data: playersData, isLoading, refetch } = useGetPlayersQuery();
  const [resetPlayerPassword] = useResetPlayerPasswordMutation();
  const { data: rolesData } = useGetRolesQuery();
  const [assignRoles] = useAssignRolesMutation();
  const loginInfo = useSelector(selectLoginInfo);

  // State for handling the password change modal
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<IPlayer | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPlayers, setFilteredPlayers] = useState<IPlayer[]>([]);
  const [activeTabKey, setActiveTabKey] = useState("all");
  const isMobile = useIsMobile(576);
  const [mobilePage, setMobilePage] = useState(1);
  const mobilePageSize = 8;

  // Add these new states for password form validation
  const [passwordError, setPasswordError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong" | "">("");

  // State for handling the roles modal
  const [isRolesModalVisible, setIsRolesModalVisible] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  
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

  // Function to handle opening the roles modal
  const showRolesModal = (player: IPlayer) => {
    setSelectedPlayer(player);
    setIsRolesModalVisible(true);
    // Pre-select current player roles
    const currentRoleIds = player.roles?.map(role => role.id) || [];
    setSelectedRoles(currentRoleIds);
  };

  // Function to close the roles modal
  const handleRolesCancel = () => {
    setIsRolesModalVisible(false);
    setSelectedRoles([]);
    setSelectedPlayer(null);
  };

  // Function to handle roles assignment
  const handleRolesUpdate = () => {
    if (!selectedPlayer) return;

    Modal.confirm({
      title: "Are you sure?",
      content: `Do you really want to update roles for ${selectedPlayer.name}?`,
      onOk: () => {
        assignRoles({
          playerRoleMappings: {
            [selectedPlayer.id.toString()]: selectedRoles,
          },
        })
          .unwrap()
          .then(() => {
            message.success("Roles updated successfully");
            handleRolesCancel();
            refetch();
          })
          .catch((err) => {
            message.error(err?.data?.message || "Failed to update roles");
          });
      },
    });
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

  // Treat empty strings, whitespace and placeholder dashes as "no data"
  const hasText = (value?: string | null) => {
    const trimmed = value?.trim();
    return !!trimmed && trimmed !== "—" && trimmed !== "-";
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
            src={toAbsolutePlayerPhotoUrl(record.photoUrl) || undefined}
            style={{
              backgroundColor: record.active ? club.navySoft : "rgba(128,128,128,0.15)",
              color: club.goldSoft,
              border: `2px solid ${record.active ? club.gold : "rgba(128,128,128,0.35)"}`,
              fontWeight: 600,
            }}
          >
            {getInitials(record.name || "")}
          </Avatar>
          <div>
            <Text strong style={{ display: "block", lineHeight: 1.3 }}>{record.name}</Text>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {record.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Contact Info",
      key: "contactInfo",
      render: (_, record: IPlayer) => (
        <Space direction="vertical" size={4}>
          {hasText(record.skypeId) && (
            <Space size={7}>
              <SkypeOutlined style={{ color: club.gold, fontSize: 13 }} />
              <Text type="secondary" style={{ fontSize: 13 }}>{record.skypeId}</Text>
            </Space>
          )}
          {hasText(record.mobileNo) && (
            <Space size={7}>
              <PhoneOutlined style={{ color: club.gold, fontSize: 13 }} />
              <Text type="secondary" style={{ fontSize: 13, ...scoreNum }}>{record.mobileNo}</Text>
            </Space>
          )}
          {!hasText(record.skypeId) && !hasText(record.mobileNo) && (
            <Text type="secondary" style={{ fontSize: 13 }}>—</Text>
          )}
        </Space>
      ),
    },
    {
      title: "Employee ID",
      dataIndex: "employeeId",
      key: "employeeId",
      render: (value) => <span className="brfc-empid">{value || "—"}</span>,
    },
    {
      title: "Status",
      dataIndex: "active",
      key: "active",
      render: (active: boolean) => (
        <span className={`brfc-status brfc-status--${active ? "active" : "inactive"}`}>
          <span className="brfc-status__dot" />
          {active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      title: "Roles",
      dataIndex: "roles",
      key: "roles",
      render: (roles: Array<{ id: number; name: string }>) => (
        <Space size={[4, 4]} wrap>
          {roles && roles.length > 0 ? (
            roles.map((role) => (
              <span key={role.id} className="brfc-role-tag">{role.name}</span>
            ))
          ) : (
            <span className="brfc-role-tag brfc-role-tag--empty">No Roles</span>
          )}
        </Space>
      ),
    },
  ];

  const playersColumn: ColumnsType<IPlayer> = (loginInfo.roles.includes("ADMIN") || loginInfo.roles.includes("SUPERADMIN"))
    ? [
        ...CommonColumns,
        {
          title: "Action",
          key: "action",
          render: (_: any, record: IPlayer) => (
            <Space size={6} className="mobile-action-buttons" wrap>
              <Button
                size="small"
                icon={<EditOutlined />}
                className="brfc-act-btn brfc-act-btn--gold"
                onClick={() => navigate(`/players/${record.id}`)}
              >
                Edit
              </Button>
              <Button
                size="small"
                icon={<LockOutlined />}
                className="brfc-act-btn"
                onClick={() => showPasswordModal(record)}
              >
                Reset
              </Button>
              {loginInfo.roles.includes("SUPERADMIN") && (
                <Button
                  size="small"
                  icon={<SafetyCertificateOutlined />}
                  className="brfc-act-btn brfc-act-btn--green"
                  onClick={() => showRolesModal(record)}
                >
                  Set Roles
                </Button>
              )}
            </Space>
          ),
        },
      ]
    : CommonColumns;

  // Calculate tab counts
  const allCount = playersData?.content?.length || 0;
  const activeCount = playersData?.content?.filter(player => player.active).length || 0;
  const inactiveCount = playersData?.content?.filter(player => !player.active).length || 0;

  const renderTabLabel = (label: string, count: number, tone: string) => (
    <span className="brfc-seg-label">
      {label}
      <span className="brfc-seg-count" style={{ background: `${tone}22`, color: tone, border: `1px solid ${tone}55` }}>
        {count}
      </span>
    </span>
  );

  const isAdmin = loginInfo.roles.includes("ADMIN") || loginInfo.roles.includes("SUPERADMIN");
  const isSuperAdmin = loginInfo.roles.includes("SUPERADMIN");

  // Mobile-only list: each player as a stacked card so contact info, roles and
  // actions are all visible without the horizontal table scroll.
  const renderMobilePlayers = () => {
    if (isLoading) {
      return (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin />
        </div>
      );
    }
    if (!filteredPlayers.length) {
      return <Empty description="No players found" />;
    }
    const start = (mobilePage - 1) * mobilePageSize;
    const paged = filteredPlayers.slice(start, start + mobilePageSize);
    return (
      <>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {paged.map((record) => (
            <div key={record.id} className="brfc-player-mcard">
              <div className="brfc-player-mcard__top">
                <Avatar
                  src={toAbsolutePlayerPhotoUrl(record.photoUrl) || undefined}
                  size={44}
                  style={{
                    flexShrink: 0,
                    backgroundColor: record.active ? club.navySoft : "rgba(128,128,128,0.15)",
                    color: club.goldSoft,
                    border: `2px solid ${record.active ? club.gold : "rgba(128,128,128,0.35)"}`,
                    fontWeight: 600,
                  }}
                >
                  {getInitials(record.name || "")}
                </Avatar>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text strong style={{ display: "block", lineHeight: 1.3 }} ellipsis>
                    {record.name}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }} ellipsis>
                    {record.email}
                  </Text>
                </div>
                <span className={`brfc-status brfc-status--${record.active ? "active" : "inactive"}`}>
                  <span className="brfc-status__dot" />
                  {record.active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="brfc-player-mcard__meta">
                {hasText(record.skypeId) && (
                  <Space size={7}>
                    <SkypeOutlined style={{ color: club.gold, fontSize: 13 }} />
                    <Text type="secondary" style={{ fontSize: 13 }}>{record.skypeId}</Text>
                  </Space>
                )}
                {hasText(record.mobileNo) && (
                  <Space size={7}>
                    <PhoneOutlined style={{ color: club.gold, fontSize: 13 }} />
                    <Text type="secondary" style={{ fontSize: 13, ...scoreNum }}>{record.mobileNo}</Text>
                  </Space>
                )}
                <Space size={7}>
                  <span style={{ color: club.gold, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4 }}>ID</span>
                  <span className="brfc-empid">{record.employeeId || "—"}</span>
                </Space>
              </div>

              <Space size={[4, 4]} wrap style={{ marginTop: 8 }}>
                {record.roles && record.roles.length > 0 ? (
                  record.roles.map((role) => (
                    <span key={role.id} className="brfc-role-tag">{role.name}</span>
                  ))
                ) : (
                  <span className="brfc-role-tag brfc-role-tag--empty">No Roles</span>
                )}
              </Space>

              {isAdmin && (
                <Space size={6} wrap style={{ marginTop: 10 }}>
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    className="brfc-act-btn brfc-act-btn--gold"
                    onClick={() => navigate(`/players/${record.id}`)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    icon={<LockOutlined />}
                    className="brfc-act-btn"
                    onClick={() => showPasswordModal(record)}
                  >
                    Reset
                  </Button>
                  {isSuperAdmin && (
                    <Button
                      size="small"
                      icon={<SafetyCertificateOutlined />}
                      className="brfc-act-btn brfc-act-btn--green"
                      onClick={() => showRolesModal(record)}
                    >
                      Set Roles
                    </Button>
                  )}
                </Space>
              )}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
          <Pagination
            current={mobilePage}
            pageSize={mobilePageSize}
            total={filteredPlayers.length}
            size="small"
            showLessItems
            onChange={setMobilePage}
          />
        </div>
      </>
    );
  };

  return (
    <div className="player-list-card">
      {/* Page header */}
      <div className="player-header-row">
        <div style={{ minWidth: 0 }}>
          <Title level={3} className="player-title" style={{ margin: 0, lineHeight: 1.1 }}>Players</Title>
        </div>
        <div className="player-search-actions">
          <Input
            placeholder="Search players"
            onChange={(e) => handleSearch(e.target.value)}
            className="player-search-input"
            prefix={<SearchOutlined />}
            allowClear
            size="middle"
          />

          {(loginInfo.roles.includes("ADMIN") || loginInfo.roles.includes("SUPERADMIN")) && (
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
      </div>

      {/* Gold divider under the header */}
      <div className="player-gold-divider" />

      <div style={{ marginBottom: 14, overflowX: "auto" }}>
        <Segmented
          value={activeTabKey}
          onChange={(v) => handleTabChange(v as string)}
          options={[
            { label: renderTabLabel("All", allCount, club.gold), value: "all" },
            { label: renderTabLabel("Active", activeCount, club.pitch), value: "active" },
            { label: renderTabLabel("Inactive", inactiveCount, "#E0736B"), value: "inactive" },
          ]}
        />
      </div>

      {isMobile ? (
        renderMobilePlayers()
      ) : (
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
            borderRadius: 10,
            overflow: 'hidden'
          }}
          size="small"
          className="compact-table brfc-players-table"
        />
      )}

      {/* Updated Reset Password modal */}
      <Modal
        title={
          <Space align="center">
            <LockTwoTone twoToneColor="#c6a15b" style={{ fontSize: 20 }} />
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

      {/* Set Roles Modal */}
      <Modal
        title={
          <Space align="center">
            <SafetyCertificateTwoTone twoToneColor="#52c41a" style={{ fontSize: 20 }} />
            <span style={{ fontSize: 16 }}>Set Roles for <strong>{selectedPlayer?.name}</strong></span>
          </Space>
        }
        visible={isRolesModalVisible}
        onCancel={handleRolesCancel}
        footer={[
          <Button key="cancel" onClick={handleRolesCancel}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleRolesUpdate}
            disabled={selectedRoles.length === 0}
          >
            Update Roles
          </Button>
        ]}
        width={500}
        maskClosable={false}
        destroyOnClose={true}
        className="roles-modal"
      >
        {selectedPlayer?.roles && selectedPlayer.roles.length > 0 && (
          <div className="current-roles-section">
            <Text strong style={{ fontSize: '13px' }}>Current Roles:</Text>
            <div style={{ marginTop: 8 }}>
              {selectedPlayer.roles.map((role) => (
                <Tag key={role.id} color="geekblue" style={{ marginBottom: 4 }}>
                  {role.name}
                </Tag>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: '14px' }}>Select the roles you want to assign to this user:</Text>
        </div>

        <Form layout="vertical">
          <Form.Item label="Roles" style={{ marginBottom: 16 }}>
            <Select
              mode="multiple"
              placeholder="Select roles"
              value={selectedRoles}
              onChange={(values) => setSelectedRoles(values)}
              style={{ width: "100%" }}
              optionFilterProp="children"
            >
              {rolesData?.content?.map((role) => (
                <Select.Option key={role.id} value={role.id}>
                  {role.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>

        {selectedRoles.length > 0 && (
          <div className="selected-roles-section">
            <Text strong style={{ fontSize: '13px' }}>Selected Roles:</Text>
            <div style={{ marginTop: 8 }}>
              {selectedRoles.map((roleId) => {
                const role = rolesData?.content?.find((r) => r.id === roleId);
                return role ? (
                  <Tag key={roleId} color="blue" style={{ marginBottom: 4, marginRight: 4 }}>
                    {role.name}
                  </Tag>
                ) : null;
              })}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Players;
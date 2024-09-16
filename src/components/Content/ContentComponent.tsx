import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import {
    Avatar,
    Button,
    Col,
    Dropdown,
    Layout,
    Menu,
    Modal,
    Row,
    Space,
    Switch,
    theme,
} from "antd";
import { useState } from "react";
import { useSelector } from "react-redux";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useAuthHook } from "../../hooks/useAuthHook";
import { useGetUserProfileQuery } from "../../state/features/auth/authSlice";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import AcCollection from "../Account/Collection/AcCollection";
import AcChart from "../Account/Configuration/AcChart";
import AcNature from "../Account/Configuration/AcNature";
import AcVoucherType from "../Account/Configuration/AcVoucherType";
import AcVouchers from "../Account/Voucher/AcVouchers";
import UserProfile from "../authPages/UserProfile";
import SettingsModal from "../CommonAtoms/SettingsModal";
import Dashboard from "../Dashboard/DashboardComponent";
import Player from "../Player/Player";
import Players from "../Player/Players";
import JoinTournament from "../Tournaments/JoinTournament";
import SingleTournament from "../Tournaments/SingleTournament";
import TournamentsPage from "../Tournaments/TournamentsPage";
import Venue from "../Venue/Venue";
import ContentOutlet from "./ContentOutlet";

const { Header, Content } = Layout;

interface ContentComponentProps {
  onToggleCollapse: (value: boolean) => void;
  collapsed: boolean;
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
}

const ContentComponent: React.FC<ContentComponentProps> = ({
  onToggleCollapse,
  collapsed,
  isDarkMode,
  setIsDarkMode,
}) => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  const loginInfo = useSelector(selectLoginInfo);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const { user, logout } = useAuthHook();
  const navigate = useNavigate();

  const { data: playerProfileData, refetch } = useGetUserProfileQuery({
    id: loginInfo?.userId,
  });

  const handleSettingsClick = () => {
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    refetch();
    setIsModalVisible(false);
  };

  const handleThemeChange = (checked: boolean) => {
    setIsDarkMode(checked);
    localStorage.setItem("isDarkMode", String(checked));
  };

  const confirmLogout = () => {
    Modal.confirm({
      title: "Confirm Logout",
      content: "Are you sure you want to logout?",
      okText: "Yes",
      cancelText: "No",
      onOk: () => {
        logout();
      },
    });
  };

  const items = [
    {
      label: "Profile",
      key: "1",
      onClick: () => {
        navigate("/profile");
      },
    },
    {
      label: "Settings",
      key: "2",
      onClick: () => {
        handleSettingsClick();
      },
    },
    {
      label: "Logout",
      key: "3",
      onClick: () => confirmLogout(),
    },
  ];

  return (
    <>
      <Layout>
        {user?.token && (
          <Header
            style={{
              padding: 0,
              backgroundColor: colorBgContainer,
            }}
          >
            <Row justify="space-between" align="middle">
              <Col>
                <Button
                  type="text"
                  icon={
                    collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />
                  }
                  onClick={() => {
                    onToggleCollapse(!collapsed);
                  }}
                  style={{
                    fontSize: "16px",
                    width: 64,
                    height: 64,
                  }}
                />
              </Col>
              <Col
                style={{
                  textAlign: "right",
                  paddingRight: 32,
                  cursor: "pointer",
                }}
              >
                <Switch
                  checked={isDarkMode}
                  onChange={handleThemeChange}
                  checkedChildren="Dark"
                  unCheckedChildren="Light"
                />

                {user.token && (
                  <Dropdown
                    overlay={<Menu items={items} />}
                    trigger={["click"]}
                  >
                    <Space>
                      <Avatar src={user?.image} alt={user.username} />
                      {user.username}
                    </Space>
                  </Dropdown>
                )}
              </Col>
            </Row>
          </Header>
        )}
        <Content
          style={{
            minHeight: 360,
          }}
        >
          <Routes>
            <Route path="/" element={<ContentOutlet />}>
              <Route index element={<Dashboard />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/player" element={<Player />} />
              {loginInfo.roles.includes("ADMIN") && (
                <Route path="/players/:id" element={<Player />} />
              )}
              <Route path="/players" element={<Players />} />
              <Route path="/tournaments" element={<TournamentsPage />} />
              <Route
                path="/tournaments/team-building/:id"
                element={<SingleTournament />}
              />
              <Route
                path="/tournaments/join-tournament/:id"
                element={<JoinTournament />}
              />
              <Route path="venues" element={<Venue />} />
              <Route path="ac/voucher-types" element={<AcVoucherType />} />
              <Route path="/ac/natures" element={<AcNature />} />
              <Route path="ac/collections" element={<AcCollection />} />
              <Route path="ac/charts" element={<AcChart />} />
              {/* <Route path="ac/voucher" element={<AcVoucher />} /> */}
              <Route path="ac/vouchers" element={<AcVouchers />} />
              {/* <Route path="ac/vouchers/:id" element={<AcVoucher />} /> */}
            </Route>
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          {playerProfileData && (
            <SettingsModal
              visible={isModalVisible}
              onClose={handleModalClose}
              playerData={{
                id: playerProfileData?.content?.id,
                name: playerProfileData?.content?.name,
                email: playerProfileData?.content?.email,
                employeeId: playerProfileData?.content?.employeeId,
                fullName: playerProfileData?.content?.fullName,
                skypeId: playerProfileData?.content?.skypeId,
                mobileNo: playerProfileData?.content?.mobileNo,
                playingPosition: playerProfileData?.content?.playingPosition,
              }}
            />
          )}
        </Content>
      </Layout>
    </>
  );
};

export default ContentComponent;

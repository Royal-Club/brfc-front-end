import React, { useState } from "react";
import { Button, Dropdown, Menu, Modal, Select, message } from "antd";
import { MoreOutlined } from "@ant-design/icons";
import { IoTournamentSingleSummaryType } from "../../../state/features/tournaments/tournamentTypes";
import CreateTournament from "./CreateTournamentModal";
import { useUpdateTournamentActiveStatusMutation, useConcludeTournamentMutation } from "../../../state/features/tournaments/tournamentsSlice";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../../state/slices/loginInfoSlice";

const { Option } = Select;

interface TournamentsActionDropdownProps {
  record: IoTournamentSingleSummaryType;
  onMenuClick: (e: any, record: IoTournamentSingleSummaryType) => void;
  tournamentId?: number;
}

const TournamentsActionDropdown: React.FC<TournamentsActionDropdownProps> = ({
  record,
  onMenuClick,
  tournamentId,
}) => {
  const [updateTournamentActiveStatus] =
    useUpdateTournamentActiveStatusMutation();
  const [concludeTournament] = useConcludeTournamentMutation();
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const [isActiveStatusModalVisible, setIsActiveStatusModalVisible] =
    useState(false);
  const [isConcludeModalVisible, setIsConcludeModalVisible] = useState(false);
  const [activeStatus, setActiveStatus] = useState(record.activeStatus);

  const loginInfo = useSelector(selectLoginInfo);

  const handleSetIsUpdateModalVisible = (value: boolean) => {
    setIsUpdateModalVisible(value);
  };

  const handleMenuClick = (e: any) => {
    if (e?.key === "update") {
      handleSetIsUpdateModalVisible(true);
    } else if (e?.key === "active-status") {
      setIsActiveStatusModalVisible(true);
    } else if (e?.key === "conclude") {
      setIsConcludeModalVisible(true);
    }

    onMenuClick(e, record);
  };

  const handleActiveStatusChange = (value: boolean) => {
    setActiveStatus(value);
  };

  const handleUpdateActiveStatus = () => {
    updateTournamentActiveStatus({
      id: record.id,
      activeStatus: activeStatus,
    })
      .unwrap()
      .then(() => {
        message.success("Active status updated successfully");
        setIsActiveStatusModalVisible(false);
      });
  };

  const handleConclude = () => {
    concludeTournament({ id: record.id })
      .unwrap()
      .then(() => {
        message.success("Tournament concluded successfully");
        setIsConcludeModalVisible(false);
      })
      .catch(() => {
        message.error("Failed to conclude tournament");
      });
  };

  const menu = (
    <Menu onClick={handleMenuClick}>
      {record.activeStatus ? (
        <Menu.Item key="join">Join Tournament</Menu.Item>
      ) : null}
      <Menu.Item key="team-building">Team Building</Menu.Item>
      <Menu.Item key="fixtures">Teams and Fixtures</Menu.Item>
      {(loginInfo.roles.includes("ADMIN") || loginInfo.roles.includes("SUPERADMIN") || loginInfo.roles.includes("COORDINATOR")) && (
        <Menu.Item key="update">Update Tournament</Menu.Item>
      )}
      {(loginInfo.roles.includes("ADMIN") || loginInfo.roles.includes("SUPERADMIN") || loginInfo.roles.includes("COORDINATOR")) && (
        <Menu.Item key="active-status">Update Active Status</Menu.Item>
      )}
      {loginInfo.roles.includes("SUPERADMIN") && (
        <Menu.Item key="conclude" danger>Conclude Tournament</Menu.Item>
      )}
    </Menu>
  );

  return (
    <>
      <Dropdown overlay={menu} trigger={["click"]}>
        <Button icon={<MoreOutlined />} />
      </Dropdown>

      {/* Update Tournament Modal */}
      <CreateTournament
        tournamentId={tournamentId}
        isUpdateModalVisible={isUpdateModalVisible}
        handleSetIsUpdateModalVisible={handleSetIsUpdateModalVisible}
        tournamentData={record}
      />

      <Modal
        title="Update Active Status"
        visible={isActiveStatusModalVisible}
        onCancel={() => setIsActiveStatusModalVisible(false)}
        onOk={handleUpdateActiveStatus}
      >
        <Select
          defaultValue={record.activeStatus}
          onChange={handleActiveStatusChange}
          style={{ width: "100%" }}
        >
          <Option value={true}>Active</Option>
          <Option value={false}>Inactive</Option>
        </Select>
      </Modal>

      <Modal
        title="Conclude Tournament"
        visible={isConcludeModalVisible}
        onCancel={() => setIsConcludeModalVisible(false)}
        onOk={handleConclude}
        okText="Yes, Conclude"
        okButtonProps={{ danger: true }}
      >
        <p>Are you sure you want to conclude <strong>{record.name}</strong>? This will mark all unfinished matches as completed and cannot be undone.</p>
      </Modal>
    </>
  );
};

export default TournamentsActionDropdown;

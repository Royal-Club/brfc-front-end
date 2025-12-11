import React, { useState } from "react";
import { Tabs, Spin, Card, Alert } from "antd";
import {
  AppstoreOutlined,
  NodeIndexOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../../../state/slices/loginInfoSlice";
import { useGetTournamentStructureQuery } from "../../../../state/features/manualFixtures/manualFixturesSlice";
import InteractiveTournamentTab from "./Tabs/InteractiveTournamentTab";
import MatchesTab from "./Tabs/MatchesTab";

interface ManualFixturePanelProps {
  tournamentId: number;
  teams: Array<{ teamId: number; teamName: string }>;
}

export default function ManualFixturePanel({
  tournamentId,
  teams,
}: ManualFixturePanelProps) {
  const loginInfo = useSelector(selectLoginInfo);
  const isAdmin =
    loginInfo.roles?.includes("ADMIN") ||
    loginInfo.roles?.includes("SUPER_ADMIN");

  const [activeTab, setActiveTab] = useState("tournament");

  const {
    data: structureData,
    isLoading,
    refetch,
  } = useGetTournamentStructureQuery({ tournamentId });

  const tournamentStructure = structureData?.content;

  if (!isAdmin) {
    return (
      <Card>
        <Alert
          message="Access Restricted"
          description="Manual fixture management is only available to administrators."
          type="warning"
          showIcon
        />
      </Card>
    );
  }

  const tabItems = [
    {
      key: "tournament",
      label: (
        <span>
          <NodeIndexOutlined />
          Tournament
        </span>
      ),
      children: (
        <InteractiveTournamentTab
          tournamentId={tournamentId}
          teams={teams}
          tournamentStructure={tournamentStructure}
          isLoading={isLoading}
          onRefresh={refetch}
        />
      ),
    },
    {
      key: "matches",
      label: (
        <span>
          <UnorderedListOutlined />
          Matches
        </span>
      ),
      children: (
        <MatchesTab
          tournamentId={tournamentId}
          tournamentStructure={tournamentStructure}
          isLoading={isLoading}
          onRefresh={refetch}
        />
      ),
    },
  ];

  return (
    <Spin spinning={isLoading}>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="large"
        style={{ minHeight: "calc(100vh - 250px)" }}
      />
    </Spin>
  );
}

import React, { useEffect } from "react";
import { Tabs, Spin, Card, Alert } from "antd";
import {
  AppstoreOutlined,
  NodeIndexOutlined,
  UnorderedListOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../../../state/store";
import { selectLoginInfo } from "../../../../state/slices/loginInfoSlice";
import { useGetTournamentStructureQuery } from "../../../../state/features/manualFixtures/manualFixturesSlice";
import { setActiveTab } from "../../../../state/features/manualFixtures/manualFixturesUISlice";
import OverviewTab from "./Tabs/OverviewTab";
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
  const dispatch = useDispatch();
  const loginInfo = useSelector(selectLoginInfo);
  const isAdmin =
    loginInfo.roles?.includes("ADMIN") ||
    loginInfo.roles?.includes("SUPER_ADMIN");

  const activeTab = useSelector((state: RootState) => state.manualFixturesUI.activeTab);

  const {
    data: structureData,
    isLoading,
    refetch,
  } = useGetTournamentStructureQuery({ tournamentId });

  const tournamentStructure = structureData?.content;

  // Automatically refetch tournament structure when tab changes
  useEffect(() => {
    if (activeTab) {
      refetch();
    }
  }, [activeTab, refetch]);

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
      key: "overview",
      label: (
        <span>
          <BarChartOutlined />
          Overview
        </span>
      ),
      children: (
        <OverviewTab
          tournamentId={tournamentId}
          tournamentStructure={tournamentStructure}
          isLoading={isLoading}
          onRefresh={refetch}
          isActive={activeTab === "overview"}
        />
      ),
    },
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
          isActive={activeTab === "tournament"}
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
          isActive={activeTab === "matches"}
        />
      ),
    },
  ];

  return (
    <Spin spinning={isLoading}>
      <Tabs
        activeKey={activeTab}
        onChange={(key) => dispatch(setActiveTab(key))}
        items={tabItems}
        size="large"
        style={{ minHeight: "calc(100vh - 250px)" }}
      />
    </Spin>
  );
}

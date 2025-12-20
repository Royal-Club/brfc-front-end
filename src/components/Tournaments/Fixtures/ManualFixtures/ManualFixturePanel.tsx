import React, { useEffect } from "react";
import { Tabs, Spin, Card, Alert } from "antd";
import {
  AppstoreOutlined,
  NodeIndexOutlined,
  UnorderedListOutlined,
  BarChartOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../../../state/store";
import { useGetTournamentStructureQuery } from "../../../../state/features/manualFixtures/manualFixturesSlice";
import { setActiveTab } from "../../../../state/features/manualFixtures/manualFixturesUISlice";
import OverviewTab from "./Tabs/OverviewTab";
import StatisticsTab from "./Tabs/StatisticsTab";
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

  // if (!isAdmin) {
  //   return (
  //     <Card>
  //       <Alert
  //         message="Access Restricted"
  //         description="Manual fixture management is only available to administrators."
  //         type="warning"
  //         showIcon
  //       />
  //     </Card>
  //   );
  // }

  // Check if teams are added - disable fixtures tab if no teams
  const hasTeams = teams && teams.length > 0;

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
    // {
    //   key: "statistics",
    //   label: (
    //     <span>
    //       <TrophyOutlined />
    //       Statistics
    //     </span>
    //   ),
    //   children: (
    //     <StatisticsTab
    //       tournamentId={tournamentId}
    //       isActive={activeTab === "statistics"}
    //     />
    //   ),
    // },
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
      disabled: !hasTeams,
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

  // Prevent switching to disabled matches tab
  const handleTabChange = (key: string) => {
    if (key === "matches" && !hasTeams) {
      return; // Don't allow switching to matches tab if no teams
    }
    dispatch(setActiveTab(key));
  };

  return (
    <Spin spinning={isLoading}>
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={tabItems}
        size="large"
        style={{ minHeight: "calc(100vh - 250px)" }}
      />
    </Spin>
  );
}

import React, { useState, useMemo } from "react";
import { Card, Row, Col, Statistic, Select, Empty, Spin, Segmented, Space, Button, Tabs, Badge } from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
  EyeOutlined,
  EditOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  AppstoreOutlined,
  TableOutlined,
  UnorderedListOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../../state/slices/loginInfoSlice";
import { useGetFixturesQuery } from "../../../state/features/fixtures/fixturesSlice";
import FixtureGenerationModal from "./FixtureGenerationModal";
import ClearFixturesModal from "./ClearFixturesModal";
import EditFixtureModal from "./EditFixtureModal";
import FixturesTable from "./FixturesTable";
import FixturesCalendarView from "./Views/FixturesCalendarView";
import FixturesTimelineView from "./Views/FixturesTimelineView";
import FixturesListView from "./Views/FixturesListView";
import FixtureCardView from "./Views/FixtureCardView";
import { IFixture, MatchStatus } from "../../../state/features/fixtures/fixtureTypes";
import { getStatusColor } from "../../../utils/matchStatusUtils";

// Import view components

interface FixturesPanelProps {
  tournamentId: number;
  teams: Array<{ teamId: number; teamName: string }>;
}

export default function FixturesPanel({
  tournamentId,
  teams,
}: FixturesPanelProps) {
  const loginInfo = useSelector(selectLoginInfo);
  const isAdmin = loginInfo.roles?.includes("ADMIN");
  const navigate = useNavigate();

  // State for modals and filters
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [editingFixture, setEditingFixture] = useState<IFixture | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"cards" | "table" | "calendar" | "timeline" | "list">("list");

  // Fetch fixtures
  const { data: fixturesData, isLoading, refetch } = useGetFixturesQuery({
    tournamentId,
  });

  const allFixtures = useMemo(() => fixturesData?.content || [], [fixturesData]);

  // Filter fixtures by status
  const fixtures = useMemo(() => {
    if (statusFilter === "ALL") return allFixtures;
    return allFixtures.filter((f) => f.matchStatus === statusFilter);
  }, [allFixtures, statusFilter]);

  const fixtureCount = allFixtures.length;

  // Count fixtures by status
  const scheduledCount = allFixtures.filter((f) => f.matchStatus === "SCHEDULED").length;
  const ongoingCount = allFixtures.filter((f) => f.matchStatus === "ONGOING").length;
  const pausedCount = allFixtures.filter((f) => f.matchStatus === "PAUSED").length;
  const completedCount = allFixtures.filter((f) => f.matchStatus === "COMPLETED").length;

  const handleEditFixture = (fixture: IFixture) => {
    setEditingFixture(fixture);
    setShowEditModal(true);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleReschedule = (fixtureId: number, newDate: string) => {
    // Find the fixture by ID
    const fixture = allFixtures.find(f => f.id === fixtureId);
    if (fixture) {
      handleEditFixture(fixture);
    }
  };

  return (
    <Spin spinning={isLoading}>
      <div style={{ padding: "16px" }}>
        {/* View Mode Selector */}
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]} align="middle" justify="space-between">
            <Col xs={24} md={12}>
              <Segmented
                value={viewMode}
                onChange={(value) => setViewMode(value as any)}
                options={[
                  { label: 'List', value: 'list', icon: <UnorderedListOutlined /> },
                  { label: 'Cards', value: 'cards', icon: <AppstoreOutlined /> },
                  { label: 'Table', value: 'table', icon: <TableOutlined /> },
                  { label: 'Calendar', value: 'calendar', icon: <CalendarOutlined /> },
                  { label: 'Timeline', value: 'timeline', icon: <ClockCircleOutlined /> },
                ]}
              />
            </Col>
            {isAdmin && (
              <Col xs={24} md={12} style={{ textAlign: "right" }}>
                <Space wrap>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setShowGenerateModal(true)}
                  >
                    Generate
                  </Button>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleRefresh}
                  >
                    Refresh
                  </Button>
                  {fixtureCount > 0 && (
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => setShowClearModal(true)}
                    >
                      Clear
                    </Button>
                  )}
                </Space>
              </Col>
            )}
          </Row>
        </Card>

        {/* Tabs as Status Filters */}
        <Tabs
          activeKey={statusFilter}
          onChange={setStatusFilter}
          type="card"
          style={{ marginBottom: 16 }}
          items={[
            {
              key: "ALL",
              label: (
                <span>
                  All <Badge count={fixtureCount} showZero style={{ backgroundColor: "#1890ff" }} />
                </span>
              ),
            },
            {
              key: "SCHEDULED",
              label: (
                <span>
                  <ClockCircleOutlined /> Scheduled <Badge count={scheduledCount} showZero style={{ backgroundColor: "#1890ff" }} />
                </span>
              ),
            },
            {
              key: "ONGOING",
              label: (
                <span>
                  <PlayCircleOutlined /> Ongoing <Badge count={ongoingCount} showZero style={{ backgroundColor: "#fa8c16" }} />
                </span>
              ),
            },
            {
              key: "PAUSED",
              label: (
                <span>
                  <PauseCircleOutlined /> Paused <Badge count={pausedCount} showZero style={{ backgroundColor: "#722ed1" }} />
                </span>
              ),
            },
            {
              key: "COMPLETED",
              label: (
                <span>
                  <CheckCircleOutlined /> Completed <Badge count={completedCount} showZero style={{ backgroundColor: "#52c41a" }} />
                </span>
              ),
            },
          ]}
        />

        {/* Content Area */}
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "48px" }}>
            <Spin size="large" />
          </div>
        ) : fixtures.length === 0 ? (
          <Empty description="No fixtures found" />
        ) : (
          <>
            {viewMode === 'list' && <FixturesListView fixtures={fixtures} />}
            {viewMode === 'cards' && (
              <FixtureCardView
                fixtures={fixtures}
                onEdit={handleEditFixture}
                onDataChange={handleRefresh}
              />
            )}
            {viewMode === 'table' && <FixturesTable fixtures={fixtures} />}
            {viewMode === 'calendar' && (
              <FixturesCalendarView
                fixtures={fixtures}
                onReschedule={handleReschedule}
              />
            )}
            {viewMode === 'timeline' && <FixturesTimelineView fixtures={fixtures} />}
          </>
        )}

        {/* Modals */}
        <FixtureGenerationModal
          tournamentId={tournamentId}
          isModalVisible={showGenerateModal}
          handleSetIsModalVisible={setShowGenerateModal}
          teams={teams}
          onSuccess={handleRefresh}
        />

        <ClearFixturesModal
          tournamentId={tournamentId}
          isModalVisible={showClearModal}
          handleSetIsModalVisible={setShowClearModal}
          fixtureCount={fixtureCount}
          onSuccess={() => {
            handleRefresh();
            setShowClearModal(false);
          }}
        />

        <EditFixtureModal
          fixture={editingFixture}
          isModalVisible={showEditModal}
          handleSetIsModalVisible={setShowEditModal}
          onSuccess={handleRefresh}
        />
      </div>
    </Spin>
  );
}

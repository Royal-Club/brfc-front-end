import React, { useState } from "react";
import {
  Card,
  Empty,
  Typography,
  Select,
  Space,
  Button,
  Row,
  Col,
  Statistic,
  message,
} from "antd";
import {
  ReloadOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { TournamentStructureResponse } from "../../../../../state/features/manualFixtures/manualFixtureTypes";
import { useGetFixturesQuery } from "../../../../../state/features/fixtures/fixturesSlice";
import FixturesTable from "../../FixturesTable";
import EditFixtureModal from "../../EditFixtureModal";
import { IFixture } from "../../../../../state/features/fixtures/fixtureTypes";

const { Text, Title } = Typography;
const { Option } = Select;

interface MatchesTabProps {
  tournamentId: number;
  tournamentStructure?: TournamentStructureResponse;
  isLoading: boolean;
  onRefresh: () => void;
}

export default function MatchesTab({
  tournamentId,
  tournamentStructure,
  isLoading,
  onRefresh,
}: MatchesTabProps) {
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [editingFixture, setEditingFixture] = useState<IFixture | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  // Fetch all fixtures for the tournament
  const {
    data: fixturesData,
    isLoading: fixturesLoading,
    refetch: refetchFixtures,
  } = useGetFixturesQuery({ tournamentId });

  const fixtures = fixturesData?.content || [];

  // Filter fixtures based on selections
  const filteredFixtures = fixtures.filter((fixture) => {
    // Filter by round (check if fixture's group belongs to selected round)
    if (selectedRoundId) {
      const round = tournamentStructure?.rounds.find((r) => r.id === selectedRoundId);
      if (round) {
        const groupIds = round.groups.map((g) => g.id);
        // Note: We need to add groupId to fixture response or use another method
        // For now, we'll skip this filter
      }
    }

    // Filter by status
    if (selectedStatus && fixture.matchStatus !== selectedStatus) {
      return false;
    }

    return true;
  });

  // Calculate statistics
  const stats = {
    total: fixtures.length,
    pending: fixtures.filter((f) => f.matchStatus === "PENDING").length,
    live: fixtures.filter((f) => f.matchStatus === "LIVE").length,
    completed: fixtures.filter((f) => f.matchStatus === "COMPLETED").length,
  };

  const handleRefresh = () => {
    refetchFixtures();
    onRefresh();
    message.success("Matches refreshed");
  };

  const handleClearFilters = () => {
    setSelectedRoundId(null);
    setSelectedGroupId(null);
    setSelectedStatus(null);
  };

  const handleEditFixture = (fixture: IFixture) => {
    setEditingFixture(fixture);
    setIsEditModalVisible(true);
  };

  const availableGroups =
    selectedRoundId && tournamentStructure
      ? tournamentStructure.rounds.find((r) => r.id === selectedRoundId)?.groups || []
      : [];

  if (!tournamentStructure || tournamentStructure.rounds.length === 0) {
    return (
      <Card style={{ margin: 24 }}>
        <Empty
          description={
            <div>
              <Text type="secondary">No matches available yet.</Text>
              <br />
              <Text type="secondary">
                Create rounds and generate matches in the Builder tab.
              </Text>
            </div>
          }
        />
      </Card>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      {/* Statistics */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Statistic
              title="Total Matches"
              value={stats.total}
              prefix={<TrophyOutlined />}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="Pending"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="Live"
              value={stats.live}
              prefix={<PlayCircleOutlined />}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="Completed"
              value={stats.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Col>
        </Row>
      </Card>

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Space size={4}>
              <FilterOutlined />
              <Text strong>Filters</Text>
            </Space>
            <Space>
              <Button size="small" onClick={handleClearFilters}>
                Clear Filters
              </Button>
              <Button
                type="primary"
                size="small"
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
              >
                Refresh
              </Button>
            </Space>
          </div>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Round
              </Text>
              <Select
                placeholder="All Rounds"
                style={{ width: "100%", marginTop: 4 }}
                allowClear
                value={selectedRoundId}
                onChange={setSelectedRoundId}
              >
                {tournamentStructure.rounds.map((round) => (
                  <Option key={round.id} value={round.id}>
                    {round.roundName} ({round.totalMatches} matches)
                  </Option>
                ))}
              </Select>
            </Col>

            <Col xs={24} sm={8}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Group
              </Text>
              <Select
                placeholder="All Groups"
                style={{ width: "100%", marginTop: 4 }}
                allowClear
                value={selectedGroupId}
                onChange={setSelectedGroupId}
                disabled={!selectedRoundId}
              >
                {availableGroups.map((group) => (
                  <Option key={group.id} value={group.id}>
                    {group.groupName} ({group.totalMatches} matches)
                  </Option>
                ))}
              </Select>
            </Col>

            <Col xs={24} sm={8}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Status
              </Text>
              <Select
                placeholder="All Statuses"
                style={{ width: "100%", marginTop: 4 }}
                allowClear
                value={selectedStatus}
                onChange={setSelectedStatus}
              >
                <Option value="PENDING">Pending</Option>
                <Option value="LIVE">Live</Option>
                <Option value="COMPLETED">Completed</Option>
                <Option value="PAUSED">Paused</Option>
              </Select>
            </Col>
          </Row>
        </Space>
      </Card>

      {/* Matches Table */}
      <Card
        title={
          <Space>
            <TrophyOutlined />
            <Text strong>
              Matches {filteredFixtures.length < fixtures.length && `(${filteredFixtures.length} of ${fixtures.length})`}
            </Text>
          </Space>
        }
      >
        <FixturesTable
          fixtures={filteredFixtures}
          isLoading={fixturesLoading || isLoading}
          onEditFixture={handleEditFixture}
        />
      </Card>

      {/* Edit Fixture Modal */}
      {editingFixture && (
        <EditFixtureModal
          fixture={editingFixture}
          isModalVisible={isEditModalVisible}
          handleSetIsModalVisible={setIsEditModalVisible}
          onSuccess={() => {
            refetchFixtures();
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

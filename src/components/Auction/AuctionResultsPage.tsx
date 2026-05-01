import React from "react";
import { Card, Table, Typography, Row, Col, Statistic, Tag, Collapse, Empty, Spin, Space, Alert } from "antd";
import { TrophyOutlined, WarningOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import { useGetAuctionResultsQuery, useGetAuctionSessionQuery } from "../../state/features/auction/auctionSlice";
import { AuctionPlayerResponse, TeamSquadResponse } from "../../state/features/auction/auctionTypes";

const { Title, Text } = Typography;

const AuctionResultsPage: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const tid = Number(tournamentId);
  const { data: results, isLoading } = useGetAuctionResultsQuery(tid);
  const { data: session } = useGetAuctionSessionQuery(tid);
  const isInProgress = session && session.status !== "COMPLETED" && session.status !== "NOT_STARTED";

  if (isLoading) return <Spin size="large" />;
  if (!results) return <Empty description="No auction results available" />;

  const stats = results.stats;
  const soldCount = (results.teamSquads ?? []).reduce((acc, s) => acc + (s.players?.length ?? 0), 0);
  const unsoldCount = results.unsoldPlayers?.length ?? 0;
  const totalPlayers = soldCount + unsoldCount;
  const totalSpent = (results.teamSquads ?? []).reduce((acc, s) => acc + (s.totalSpent ?? 0), 0);

  const playerColumns = [
    { title: "Player", dataIndex: "playerName", key: "playerName" },
    { title: "Category", dataIndex: "category", key: "category", render: (v: string) => <Tag>{v?.replace("_", " ")}</Tag> },
    { title: "Type", dataIndex: "playerType", key: "playerType", render: (v: string) => <Tag color={v === "OUTSIDE" ? "purple" : "default"}>{v}</Tag> },
    { title: "Base Price", dataIndex: "basePrice", key: "basePrice", render: (v: number) => `৳${v?.toLocaleString()}` },
    { title: "Sold Price", dataIndex: "finalPrice", key: "finalPrice", render: (v: number) => v ? `৳${v?.toLocaleString()}` : "—" },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Title level={3}><TrophyOutlined /> Auction Results - {results.tournamentName}</Title>

      {isInProgress && (
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          message="Auction is still in progress"
          description="These are partial results. Final results will be available once the auction is completed."
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4}><Card><Statistic title="Total Players" value={totalPlayers} /></Card></Col>
        <Col span={4}><Card><Statistic title="Sold" value={soldCount} /></Card></Col>
        <Col span={4}><Card><Statistic title="Unsold" value={unsoldCount} /></Card></Col>
        <Col span={4}><Card><Statistic title="Total Spent" value={totalSpent} prefix="৳" /></Card></Col>
        <Col span={8}>
          {stats?.mostExpensivePlayerName && (
            <Card>
              <Statistic
                title="Most Expensive"
                value={stats.mostExpensivePrice ?? 0}
                prefix="৳"
                suffix={<Text type="secondary">({stats.mostExpensivePlayerName})</Text>}
              />
            </Card>
          )}
        </Col>
      </Row>

      {/* Team Squads */}
      <Title level={4}>Team Squads</Title>
      <Collapse>
        {(results.teamSquads ?? []).map((squad: TeamSquadResponse) => (
          <Collapse.Panel
            key={squad.teamId}
            header={
              <Space>
                <Text strong>{squad.teamName}</Text>
                <Tag>Owner: {squad.ownerName}</Tag>
                <Tag color="green">Spent: ৳{squad.totalSpent?.toLocaleString()}</Tag>
                <Tag color="blue">Remaining: ৳{squad.remainingBudget?.toLocaleString()}</Tag>
                <Tag>{squad.players.length} players</Tag>
              </Space>
            }
          >
            <Table dataSource={squad.players} columns={playerColumns} rowKey="id" pagination={false} size="small" />
          </Collapse.Panel>
        ))}
      </Collapse>

      {/* Unsold Players */}
      {(results.unsoldPlayers ?? []).length > 0 && (
        <Card title="Unsold Players" style={{ marginTop: 24 }}>
        <Table dataSource={results.unsoldPlayers ?? []} columns={playerColumns} rowKey="id" pagination={false} size="small" />
        </Card>
      )}
    </div>
  );
};

export default AuctionResultsPage;

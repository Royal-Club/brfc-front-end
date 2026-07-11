import React, { useState } from "react";
import { Typography, Row, Col, Empty, Spin, Space, Alert } from "antd";
import { TrophyOutlined, WarningOutlined, CrownOutlined, DownOutlined, RightOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import { useGetAuctionResultsQuery, useGetAuctionSessionQuery } from "../../state/features/auction/auctionSlice";
import { TeamSquadResponse, AuctionPlayerResponse } from "../../state/features/auction/auctionTypes";
import { AuctionPage, AuctionHeader, StatTile, StatusPill, SignedTile, PanelCard, metaMuted, ac } from "./AuctionAtoms";

const { Title, Text } = Typography;

const taka = (v?: number) => `৳${(v ?? 0).toLocaleString()}`;

const moneyChip = (label: string, color: string) => (
  <span
    style={{
      fontSize: 11,
      fontWeight: 700,
      color,
      background: `${color}22`,
      border: `1px solid ${color}59`,
      borderRadius: 999,
      padding: "2px 10px",
      whiteSpace: "nowrap",
    }}
  >
    {label}
  </span>
);

const TeamSquadCard: React.FC<{ squad: TeamSquadResponse }> = ({ squad }) => {
  const [open, setOpen] = useState(true);
  const players = squad.players ?? [];

  return (
    <PanelCard accent={ac.gold} bodyStyle={{ padding: 0 }}>
      {/* Header (click to toggle) */}
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          cursor: "pointer",
          padding: "12px 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          {open ? <DownOutlined style={{ color: ac.textMuted, fontSize: 12 }} /> : <RightOutlined style={{ color: ac.textMuted, fontSize: 12 }} />}
          <Text strong ellipsis style={{ color: ac.textPrimary, fontSize: 15 }}>{squad.teamName}</Text>
          <span style={metaMuted}>· {squad.ownerName}</span>
        </div>
        <Space size={6} wrap>
          {moneyChip(`Spent ${taka(squad.totalSpent)}`, ac.gold)}
          {moneyChip(`Left ${taka(squad.remainingBudget)}`, ac.pitch)}
          {moneyChip(`${players.length} players`, ac.info)}
        </Space>
      </div>

      {/* Squad body */}
      {open && (
        <div style={{ padding: "0 12px 12px" }}>
          <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "0 0 12px" }} />
          {players.length === 0 ? (
            <Text style={{ color: ac.textMuted }}>No players bought.</Text>
          ) : (
            <Row gutter={[12, 12]}>
              {players.map((p: AuctionPlayerResponse, i: number) => (
                <Col xs={24} xl={12} key={p.id}>
                  <SignedTile
                    index={i + 1}
                    name={p.playerName}
                    photoUrl={p.photoUrl}
                    category={p.category}
                    price={p.finalPrice}
                    meta={
                      <>
                        {p.playerType && <span style={metaMuted}>{p.playerType}</span>}
                        <span style={metaMuted}>Base {taka(p.basePrice)}</span>
                      </>
                    }
                  />
                </Col>
              ))}
            </Row>
          )}
        </div>
      )}
    </PanelCard>
  );
};

const AuctionResultsPage: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const tid = Number(tournamentId);
  const { data: results, isLoading } = useGetAuctionResultsQuery(tid);
  const { data: session } = useGetAuctionSessionQuery(tid);
  const isInProgress = session && session.status !== "COMPLETED" && session.status !== "NOT_STARTED";

  if (isLoading) return <Spin size="large" style={{ display: "block", margin: "100px auto" }} />;
  if (!results) return <Empty description="No auction results available" style={{ marginTop: 80 }} />;

  const stats = results.stats;
  const soldCount = (results.teamSquads ?? []).reduce((acc, s) => acc + (s.players?.length ?? 0), 0);
  const unsoldCount = results.unsoldPlayers?.length ?? 0;
  const totalPlayers = soldCount + unsoldCount;
  const totalSpent = (results.teamSquads ?? []).reduce((acc, s) => acc + (s.totalSpent ?? 0), 0);

  return (
    <AuctionPage maxWidth={1180}>
      <AuctionHeader
        icon={<TrophyOutlined />}
        title={`Auction Results — ${results.tournamentName}`}
        backTo="/auction"
        actions={session?.status ? <StatusPill status={session.status} /> : undefined}
      />

      {isInProgress && (
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          message="Auction is still in progress"
          description="These are partial results. Final results will be available once the auction is completed."
        />
      )}

      {/* Stats */}
      <Row gutter={[12, 12]}>
        <Col xs={12} md={6}><StatTile label="Total Players" value={totalPlayers} accent={ac.info} /></Col>
        <Col xs={12} md={6}><StatTile label="Sold" value={soldCount} accent={ac.pitch} /></Col>
        <Col xs={12} md={6}><StatTile label="Unsold" value={unsoldCount} accent={ac.red} /></Col>
        <Col xs={12} md={6}><StatTile label="Total Spent" value={taka(totalSpent)} accent={ac.gold} /></Col>
        {stats?.mostExpensivePlayerName && (
          <Col xs={24}>
            <StatTile
              label="Most Expensive Signing"
              accent={ac.gold}
              icon={<CrownOutlined />}
              value={
                <span>
                  {taka(stats.mostExpensivePrice)}{" "}
                  <Text style={{ fontSize: 14, color: ac.textMuted, fontWeight: 500 }}>
                    · {stats.mostExpensivePlayerName}
                  </Text>
                </span>
              }
            />
          </Col>
        )}
      </Row>

      {/* Team Squads */}
      <Title level={4} style={{ margin: "8px 0 0" }}>Team Squads</Title>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {(results.teamSquads ?? []).map((squad: TeamSquadResponse) => (
          <TeamSquadCard key={squad.teamId} squad={squad} />
        ))}
      </div>

      {/* Unsold Players */}
      {(results.unsoldPlayers ?? []).length > 0 && (
        <>
          <Title level={4} style={{ margin: "8px 0 0" }}>Unsold Players</Title>
          <PanelCard bodyStyle={{ padding: 12 }}>
            <Row gutter={[12, 12]}>
              {(results.unsoldPlayers ?? []).map((p: AuctionPlayerResponse, i: number) => (
                <Col xs={24} xl={12} key={p.id}>
                  <SignedTile
                    index={i + 1}
                    name={p.playerName}
                    photoUrl={p.photoUrl}
                    category={p.category}
                    price={p.basePrice}
                    priceLabel="Base"
                    priceColor={ac.textMuted}
                    meta={
                      <>
                        {p.playerType && <span style={metaMuted}>{p.playerType}</span>}
                        {p.playingPosition && <span style={metaMuted}>{p.playingPosition}</span>}
                      </>
                    }
                  />
                </Col>
              ))}
            </Row>
          </PanelCard>
        </>
      )}
    </AuctionPage>
  );
};

export default AuctionResultsPage;

import React, { useEffect, useState } from "react";
import { Row, Col, Typography, Spin, Progress, Avatar, Segmented } from "antd";
import { ClockCircleOutlined, TeamOutlined, TrophyOutlined, FireOutlined, DollarOutlined, DownOutlined, RightOutlined } from "@ant-design/icons";
import {
  useGetAuctionDashboardQuery,
  useGetAuctionSettingsQuery,
  useGetAuctionPlayersQuery,
} from "../../state/features/auction/auctionSlice";
import { AuctionPlayerResponse, TeamBudgetResponse } from "../../state/features/auction/auctionTypes";
import {
  StatusPill,
  SignedTile,
  CategoryPill,
  metaMuted,
  ac,
  scoreNum,
  kicker,
} from "../Auction/AuctionAtoms";
import { toAbsolutePlayerPhotoUrl } from "../../utils/playerPhotoUtils";

const { Title, Text } = Typography;

const fmt = (n?: number) => (n != null ? `৳${n.toLocaleString()}` : "—");
const panel: React.CSSProperties = {
  background: ac.panel,
  border: `1px solid ${ac.panelBorder}`,
  borderRadius: 14,
  overflow: "hidden",
};
const panelHeader: React.CSSProperties = {
  padding: "10px 14px",
  borderBottom: `1px solid ${ac.panelBorder}`,
  ...kicker,
  color: ac.goldSoft,
};
const chip = (label: string, color: string) => (
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

// Ticks once a second so countdowns/timers update live.
const useNow = () => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
};

const CountdownUnit: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div style={{ textAlign: "center", minWidth: 64 }}>
    <div style={{ ...scoreNum, fontSize: 40, fontWeight: 900, color: ac.gold, lineHeight: 1 }}>
      {String(value).padStart(2, "0")}
    </div>
    <div style={{ ...kicker, color: ac.textMuted, fontSize: 10, marginTop: 4 }}>{label}</div>
  </div>
);

// A team card (collapsible) showing the squad it has bought.
const TeamCard: React.FC<{ team: TeamBudgetResponse; players: AuctionPlayerResponse[] }> = ({ team, players }) => {
  const [open, setOpen] = useState(true);
  return (
    <div style={panel}>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{ cursor: "pointer", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          {open ? <DownOutlined style={{ color: ac.textMuted, fontSize: 12 }} /> : <RightOutlined style={{ color: ac.textMuted, fontSize: 12 }} />}
          <Text strong ellipsis style={{ color: ac.textPrimary, fontSize: 15 }}>{team.teamName}</Text>
          {team.ownerName && <span style={metaMuted}>· {team.ownerName}</span>}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {chip(`Spent ${fmt(team.totalSpent)}`, ac.gold)}
          {chip(`Left ${fmt(team.remainingBudget)}`, ac.pitch)}
          {chip(`${players.length} players`, ac.info)}
        </div>
      </div>
      {open && (
        <div style={{ padding: "0 12px 12px" }}>
          <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "0 0 12px" }} />
          {players.length === 0 ? (
            <Text style={{ color: ac.textMuted }}>No players bought yet.</Text>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {players.map((p, i) => (
                <SignedTile
                  key={p.id}
                  index={i + 1}
                  name={p.playerName}
                  photoUrl={p.photoUrl}
                  category={p.category}
                  price={p.finalPrice}
                  meta={<span style={metaMuted}>Base {fmt(p.basePrice)}</span>}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface Props {
  tournamentId: number;
}

const ViewerAuctionTab: React.FC<Props> = ({ tournamentId }) => {
  const now = useNow();
  const [playerTab, setPlayerTab] = useState<"available" | "sold" | "unsold">("available");

  const { data: dashboard, isLoading } = useGetAuctionDashboardQuery(tournamentId, { pollingInterval: 8000 });
  const { data: settings } = useGetAuctionSettingsQuery(tournamentId);
  const { data: allPlayers = [] } = useGetAuctionPlayersQuery(tournamentId, { pollingInterval: 8000 });

  const session = dashboard?.session;
  const status = session?.status || "NOT_STARTED";
  const currentPlayer = dashboard?.currentPlayer;
  const teamBudgets = dashboard?.teamBudgets || [];
  const soldPlayers = dashboard?.soldPlayers || [];
  const unsoldPlayers = dashboard?.unsoldPlayers || [];
  const bids = dashboard?.currentPlayerBids || [];

  // Players still waiting to go up (not sold yet).
  const availablePlayers = [...allPlayers]
    .filter((p) => p.status === "AVAILABLE" || p.status === "ON_AUCTION")
    .sort((a, b) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0));

  if (isLoading) return <Spin size="large" style={{ display: "block", margin: "80px auto" }} />;

  // ── Not started → countdown / status ──────────────────────────────────────
  if (status === "NOT_STARTED") {
    const target = settings?.scheduledStartTime ? new Date(settings.scheduledStartTime).getTime() : null;
    const diff = target ? Math.max(0, target - now) : null;
    const totalPlayers = dashboard?.totalPlayers ?? 0;

    return (
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ ...panel, textAlign: "center", padding: "36px 24px", position: "relative" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 160, background: "radial-gradient(ellipse at 50% 0%, rgba(198,161,91,0.16), transparent 72%)", pointerEvents: "none" }} />
          <div style={{ position: "relative" }}>
            <FireOutlined style={{ fontSize: 40, color: ac.gold, marginBottom: 12 }} />
            <Title level={3} style={{ margin: 0, color: ac.textPrimary }}>Player Auction</Title>

            {diff != null && diff > 0 ? (
              <>
                <Text style={{ color: ac.textMuted, display: "block", margin: "6px 0 22px" }}>Starts in</Text>
                <div style={{ display: "flex", justifyContent: "center", gap: 18, flexWrap: "wrap" }}>
                  <CountdownUnit value={Math.floor(diff / 86400000)} label="Days" />
                  <CountdownUnit value={Math.floor((diff / 3600000) % 24)} label="Hours" />
                  <CountdownUnit value={Math.floor((diff / 60000) % 60)} label="Min" />
                  <CountdownUnit value={Math.floor((diff / 1000) % 60)} label="Sec" />
                </div>
                {settings?.scheduledStartTime && (
                  <Text style={{ color: ac.textMuted, fontSize: 12, display: "block", marginTop: 18 }}>
                    {new Date(settings.scheduledStartTime).toLocaleString()}
                  </Text>
                )}
              </>
            ) : (
              <Text style={{ color: ac.textMuted, display: "block", marginTop: 10 }}>
                {target ? "Starting any moment now…" : "The auction hasn't started yet. Check back soon!"}
              </Text>
            )}

            {totalPlayers > 0 && (
              <div style={{ marginTop: 24, display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
                <span style={{ color: ac.textMuted }}><TeamOutlined style={{ color: ac.gold, marginRight: 6 }} />{teamBudgets.length} teams</span>
                <span style={{ color: ac.textMuted }}><FireOutlined style={{ color: ac.gold, marginRight: 6 }} />{totalPlayers} players in the pool</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Shared pieces (running & completed) ───────────────────────────────────
  const teamsSection = teamBudgets.length > 0 && (
    <div>
      <Title level={4} style={{ margin: "0 0 10px", color: ac.textPrimary }}>Teams</Title>
      <Row gutter={[12, 12]} align="top">
        {teamBudgets.map((tb) => (
          <Col xs={24} lg={12} key={tb.teamId}>
            <TeamCard team={tb} players={soldPlayers.filter((p) => p.soldToTeamId === tb.teamId)} />
          </Col>
        ))}
      </Row>
    </div>
  );

  // Only show tabs that actually have players; pick a valid active tab.
  const playerTabDefs = [
    { key: "available" as const, label: "Available", list: availablePlayers },
    { key: "sold" as const, label: "Sold", list: soldPlayers },
    { key: "unsold" as const, label: "Unsold", list: unsoldPlayers },
  ].filter((t) => t.list.length > 0);

  const activeTabKey = playerTabDefs.some((t) => t.key === playerTab) ? playerTab : playerTabDefs[0]?.key;
  const activeList = playerTabDefs.find((t) => t.key === activeTabKey)?.list ?? [];

  const playersSection = playerTabDefs.length > 0 && (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
        <Title level={4} style={{ margin: 0, color: ac.textPrimary }}>Players</Title>
        <Segmented
          value={activeTabKey}
          onChange={(v) => setPlayerTab(v as typeof playerTab)}
          options={playerTabDefs.map((t) => ({ label: `${t.label} (${t.list.length})`, value: t.key }))}
        />
      </div>
      <div style={{ ...panel, padding: 12 }}>
        <Row gutter={[12, 12]}>
          {activeList.map((p, i) => (
            <Col xs={24} sm={12} xl={8} key={p.id}>
              <SignedTile
                index={i + 1}
                name={p.playerName}
                photoUrl={p.photoUrl}
                category={p.category}
                price={activeTabKey === "sold" ? p.finalPrice : p.basePrice}
                priceLabel={activeTabKey === "sold" ? "Sold" : "Base"}
                priceColor={activeTabKey === "sold" ? ac.pitch : ac.textMuted}
                meta={
                  activeTabKey === "sold" ? (
                    p.soldToTeamName ? <span style={metaMuted}>{p.soldToTeamName}</span> : undefined
                  ) : p.status === "ON_AUCTION" ? (
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: ac.pitch, textTransform: "uppercase", letterSpacing: 0.4 }}>On Auction</span>
                  ) : undefined
                }
              />
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );

  // ── Completed → summary ───────────────────────────────────────────────────
  if (status === "COMPLETED") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ ...panel, padding: "16px 18px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <TrophyOutlined style={{ fontSize: 22, color: ac.gold }} />
          <Text strong style={{ color: ac.textPrimary, fontSize: 16 }}>Auction Completed</Text>
          <StatusPill status="COMPLETED" />
        </div>
        {teamsSection}
        {playersSection}
      </div>
    );
  }

  // ── Live (RUNNING / PAUSED) → spectator board ─────────────────────────────
  const endsAt = session?.currentTimerEndsAt
    ? new Date(session.currentTimerEndsAt.endsWith("Z") ? session.currentTimerEndsAt : session.currentTimerEndsAt + "Z").getTime()
    : null;
  const secondsLeft = endsAt ? Math.max(0, Math.floor((endsAt - now) / 1000)) : 0;
  const timerColor = secondsLeft > 30 ? ac.pitch : secondsLeft > 10 ? ac.amber : ac.red;
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  const heroPhoto = currentPlayer?.photoUrl ? toAbsolutePlayerPhotoUrl(currentPlayer.photoUrl) : undefined;
  const heroInitials = currentPlayer
    ? currentPlayer.playerName.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase()
    : "";
  const heroPosition =
    currentPlayer && currentPlayer.playingPosition && String(currentPlayer.playingPosition) !== "UNASSIGNED"
      ? String(currentPlayer.playingPosition).replace(/_/g, " ")
      : "Player";

  // One row per team — their highest (current) bid — leader first.
  const feedBids = Array.from(
    bids
      .reduce((map, b) => {
        const cur = map.get(b.teamId);
        if (!cur || b.bidAmount > cur.bidAmount) map.set(b.teamId, b);
        return map;
      }, new Map<number, (typeof bids)[number]>())
      .values()
  ).sort((a, b) => b.bidAmount - a.bidAmount);
  const showBidFeed = feedBids.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <Title level={4} style={{ margin: 0, color: ac.textPrimary, display: "flex", alignItems: "center", gap: 8 }}>
          <FireOutlined style={{ color: ac.gold }} /> Live Auction
        </Title>
        <StatusPill status={status} />
      </div>

      {/* On the block + bid feed — only when a player is actually up */}
      {currentPlayer && (
        <Row gutter={[14, 14]}>
          <Col xs={24} lg={showBidFeed ? 16 : 24}>
            <div style={{ ...panel, textAlign: "center", position: "relative" }}>
              <div style={{ height: 3, background: `linear-gradient(90deg, ${ac.gold}, ${ac.goldSoft})` }} />
              <div style={{ padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
                  <Avatar size={72} src={heroPhoto} style={{ flexShrink: 0, border: `2px solid ${ac.gold}`, background: "rgba(198,161,91,0.14)", color: ac.goldSoft, fontSize: 26, fontWeight: 700 }}>
                    {heroInitials}
                  </Avatar>
                  <div style={{ minWidth: 0, textAlign: "left" }}>
                    <div style={{ ...kicker, color: ac.goldSoft, fontSize: 10, marginBottom: 4 }}>On The Block</div>
                    <Title level={3} style={{ margin: 0, color: ac.textPrimary, lineHeight: 1.15 }}>{currentPlayer.playerName}</Title>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                      <CategoryPill category={currentPlayer.category} />
                      <Text style={{ color: ac.textMuted, fontSize: 12, fontWeight: 600 }}>{heroPosition}</Text>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "center", gap: 12, margin: "16px 0 0", flexWrap: "wrap" }}>
                  <div style={{ background: ac.tileBg, border: ac.tileBorder, borderRadius: 10, padding: "8px 18px", minWidth: 130 }}>
                    <div style={{ ...kicker, color: ac.textMuted, fontSize: 9 }}>Base Price</div>
                    <div style={{ ...scoreNum, fontSize: 20, fontWeight: 800, color: ac.textPrimary }}>{fmt(currentPlayer.basePrice)}</div>
                  </div>
                  <div style={{ background: currentPlayer.currentBid ? "rgba(46,158,91,0.14)" : ac.tileBg, border: `1px solid ${currentPlayer.currentBid ? ac.pitch : "rgba(255,255,255,0.09)"}`, borderRadius: 10, padding: "8px 18px", minWidth: 150 }}>
                    <div style={{ ...kicker, color: ac.textMuted, fontSize: 9 }}>
                      {currentPlayer.currentHighestTeamName ? `Leading · ${currentPlayer.currentHighestTeamName}` : "Current Bid"}
                    </div>
                    <div style={{ ...scoreNum, fontSize: 28, fontWeight: 900, color: currentPlayer.currentBid ? ac.pitch : ac.goldSoft }}>
                      {fmt(currentPlayer.currentBid ?? currentPlayer.basePrice)}
                    </div>
                  </div>
                </div>

                {status === "RUNNING" && endsAt && secondsLeft > 0 && (
                  <div style={{ margin: "16px auto 4px", maxWidth: 240 }}>
                    <div style={{ ...scoreNum, fontSize: 34, fontWeight: 900, color: timerColor, lineHeight: 1, letterSpacing: 3 }}>
                      <ClockCircleOutlined style={{ fontSize: 20, marginRight: 8, verticalAlign: "middle" }} />
                      {mm}:{ss}
                    </div>
                    <Progress percent={Math.min(100, (secondsLeft / 120) * 100)} showInfo={false} strokeColor={timerColor} trailColor="rgba(255,255,255,0.12)" size="small" style={{ marginTop: 6 }} />
                  </div>
                )}
                {status === "PAUSED" && (
                  <div style={{ marginTop: 14 }}><StatusPill status="PAUSED" label="Auction Paused" /></div>
                )}
              </div>
            </div>
          </Col>

          {/* Bid feed — only when there are bids */}
          {showBidFeed && (
            <Col xs={24} lg={8}>
              <div style={panel}>
                <div style={panelHeader}><DollarOutlined /> Bid Feed</div>
                <div style={{ padding: 8, maxHeight: 340, overflowY: "auto" }}>
                  {feedBids.map((bid) => (
                    <div key={bid.id} style={{ padding: "8px 10px", marginBottom: 6, borderRadius: 8, background: bid.isWinning ? "rgba(46,158,91,0.16)" : ac.tileBg, border: bid.isWinning ? `1px solid ${ac.pitch}` : ac.tileBorder }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Text strong style={{ fontSize: 13, color: ac.textPrimary }}>{bid.teamName}</Text>
                        <Text style={{ ...scoreNum, color: ac.pitch, fontWeight: 700 }}>{fmt(bid.bidAmount)}</Text>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Text style={{ fontSize: 11, color: ac.textMuted }}>{bid.bidderName}</Text>
                        {bid.isWinning && <span style={{ fontSize: 10, fontWeight: 700, color: ac.pitch, textTransform: "uppercase", letterSpacing: 0.4 }}>Leading</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Col>
          )}
        </Row>
      )}

      {teamsSection}
      {playersSection}
    </div>
  );
};

export default ViewerAuctionTab;

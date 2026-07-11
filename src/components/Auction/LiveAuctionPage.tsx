import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Card, Row, Col, Button, Space, Typography, Tag, Table, Avatar,
  message, Alert, Empty, Divider, Progress, Modal, Tooltip
} from "antd";
import {
  PlayCircleOutlined, PauseCircleOutlined, StepForwardOutlined,
  DollarOutlined, CloseCircleOutlined, UndoOutlined, TeamOutlined,
  TrophyOutlined, ThunderboltOutlined, ClockCircleOutlined, EyeOutlined,
  ReloadOutlined, UnorderedListOutlined
} from "@ant-design/icons";
import { useParams } from "react-router-dom";
import {
  useGetAuctionDashboardQuery,
  useGetAuctionPlayersQuery,
  useGetAuctionSettingsQuery,
  useStartAuctionMutation,
  usePauseAuctionMutation,
  useResumeAuctionMutation,
  useEndAuctionMutation,
  useNextPlayerMutation,
  useNextPlayerRandomMutation,
  useSkipPlayerMutation,
  useMarkSoldMutation,
  useMarkUnsoldMutation,
  useUndoLastSaleMutation,
  useStartUnsoldRoundMutation,
  useRestartBiddingMutation,
  useSelectPlayerForAuctionMutation,
  usePlaceBidMutation,
} from "../../state/features/auction/auctionSlice";
import { AuctionPlayerCategory, AuctionPlayerResponse, AuctionWebSocketMessage, BidResponse, TeamBudgetResponse } from "../../state/features/auction/auctionTypes";
import { useAuctionWebSocket } from "../../hooks/useAuctionWebSocket";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import { GoldDivider, StatusPill, StatTile, SignedTile, CategoryPill, metaMuted, teamChip, ac, scoreNum, kicker } from "./AuctionAtoms";
import { toAbsolutePlayerPhotoUrl } from "../../utils/playerPhotoUtils";

const { Title, Text } = Typography;

const CATEGORY_COLOR: Record<AuctionPlayerCategory, string> = {
  ICON: "gold", A_GRADE: "blue", B_GRADE: "green", EMERGING: "cyan", OUTSIDE: "purple",
};

const fmt = (n?: number) => n != null ? `৳${n.toLocaleString()}` : "—";
const hasRole = (roles: string[] | undefined, role: string) =>
  !!roles?.some(r => r === role || r === `ROLE_${role}`);

// Navy broadcast panel shell used across the live board.
const boardPanel: React.CSSProperties = {
  background: ac.panel,
  border: `1px solid ${ac.panelBorder}`,
  borderRadius: 14,
  overflow: "hidden",
};


const LiveAuctionPage: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const tid = Number(tournamentId);
  const loginInfo = useSelector(selectLoginInfo);
  const isAdmin = hasRole(loginInfo.roles, "ADMIN") || hasRole(loginInfo.roles, "SUPERADMIN");
  const isTeamOwner = hasRole(loginInfo.roles, "TEAM_OWNER") || isAdmin;
  const myUserId = Number(loginInfo.userId);

  // --- Countdown timer state ---
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Modal state ---
  const [unsoldModal, setUnsoldModal] = useState(false);
  const [remainingModal, setRemainingModal] = useState(false);
  const [squadModal, setSquadModal] = useState<{ open: boolean; team: TeamBudgetResponse | null }>({
    open: false, team: null,
  });

  const [pollingActive, setPollingActive] = useState(true);
  // WebSocket push is the primary update signal; polling is only a slow fallback
  // in case the socket drops, so it runs at a relaxed interval to avoid load.
  const { data: dashboard, refetch: refetchDashboard, isLoading } = useGetAuctionDashboardQuery(tid, {
    pollingInterval: pollingActive ? 20000 : 0,
  });
  const { data: allAuctionPlayers = [], refetch: refetchPlayers } = useGetAuctionPlayersQuery(tid, {
    pollingInterval: pollingActive ? 20000 : 0,
  });
  const { data: auctionSettings } = useGetAuctionSettingsQuery(tid);

  const session = dashboard?.session;
  const currentPlayer = dashboard?.currentPlayer;
  const bids = dashboard?.currentPlayerBids || [];
  const teamBudgets = dashboard?.teamBudgets || [];
  const soldPlayers = dashboard?.soldPlayers || [];
  const remainingPlayers = useMemo(
    () => allAuctionPlayers
      .filter((p: AuctionPlayerResponse) => p.status === "AVAILABLE" || p.status === "ON_AUCTION")
      .sort((a: AuctionPlayerResponse, b: AuctionPlayerResponse) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0)),
    [allAuctionPlayers]
  );

  const myTeam = teamBudgets.find(tb => Number(tb.ownerId) === myUserId);
  const canParticipateInBidding = isTeamOwner || !!myTeam;

  // --- Live countdown ---
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    const endsAt = session?.currentTimerEndsAt;
    if (!endsAt || session?.status !== "RUNNING" || !currentPlayer) {
      setSecondsLeft(0);
      return;
    }

    const calcRemaining = () => {
      const end = new Date(endsAt.endsWith("Z") ? endsAt : endsAt + "Z");
      return Math.max(0, Math.floor((end.getTime() - Date.now()) / 1000));
    };

    setSecondsLeft(calcRemaining());
    timerRef.current = setInterval(() => {
      const r = calcRemaining();
      setSecondsLeft(r);
      if (r <= 0 && timerRef.current) clearInterval(timerRef.current);
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [session?.currentTimerEndsAt, session?.status, currentPlayer?.id]);

  // --- Stop polling when auction is completed ---
  useEffect(() => {
    if (dashboard?.session?.status === "COMPLETED") {
      setPollingActive(false);
    }
  }, [dashboard?.session?.status]);

  // --- WebSocket ---
  // Coalesce bursts of socket events (e.g. rapid bids from many owners) into a
  // single dashboard/players refetch so one bid doesn't trigger a reload storm.
  const refetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onWsMessage = useCallback((_msg: AuctionWebSocketMessage) => {
    if (refetchTimer.current) clearTimeout(refetchTimer.current);
    refetchTimer.current = setTimeout(() => {
      refetchDashboard();
      refetchPlayers();
    }, 300);
  }, [refetchDashboard, refetchPlayers]);
  useEffect(() => () => { if (refetchTimer.current) clearTimeout(refetchTimer.current); }, []);
  const { connected } = useAuctionWebSocket({ tournamentId: tid, onMessage: onWsMessage, enabled: true });

  // --- Mutations ---
  const [startAuction, { isLoading: starting }] = useStartAuctionMutation();
  const [pauseAuction] = usePauseAuctionMutation();
  const [resumeAuction] = useResumeAuctionMutation();
  const [endAuction] = useEndAuctionMutation();
  const [nextPlayer, { isLoading: loadingNext }] = useNextPlayerMutation();
  const [nextPlayerRandom, { isLoading: loadingRandom }] = useNextPlayerRandomMutation();
  const [skipPlayer] = useSkipPlayerMutation();
  const [markSold] = useMarkSoldMutation();
  const [markUnsold] = useMarkUnsoldMutation();
  const [undoLastSale] = useUndoLastSaleMutation();
  const [startUnsoldRound] = useStartUnsoldRoundMutation();
  const [restartBidding] = useRestartBiddingMutation();
  const [placeBid, { isLoading: bidding }] = usePlaceBidMutation();
  const [selectPlayerForAuction] = useSelectPlayerForAuctionMutation();

  const run = async (fn: () => Promise<any>, successMsg?: string) => {
    try {
      await fn();
      if (successMsg) message.success(successMsg);
    } catch (err: any) {
      message.error(err?.data?.message || "Action failed");
    }
  };

  const handleBid = async (amount: number) => {
    if (!myTeam || !currentPlayer) return;
    await run(
      () => placeBid({ tournamentId: tid, body: { auctionPlayerId: currentPlayer.id, teamId: myTeam.teamId, bidAmount: amount } }).unwrap(),
      `Bid ${fmt(amount)} placed!`
    );
  };

  // Bid button amounts — respect configured bidIncrement
  const bidIncrement = auctionSettings?.bidIncrement ?? 5000;
  const currentBid = currentPlayer?.currentBid;
  const basePrice = currentPlayer?.basePrice ?? 0;
  const bidBase = currentBid ?? basePrice;
  const bidAmounts = [
    bidBase + bidIncrement,
    bidBase + bidIncrement * 2,
    bidBase + bidIncrement * 4,
  ];

  // Timer color
  const timerColor = secondsLeft > 30 ? ac.pitch : secondsLeft > 10 ? ac.amber : ac.red;
  const timerPercent = session?.currentTimerEndsAt
    ? Math.min(100, (secondsLeft / 120) * 100)
    : 0;
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  // Current-player hero details
  const heroPhoto = currentPlayer?.photoUrl ? toAbsolutePlayerPhotoUrl(currentPlayer.photoUrl) : undefined;
  const heroInitials = currentPlayer
    ? currentPlayer.playerName.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase()
    : "";
  const heroPosition =
    currentPlayer && currentPlayer.playingPosition && String(currentPlayer.playingPosition) !== "UNASSIGNED"
      ? String(currentPlayer.playingPosition).replace(/_/g, " ")
      : "Player";

  if (isLoading) return <Card loading style={{ maxWidth: 1180, margin: "24px auto" }} />;

  return (
    <div style={{ maxWidth: 1360, margin: "0 auto", width: "100%" }}>
      {/* ── Header ─────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "4px 0" }}>
        <Space size="middle" wrap>
          <Title level={3} style={{ margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <TrophyOutlined style={{ color: ac.gold }} /> Live Auction
          </Title>
          <StatusPill status={session?.status || "NOT_STARTED"} />
          <span
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700,
              letterSpacing: 0.4, textTransform: "uppercase", padding: "2px 10px", borderRadius: 999,
              background: `${connected ? ac.pitch : ac.red}22`, border: `1px solid ${connected ? ac.pitch : ac.red}59`,
              color: connected ? ac.pitch : ac.red,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: connected ? ac.pitch : ac.red }} />
            {connected ? "Live" : "Reconnecting…"}
          </span>
        </Space>

        <Space wrap>
          <Button size="small" icon={<EyeOutlined />} onClick={() => setUnsoldModal(true)}>
            Unsold ({dashboard?.unsoldPlayers?.length ?? 0})
          </Button>
          <Button size="small" icon={<UnorderedListOutlined />} onClick={() => setRemainingModal(true)}>
            Remaining ({remainingPlayers.length})
          </Button>
        </Space>
      </div>

      <GoldDivider style={{ margin: "10px 0 14px" }} />

      {/* ── Stat strip ─────────────────────────────── */}
      <Row gutter={[12, 12]} style={{ marginBottom: 14 }}>
        <Col xs={6}><StatTile label="Round" value={session?.roundNumber ?? 1} accent={ac.gold} /></Col>
        <Col xs={6}><StatTile label="Remaining" value={dashboard?.remainingCount ?? 0} accent={ac.info} /></Col>
        <Col xs={6}><StatTile label="Sold" value={dashboard?.soldCount ?? 0} accent={ac.pitch} /></Col>
        <Col xs={6}><StatTile label="Unsold" value={dashboard?.unsoldCount ?? 0} accent={ac.red} /></Col>
      </Row>

      {/* ── Admin controls ─────────────────────────── */}
      {isAdmin && (
        <Card size="small" style={{ marginBottom: 14 }}>
          <Space wrap>
            {(!session || session.status === "COMPLETED") && (
              <Tooltip title={teamBudgets.length === 0 ? "Add at least one team budget before starting the auction" : undefined}>
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={() => run(() => startAuction(tid).unwrap(), "Auction started!")}
                  loading={starting}
                  disabled={teamBudgets.length === 0}
                >
                  Start Auction
                </Button>
              </Tooltip>
            )}
            {session?.status === "RUNNING" && (
              <>
                <Button icon={<PauseCircleOutlined />} onClick={() => run(() => pauseAuction(tid).unwrap())}>Pause</Button>
                <Button type="primary" icon={<StepForwardOutlined />} onClick={() => run(() => nextPlayer(tid).unwrap())} loading={loadingNext}>Next</Button>
                <Button onClick={() => run(() => nextPlayerRandom(tid).unwrap())} loading={loadingRandom}>🎲 Random</Button>
                {currentPlayer && (
                  <>
                    <Button type="primary" icon={<DollarOutlined />} style={{ background: ac.pitch, borderColor: ac.pitch }}
                      onClick={() => run(() => markSold(tid).unwrap(), "Player sold!")}
                      disabled={!currentPlayer.currentBid}>
                      Sell
                    </Button>
                    <Button danger icon={<CloseCircleOutlined />} onClick={() => run(() => markUnsold(tid).unwrap(), "Marked unsold")}>
                      Unsold
                    </Button>
                    <Button icon={<CloseCircleOutlined />} onClick={() => run(() => skipPlayer(tid).unwrap())}>Skip</Button>
                    <Tooltip title="Reset bids and restart timer for this player">
                      <Button icon={<ReloadOutlined />} onClick={() => run(() => restartBidding(tid).unwrap(), "Bidding restarted!")}>Restart Timer</Button>
                    </Tooltip>
                  </>
                )}
                <Button icon={<UndoOutlined />} onClick={() => run(() => undoLastSale(tid).unwrap(), "Sale undone!")}>Undo</Button>
              </>
            )}
            {session?.status === "PAUSED" && (
              <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => run(() => resumeAuction(tid).unwrap())}>Resume</Button>
            )}
            {session && session.status !== "NOT_STARTED" && session.status !== "COMPLETED" && (
              <Tooltip title={(dashboard?.unsoldPlayers?.length ?? 0) === 0 ? "No unsold players" : undefined}>
                <Button
                  danger
                  disabled={(dashboard?.unsoldPlayers?.length ?? 0) === 0}
                  onClick={() => run(() => startUnsoldRound(tid).unwrap(), "Re-auction started!")}
                >
                  Re-auction Unsold ({dashboard?.unsoldPlayers?.length ?? 0})
                </Button>
              </Tooltip>
            )}
            {session && session.status !== "NOT_STARTED" && session.status !== "COMPLETED" && (
              <Button
                danger
                type="primary"
                icon={<CloseCircleOutlined />}
                onClick={() =>
                  Modal.confirm({
                    title: "End Auction?",
                    content: "This will mark the auction as COMPLETED and notify all participants. This cannot be undone.",
                    okText: "End Auction",
                    okButtonProps: { danger: true },
                    cancelText: "Cancel",
                    onOk: () => run(() => endAuction(tid).unwrap(), "Auction ended!"),
                  })
                }
              >
                End Auction
              </Button>
            )}
          </Space>
        </Card>
      )}

      <Row gutter={[12, 12]}>
        {/* ── Left: Team Budgets ───────────────────── */}
        <Col xs={24} md={5}>
          <div style={boardPanel}>
            <div style={{ padding: "10px 14px", borderBottom: `1px solid ${ac.panelBorder}`, ...kicker, color: ac.goldSoft }}>
              <TeamOutlined /> Teams
            </div>
            <div style={{ padding: 8 }}>
              {teamBudgets.length === 0 ? <Empty description={<Text style={{ color: ac.textMuted }}>No teams</Text>} image={Empty.PRESENTED_IMAGE_SIMPLE} /> : (
                teamBudgets.map(tb => {
                  const mine = tb.ownerId === myUserId;
                  const low = tb.remainingBudget < 10000;
                  return (
                    <div
                      key={tb.teamId}
                      onClick={() => setSquadModal({ open: true, team: tb })}
                      style={{
                        padding: "8px 10px", marginBottom: 6, borderRadius: 8,
                        background: mine ? "rgba(46,158,91,0.14)" : ac.tileBg,
                        border: mine ? `1px solid ${ac.pitch}` : ac.tileBorder,
                        cursor: "pointer",
                      }}
                    >
                      <Row justify="space-between" align="middle">
                        <Text strong style={{ fontSize: 13, color: ac.textPrimary }}>{tb.teamName}</Text>
                        {mine && <Tag color="green" style={{ fontSize: 10, margin: 0 }}>YOU</Tag>}
                      </Row>
                      <Row justify="space-between" align="middle">
                        <Text style={{ fontSize: 11, color: ac.textMuted }}>{tb.playersBought} players</Text>
                        <Text style={{ fontSize: 12, ...scoreNum, color: low ? ac.red : ac.pitch }}>
                          {fmt(tb.remainingBudget)}
                        </Text>
                      </Row>
                      <Progress
                        percent={Math.round((tb.remainingBudget / tb.totalBudget) * 100)}
                        showInfo={false}
                        strokeColor={low ? ac.red : ac.pitch}
                        trailColor="rgba(255,255,255,0.12)"
                        size="small"
                        style={{ marginBottom: 0, marginTop: 2 }}
                      />
                      <Text style={{ fontSize: 10, marginTop: 2, display: "block", color: ac.textMuted }}>
                        <EyeOutlined /> View squad
                      </Text>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </Col>

        {/* ── Center: Current Player + Timer + Bid ── */}
        <Col xs={24} md={14}>
          {!session && (
            <Card>
              <Empty description={
                <Space direction="vertical">
                  <Text>Auction not started yet.</Text>
                  {isAdmin && (
                    <Text type="secondary">
                      {teamBudgets.length === 0
                        ? "Go to Team Budgets to add teams before starting the auction."
                        : `Ensure the player pool and teams are set up (${teamBudgets.length} team${teamBudgets.length !== 1 ? "s" : ""} ready), then click "Start Auction".`}
                    </Text>
                  )}
                </Space>
              } />
            </Card>
          )}

          {session && !currentPlayer && session.status === "RUNNING" && (
            <Card>
              <Alert
                type="info"
                message="No player on auction"
                description={isAdmin ? 'Click "Next" or "Random" to bring up the next player.' : "Waiting for admin to put up the next player..."}
                showIcon
              />
            </Card>
          )}

          {session && !currentPlayer && session.status === "PAUSED" && (
            <Card><Alert type="warning" message="Auction is paused" showIcon /></Card>
          )}

          {session && !currentPlayer && session.status === "COMPLETED" && (
            <Card><Alert type="success" message="Auction completed!" showIcon /></Card>
          )}

          {currentPlayer && (
            <div style={{ ...boardPanel, textAlign: "center", position: "relative" }}>
              {/* Gold "on the block" accent strip */}
              <div style={{ height: 3, background: `linear-gradient(90deg, ${ac.gold}, ${ac.goldSoft})` }} />
              {/* Soft spotlight behind the player */}
              <div
                style={{
                  position: "absolute",
                  top: 3,
                  left: 0,
                  right: 0,
                  height: 140,
                  background: "radial-gradient(ellipse at 50% 0%, rgba(198,161,91,0.16), transparent 72%)",
                  pointerEvents: "none",
                }}
              />
              <div style={{ padding: "14px 20px 16px", position: "relative" }}>
                {/* Identity row: photo + name/meta side by side (compact) */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, textAlign: "left", flexWrap: "wrap" }}>
                  <Avatar
                    size={72}
                    src={heroPhoto}
                    style={{
                      flexShrink: 0,
                      border: `2px solid ${ac.gold}`,
                      boxShadow: "0 6px 18px rgba(198,161,91,0.3)",
                      background: "rgba(198,161,91,0.14)",
                      color: ac.goldSoft,
                      fontSize: 26,
                      fontWeight: 700,
                    }}
                  >
                    {heroInitials}
                  </Avatar>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ ...kicker, color: ac.goldSoft, fontSize: 10, marginBottom: 4 }}>On The Block</div>
                    <Title level={3} style={{ margin: 0, color: ac.textPrimary, lineHeight: 1.15 }}>{currentPlayer.playerName}</Title>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                      <CategoryPill category={currentPlayer.category} />
                      <Text style={{ color: ac.textMuted, fontSize: 12, fontWeight: 600 }}>{heroPosition}</Text>
                      {currentPlayer.playerEmail && (
                        <Text style={{ color: ac.textMuted, fontSize: 12 }}>· {currentPlayer.playerEmail}</Text>
                      )}
                    </div>
                  </div>
                </div>

                <Divider style={{ margin: "12px 0", borderColor: "rgba(255,255,255,0.1)" }} />

                {/* Base price + current bid — compact scoreboard tiles */}
                <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
                  <div style={{ background: ac.tileBg, border: ac.tileBorder, borderRadius: 10, padding: "8px 18px", minWidth: 130 }}>
                    <div style={{ ...kicker, color: ac.textMuted, fontSize: 9 }}>Base Price</div>
                    <div style={{ ...scoreNum, fontSize: 20, fontWeight: 800, color: ac.textPrimary }}>{fmt(currentPlayer.basePrice)}</div>
                  </div>
                  <div
                    style={{
                      background: currentPlayer.currentBid ? "rgba(46,158,91,0.14)" : ac.tileBg,
                      border: `1px solid ${currentPlayer.currentBid ? ac.pitch : "rgba(255,255,255,0.09)"}`,
                      borderRadius: 10,
                      padding: "8px 18px",
                      minWidth: 150,
                    }}
                  >
                    <div style={{ ...kicker, color: ac.textMuted, fontSize: 9 }}>
                      {currentPlayer.currentHighestTeamName ? `Leading · ${currentPlayer.currentHighestTeamName}` : "Current Bid"}
                    </div>
                    <div style={{ ...scoreNum, fontSize: 28, fontWeight: 900, color: currentPlayer.currentBid ? ac.pitch : ac.goldSoft }}>
                      {fmt(currentPlayer.currentBid ?? currentPlayer.basePrice)}
                    </div>
                  </div>
                </div>

                {/* Countdown timer */}
                {session?.status === "RUNNING" && session?.currentTimerEndsAt && secondsLeft > 0 && (
                  <div style={{ margin: "0 auto 14px", maxWidth: 240 }}>
                    <div style={{
                      ...scoreNum, fontSize: 38, fontWeight: 900, color: timerColor,
                      lineHeight: 1, letterSpacing: 3, transition: "color 0.5s",
                    }}>
                      <ClockCircleOutlined style={{ fontSize: 22, marginRight: 8, verticalAlign: "middle" }} />
                      {mm}:{ss}
                    </div>
                    <Progress
                      percent={timerPercent}
                      showInfo={false}
                      strokeColor={timerColor}
                      trailColor="rgba(255,255,255,0.12)"
                      size="small"
                      style={{ marginTop: 6 }}
                    />
                  </div>
                )}

                {/* Timer expired — player still on screen, admin decides */}
                {session?.status === "RUNNING" && !session?.currentTimerEndsAt && (
                  <div style={{ margin: "0 auto 12px", maxWidth: 320, textAlign: "center" }}>
                    <Tag color="volcano" style={{ fontSize: 13, padding: "3px 14px", borderRadius: 20 }}>
                      <ClockCircleOutlined /> Time's Up!
                    </Tag>
                    {isAdmin
                      ? <div style={{ marginTop: 8 }}><Text style={{ color: ac.textMuted }}>Click <Text strong style={{ color: ac.textPrimary }}>Sell</Text> to confirm or <Text strong style={{ color: ac.textPrimary }}>Unsold</Text> to pass.</Text></div>
                      : <div style={{ marginTop: 8 }}><Text style={{ color: ac.textMuted }}>Waiting for admin decision...</Text></div>
                    }
                  </div>
                )}

                {/* Bid section — shown to all TEAM_OWNERs */}
                {canParticipateInBidding && (
                  <>
                    {myTeam ? (
                      <>
                        {/* Bid buttons — only while timer is actively running */}
                        {session?.status === "RUNNING" && session?.currentTimerEndsAt && secondsLeft > 0 ? (
                          <>
                            <Space size="middle" style={{ marginTop: 8, flexWrap: "wrap", justifyContent: "center" }}>
                              {bidAmounts.map((amt, i) => {
                                const canAfford = amt <= myTeam.remainingBudget;
                                return (
                                  <Button
                                    key={i}
                                    type="primary"
                                    size="middle"
                                    icon={<ThunderboltOutlined />}
                                    onClick={() => handleBid(amt)}
                                    loading={bidding}
                                    disabled={!canAfford}
                                    style={{ minWidth: 108, ...scoreNum }}
                                  >
                                    {fmt(amt)}
                                  </Button>
                                );
                              })}
                            </Space>
                            {/* Explain why bidding is unavailable instead of silently disabling */}
                            {bidAmounts[0] > myTeam.remainingBudget && (
                              <Alert
                                type="warning"
                                showIcon
                                style={{ marginTop: 12, textAlign: "left" }}
                                message="Not enough budget to bid on this player"
                                description={`The minimum bid is ${fmt(bidAmounts[0])} but your team has only ${fmt(myTeam.remainingBudget)} left. Ask the admin to raise your team budget, or this player is out of your range.`}
                              />
                            )}
                            {bidAmounts[0] <= myTeam.remainingBudget && myTeam.playersBought >= (auctionSettings?.maxSquadSize ?? Infinity) && (
                              <Alert
                                type="warning"
                                showIcon
                                style={{ marginTop: 12, textAlign: "left" }}
                                message="Squad is full"
                                description={`Your team has reached the maximum squad size (${auctionSettings?.maxSquadSize}). You cannot bid for more players.`}
                              />
                            )}
                          </>
                        ) : (
                          session?.status === "RUNNING" && !session?.currentTimerEndsAt && (
                            <Tag color="default" style={{ marginTop: 8 }}>Bidding closed — time expired</Tag>
                          )
                        )}
                        <div style={{ marginTop: 12 }}>
                          <Text style={{ fontSize: 12, color: ac.textMuted }}>
                            Your budget: <Text strong style={{ ...scoreNum, color: myTeam.remainingBudget < 10000 ? ac.red : ac.pitch }}>
                              {fmt(myTeam.remainingBudget)}
                            </Text> remaining • {myTeam.playersBought} player(s) bought
                          </Text>
                        </div>
                      </>
                    ) : (
                      <Alert
                        type="warning"
                        message="No team budget registered for you in this auction."
                        description="Ask the admin to set up your team budget to enable bidding."
                        style={{ marginTop: 12, textAlign: "left" }}
                        showIcon
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </Col>

        {/* ── Right: Live Bid Feed ─────────────────── */}
        <Col xs={24} md={5}>
          <div style={boardPanel}>
            <div style={{ padding: "10px 14px", borderBottom: `1px solid ${ac.panelBorder}`, ...kicker, color: ac.goldSoft }}>
              <DollarOutlined /> Bid Feed
            </div>
            <div style={{ padding: 8, maxHeight: 520, overflowY: "auto" }}>
              {bids.length === 0 ? (
                <Empty description={<Text style={{ color: ac.textMuted }}>No bids yet</Text>} image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                [...bids].reverse().map((bid: BidResponse) => (
                  <div key={bid.id} style={{
                    padding: "8px 10px",
                    marginBottom: 6,
                    borderRadius: 8,
                    background: bid.isWinning ? "rgba(46,158,91,0.16)" : ac.tileBg,
                    border: bid.isWinning ? `1px solid ${ac.pitch}` : ac.tileBorder,
                  }}>
                    <Row justify="space-between" align="middle">
                      <Text strong style={{ fontSize: 13, color: ac.textPrimary }}>{bid.teamName}</Text>
                      <Text style={{ color: ac.pitch, fontWeight: "bold", ...scoreNum }}>{fmt(bid.bidAmount)}</Text>
                    </Row>
                    <Text style={{ fontSize: 11, color: ac.textMuted }}>{bid.bidderName}</Text>
                    {bid.isWinning && <Tag color="green" style={{ float: "right", fontSize: 10, marginTop: 2 }}>Leading</Tag>}
                  </div>
                ))
              )}
            </div>
          </div>
        </Col>
      </Row>

      {/* ── Sold Players board ───────────────────── */}
      {soldPlayers.length > 0 && (
        <div style={{ ...boardPanel, marginTop: 14 }}>
          <div style={{ padding: "10px 14px", borderBottom: `1px solid ${ac.panelBorder}`, ...kicker, color: ac.goldSoft, display: "flex", alignItems: "center", gap: 8 }}>
            <TrophyOutlined /> Sold Players ({soldPlayers.length})
          </div>
          <div style={{ padding: 12 }}>
            <Row gutter={[12, 12]}>
              {soldPlayers.map((p: AuctionPlayerResponse, i: number) => (
                <Col xs={24} sm={12} xl={8} key={p.id}>
                  <SignedTile
                    index={i + 1}
                    name={p.playerName}
                    photoUrl={p.photoUrl}
                    category={p.category}
                    price={p.finalPrice}
                    meta={
                      <>
                        <span style={metaMuted}>Base {fmt(p.basePrice)}</span>
                        {p.soldToTeamName && <span style={teamChip}>{p.soldToTeamName}</span>}
                      </>
                    }
                  />
                </Col>
              ))}
            </Row>
          </div>
        </div>
      )}

      {/* ── Remaining Players Modal ──────────────── */}
      <Modal
        title={<Space><UnorderedListOutlined style={{ color: ac.info }} /><span>Remaining Players ({remainingPlayers.length})</span></Space>}
        open={remainingModal}
        onCancel={() => setRemainingModal(false)}
        footer={null}
        width={760}
      >
        {remainingPlayers.length === 0 ? (
          <Empty description="No remaining players" />
        ) : (
          <Table
            dataSource={remainingPlayers}
            rowKey="id"
            size="small"
            scroll={{ x: 700, y: 420 }}
            pagination={{ pageSize: 12, showSizeChanger: false }}
            columns={[
              {
                title: "#",
                key: "seq",
                width: 64,
                render: (_: any, r: AuctionPlayerResponse, index: number) => r.sequenceOrder ?? index + 1,
              },
              { title: "Player", dataIndex: "playerName", render: (v: string) => <Text strong>{v}</Text> },
              {
                title: "Grade",
                dataIndex: "category",
                width: 130,
                render: (c: AuctionPlayerCategory) => <Tag color={CATEGORY_COLOR[c]}>{c.replace("_", " ")}</Tag>,
              },
              {
                title: "Status",
                dataIndex: "status",
                width: 120,
                render: (s: string) => <StatusPill status={s} />,
              },
              { title: "Position", dataIndex: "playingPosition", render: (v?: string) => v || "—" },
              { title: "Base Price", dataIndex: "basePrice", width: 130, render: fmt },
              ...(isAdmin ? [{
                title: "Action",
                key: "action",
                width: 100,
                render: (_: any, record: AuctionPlayerResponse) => (
                  <Button
                    type="primary"
                    size="small"
                    onClick={async () => {
                      await run(
                        () => selectPlayerForAuction({ tournamentId: tid, playerId: record.id }).unwrap(),
                        `${record.playerName} selected for auction!`
                      );
                      setRemainingModal(false);
                    }}
                  >
                    Select
                  </Button>
                ),
              }] : []),
            ]}
          />
        )}
      </Modal>

      <Modal
        title={<Space><CloseCircleOutlined style={{ color: ac.red }} /><span>Unsold Players ({dashboard?.unsoldPlayers?.length ?? 0})</span></Space>}
        open={unsoldModal}
        onCancel={() => setUnsoldModal(false)}
        footer={null}
        width={700}
      >
        {(dashboard?.unsoldPlayers?.length ?? 0) === 0 ? (
          <Empty description="No unsold players" />
        ) : (
          <Table
            dataSource={dashboard!.unsoldPlayers}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              { title: "#", key: "idx", render: (_: any, __: any, i: number) => i + 1, width: 40 },
              { title: "Player", dataIndex: "playerName", render: (v: string) => <Text strong>{v}</Text> },
              {
                title: "Grade", dataIndex: "category",
                render: (c: AuctionPlayerCategory) => <Tag color={CATEGORY_COLOR[c]}>{c.replace("_", " ")}</Tag>
              },
              { title: "Base Price", dataIndex: "basePrice", render: fmt },
              { title: "Position", dataIndex: "playingPosition", render: (v?: string) => v || "—" },
              ...(isAdmin ? [{
                title: "Action",
                key: "action",
                width: 100,
                render: (_: any, record: AuctionPlayerResponse) => (
                  <Button
                    type="primary"
                    size="small"
                    onClick={async () => {
                      await run(
                        () => selectPlayerForAuction({ tournamentId: tid, playerId: record.id }).unwrap(),
                        `${record.playerName} selected for auction!`
                      );
                      setUnsoldModal(false);
                    }}
                  >
                    Select
                  </Button>
                ),
              }] : []),
            ]}
          />
        )}
      </Modal>

      {/* ── Team Squad Modal ─────────────────────── */}
      <Modal
        title={
          <Space wrap>
            <TeamOutlined />
            <span>{squadModal.team?.teamName} — Squad</span>
            <Tag color="blue">{squadModal.team?.playersBought ?? 0} players</Tag>
            <Tag color="green">Budget left: {fmt(squadModal.team?.remainingBudget)}</Tag>
          </Space>
        }
        open={squadModal.open}
        onCancel={() => setSquadModal({ open: false, team: null })}
        footer={null}
        width={680}
      >
        {(() => {
          const teamPlayers = soldPlayers.filter(
            (p: AuctionPlayerResponse) => p.soldToTeamId === squadModal.team?.teamId
          );
          const total = teamPlayers.reduce((sum, p) => sum + (p.finalPrice ?? 0), 0);
          return teamPlayers.length === 0 ? (
            <Empty description="No players bought yet" />
          ) : (
            <div style={{ ...boardPanel, padding: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {teamPlayers.map((p: AuctionPlayerResponse, i: number) => (
                  <SignedTile
                    key={p.id}
                    index={i + 1}
                    name={p.playerName}
                    photoUrl={p.photoUrl}
                    category={p.category}
                    price={p.finalPrice}
                    meta={
                      <>
                        {p.playingPosition && <span style={metaMuted}>{p.playingPosition}</span>}
                        <span style={metaMuted}>Base {fmt(p.basePrice)}</span>
                      </>
                    }
                  />
                ))}
              </div>
              {/* Total spent bar */}
              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "rgba(198,161,91,0.12)",
                  border: `1px solid ${ac.panelBorder}`,
                }}
              >
                <span style={{ ...kicker, color: ac.goldSoft }}>Total Spent</span>
                <span style={{ ...scoreNum, color: ac.pitch, fontWeight: 800, fontSize: 18 }}>{fmt(total)}</span>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};

export default LiveAuctionPage;

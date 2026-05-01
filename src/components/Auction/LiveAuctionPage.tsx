import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Card, Row, Col, Button, Space, Typography, Tag, Table,
  message, Alert, Empty, Badge, Divider, Progress, Statistic, Modal, Tooltip
} from "antd";
import {
  PlayCircleOutlined, PauseCircleOutlined, StepForwardOutlined,
  DollarOutlined, CloseCircleOutlined, UndoOutlined, TeamOutlined,
  TrophyOutlined, ThunderboltOutlined, ClockCircleOutlined, EyeOutlined,
  WifiOutlined, DisconnectOutlined, ReloadOutlined
} from "@ant-design/icons";
import { useParams } from "react-router-dom";
import {
  useGetAuctionDashboardQuery,
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
  usePlaceBidMutation,
} from "../../state/features/auction/auctionSlice";
import { AuctionPlayerCategory, AuctionPlayerResponse, AuctionWebSocketMessage, BidResponse, TeamBudgetResponse } from "../../state/features/auction/auctionTypes";
import { useAuctionWebSocket } from "../../hooks/useAuctionWebSocket";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";

const { Title, Text } = Typography;

const CATEGORY_COLOR: Record<AuctionPlayerCategory, string> = {
  ICON: "gold", A_GRADE: "blue", B_GRADE: "green", EMERGING: "cyan", OUTSIDE: "purple",
};

const fmt = (n?: number) => n != null ? `৳${n.toLocaleString()}` : "—";

const LiveAuctionPage: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const tid = Number(tournamentId);
  const loginInfo = useSelector(selectLoginInfo);
  const isAdmin = loginInfo.roles?.includes("ADMIN") || loginInfo.roles?.includes("SUPERADMIN");
  const isTeamOwner = loginInfo.roles?.includes("TEAM_OWNER") || isAdmin;
  const myUserId = Number(loginInfo.userId);

  // --- Countdown timer state ---
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Modal state ---
  const [unsoldModal, setUnsoldModal] = useState(false);
  const [squadModal, setSquadModal] = useState<{ open: boolean; team: TeamBudgetResponse | null }>({
    open: false, team: null,
  });

  const [pollingActive, setPollingActive] = useState(true);
  const { data: dashboard, refetch, isLoading } = useGetAuctionDashboardQuery(tid, {
    pollingInterval: pollingActive ? 5000 : 0,
  });
  const { data: auctionSettings } = useGetAuctionSettingsQuery(tid);

  const session = dashboard?.session;
  const currentPlayer = dashboard?.currentPlayer;
  const bids = dashboard?.currentPlayerBids || [];
  const teamBudgets = dashboard?.teamBudgets || [];
  const soldPlayers = dashboard?.soldPlayers || [];

  const myTeam = teamBudgets.find(tb => tb.ownerId === myUserId);

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
  const onWsMessage = useCallback((msg: AuctionWebSocketMessage) => {
    refetch();
  }, [refetch]);
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
  const timerColor = secondsLeft > 30 ? "#52c41a" : secondsLeft > 10 ? "#faad14" : "#ff4d4f";
  const timerPercent = session?.currentTimerEndsAt
    ? Math.min(100, (secondsLeft / 120) * 100)
    : 0;
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  const statusBadge = () => {
    switch (session?.status) {
      case "RUNNING": return <Badge status="processing" text="LIVE" />;
      case "PAUSED": return <Badge status="warning" text="PAUSED" />;
      case "COMPLETED": return <Badge status="success" text="COMPLETED" />;
      default: return <Badge status="default" text="NOT STARTED" />;
    }
  };

  if (isLoading) return <Card loading />;

  return (
    <div style={{ padding: 12 }}>
      {/* ── Header ─────────────────────────────────── */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
        <Col>
          <Space size="large">
            <Title level={4} style={{ margin: 0 }}><TrophyOutlined /> Live Auction</Title>
            {statusBadge()}
            <Text type="secondary">Round {session?.roundNumber ?? 1}</Text>
            <Text type="secondary">
              Remaining: {dashboard?.remainingCount ?? 0} | Sold: {dashboard?.soldCount ?? 0} | Unsold: {dashboard?.unsoldCount ?? 0}
            </Text>
            <Badge color={connected ? "green" : "red"} text={connected ? "Live" : "Reconnecting..."} />
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => setUnsoldModal(true)}
            >
              Unsold ({dashboard?.unsoldPlayers?.length ?? 0})
            </Button>
          </Space>
        </Col>

        {/* Admin controls */}
        {isAdmin && (
          <Col>
            <Space wrap>
              {(!session || session.status === "COMPLETED") && (
                <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => run(() => startAuction(tid).unwrap(), "Auction started!")} loading={starting}>
                  Start Auction
                </Button>
              )}
              {session?.status === "RUNNING" && (
                <>
                  <Button icon={<PauseCircleOutlined />} onClick={() => run(() => pauseAuction(tid).unwrap())}>Pause</Button>
                  <Button type="primary" icon={<StepForwardOutlined />} onClick={() => run(() => nextPlayer(tid).unwrap())} loading={loadingNext}>Next</Button>
                  <Button onClick={() => run(() => nextPlayerRandom(tid).unwrap())} loading={loadingRandom}>🎲 Random</Button>
                  {currentPlayer && (
                    <>
                      <Button type="primary" icon={<DollarOutlined />} style={{ background: "#52c41a", borderColor: "#52c41a" }}
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
          </Col>
        )}
      </Row>

      <Row gutter={12}>
        {/* ── Left: Team Budgets ───────────────────── */}
        <Col xs={24} md={5}>
          <Card title={<><TeamOutlined /> Teams</>} size="small" bodyStyle={{ padding: 8 }}>
            {teamBudgets.length === 0 ? <Empty description="No teams" /> : (
              teamBudgets.map(tb => (
                <div
                  key={tb.teamId}
                  onClick={() => setSquadModal({ open: true, team: tb })}
                  style={{
                    padding: "8px 10px", marginBottom: 6, borderRadius: 6,
                    background: tb.ownerId === myUserId ? "#1a2a1a" : "#1a1a2e",
                    border: tb.ownerId === myUserId ? "1px solid #52c41a" : "1px solid #2a2a3a",
                    cursor: "pointer",
                  }}
                >
                  <Row justify="space-between">
                    <Text strong style={{ fontSize: 13 }}>{tb.teamName}</Text>
                    {tb.ownerId === myUserId && <Tag color="green" style={{ fontSize: 10 }}>YOU</Tag>}
                  </Row>
                  <Row justify="space-between">
                    <Text type="secondary" style={{ fontSize: 11 }}>{tb.playersBought} players</Text>
                    <Text style={{ fontSize: 12, color: tb.remainingBudget < 10000 ? "#ff4d4f" : "#52c41a" }}>
                      {fmt(tb.remainingBudget)}
                    </Text>
                  </Row>
                  <Progress
                    percent={Math.round((tb.remainingBudget / tb.totalBudget) * 100)}
                    showInfo={false}
                    strokeColor={tb.remainingBudget < 10000 ? "#ff4d4f" : "#52c41a"}
                    size="small"
                    style={{ marginBottom: 0, marginTop: 2 }}
                  />
                  <Text type="secondary" style={{ fontSize: 10, marginTop: 2, display: "block" }}>
                    <EyeOutlined /> View squad
                  </Text>
                </div>
              ))
            )}
          </Card>
        </Col>

        {/* ── Center: Current Player + Timer + Bid ── */}
        <Col xs={24} md={14}>
          {!session && (
            <Card>
              <Empty description={
                <Space direction="vertical">
                  <Text>Auction not started yet.</Text>
                  {isAdmin && <Text type="secondary">Ensure the player pool and teams are set up, then click "Start Auction".</Text>}
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
            <Card
              style={{ textAlign: "center" }}
              bodyStyle={{ padding: "20px 24px" }}
            >
              {/* Grade */}
              <Tag color={CATEGORY_COLOR[currentPlayer.category]} style={{ fontSize: 14, padding: "4px 12px", marginBottom: 12 }}>
                {currentPlayer.category.replace("_", " ")}
              </Tag>

              {/* Player name */}
              <Title level={2} style={{ margin: "0 0 4px" }}>{currentPlayer.playerName}</Title>
              <Text type="secondary">{currentPlayer.playerEmail} • {currentPlayer.playingPosition || "Player"}</Text>

              <Divider style={{ margin: "16px 0" }} />

              {/* Current bid or base price */}
              <Row justify="center" gutter={32} style={{ marginBottom: 16 }}>
                <Col>
                  <Statistic title="Base Price" value={currentPlayer.basePrice} prefix="৳" />
                </Col>
                <Col>
                  <Statistic
                    title={currentPlayer.currentHighestTeamName ? `Leading: ${currentPlayer.currentHighestTeamName}` : "Current Bid"}
                    value={currentPlayer.currentBid ?? currentPlayer.basePrice}
                    prefix="৳"
                    valueStyle={{ color: currentPlayer.currentBid ? "#52c41a" : undefined, fontSize: 32 }}
                  />
                </Col>
              </Row>

              {/* Countdown timer */}
              {session?.status === "RUNNING" && session?.currentTimerEndsAt && secondsLeft > 0 && (
                <div style={{ margin: "0 auto 20px", maxWidth: 260 }}>
                  <div style={{
                    fontSize: 52, fontWeight: "bold", color: timerColor,
                    lineHeight: 1, letterSpacing: 4,
                    transition: "color 0.5s",
                  }}>
                    <ClockCircleOutlined style={{ fontSize: 28, marginRight: 8, verticalAlign: "middle" }} />
                    {mm}:{ss}
                  </div>
                  <Progress
                    percent={timerPercent}
                    showInfo={false}
                    strokeColor={timerColor}
                    style={{ marginTop: 8 }}
                  />
                  {secondsLeft <= 10 && secondsLeft > 0 && (
                    <Text style={{ color: "#ff4d4f", fontWeight: "bold" }}>⚠️ Timer almost up!</Text>
                  )}
                </div>
              )}

              {/* Timer expired — player still on screen, admin decides */}
              {session?.status === "RUNNING" && !session?.currentTimerEndsAt && (
                <div style={{ margin: "0 auto 16px", maxWidth: 320, textAlign: "center" }}>
                  <Tag color="volcano" style={{ fontSize: 15, padding: "6px 18px", borderRadius: 20 }}>
                    <ClockCircleOutlined /> Time's Up!
                  </Tag>
                  {isAdmin
                    ? <div style={{ marginTop: 8 }}><Text type="secondary">Click <Text strong>Sell</Text> to confirm or <Text strong>Unsold</Text> to pass.</Text></div>
                    : <div style={{ marginTop: 8 }}><Text type="secondary">Waiting for admin decision...</Text></div>
                  }
                </div>
              )}

              {/* Bid section — shown to all TEAM_OWNERs */}
              {isTeamOwner && (
                <>
                  {myTeam ? (
                    <>
                      {/* Bid buttons — only while timer is actively running */}
                      {session?.status === "RUNNING" && session?.currentTimerEndsAt && secondsLeft > 0 ? (
                        <Space size="middle" style={{ marginTop: 8, flexWrap: "wrap", justifyContent: "center" }}>
                          {bidAmounts.map((amt, i) => {
                            const canAfford = amt <= myTeam.remainingBudget;
                            const bgColors = ["#1677ff", "#7c3aed", "#be123c"];
                            return (
                              <Button
                                key={i}
                                type="primary"
                                size="large"
                                icon={<ThunderboltOutlined />}
                                onClick={() => handleBid(amt)}
                                loading={bidding}
                                disabled={!canAfford}
                                style={{
                                  minWidth: 110,
                                  background: canAfford ? bgColors[i] : "#333",
                                  borderColor: canAfford ? bgColors[i] : "#555",
                                  color: canAfford ? "#fff" : "#666",
                                  cursor: canAfford ? "pointer" : "not-allowed",
                                  opacity: canAfford ? 1 : 0.5,
                                }}
                              >
                                {fmt(amt)}
                              </Button>
                            );
                          })}
                        </Space>
                      ) : (
                        session?.status === "RUNNING" && !session?.currentTimerEndsAt && (
                          <Tag color="default" style={{ marginTop: 8 }}>Bidding closed — time expired</Tag>
                        )
                      )}
                      <div style={{ marginTop: 10 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Your budget: <Text strong style={{ color: myTeam.remainingBudget < 10000 ? "#ff4d4f" : "#52c41a" }}>
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
                      style={{ marginTop: 12 }}
                      showIcon
                    />
                  )}
                </>
              )}
            </Card>
          )}
        </Col>

        {/* ── Right: Live Bid Feed ─────────────────── */}
        <Col xs={24} md={5}>
          <Card
            title={<><DollarOutlined /> Bid Feed</>}
            size="small"
            bodyStyle={{ padding: 8, maxHeight: 500, overflowY: "auto" }}
          >
            {bids.length === 0 ? (
              <Empty description="No bids yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              [...bids].reverse().map((bid: BidResponse) => (
                <div key={bid.id} style={{
                  padding: "8px 10px",
                  marginBottom: 6,
                  borderRadius: 6,
                  background: bid.isWinning ? "#1a2e1a" : "#1a1a1a",
                  border: bid.isWinning ? "1px solid #52c41a" : "1px solid #2a2a2a",
                }}>
                  <Row justify="space-between">
                    <Text strong style={{ fontSize: 13 }}>{bid.teamName}</Text>
                    <Text style={{ color: "#52c41a", fontWeight: "bold" }}>{fmt(bid.bidAmount)}</Text>
                  </Row>
                  <Text type="secondary" style={{ fontSize: 11 }}>{bid.bidderName}</Text>
                  {bid.isWinning && <Tag color="green" style={{ float: "right", fontSize: 10, marginTop: 2 }}>Leading</Tag>}
                </div>
              ))
            )}
          </Card>
        </Col>
      </Row>

      {/* ── Sold Players Table ───────────────────── */}
      {soldPlayers.length > 0 && (
        <Card title={<><TrophyOutlined /> Sold Players ({soldPlayers.length})</>} style={{ marginTop: 12 }} size="small">
          <Table
            dataSource={soldPlayers}
            rowKey="id"
            pagination={false}
            size="small"
            scroll={{ x: 600, y: 200 }}
            columns={[
              { title: "#", key: "idx", render: (_: any, __: any, i: number) => i + 1, width: 40 },
              { title: "Player", dataIndex: "playerName", key: "name", render: (v: string) => <Text strong>{v}</Text> },
              {
                title: "Grade", dataIndex: "category", key: "cat",
                render: (c: AuctionPlayerCategory) => <Tag color={CATEGORY_COLOR[c]}>{c.replace("_", " ")}</Tag>
              },
              { title: "Base", dataIndex: "basePrice", key: "base", render: fmt },
              { title: "Sold For", dataIndex: "finalPrice", key: "sold", render: (v: number) => <Text style={{ color: "#52c41a" }}>{fmt(v)}</Text> },
              { title: "Team", dataIndex: "soldToTeamName", key: "team", render: (v?: string) => <Tag>{v || "—"}</Tag> },
            ]}
          />
        </Card>
      )}

      {/* ── Unsold Players Modal ─────────────────── */}
      <Modal
        title={<Space><CloseCircleOutlined style={{ color: "#ff4d4f" }} /><span>Unsold Players ({dashboard?.unsoldPlayers?.length ?? 0})</span></Space>}
        open={unsoldModal}
        onCancel={() => setUnsoldModal(false)}
        footer={null}
        width={640}
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
            ]}
          />
        )}
      </Modal>

      {/* ── Team Squad Modal ─────────────────────── */}
      <Modal
        title={
          <Space>
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
          return teamPlayers.length === 0 ? (
            <Empty description="No players bought yet" />
          ) : (
            <Table
              dataSource={teamPlayers}
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
                { title: "Position", dataIndex: "playingPosition", render: (v?: string) => v || "—" },
                { title: "Base", dataIndex: "basePrice", render: fmt },
                {
                  title: "Sold For", dataIndex: "finalPrice",
                  render: (v: number) => <Text strong style={{ color: "#52c41a" }}>{fmt(v)}</Text>
                },
              ]}
              summary={(data) => {
                const total = data.reduce((sum, p) => sum + (p.finalPrice ?? 0), 0);
                return (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={5}><Text strong>Total Spent</Text></Table.Summary.Cell>
                    <Table.Summary.Cell index={1}>
                      <Text strong style={{ color: "#52c41a" }}>{fmt(total)}</Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                );
              }}
            />
          );
        })()}
      </Modal>
    </div>
  );
};

export default LiveAuctionPage;

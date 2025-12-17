import React, { useRef, useEffect, useState } from "react";
import { Card, Tag, Space, Button, Typography } from "antd";
import { gsap } from "gsap";
import { IFixture, IMatchEvent } from "../../../state/features/fixtures/fixtureTypes";
import { TrophyOutlined, EnvironmentOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import moment from "moment";
import MatchLivePanel from "./MatchLivePanel";
import { useNavigate } from "react-router-dom";
import { useGetMatchEventsQuery } from "../../../state/features/fixtures/fixturesSlice";

const { Text } = Typography;

interface ElectricTeamBannerProps {
  match: IFixture;
  colorBgContainer: string;
  isAdmin?: boolean;
  onRefresh?: () => void;
}

export default function ElectricTeamBanner({ match, isAdmin = false, onRefresh }: ElectricTeamBannerProps) {
  const navigate = useNavigate();
  const homeScoreRef = useRef<HTMLDivElement>(null);
  const awayScoreRef = useRef<HTMLDivElement>(null);
  const homeGlowRef = useRef<HTMLDivElement>(null);
  const awayGlowRef = useRef<HTMLDivElement>(null);

  // Fetch match events to get goal scorers
  const { data: eventsData } = useGetMatchEventsQuery({ matchId: match.id }, { skip: !match.id });
  const events = eventsData?.content || [];
  
  // Filter goal events and group by team
  const homeGoals = events.filter((e: IMatchEvent) => 
    e.eventType === "GOAL" && e.teamId === match.homeTeamId
  ).sort((a: IMatchEvent, b: IMatchEvent) => (a.eventTime || 0) - (b.eventTime || 0));
  
  const awayGoals = events.filter((e: IMatchEvent) => 
    e.eventType === "GOAL" && e.teamId === match.awayTeamId
  ).sort((a: IMatchEvent, b: IMatchEvent) => (a.eventTime || 0) - (b.eventTime || 0));

  // Timer state
  const [displayTime, setDisplayTime] = useState("00:00");

  // Format time from seconds to MM:SS (capped at 120 minutes)
  const formatTime = (seconds: number): string => {
    // Cap at 120 minutes (7200 seconds) for match duration
    const cappedSeconds = Math.min(seconds, 7200);
    const mins = Math.floor(cappedSeconds / 60);
    const secs = cappedSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Animate score changes
  useEffect(() => {
    if (homeScoreRef.current) {
      gsap.from(homeScoreRef.current, {
        scale: 1.5,
        duration: 0.5,
        ease: "elastic.out(1, 0.5)",
      });
    }
  }, [match.homeTeamScore]);

  useEffect(() => {
    if (awayScoreRef.current) {
      gsap.from(awayScoreRef.current, {
        scale: 1.5,
        duration: 0.5,
        ease: "elastic.out(1, 0.5)",
      });
    }
  }, [match.awayTeamScore]);

  // Pulse animation for ongoing matches
  useEffect(() => {
    if (match.matchStatus === "ONGOING") {
      const pulseTimeline = gsap.timeline({ repeat: -1 });

      if (homeGlowRef.current) {
        pulseTimeline.to(homeGlowRef.current, {
          opacity: 0.8,
          duration: 1.5,
          ease: "sine.inOut",
        }).to(homeGlowRef.current, {
          opacity: 0.3,
          duration: 1.5,
          ease: "sine.inOut",
        });
      }

      if (awayGlowRef.current) {
        gsap.timeline({ repeat: -1 })
          .to(awayGlowRef.current, {
            opacity: 0.8,
            duration: 1.5,
            ease: "sine.inOut",
            delay: 0.75,
          })
          .to(awayGlowRef.current, {
            opacity: 0.3,
            duration: 1.5,
            ease: "sine.inOut",
          });
      }

      return () => {
        pulseTimeline.kill();
      };
    }
  }, [match.matchStatus]);

  // Timer logic for ongoing/paused/completed matches
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (match.matchStatus === "ONGOING" && match.startedAt) {
      const startTime = moment.utc(match.startedAt).local().valueOf();
      const initialElapsed = match.elapsedTimeSeconds || 0;

      const calculateElapsedTime = () => {
        const now = Date.now();
        const timeSinceStart = Math.floor((now - startTime) / 1000);
        const totalElapsed = initialElapsed + timeSinceStart;
        // Cap at 120 minutes (7200 seconds) for match duration
        const cappedElapsed = Math.min(totalElapsed, 7200);
        setDisplayTime(formatTime(cappedElapsed));
      };

      calculateElapsedTime();
      interval = setInterval(calculateElapsedTime, 1000);
    } else if (match.matchStatus === "PAUSED") {
      const pausedTime = match.elapsedTimeSeconds || 0;
      // Cap at 120 minutes
      const cappedPaused = Math.min(pausedTime, 7200);
      setDisplayTime(formatTime(cappedPaused));
    } else if (match.matchStatus === "COMPLETED") {
      let finalTime = match.elapsedTimeSeconds || 0;

      if (match.startedAt && match.completedAt) {
        const startTime = moment.utc(match.startedAt).local().valueOf();
        const endTime = moment.utc(match.completedAt).local().valueOf();
        finalTime = Math.floor((endTime - startTime) / 1000);
      }
      
      // Cap at 120 minutes
      const cappedFinal = Math.min(finalTime, 7200);
      setDisplayTime(formatTime(cappedFinal));
    } else {
      setDisplayTime("00:00");
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    match.matchStatus,
    match.startedAt,
    match.elapsedTimeSeconds,
    match.completedAt,
    match.id,
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED": return "blue";
      case "ONGOING": return "red";
      case "PAUSED": return "orange";
      case "COMPLETED": return "green";
      default: return "default";
    }
  };

  return (
    <Card
      style={{
        marginBottom: 24,
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(56, 0, 60, 0.4)",
        border: "none",
        background: "linear-gradient(135deg, #38003c 0%, #570a57 100%)",
        position: "relative",
      }}
      bodyStyle={{ padding: 0 }}
    >
      {/* Main Score Display */}
      <div style={{ position: "relative" }}>
        {/* Left Side Color Bar */}
        <div
          style={{
            width: 6,
            height: "100%",
            background: "#e90052",
            position: "absolute",
            left: 0,
            top: 0,
          }}
        />

        {/* Right Side Color Bar */}
        <div
          style={{
            width: 6,
            height: "100%",
            background: "#e90052",
            position: "absolute",
            right: 0,
            top: 0,
          }}
        />

        {/* Score Layout */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 32px",
          }}
        >
          {/* Home Team Section */}
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 24,
            }}
          >
            {/* Animated Background Glow for Home */}
            <div
              ref={homeGlowRef}
              style={{
                position: "absolute",
                left: "10%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: "300px",
                height: "300px",
                background: "radial-gradient(circle, rgba(0, 255, 133, 0.15) 0%, transparent 70%)",
                opacity: 0.3,
                pointerEvents: "none",
                filter: "blur(40px)",
              }}
            />

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 4,
                position: "relative",
                zIndex: 1,
              }}
            >
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  color: "white",
                  textTransform: "uppercase",
                  letterSpacing: "1.5px",
                  textShadow: "0 2px 12px rgba(0,0,0,0.3)",
                }}
              >
                {match.homeTeamName}
              </div>
              {homeGoals.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 6,
                    marginTop: 4,
                    justifyContent: "flex-end",
                  }}
                >
                  {homeGoals.map((goal: IMatchEvent, index: number) => (
                    <Text
                      key={goal.id || index}
                      style={{
                        fontSize: 11,
                        color: "rgba(255, 255, 255, 0.85)",
                        lineHeight: 1.2,
                        textShadow: "0 1px 4px rgba(0,0,0,0.3)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      ⚽ {goal.playerName || "Unknown"}
                    </Text>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Center Score Box with Time */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 0,
              position: "relative",
              zIndex: 2,
            }}
          >
            {/* Home Score */}
            <div
              style={{
                background: "#00ff85",
                padding: "12px 20px",
                borderRadius: "6px 0 0 6px",
              }}
            >
              <div
                ref={homeScoreRef}
                style={{
                  fontSize: 36,
                  fontWeight: 900,
                  color: "#38003c",
                  lineHeight: 1,
                  minWidth: 32,
                  textAlign: "center",
                  fontFamily: "'Inter', -apple-system, sans-serif",
                }}
              >
                {match.homeTeamScore}
              </div>
            </div>

            {/* Time/Timer in Middle */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.95)",
                padding: "8px 16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minWidth: 80,
              }}
            >
              {match.matchStatus === "SCHEDULED" ? (
                // Show scheduled time
                <>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#38003c",
                      lineHeight: 1.2,
                    }}
                  >
                    {moment(match.matchDate).format("HH:mm")}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      color: "#38003c",
                      opacity: 0.6,
                      textTransform: "uppercase",
                      marginTop: 2,
                    }}
                  >
                    {moment(match.matchDate).format("DD MMM")}
                  </div>
                </>
              ) : (
                // Show match timer for ONGOING, PAUSED, or COMPLETED
                <>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 900,
                      color: "#38003c",
                      lineHeight: 1.2,
                      fontFamily: "monospace",
                      letterSpacing: "1px",
                    }}
                  >
                    {displayTime}
                  </div>
                  <div
                    style={{
                      fontSize: 8,
                      fontWeight: 700,
                      color: match.matchStatus === "ONGOING" ? "#fa8c16" :
                             match.matchStatus === "PAUSED" ? "#722ed1" : "#52c41a",
                      textTransform: "uppercase",
                      marginTop: 2,
                      letterSpacing: "0.5px",
                    }}
                  >
                    {match.matchStatus === "ONGOING" && "🔴 LIVE"}
                    {match.matchStatus === "PAUSED" && "⏸️ PAUSED"}
                    {match.matchStatus === "COMPLETED" && "✓ FINAL"}
                  </div>
                </>
              )}
            </div>

            {/* Away Score */}
            <div
              style={{
                background: "#00ff85",
                padding: "12px 20px",
                borderRadius: "0 6px 6px 0",
              }}
            >
              <div
                ref={awayScoreRef}
                style={{
                  fontSize: 36,
                  fontWeight: 900,
                  color: "#38003c",
                  lineHeight: 1,
                  minWidth: 32,
                  textAlign: "center",
                  fontFamily: "'Inter', -apple-system, sans-serif",
                }}
              >
                {match.awayTeamScore}
              </div>
            </div>
          </div>

          {/* Away Team Section */}
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: 24,
            }}
          >
            {/* Animated Background Glow for Away */}
            <div
              ref={awayGlowRef}
              style={{
                position: "absolute",
                right: "10%",
                top: "50%",
                transform: "translate(50%, -50%)",
                width: "300px",
                height: "300px",
                background: "radial-gradient(circle, rgba(0, 255, 133, 0.15) 0%, transparent 70%)",
                opacity: 0.3,
                pointerEvents: "none",
                filter: "blur(40px)",
              }}
            />

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 4,
                position: "relative",
                zIndex: 1,
              }}
            >
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  color: "white",
                  textTransform: "uppercase",
                  letterSpacing: "1.5px",
                  textShadow: "0 2px 12px rgba(0,0,0,0.3)",
                }}
              >
                {match.awayTeamName}
              </div>
              {awayGoals.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 6,
                    marginTop: 4,
                    justifyContent: "flex-start",
                  }}
                >
                  {awayGoals.map((goal: IMatchEvent, index: number) => (
                    <Text
                      key={goal.id || index}
                      style={{
                        fontSize: 11,
                        color: "rgba(255, 255, 255, 0.85)",
                        lineHeight: 1.2,
                        textShadow: "0 1px 4px rgba(0,0,0,0.3)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      ⚽ {goal.playerName || "Unknown"}
                    </Text>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tournament & Match Info Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 24px",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        {/* Left Section: Back Button & Tournament Info */}
        <Space size={12} align="center">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "white",
              borderRadius: 8,
              height: 36,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
            }}
          >
            Back
          </Button>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "8px",
              background: "rgba(255, 255, 255, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TrophyOutlined style={{ fontSize: 16, color: "white" }} />
          </div>
          <div>
            <div
              style={{
                color: "white",
                fontSize: 14,
                fontWeight: 700,
                lineHeight: 1.2,
              }}
            >
              {match.tournamentName}
            </div>
            <Space size={12} style={{ marginTop: 4 }}>
              <Space size={4}>
                <EnvironmentOutlined style={{ color: "rgba(255,255,255,0.8)", fontSize: 11 }} />
                <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 11 }}>
                  {match.venueName}
                </span>
              </Space>
            </Space>
          </div>
        </Space>

        {/* Right Section: Match Details & Admin Controls */}
        <Space size={12} align="center">
          {/* Match Number */}
          <div
            style={{
              textAlign: "center",
              padding: "6px 12px",
              background: "rgba(255, 255, 255, 0.15)",
              borderRadius: 6,
            }}
          >
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 9, marginBottom: 2 }}>
              Match #
            </div>
            <div style={{ color: "white", fontSize: 14, fontWeight: 700 }}>
              {match.matchOrder}
            </div>
          </div>

          {/* Duration */}
          <div
            style={{
              textAlign: "center",
              padding: "6px 12px",
              background: "rgba(255, 255, 255, 0.15)",
              borderRadius: 6,
            }}
          >
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 9, marginBottom: 2 }}>
              Duration
            </div>
            <div style={{ color: "white", fontSize: 14, fontWeight: 700 }}>
              {match.matchDurationMinutes}'
            </div>
          </div>

          {/* Admin Controls */}
          {isAdmin && (
            <MatchLivePanel fixture={match} onSuccess={onRefresh} compact />
          )}

          {/* Match Status (only show if not admin) */}
          {!isAdmin && (
            <Tag
              color={getStatusColor(match.matchStatus)}
              style={{
                fontSize: 10,
                padding: "4px 12px",
                fontWeight: 700,
                border: "none",
                borderRadius: "4px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                margin: 0,
                animation: match.matchStatus === "ONGOING" ? "pulse 2s ease-in-out infinite" : "none",
              }}
            >
              {match.matchStatus}
            </Tag>
          )}
        </Space>
      </div>

      {/* Global Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }
      `}</style>
    </Card>
  );
}

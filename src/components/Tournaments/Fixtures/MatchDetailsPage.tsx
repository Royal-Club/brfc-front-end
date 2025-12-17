import React, { useState } from "react";
import {
  Card,
  Spin,
  Tabs,
  Button,
  Badge,
  Alert,
  theme,
} from "antd";
import {
  ArrowLeftOutlined,
  LockOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useGetMatchQuery } from "../../../state/features/fixtures/fixturesSlice";
import { useGetTournamentSummaryQuery } from "../../../state/features/tournaments/tournamentsSlice";
import { selectLoginInfo } from "../../../state/slices/loginInfoSlice";
import MatchEventTimeline from "./MatchEventTimeline";
import QuickEventRecorder from "./QuickEventRecorder";
import ElectricTeamBanner from "./ElectricTeamBanner";
const { useToken } = theme;

export default function MatchDetailsPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const [refetchKey, setRefetchKey] = useState(0);
  const loginInfo = useSelector(selectLoginInfo);
  const isAdmin = loginInfo.roles?.includes("ADMIN");
  const { token } = useToken();

  const { data: matchResponse, isLoading, refetch } = useGetMatchQuery(
    { matchId: Number(matchId) },
    { skip: !matchId }
  );

  const match = matchResponse?.content;

  const { data: tournamentSummary } = useGetTournamentSummaryQuery(
    { tournamentId: match?.tournamentId || 0 },
    { skip: !match?.tournamentId }
  );

  const handleRefresh = () => {
    refetch();
    setRefetchKey((prev) => prev + 1);
  };

  if (isLoading || !match) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  // Build team players map
  const teamPlayersMap: Record<number, Array<{ id: number; name: string }>> = {};
  const tournament = tournamentSummary?.content?.[0];
  if (tournament?.teams) {
    tournament.teams.forEach((team) => {
      teamPlayersMap[team.teamId] = (team.players || []).map((player) => ({
        id: player.playerId,
        name: player.playerName,
      }));
    });
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Electric Team Banner */}
      <ElectricTeamBanner
        match={match}
        colorBgContainer={token.colorBgContainer}
        isAdmin={isAdmin}
        onRefresh={handleRefresh}
      />

      {/* Tabs Section */}
      <Card
        style={{
          borderRadius: 16,
          boxShadow: token.colorBgContainer === '#ffffff'
            ? "0 2px 8px rgba(0,0,0,0.08)"
            : "0 2px 8px rgba(0,0,0,0.3)",
        }}
      >
        <Tabs
          defaultActiveKey="information"
          onChange={handleRefresh}
          size="large"
          items={[
            // First Tab: Recent Events Timeline
            {
              key: "information",
              label: "Recent Events",
              children: (
                <MatchEventTimeline
                  matchId={match.id}
                  homeTeamId={match.homeTeamId}
                  awayTeamId={match.awayTeamId}
                  matchDurationMinutes={match.matchDurationMinutes}
                  elapsedTimeSeconds={match.elapsedTimeSeconds}
                  startedAt={match.startedAt}
                  completedAt={match.completedAt}
                />
              ),
            },

            // Second Tab: Live Control & Events (Admin Only)
            ...(isAdmin
              ? [
                  {
                    key: "live",
                    label: (
                      <span>
                        <Badge dot={match.matchStatus === "ONGOING"} color="red">
                          Live Control & Record Events
                        </Badge>
                      </span>
                    ),
                    children: (
                      <QuickEventRecorder
                        matchId={match.id}
                        fixture={match}
                        homeTeamPlayers={teamPlayersMap[match.homeTeamId] || []}
                        awayTeamPlayers={teamPlayersMap[match.awayTeamId] || []}
                        onSuccess={handleRefresh}
                      />
                    ),
                  },
                ]
              : [
                  {
                    key: "live",
                    label: (
                      <span style={{ display: "flex", alignItems: "center", gap: 8, opacity: 0.5 }}>
                        <LockOutlined style={{ fontSize: 12 }} />
                        Live Control & Events
                      </span>
                    ),
                    disabled: true,
                    children: (
                      <Alert
                        message="Admin Access Required"
                        description="Only administrators can access live match controls and event recording."
                        type="warning"
                        showIcon
                      />
                    ),
                  },
                ]),
          ]}
        />
      </Card>
    </div>
  );
}

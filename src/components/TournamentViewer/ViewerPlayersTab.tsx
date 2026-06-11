import React from "react";
import { Avatar, Card, Col, Empty, List, Row, Spin, Tag, Typography } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useGetTournamentSummaryQuery } from "../../state/features/tournaments/tournamentsSlice";
import { getTeamInitials, toAbsoluteLogoUrl } from "./teamLogoUtils";
import { toAbsolutePlayerPhotoUrl } from "../../utils/playerPhotoUtils";

const { Text, Title } = Typography;

interface ViewerPlayersTabProps {
  tournamentId: number;
}

const resolveDisplayPosition = (player: any): string | null => {
  const assignmentPosition = player?.playingPosition;
  const basePosition = player?.position || player?.playerPosition || player?.footballPosition;

  if (assignmentPosition && assignmentPosition !== "UNASSIGNED") {
    return assignmentPosition;
  }

  if (basePosition && basePosition !== "UNASSIGNED") {
    return basePosition;
  }

  return null;
};

export default function ViewerPlayersTab({ tournamentId }: ViewerPlayersTabProps) {
  const { data, isLoading } = useGetTournamentSummaryQuery({ tournamentId });

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  const teams = data?.content?.[0]?.teams || [];

  if (teams.length === 0) {
    return <Empty description="No teams or players found" style={{ padding: 48 }} />;
  }

  return (
    <Row gutter={[20, 20]}>
      {teams.map((team) => (
        <Col key={team.teamId} xs={24} sm={12} lg={8}>
          <Card
            bordered={false}
            style={{
              height: "100%",
              borderRadius: 34,
              background: "linear-gradient(135deg, rgba(14,18,34,0.96) 0%, rgba(19,27,46,0.92) 100%)",
              boxShadow: "0 22px 44px rgba(0,0,0,0.28)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            bodyStyle={{ padding: "22px 22px 18px" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: 16,
                paddingBottom: 16,
                marginBottom: 14,
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <Avatar
                size={64}
                src={toAbsoluteLogoUrl(team.logoUrl)}
                style={{
                  background: "linear-gradient(180deg, #ebfff2 0%, #dff7eb 100%)",
                  color: "#18ff98",
                  fontWeight: 900,
                  fontSize: 24,
                  border: "3px solid rgba(255,255,255,0.75)",
                  boxShadow: "0 12px 24px rgba(0,0,0,0.18)",
                }}
              >
                {getTeamInitials(team.teamName)}
              </Avatar>
              <div style={{ minWidth: 0, textAlign: "left" }}>
                <Title level={4} style={{ margin: 0, color: "#ffffff" }}>
                  {team.teamName}
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {team.players?.length || 0} players
                </Text>
              </div>
            </div>

            <List
              size="small"
              dataSource={team.players || []}
              renderItem={(player) => (
                (() => {
                  const displayPosition = resolveDisplayPosition(player);
                  return (
                <List.Item style={{ padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
                    <Avatar
                      size={28}
                      src={player.photoUrl ? toAbsolutePlayerPhotoUrl(player.photoUrl) : undefined}
                      icon={!player.photoUrl ? <UserOutlined /> : undefined}
                      style={{ backgroundColor: "rgba(255,255,255,0.1)", flexShrink: 0 }}
                    />
                    <Text style={{ flex: 1, fontSize: 13, color: "rgba(255,255,255,0.92)" }}>{player.playerName}</Text>
                    {displayPosition && (
                      <Tag style={{ fontSize: 10, margin: 0, borderRadius: 999, background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.72)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        {displayPosition.replace(/_/g, " ")}
                      </Tag>
                    )}
                    {player.teamPlayerRole === "CAPTAIN" && (
                      <Tag color="gold" style={{ fontSize: 10, margin: 0, borderRadius: 999 }}>C</Tag>
                    )}
                    {player.teamPlayerRole === "VICE_CAPTAIN" && (
                      <Tag color="cyan" style={{ fontSize: 10, margin: 0, borderRadius: 999 }}>VC</Tag>
                    )}
                  </div>
                </List.Item>
                  );
                })()
              )}
              locale={{ emptyText: "No players" }}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
}

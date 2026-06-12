import React from "react";
import { Avatar, Card, Col, Empty, Row, Spin, Tag, Typography } from "antd";
import { TrophyOutlined } from "@ant-design/icons";
import { useGetTournamentSummaryQuery } from "../../state/features/tournaments/tournamentsSlice";
import { getTeamInitials, toAbsoluteLogoUrl } from "./teamLogoUtils";
import styles from "./ViewerHomeTab.module.css";

const { Title, Text, Paragraph } = Typography;

interface ViewerHomeTabProps {
  tournamentId: number;
}

export default function ViewerHomeTab({ tournamentId }: ViewerHomeTabProps) {
  const { data, isLoading } = useGetTournamentSummaryQuery({ tournamentId });

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  const tournament = data?.content?.[0];
  const teams = tournament?.teams || [];

  if (!tournament) {
    return <Empty description="Tournament details not found" style={{ padding: 48 }} />;
  }

  const displayTitle =
    tournament.title || tournament.name || tournament.tournamentName;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Card
        bordered={false}
        className={styles.heroCard}
        style={{
          background:
            "radial-gradient(120% 120% at 50% 0%, rgba(91,33,182,0.45) 0%, rgba(19,27,46,0.92) 60%, rgba(10,13,18,0.96) 100%)",
          boxShadow: "0 22px 44px rgba(0,0,0,0.28)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
        bodyStyle={{ padding: 0 }}
      >
        <Tag className={styles.heroBadge}>OFFICIAL TOURNAMENT</Tag>

        <Title level={1} className={styles.heroTitle}>
          {displayTitle}
        </Title>

        {tournament.season && (
          <Text className={styles.heroSeason}>{tournament.season}</Text>
        )}

        {tournament.description && (
          <Paragraph className={styles.heroDescription}>
            {tournament.description}
          </Paragraph>
        )}
      </Card>

      <Card
        bordered={false}
        style={{
          borderRadius: 34,
          background: "linear-gradient(135deg, rgba(14,18,34,0.96) 0%, rgba(19,27,46,0.92) 100%)",
          boxShadow: "0 22px 44px rgba(0,0,0,0.28)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
        bodyStyle={{ padding: "22px 22px 18px" }}
      >
        <Title level={4} style={{ margin: "0 0 16px", color: "#ffffff" }}>
          <TrophyOutlined style={{ marginRight: 8 }} />
          Participants
        </Title>

        {teams.length === 0 ? (
          <Empty description="No participating teams yet" />
        ) : (
          <Row gutter={[16, 16]} justify="center">
            {teams.map((team) => (
              <Col key={team.teamId} xs={12} sm={8} md={6} lg={4}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    gap: 10,
                    padding: "16px 8px",
                    borderRadius: 20,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    height: "100%",
                  }}
                >
                  <Avatar
                    size={56}
                    src={toAbsoluteLogoUrl(team.logoUrl)}
                    style={{
                      background: "linear-gradient(180deg, #ebfff2 0%, #dff7eb 100%)",
                      color: "#18ff98",
                      fontWeight: 900,
                      fontSize: 20,
                      border: "3px solid rgba(255,255,255,0.75)",
                      boxShadow: "0 12px 24px rgba(0,0,0,0.18)",
                    }}
                  >
                    {getTeamInitials(team.teamName)}
                  </Avatar>
                  <Text style={{ color: "#ffffff", fontWeight: 600, fontSize: 13 }}>
                    {team.teamName}
                  </Text>
                </div>
              </Col>
            ))}
          </Row>
        )}
      </Card>
    </div>
  );
}

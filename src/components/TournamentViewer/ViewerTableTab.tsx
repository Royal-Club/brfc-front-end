import React, { useMemo } from "react";
import { Avatar, Card, Empty, Grid, List, Spin, Tag, Typography } from "antd";
import { useGetFixturesQuery } from "../../state/features/fixtures/fixturesSlice";
import { useGetTournamentStandingsQuery } from "../../state/features/statistics/statisticsSlice";
import type { ITournamentStanding } from "../../state/features/statistics/statisticsTypes";
import type { IFixture } from "../../state/features/fixtures/fixtureTypes";

const { Text } = Typography;

interface ViewerTableTabProps {
  tournamentId: number;
}

const rankColor = (rank: number) => {
  if (rank === 1) return "#d4af37";
  if (rank === 2) return "#9ca3af";
  if (rank === 3) return "#b87333";
  return "#1677ff";
};

export default function ViewerTableTab({ tournamentId }: ViewerTableTabProps) {
  const { data, isLoading } = useGetTournamentStandingsQuery({ tournamentId });
  const { data: fixturesResponse, isLoading: fixturesLoading } = useGetFixturesQuery({ tournamentId });
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  const standings = data?.content || [];
  const fixtures = fixturesResponse?.content || [];

  const rankingMap = useMemo(() => {
    const map = new Map<number, number>();
    standings.forEach((team, index) => {
      map.set(team.teamId, index + 1);
    });
    return map;
  }, [standings]);

  const sectionedRows = useMemo(() => {
    const rows = standings.map((team, index) => ({ ...team, rank: index + 1, key: String(team.teamId) }));

    if (!fixtures.length) {
      return [
        {
          key: "all",
          title: "Tournament Standings",
          meta: "Overall Table",
          rows,
        },
      ];
    }

    const rounds = fixtures
      .map((fixture) => fixture.round)
      .filter((round): round is number => typeof round === "number");
    const maxRound = rounds.length ? Math.max(...rounds) : null;

    const displaySectionTitle = (fixture: IFixture) => {
      if (fixture.groupName) return fixture.groupName;
      if (fixture.round != null) {
        if (maxRound != null && fixture.round === maxRound && maxRound > 1) return "Final";
        if (fixture.round === 1) return "Group Stage";
        return `Round ${fixture.round}`;
      }
      return "Tournament Stage";
    };

    const displayMeta = (fixture: IFixture) => {
      const left = fixture.round != null ? `Round ${fixture.round}` : "Round TBD";
      const right = fixture.groupName ? fixture.groupName.toUpperCase() : "DIRECT KNOCKOUT";
      return `${left} • ${right}`;
    };

    const sectionsMap = new Map<string, { title: string; meta: string; teamIds: Set<number> }>();

    fixtures.forEach((fixture) => {
      const key = fixture.groupName
        ? `group-${fixture.groupName}`
        : fixture.round != null
          ? `round-${fixture.round}`
          : "stage-default";

      if (!sectionsMap.has(key)) {
        sectionsMap.set(key, {
          title: displaySectionTitle(fixture),
          meta: displayMeta(fixture),
          teamIds: new Set<number>(),
        });
      }

      const section = sectionsMap.get(key);
      if (!section) return;

      section.teamIds.add(fixture.homeTeamId);
      section.teamIds.add(fixture.awayTeamId);
    });

    const sections = Array.from(sectionsMap.entries())
      .map(([key, section]) => {
        const scopedRows = standings
          .filter((team) => section.teamIds.has(team.teamId))
          .sort((left, right) => {
            const leftRank = rankingMap.get(left.teamId) ?? Number.MAX_SAFE_INTEGER;
            const rightRank = rankingMap.get(right.teamId) ?? Number.MAX_SAFE_INTEGER;
            return leftRank - rightRank;
          })
          .map((team, index) => ({ ...team, rank: index + 1, key: `${key}-${team.teamId}` }));

        return {
          key,
          title: section.title,
          meta: section.meta,
          rows: scopedRows,
        };
      })
      .filter((section) => section.rows.length > 0)
      .sort((left, right) => {
        const leftOrder = left.title.toLowerCase() === "final" ? -1 : 0;
        const rightOrder = right.title.toLowerCase() === "final" ? -1 : 0;
        if (leftOrder !== rightOrder) return leftOrder - rightOrder;
        return left.title.localeCompare(right.title);
      });

    return sections.length
      ? sections
      : [
          {
            key: "all",
            title: "Tournament Standings",
            meta: "Overall Table",
            rows,
          },
        ];
  }, [fixtures, rankingMap, standings]);

  if (isLoading || fixturesLoading) {
    return (
      <div style={{ textAlign: "center", padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (standings.length === 0) {
    return <Empty description="No standings data available" style={{ padding: 48 }} />;
  }

  const renderHeaderRow = () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "64px minmax(200px, 2.3fr) repeat(8, minmax(52px, 0.7fr))",
        gap: 10,
        alignItems: "center",
        padding: "0 4px 14px",
        marginBottom: 4,
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {["#", "Team", "P", "W", "D", "L", "GF", "GA", "GD", "PTS"].map((label) => (
        <Text
          key={label}
          strong
          style={{
            color: "rgba(255,255,255,0.72)",
            fontSize: 12,
            letterSpacing: 0.6,
            textTransform: "uppercase",
            textAlign: label === "Team" ? "left" : "center",
          }}
        >
          {label}
        </Text>
      ))}
    </div>
  );

  const renderRow = (row: ITournamentStanding & { rank: number; key: string }) => (
    <List.Item style={{ padding: isMobile ? "12px 0" : "11px 4px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      {isMobile ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
          <Avatar
            size={30}
            style={{
              backgroundColor: rankColor(row.rank),
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {row.rank}
          </Avatar>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text strong style={{ display: "block", color: "rgba(255,255,255,0.94)" }}>
              {row.teamName}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              P {row.matches}  W {row.wins}  D {row.draws}  L {row.losses}
            </Text>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Tag style={{ margin: 0, borderRadius: 999, background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.78)", border: "1px solid rgba(255,255,255,0.08)" }}>
              GF {row.goalsFor}
            </Tag>
            <Tag style={{ margin: 0, borderRadius: 999, background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.78)", border: "1px solid rgba(255,255,255,0.08)" }}>
              GA {row.goalsAgainst}
            </Tag>
            <Tag style={{ margin: 0, borderRadius: 999, background: "rgba(255,255,255,0.04)", color: row.goalDifference > 0 ? "#52c41a" : row.goalDifference < 0 ? "#ff4d4f" : "rgba(255,255,255,0.78)", border: "1px solid rgba(255,255,255,0.08)" }}>
              GD {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
            </Tag>
            <Tag color="blue" style={{ margin: 0, fontWeight: 700, borderRadius: 999, padding: "4px 12px" }}>
              {row.points} PTS
            </Tag>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "64px minmax(200px, 2.3fr) repeat(8, minmax(52px, 0.7fr))",
            gap: 10,
            alignItems: "center",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Avatar
              size={30}
              style={{
                backgroundColor: rankColor(row.rank),
                fontWeight: 700,
              }}
            >
              {row.rank}
            </Avatar>
          </div>
          <Text strong style={{ color: "rgba(255,255,255,0.94)" }}>
            {row.teamName}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.82)", textAlign: "center" }}>{row.matches}</Text>
          <Text style={{ color: "rgba(255,255,255,0.82)", textAlign: "center" }}>{row.wins}</Text>
          <Text style={{ color: "rgba(255,255,255,0.82)", textAlign: "center" }}>{row.draws}</Text>
          <Text style={{ color: "rgba(255,255,255,0.82)", textAlign: "center" }}>{row.losses}</Text>
          <Text style={{ color: "rgba(255,255,255,0.82)", textAlign: "center" }}>{row.goalsFor}</Text>
          <Text style={{ color: "rgba(255,255,255,0.82)", textAlign: "center" }}>{row.goalsAgainst}</Text>
          <Text
            style={{
              color:
                row.goalDifference > 0
                  ? "#52c41a"
                  : row.goalDifference < 0
                    ? "#ff4d4f"
                    : "rgba(255,255,255,0.82)",
              textAlign: "center",
              fontWeight: 700,
            }}
          >
            {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
          </Text>
          <Text style={{ color: "#69b1ff", textAlign: "center", fontWeight: 800 }}>
            {row.points}
          </Text>
        </div>
      )}
    </List.Item>
  );

  return (
    <div>
      {sectionedRows.map((section) => (
        <Card
          key={section.key}
          bordered={false}
          style={{
            borderRadius: 34,
            background: "linear-gradient(135deg, rgba(14,18,34,0.96) 0%, rgba(19,27,46,0.92) 100%)",
            boxShadow: "0 22px 44px rgba(0,0,0,0.28)",
            border: "1px solid rgba(255,255,255,0.08)",
            marginBottom: 22,
          }}
          bodyStyle={{ padding: "18px 22px 18px" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              paddingBottom: 12,
              marginBottom: 12,
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Text strong style={{ fontSize: 28, color: "#ffffff", lineHeight: 1 }}>
                {section.title}
              </Text>
              <Tag
                style={{
                  margin: 0,
                  border: "1px solid rgba(82,196,26,0.45)",
                  background: "rgba(82,196,26,0.12)",
                  color: "#52c41a",
                  borderRadius: 8,
                  fontWeight: 700,
                }}
              >
                COMPLETED
              </Tag>
            </div>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, letterSpacing: 0.8, textTransform: "uppercase" }}>
              {section.meta}
            </Text>
          </div>

          {!isMobile ? renderHeaderRow() : null}

          <List
            dataSource={section.rows}
            renderItem={renderRow}
          />
        </Card>
      ))}
    </div>
  );
}

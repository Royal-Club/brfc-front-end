import React, { useMemo } from "react";
import { Avatar, Card, Empty, Grid, List, Spin, Tag, Typography } from "antd";
import { useGetFixturesQuery } from "../../state/features/fixtures/fixturesSlice";
import { useGetTournamentStandingsQuery } from "../../state/features/statistics/statisticsSlice";
import { useGetTournamentSummaryQuery } from "../../state/features/tournaments/tournamentsSlice";
import type { ITournamentStanding } from "../../state/features/statistics/statisticsTypes";
import type { IFixture } from "../../state/features/fixtures/fixtureTypes";
import { getTeamInitials, getTeamLogoUrlFromSummary } from "./teamLogoUtils";
import styles from "./ViewerTableTab.module.css";

const { Text, Title } = Typography;

interface ViewerTableTabProps {
  tournamentId: number;
}

const rankColor = (rank: number) => {
  if (rank === 1) return "#d4af37";
  if (rank === 2) return "#9ca3af";
  if (rank === 3) return "#b87333";
  return "#1677ff";
};

const leftGridColumns = (isMobile: boolean) =>
  isMobile ? "20px minmax(120px, 1fr)" : "64px minmax(200px, 2.3fr)";

const rightGridColumns = "repeat(8, minmax(52px, 0.7fr))";

const mobileStatsGridColumns = "repeat(8, minmax(38px, 1fr))";

export default function ViewerTableTab({ tournamentId }: ViewerTableTabProps) {
  const { data, isLoading } = useGetTournamentStandingsQuery({ tournamentId });
  const { data: fixturesResponse, isLoading: fixturesLoading } =
    useGetFixturesQuery({ tournamentId });
  const { data: tournamentSummary } = useGetTournamentSummaryQuery({
    tournamentId,
  });
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  const standings = data?.content || [];
  const fixtures = fixturesResponse?.content || [];
  const leftGridCols = leftGridColumns(isMobile);
  const rightGridCols = isMobile ? mobileStatsGridColumns : rightGridColumns;

  const rankingMap = useMemo(() => {
    const map = new Map<number, number>();
    standings.forEach((team, index) => {
      map.set(team.teamId, index + 1);
    });
    return map;
  }, [standings]);

  const sectionedRows = useMemo(() => {
    const rows = standings.map((team, index) => ({
      ...team,
      rank: index + 1,
      key: String(team.teamId),
    }));

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
        if (maxRound != null && fixture.round === maxRound && maxRound > 1)
          return "Final";
        if (fixture.round === 1) return "Group Stage";
        return `Round ${fixture.round}`;
      }
      return "Tournament Stage";
    };

    const displayMeta = (fixture: IFixture) => {
      const left =
        fixture.round != null ? `Round ${fixture.round}` : "Round TBD";
      const right = fixture.groupName
        ? fixture.groupName.toUpperCase()
        : "DIRECT KNOCKOUT";
      return `${left} • ${right}`;
    };

    const sectionsMap = new Map<
      string,
      { title: string; meta: string; teamIds: Set<number> }
    >();

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
            const leftRank =
              rankingMap.get(left.teamId) ?? Number.MAX_SAFE_INTEGER;
            const rightRank =
              rankingMap.get(right.teamId) ?? Number.MAX_SAFE_INTEGER;
            return leftRank - rightRank;
          })
          .map((team, index) => ({
            ...team,
            rank: index + 1,
            key: `${key}-${team.teamId}`,
          }));

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
      <div className={styles.loadingWrap}>
        <Spin size="large" />
      </div>
    );
  }

  if (standings.length === 0) {
    return (
      <Empty
        description="No standings data available"
        className={styles.emptyWrap}
      />
    );
  }

  const HeaderRow = () =>
    isMobile ? (
      <>
        <div
          className={styles.headerRow}
          style={{ gridTemplateColumns: leftGridCols }}
        >
          {["#", "Team"].map((label) => (
            <Text
              key={label}
              className={`${styles.headerCell} ${label === "Team" ? styles.headerCellTeam : ""}`}
            >
              {label}
            </Text>
          ))}
        </div>
        <div
          className={styles.headerRowScrollable}
          style={{ gridTemplateColumns: rightGridCols }}
        >
          {["P", "W", "D", "L", "GF", "GA", "GD", "PTS"].map((label) => (
            <Text key={label} className={styles.headerCell}>
              {label}
            </Text>
          ))}
        </div>
      </>
    ) : (
      <div
        className={styles.headerRow}
        style={{
          gridTemplateColumns: `${leftGridCols} ${rightGridCols}`,
        }}
      >
        {["#", "Team", "P", "W", "D", "L", "GF", "GA", "GD", "PTS"].map(
          (label) => (
            <Text
              key={label}
              className={`${styles.headerCell} ${label === "Team" ? styles.headerCellTeam : ""}`}
            >
              {label}
            </Text>
          ),
        )}
      </div>
    );

  const DataRow = ({
    row,
    isEven,
  }: {
    row: ITournamentStanding & { rank: number; key: string };
    isEven: boolean;
  }) =>
    isMobile ? (
      <>
        <div
          className={`${styles.dataRow} ${isEven ? styles.dataRowEven : ""}`}
          style={{ gridTemplateColumns: leftGridCols }}
        >
          <div className={styles.rankCell}>
            <Avatar
              size={16}
              style={{
                backgroundColor: rankColor(row.rank),
                fontSize: 8,
              }}
              className={styles.rankAvatar}
            >
              {row.rank}
            </Avatar>
          </div>

          <div className={styles.teamCell}>
            <Avatar
              size={24}
              src={getTeamLogoUrlFromSummary(tournamentSummary, row.teamId)}
              className={styles.teamLogo}
            >
              {getTeamInitials(row.teamName, "T")}
            </Avatar>
            <Text className={styles.teamName}>{row.teamName}</Text>
          </div>
        </div>
        <div
          className={`${styles.dataRowScrollable} ${isEven ? styles.dataRowEven : ""}`}
          style={{ gridTemplateColumns: rightGridCols }}
        >
          <Text className={styles.statCell}>{row.matches}</Text>
          <Text className={styles.statCell}>{row.wins}</Text>
          <Text className={styles.statCell}>{row.draws}</Text>
          <Text className={styles.statCell}>{row.losses}</Text>
          <Text className={styles.statCell}>{row.goalsFor}</Text>
          <Text className={styles.statCell}>{row.goalsAgainst}</Text>

          <Text
            className={`${styles.gdCell} ${
              row.goalDifference > 0
                ? styles.gdPositive
                : row.goalDifference < 0
                  ? styles.gdNegative
                  : styles.gdNeutral
            }`}
          >
            {row.goalDifference > 0
              ? `+${row.goalDifference}`
              : row.goalDifference}
          </Text>

          <Text className={styles.ptsCell}>{row.points}</Text>
        </div>
      </>
    ) : (
      <div
        className={`${styles.dataRow} ${isEven ? styles.dataRowEven : ""}`}
        style={{
          gridTemplateColumns: `${leftGridCols} ${rightGridCols}`,
        }}
      >
        <div className={styles.rankCell}>
          <Avatar
            size={32}
            style={{
              backgroundColor: rankColor(row.rank),
              fontSize: 14,
            }}
            className={styles.rankAvatar}
          >
            {row.rank}
          </Avatar>
        </div>

        <div className={styles.teamCell}>
          <Avatar
            size={36}
            src={getTeamLogoUrlFromSummary(tournamentSummary, row.teamId)}
            className={styles.teamLogo}
          >
            {getTeamInitials(row.teamName, "T")}
          </Avatar>
          <Text className={styles.teamName}>{row.teamName}</Text>
        </div>

        <Text className={styles.statCell}>{row.matches}</Text>
        <Text className={styles.statCell}>{row.wins}</Text>
        <Text className={styles.statCell}>{row.draws}</Text>
        <Text className={styles.statCell}>{row.losses}</Text>
        <Text className={styles.statCell}>{row.goalsFor}</Text>
        <Text className={styles.statCell}>{row.goalsAgainst}</Text>

        <Text
          className={`${styles.gdCell} ${
            row.goalDifference > 0
              ? styles.gdPositive
              : row.goalDifference < 0
                ? styles.gdNegative
                : styles.gdNeutral
          }`}
        >
          {row.goalDifference > 0
            ? `+${row.goalDifference}`
            : row.goalDifference}
        </Text>

        <Text className={styles.ptsCell}>{row.points}</Text>
      </div>
    );

  return (
    <div className={styles.pageWrap}>
      <div className={styles.header}>
        <Title level={2} className={styles.title}>
          Tournament Standings
        </Title>
        <Text className={styles.subtitle}>Final Leaderboard & Rankings</Text>
      </div>

      <div className={styles.contentWrap}>
        {sectionedRows.map((section) => (
          <Card
            key={section.key}
            bordered={false}
            className={styles.sectionCard}
            bodyStyle={{ padding: isMobile ? "14px 12px" : "18px 22px" }}
          >
            <div className={styles.sectionHeader}>
              <div className={styles.headerLeft}>
                <Title level={4} className={styles.sectionTitle}>
                  {section.title}
                </Title>
                <Tag className={styles.statusTag}>STANDINGS</Tag>
              </div>
              <Text className={styles.headerRight}>{section.meta}</Text>
            </div>

            {isMobile ? (
              <div className={styles.tableWrapperMobile}>
                <div className={styles.tableFixedLeft}>
                  <div
                    className={styles.headerRow}
                    style={{ gridTemplateColumns: leftGridCols }}
                  >
                    {["#", "Team"].map((label) => (
                      <Text
                        key={label}
                        className={`${styles.headerCell} ${label === "Team" ? styles.headerCellTeam : ""}`}
                      >
                        {label}
                      </Text>
                    ))}
                  </div>
                  <List
                    dataSource={section.rows}
                    renderItem={(row, index) => (
                      <div
                        className={`${styles.dataRow} ${index % 2 === 1 ? styles.dataRowEven : ""}`}
                        style={{ gridTemplateColumns: leftGridCols }}
                      >
                        <div className={styles.rankCell}>
                          <Avatar
                            size={16}
                            style={{
                              backgroundColor: rankColor(row.rank),
                              fontSize: 8,
                            }}
                            className={styles.rankAvatar}
                          >
                            {row.rank}
                          </Avatar>
                        </div>

                        <div className={styles.teamCell}>
                          <Avatar
                            size={24}
                            src={getTeamLogoUrlFromSummary(
                              tournamentSummary,
                              row.teamId,
                            )}
                            className={styles.teamLogo}
                          >
                            {getTeamInitials(row.teamName, "T")}
                          </Avatar>
                          <Text className={styles.teamName}>
                            {row.teamName}
                          </Text>
                        </div>
                      </div>
                    )}
                  />
                </div>
                <div className={styles.tableScrollableRight}>
                  <div
                    className={styles.headerRow}
                    style={{ gridTemplateColumns: mobileStatsGridColumns }}
                  >
                    {["P", "W", "D", "L", "GF", "GA", "GD", "PTS"].map(
                      (label) => (
                        <Text key={label} className={styles.headerCell}>
                          {label}
                        </Text>
                      ),
                    )}
                  </div>
                  <List
                    dataSource={section.rows}
                    renderItem={(row, index) => (
                      <div
                        className={`${styles.dataRow} ${index % 2 === 1 ? styles.dataRowEven : ""}`}
                        style={{ gridTemplateColumns: mobileStatsGridColumns }}
                      >
                        <Text className={styles.statCell}>{row.matches}</Text>
                        <Text className={styles.statCell}>{row.wins}</Text>
                        <Text className={styles.statCell}>{row.draws}</Text>
                        <Text className={styles.statCell}>{row.losses}</Text>
                        <Text className={styles.statCell}>{row.goalsFor}</Text>
                        <Text className={styles.statCell}>
                          {row.goalsAgainst}
                        </Text>

                        <Text
                          className={`${styles.gdCell} ${
                            row.goalDifference > 0
                              ? styles.gdPositive
                              : row.goalDifference < 0
                                ? styles.gdNegative
                                : styles.gdNeutral
                          }`}
                        >
                          {row.goalDifference > 0
                            ? `+${row.goalDifference}`
                            : row.goalDifference}
                        </Text>

                        <Text className={styles.ptsCell}>{row.points}</Text>
                      </div>
                    )}
                  />
                </div>
              </div>
            ) : (
              <div className={styles.tableWrapper}>
                <HeaderRow />
                <List
                  dataSource={section.rows}
                  renderItem={(row, index) => (
                    <DataRow row={row} isEven={index % 2 === 1} />
                  )}
                />
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

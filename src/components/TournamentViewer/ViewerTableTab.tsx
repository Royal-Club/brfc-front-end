import { useMemo } from "react";
import { Avatar, Card, Empty, Grid, List, Spin, Tag, Typography } from "antd";
import { useGetFixturesQuery } from "../../state/features/fixtures/fixturesSlice";
import { useGetTournamentStandingsQuery } from "../../state/features/statistics/statisticsSlice";
import { useGetTournamentSummaryQuery } from "../../state/features/tournaments/tournamentsSlice";
import { useGetTournamentStructureQuery } from "../../state/features/manualFixtures/manualFixturesSlice";
import type { RoundGroupResponse } from "../../state/features/manualFixtures/manualFixtureTypes";
import type { ITournamentStanding } from "../../state/features/statistics/statisticsTypes";
import type { IFixture } from "../../state/features/fixtures/fixtureTypes";
import { getTeamInitials, getTeamLogoUrlFromSummary } from "./teamLogoUtils";
import styles from "./ViewerTableTab.module.css";

const getLeafGroups = (groups: RoundGroupResponse[] = []): RoundGroupResponse[] => {
  const result: RoundGroupResponse[] = [];
  const walk = (items: RoundGroupResponse[]) => {
    items.forEach((g) => {
      if (!g.childGroups || g.childGroups.length === 0) result.push(g);
      else walk(g.childGroups);
    });
  };
  walk(groups);
  return result;
};

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
  isMobile ? "20px minmax(150px, 1fr)" : "64px minmax(200px, 2.3fr)";

const rightGridColumns = "repeat(8, minmax(52px, 0.7fr))";

const mobileStatsGridColumns = "repeat(8, minmax(38px, 1fr))";

export default function ViewerTableTab({ tournamentId }: ViewerTableTabProps) {
  const { data, isLoading } = useGetTournamentStandingsQuery({ tournamentId });
  const { data: fixturesResponse, isLoading: fixturesLoading } =
    useGetFixturesQuery({ tournamentId });
  const { data: tournamentSummary } = useGetTournamentSummaryQuery({
    tournamentId,
  });
  const { data: structureData } = useGetTournamentStructureQuery({ tournamentId });
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  const standings = data?.content || [];
  const fixtures = fixturesResponse?.content || [];
  const leftGridCols = leftGridColumns(isMobile);
  const rightGridCols = isMobile ? mobileStatsGridColumns : rightGridColumns;

  const roundNameMap = useMemo(() => {
    const map = new Map<number, string>();
    (structureData?.content?.rounds || []).forEach((round) => {
      if (round.roundName) map.set(round.roundNumber, round.roundName);
    });
    return map;
  }, [structureData]);

  // Build order map from tournament structure (same logic as ViewerFixturesTab)
  // then reverse it so the latest stage comes first
  const orderMap = useMemo(() => {
    const map = new Map<string, number>();
    const rounds = [...(structureData?.content?.rounds || [])].sort(
      (a, b) => (a.sequenceOrder ?? a.roundNumber) - (b.sequenceOrder ?? b.roundNumber)
    );
    let index = 0;
    rounds.forEach((round) => {
      const leafGroups = getLeafGroups(round.groups || []);
      if (leafGroups.length > 0) {
        leafGroups.forEach((group) => {
          const key = group.groupName.toUpperCase();
          if (!map.has(key)) map.set(key, index++);
        });
      } else {
        const key = (round.roundName || "").toUpperCase();
        if (!map.has(key)) map.set(key, index++);
      }
    });
    // Reverse: highest original index → lowest sort value (latest stage first)
    const maxIndex = index - 1;
    const reversed = new Map<string, number>();
    map.forEach((val, key) => reversed.set(key, maxIndex - val));
    return reversed;
  }, [structureData]);

  const getSectionOrder = (title: string) => {
    const idx = orderMap.get(title.toUpperCase());
    return idx === undefined ? Number.MAX_SAFE_INTEGER : idx;
  };

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

    const displaySectionTitle = (fixture: IFixture) => {
      if (fixture.groupName) return fixture.groupName;
      if (fixture.round != null) {
        return roundNameMap.get(fixture.round) ?? `Round ${fixture.round}`;
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
      { title: string; meta: string; fixtures: IFixture[] }
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
          fixtures: [],
        });
      }

      sectionsMap.get(key)!.fixtures.push(fixture);
    });

    const teamNameMap = new Map<number, string>();
    standings.forEach((team) => teamNameMap.set(team.teamId, team.teamName));

    const sections = Array.from(sectionsMap.entries())
      .map(([key, section]) => {
        const statsByTeam = new Map<number, ITournamentStanding>();

        const ensureTeam = (teamId: number, teamName: string) => {
          let team = statsByTeam.get(teamId);
          if (!team) {
            team = {
              teamId,
              teamName: teamNameMap.get(teamId) || teamName,
              points: 0,
              goalsFor: 0,
              goalsAgainst: 0,
              matches: 0,
              wins: 0,
              draws: 0,
              losses: 0,
              goalDifference: 0,
            };
            statsByTeam.set(teamId, team);
          }
          return team;
        };

        section.fixtures.forEach((fixture) => {
          const home = ensureTeam(fixture.homeTeamId, fixture.homeTeamName);
          const away = ensureTeam(fixture.awayTeamId, fixture.awayTeamName);

          if (fixture.matchStatus !== "COMPLETED") return;

          const homeScore = fixture.homeTeamScore ?? 0;
          const awayScore = fixture.awayTeamScore ?? 0;

          home.matches += 1;
          away.matches += 1;
          home.goalsFor += homeScore;
          home.goalsAgainst += awayScore;
          away.goalsFor += awayScore;
          away.goalsAgainst += homeScore;

          if (homeScore > awayScore) {
            home.wins += 1;
            home.points += 3;
            away.losses += 1;
          } else if (homeScore < awayScore) {
            away.wins += 1;
            away.points += 3;
            home.losses += 1;
          } else {
            home.draws += 1;
            away.draws += 1;
            home.points += 1;
            away.points += 1;
          }

          home.goalDifference = home.goalsFor - home.goalsAgainst;
          away.goalDifference = away.goalsFor - away.goalsAgainst;
        });

        const scopedRows = Array.from(statsByTeam.values())
          .sort((left, right) => {
            if (right.points !== left.points) return right.points - left.points;
            if (right.goalDifference !== left.goalDifference) return right.goalDifference - left.goalDifference;
            return right.goalsFor - left.goalsFor;
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
      .sort((left, right) => getSectionOrder(left.title) - getSectionOrder(right.title));

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
  }, [fixtures, standings, orderMap, roundNameMap]);

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
            className={styles.sectionCard}
            styles={{ body: { padding: isMobile ? "14px 12px" : "18px 22px" } }}
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

import React, { useMemo, useEffect } from "react";
import {
  Card,
  Empty,
  Typography,
  Space,
  Button,
  Divider,
  message,
  Tag,
} from "antd";
import {
  ReloadOutlined,
  TrophyOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../../../../state/store";
import { TournamentStructureResponse } from "../../../../../state/features/manualFixtures/manualFixtureTypes";
import { useGetFixturesQuery } from "../../../../../state/features/fixtures/fixturesSlice";
import { setEditingFixture, setIsEditModalVisible } from "../../../../../state/features/manualFixtures/manualFixturesUISlice";
import FixturesTable from "../../FixturesTable";
import EditFixtureModal from "../../EditFixtureModal";
import { IFixture } from "../../../../../state/features/fixtures/fixtureTypes";

const { Text, Title } = Typography;

interface MatchesTabProps {
  tournamentId: number;
  tournamentStructure?: TournamentStructureResponse;
  isLoading: boolean;
  onRefresh: () => void;
  isActive?: boolean;
}

export default function MatchesTab({
  tournamentId,
  tournamentStructure,
  isLoading,
  onRefresh,
  isActive = false,
}: MatchesTabProps) {
  const dispatch = useDispatch();
  const { editingFixture, isEditModalVisible } = useSelector((state: RootState) => state.manualFixturesUI);

  // Fetch all fixtures for the tournament
  // Only fetch when tab is active to avoid unnecessary API calls
  const {
    data: fixturesData,
    isLoading: fixturesLoading,
    refetch: refetchFixtures,
  } = useGetFixturesQuery(
    { tournamentId },
    { skip: !isActive }
  );

  const fixtures = fixturesData?.content || [];

  // Refetch fixtures when tab becomes active
  useEffect(() => {
    if (isActive) {
      refetchFixtures();
    }
  }, [isActive, refetchFixtures]);
  
  // Check if there are ongoing matches for display purposes
  const hasOngoingMatches = fixtures.some(
    (f) => f.matchStatus === "ONGOING" || f.matchStatus === "PAUSED"
  );
  
  const finalFixtures = fixtures;

  // Group fixtures by round and group
  const fixturesByRoundAndGroup = useMemo(() => {
    const grouped: Record<number, Record<string, IFixture[]>> = {};
    const unmatchedFixtures: IFixture[] = [];

    // Debug: Log fixture and round data
    if (finalFixtures.length > 0 && tournamentStructure) {
      console.log("MatchesTab Debug - Fixtures:", finalFixtures.map(f => ({ id: f.id, round: f.round, groupName: f.groupName })));
      console.log("MatchesTab Debug - Rounds:", tournamentStructure.rounds.map(r => ({ id: r.id, roundNumber: r.roundNumber, roundName: r.roundName })));
    }

    finalFixtures.forEach((fixture) => {
      // Match fixture to round by tournamentId, roundNumber, or round ID
      let roundId: number | null = null;
      let matchedRound = null;
      
      if (!tournamentStructure) {
        unmatchedFixtures.push(fixture);
        return;
      }

      // Ensure tournamentId matches first
      const matchesTournament = fixture.tournamentId === tournamentStructure.tournamentId;
      if (!matchesTournament) {
        unmatchedFixtures.push(fixture);
        return;
      }

      // Try to find round by roundNumber (prefer fixture.roundNumber, fallback to fixture.round)
      const fixtureRoundNumber = fixture.roundNumber ?? fixture.round;
      if (fixtureRoundNumber) {
        matchedRound = tournamentStructure.rounds.find(
          (r) => r.roundNumber === fixtureRoundNumber
        );
        if (matchedRound) {
          roundId = matchedRound.id;
        }
      }

      // If no match found, try to match by groupName (for group-based rounds)
      if (!roundId && fixture.groupName) {
        for (const round of tournamentStructure.rounds) {
          if (round.groups?.some((g) => g.groupName === fixture.groupName)) {
            matchedRound = round;
            roundId = round.id;
            break;
          }
        }
      }

      // If still no match, try to match by round ID if fixture.round is actually a round ID
      if (!roundId && fixture.round) {
        matchedRound = tournamentStructure.rounds.find(
          (r) => r.id === fixture.round
        );
        if (matchedRound) {
          roundId = matchedRound.id;
        }
      }

      // If still no match, add to unmatched fixtures (we'll show them separately)
      if (!roundId) {
        unmatchedFixtures.push(fixture);
        return;
      }

      // Determine group name - use "No Group" for non-group-based rounds
      const groupName = matchedRound?.roundType === "GROUP_BASED" 
        ? (fixture.groupName || "No Group")
        : "No Group";

      if (!grouped[roundId]) {
        grouped[roundId] = {};
      }

      if (!grouped[roundId][groupName]) {
        grouped[roundId][groupName] = [];
      }

      grouped[roundId][groupName].push(fixture);
    });

    // Sort fixtures within each group by matchOrder (create new array to avoid mutating read-only array)
    Object.keys(grouped).forEach((roundId) => {
      Object.keys(grouped[Number(roundId)]).forEach((groupName) => {
        grouped[Number(roundId)][groupName] = [...grouped[Number(roundId)][groupName]].sort((a, b) => a.matchOrder - b.matchOrder);
      });
    });

    // Store unmatched fixtures in a special key for display
    if (unmatchedFixtures.length > 0) {
      grouped[-1] = { "Unmatched": unmatchedFixtures };
    }

    return grouped;
  }, [finalFixtures, tournamentStructure]);

  const handleRefresh = () => {
    refetchFixtures();
    onRefresh();
    message.success("Matches refreshed");
  };

  const handleEditFixture = (fixture: IFixture) => {
    dispatch(setEditingFixture(fixture));
  };

  if (!tournamentStructure || tournamentStructure.rounds.length === 0) {
    return (
      <Card style={{ margin: 24 }}>
        <Empty
          description={
            <div>
              <Text type="secondary">No matches available yet.</Text>
              <br />
              <Text type="secondary">
                Create rounds and generate matches in the Tournament tab.
              </Text>
            </div>
          }
        />
      </Card>
    );
  }

  if (finalFixtures.length === 0) {
    return (
      <div style={{ padding: 24 }}>
        <Card>
          <Empty
            description={
              <div>
                <Text type="secondary">No matches found.</Text>
                <br />
                <Text type="secondary">
                  Generate matches in the Tournament tab.
                </Text>
              </div>
            }
          />
        </Card>
      </div>
    );
  }

  // Get rounds sorted by sequence order (create new array to avoid mutating read-only array)
  const sortedRounds = [...tournamentStructure.rounds].sort((a, b) => 
    (a.sequenceOrder || 0) - (b.sequenceOrder || 0)
  );

  // Check if we have any matched fixtures
  const hasMatchedFixtures = sortedRounds.some((round) => {
    const roundFixtures = fixturesByRoundAndGroup[round.id] || {};
    return Object.keys(roundFixtures).length > 0;
  });

  // If no matches are found in rounds but we have fixtures, show them all
  const shouldShowAllFixtures = finalFixtures.length > 0 && !hasMatchedFixtures && !fixturesByRoundAndGroup[-1];

  return (
    <div style={{ padding: 24 }}>
      {/* Refresh Button */}
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end" }}>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={handleRefresh}
          loading={fixturesLoading || isLoading}
        >
          Refresh
        </Button>
      </div>

      {/* Show all fixtures if grouping failed */}
      {shouldShowAllFixtures && (
        <Card
          title={
            <Space>
              <TrophyOutlined />
              <Text strong>All Matches</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                ({fixtures.length} matches)
              </Text>
            </Space>
          }
        >
          <FixturesTable
            fixtures={[...finalFixtures].sort((a, b) => a.matchOrder - b.matchOrder)}
            isLoading={fixturesLoading || isLoading}
            onEditFixture={handleEditFixture}
          />
        </Card>
      )}

      {/* Matches organized by Round and Group */}
      {!shouldShowAllFixtures && (
        <Space direction="vertical" size={24} style={{ width: "100%" }}>
          {/* Show unmatched fixtures first if any */}
          {fixturesByRoundAndGroup[-1] && (
            <Card
              title={
                <Space>
                  <TrophyOutlined />
                  <Text strong>Unmatched Matches</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    ({fixturesByRoundAndGroup[-1]["Unmatched"]?.length || 0} matches)
                  </Text>
                </Space>
              }
            >
              <FixturesTable
                fixtures={fixturesByRoundAndGroup[-1]["Unmatched"] || []}
                isLoading={fixturesLoading || isLoading}
                onEditFixture={handleEditFixture}
              />
            </Card>
          )}

          {sortedRounds.map((round) => {
            const roundFixtures = fixturesByRoundAndGroup[round.id] || {};
            const hasMatches = Object.keys(roundFixtures).length > 0;

            if (!hasMatches) return null;

          return (
            <Card
              key={round.id}
              title={
                <Space>
                  <TrophyOutlined />
                  <Text strong style={{ fontSize: 16 }}>{round.roundName}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Round {round.roundNumber} • {round.roundType.replace("_", " ")} • {round.totalMatches} {round.totalMatches === 1 ? 'match' : 'matches'}
                  </Text>
                </Space>
              }
              extra={
                <Tag color={round.status === "COMPLETED" ? "success" : round.status === "ONGOING" ? "processing" : "default"}>
                  {round.status}
                </Tag>
              }
            >
              <Space direction="vertical" size={16} style={{ width: "100%" }}>
                {round.roundType === "GROUP_BASED" && round.groups ? (
                  // Group-based rounds - show by groups
                  round.groups.map((group) => {
                    const groupMatches = roundFixtures[group.groupName || ""] || [];
                    if (groupMatches.length === 0) return null;

                    return (
                      <div key={group.id}>
                        <Divider orientation="left">
                          <Space>
                            <TeamOutlined />
                            <Text strong style={{ fontSize: 14 }}>{group.groupName}</Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              ({groupMatches.length} {groupMatches.length === 1 ? 'match' : 'matches'})
                            </Text>
                          </Space>
                        </Divider>
                        <FixturesTable
                          fixtures={groupMatches}
                          isLoading={fixturesLoading || isLoading}
                          onEditFixture={handleEditFixture}
                        />
                      </div>
                    );
                  })
                ) : (
                  // Direct knockout rounds - show all matches for the round
                  (() => {
                    const allRoundMatches: IFixture[] = [];
                    Object.values(roundFixtures).forEach((groupMatches) => {
                      allRoundMatches.push(...groupMatches);
                    });
                    // Create new array before sorting to avoid mutating read-only array
                    const sortedMatches = [...allRoundMatches].sort((a, b) => a.matchOrder - b.matchOrder);

                    if (sortedMatches.length === 0) return null;

                    return (
                      <FixturesTable
                        fixtures={sortedMatches}
                        isLoading={fixturesLoading || isLoading}
                        onEditFixture={handleEditFixture}
                      />
                    );
                  })()
                )}

                {/* Show matches that don't belong to any group (fallback) - only for GROUP_BASED rounds */}
                {round.roundType === "GROUP_BASED" && Object.keys(roundFixtures).map((groupName) => {
                  if (groupName === "No Group" || groupName === "null") {
                    const noGroupMatches = roundFixtures[groupName] || [];
                    if (noGroupMatches.length === 0) return null;

                    return (
                      <div key={`no-group-${round.id}`}>
                        <Divider orientation="left">
                          <Space>
                            <Text strong>Other Matches</Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              ({noGroupMatches.length} matches)
                            </Text>
                          </Space>
                        </Divider>
                        <FixturesTable
                          fixtures={noGroupMatches}
                          isLoading={fixturesLoading || isLoading}
                          onEditFixture={handleEditFixture}
                        />
                      </div>
                    );
                  }
                  return null;
                })}
              </Space>
            </Card>
          );
        })}
        </Space>
      )}

      {/* Edit Fixture Modal */}
      {editingFixture && (
        <EditFixtureModal
          fixture={editingFixture}
          isModalVisible={isEditModalVisible}
          handleSetIsModalVisible={(visible: boolean) => dispatch(setIsEditModalVisible(visible))}
          onSuccess={() => {
            refetchFixtures();
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

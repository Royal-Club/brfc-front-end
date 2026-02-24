import React, { useEffect, useState } from "react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "react-beautiful-dnd";
import { useParams } from "react-router-dom";
import { Button, Card, Col, Grid, Row, Space, theme, Typography, Tabs, Tooltip, Input } from "antd";
import useTournamentTeams from "../../hooks/useTournamentTeams";
import "./tournament.css";
import CreateTeamComponent from "./Atoms/CreateTeamComponent";
import PlayerCard from "./Atoms/PlayerCard";
import TeamCard from "./Atoms/TeamCard";
import GoalKeeperDrawer from "./Atoms/GoalKeeperDrawer";
import { useSelector, useDispatch } from "react-redux";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import { RootState } from "../../state/store";
import { setActiveMainTab } from "../../state/features/tournaments/tournamentUISlice";
import PickerWheelModal from "./Atoms/pickerWheel/PickerWheelModal";
import { FileExcelOutlined, RightSquareOutlined, TrophyOutlined, SearchOutlined } from "@ant-design/icons";
import { exportToExcel, showBdLocalTime } from "../../utils/utils";
import FixturesPanel from "./Fixtures/FixturesPanel";
import PrizesPanel from "./Prizes/PrizesPanel";

const { Text } = Typography;
const { useBreakpoint } = Grid;

function SingleTournament() {
  const { id = "" } = useParams();
  const tournamentId = Number(id);
  const dispatch = useDispatch();
  const loginInfo = useSelector(selectLoginInfo);
  const activeTab = useSelector((state: RootState) => state.tournamentUI.activeMainTab);
  const {
    token: { colorBgLayout },
  } = theme.useToken();
  const screens = useBreakpoint();
  const {
    teams,
    players,
    tournamentSummary,
    handleAddPlayerToTeam,
    handleRemovePlayer,
    handleRenameTeam,
    handleRemoveTeam,
    refetchTournament,
    refetchPlayer,
  } = useTournamentTeams(tournamentId);

  // Player search state
  const [playerSearch, setPlayerSearch] = useState("");

  // Check if teams are added - disable fixtures tab if no teams
  const hasTeams = Array.isArray(teams) && teams.length > 0;

  // Check if user is admin
  const isAdmin = loginInfo.roles.includes("ADMIN") || loginInfo.roles.includes("SUPERADMIN") || loginInfo.roles.includes("COORDINATOR");

  // Filter players based on search query
  const filteredPlayers = players.filter((player) =>
    player.playerName.toLowerCase().includes(playerSearch.toLowerCase())
  );

  const handleTabChange = (key: string) => {
    // Prevent switching to fixtures tab if no teams are added
    if (key === "fixtures" && !hasTeams) {
      return;
    }
    dispatch(setActiveMainTab(key));
  };

  useEffect(() => {
    refetchTournament();
    refetchPlayer();
  }, []);

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    const destinationTeamId = destination.droppableId;

    // If dropped in same location, do nothing
    if (destinationTeamId === source.droppableId) {
      return;
    }

    // Check if dragging from unassigned players pool or from a team
    if (source.droppableId === "players") {
      // Dragging from unassigned players to a team
      const draggedPlayerId = Number(draggableId);

      // Validate that the player still exists in the unassigned pool
      const playerExists = players.some(p => p.playerId === draggedPlayerId);
      if (!playerExists) {
        console.warn(`Player ${draggedPlayerId} no longer exists in unassigned pool`);
        return;
      }

      if (destinationTeamId !== "players") {
        // Add player to team with default values
        handleAddPlayerToTeam(
          "UNASSIGNED",
          Number(destinationTeamId),
          draggedPlayerId
        );
      }
    } else {
      // Dragging from a team
      // draggableId format: "teamId-playerId"
      const dragId = draggableId.split("-");
      if (dragId.length !== 2) {
        console.warn(`Invalid draggableId format: ${draggableId}`);
        return;
      }
      
      const sourceTeamId = Number(dragId[0]);
      const draggedPlayerId = Number(dragId[1]);

      // Validate that the player still exists in the source team
      const sourceTeam = teams.find(t => t.teamId === sourceTeamId);
      const player = sourceTeam?.players.find(p => p.playerId === draggedPlayerId);
      
      if (!player) {
        console.warn(`Player ${draggedPlayerId} no longer exists in team ${sourceTeamId}`);
        return;
      }

      if (destinationTeamId === "players") {
        // Dragging back to unassigned players pool
        handleRemovePlayer(sourceTeamId, draggedPlayerId);
      } else {
        // Moving between teams
        if (player.id) {
          // Player has existing team assignment, preserve their details
          handleAddPlayerToTeam(
            player.playingPosition || "UNASSIGNED",
            Number(destinationTeamId),
            draggedPlayerId,
            player.id,
            player.isCaptain,
            player.teamPlayerRole,
            player.jerseyNumber,
            sourceTeamId
          );
        } else {
          // Fallback for new player assignment (shouldn't normally happen)
          handleAddPlayerToTeam("UNASSIGNED", Number(destinationTeamId), draggedPlayerId);
        }
      }
    }
  };

    // Function to handle export of teams data
    const handleExportTeams = () => {
        const maxPlayersCount = Math.max(...teams.map((team) => team.players.length));
        const dataToExport = Array.from({ length: maxPlayersCount }, (_, index) => {
          const row: { [key: string]: string } = {};
          teams.forEach((team) => {
            row[team.teamName] = team.players[index]?.playerName || ""; 
          });
          return row;
        });
      
        exportToExcel(dataToExport, `Tournament_Teams_${tournamentId}`);
      };
      

  return (
    <Space
      className="SingleTournament-container"
      direction="vertical"
      style={{
        width: "100%",
        minHeight: "calc(100vh - 80px) ",
        paddingTop: "10px",
      }}
    >
      <div
        
      >
        <Row
          justify="space-between"
          align="middle"
          gutter={[16, 16]} 
        >
          {/* Left Side (Tournament Info) */}
          <Col xs={24} sm={18}>
            <Space
              direction={screens.xs ? "vertical" : "horizontal"} 
              size={screens.xs ? 0 : 30}
              style={{ lineHeight: 1.2 }}
            >
              <Typography.Title level={5} style={{ margin: 0 }}>
                <TrophyOutlined /> {tournamentSummary?.content[0]?.name}
              </Typography.Title>
              <Typography.Title
                level={5}
                type="secondary"
                style={{ margin: 0 }}
              >
                <RightSquareOutlined />{" "}
                {tournamentSummary?.content[0]?.tournamentDate &&
                  showBdLocalTime(
                    tournamentSummary?.content[0]?.tournamentDate
                  )}
              </Typography.Title>
            </Space>
          </Col>

          {/* Right Side (Admin Controls) */}
          <Col xs={24} sm={6}>
            <Space
              style={{
                display:  "flex",
                justifyContent: screens.xs ? "start" : "flex-end",
                flexWrap: screens.xs ? "wrap" : "nowrap",
              }}
            >
              {isAdmin && (
                <CreateTeamComponent
                  tournamentId={tournamentId}
                  existingTeams={teams.map((team) => team.teamName)}
                  refetchSummary={refetchTournament}
                />
              )}
              {isAdmin && <PickerWheelModal teams={teams} />}
              <GoalKeeperDrawer tournamentId={tournamentId} />
              <Button onClick={handleExportTeams}>
                <FileExcelOutlined />
                Export
              </Button>
            </Space>
          </Col>
        </Row>
      </div>
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        type="card"
        items={[
          {
            key: "team-building",
            label: "Team Building",
            children: (
              <div className="team-container">
                <DragDropContext onDragEnd={onDragEnd}>
                  <div className="team-card-container">
                    {teams.length > 0 ? (
                      teams.map((team) => (
                        <TeamCard
                          isLoading={false}
                          key={team.teamId}
                          team={team}
                          handleRemovePlayer={handleRemovePlayer}
                          handleRenameTeam={handleRenameTeam}
                          handleRemoveTeam={handleRemoveTeam}
                          handleAddPlayerToTeam={handleAddPlayerToTeam}
                        />
                      ))
                    ) : (
                      <Text
                        type="secondary"
                        style={{ textAlign: "center", width: "100%" }}
                      >
                        Create team to add player
                      </Text>
                    )}
                  </div>

                  <Card
                    title={
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                        <span>Players ({filteredPlayers.length})</span>
                        <Input
                          placeholder="Search players..."
                          prefix={<SearchOutlined />}
                          value={playerSearch}
                          onChange={(e) => setPlayerSearch(e.target.value)}
                          allowClear
                          style={{ width: 250 }}
                        />
                      </div>
                    }
                    bordered={true}
                    style={{
                      marginTop: "16px",
                      marginBottom: "10px",
                    }}
                  >
                    <Droppable droppableId="players">
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fill, minmax(250px, 1fr))",
                            gap: "8px",
                            maxHeight: "180px",
                            overflowY: "auto",
                            padding: "0 8px 0 0",
                            minHeight: 0,
                          }}
                          className="team-player-container"
                        >
                          {filteredPlayers.length > 0 ? (
                            filteredPlayers.map((player, index) => (
                              <Draggable
                                key={player.playerId.toString()}
                                draggableId={player.playerId.toString()}
                                index={index}
                              >
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    style={{
                                      padding: "8px",
                                      background: colorBgLayout,
                                      borderRadius: "4px",
                                      cursor: "grab",
                                      ...provided.draggableProps.style,
                                    }}
                                  >
                                    <PlayerCard player={player} />
                                  </div>
                                )}
                              </Draggable>
                            ))
                          ) : (
                            <Text type="secondary">
                              {playerSearch ? "No players match your search" : "No Player Found"}
                            </Text>
                          )}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </Card>
                </DragDropContext>
              </div>
            ),
          },
          {
            key: "fixtures",
            label: (
              <Tooltip title={!hasTeams ? "Please add teams in Team Building tab first" : ""}>
                <span>Fixtures</span>
              </Tooltip>
            ),
            disabled: !hasTeams,
            children: <FixturesPanel tournamentId={tournamentId} teams={teams} />,
          },
          {
            key: "prizes",
            label: (
              <span>
                <TrophyOutlined /> Prizes & Awards
              </span>
            ),
            children: <PrizesPanel tournamentId={tournamentId} />,
          },
        ]}
      />
    </Space>
  );
}

export default SingleTournament;

import React, { useRef, useState, useEffect, useMemo } from "react";
import {
  Avatar,
  Card,
  Empty,
  Grid,
  Spin,
  Typography,
  Modal,
  Button,
  Select,
} from "antd";
import { UserOutlined, CloseOutlined } from "@ant-design/icons";
import { useGetTournamentSummaryQuery } from "../../state/features/tournaments/tournamentsSlice";
import { getTeamInitials, toAbsoluteLogoUrl } from "./teamLogoUtils";
import { toAbsolutePlayerPhotoUrl } from "../../utils/playerPhotoUtils";
import styles from "./ViewerPlayersTab.module.css";

const { Text, Title } = Typography;

interface ViewerPlayersTabProps {
  tournamentId: number;
}

interface Team {
  teamId: number;
  teamName: string;
  logoUrl?: string;
  players?: Player[];
}

interface Player {
  playerId: number;
  playerName: string;
  photoUrl?: string;
  playingPosition?: string;
  position?: string;
  playerPosition?: string;
  footballPosition?: string;
  teamPlayerRole?: string;
  isCaptain?: boolean;
}

const resolveDisplayPosition = (player: Player): string | null => {
  const assignmentPosition = player?.playingPosition;
  const basePosition =
    player?.position || player?.playerPosition || player?.footballPosition;

  if (assignmentPosition && assignmentPosition !== "UNASSIGNED") {
    return assignmentPosition;
  }

  if (basePosition && basePosition !== "UNASSIGNED") {
    return basePosition;
  }

  return null;
};

const normalizeTeamName = (name: string) => name.toUpperCase();

function PlayerCard({
  player,
  isMobile,
}: {
  player: Player;
  isMobile: boolean;
}) {
  const [previewVisible, setPreviewVisible] = useState(false);
  const lastActiveElement = useRef<HTMLElement | null>(null);

  const openPreview = (photoUrl?: string) => {
    if (!photoUrl) return;
    lastActiveElement.current = document.activeElement as HTMLElement | null;
    setPreviewVisible(true);
  };

  const closePreview = () => {
    setPreviewVisible(false);
    try {
      lastActiveElement.current?.focus();
    } catch (e) {
      // ignore
    }
  };

  const avatarSize = isMobile ? 32 : 40;
  const photoUrl = player.photoUrl
    ? toAbsolutePlayerPhotoUrl(player.photoUrl)
    : undefined;
  const normalizedPosition = resolveDisplayPosition(player)?.toUpperCase();
  const isGoalkeeper = normalizedPosition === "GOALKEEPER";
  const isCaptain =
    player.teamPlayerRole === "CAPTAIN" ||
    player.isCaptain === true ||
    /\((c)\)|\[(c)\]/i.test(player.playerName);
  const isViceCaptain = player.teamPlayerRole === "VICE_CAPTAIN";
  const roleSuffixes: string[] = [];

  if (isCaptain) {
    roleSuffixes.push("C");
  }

  if (isViceCaptain) {
    roleSuffixes.push("VC");
  }

  if (isGoalkeeper) {
    roleSuffixes.push("GK");
  }

  const playerDisplayName =
    roleSuffixes.length > 0
      ? `${player.playerName} (${roleSuffixes.join(", ")})`
      : player.playerName;

  return (
    <>
      <div className={styles.playerItem}>
        <div
          role={photoUrl ? "button" : undefined}
          tabIndex={photoUrl ? 0 : -1}
          onClick={() => openPreview(photoUrl)}
          onKeyDown={(e) => {
            if (!photoUrl) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openPreview(photoUrl);
            }
          }}
          aria-label={
            photoUrl ? `Preview photo of ${player.playerName}` : undefined
          }
          style={{
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          <Avatar
            size={avatarSize}
            src={photoUrl}
            icon={!photoUrl ? <UserOutlined /> : undefined}
            className={`${styles.playerAvatar} ${
              photoUrl ? styles.playerAvatarClickable : ""
            }`}
          />
        </div>

        <div className={styles.playerContent}>
          <Text className={styles.playerName}>{playerDisplayName}</Text>
        </div>
      </div>

      <Modal
        open={previewVisible}
        footer={null}
        centered
        onCancel={closePreview}
        bodyStyle={{ padding: 8, background: "#000", borderRadius: 12 }}
        width={Math.min(520, window.innerWidth - 80)}
        closable={false}
        destroyOnClose
        style={{ borderRadius: 12, overflow: "hidden" }}
        maskStyle={{ background: "rgba(0,0,0,0.9)" }}
        aria-modal
        aria-label="Player photo preview"
        keyboard
        maskClosable
      >
        {photoUrl ? (
          <div
            style={{
              position: "relative",
              borderRadius: 12,
              overflow: "hidden",
              background: "#000",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <button
              onClick={closePreview}
              aria-label="Close photo preview"
              style={{
                position: "absolute",
                right: 10,
                top: 10,
                zIndex: 20,
                width: 36,
                height: 36,
                borderRadius: 18,
                background: "rgba(0,0,0,0.6)",
                border: "1px solid rgba(255,255,255,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: 0,
              }}
            >
              <CloseOutlined style={{ color: "#fff", fontSize: 16 }} />
            </button>

            <div
              style={{
                padding: 6,
                width: "100%",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <img
                src={photoUrl}
                alt="Player photo"
                style={{
                  maxWidth: "100%",
                  maxHeight: "60vh",
                  height: "auto",
                  display: "block",
                  borderRadius: 8,
                }}
              />
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}

export default function ViewerPlayersTab({
  tournamentId,
}: ViewerPlayersTabProps) {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.sm;
  const { data, isLoading, isFetching } = useGetTournamentSummaryQuery({
    tournamentId,
  });
  const [activeFilter, setActiveFilter] = useState<string | string[]>("ALL");

  const teams = useMemo(() => data?.content?.[0]?.teams || [], [data]);

  const filters = useMemo(() => {
    const labels = Array.from(
      new Set(teams.map((team: Team) => team.teamName)),
    ).sort();
    return ["ALL", ...labels];
  }, [teams]);

  const visibleTeams = useMemo(() => {
    if (
      activeFilter === "ALL" ||
      (Array.isArray(activeFilter) && activeFilter.includes("ALL"))
    ) {
      return teams;
    }
    const selectedFilters = Array.isArray(activeFilter)
      ? activeFilter
      : [activeFilter];
    return teams.filter((team: Team) =>
      selectedFilters.includes(team.teamName),
    );
  }, [activeFilter, teams]);

  const handleFilterChange = (value: string | string[]) => {
    // If "ALL" is selected, clear other selections and select only "ALL"
    if (Array.isArray(value) && value.includes("ALL")) {
      setActiveFilter("ALL");
    } else if (value === "ALL") {
      setActiveFilter("ALL");
    } else {
      setActiveFilter(value);
    }
  };

  if (isLoading || isFetching) {
    return (
      <div className={styles.loadingWrap}>
        <Spin size="large" />
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <Empty
        description="No teams or players found"
        className={styles.emptyWrap}
      />
    );
  }

  return (
    <div className={styles.pageWrap}>
      <div className={styles.header}>
        <Title level={2} className={styles.title}>
          Tournament Players
        </Title>
        <Text className={styles.subtitle}>Team Roster & Squad Details</Text>
      </div>

      <div className={styles.contentWrap}>
        {isMobile ? (
          <div className={styles.filterDropdown}>
            <Select
              value={
                activeFilter === "ALL"
                  ? []
                  : Array.isArray(activeFilter)
                    ? activeFilter
                    : [activeFilter]
              }
              onChange={handleFilterChange}
              options={filters.map((filter) => ({
                label: normalizeTeamName(filter),
                value: filter,
              }))}
              placeholder="Select teams or ALL"
              className={styles.filterSelect}
              maxTagCount="responsive"
            />
          </div>
        ) : (
          <div className={styles.filterBar}>
            {filters.map((filter) => {
              const isActive =
                filter === activeFilter ||
                (Array.isArray(activeFilter) && activeFilter.includes(filter));
              return (
                <Button
                  key={filter}
                  type="text"
                  onClick={() => handleFilterChange(filter)}
                  className={`${styles.filterButton} ${
                    isActive ? styles.filterButtonActive : ""
                  }`}
                >
                  {normalizeTeamName(filter)}
                </Button>
              );
            })}
          </div>
        )}

        <div className={styles.teamsGrid}>
          {visibleTeams.map((team: Team) => (
            <Card
              key={team.teamId}
              className={styles.teamCard}
              bordered={false}
              bodyStyle={{ padding: "18px" }}
            >
              <div className={styles.cardHeader}>
                <Avatar
                  size={48}
                  src={toAbsoluteLogoUrl(team.logoUrl)}
                  className={styles.teamLogo}
                >
                  {getTeamInitials(team.teamName)}
                </Avatar>
                <div className={styles.teamInfo}>
                  <div className={styles.teamName}>{team.teamName}</div>
                  <div className={styles.teamMeta}>
                    {team.players?.length || 0} PLAYERS
                  </div>
                </div>
              </div>

              {team.players && team.players.length > 0 ? (
                <div className={styles.playersList}>
                  {team.players.map((player: Player) => (
                    <PlayerCard
                      key={player.playerId}
                      player={player}
                      isMobile={false}
                    />
                  ))}
                </div>
              ) : (
                <Text
                  style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.55)" }}
                >
                  No players available
                </Text>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

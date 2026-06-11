import React, { useRef, useState } from "react";
import { Avatar, Card, Col, Empty, List, Row, Spin, Tag, Typography, Modal } from "antd";
import { UserOutlined, CloseOutlined } from "@ant-design/icons";
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
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const lastActiveElement = useRef<HTMLElement | null>(null);

  const openPreview = (photoUrl?: string) => {
    if (!photoUrl) return;
    // store the element that triggered the preview so we can restore focus later
    lastActiveElement.current = document.activeElement as HTMLElement | null;
    setPreviewSrc(photoUrl);
    setPreviewVisible(true);
  };

  const closePreview = () => {
    setPreviewVisible(false);
    setPreviewSrc(null);
    // restore focus to the previously focused element for accessibility
    try {
      lastActiveElement.current?.focus();
    } catch (e) {
      // ignore
    }
  };

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
                    <div
                      role={player.photoUrl ? "button" : undefined}
                      tabIndex={player.photoUrl ? 0 : -1}
                      onClick={() => openPreview(player.photoUrl ? toAbsolutePlayerPhotoUrl(player.photoUrl) : undefined)}
                      onKeyDown={(e) => {
                        if (!player.photoUrl) return;
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openPreview(toAbsolutePlayerPhotoUrl(player.photoUrl));
                        }
                      }}
                      aria-label={player.photoUrl ? `Preview photo of ${player.playerName}` : undefined}
                      style={{ position: "relative", display: "inline-flex", alignItems: "center", cursor: player.photoUrl ? "pointer" : "default" }}
                    >
                      <Avatar
                        size={28}
                        src={player.photoUrl ? toAbsolutePlayerPhotoUrl(player.photoUrl) : undefined}
                        icon={!player.photoUrl ? <UserOutlined /> : undefined}
                        style={{ backgroundColor: "rgba(255,255,255,0.1)", flexShrink: 0 }}
                      />
                    </div>
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
        {previewSrc ? (
          <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", background: "#000", display: "flex", justifyContent: "center", alignItems: "center" }}>
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

            <div style={{ padding: 6, width: "100%", display: "flex", justifyContent: "center" }}>
              <img
                src={previewSrc}
                alt="Player photo"
                style={{ maxWidth: "100%", maxHeight: "60vh", height: "auto", display: "block", borderRadius: 8 }}
              />
            </div>
          </div>
        ) : null}
      </Modal>
    </Row>
  );
}

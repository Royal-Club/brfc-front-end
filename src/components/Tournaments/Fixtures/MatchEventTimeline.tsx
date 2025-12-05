import React from "react";
import { Card, Empty, Typography, Spin, theme, Button, Modal, message, Tooltip } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { IMatchEvent } from "../../../state/features/fixtures/fixtureTypes";
import { useGetMatchEventsQuery, useDeleteMatchEventMutation } from "../../../state/features/fixtures/fixturesSlice";
import { selectLoginInfo } from "../../../state/slices/loginInfoSlice";

// Import event images
import goalIcon from "../../../assets/matchDetails/goal.png";
import assistIcon from "../../../assets/matchDetails/assist.png";
import yellowCardIcon from "../../../assets/matchDetails/yolo_card.png";
import redCardIcon from "../../../assets/matchDetails/red_card.png";
import substituteIcon from "../../../assets/matchDetails/substitute.png";
import injuryIcon from "../../../assets/matchDetails/injury.png";

const { Text } = Typography;
const { useToken } = theme;

interface MatchEventTimelineProps {
  matchId: number;
  homeTeamId: number;
  awayTeamId: number;
}

export default function MatchEventTimeline({
  matchId,
  homeTeamId,
  awayTeamId,
}: MatchEventTimelineProps) {
  const { token } = useToken();
  const { data: eventsData, isLoading } = useGetMatchEventsQuery({ matchId });
  const [deleteMatchEvent] = useDeleteMatchEventMutation();
  const loginInfo = useSelector(selectLoginInfo);
  const isAdmin = loginInfo.roles?.includes("ADMIN") || loginInfo.roles?.includes("SUPERADMIN");

  const events = eventsData?.content || [];

  const handleDeleteEvent = async (eventId: number) => {
    Modal.confirm({
      title: "Delete Event",
      content: "Are you sure you want to delete this event? This action cannot be undone.",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await deleteMatchEvent({ matchId, eventId }).unwrap();
          message.success("Event deleted successfully");
        } catch (error) {
          message.error("Failed to delete event");
        }
      },
    });
  };

  // Helper function to get event icon image
  const getEventIcon = (eventType: string): string => {
    switch (eventType) {
      case "GOAL":
        return goalIcon;
      case "ASSIST":
        return assistIcon;
      case "YELLOW_CARD":
        return yellowCardIcon;
      case "RED_CARD":
        return redCardIcon;
      case "SUBSTITUTION":
        return substituteIcon;
      case "INJURY":
        return injuryIcon;
      default:
        return goalIcon;
    }
  };

  // Helper function to get event color
  const getEventColor = (eventType: string): string => {
    switch (eventType) {
      case "GOAL":
        return "#52c41a";
      case "ASSIST":
        return "#1890ff";
      case "YELLOW_CARD":
        return "#faad14";
      case "RED_CARD":
        return "#f5222d";
      case "SUBSTITUTION":
        return "#722ed1";
      case "INJURY":
        return "#fa8c16";
      default:
        return "#8c8c8c";
    }
  };

  if (isLoading) {
    return (
      <Card style={{ height: 500 }}>
        <div style={{ textAlign: "center", paddingTop: 100 }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card style={{ height: 500 }}>
        <Empty
          description="No events recorded yet"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  return (
    <Card
      style={{
        borderRadius: 16,
        border: `1px solid ${token.colorBorder}`,
        height: 500,
        overflow: "hidden",
      }}
      bodyStyle={{
        padding: "16px 0",
        height: "100%",
        overflowY: "auto",
      }}
    >
      <div style={{ position: "relative" }}>
        {/* Center Timeline Line */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            bottom: 0,
            width: 3,
            background: `linear-gradient(180deg, ${token.colorBorder} 0%, ${token.colorBorderSecondary} 100%)`,
            transform: "translateX(-50%)",
            zIndex: 0,
          }}
        />

        {/* Events */}
        {events.map((event: IMatchEvent, index: number) => {
          const isHomeTeam = event.teamId === homeTeamId;
          const eventColor = getEventColor(event.eventType);

          return (
            <div
              key={event.id}
              style={{
                position: "relative",
                marginBottom: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: isHomeTeam ? "flex-start" : "flex-end",
                paddingLeft: 24,
                paddingRight: 24,
              }}
            >
              {/* Home Team Event (Left Side) */}
              {isHomeTeam && (
                <>
                  <div
                    style={{
                      flex: "0 0 45%",
                      textAlign: "right",
                      paddingRight: 20,
                    }}
                  >
                    <Card
                      size="small"
                      style={{
                        background: `linear-gradient(135deg, ${eventColor}15 0%, ${eventColor}08 100%)`,
                        border: `1px solid ${eventColor}40`,
                        borderRadius: 12,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                        position: "relative",
                        overflow: "hidden",
                      }}
                      bodyStyle={{ padding: 0 }}
                    >
                      {isAdmin && (
                        <Tooltip title="Delete Event">
                          <Button
                            type="text"
                            danger
                            size="large"
                            icon={<DeleteOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEvent(event.id);
                            }}
                            style={{
                              position: "absolute",
                              top: 8,
                              left: 8,
                              padding: 0,
                              width: 32,
                              height: 32,
                              zIndex: 10,
                              background: "rgba(255, 255, 255, 0.9)",
                            }}
                          />
                        </Tooltip>
                      )}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "stretch",
                          minHeight: 80,
                        }}
                      >
                        {/* Text Content */}
                        <div
                          style={{
                            flex: 1,
                            padding: "12px 16px",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            gap: 4,
                          }}
                        >
                          <Text
                            strong
                            style={{
                              fontSize: 13,
                              color: eventColor,
                              display: "block",
                              textAlign: "right",
                            }}
                          >
                            {event.eventType.replace("_", " ")}
                          </Text>
                          <Text
                            strong
                            style={{
                              fontSize: 14,
                              display: "block",
                              textAlign: "right",
                            }}
                          >
                            {event.playerName}
                          </Text>
                          {event.description && (
                            <Text
                              type="secondary"
                              style={{
                                fontSize: 11,
                                fontStyle: "italic",
                                display: "block",
                                textAlign: "right",
                                marginTop: 4,
                              }}
                            >
                              {event.description}
                            </Text>
                          )}
                        </div>
                        {/* Image taking full height */}
                        <div
                          style={{
                            width: 80,
                            background: `linear-gradient(135deg, ${eventColor}25 0%, ${eventColor}15 100%)`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderLeft: `2px solid ${eventColor}30`,
                          }}
                        >
                          <img
                            src={getEventIcon(event.eventType)}
                            alt={event.eventType}
                            style={{
                              width: 48,
                              height: 48,
                              objectFit: "contain",
                            }}
                          />
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Timeline Circle */}
                  <div
                    style={{
                      position: "absolute",
                      left: "50%",
                      transform: "translateX(-50%)",
                      zIndex: 2,
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: eventColor,
                        border: `4px solid ${token.colorBgContainer}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: `0 2px 8px ${eventColor}40`,
                      }}
                    >
                      <Text
                        strong
                        style={{
                          fontSize: 11,
                          color: "white",
                        }}
                      >
                        {event.eventTime}'
                      </Text>
                    </div>
                  </div>
                </>
              )}

              {/* Away Team Event (Right Side) */}
              {!isHomeTeam && (
                <>
                  {/* Timeline Circle */}
                  <div
                    style={{
                      position: "absolute",
                      left: "50%",
                      transform: "translateX(-50%)",
                      zIndex: 2,
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: eventColor,
                        border: `4px solid ${token.colorBgContainer}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: `0 2px 8px ${eventColor}40`,
                      }}
                    >
                      <Text
                        strong
                        style={{
                          fontSize: 11,
                          color: "white",
                        }}
                      >
                        {event.eventTime}'
                      </Text>
                    </div>
                  </div>

                  <div
                    style={{
                      flex: "0 0 45%",
                      textAlign: "left",
                      paddingLeft: 20,
                    }}
                  >
                    <Card
                      size="small"
                      style={{
                        background: `linear-gradient(135deg, ${eventColor}15 0%, ${eventColor}08 100%)`,
                        border: `1px solid ${eventColor}40`,
                        borderRadius: 12,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                        position: "relative",
                        overflow: "hidden",
                      }}
                      bodyStyle={{ padding: 0 }}
                    >
                      {isAdmin && (
                        <Tooltip title="Delete Event">
                          <Button
                            type="text"
                            danger
                            size="large"
                            icon={<DeleteOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEvent(event.id);
                            }}
                            style={{
                              position: "absolute",
                              top: 8,
                              right: 8,
                              padding: 0,
                              width: 32,
                              height: 32,
                              zIndex: 10,
                              background: "rgba(255, 255, 255, 0.9)",
                            }}
                          />
                        </Tooltip>
                      )}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "stretch",
                          minHeight: 80,
                        }}
                      >
                        {/* Image taking full height */}
                        <div
                          style={{
                            width: 80,
                            background: `linear-gradient(135deg, ${eventColor}25 0%, ${eventColor}15 100%)`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRight: `2px solid ${eventColor}30`,
                          }}
                        >
                          <img
                            src={getEventIcon(event.eventType)}
                            alt={event.eventType}
                            style={{
                              width: 48,
                              height: 48,
                              objectFit: "contain",
                            }}
                          />
                        </div>
                        {/* Text Content */}
                        <div
                          style={{
                            flex: 1,
                            padding: "12px 16px",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            gap: 4,
                          }}
                        >
                          <Text
                            strong
                            style={{
                              fontSize: 13,
                              color: eventColor,
                              display: "block",
                              textAlign: "left",
                            }}
                          >
                            {event.eventType.replace("_", " ")}
                          </Text>
                          <Text
                            strong
                            style={{
                              fontSize: 14,
                              display: "block",
                              textAlign: "left",
                            }}
                          >
                            {event.playerName}
                          </Text>
                          {event.description && (
                            <Text
                              type="secondary"
                              style={{
                                fontSize: 11,
                                fontStyle: "italic",
                                display: "block",
                                textAlign: "left",
                                marginTop: 4,
                              }}
                            >
                              {event.description}
                            </Text>
                          )}
                        </div>
                      </div>
                    </Card>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

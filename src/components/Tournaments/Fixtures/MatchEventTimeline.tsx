import React from "react";
import { Card, Empty, Typography, Spin, theme, Button, Modal, message, Tooltip, Space, Tag } from "antd";
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
  matchDurationMinutes?: number;
  elapsedTimeSeconds?: number;
  startedAt?: string | null;
  completedAt?: string | null;
}

export default function MatchEventTimeline({
  matchId,
  homeTeamId,
  awayTeamId,
  matchDurationMinutes,
  elapsedTimeSeconds,
  startedAt,
  completedAt,
}: MatchEventTimelineProps) {
  const { token } = useToken();
  const { data: eventsData, isLoading, refetch } = useGetMatchEventsQuery({ matchId });
  const [deleteMatchEvent, { isLoading: isDeleting }] = useDeleteMatchEventMutation();
  const loginInfo = useSelector(selectLoginInfo);
  const isAdmin = loginInfo.roles?.includes("ADMIN") || loginInfo.roles?.includes("SUPERADMIN");

  const events = eventsData?.content || [];

  // Helper function to format event time as MM:SS
  const formatEventTime = (event: IMatchEvent): string => {
    // For MATCH_STARTED, always show 0:00
    if (event.eventType === "MATCH_STARTED") {
      return "0:00";
    }
    
    // For MATCH_COMPLETED, calculate duration from completedAt - startedAt (like in match details)
    if (event.eventType === "MATCH_COMPLETED") {
      if (startedAt && completedAt) {
        try {
          const startTime = new Date(startedAt).getTime();
          const endTime = new Date(completedAt).getTime();
          const diffSeconds = Math.floor((endTime - startTime) / 1000);
          if (diffSeconds >= 0) {
            const minutes = Math.floor(diffSeconds / 60);
            const seconds = diffSeconds % 60;
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
          }
        } catch (e) {
          // Fall through to other methods
        }
      }
      // Fallback to matchDurationMinutes or elapsedTimeSeconds
      if (matchDurationMinutes) {
        const minutes = matchDurationMinutes;
        const seconds = 0; // Completed at full duration
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      } else if (elapsedTimeSeconds !== undefined && elapsedTimeSeconds !== null) {
        const minutes = Math.floor(elapsedTimeSeconds / 60);
        const seconds = elapsedTimeSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      } else if (event.eventTime > 0) {
        // Fallback to eventTime if available
        const minutes = event.eventTime;
        return `${minutes}:00`;
      }
      return "0:00";
    }
    
    // For regular events, try to calculate seconds from timestamps if available
    if (startedAt && event.createdDate) {
      try {
        const startTime = new Date(startedAt).getTime();
        const eventTime = new Date(event.createdDate).getTime();
        const diffSeconds = Math.floor((eventTime - startTime) / 1000);
        if (diffSeconds >= 0) {
          const minutes = Math.floor(diffSeconds / 60);
          const seconds = diffSeconds % 60;
          return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
      } catch (e) {
        // Fall through to default
      }
    }
    
    // Fallback: eventTime is in minutes, show as MM:00
    const minutes = event.eventTime || 0;
    return `${minutes}:00`;
  };

  const handleDeleteEvent = async (eventId: number) => {
    Modal.confirm({
      title: "Delete Event",
      content: "Are you sure you want to delete this event? This action cannot be undone.",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          const result = await deleteMatchEvent({ matchId, eventId }).unwrap();
          message.success("Event deleted successfully");
          // Manually refetch events to ensure UI updates immediately
          refetch();
          return result;
        } catch (error: any) {
          console.error("Delete event error:", error);
          // Handle different error statuses - safely extract error message
          let errorMessage = "Failed to delete event";
          
          try {
            // RTK Query error structure: error.data or error.error
            const errorData = error?.data || error?.error || error;
            
            // Check status code
            const status = error?.status || errorData?.statusCode || errorData?.status;
            
            if (status === 409 || status === "CONFLICT") {
              errorMessage = errorData?.message || 
                            errorData?.detail || 
                            errorData?.error || 
                            "Cannot delete events from completed matches. The match has already been completed.";
            } else if (status === 404 || status === "NOT_FOUND") {
              errorMessage = errorData?.message || 
                            errorData?.detail || 
                            "Event not found. It may have already been deleted.";
            } else {
              // Try to extract message from various possible locations
              errorMessage = errorData?.message || 
                           errorData?.detail || 
                           errorData?.error || 
                           error?.message || 
                           (typeof errorData === 'string' ? errorData : "Failed to delete event");
            }
          } catch (parseError) {
            // If error parsing fails, use a safe default message
            console.error("Error parsing error object:", parseError);
            errorMessage = "Failed to delete event. The match may have been completed.";
          }
          
          message.error(errorMessage);
          // Don't reject the promise - let the modal close after showing the error
          // This prevents uncaught promise rejection errors
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
      case "MATCH_STARTED":
      case "MATCH_COMPLETED":
        // Use goal icon as placeholder for system events
        return goalIcon;
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
      case "MATCH_STARTED":
        return "#52c41a"; // Green for start
      case "MATCH_COMPLETED":
        return "#1890ff"; // Blue for completion
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
      title={
        <Space>
          <span style={{ fontSize: 16, fontWeight: 600 }}>Match Events Timeline</span>
          <Tag color="blue" style={{ fontSize: 11 }}>{events.length} events</Tag>
        </Space>
      }
      style={{
        borderRadius: 16,
        border: `1px solid ${token.colorBorder}`,
        height: 600,
        display: "flex",
        flexDirection: "column",
        boxShadow: `0 2px 8px ${token.colorFillSecondary}`,
      }}
      bodyStyle={{
        padding: "16px 0",
        flex: 1,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div 
        style={{ 
          position: "relative",
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          paddingBottom: 20,
        }}
      >
        {/* Center Timeline Line */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            width: 3,
            height: "100%",
            minHeight: "100%",
            background: `linear-gradient(180deg, ${token.colorBorder} 0%, ${token.colorBorderSecondary} 100%)`,
            transform: "translateX(-50%)",
            zIndex: 0,
            pointerEvents: "none",
          }}
        />

        {/* Events */}
        {events.map((event: IMatchEvent, index: number) => {
          // System events (MATCH_STARTED, MATCH_COMPLETED) are centered
          const isSystemEvent = event.eventType === "MATCH_STARTED" || event.eventType === "MATCH_COMPLETED";
          const isHomeTeam = event.teamId != null && event.teamId === homeTeamId;
          const eventColor = getEventColor(event.eventType);

          // Render system events centered
          if (isSystemEvent) {
            return (
              <div
                key={event.id}
                style={{
                  position: "relative",
                  marginBottom: 40,
                  marginTop: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingLeft: 40,
                  paddingRight: 40,
                  minHeight: 100,
                }}
              >
                {/* Timeline Circle */}
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: 0,
                    transform: "translateX(-50%)",
                    zIndex: 2,
                  }}
                >
                  <div
                    style={{
                      width: 50,
                      height: 50,
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
                        fontSize: 12,
                        color: "white",
                      }}
                    >
                      {formatEventTime(event)}
                    </Text>
                  </div>
                </div>

                {/* Centered Event Card */}
                <Card
                  size="small"
                  hoverable
                  style={{
                    background: `linear-gradient(135deg, ${eventColor}15 0%, ${eventColor}08 100%)`,
                    border: `2px solid ${eventColor}50`,
                    borderRadius: 12,
                    boxShadow: `0 4px 12px ${eventColor}20`,
                    position: "relative",
                    overflow: "visible",
                    transition: "all 0.3s ease",
                    width: "75%",
                    maxWidth: 500,
                    marginTop: 30,
                    marginBottom: 30,
                  }}
                  bodyStyle={{ padding: "20px 24px" }}
                >
                  {isAdmin && (
                    <Tooltip title="Delete Event">
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEvent(event.id);
                        }}
                        style={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          padding: "4px 8px",
                          minWidth: 32,
                          height: 32,
                          zIndex: 100,
                          background: "rgba(255, 255, 255, 0.95)",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                          borderRadius: 4,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(255, 77, 79, 0.1)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(255, 255, 255, 0.95)";
                        }}
                      />
                    </Tooltip>
                  )}
                  <div style={{ 
                    textAlign: "center",
                    wordWrap: "break-word",
                    overflowWrap: "break-word",
                    whiteSpace: "normal",
                  }}>
                    <Text
                      strong
                      style={{
                        fontSize: 18,
                        color: eventColor,
                        display: "block",
                        wordBreak: "normal",
                        whiteSpace: "normal",
                        lineHeight: 1.4,
                      }}
                    >
                      {event.eventType === "MATCH_STARTED" ? "🚀 Match Started" : "🏁 Match Completed"}
                    </Text>
                    
                    {event.description && (
                      <Text
                        type="secondary"
                        style={{
                          fontSize: 12,
                          display: "block",
                          marginTop: 6,
                          wordBreak: "normal",
                          whiteSpace: "normal",
                          lineHeight: 1.4,
                        }}
                      >
                        {event.description}
                      </Text>
                    )}
                  </div>
                </Card>
              </div>
            );
          }

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
                      hoverable
                      style={{
                        background: `linear-gradient(135deg, ${eventColor}15 0%, ${eventColor}08 100%)`,
                        border: `2px solid ${eventColor}50`,
                        borderRadius: 12,
                        boxShadow: `0 4px 12px ${eventColor}20`,
                        position: "relative",
                        overflow: "hidden",
                        transition: "all 0.3s ease",
                      }}
                      bodyStyle={{ padding: 0 }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateX(-4px)";
                        e.currentTarget.style.boxShadow = `0 6px 16px ${eventColor}30`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateX(0)";
                        e.currentTarget.style.boxShadow = `0 4px 12px ${eventColor}20`;
                      }}
                    >
                      {isAdmin && (
                        <Tooltip title="Delete Event">
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEvent(event.id);
                            }}
                            style={{
                              position: "absolute",
                              top: 4,
                              left: 4,
                              padding: "4px 8px",
                              minWidth: 32,
                              height: 32,
                              zIndex: 100,
                              background: "rgba(255, 255, 255, 0.95)",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                              borderRadius: 4,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "rgba(255, 77, 79, 0.1)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "rgba(255, 255, 255, 0.95)";
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
                            {event.eventType === "MATCH_STARTED" 
                              ? "Match Started" 
                              : event.eventType === "MATCH_COMPLETED"
                              ? "Match Completed"
                              : event.eventType.replace("_", " ")}
                          </Text>
                          {event.eventType !== "MATCH_STARTED" && event.eventType !== "MATCH_COMPLETED" && (
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
                          )}
                          {event.eventType === "GOAL" && event.relatedPlayerName && (
                            <Text
                              style={{
                                fontSize: 12,
                                color: "#1890ff",
                                display: "block",
                                textAlign: "right",
                                marginTop: 2,
                                fontStyle: "italic",
                              }}
                            >
                              🎯 Assist: {event.relatedPlayerName}
                            </Text>
                          )}
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
                        {formatEventTime(event)}
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
                        {formatEventTime(event)}
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
                      hoverable
                      style={{
                        background: `linear-gradient(135deg, ${eventColor}15 0%, ${eventColor}08 100%)`,
                        border: `2px solid ${eventColor}50`,
                        borderRadius: 12,
                        boxShadow: `0 4px 12px ${eventColor}20`,
                        position: "relative",
                        overflow: "hidden",
                        transition: "all 0.3s ease",
                      }}
                      bodyStyle={{ padding: 0 }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateX(4px)";
                        e.currentTarget.style.boxShadow = `0 6px 16px ${eventColor}30`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateX(0)";
                        e.currentTarget.style.boxShadow = `0 4px 12px ${eventColor}20`;
                      }}
                    >
                      {isAdmin && (
                        <Tooltip title="Delete Event">
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEvent(event.id);
                            }}
                            style={{
                              position: "absolute",
                              top: 4,
                              right: 4,
                              padding: "4px 8px",
                              minWidth: 32,
                              height: 32,
                              zIndex: 100,
                              background: "rgba(255, 255, 255, 0.95)",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                              borderRadius: 4,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "rgba(255, 77, 79, 0.1)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "rgba(255, 255, 255, 0.95)";
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
                            {event.eventType === "MATCH_STARTED" 
                              ? "Match Started" 
                              : event.eventType === "MATCH_COMPLETED"
                              ? "Match Completed"
                              : event.eventType.replace("_", " ")}
                          </Text>
                          {event.eventType !== "MATCH_STARTED" && event.eventType !== "MATCH_COMPLETED" && (
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
                          )}
                          {event.eventType === "GOAL" && event.relatedPlayerName && (
                            <Text
                              style={{
                                fontSize: 12,
                                color: "#1890ff",
                                display: "block",
                                textAlign: "left",
                                marginTop: 2,
                                fontStyle: "italic",
                              }}
                            >
                              🎯 Assist: {event.relatedPlayerName}
                            </Text>
                          )}
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

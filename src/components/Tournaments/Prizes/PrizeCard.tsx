import React, { useState, useEffect } from "react";
import { Card, Tag, Typography, Space, Image, Button, Popconfirm, Divider, theme } from "antd";
import {
  TrophyOutlined,
  DeleteOutlined,
  EditOutlined,
  TeamOutlined,
  UserOutlined,
  DollarOutlined,
  StarFilled,
} from "@ant-design/icons";
import { TournamentPrize, PrizeType } from "../../../state/features/prizes/prizeTypes";
import { useDeleteTournamentPrizeMutation } from "../../../state/features/prizes/prizesSlice";
import { message } from "antd";

const { Title, Text, Paragraph } = Typography;

interface PrizeCardProps {
  prize: TournamentPrize;
  isAdmin?: boolean;
  onEdit?: (prize: TournamentPrize) => void;
}

export default function PrizeCard({ prize, isAdmin, onEdit }: PrizeCardProps) {
  const { token } = theme.useToken();
  const [deletePrize, { isLoading: isDeleting }] = useDeleteTournamentPrizeMutation();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const defaultBackground = `${process.env.PUBLIC_URL}/loginBackground.png`;
  const hasImages = prize.imageLinks && prize.imageLinks.length > 0;
  const backgroundImage = hasImages && prize.imageLinks ? prize.imageLinks[currentImageIndex] : defaultBackground;

  // Auto-carousel for images
  useEffect(() => {
    if (hasImages && prize.imageLinks && prize.imageLinks.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prevIndex) => 
          prize.imageLinks ? (prevIndex + 1) % prize.imageLinks.length : 0
        );
      }, 4000); // Change image every 4 seconds

      return () => clearInterval(interval);
    }
  }, [hasImages, prize.imageLinks]);

  const handleDelete = async () => {
    try {
      await deletePrize({
        tournamentId: prize.tournamentId,
        prizeId: prize.id,
      }).unwrap();
      message.success("Prize deleted successfully");
    } catch (error) {
      console.error("Failed to delete prize:", error);
    }
  };

  const getRankStyle = (rank: number, isDark: boolean) => {
    const baseStyles = {
      1: {
        gradient: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
        shadow: "0 16px 32px rgba(255, 215, 0, 0.4)",
        emoji: "🥇",
        borderColor: "#FFD700",
        titleColor: isDark ? "#FFD700" : "#B8860B",
        overlayColor: isDark ? "rgba(0, 0, 0, 0.6)" : "rgba(255, 255, 255, 0.85)",
      },
      2: {
        gradient: "linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)",
        shadow: "0 16px 32px rgba(192, 192, 192, 0.4)",
        emoji: "🥈",
        borderColor: "#C0C0C0",
        titleColor: isDark ? "#C0C0C0" : "#808080",
        overlayColor: isDark ? "rgba(0, 0, 0, 0.6)" : "rgba(255, 255, 255, 0.85)",
      },
      3: {
        gradient: "linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)",
        shadow: "0 16px 32px rgba(205, 127, 50, 0.4)",
        emoji: "🥉",
        borderColor: "#CD7F32",
        titleColor: isDark ? "#CD7F32" : "#8B4513",
        overlayColor: isDark ? "rgba(0, 0, 0, 0.6)" : "rgba(255, 255, 255, 0.85)",
      },
    };

    return baseStyles[rank as keyof typeof baseStyles] || {
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      shadow: "0 12px 24px rgba(102, 126, 234, 0.4)",
      emoji: "🏆",
      borderColor: "#667eea",
      titleColor: isDark ? "#667eea" : "#5a67d8",
      overlayColor: isDark ? "rgba(0, 0, 0, 0.6)" : "rgba(255, 255, 255, 0.85)",
    };
  };

  const formatPrizeCategory = (category: string) => {
    return category
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  // Categories that typically only have one winner (no need to show rank)
  const shouldShowRank = (category: string) => {
    const singleWinnerCategories = [
      "TOP_SCORER",
      "GOLDEN_BOOT",
      "BEST_PLAYER",
      "PLAYER_OF_TOURNAMENT",
      "TOP_ASSIST_PROVIDER",
      "BEST_GOALKEEPER",
      "BEST_DEFENDER",
      "FAIR_PLAY_AWARD",
      "YOUNG_PLAYER_AWARD",
      "CHAMPION",
    ];
    return !singleWinnerCategories.includes(category);
  };

  const isDarkMode = token.colorBgContainer === '#141414' || token.colorBgBase === '#000000';
  const rankStyle = getRankStyle(prize.positionRank, isDarkMode);
  const showRank = shouldShowRank(prize.prizeCategory);

  return (
    <Card
      className="prize-card-modern"
      style={{
        borderRadius: 20,
        overflow: "hidden",
        border: `3px solid ${rankStyle.borderColor}`,
        boxShadow: rankStyle.shadow,
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        height: "100%",
        background: token.colorBgContainer,
        position: "relative",
      }}
      bodyStyle={{ padding: 0 }}
      actions={
        isAdmin
          ? [
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => onEdit && onEdit(prize)}
                key="edit"
                size="small"
                style={{ color: token.colorText }}
              >
                Edit
              </Button>,
              <Popconfirm
                title="Delete Prize"
                description="Are you sure you want to delete this prize?"
                onConfirm={handleDelete}
                okText="Yes"
                cancelText="No"
                key="delete"
              >
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  loading={isDeleting}
                  size="small"
                >
                  Delete
                </Button>
              </Popconfirm>,
            ]
          : undefined
      }
    >
      {/* Background Image Section with Overlay */}
      <div
        style={{
          position: "relative",
          height: 200,
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          transition: "background-image 1s ease-in-out",
        }}
      >
        {/* Gradient Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(to bottom, ${rankStyle.overlayColor} 0%, ${rankStyle.overlayColor} 100%)`,
            backdropFilter: "blur(2px)",
          }}
        />

        {/* Content Over Background */}
        <div
          style={{
            position: "relative",
            height: "100%",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* Top Section: Rank Badge - Only show if needed */}
          {showRank && (
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div
                style={{
                  background: rankStyle.gradient,
                  borderRadius: "50%",
                  width: 48,
                  height: 48,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  fontSize: 18,
                  color: "#fff",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                  border: "3px solid rgba(255,255,255,0.3)",
                }}
              >
                #{prize.positionRank}
              </div>
            </div>
          )}
          {!showRank && <div style={{ height: 0 }} />}

          {/* Center Section: Trophy and Category */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 60,
                lineHeight: 1,
                marginBottom: 12,
                filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.4))",
                animation: "float 3s ease-in-out infinite",
              }}
            >
              {rankStyle.emoji}
            </div>

            <Title
              level={4}
              style={{
                color: rankStyle.titleColor,
                margin: 0,
                textShadow: isDarkMode ? "0 2px 8px rgba(0,0,0,0.8)" : "0 2px 4px rgba(255,255,255,0.8)",
                fontWeight: "bold",
                fontSize: 20,
              }}
            >
              {formatPrizeCategory(prize.prizeCategory)}
            </Title>

            <Tag
              icon={prize.prizeType === PrizeType.TEAM ? <TeamOutlined /> : <UserOutlined />}
              style={{
                marginTop: 8,
                background: isDarkMode ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)",
                color: rankStyle.titleColor,
                border: `1px solid ${rankStyle.borderColor}`,
                fontWeight: "600",
                padding: "4px 14px",
                fontSize: 12,
                borderRadius: 16,
              }}
            >
              {prize.prizeType}
            </Tag>
          </div>

          {/* Image Indicator Dots */}
          {hasImages && prize.imageLinks && prize.imageLinks.length > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 6,
              }}
            >
              {prize.imageLinks.map((_, index) => (
                <div
                  key={index}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: currentImageIndex === index 
                      ? rankStyle.borderColor 
                      : isDarkMode ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                  }}
                  onClick={() => setCurrentImageIndex(index)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div style={{ padding: "20px", background: token.colorBgContainer }}>
        {/* Winner Name */}
        <div
          style={{
            textAlign: "center",
            marginBottom: 20,
            padding: "16px",
            background: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
            borderRadius: 12,
            border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"}`,
          }}
        >
          {prize.prizeType === PrizeType.TEAM && prize.teamName && (
            <Space direction="vertical" size={8}>
              <TeamOutlined 
                style={{ 
                  fontSize: 28, 
                  color: rankStyle.titleColor,
                }} 
              />
              <Text
                strong
                style={{
                  fontSize: 20,
                  color: token.colorText,
                  display: "block",
                  fontWeight: "600",
                }}
              >
                {prize.teamName}
              </Text>
            </Space>
          )}
          {prize.prizeType === PrizeType.PLAYER && prize.playerName && (
            <Space direction="vertical" size={8}>
              <UserOutlined 
                style={{ 
                  fontSize: 28, 
                  color: rankStyle.titleColor,
                }} 
              />
              <Text
                strong
                style={{
                  fontSize: 20,
                  color: token.colorText,
                  display: "block",
                  fontWeight: "600",
                }}
              >
                {prize.playerName}
              </Text>
              {prize.playerEmployeeId && (
                <Text 
                  type="secondary" 
                  style={{ 
                    fontSize: 13,
                    opacity: 0.7,
                  }}
                >
                  ID: {prize.playerEmployeeId}
                </Text>
              )}
            </Space>
          )}
        </div>

        {/* Prize Amount */}
        {prize.prizeAmount && (
          <div
            style={{
              textAlign: "center",
              padding: "16px",
              background: rankStyle.gradient,
              borderRadius: 16,
              marginBottom: 20,
              boxShadow: rankStyle.shadow,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -20,
                right: -20,
                width: 100,
                height: 100,
                background: "rgba(255,255,255,0.1)",
                borderRadius: "50%",
              }}
            />
            <DollarOutlined 
              style={{ 
                fontSize: 24, 
                color: "#fff", 
                marginRight: 8,
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
              }} 
            />
            <Text
              strong
              style={{
                fontSize: 28,
                color: "#fff",
                textShadow: "0 2px 8px rgba(0,0,0,0.3)",
                fontWeight: "700",
              }}
            >
              ${prize.prizeAmount.toLocaleString()}
            </Text>
          </div>
        )}

        {/* Description */}
        {prize.description && (
          <>
            <Divider style={{ margin: "16px 0" }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                About
              </Text>
            </Divider>
            <Paragraph
              style={{
                marginBottom: 0,
                fontSize: 14,
                lineHeight: 1.8,
                color: token.colorTextSecondary,
              }}
              ellipsis={{ rows: 3, expandable: true, symbol: "Read more" }}
            >
              {prize.description}
            </Paragraph>
          </>
        )}

        {/* Images Gallery */}
        {hasImages && prize.imageLinks && (
          <>
            <Divider style={{ margin: "16px 0" }}>
              <Space>
                <StarFilled style={{ color: "#fadb14", fontSize: 14 }} />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Gallery ({prize.imageLinks.length})
                </Text>
              </Space>
            </Divider>
            <Image.PreviewGroup>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                  gap: 12,
                }}
              >
                {prize.imageLinks.map((link, index) => (
                  <div
                    key={index}
                    style={{
                      position: "relative",
                      borderRadius: 12,
                      overflow: "hidden",
                      cursor: "pointer",
                      transition: "transform 0.3s ease",
                    }}
                    className="gallery-item"
                  >
                    <Image
                      width="100%"
                      height={100}
                      src={link}
                      alt={`Prize ${index + 1}`}
                      style={{
                        objectFit: "cover",
                        borderRadius: 12,
                        border: currentImageIndex === index 
                          ? `3px solid ${rankStyle.borderColor}` 
                          : `2px solid ${isDarkMode ? "rgba(255,255,255,0.1)" : "#f0f0f0"}`,
                      }}
                      preview={{
                        mask: <div style={{ fontSize: 12 }}>View</div>,
                      }}
                      fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3PTWBSGcbGzM6GCKqlIBRV0dHRJFarQ0eUT8LH4BnRU0NHR0UEFVdIlFRV7TzRksomPY8uykTk/zewQfKw/9znv4yvJynLv4uLiV2dBoDiBf4qP3/ARuCRABEFAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghgg"
                    />
                  </div>
                ))}
              </div>
            </Image.PreviewGroup>
          </>
        )}
      </div>

      <style>
        {`
          .prize-card-modern:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: ${rankStyle.shadow}, 0 0 0 1px ${rankStyle.borderColor} !important;
          }

          @keyframes float {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-10px);
            }
          }

          .gallery-item:hover {
            transform: scale(1.05);
          }
        `}
      </style>
    </Card>
  );
}

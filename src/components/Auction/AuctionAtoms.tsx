import React from "react";
import { Typography, Button, Space, Card, Avatar } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { club, kicker, scoreNum } from "../../theme/clubTheme";
import { toAbsolutePlayerPhotoUrl } from "../../utils/playerPhotoUtils";
import "./Auction.css";

const { Title, Text } = Typography;

// ── Club palette shortcuts (kept local so pages read cleanly) ────────────────
export const ac = {
  gold: club.gold,
  goldSoft: club.goldSoft,
  pitch: club.pitch,
  amber: "#E6A23C",
  red: "#E0736B",
  info: "#5B8DEF",
  muted: "#8792A8",
  panel: club.panel,
  panelBorder: club.panelBorder,
  tileBg: club.tileBg,
  tileBorder: club.tileBorder,
  textPrimary: club.textPrimary,
  textMuted: club.textMuted,
};

// Status → accent colour, covering every auction/session/approval/player state.
const STATUS_COLORS: Record<string, string> = {
  LIVE: ac.pitch, RUNNING: ac.pitch, ON_AUCTION: ac.pitch, ONGOING: ac.pitch,
  PAUSED: ac.amber, PENDING: ac.amber,
  COMPLETED: ac.gold, ENDED: ac.gold,
  NOT_STARTED: ac.muted, WITHDRAWN: ac.muted, DEFAULT: ac.muted,
  REGISTRATION_OPEN: ac.info, POOL_READY: ac.info, AVAILABLE: ac.info,
  SOLD: ac.pitch, APPROVED: ac.pitch,
  UNSOLD: ac.red, REJECTED: ac.red,
};

export const statusColor = (status?: string): string =>
  (status && STATUS_COLORS[status]) || STATUS_COLORS.DEFAULT;

export const prettyStatus = (status?: string): string =>
  (status || "Unknown").replace(/_/g, " ");

// ── Gold divider used under every page header ────────────────────────────────
export const GoldDivider: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div
    style={{
      height: 2,
      borderRadius: 2,
      background: `linear-gradient(90deg, ${ac.gold} 0%, rgba(198,161,91,0) 60%)`,
      ...style,
    }}
  />
);

// ── Page wrapper: consistent max-width + vertical rhythm ─────────────────────
export const AuctionPage: React.FC<{ children: React.ReactNode; maxWidth?: number }> = ({
  children,
  maxWidth = 1080,
}) => (
  <div style={{ maxWidth, margin: "0 auto", width: "100%" }}>
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      {children}
    </Space>
  </div>
);

// ── Flush page header (title + optional back, subtitle, actions) + divider ───
interface AuctionHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  backTo?: string;
}
export const AuctionHeader: React.FC<AuctionHeaderProps> = ({
  title,
  subtitle,
  icon,
  actions,
  backTo,
}) => {
  const navigate = useNavigate();
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
          padding: "4px 0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          {backTo !== undefined && (
            <Button
              type="text"
              shape="circle"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(backTo)}
              aria-label="Back"
            />
          )}
          <div style={{ minWidth: 0 }}>
            <Title level={3} style={{ margin: 0, lineHeight: 1.15, display: "flex", alignItems: "center", gap: 10 }}>
              {icon && <span style={{ color: ac.gold, display: "inline-flex" }}>{icon}</span>}
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{title}</span>
            </Title>
            {subtitle && (
              <Text type="secondary" style={{ fontSize: 13 }}>{subtitle}</Text>
            )}
          </div>
        </div>
        {actions && <Space wrap>{actions}</Space>}
      </div>
      <GoldDivider style={{ marginTop: 10 }} />
    </div>
  );
};

// ── Status pill (broadcast-style) ────────────────────────────────────────────
export const StatusPill: React.FC<{ status?: string; label?: string }> = ({ status, label }) => {
  const color = statusColor(status);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.4,
        textTransform: "uppercase",
        lineHeight: "18px",
        padding: "2px 10px",
        borderRadius: 999,
        background: `${color}22`,
        border: `1px solid ${color}59`,
        color,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
      {label || prettyStatus(status)}
    </span>
  );
};

// ── Category pill (player grade: ICON / A_GRADE / …) ─────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  ICON: ac.gold,
  A_GRADE: ac.info,
  B_GRADE: ac.pitch,
  EMERGING: "#38BDB8",
  OUTSIDE: "#A78BFA",
};
export const CategoryPill: React.FC<{ category?: string }> = ({ category }) => {
  const color = (category && CATEGORY_COLORS[category]) || ac.muted;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontSize: 10.5,
        fontWeight: 800,
        letterSpacing: 0.6,
        textTransform: "uppercase",
        lineHeight: "16px",
        padding: "1px 8px",
        borderRadius: 6,
        background: `${color}22`,
        border: `1px solid ${color}66`,
        color,
        whiteSpace: "nowrap",
      }}
    >
      {(category || "—").replace(/_/g, " ")}
    </span>
  );
};

// ── Panel card shell (navy broadcast surface with gold accent strip) ─────────
interface PanelCardProps {
  children: React.ReactNode;
  accent?: string;
  style?: React.CSSProperties;
  bodyStyle?: React.CSSProperties;
  hoverable?: boolean;
  onClick?: () => void;
}
export const PanelCard: React.FC<PanelCardProps> = ({
  children,
  accent,
  style,
  bodyStyle,
  hoverable,
  onClick,
}) => (
  <div
    onClick={onClick}
    className={hoverable ? "auction-panel-card auction-panel-card--hover" : "auction-panel-card"}
    style={{
      background: ac.panel,
      border: `1px solid ${ac.panelBorder}`,
      borderRadius: 14,
      overflow: "hidden",
      cursor: onClick ? "pointer" : "default",
      height: "100%",
      ...style,
    }}
  >
    {accent && <div style={{ height: 3, background: accent }} />}
    <div style={{ padding: 16, ...bodyStyle }}>{children}</div>
  </div>
);

// ── Form card: theme-adaptive Ant surface with a gold top accent ─────────────
// Used for data-entry / result pages so labels & inputs stay readable in both
// light and dark mode, while still tying into the club's gold identity.
export const FormCard: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  bodyStyle?: React.CSSProperties;
}> = ({ children, style, bodyStyle }) => (
  <div
    style={{
      borderTop: `3px solid ${ac.gold}`,
      borderRadius: 14,
      overflow: "hidden",
      boxShadow: "0 6px 20px rgba(14, 24, 48, 0.12)",
      ...style,
    }}
  >
    <Card bordered={false} styles={{ body: { padding: 24, ...bodyStyle } }} style={{ borderRadius: 0 }}>
      {children}
    </Card>
  </div>
);

// ── Stat tile (kicker label + scoreboard figure) ─────────────────────────────
export const StatTile: React.FC<{
  label: React.ReactNode;
  value: React.ReactNode;
  accent?: string;
  icon?: React.ReactNode;
}> = ({ label, value, accent = ac.gold, icon }) => (
  <div
    style={{
      background: ac.tileBg,
      border: ac.tileBorder,
      borderRadius: 12,
      padding: "12px 14px",
      height: "100%",
    }}
  >
    <div style={{ ...kicker, color: ac.textMuted, display: "flex", alignItems: "center", gap: 6 }}>
      {icon && <span style={{ color: accent }}>{icon}</span>}
      {label}
    </div>
    <div style={{ ...scoreNum, color: accent, fontSize: 24, fontWeight: 800, marginTop: 4, lineHeight: 1.1 }}>
      {value}
    </div>
  </div>
);

// ── Signing tile (shared by the live board, squad modal & results) ───────────
const taka = (v?: number) => (v != null ? `৳${v.toLocaleString()}` : "—");

export const metaMuted: React.CSSProperties = { fontSize: 11, color: ac.textMuted, whiteSpace: "nowrap" };
export const teamChip: React.CSSProperties = {
  fontSize: 10.5,
  color: ac.goldSoft,
  background: "rgba(198,161,91,0.12)",
  border: "1px solid rgba(198,161,91,0.3)",
  borderRadius: 6,
  padding: "1px 7px",
  whiteSpace: "nowrap",
};

// avatar + rank + name + grade/meta on the left, a price on the right.
export const SignedTile: React.FC<{
  index: number;
  name: string;
  category?: string;
  price?: number;
  meta?: React.ReactNode;
  priceLabel?: string;
  priceColor?: string;
  photoUrl?: string;
}> = ({ index, name, category, price, meta, priceLabel = "Sold", priceColor = ac.pitch, photoUrl }) => {
  const src = photoUrl ? toAbsolutePlayerPhotoUrl(photoUrl) : undefined;
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 10,
        padding: "10px 12px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 10,
        height: "100%",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <Avatar
          size={38}
          src={src}
          style={{ flexShrink: 0, border: `1px solid ${ac.panelBorder}`, background: "rgba(198,161,91,0.14)", color: ac.goldSoft, fontSize: 13, fontWeight: 700 }}
        >
          {initials}
        </Avatar>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ ...scoreNum, color: ac.gold, fontSize: 12, fontWeight: 800 }}>#{index}</span>
            <Text strong ellipsis style={{ color: ac.textPrimary, fontSize: 14 }}>{name}</Text>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
            <CategoryPill category={category} />
            {meta}
          </div>
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ ...kicker, color: ac.textMuted, fontSize: 9 }}>{priceLabel}</div>
        <div style={{ ...scoreNum, color: priceColor, fontWeight: 800, fontSize: 18 }}>{taka(price)}</div>
      </div>
    </div>
  );
};

export { kicker, scoreNum };

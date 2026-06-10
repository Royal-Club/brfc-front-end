import React, { useMemo, useState } from "react";
import { Badge, Button, Card, Empty, Grid, Space, Spin, Tag, Typography } from "antd";
import { CalendarOutlined, EnvironmentOutlined } from "@ant-design/icons";
import moment from "moment";
import { useGetFixturesQuery } from "../../state/features/fixtures/fixturesSlice";
import type { IFixture } from "../../state/features/fixtures/fixtureTypes";

const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

interface ViewerFixturesTabProps {
  tournamentId: number;
}

const matchStatusTag = (status: string) => {
  switch (status) {
    case "ONGOING":
      return <Badge status="processing" text={<Text style={{ color: "#52c41a", fontWeight: 600 }}>LIVE</Text>} />;
    case "PAUSED":
      return <Tag color="purple">PAUSED</Tag>;
    case "COMPLETED":
      return <Tag color="default">FT</Tag>;
    default:
      return <Tag color="blue">UPCOMING</Tag>;
  }
};

const buildGroupLabel = (fixture: IFixture) => {
  if (fixture.groupName) return fixture.groupName;
  if (fixture.round != null) return `Round ${fixture.round}`;
  return "To Be Announced";
};

const buildStageLabel = (label: string) => label.toUpperCase();

const formatMatchDate = (matchDate?: string) => {
  if (!matchDate) return "TO BE ANNOUNCED";

  return moment.utc(matchDate).local().format("DD MMM YYYY, HH:mm");
};

const buildTeamBadge = (teamName?: string | null) => {
  if (!teamName) return "?";

  return teamName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";
};

function MatchCard({ fixture }: { fixture: IFixture }) {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const groupLabel = buildGroupLabel(fixture);
  const isAnnounced = Boolean(fixture.matchDate);

  return (
    <Card
      bordered={false}
      style={{
        marginBottom: 26,
        borderRadius: 38,
        background: fixture.matchStatus === "COMPLETED"
          ? "linear-gradient(135deg, rgba(14,18,34,0.96) 0%, rgba(19,27,46,0.92) 100%)"
          : "linear-gradient(135deg, rgba(34,34,34,0.96) 0%, rgba(30,36,31,0.92) 100%)",
        boxShadow: "0 22px 44px rgba(0,0,0,0.28)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
      bodyStyle={{ padding: isMobile ? "18px 14px 18px" : "26px 28px 30px" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          paddingBottom: 14,
          marginBottom: 24,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          flexWrap: "wrap",
        }}
      >
        <Tag
          style={{
            margin: 0,
            border: "none",
            borderRadius: 999,
            padding: "7px 14px",
            background: "rgba(0,255,148,0.12)",
            color: "#18ff98",
            fontWeight: 800,
            letterSpacing: 0.7,
          }}
        >
          {buildStageLabel(groupLabel)}
        </Tag>
        <Space size={10} wrap>
          {matchStatusTag(fixture.matchStatus)}
          <Text
            type="secondary"
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 0.8,
              color: "rgba(255,255,255,0.42)",
            }}
          >
            {isAnnounced ? "MATCH SCHEDULED" : "TO BE ANNOUNCED"}
          </Text>
        </Space>
      </div>

      {isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 8, minWidth: 0, width: "100%" }}>
            <div style={{ width: 54, height: 54, borderRadius: 18, border: "2px solid rgba(255,255,255,0.75)", background: "linear-gradient(180deg, #ebfff2 0%, #dff7eb 100%)", display: "grid", placeItems: "center", color: "#18ff98", fontWeight: 900, fontSize: 20, boxShadow: "0 12px 24px rgba(0,0,0,0.18)" }}>
              {buildTeamBadge(fixture.homeTeamName)}
            </div>
            <div style={{ textAlign: "center", minWidth: 0, width: "100%" }}>
              <Text strong style={{ fontSize: 14, color: "#ffffff", lineHeight: 1.25, whiteSpace: "normal", textOverflow: "ellipsis", wordBreak: "break-word", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", minHeight: 35, maxWidth: "100%", overflow: "hidden" }}>
                {fixture.homeTeamName || "TBA"}
              </Text>
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", display: "grid", placeItems: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)", fontWeight: 900, fontSize: 18, letterSpacing: 1 }}>VS</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 8, minWidth: 0, width: "100%" }}>
            <div style={{ width: 54, height: 54, borderRadius: 18, border: "2px solid rgba(255,255,255,0.75)", background: "linear-gradient(180deg, #ebfff2 0%, #dff7eb 100%)", display: "grid", placeItems: "center", color: "#18ff98", fontWeight: 900, fontSize: 20, boxShadow: "0 12px 24px rgba(0,0,0,0.18)" }}>
              {buildTeamBadge(fixture.awayTeamName)}
            </div>
            <div style={{ textAlign: "center", minWidth: 0, width: "100%" }}>
              <Text strong style={{ fontSize: 14, color: "#ffffff", lineHeight: 1.25, whiteSpace: "normal", textOverflow: "ellipsis", wordBreak: "break-word", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", minHeight: 35, maxWidth: "100%", overflow: "hidden" }}>
                {fixture.awayTeamName || "TBA"}
              </Text>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)", alignItems: "center", gap: 22 }}>
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 18, minWidth: 0 }}>
            <div style={{ textAlign: "right", minWidth: 0 }}>
              <Text strong style={{ display: "block", fontSize: 22, color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {fixture.homeTeamName || "TBA"}
              </Text>
              <Text type="secondary" style={{ fontSize: 18, color: "rgba(255,255,255,0.2)" }}>-</Text>
            </div>
            <div style={{ width: 64, height: 64, borderRadius: 22, border: "3px solid rgba(255,255,255,0.75)", background: "linear-gradient(180deg, #ebfff2 0%, #dff7eb 100%)", display: "grid", placeItems: "center", color: "#18ff98", fontWeight: 900, fontSize: 22, boxShadow: "0 12px 24px rgba(0,0,0,0.18)" }}>
              {buildTeamBadge(fixture.homeTeamName)}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 70, height: 70, borderRadius: "50%", display: "grid", placeItems: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)", fontWeight: 900, fontSize: 24, letterSpacing: 1.2 }}>VS</div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", gap: 18, minWidth: 0 }}>
            <div style={{ width: 64, height: 64, borderRadius: 22, border: "3px solid rgba(255,255,255,0.75)", background: "linear-gradient(180deg, #ebfff2 0%, #dff7eb 100%)", display: "grid", placeItems: "center", color: "#18ff98", fontWeight: 900, fontSize: 22, boxShadow: "0 12px 24px rgba(0,0,0,0.18)" }}>
              {buildTeamBadge(fixture.awayTeamName)}
            </div>
            <div style={{ textAlign: "left", minWidth: 0 }}>
              <Text strong style={{ display: "block", fontSize: 22, color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {fixture.awayTeamName || "TBA"}
              </Text>
              <Text type="secondary" style={{ fontSize: 18, color: "rgba(255,255,255,0.2)" }}>-</Text>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginTop: 24,
        }}
      >
        <Space size={14} wrap>
          <Text type="secondary" style={{ fontSize: 12, color: "rgba(255,255,255,0.58)" }}>
            <CalendarOutlined style={{ marginRight: 6 }} />
            {formatMatchDate(fixture.matchDate)}
          </Text>
          {fixture.venueName && (
            <Text type="secondary" style={{ fontSize: 12, color: "rgba(255,255,255,0.58)" }}>
              <EnvironmentOutlined style={{ marginRight: 6 }} />
              {fixture.venueName}
            </Text>
          )}
        </Space>
      </div>
    </Card>
  );
}

export default function ViewerFixturesTab({ tournamentId }: ViewerFixturesTabProps) {
  const { data, isLoading, isFetching } = useGetFixturesQuery({ tournamentId });
  const [activeFilter, setActiveFilter] = useState("ALL");

  const fixtures = useMemo(
    () => [...(data?.content || [])].sort((left, right) =>
      (left.matchDate ?? "").localeCompare(right.matchDate ?? "")
    ),
    [data]
  );

  const filters = useMemo(() => {
    const labels = Array.from(new Set(fixtures.map((fixture) => buildGroupLabel(fixture))));
    return ["ALL", ...labels];
  }, [fixtures]);

  const groups = useMemo(() => {
    const visibleFixtures = activeFilter === "ALL"
      ? fixtures
      : fixtures.filter((fixture) => buildGroupLabel(fixture) === activeFilter);

    const map = new Map<string, IFixture[]>();
    for (const fixture of visibleFixtures) {
      const key = buildGroupLabel(fixture);
      const list = map.get(key) || [];
      list.push(fixture);
      map.set(key, list);
    }

    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [activeFilter, fixtures]);

  if (isLoading || isFetching) {
    return (
      <div style={{ textAlign: "center", padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <Empty
        description="No fixtures available"
        style={{ padding: 48 }}
      />
    );
  }

  return (
    <div style={{ padding: "8px 8px 24px" }}>
      <div style={{ marginBottom: 28, textAlign: "center" }}>
        <Title
          level={2}
          style={{
            margin: 0,
            fontSize: 42,
            lineHeight: 1,
            letterSpacing: -1.2,
            color: "#ffffff",
          }}
        >
          Tournament Fixtures
        </Title>
        <Text
          type="secondary"
          style={{
            display: "block",
            marginTop: 10,
            fontSize: 15,
            textTransform: "uppercase",
            letterSpacing: 2.4,
            color: "rgba(255,255,255,0.38)",
            fontWeight: 700,
          }}
        >
          Schedule & Match Details
        </Text>
      </div>

      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 32,
            }}
          >
            {filters.map((filter) => {
              const isActive = filter === activeFilter;
              return (
                <Button
                  key={filter}
                  type="text"
                  onClick={() => setActiveFilter(filter)}
                  style={{
                    height: 40,
                    padding: "0 18px",
                    borderRadius: 999,
                    border: isActive ? "none" : "1px solid rgba(255,255,255,0.06)",
                    background: isActive ? "linear-gradient(135deg, #10ff87 0%, #00d66b 100%)" : "rgba(255,255,255,0.04)",
                    color: isActive ? "#04160e" : "rgba(255,255,255,0.62)",
                    fontWeight: 800,
                    letterSpacing: 0.7,
                    boxShadow: isActive ? "0 12px 28px rgba(16,255,135,0.2)" : "none",
                  }}
                >
                  {filter.toUpperCase()}
                </Button>
              );
            })}
          </div>

          {groups.map(([groupName, fixtures]) => (
            <div key={groupName} style={{ marginBottom: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              marginBottom: 18,
              paddingBottom: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0, flex: 1 }}>
              <Title
                level={4}
                style={{
                  margin: 0,
                  color: "#ffffff",
                  fontSize: 22,
                  textTransform: "uppercase",
                }}
              >
                {groupName}
              </Title>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
            </div>
            <Tag
              style={{
                margin: 0,
                border: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.46)",
                borderRadius: 999,
                padding: "6px 14px",
                fontWeight: 800,
              }}
            >
              {fixtures.length} MATCH{fixtures.length !== 1 ? "ES" : ""}
            </Tag>
          </div>
          {fixtures.map((f) => (
            <MatchCard key={f.id} fixture={f} />
          ))}
            </div>
          ))}
      </div>
    </div>
  );
}

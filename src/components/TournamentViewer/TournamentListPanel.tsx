import React, { useMemo, useState } from "react";
import { Badge, Input, List, Spin, Tag, Typography } from "antd";
import { SearchOutlined, TrophyOutlined } from "@ant-design/icons";
import { useGetTournamentsQuery } from "../../state/features/tournaments/tournamentsSlice";
import type { IoTournamentSingleSummaryType } from "../../state/features/tournaments/tournamentTypes";

const { Text } = Typography;

interface TournamentListPanelProps {
  selectedId: number | null;
  onSelect: (id: number) => void;
}

const statusOrder: Record<string, number> = {
  ONGOING: 0,
  ACTIVE: 1,
  UPCOMING: 2,
  CONCLUDED: 3,
  INACTIVE: 4,
};

const statusColor = (status: string | undefined): string => {
  switch (status?.toUpperCase()) {
    case "ONGOING":
    case "ACTIVE":
      return "success";
    case "UPCOMING":
      return "processing";
    case "CONCLUDED":
      return "default";
    default:
      return "default";
  }
};

export default function TournamentListPanel({
  selectedId,
  onSelect,
}: TournamentListPanelProps) {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useGetTournamentsQuery({
    offSet: 0,
    pageSize: 200,
    sortedBy: "tournamentDate",
    sortDirection: "DESC",
  });

  const tournaments: IoTournamentSingleSummaryType[] = useMemo(() => {
    const list = data?.content?.tournaments || [];
    return [...list]
      .sort(
        (a, b) =>
          (statusOrder[a.tournamentStatus?.toUpperCase() ?? ""] ?? 5) -
          (statusOrder[b.tournamentStatus?.toUpperCase() ?? ""] ?? 5)
      )
      .filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase())
      );
  }, [data, search]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "12px 12px 8px" }}>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search tournaments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          size="small"
        />
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
          <Spin />
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: "auto" }}>
          <List
            dataSource={tournaments}
            locale={{ emptyText: "No tournaments found" }}
            renderItem={(tournament) => {
              const isSelected = tournament.id === selectedId;
              const isLive =
                tournament.tournamentStatus?.toUpperCase() === "ONGOING" ||
                tournament.tournamentStatus?.toUpperCase() === "ACTIVE";

              return (
                <List.Item
                  key={tournament.id}
                  onClick={() => onSelect(tournament.id)}
                  style={{
                    cursor: "pointer",
                    padding: "10px 14px",
                    background: isSelected
                      ? "rgba(24, 144, 255, 0.12)"
                      : "transparent",
                    borderLeft: isSelected
                      ? "3px solid #1890ff"
                      : "3px solid transparent",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    transition: "background 0.15s",
                  }}
                >
                  <div style={{ width: "100%" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 4,
                      }}
                    >
                      {isLive ? (
                        <Badge status="processing" color="green" />
                      ) : (
                        <TrophyOutlined
                          style={{ fontSize: 12, color: "#888" }}
                        />
                      )}
                      <Text
                        strong={isSelected}
                        style={{
                          fontSize: 13,
                          color: isSelected ? "#1890ff" : undefined,
                          wordBreak: "break-word",
                        }}
                      >
                        {tournament.name}
                      </Text>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text
                        type="secondary"
                        style={{ fontSize: 11 }}
                      >
                        {tournament.tournamentDate
                          ? new Date(
                              tournament.tournamentDate
                            ).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </Text>
                      {tournament.tournamentStatus && (
                        <Tag
                          color={statusColor(tournament.tournamentStatus)}
                          style={{ fontSize: 10, margin: 0, lineHeight: "16px" }}
                        >
                          {tournament.tournamentStatus.toUpperCase()}
                        </Tag>
                      )}
                    </div>
                  </div>
                </List.Item>
              );
            }}
          />
        </div>
      )}
    </div>
  );
}

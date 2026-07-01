import React, { useEffect, useState, useMemo } from "react";
import {
  Skeleton, Alert, Typography, Space, Card, Tag,
  Row, Col, Pagination, Input, Segmented,
} from "antd";
import { useGetTournamentsQuery } from "../../state/features/tournaments/tournamentsSlice";
import { IoTournamentSingleSummaryType } from "../../state/features/tournaments/tournamentTypes";
import TournamentsActionDropdown from "./Atoms/TournamentsActionDropdown";
import { useNavigate } from "react-router-dom";
import CreateTournament from "./Atoms/CreateTournamentModal";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import { showBdLocalTime } from "../../utils/utils";
import { CalendarOutlined, EnvironmentOutlined, SearchOutlined, TrophyOutlined } from "@ant-design/icons";
import { canManageTournaments } from "../../utils/roleUtils";

const { Title, Text } = Typography;

const STATUS_CONFIG: Record<string, { color: string; label: string; tagColor: string }> = {
  UPCOMING:  { color: "#1677ff", label: "Upcoming",  tagColor: "blue"    },
  ONGOING:   { color: "#52c41a", label: "Ongoing",   tagColor: "green"   },
  CONCLUDED: { color: "#595959", label: "Concluded", tagColor: "default" },
  COMPLETED: { color: "#595959", label: "Concluded", tagColor: "default" },
};

const getStatusConfig = (status?: string) =>
  (status && STATUS_CONFIG[status]) || { color: "#d9d9d9", label: status || "Unknown", tagColor: "default" };

const TournamentsPage: React.FC = () => {
  const loginInfo = useSelector(selectLoginInfo);
  const canManage = canManageTournaments(loginInfo.roles);

  const [currentPage, setCurrentPage]   = useState(1);
  const [pageSize, setPageSize]         = useState(12);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchText, setSearchText]     = useState("");
  const [sorter, setSorter] = useState<{ sortedBy: string; sortDirection: "ASC" | "DESC" }>({
    sortedBy: "tournamentDate",
    sortDirection: "DESC",
  });

  const navigate = useNavigate();

  const { data: tournamentSummaries, isLoading, isError, refetch } = useGetTournamentsQuery({
    offSet: currentPage - 1,
    pageSize,
    sortedBy: sorter.sortedBy,
    sortDirection: sorter.sortDirection,
  });

  useEffect(() => { refetch(); }, [currentPage, pageSize, sorter, refetch]);

  const handleMenuClick = (e: any, record: IoTournamentSingleSummaryType) => {
    if (e.key === "join") {
      navigate(`/tournaments/join-tournament/${record.id}`);
    } else if (e.key === "fixtures") {
      navigate(`/tournaments/team-building/${record.id}`);
    } else if (e.type === "click" && record.activeStatus) {
      navigate(`/tournaments/join-tournament/${record.id}`);
    }
  };

  const filteredTournaments = useMemo(() => {
    const all = tournamentSummaries?.content?.tournaments ?? [];
    return all.filter((t) => {
      const matchStatus =
        statusFilter === "ALL" ||
        t.tournamentStatus === statusFilter ||
        (statusFilter === "CONCLUDED" && (t.tournamentStatus === "CONCLUDED" || t.tournamentStatus === "COMPLETED"));
      const matchSearch = !searchText || t.name.toLowerCase().includes(searchText.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [tournamentSummaries, statusFilter, searchText]);

  const segmentedOptions = useMemo(() => {
    const all = tournamentSummaries?.content?.tournaments ?? [];
    const opts: { label: string; value: string }[] = [{ label: "All", value: "ALL" }];
    if (all.some(t => t.tournamentStatus === "UPCOMING"))  opts.push({ label: "Upcoming",  value: "UPCOMING"  });
    if (all.some(t => t.tournamentStatus === "ONGOING"))   opts.push({ label: "Ongoing",   value: "ONGOING"   });
    if (all.some(t => t.tournamentStatus === "CONCLUDED" || t.tournamentStatus === "COMPLETED")) opts.push({ label: "Concluded", value: "CONCLUDED" });
    return opts;
  }, [tournamentSummaries]);

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Space style={{ width: "100%", justifyContent: "space-between", padding: "12px 0", display: "flex" }}>
          <Skeleton.Input active style={{ width: 150, height: 32 }} />
          {canManage && <Skeleton.Button active style={{ width: 120, height: 32 }} />}
        </Space>
        <Row gutter={[16, 16]}>
          {Array.from({ length: 9 }).map((_, i) => (
            <Col key={i} xs={24} sm={12} xl={8}>
              <Card><Skeleton active paragraph={{ rows: 3 }} /></Card>
            </Col>
          ))}
        </Row>
      </Space>
    );
  }

  // ─── Error ────────────────────────────────────────────────────────────────
  if (isError || !tournamentSummaries) {
    return <Alert message="Error" description="Failed to load tournaments." type="error" showIcon />;
  }

  // ─── Main ─────────────────────────────────────────────────────────────────
  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>

      {/* Page header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0" }}>
        <Title style={{ margin: 0 }}>Tournaments</Title>
        {canManage && <CreateTournament />}
      </div>

      {/* Compact filter bar + search */}
      <Row gutter={[12, 12]} align="middle">
        <Col xs={24} md={16}>
          <Segmented
            value={segmentedOptions.some(o => o.value === statusFilter) ? statusFilter : "ALL"}
            onChange={(v) => { setStatusFilter(v as string); setCurrentPage(1); }}
            options={segmentedOptions}
          />
        </Col>
        <Col xs={24} md={8}>
          <Input
            placeholder="Search tournaments..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
        </Col>
      </Row>

      {/* Card grid */}
      <div style={{ minHeight: "calc(100vh - 280px)" }}>
      {filteredTournaments.length === 0 ? (
        <Card style={{ textAlign: "center", padding: "48px 0" }}>
          <TrophyOutlined style={{ fontSize: 48, opacity: 0.25, display: "block", marginBottom: 12 }} />
          <Text type="secondary">No tournaments found.</Text>
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {filteredTournaments.map((t) => {
            const conf      = getStatusConfig(t.tournamentStatus);
            const inactive  = !t.activeStatus;

            return (
              <Col key={t.id} xs={24} sm={12} xl={8}>
                <Card
                  className="tournament-grid-card"
                  hoverable={!inactive}
                  styles={{ body: { padding: "16px" } }}
                  style={{
                    borderTop: `3px solid ${inactive ? "#555" : conf.color}`,
                    opacity: inactive ? 0.55 : 1,
                    height: "100%",
                    cursor: !inactive ? "pointer" : "default",
                  }}
                  onClick={() => {
                    if (!inactive && t.tournamentDate) {
                      navigate(`/tournaments/join-tournament/${t.id}`);
                    }
                  }}
                >
                  {/* Row 1: status badge + action menu */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <Tag
                      style={{
                        margin: 0,
                        fontSize: 11,
                        padding: "1px 8px",
                        borderRadius: 20,
                        background: inactive ? "rgba(128,128,128,0.1)" : `${conf.color}18`,
                        border: `1px solid ${inactive ? "#555" : conf.color}55`,
                        color: inactive ? "#888" : conf.color,
                        fontWeight: 500,
                      }}
                    >
                      {conf.label}
                    </Tag>
                    {t.tournamentDate && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <TournamentsActionDropdown
                          record={t}
                          onMenuClick={handleMenuClick}
                          tournamentId={t.id}
                        />
                      </div>
                    )}
                  </div>

                  {/* Row 2: tournament name */}
                  <Text
                    strong
                    ellipsis={{ tooltip: t.name }}
                    style={{ fontSize: 15, display: "block", lineHeight: 1.3, marginBottom: 12 }}
                  >
                    {t.name}
                  </Text>

                  {/* Row 3: date + venue */}
                  <Space direction="vertical" size={6} style={{ width: "100%" }}>
                    <Space size={7}>
                      <CalendarOutlined style={{ color: conf.color, fontSize: 12, flexShrink: 0 }} />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {t.tournamentDate ? showBdLocalTime(t.tournamentDate) : "—"}
                      </Text>
                    </Space>
                    <Space size={7}>
                      <EnvironmentOutlined style={{ color: "#52c41a", fontSize: 12, flexShrink: 0 }} />
                      <Text type="secondary" style={{ fontSize: 12 }} ellipsis={{ tooltip: t.venueName }}>
                        {t.venueName || "—"}
                      </Text>
                    </Space>
                  </Space>

                </Card>
              </Col>
            );
          })}
        </Row>
      )}
      </div>

      {/* Pagination */}
      <div style={{ display: "flex", justifyContent: "flex-end", paddingBottom: 8 }}>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={tournamentSummaries?.content?.totalCount}
          onChange={(page, size) => {
            setCurrentPage(page);
            if (size && size !== pageSize) setPageSize(size);
          }}
          showSizeChanger
          pageSizeOptions={["9", "12", "18", "24"]}
          showTotal={(total, range) => `${range[0]}–${range[1]} of ${total}`}
        />
      </div>

    </Space>
  );
};

export default TournamentsPage;

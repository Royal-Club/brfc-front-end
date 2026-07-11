import React, { useEffect, useState, useMemo } from "react";
import {
  Skeleton, Alert, Typography, Space, Card,
  Row, Col, Pagination, Input, Segmented, Button,
} from "antd";
import { useGetTournamentsQuery } from "../../state/features/tournaments/tournamentsSlice";
import { IoTournamentSingleSummaryType } from "../../state/features/tournaments/tournamentTypes";
import TournamentsActionDropdown from "./Atoms/TournamentsActionDropdown";
import { useNavigate } from "react-router-dom";
import CreateTournament from "./Atoms/CreateTournamentModal";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import { showBdLocalTime } from "../../utils/utils";
import { CalendarOutlined, EnvironmentOutlined, SearchOutlined, ThunderboltOutlined, TrophyOutlined } from "@ant-design/icons";
import { canManageTournaments } from "../../utils/roleUtils";
import { club, scoreNum } from "../../theme/clubTheme";
import "./tournament.css";

const { Title, Text } = Typography;

// Status palette drawn from the club identity so cards read as one matchday product.
// Upcoming = gold (the next fixture to highlight), Ongoing = pitch green, Concluded = muted.
const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  UPCOMING:  { color: club.gold,  label: "Upcoming"  },
  ONGOING:   { color: club.pitch, label: "Ongoing"   },
  CONCLUDED: { color: "#8792A8",  label: "Concluded" },
  COMPLETED: { color: "#8792A8",  label: "Concluded" },
};

const getStatusConfig = (status?: string) =>
  (status && STATUS_CONFIG[status]) || { color: "#8792A8", label: status || "Unknown" };

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
    } else if (e.key === "auction-register") {
      navigate(`/auction/register/${record.id}`);
    } else if (e.key === "auction-live") {
      navigate(`/auction/live/${record.id}`);
    } else if (e.key === "team-building" || e.key === "fixtures") {
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", padding: "8px 0 4px" }}>
        <Title style={{ margin: 0, lineHeight: 1.1 }}>Tournaments</Title>
        {canManage && <CreateTournament />}
      </div>

      {/* Gold divider under the header */}
      <div style={{ height: 2, background: `linear-gradient(90deg, ${club.gold} 0%, rgba(198,161,91,0) 60%)`, borderRadius: 2 }} />


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
        <Card
          style={{
            textAlign: "center",
            padding: "48px 0",
            background: club.panel,
            border: `1px solid ${club.panelBorder}`,
            borderRadius: 14,
          }}
        >
          <TrophyOutlined style={{ fontSize: 48, color: club.gold, opacity: 0.45, display: "block", marginBottom: 12 }} />
          <Text style={{ color: club.textMuted }}>No tournaments found.</Text>
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {filteredTournaments.map((t) => {
            const conf      = getStatusConfig(t.tournamentStatus);
            const inactive  = !t.activeStatus;

            return (
              <Col key={t.id} xs={24} sm={12} xl={8}>
                <Card
                  className={`tournament-grid-card${!inactive ? " tournament-grid-card--active" : ""}`}
                  styles={{ body: { padding: 0 } }}
                  style={{
                    background: club.panel,
                    border: `1px solid ${club.panelBorder}`,
                    borderRadius: 14,
                    overflow: "hidden",
                    opacity: inactive ? 0.5 : 1,
                    height: "100%",
                    cursor: !inactive ? "pointer" : "default",
                  }}
                  onClick={() => {
                    if (!inactive && t.tournamentDate) {
                      navigate(`/tournaments/join-tournament/${t.id}`);
                    }
                  }}
                >
                  {/* Status accent strip */}
                  <div style={{ height: 3, background: inactive ? "#555" : conf.color }} />

                  <div style={{ padding: 16 }}>
                    {/* Row 1: status badge + action menu */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
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
                          background: `${conf.color}22`,
                          border: `1px solid ${conf.color}59`,
                          color: conf.color,
                        }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: conf.color }} />
                        {conf.label}
                      </span>
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
                      style={{ fontSize: 16, display: "block", lineHeight: 1.3, marginBottom: 14, color: club.textPrimary }}
                    >
                      {t.name}
                    </Text>

                    {/* Row 3: date + venue */}
                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                      <Space size={8}>
                        <CalendarOutlined style={{ color: club.gold, fontSize: 13, flexShrink: 0 }} />
                        <Text style={{ fontSize: 12.5, color: club.textMuted, ...scoreNum }}>
                          {t.tournamentDate ? showBdLocalTime(t.tournamentDate) : "—"}
                        </Text>
                      </Space>
                      <Space size={8}>
                        <EnvironmentOutlined style={{ color: club.gold, fontSize: 13, flexShrink: 0 }} />
                        <Text style={{ fontSize: 12.5, color: club.textMuted }} ellipsis={{ tooltip: t.venueName }}>
                          {t.venueName || "—"}
                        </Text>
                      </Space>
                    </Space>

                    {/* Auction entry point for auction-mode tournaments */}
                    {t.auctionMode && (
                      <Button
                        type="primary"
                        size="small"
                        icon={<ThunderboltOutlined />}
                        style={{ marginTop: 14, width: "100%" }}
                        onClick={(e) => { e.stopPropagation(); navigate(`/auction/register/${t.id}`); }}
                      >
                        Auction
                      </Button>
                    )}
                  </div>
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

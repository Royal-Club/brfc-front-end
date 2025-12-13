import React, { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Button,
  Space,
  Empty,
  Spin,
  Tooltip,
} from "antd";
import { EyeOutlined, EditOutlined, PlayCircleOutlined } from "@ant-design/icons";
import moment from "moment";
import { ColumnsType } from "antd/es/table";
import { IFixture, MatchStatus } from "../../../state/features/fixtures/fixtureTypes";
import { getStatusColor } from "../../../utils/matchStatusUtils";
import { formatMatchTime, isMatchOngoing, calculateElapsedTime } from "../../../utils/matchTimeUtils";
import { useNavigate } from "react-router-dom";

interface FixturesTableProps {
  fixtures: IFixture[];
  isLoading?: boolean;
  onViewDetails?: (fixture: IFixture) => void;
  onEditFixture?: (fixture: IFixture) => void;
}

export default function FixturesTable({
  fixtures,
  isLoading = false,
  onViewDetails,
  onEditFixture,
}: FixturesTableProps) {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update time every second for ongoing matches
  useEffect(() => {
    const hasOngoingMatches = fixtures.some(f => isMatchOngoing(f.matchStatus));
    if (!hasOngoingMatches) {
      setCurrentTime(Date.now()); // Set once if no ongoing matches
      return;
    }

    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [fixtures]); // Only depend on fixtures, not currentTime

  const columns: ColumnsType<IFixture> = [
    {
      title: "Match #",
      dataIndex: "matchOrder",
      key: "matchOrder",
      width: 80,
      sorter: (a, b) => a.matchOrder - b.matchOrder,
    },
    {
      title: "Home Team",
      dataIndex: "homeTeamName",
      key: "homeTeamName",
      sorter: (a, b) => a.homeTeamName.localeCompare(b.homeTeamName),
    },
    {
      title: "Score",
      key: "score",
      width: 80,
      render: (_, record) => (
        <span style={{ fontWeight: "bold" }}>
          {record.homeTeamScore} - {record.awayTeamScore}
        </span>
      ),
      align: "center",
    },
    {
      title: "Away Team",
      dataIndex: "awayTeamName",
      key: "awayTeamName",
      sorter: (a, b) => a.awayTeamName.localeCompare(b.awayTeamName),
    },
    {
      title: "Venue",
      dataIndex: "venueName",
      key: "venueName",
      render: (venue) => (
        <Tooltip title={venue}>
          <span>{venue?.length > 15 ? `${venue.substring(0, 15)}...` : venue}</span>
        </Tooltip>
      ),
    },
    {
      title: "Date & Time",
      dataIndex: "matchDate",
      key: "matchDate",
      render: (date: string) => moment.utc(date).local().format("DD MMM YYYY, HH:mm"),
      sorter: (a, b) => moment.utc(a.matchDate).valueOf() - moment.utc(b.matchDate).valueOf(),
    },
    {
      title: "Status",
      dataIndex: "matchStatus",
      key: "matchStatus",
      width: 150,
      render: (status: string, record: IFixture) => {
        const color = getStatusColor(status);
        const isOngoing = isMatchOngoing(status);
        const matchTime = formatMatchTime(
          record.matchStatus,
          record.startedAt,
          record.elapsedTimeSeconds,
          record.completedAt
        );
        
        return (
          <Space direction="vertical" size={2}>
            <Tag color={color} icon={isOngoing ? <PlayCircleOutlined /> : undefined}>
              {status}
            </Tag>
            {isOngoing && matchTime && (
              <Tag color="green" style={{ margin: 0, cursor: "pointer" }}>
                {matchTime}
              </Tag>
            )}
          </Space>
        );
      },
      sorter: (a, b) => a.matchStatus.localeCompare(b.matchStatus),
    },
    {
      title: "Action",
      key: "action",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => {
              console.log('Navigating to:', `/fixtures/${record.id}`); // Debug log
              navigate(`/fixtures/${record.id}`);
            }}
            size="small"
          >
            View
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => onEditFixture?.(record)}
            size="small"
          >
            Edit
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Spin spinning={isLoading} tip="Loading fixtures...">
      {fixtures.length === 0 ? (
        <Empty description="No fixtures found" />
      ) : (
        <Table
          columns={columns}
          dataSource={fixtures.map((fixture) => ({
            ...fixture,
            key: fixture.id,
          }))}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Total ${total} matches`,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
          }}
          scroll={{ x: "max-content" }}
          size="small"
          onRow={(record) => ({
            onClick: () => {
              if (isMatchOngoing(record.matchStatus)) {
                navigate(`/fixtures/${record.id}`);
              }
            },
            style: {
              cursor: isMatchOngoing(record.matchStatus) ? "pointer" : "default",
            },
          })}
        />
      )}
    </Spin>
  );
}

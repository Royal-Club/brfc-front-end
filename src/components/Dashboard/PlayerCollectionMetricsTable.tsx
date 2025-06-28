import React, { useState, useMemo } from "react";
import { Table, Select, Space, Radio, Button, theme, Tooltip, Card, Row, Col, Typography } from "antd";
import { TableOutlined, AppstoreOutlined, BarChartOutlined } from "@ant-design/icons";
import type {
  ColumnType,
  ColumnsType,
  TablePaginationConfig,
  FilterValue,
  SorterResult,
  TableCurrentDataSource,
} from "antd/es/table/interface";
import { useGetPlayerCollectionMetricsQuery } from "../../state/features/account/playerCollectionMetricsSlice";
import { PlayerMetric } from "../../interfaces/IPlayerCollectionMetrics";
import PlayerCollectionMobileView from "./PlayerCollectionMobileView";
import styles from "./PlayerCollectionMetricsTable.module.css";

const { Option } = Select;
const { Title } = Typography;

const monthNames = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

type FilterType = "all" | "active" | "inactive";

interface TableRow {
  key: number;
  index: number;
  playerName: string;
  [key: string]: any; // for month_1 ... month_12
}

interface PlayerCollectionMetricsProps {
  selectedYear?: number;
  onYearChange?: (year: number) => void;
  className?: string;
}

const PlayerCollectionMetrics: React.FC<PlayerCollectionMetricsProps> = ({
  selectedYear: propSelectedYear,
  onYearChange,
  className
}) => {
  const { token } = theme.useToken();
  const [internalSelectedYear, setInternalSelectedYear] = useState<number | null>(null);
  const [filter, setFilter] = useState<FilterType>("active");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"ascend" | "descend" | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState<'cards' | 'table'>('cards');

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Use prop selectedYear or internal state
  const selectedYear = propSelectedYear || internalSelectedYear;

  const { data, isLoading } = useGetPlayerCollectionMetricsQuery(
    selectedYear ? { year: selectedYear } : undefined
  );

  const metrics = data?.content?.metrics || [];
  const years = data?.content?.years || [];

  // Set default year when data loads
  React.useEffect(() => {
    if (!selectedYear && years.length > 0) {
      const defaultYear = [...years].sort((a, b) => b - a)[0];
      if (propSelectedYear === undefined) {
        setInternalSelectedYear(defaultYear);
      } else if (onYearChange) {
        onYearChange(defaultYear);
      }
    }
  }, [years, selectedYear, propSelectedYear, onYearChange]);

  const handleYearChange = (year: number) => {
    if (propSelectedYear === undefined) {
      setInternalSelectedYear(year);
    }
    if (onYearChange) {
      onYearChange(year);
    }
  };

  // Filter players by active/inactive/all
  const filteredMetrics = useMemo(() => {
    return metrics.filter((player: PlayerMetric) => {
      if (filter === "all") return true;
      if (filter === "active") return player.active === true;
      if (filter === "inactive") return player.active === false;
      return true;
    });
  }, [metrics, filter]);

  // Helper function to create a month column
  const createMonthColumn = (
    monthName: string,
    monthNumber: number
  ): ColumnType<TableRow> => ({
    title: monthName,
    dataIndex: `month_${monthNumber}`,
    key: `month_${monthNumber}`,
    align: "center",
    width: window.innerWidth <= 576 ? 55 : 70,
    className: "month-column",
    sorter: (a, b) => (a[`month_${monthNumber}`] || 0) - (b[`month_${monthNumber}`] || 0),
    sortOrder: sortField === `month_${monthNumber}` ? sortOrder : null,
    render: (amount: number, record: TableRow) => {
      const isCurrentCell = selectedYear === currentYear && monthNumber === currentMonth;
      const playerData = metrics.find((p: PlayerMetric) => p.playerId === record.key);
      const isActive = playerData?.active ?? false;

      if (isCurrentCell && amount <= 0 && isActive) {
        return <span style={{ fontWeight: "bold" }}>Due</span>;
      }
      return amount > 0 ? amount.toFixed(0) : "";
    },
    onCell: (record: TableRow) => {
      const isCurrentCell = selectedYear === currentYear && monthNumber === currentMonth;
      const amount = record[`month_${monthNumber}`] || 0;
      const playerData = metrics.find((p: PlayerMetric) => p.playerId === record.key);
      const isActive = playerData?.active ?? false;
      const showWarning = isCurrentCell && amount <= 0 && isActive;

      return {
        style: {
          minWidth: window.innerWidth <= 576 ? 30 : 40,
          paddingLeft: window.innerWidth <= 576 ? 2 : 8,
          paddingRight: window.innerWidth <= 576 ? 2 : 8,
          whiteSpace: "nowrap",
          backgroundColor: showWarning ? token.colorWarningBg : undefined,
        },
      };
    },
  });

  const columns: ColumnsType<TableRow> = [
    {
      title: "#",
      dataIndex: "index",
      key: "index",
      fixed: "left",
      width: window.innerWidth <= 576 ? 35 : 50,
      sorter: (a, b) => a.index - b.index,
      sortOrder: sortField === "index" ? sortOrder : null,
      defaultSortOrder: "ascend",
      render: (_: any, __: any, index: number) => index + 1,
      onCell: () => ({ 
        style: { 
          minWidth: window.innerWidth <= 576 ? 30 : 45, 
          paddingLeft: window.innerWidth <= 576 ? 4 : 8, 
          paddingRight: window.innerWidth <= 576 ? 4 : 8 
        } 
      }),
    },
    {
      title: "Name",
      dataIndex: "playerName",
      key: "playerName",
      fixed: "left",
      width: window.innerWidth <= 576 ? 90 : (window.innerWidth <= 768 ? 110 : 180),
      sorter: (a, b) => a.playerName.localeCompare(b.playerName),
      sortOrder: sortField === "playerName" ? sortOrder : null,
      render: (text: string) => {
        const isMobile = window.innerWidth <= 576;
        const isTablet = window.innerWidth <= 768;
        const maxLength = isMobile ? 10 : isTablet ? 12 : 20;
        const shouldTruncate = text.length > maxLength;
        const displayText = shouldTruncate ? text.substring(0, maxLength) + '...' : text;
        
        const nameElement = (
          <b style={{ 
            fontSize: isMobile ? '11px' : undefined,
            cursor: shouldTruncate ? 'help' : 'default'
          }}>
            {displayText}
          </b>
        );

        // Only show tooltip if text is truncated
        if (shouldTruncate) {
          return (
            <Tooltip 
              title={text} 
              placement="topLeft"
              mouseEnterDelay={0.3}
              overlayStyle={{
                maxWidth: '300px',
                fontSize: '14px'
              }}
            >
              {nameElement}
            </Tooltip>
          );
        }

        return nameElement;
      },
      onCell: () => ({ 
        style: { 
          minWidth: window.innerWidth <= 576 ? 80 : 140, 
          paddingLeft: window.innerWidth <= 576 ? 4 : 8, 
          paddingRight: window.innerWidth <= 576 ? 4 : 8 
        } 
      }),
    },
    ...monthNames.map((month, idx) =>
      createMonthColumn(month, idx + 1)
    ),
  ];

  const dataSource: TableRow[] = filteredMetrics.map((player: PlayerMetric, idx: number) => {
    const row: TableRow = {
      key: player.playerId,
      playerName: player.playerName,
      index: idx + 1,
    };

    const monthData = player.yearMonthAmount[selectedYear?.toString() || ""] || {};
    for (let i = 1; i <= 12; i++) {
      row[`month_${i}`] = monthData[i] || 0;
    }

    return row;
  });

  const handleTableChange = (
    _pagination: TablePaginationConfig,
    _filters: Record<string, FilterValue | null>,
    sorter: SorterResult<TableRow> | SorterResult<TableRow>[],
    _extra: TableCurrentDataSource<TableRow>
  ) => {
    if (!Array.isArray(sorter)) {
      setSortField(sorter.field as string);
      setSortOrder(sorter.order as "ascend" | "descend" | null);
    }
  };

  const resetSorting = () => {
    setSortField(null);
    setSortOrder(null);
  };

  React.useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setMobileView('table'); // Always use table on desktop
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <Card
      style={{ 
        borderRadius: 16, 
        border: `1px solid ${token.colorBorder}`,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        background: `linear-gradient(135deg, ${token.colorBgContainer} 0%, ${token.colorFillQuaternary} 100%)`,
        transition: 'all 0.3s ease',
        overflow: 'hidden'
      }}
      styles={{
        body: { padding: 0 }
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
      }}
    >
      {/* Header Section */}
      <div style={{ 
        background: `linear-gradient(90deg, ${token.colorInfo}15 0%, ${token.colorInfo}08 100%)`,
        padding: '16px 20px',
        borderBottom: `1px solid ${token.colorBorder}`
      }}>
        <Row gutter={[16, 8]} align="middle">
          <Col xs={24} md={12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                background: token.colorInfo,
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <BarChartOutlined style={{ fontSize: 16, color: 'white' }} />
              </div>
              <Title level={4} style={{ 
                margin: 0, 
                color: token.colorText, 
                fontSize: 18,
                fontWeight: '600'
              }}>
                Player Collection Metrics
              </Title>
            </div>
          </Col>
          
          <Col xs={24} md={12}>
            <Space 
              wrap 
              style={{ 
                width: "100%", 
                justifyContent: window.innerWidth <= 768 ? "center" : "flex-end" 
              }}
            >
              <Select
                size="small"
                style={{ width: window.innerWidth <= 768 ? "100%" : 150 }}
                placeholder="Select Year"
                value={selectedYear || undefined}
                onChange={handleYearChange}
                loading={isLoading}
                disabled={isLoading}
                allowClear={false}
              >
                {years.map((year: number) => (
                  <Option key={year} value={year}>
                    {year}
                  </Option>
                ))}
              </Select>
              <Radio.Group
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                disabled={isLoading}
                optionType="button"
                buttonStyle="solid"
                size="small"
                style={{ width: window.innerWidth <= 768 ? "100%" : "auto" }}
              >
                <Radio.Button value="all">All</Radio.Button>
                <Radio.Button value="active">Active</Radio.Button>
                <Radio.Button value="inactive">Inactive</Radio.Button>
              </Radio.Group>
              <Button size="small" onClick={resetSorting} disabled={!sortField}>
                Reset Sort
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Mobile View Toggle */}
      {isMobile && (
        <div style={{
          padding: '12px 20px',
          background: token.colorBgLayout,
          borderBottom: `1px solid ${token.colorBorder}`,
          display: 'flex',
          justifyContent: 'center'
        }}>
          <Radio.Group
            value={mobileView}
            onChange={(e) => setMobileView(e.target.value)}
            optionType="button"
            buttonStyle="solid"
            size="small"
          >
            <Radio.Button value="cards">
              <AppstoreOutlined /> Cards
            </Radio.Button>
            <Radio.Button value="table">
              <TableOutlined /> Table
            </Radio.Button>
          </Radio.Group>
        </div>
      )}

      {/* Content Section */}
      <div style={{ background: token.colorBgContainer }}>
        {isMobile ? (
          mobileView === 'cards' ? (
            <PlayerCollectionMobileView 
              dataSource={dataSource}
              metrics={metrics}
              selectedYear={selectedYear}
              currentYear={currentYear}
              currentMonth={currentMonth}
            />
          ) : (
            <div style={{ padding: '16px 20px' }}>
              <Table
                size="small"
                bordered
                columns={columns}
                dataSource={dataSource}
                pagination={false}
                scroll={{ x: "max-content" }}
                loading={isLoading}
                rowKey="key"
                onChange={handleTableChange}
                className={styles.tableData}
              />
            </div>
          )
        ) : (
          <div style={{ padding: '16px 20px' }}>
            <Table
              size="small"
              bordered
              columns={columns}
              dataSource={dataSource}
              pagination={false}
              scroll={{ x: "max-content" }}
              loading={isLoading}
              rowKey="key"
              onChange={handleTableChange}
              className={styles.tableData}
            />
          </div>
        )}
      </div>
    </Card>
  );
};

export default PlayerCollectionMetrics;

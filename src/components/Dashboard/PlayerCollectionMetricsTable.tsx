import React, { useState, useMemo } from "react";
import { Table, Select, Space, Radio, Button, theme, Tooltip, Card, Row, Col, Typography } from "antd";
import { 
  TableOutlined, 
  AppstoreOutlined, 
  BarChartOutlined, 
  CalendarOutlined,
  TeamOutlined,
  UserOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
  ReloadOutlined
} from "@ant-design/icons";
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
  isDarkMode?: boolean;
}

const PlayerCollectionMetrics: React.FC<PlayerCollectionMetricsProps> = ({
  selectedYear: propSelectedYear,
  onYearChange,
  className,
  isDarkMode = false
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
      title: (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          minWidth: 80
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <CalendarOutlined style={{ fontSize: 10, color: token.colorPrimary }} />
            <span style={{ 
              fontSize: 11,
              display: window.innerWidth <= 768 ? 'none' : 'inline'
            }}>
              Year
            </span>
          </div>
          <Select
            size="small"
            style={{ width: window.innerWidth <= 768 ? 85 : 70 }}
            value={selectedYear || undefined}
            onChange={handleYearChange}
            loading={isLoading}
            disabled={isLoading}
            dropdownStyle={{ minWidth: 60 }}
            className={styles.headerYearSelect}
          >
            {years.map((year: number) => (
              <Option key={year} value={year}>
                {year}
              </Option>
            ))}
          </Select>
        </div>
      ),
      dataIndex: "year",
      key: "year",
      fixed: "left",
      width: window.innerWidth <= 576 ? 90 : 110,
      align: "center",
      render: () => selectedYear,
      onCell: () => ({ 
        style: { 
          minWidth: window.innerWidth <= 576 ? 85 : 105,
          textAlign: 'center',
          fontWeight: 600,
          color: token.colorPrimary,
          fontSize: 12
        } 
      }),
    },
    {
      title: "Name",
      dataIndex: "playerName",
      key: "playerName",
      fixed: "left",
      width: window.innerWidth <= 576 ? 100 : (window.innerWidth <= 768 ? 120 : 200),
      sorter: (a, b) => a.playerName.localeCompare(b.playerName),
      sortOrder: sortField === "playerName" ? sortOrder : null,
      render: (text: string) => {
        const isMobile = window.innerWidth <= 576;
        const isTablet = window.innerWidth <= 768;
        const maxLength = isMobile ? 12 : isTablet ? 15 : 25;
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
          minWidth: window.innerWidth <= 576 ? 95 : 150, 
          paddingLeft: window.innerWidth <= 576 ? 6 : 12, 
          paddingRight: window.innerWidth <= 576 ? 6 : 12 
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
        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.12)';
      }}
      onMouseLeave={(e) => {
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
              align="center"
              style={{ 
                width: "100%", 
                justifyContent: window.innerWidth <= 768 ? "center" : "flex-end",
                alignItems: "center",
                gap: 12
              }}
            >
              <Radio.Group
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                disabled={isLoading}
                optionType="button"
                buttonStyle="solid"
                size="middle"
                style={{ 
                  width: window.innerWidth <= 768 ? "100%" : "auto",
                  display: "flex",
                  alignItems: "center"
                }}
                className={styles.styledRadioGroup}
              >
                <Radio.Button value="all" className={styles.styledRadioButton}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <TeamOutlined style={{ fontSize: 12 }} />
                    <span>All</span>
                  </div>
                </Radio.Button>
                <Radio.Button value="active" className={styles.styledRadioButton}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <UserAddOutlined style={{ fontSize: 12 }} />
                    <span>Active</span>
                  </div>
                </Radio.Button>
                <Radio.Button value="inactive" className={styles.styledRadioButton}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <UserDeleteOutlined style={{ fontSize: 12 }} />
                    <span>Inactive</span>
                  </div>
                </Radio.Button>
              </Radio.Group>
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
            size="middle"
            className={styles.styledRadioGroup}
          >
            <Radio.Button value="cards" className={styles.styledRadioButton}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <AppstoreOutlined style={{ fontSize: 12 }} />
                <span>Cards</span>
              </div>
            </Radio.Button>
            <Radio.Button value="table" className={styles.styledRadioButton}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <TableOutlined style={{ fontSize: 12 }} />
                <span>Table</span>
              </div>
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
              isDarkMode={isDarkMode}
              years={years}
              onYearChange={handleYearChange}
              isLoading={isLoading}
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
                className={`${styles.tableData} ${isDarkMode ? styles.darkTheme : styles.lightTheme}`}
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
              className={`${styles.tableData} ${isDarkMode ? styles.darkTheme : styles.lightTheme}`}
            />
          </div>
        )}
      </div>
    </Card>
  );
};


export default PlayerCollectionMetrics;
             
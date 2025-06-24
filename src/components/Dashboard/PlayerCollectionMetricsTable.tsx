import React, { useState, useMemo } from "react";
import { Table, Select, Space, Radio, Button, theme, Tooltip, Switch } from "antd";
import { TableOutlined, AppstoreOutlined } from "@ant-design/icons";
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
import styles from "./PlayerCollectionMetricsTable.module.css";

const { Option } = Select;

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
  const [isTablet, setIsTablet] = useState(false);
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

  // Helper function to create a month column with responsive width
  const createMonthColumn = (
    monthName: string,
    monthNumber: number
  ): ColumnType<TableRow> => ({
    title: monthName,
    dataIndex: `month_${monthNumber}`,
    key: `month_${monthNumber}`,
    align: "center",
    className: "month-column",
    sorter: (a, b) => (a[`month_${monthNumber}`] || 0) - (b[`month_${monthNumber}`] || 0),
    sortOrder: sortField === `month_${monthNumber}` ? sortOrder : null,
    render: (amount: number, record: TableRow) => {
      const isCurrentCell = selectedYear === currentYear && monthNumber === currentMonth;
      const playerData = metrics.find((p: PlayerMetric) => p.playerId === record.key);
      const isActive = playerData?.active ?? false;

      if (isCurrentCell && amount <= 0 && isActive) {
        return <span className={styles.dueText}>Due</span>;
      }
      return amount > 0 ? (
        <span className={styles.amountText}>
          {amount.toFixed(0)}
        </span>
      ) : "";
    },
    onCell: (record: TableRow) => {
      const isCurrentCell = selectedYear === currentYear && monthNumber === currentMonth;
      const amount = record[`month_${monthNumber}`] || 0;
      const playerData = metrics.find((p: PlayerMetric) => p.playerId === record.key);
      const isActive = playerData?.active ?? false;
      const showWarning = isCurrentCell && amount <= 0 && isActive;

      return {
        className: showWarning ? styles.warningCell : '',
      };
    },
  });

  const columns: ColumnsType<TableRow> = [
    {
      title: "#",
      dataIndex: "index",
      key: "index",
      fixed: "left",
      className: "index-column",
      sorter: (a, b) => a.index - b.index,
      sortOrder: sortField === "index" ? sortOrder : null,
      defaultSortOrder: "ascend",
      render: (_: any, __: any, index: number) => (
        <span className={styles.indexText}>
          {index + 1}
        </span>
      ),
    },
    {
      title: "Name",
      dataIndex: "playerName",
      key: "playerName",
      fixed: "left",
      className: "name-column",
      sorter: (a, b) => a.playerName.localeCompare(b.playerName),
      sortOrder: sortField === "playerName" ? sortOrder : null,
      render: (text: string) => {
        const maxLength = isMobile ? 8 : isTablet ? 12 : 20;
        const shouldTruncate = text.length > maxLength;
        const displayText = shouldTruncate ? text.substring(0, maxLength) + '...' : text;
        
        const nameElement = (
          <b className={styles.nameText}>
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
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const mobile = width <= 768;
      const tablet = width <= 1024 && width > 768;
      setIsMobile(mobile);
      setIsTablet(tablet);
      if (!mobile) {
        setMobileView('table');
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const renderMobileCards = () => {
    return (
      <div className={styles.mobileCardView}>
        {/* Legend */}
        <div className={styles.legendContainer}>
          <div className={styles.legendItem}>
            <div className={`${styles.legendDot} ${styles.paid}`}></div>
            <span className={styles.legendText}>Paid</span>
          </div>
          <div className={styles.legendItem}>
            <div className={`${styles.legendDot} ${styles.current}`}></div>
            <span className={styles.legendText}>Current</span>
          </div>
          <div className={styles.legendItem}>
            <div className={`${styles.legendDot} ${styles.due}`}></div>
            <span className={styles.legendText}>Due</span>
          </div>
          
        </div>

        {dataSource.map((player, index) => {
          const playerData = metrics.find((p: PlayerMetric) => p.playerId === player.key);
          const isActive = playerData?.active ?? false;
          
          return (
            <div key={player.key} className={styles.playerCard}>
              <div className={styles.playerHeader}>
                <span className={styles.playerName}>{player.playerName}</span>
                <span className={styles.playerIndex}>#{index + 1}</span>
              </div>
              
              <div className={styles.monthsGrid}>
                {monthNames.map((month, idx) => {
                  const monthNumber = idx + 1;
                  const amount = player[`month_${monthNumber}`] || 0;
                  const isCurrentCell = selectedYear === currentYear && monthNumber === currentMonth;
                  const showDue = isCurrentCell && amount <= 0 && isActive;
                  const hasData = amount > 0 || showDue;
                  
                  let monthClass = styles.monthItem;
                  
                  if (showDue) {
                    monthClass += ` ${styles.monthDue}`;
                  } else if (isCurrentCell && amount > 0) {
                    monthClass += ` ${styles.monthCurrent}`;
                  } else if (amount > 0) {
                    monthClass += ` ${styles.monthPaid}`;
                  } else {
                    monthClass += ` ${styles.monthEmpty}`;
                  }
                  
                  return (
                    <div key={monthNumber} className={monthClass}>
                      {hasData && <div className={styles.monthIndicator}></div>}
                      <div className={styles.monthName}>{month}</div>
                      <div className={styles.monthAmount}>
                        {showDue ? 'Due' : (amount > 0 ? amount.toFixed(0) : '-')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`${styles.tableContainer} ${className || ''}`}>
      <div className={styles.controls}>
        <Space 
          wrap 
          className={styles.controlsSpace}
        >
          <Select
            className={styles.yearSelect}
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
            className={styles.filterGroup}
          >
            <Radio.Button value="all">All</Radio.Button>
            <Radio.Button value="active">Active</Radio.Button>
            <Radio.Button value="inactive">Inactive</Radio.Button>
          </Radio.Group>
          <Button 
            className={styles.resetButton}
            onClick={resetSorting} 
            disabled={!sortField}
          >
            Reset Sort
          </Button>
        </Space>
      </div>

      {/* Mobile View Toggle */}
      {isMobile && (
        <div className={styles.viewToggle}>
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

      {/* Conditional rendering for mobile/tablet */}
      {isMobile ? (
        mobileView === 'cards' ? (
          renderMobileCards()
        ) : (
          <div className={`${styles.table} ${styles.mobileTableView}`}>
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
        <div className={styles.table}>
          <Table
            size={isTablet ? "small" : "middle"}
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
  );
};



export default PlayerCollectionMetrics;
             
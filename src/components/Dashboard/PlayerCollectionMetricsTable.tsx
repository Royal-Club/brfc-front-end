import React, { useState, useMemo } from "react";
import { Table, Select, Space, Radio, Button, theme } from "antd";
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
    width: 70,
    sorter: (a, b) => (a[`month_${monthNumber}`] || 0) - (b[`month_${monthNumber}`] || 0),
    sortOrder: sortField === `month_${monthNumber}` ? sortOrder : null,
    render: (amount: number, record: TableRow) => {
      const isCurrentCell = selectedYear === currentYear && monthNumber === currentMonth;
      const playerData = metrics.find((p: PlayerMetric) => p.playerId === record.key);
      const isActive = playerData?.active ?? false;

      if (isCurrentCell && amount <= 0 && isActive) {
        return <span style={{ color: token.colorError, fontWeight: "bold" }}>Due</span>;
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
          minWidth: 40,
          paddingLeft: 8,
          paddingRight: 8,
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
      width: 50,
      sorter: (a, b) => a.index - b.index,
      sortOrder: sortField === "index" ? sortOrder : null,
      defaultSortOrder: "ascend",
      render: (_: any, __: any, index: number) => index + 1,
      onCell: () => ({ style: { minWidth: 30, paddingLeft: 8, paddingRight: 8 } }),
    },
    {
      title: "Name",
      dataIndex: "playerName",
      key: "playerName",
      fixed: "left",
      width: 200,
      sorter: (a, b) => a.playerName.localeCompare(b.playerName),
      sortOrder: sortField === "playerName" ? sortOrder : null,
      render: (text: string) => <b style={{ color: token.colorText }}>{text}</b>,
      onCell: () => ({ style: { minWidth: 150, paddingLeft: 8, paddingRight: 8 } }),
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

  return (
    <Space direction="vertical" style={{ width: "100%" }} className={className}>
      <Space wrap>
        <Select
          size="small"
          style={{ width: 150 }}
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
        >
          <Radio.Button value="all">All Players</Radio.Button>
          <Radio.Button value="active">Active</Radio.Button>
          <Radio.Button value="inactive">Inactive</Radio.Button>
        </Radio.Group>
        <Button size="small" onClick={resetSorting} disabled={!sortField}>
          Reset Sorting
        </Button>
      </Space>

      <Table
        size="small"
        bordered
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        scroll={{ x: "max-content" }}
        loading={isLoading}
        style={{ borderColor: token.colorBorder }}
        rowKey="key"
        onChange={handleTableChange}
      />
    </Space>
  );
};

export default PlayerCollectionMetrics;

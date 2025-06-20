import React, { useEffect, useState } from "react";
import { Table, Select, Space, Radio, Button } from "antd";
import type {
  ColumnType,
  ColumnsType,
  TablePaginationConfig,
  FilterValue,
  SorterResult,
  TableCurrentDataSource,
} from "antd/es/table/interface";
import axios from "axios";
import { API_URL } from "../../settings";
import PlayerMetric from "../../interfaces/IPlayerMetric";

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

const PlayerCollectionMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<PlayerMetric[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>("active");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"ascend" | "descend" | null>(null);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const minMonthColWidth = 40;

  const fetchData = async (year?: number) => {
    setLoading(true);
    try {
      const url = year
        ? `${API_URL}/ac/reports/player-collection-metrics?year=${year}`
        : `${API_URL}/ac/reports/player-collection-metrics`;
      const res = await axios.get(url);
      if (res.data?.content) {
        setMetrics(res.data.content.metrics);
        const sortedYears = res.data.content.years.sort((a: number, b: number) => b - a);
        setYears(sortedYears);
        if (!selectedYear && sortedYears.length > 0) {
          setSelectedYear(sortedYears[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching player collection metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedYear) {
      fetchData(selectedYear);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  // Filter players by active/inactive/all using API active flag
  const filteredMetrics = metrics.filter((player) => {
    if (filter === "all") return true;
    if (filter === "active") return player.active === true;
    if (filter === "inactive") return player.active === false;
    return true;
  });

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
      const playerData = metrics.find((p) => p.playerId === record.key);
      const isActive = playerData?.active ?? false;

      if (isCurrentCell && amount <= 0 && isActive) {
        return <span style={{ color: "red", fontWeight: "bold" }}>Due</span>;
      }
      return amount > 0 ? amount.toFixed(0) : "";
    },
    onCell: (record: TableRow) => {
      const isCurrentCell = selectedYear === currentYear && monthNumber === currentMonth;
      const amount = record[`month_${monthNumber}`] || 0;
      const playerData = metrics.find((p) => p.playerId === record.key);
      const isActive = playerData?.active ?? false;
      const showWarning = isCurrentCell && amount <= 0 && isActive;

      return {
        style: {
          minWidth: minMonthColWidth,
          paddingLeft: 8,
          paddingRight: 8,
          whiteSpace: "nowrap",
          backgroundColor: showWarning ? "#fff7e6" : undefined,
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
      render: (text: string) => <b>{text}</b>,
      onCell: () => ({ style: { minWidth: 150, paddingLeft: 8, paddingRight: 8 } }),
    },
    ...monthNames.map((month, idx) =>
      createMonthColumn(month, idx + 1)
    ),
  ];

  const dataSource: TableRow[] = filteredMetrics.map((player, idx) => {
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
    <Space direction="vertical" style={{ width: "100%" }}>
      <Space wrap>
        <Select
          size="small"
          style={{ width: 150 }}
          placeholder="Select Year"
          value={selectedYear || undefined}
          onChange={(value) => setSelectedYear(value)}
          loading={loading}
          disabled={loading}
          allowClear={false}
        >
          {years.map((year) => (
            <Option key={year} value={year}>
              {year}
            </Option>
          ))}
        </Select>
        <Radio.Group
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          disabled={loading}
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
        loading={loading}
        style={{ borderColor: "#d9d9d9" }}
        rowKey="key"
        onChange={handleTableChange}
      />
    </Space>
  );
};

export default PlayerCollectionMetrics;

import React from 'react';
import { Table, Tag, Badge, theme, Button } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { PlayerMetric } from '../../../interfaces/IPlayerCollectionMetrics';
import './PlayerContributionsTable.css';

interface PlayerTableData {
  key: number;
  playerId: number;
  playerName: string;
  currentMonthAmount: number;
  totalContribution: number;
  activeMonths: number;
  status: string;
  player: PlayerMetric;
}

interface PlayerContributionsTableProps {
  data: PlayerTableData[];
  loading: boolean;
  currentMonth: number;
  currentYear: number;
  onPlayerClick: (playerId: number) => void;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number) => void;
    onShowSizeChange: (current: number, size: number) => void;
    showSizeChanger: boolean;
    pageSizeOptions: string[];
    size: 'default' | 'small';
    simple?: boolean;
  };
}

const PlayerContributionsTable: React.FC<PlayerContributionsTableProps> = ({
  data,
  loading,
  currentMonth,
  currentYear,
  onPlayerClick,
  pagination
}) => {
  const { token } = theme.useToken();

  const getMonthName = (month: number) => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return months[month - 1];
  };

  const columns = [
    {
      title: 'Player ID',
      dataIndex: 'playerId',
      key: 'playerId',
      width: 100,
      sorter: (a: PlayerTableData, b: PlayerTableData) => a.playerId - b.playerId,
    },
    {
      title: 'Player Name',
      dataIndex: 'playerName',
      key: 'playerName',
      sorter: (a: PlayerTableData, b: PlayerTableData) => a.playerName.localeCompare(b.playerName),
      render: (text: string) => (
        <span style={{ fontWeight: 600, color: token.colorText }}>{text}</span>
      ),
    },
    {
      title: `${getMonthName(currentMonth)} ${currentYear}`,
      dataIndex: 'currentMonthAmount',
      key: 'currentMonthAmount',
      width: 150,
      sorter: (a: PlayerTableData, b: PlayerTableData) => a.currentMonthAmount - b.currentMonthAmount,
      render: (amount: number) => (
        <span style={{
          color: amount > 0 ? token.colorSuccess : token.colorTextSecondary,
          fontWeight: 600
        }}>
          {amount > 0 ? `৳${amount.toLocaleString()}` : '—'}
        </span>
      ),
    },
    {
      title: 'Total Contribution',
      dataIndex: 'totalContribution',
      key: 'totalContribution',
      width: 150,
      sorter: (a: PlayerTableData, b: PlayerTableData) => a.totalContribution - b.totalContribution,
      render: (amount: number) => (
        <span style={{ fontWeight: 600, color: token.colorText }}>
          ৳{amount.toLocaleString()}
        </span>
      ),
    },
    {
      title: 'Active Months',
      dataIndex: 'activeMonths',
      key: 'activeMonths',
      width: 120,
      sorter: (a: PlayerTableData, b: PlayerTableData) => a.activeMonths - b.activeMonths,
      render: (months: number) => (
        <span style={{ color: token.colorText }}>{months}</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      filters: [
        { text: 'Active', value: 'Active' },
        { text: 'Inactive', value: 'Inactive' },
      ],
      onFilter: (value: any, record: PlayerTableData) => record.status === value,
      render: (status: string) => (
        status === 'Active' 
          ? <Badge status="success" text="Active" />
          : <Badge status="error" text="Inactive" />
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 80,
      render: (record: PlayerTableData) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => onPlayerClick(record.playerId)}
          style={{ borderRadius: '6px' }}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="player-contributions-table">
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={pagination}
        scroll={{ x: 800 }}
        rowKey="key"
        className="contributions-table"
        rowClassName={(record) => 
          record.status === 'Active' ? 'active-player-row' : 'inactive-player-row'
        }
      />
    </div>
  );
};

export default PlayerContributionsTable;

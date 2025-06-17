import React, { useEffect } from 'react';
import { Table, Tag, Typography, theme, Select, Empty, Button } from 'antd';
import { CloseOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { PlayerMetric } from '../../../interfaces/IPlayerCollectionMetrics';
import { usePlayerContribution } from '../../../hooks/usePlayerContribution';
import './PlayerContributionModal.css';

const { Title, Text } = Typography;
const { Option } = Select;

interface PlayerContributionModalProps {
  visible: boolean;
  onClose: () => void;
  player: PlayerMetric | null;
}

interface ContributionRecord {
  key: string;
  month: string;
  year: string;
  amount: number;
}

const PlayerContributionModal: React.FC<PlayerContributionModalProps> = ({
  visible,
  onClose,
  player
}) => {
  const { token } = theme.useToken();
  
  const {
    selectedYear,
    setSelectedYear,
    availableYears,
    contributionData,
    statistics
  } = usePlayerContribution(player);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [visible]);

  if (!visible) return null;

  const columns = [
    {
      title: 'Month',
      dataIndex: 'month',
      key: 'month',
      width: '25%',
      sorter: (a: ContributionRecord, b: ContributionRecord) => {
        // Sort by month number (Jan=1, Feb=2, ...)
        const months = [
          "January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"
        ];
        return months.indexOf(a.month) - months.indexOf(b.month);
      },
    },
    {
      title: 'Year',
      dataIndex: 'year',
      key: 'year',
      width: '20%',
      sorter: (a: ContributionRecord, b: ContributionRecord) => parseInt(a.year) - parseInt(b.year),
      defaultSortOrder: 'descend' as const,
    },
    {
      title: 'Amount (৳)',
      dataIndex: 'amount',
      key: 'amount',
      width: '30%',
      sorter: (a: ContributionRecord, b: ContributionRecord) => a.amount - b.amount,
      render: (amount: number) => (
        <span className={`amount-cell ${amount > 0 ? 'paid' : 'unpaid'}`} style={{
          color: amount > 0 ? token.colorSuccess : token.colorTextSecondary,
          fontWeight: 600
        }}>
          {amount > 0 ? `৳${amount.toLocaleString()}` : '—'}
        </span>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: '25%',
      render: (record: ContributionRecord) => (
        record.amount > 0 
          ? <Tag color="green">Paid</Tag> 
          : <Tag color="red">Not Paid</Tag>
      ),
    },
  ];

  return (
    <div className="dashboard-modal-overlay">
      <div className="dashboard-modal-container" style={{ 
        background: token.colorBgContainer,
        color: token.colorText,
        borderColor: token.colorBorder
      }}>
        {/* Header */}
        <div className="dashboard-modal-header" style={{
          background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`,
        }}>
          <div className="header-content">
            <Button 
              type="text" 
              icon={<ArrowLeftOutlined />} 
              onClick={onClose}
              className="dashboard-back-button"
              style={{ color: 'white' }}
            />
            <div className="header-title">
              <Title level={3} className="dashboard-player-title" style={{ color: 'white', margin: 0 }}>
                {player?.playerName || 'Player Details'}
              </Title>
              <Text className="dashboard-player-id" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                ID: {player?.playerId}
              </Text>
            </div>
            <Button 
              type="text" 
              icon={<CloseOutlined />} 
              onClick={onClose}
              className="dashboard-close-button"
              style={{ color: 'white' }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="dashboard-modal-content" style={{ background: token.colorBgContainer }}>
          {!player ? (
            <div className="dashboard-empty-state" style={{ 
              background: token.colorBgElevated,
              borderColor: token.colorBorder 
            }}>
              <Empty description="No player data available" />
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="dashboard-summary-section">
                <div className="dashboard-summary-card" style={{
                  background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`,
                  color: 'white'
                }}>
                  <div className="dashboard-card-content">
                    <div className="dashboard-summary-title">Total Contribution</div>
                    <div className="dashboard-summary-value">
                      ৳{statistics.totalContribution.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="dashboard-summary-card" style={{
                  background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`,
                  color: 'white'
                }}>
                  <div className="dashboard-card-content">
                    <div className="dashboard-summary-title">Paid Months</div>
                    <div className="dashboard-summary-value">
                      {statistics.paidMonths}
                    </div>
                  </div>
                </div>
                <div className="dashboard-summary-card" style={{
                  background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`,
                  color: 'white'
                }}>
                  <div className="dashboard-card-content">
                    <div className="dashboard-summary-title">Total Records</div>
                    <div className="dashboard-summary-value">
                      {statistics.totalRecords}
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="dashboard-filters-section" style={{
                background: token.colorBgElevated,
                borderColor: token.colorBorder
              }}>
                <div className="filter-content">
                  <div className="year-filter">
                    <Text strong className="filter-label" style={{ color: token.colorText }}>
                      Filter by Year:
                    </Text>
                    <Select 
                      value={selectedYear} 
                      onChange={setSelectedYear}
                      className="dashboard-select"
                      size="large"
                      style={{ minWidth: 160 }}
                    >
                      <Option value="all">All Years</Option>
                      {availableYears.map(year => (
                        <Option key={year} value={year}>{year}</Option>
                      ))}
                    </Select>
                  </div>
                  
                  <div className="records-info">
                    <Text type="secondary" className="dashboard-records-count" style={{
                      background: token.colorPrimaryBg,
                      color: token.colorPrimary
                    }}>
                      Showing {contributionData.length} records
                      {selectedYear !== 'all' && ` for ${selectedYear}`}
                    </Text>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="dashboard-table-section" style={{
                background: token.colorBgContainer,
                borderColor: token.colorBorder
              }}>
                {contributionData.length > 0 ? (
                  <Table 
                    dataSource={contributionData} 
                    columns={columns}
                    pagination={{ 
                      pageSize: 10, 
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => 
                        `${range[0]}-${range[1]} of ${total} records`,
                      size: 'default'
                    }}
                    scroll={{ x: 400 }}
                    className="dashboard-contribution-table"
                    rowKey="key"
                    size="middle"
                  />
                ) : (
                  <div className="dashboard-empty-table-state" style={{ 
                    background: token.colorBgElevated,
                    borderColor: token.colorBorder 
                  }}>
                    <Empty description="No records found for the selected year" />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerContributionModal;

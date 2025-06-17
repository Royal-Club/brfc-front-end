import {
  Col,
  Row,
  Statistic,
  StatisticProps,
  theme,
  Typography,
  Spin,
  Input,
  Button,
  Pagination,
  Card,
  Empty,
  Select,
  Divider,
  Drawer,
  Space,
  Alert
} from "antd";
import React, { useState } from "react";
import CountUp from "react-countup";
import { useGetAccountSummaryQuery } from "../../state/features/account/accountSummarySlice";
import { SearchOutlined, FilterOutlined, CalendarOutlined, MenuOutlined, AppstoreOutlined, UnorderedListOutlined } from "@ant-design/icons";
import { PlayerMetric } from "../../interfaces/IPlayerCollectionMetrics";
import "./dashboardStyles.css";

// Import custom components and hooks
import MonthYearSelector from "../CommonAtoms/MonthYearSelector/MonthYearSelector";
import PlayerContributionCard from "../CommonAtoms/PlayerContributionCard/PlayerContributionCard";
import PlayerContributionModal from "../CommonAtoms/PlayerContributionModal/PlayerContributionModal";
import PlayerContributionsTable from "../CommonAtoms/PlayerContributionsTable/PlayerContributionsTable";
import { useDashboard } from "../../hooks/useDashboard";

const formatter: StatisticProps["formatter"] = (value) => (
  <CountUp end={value as number} separator="," />
);

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const Dashboard: React.FC = () => {
  const {
    token: { colorBgContainer, borderRadius, colorPrimary, colorPrimaryActive, colorBgElevated, colorText, colorTextSecondary }
  } = theme.useToken();

  // Dashboard hook
  const {
    searchTerm,
    setSearchTerm,
    activeFilter,
    setActiveFilter,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    viewMode,
    setViewMode,
    windowWidth,
    playerMetricsData,
    isMetricsLoading,
    filteredPlayers,
    paginatedPlayers,
    statistics,
    tableData
  } = useDashboard();

  // Modal states
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerMetric | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [mobileFiltersVisible, setMobileFiltersVisible] = useState(false);

  // Queries
  const { data: accountSummaryData, isLoading: isSummaryLoading } =
    useGetAccountSummaryQuery();

  // Determine if we're on mobile
  const isMobile = windowWidth <= 768;

  const handlePlayerClick = (playerId: number) => {
    const player = playerMetricsData?.content?.metrics.find(
      player => player.playerId === playerId
    ) || null;
    
    if (player) {
      setSelectedPlayer(player);
      setIsModalVisible(true);
      document.body.classList.add('modal-open');
    }
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedPlayer(null);
    document.body.classList.remove('modal-open');
  };

  const handleMonthYearChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  const isLoading = isSummaryLoading || isMetricsLoading;
  
  // Dynamic gradient style for stat boxes based on theme
  const statBoxStyle = {
    background: `linear-gradient(135deg, ${colorPrimary} 0%, ${colorPrimaryActive} 100%)`,
    borderRadius: '10px',
    padding: '16px',
    height: '100%',
    color: 'white',
    textAlign: 'center' as const,
    transition: 'all 0.3s ease',
  };

  const cardHeaderStyle = {
    background: `linear-gradient(135deg, ${colorPrimary} 0%, ${colorPrimaryActive} 100%)`,
    color: 'white',
    borderBottom: 'none',
  };

  const toggleMobileFilters = () => {
    setMobileFiltersVisible(!mobileFiltersVisible);
  };

  // Filter controls component for reuse in both desktop and mobile views
  const FilterControls = () => (
    <Row gutter={[16, 16]} className="controls-row">
      <Col xs={24} md={8} lg={6} xl={5}>
        <Search
          placeholder="Search players"
          allowClear
          enterButton={<SearchOutlined />}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Col>
      
      <Col xs={24} md={8} lg={6} xl={5}>
        <div className="filter-container">
          <Select 
            defaultValue="all" 
            onChange={setActiveFilter}
            style={{ width: '100%' }}
            suffixIcon={<FilterOutlined />}
          >
            <Option value="all">All Players</Option>
            <Option value="active">Active This Month</Option>
            <Option value="inactive">Inactive This Month</Option>
            <Option value="high">High Contributors</Option>
          </Select>
        </div>
      </Col>
      
      <Col xs={24} md={8} lg={6} xl={5}>
        <div className="month-selector-container">
          <MonthYearSelector 
            onChange={handleMonthYearChange} 
            defaultMonth={selectedMonth}
            defaultYear={selectedYear}
          />
        </div>
      </Col>

      <Col xs={24} md={24} lg={6} xl={4}>
        <div className="view-mode-selector">
          <Button.Group style={{ width: '100%' }}>
            <Button 
              type={viewMode === 'table' ? 'primary' : 'default'}
              icon={<UnorderedListOutlined />}
              onClick={() => setViewMode('table')}
              style={{ width: '50%' }}
            >
              Table
            </Button>
            <Button 
              type={viewMode === 'cards' ? 'primary' : 'default'}
              icon={<AppstoreOutlined />}
              onClick={() => setViewMode('cards')}
              style={{ width: '50%' }}
            >
              Cards
            </Button>
          </Button.Group>
        </div>
      </Col>
    </Row>
  );
  
  return (
    <div className="dashboard-container">
      {/* Account Summary Section */}
      <Card
     
        className="summary-card"
        style={{ marginBottom: '24px', borderRadius }}
      >
        {isSummaryLoading ? (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <Spin size="large" />
          </div>
        ) : (
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={8}>
              <Statistic
                title="Total Collections (BDT)"
                value={accountSummaryData?.content?.totalCollection}
                precision={2}
                valueStyle={{ color: "#3f8600" }}
                formatter={formatter}
                suffix="৳"
              />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic
                title="Total Expenses (BDT)"
                value={accountSummaryData?.content?.totalExpense}
                precision={2}
                valueStyle={{ color: "#3f8600" }}
                formatter={formatter}
                suffix="৳"
              />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic
                title="Account Balance (BDT)"
                value={accountSummaryData?.content?.currentBalance}
                precision={2}
                valueStyle={{ color: "#3f8600" }}
                formatter={formatter}
                suffix="৳"
              />
            </Col>
          </Row>
        )}
      </Card>

      {/* Player Contributions Section */}
      <Card
        title={
          <div className="contributions-title-container">
            <div className="contributions-title">
              <Title level={4} style={{ color: colorText }}>Player Contributions</Title>
              <Text type="secondary">Track and manage player payment history</Text>
            </div>
            
            {isMobile && !isLoading && (
              <Button 
                icon={<MenuOutlined />}
                onClick={toggleMobileFilters}
                type="primary"
                className="mobile-filter-button"
              />
            )}
          </div>
        }
        className="contributions-card"
        style={{ borderRadius, background: colorBgContainer }}
        styles={{
          body: { background: colorBgContainer }
        }}
      >
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            {/* Desktop Filters */}
            {!isMobile && <FilterControls />}

            {/* Mobile Filters Drawer */}
            <Drawer
              title="Filter Options"
              placement="right"
              closable={true}
              onClose={() => setMobileFiltersVisible(false)}
              open={mobileFiltersVisible}
              width={300}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <FilterControls />
                <Button 
                  type="primary" 
                  block 
                  onClick={() => setMobileFiltersVisible(false)}
                  style={{ marginTop: '20px' }}
                >
                  Apply Filters
                </Button>
              </Space>
            </Drawer>

            {/* Current Filter Display for Mobile */}
            {isMobile && (
              <div className="mobile-filters-summary">
                <Text strong>
                  Showing: {activeFilter === 'all' ? 'All Players' : 
                         activeFilter === 'active' ? 'Active Players' : 
                         activeFilter === 'inactive' ? 'Inactive Players' : 
                         'High Contributors'}
                </Text>
                <Text>
                  {new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                </Text>
                {searchTerm && (
                  <Alert 
                    message={`Search: "${searchTerm}"`} 
                    type="info" 
                    showIcon 
                    closable 
                    onClose={() => setSearchTerm('')}
                    style={{ marginTop: '8px' }}
                  />
                )}
              </div>
            )}

            {/* Statistics Cards */}
            <Row gutter={[16, 16]} className="stats-row">
              <Col xs={12} sm={6}>
                <div className="stat-box" style={statBoxStyle}>
                  <div className="stat-title">Total Players</div>
                  <div className="stat-value">{statistics.totalPlayers}</div>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div className="stat-box" style={statBoxStyle}>
                  <div className="stat-title">Monthly Active</div>
                  <div className="stat-value">{statistics.activePlayers}</div>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div className="stat-box" style={statBoxStyle}>
                  <div className="stat-title">Month Collection</div>
                  <div className="stat-value">৳{statistics.monthlyContribution.toLocaleString()}</div>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div className="stat-box" style={statBoxStyle}>
                  <div className="stat-title">Lifetime Total</div>
                  <div className="stat-value">৳{statistics.totalContributions.toLocaleString()}</div>
                </div>
              </Col>
            </Row>

            <Divider orientation="left" style={{ color: colorTextSecondary }}>
              <CalendarOutlined /> {new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
            </Divider>

            {/* Player Grid or Table */}
            {filteredPlayers.length > 0 ? (
              <>
                {viewMode === 'table' ? (
                  <PlayerContributionsTable
                    data={tableData}
                    loading={isLoading}
                    currentMonth={selectedMonth}
                    currentYear={selectedYear}
                    onPlayerClick={handlePlayerClick}
                    pagination={{
                      current: currentPage,
                      pageSize: pageSize,
                      total: filteredPlayers.length,
                      onChange: setCurrentPage,
                      onShowSizeChange: (_, size) => {
                        setPageSize(size);
                        setCurrentPage(1);
                      },
                      showSizeChanger: !isMobile,
                      pageSizeOptions: ['12', '24', '36', '48'],
                      size: isMobile ? "small" : "default",
                      simple: isMobile
                    }}
                  />
                ) : (
                  <Row gutter={[16, 16]} className="player-grid">
                    {paginatedPlayers.map(player => (
                      <Col key={player.playerId} xs={24} sm={12} md={8} lg={6} xl={6}>
                        <PlayerContributionCard
                          player={player}
                          currentMonth={selectedMonth}
                          currentYear={selectedYear}
                          onClick={handlePlayerClick}
                        />
                      </Col>
                    ))}
                  </Row>
                )}

                {/* Pagination for cards view only */}
                {viewMode === 'cards' && (
                  <div className="pagination-container">
                    <Pagination
                      current={currentPage}
                      pageSize={pageSize}
                      total={filteredPlayers.length}
                      onChange={setCurrentPage}
                      showSizeChanger={!isMobile}
                      onShowSizeChange={(_, size) => {
                        setPageSize(size);
                        setCurrentPage(1);
                      }}
                      pageSizeOptions={['12', '24', '36', '48']}
                      size={isMobile ? "small" : "default"}
                      simple={isMobile}
                    />
                  </div>
                )}
              </>
            ) : (
              <Empty
                description="No players found matching your criteria"
                style={{ padding: '40px 0' }}
              />
            )}
          </>
        )}
      </Card>

      {/* Player Detail Modal */}
      <PlayerContributionModal
        visible={isModalVisible}
        onClose={handleModalClose}
        player={selectedPlayer}
      />
    </div>
  );
};

export default Dashboard;

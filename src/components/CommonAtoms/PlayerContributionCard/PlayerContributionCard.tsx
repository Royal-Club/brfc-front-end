import React from 'react';
import { Card, Badge, Tooltip, theme } from 'antd';
import { PlayerMetric } from '../../../interfaces/IPlayerCollectionMetrics';
import './PlayerContributionCard.css';

interface PlayerContributionCardProps {
  player: PlayerMetric;
  currentMonth: number;
  currentYear: number;
  onClick: (playerId: number) => void;
}

const PlayerContributionCard: React.FC<PlayerContributionCardProps> = ({
  player,
  currentMonth,
  currentYear,
  onClick
}) => {
  const { token } = theme.useToken();
  
  // Calculate current month contribution
  const yearData = player.yearMonthAmount[currentYear.toString()];
  const currentMonthAmount = yearData ? yearData[currentMonth.toString()] : 0;
  
  // Calculate total contributions
  const totalContribution = Object.keys(player.yearMonthAmount).reduce((total, year) => {
    return total + Object.values(player.yearMonthAmount[year]).reduce(
      (sum, amount) => sum + amount, 0
    );
  }, 0);

  // Calculate total active months
  const activeMonths = Object.keys(player.yearMonthAmount).reduce((count, year) => {
    return count + Object.values(player.yearMonthAmount[year])
      .filter(amount => amount > 0).length;
  }, 0);

  // Dynamic styles based on theme
  const cardStyles = {
    borderTop: `3px solid ${token.colorPrimary}`,
    background: token.colorBgContainer,
    color: token.colorText
  };

  const headerStyles = {
    borderBottom: `1px solid ${token.colorBorderSecondary}`,
  };

  const statusStyles = {
    background: token.colorBgElevated,
    borderRadius: '6px',
    padding: '10px',
    margin: '12px 0',
  };

  const footerStyles = {
    borderTop: `1px solid ${token.colorBorderSecondary}`,
    paddingTop: '12px'
  };

  return (
    <Card 
      className="player-contribution-card"
      onClick={() => onClick(player.playerId)}
      hoverable
      style={cardStyles}
    >
      <div className="player-contribution-header" style={headerStyles}>
        <h3 style={{ color: token.colorText }}>{player.playerName}</h3>
        <span className="player-id" style={{ 
          background: token.colorBgElevated,
          color: token.colorTextSecondary
        }}>
          ID: {player.playerId}
        </span>
      </div>

      <div className="player-contribution-status" style={statusStyles}>
        <div className="status-item">
          <span className="status-label" style={{ color: token.colorTextSecondary }}>
            This Month:
          </span>
          <span className="status-value" style={{ color: token.colorText }}>
            {currentMonthAmount ? `৳${currentMonthAmount.toLocaleString()}` : '—'}
          </span>
        </div>
        
        <Tooltip title={currentMonthAmount ? 'Active this month' : 'Inactive this month'}>
          {currentMonthAmount ? (
            <Badge status="success" text={<span style={{ color: token.colorText }}>Active</span>} />
          ) : (
            <Badge status="error" text={<span style={{ color: token.colorText }}>Inactive</span>} />
          )}
        </Tooltip>
      </div>

      <div className="player-contribution-footer" style={footerStyles}>
        <div className="footer-item">
          <span className="footer-label" style={{ color: token.colorTextSecondary }}>
            Total:
          </span>
          <span className="footer-value" style={{ color: token.colorText }}>
            ৳{totalContribution.toLocaleString()}
          </span>
        </div>
        <div className="footer-item">
          <span className="footer-label" style={{ color: token.colorTextSecondary }}>
            Active:
          </span>
          <span className="footer-value" style={{ color: token.colorText }}>
            {activeMonths} months
          </span>
        </div>
      </div>
    </Card>
  );
};

export default PlayerContributionCard;

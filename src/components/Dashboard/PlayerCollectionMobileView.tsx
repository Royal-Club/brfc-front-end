import React from 'react';
import { theme, Tooltip, Select } from 'antd';
import { PlayerMetric } from '../../interfaces/IPlayerCollectionMetrics';
import { CalendarOutlined } from '@ant-design/icons';
import styles from './PlayerCollectionMetricsTable.module.css';

const { Option } = Select;

const monthNames = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

interface PlayerCollectionMobileViewProps {
  dataSource: any[];
  metrics: PlayerMetric[];
  selectedYear: number | null;
  currentYear: number;
  currentMonth: number;
  isDarkMode?: boolean;
  years?: number[];
  onYearChange?: (year: number) => void;
  isLoading?: boolean;
}

const PlayerCollectionMobileView: React.FC<PlayerCollectionMobileViewProps> = ({
  dataSource,
  metrics,
  selectedYear,
  currentYear,
  currentMonth,
  isDarkMode = false,
  years = [],
  onYearChange,
  isLoading = false
}) => {
  const { token } = theme.useToken();
  const themeClass = isDarkMode ? styles.darkTheme : styles.lightTheme;

  return (
    <div className={`${styles.mobileCardView} ${themeClass}`}>
      {/* Integrated Legend with Year Selector */}
      <div className={styles.integratedLegend}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CalendarOutlined style={{ fontSize: 14, color: token.colorPrimary }} />
          <Select
            size="small"
            style={{ width: 80, marginRight: 16 }}
            value={selectedYear || undefined}
            onChange={onYearChange}
            loading={isLoading}
            disabled={isLoading}
            dropdownStyle={{ minWidth: 80 }}
            className={styles.mobileCardYearSelect}
          >
            {years.map((year: number) => (
              <Option key={year} value={year}>
                {year}
              </Option>
            ))}
          </Select>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, justifyContent: 'center' }}>
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
      </div>

      {dataSource.map((player, index) => {
        const playerData = metrics.find((p: PlayerMetric) => p.playerId === player.key);
        const isActive = playerData?.active ?? false;
        
        return (
          <div key={player.key} className={styles.compactPlayerCard}>
            <div className={styles.compactPlayerHeader}>
              <div style={{ flex: 1 }}>
                <span className={styles.compactPlayerName}>{player.playerName}</span>
                <span className={styles.compactYearInfo}>
                  {selectedYear}
                </span>
              </div>
              <span className={styles.compactPlayerIndex}>#{index + 1}</span>
            </div>
            
            <div className={styles.compactMonthsGrid}>
              {monthNames.map((month, idx) => {
                const monthNumber = idx + 1;
                const amount = player[`month_${monthNumber}`] || 0;
                const isCurrentCell = selectedYear === currentYear && monthNumber === currentMonth;
                const showDue = isCurrentCell && amount <= 0 && isActive;
                const hasData = amount > 0 || showDue;
                
                let monthClass = styles.compactMonthItem;
                
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
                    {hasData && <div className={styles.compactMonthIndicator}></div>}
                    <div className={styles.compactMonthName}>{month}</div>
                    <div className={styles.compactMonthAmount}>
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


export default PlayerCollectionMobileView;

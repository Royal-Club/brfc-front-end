import React from 'react';
import { theme, Tooltip } from 'antd';
import { PlayerMetric } from '../../interfaces/IPlayerCollectionMetrics';
import styles from './PlayerCollectionMetricsTable.module.css';

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
}

const PlayerCollectionMobileView: React.FC<PlayerCollectionMobileViewProps> = ({
  dataSource,
  metrics,
  selectedYear,
  currentYear,
  currentMonth
}) => {
  const { token } = theme.useToken();

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

export default PlayerCollectionMobileView;

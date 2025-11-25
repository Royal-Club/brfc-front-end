import React from 'react';
import { Statistic, StatisticProps } from 'antd';
import CountUp from 'react-countup';
import styles from './DashboardComponent.module.css';

const formatter: StatisticProps["formatter"] = (value) => (
  <CountUp end={value as number} separator="," />
);

interface AnalyticsCardProps {
  title: string;
  value: number;
  backgroundColor: string;
  textColor: string;
  valueColor: string;
  icon: React.ReactNode;
  iconColor: string;
}

const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  title,
  value,
  backgroundColor,
  textColor,
  valueColor,
  icon,
  iconColor
}) => {
  const isMobile = window.innerWidth <= 576;

  return (
    <div 
      className={`${styles.analyticsCard} ${isMobile ? styles.mobile : styles.desktop}`} 
      style={{
        background: backgroundColor,
        border: '1px solid rgba(0, 0, 0, 0.06)',
        borderRadius: '12px',
        padding: '20px',
        position: 'relative',
        minHeight: '120px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      <div>
        <div style={{ 
          color: textColor, 
          fontSize: isMobile ? '16px' : '18px',
          fontWeight: '600',
          marginBottom: '8px'
        }}>
          {isMobile ? title.split(' ').pop() : title}
        </div>
        <Statistic
          value={value}
          precision={2}
          valueStyle={{ 
            color: valueColor, 
            fontSize: isMobile ? '22px' : '32px',
            fontWeight: 'bold',
            lineHeight: 1
          }}
          formatter={formatter}
          suffix={<span style={{ fontSize: isMobile ? '18px' : '24px', color: valueColor }}>৳</span>}
        />
      </div>
      <div style={{
        position: 'absolute',
        bottom: '16px',
        right: '16px',
        fontSize: '32px',
        color: iconColor,
      }}>
        {icon}
      </div>
    </div>
  );
};

export default AnalyticsCard;

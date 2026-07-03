import React from 'react';
import { Statistic, StatisticProps, theme } from 'antd';
import CountUp from 'react-countup';

const formatter: StatisticProps["formatter"] = (value) => (
  <CountUp end={value as number} separator="," />
);

interface AnalyticsCardProps {
  title: string;
  value: number;
  accentColor: string;
  icon: React.ReactNode;
}

const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  title,
  value,
  accentColor,
  icon,
}) => {
  const { token } = theme.useToken();
  const isMobile = window.innerWidth <= 576;

  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${token.colorBgContainer} 0%, ${token.colorFillQuaternary} 100%)`,
        border: `1px solid ${token.colorBorder}`,
        borderRadius: 16,
        padding: isMobile ? '16px' : '20px 24px',
        minHeight: isMobile ? 96 : 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.12)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{
          color: token.colorTextSecondary,
          fontSize: isMobile ? 12 : 13,
          fontWeight: 500,
          marginBottom: 8,
        }}>
          {title}
        </div>
        <Statistic
          value={value}
          precision={2}
          valueStyle={{
            color: accentColor,
            fontSize: isMobile ? 20 : 28,
            fontWeight: 'bold',
            lineHeight: 1,
          }}
          formatter={formatter}
          suffix={<span style={{ fontSize: isMobile ? 14 : 18, color: accentColor }}>৳</span>}
        />
      </div>
      <div style={{
        background: `${accentColor}20`,
        border: `1px solid ${accentColor}40`,
        borderRadius: '50%',
        width: isMobile ? 40 : 48,
        height: isMobile ? 40 : 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: isMobile ? 18 : 22,
        color: accentColor,
      }}>
        {icon}
      </div>
    </div>
  );
};

export default AnalyticsCard;

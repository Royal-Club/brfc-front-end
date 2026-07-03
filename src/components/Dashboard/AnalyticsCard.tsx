import React, { useEffect, useState } from 'react';
import { Statistic, StatisticProps } from 'antd';
import CountUp from 'react-countup';
import { club, kicker, scoreNum } from '../../theme/clubTheme';

const formatter: StatisticProps["formatter"] = (value) => (
  <CountUp end={value as number} separator="," />
);

interface AnalyticsCardProps {
  title: string;
  value: number;
  accentColor: string;
  icon: React.ReactNode;
}

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 576 : false
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 576);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return isMobile;
};

const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  title,
  value,
  accentColor,
  icon,
}) => {
  const isMobile = useIsMobile();

  return (
    <div
      style={{
        position: 'relative',
        background: club.panel,
        border: `1px solid ${club.panelBorder}`,
        borderRadius: 14,
        padding: isMobile ? '16px 16px 16px 18px' : '18px 22px 18px 24px',
        minHeight: isMobile ? 96 : 122,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.35)',
        overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 22px rgba(0, 0, 0, 0.45)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.35)';
      }}
    >
      {/* Top accent bar in the metric's colour */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: 3,
          background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor}00 90%)`,
        }}
      />

      <div style={{ minWidth: 0 }}>
        <div style={{ ...kicker, color: club.goldSoft, marginBottom: 12 }}>
          {title}
        </div>
        <Statistic
          value={value}
          precision={2}
          prefix={<span style={{ fontSize: isMobile ? 13 : 16, color: 'rgba(255,255,255,0.55)', marginRight: 5, fontWeight: 600 }}>৳</span>}
          valueStyle={{
            color: '#F5F7FA',
            fontSize: isMobile ? 24 : 32,
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: -0.8,
            ...scoreNum,
          }}
          formatter={formatter}
        />
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.06)',
        border: `1px solid ${accentColor}55`,
        borderRadius: 12,
        width: isMobile ? 42 : 50,
        height: isMobile ? 42 : 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: isMobile ? 19 : 23,
        color: accentColor,
      }}>
        {icon}
      </div>
    </div>
  );
};

export default AnalyticsCard;

import React from 'react';
import { DatePicker, Space, theme } from 'antd';
import type { DatePickerProps } from 'antd';
import dayjs from 'dayjs';
import './MonthYearSelector.css';

interface MonthYearSelectorProps {
  onChange: (month: number, year: number) => void;
  defaultMonth?: number;
  defaultYear?: number;
}

const MonthYearSelector: React.FC<MonthYearSelectorProps> = ({
  onChange,
  defaultMonth,
  defaultYear
}) => {
  const { token } = theme.useToken();
  
  const currentDate = new Date();
  const initialYear = defaultYear || currentDate.getFullYear();
  const initialMonth = defaultMonth !== undefined ? defaultMonth - 1 : currentDate.getMonth();
  
  // Create a dayjs object instead of Date
  const initialDayjs = dayjs().year(initialYear).month(initialMonth).date(1);

  const handleChange: DatePickerProps['onChange'] = (date) => {
    if (date) {
      const selectedMonth = date.month() + 1; // Months are 0-indexed
      const selectedYear = date.year();
      onChange(selectedMonth, selectedYear);
    }
  };

  return (
    <Space direction="vertical" className="month-year-selector">
      <DatePicker
        defaultValue={initialDayjs}
        onChange={handleChange}
        picker="month"
        allowClear={false}
        className="month-year-picker"
        style={{
          borderColor: token.colorBorder,
          background: token.colorBgContainer
        }}
      />
    </Space>
  );
};

export default MonthYearSelector;

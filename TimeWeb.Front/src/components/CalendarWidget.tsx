import React, { useState } from 'react';
import { useEvents } from './EventsContext';
import { theme } from '../styles/theme';

interface CalendarWidgetProps {
  onDateSelect: (date: string) => void;
  selectedDate?: string | null;
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({ 
  onDateSelect, 
  selectedDate 
}) => {
  const { hasEventsOnDate, getEventsForDate } = useEvents();
  const { colors, typography, spacing, borderRadius, shadows, transitions } = theme;
  
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay() || 7; // Пн=1, Вс=7
    
    return { daysInMonth, startingDay };
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const formatDate = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    const dateStr = formatDate(day);
    return dateStr === selectedDate;
  };

  const styles = {
    calendar: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.lg,
      boxShadow: shadows.md,
      padding: spacing.lg,
      width: '100%',
    } as React.CSSProperties,
    
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    } as React.CSSProperties,
    
    monthTitle: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.semibold,
      color: colors.gray900,
      margin: 0,
    } as React.CSSProperties,
    
    navButton: {
      backgroundColor: colors.gray100,
      border: 'none',
      borderRadius: borderRadius.md,
      padding: `${spacing.xs} ${spacing.sm}`,
      cursor: 'pointer',
      fontSize: typography.fontSize.base,
      color: colors.gray700,
      transition: `all ${transitions.normal}`,
      minWidth: '36px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    } as React.CSSProperties,
    
    todayButton: {
      backgroundColor: colors.primary,
      border: 'none',
      borderRadius: borderRadius.md,
      padding: `${spacing.xs} ${spacing.md}`,
      cursor: 'pointer',
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      color: colors.white,
      transition: `all ${transitions.normal}`,
    } as React.CSSProperties,
    
    weekDays: {
      display: 'grid',
      gridTemplateColumns: 'repeat(7, 1fr)',
      gap: spacing.xs,
      marginBottom: spacing.sm,
    } as React.CSSProperties,
    
    weekDay: {
      textAlign: 'center' as const,
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.semibold,
      color: colors.gray500,
      padding: spacing.sm,
    } as React.CSSProperties,
    
    daysGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(7, 1fr)',
      gap: spacing.xs,
    } as React.CSSProperties,
    
    dayCell: (isCurrentMonth: boolean, isToday: boolean, isSelected: boolean): React.CSSProperties => ({
      aspectRatio: '1',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.md,
      cursor: 'pointer',
      transition: `all ${transitions.fast}`,
      backgroundColor: isSelected 
        ? colors.primary 
        : isToday 
          ? colors.primaryLight + '20' 
          : isCurrentMonth 
            ? colors.white 
            : colors.gray50,
      color: isSelected 
        ? colors.white 
        : isCurrentMonth 
          ? colors.gray900 
          : colors.gray400,
      fontSize: typography.fontSize.sm,
      fontWeight: isSelected ? typography.fontWeight.semibold : typography.fontWeight.normal,
      position: 'relative' as const,
      border: isToday && !isSelected ? `2px solid ${colors.primary}` : 'none',
    }),
    
    eventIndicator: {
      position: 'absolute' as const,
      bottom: '4px',
      width: '6px',
      height: '6px',
      backgroundColor: colors.success,
      borderRadius: '50%',
    } as React.CSSProperties,
    
    emptyCell: {
      aspectRatio: '1',
    } as React.CSSProperties,
  };

  const renderDays = () => {
    const days = [];
    
    // Пустые ячейки до первого дня месяца
    for (let i = 1; i < startingDay; i++) {
      days.push(<div key={`empty-${i}`} style={styles.emptyCell} />);
    }
    
    // Дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDate(day);
      const hasEvents = hasEventsOnDate(dateStr);
      const dayIsToday = isToday(day);
      const dayIsSelected = isSelected(day);
      
      days.push(
        <button
          key={day}
          style={styles.dayCell(true, dayIsToday, dayIsSelected)}
          onClick={() => onDateSelect(dateStr)}
          onMouseOver={(e) => {
            if (!dayIsSelected) {
              e.currentTarget.style.backgroundColor = colors.gray100;
            }
          }}
          onMouseOut={(e) => {
            if (!dayIsSelected) {
              e.currentTarget.style.backgroundColor = dayIsToday ? colors.primaryLight + '20' : colors.white;
            }
          }}
          title={hasEvents ? `Событий: ${getEventsForDate(dateStr).length}` : undefined}
        >
          <span>{day}</span>
          {hasEvents && <div style={styles.eventIndicator} />}
        </button>
      );
    }
    
    return days;
  };

  return (
    <div style={styles.calendar}>
      <div style={styles.header}>
        <button 
          style={styles.navButton} 
          onClick={prevMonth}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = colors.gray200}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = colors.gray100}
        >
          ←
        </button>
        
        <h3 style={styles.monthTitle}>
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        
        <button 
          style={styles.navButton} 
          onClick={nextMonth}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = colors.gray200}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = colors.gray100}
        >
          →
        </button>
      </div>
      
      <div style={{ textAlign: 'center', marginBottom: spacing.md }}>
        <button
          style={styles.todayButton}
          onClick={goToToday}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = colors.primaryDark}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = colors.primary}
        >
          Сегодня
        </button>
      </div>
      
      <div style={styles.weekDays}>
        {dayNames.map(day => (
          <div key={day} style={styles.weekDay}>{day}</div>
        ))}
      </div>
      
      <div style={styles.daysGrid}>
        {renderDays()}
      </div>
    </div>
  );
};

export default CalendarWidget;
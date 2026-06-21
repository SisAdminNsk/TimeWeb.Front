import React, { useState, useEffect } from 'react';
import { useEvents } from '../context/EventsContext';
import { theme } from '../styles/theme';

interface CalendarWidgetProps {
  onDateSelect?: (date: string) => void;
  selectedDate?: string | null;
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({ 
  onDateSelect, 
  selectedDate,
}) => {
  const { 
    hasEventsOnDate, 
    getEventsForDate, 
    isLoading,
    fetchAllEventsForMonth,
    getAllEvents 
  } = useEvents();
  const { colors, typography, spacing, borderRadius, shadows, transitions } = theme;
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  useEffect(() => {
    fetchAllEventsForMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  }, [currentMonth, fetchAllEventsForMonth]);

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
    const startingDay = firstDay.getDay() || 7;
    
    return { daysInMonth, startingDay };
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);

  const prevMonth = () => {
    setHoveredDay(null);
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setHoveredDay(null);
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setHoveredDay(null);
    
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    
    onDateSelect?.(todayStr);
  };

  const formatDate = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    const dateStr = formatDate(day);
    return dateStr === selectedDate;
  };

  const handleDayClick = (dateStr: string) => {
    onDateSelect?.(dateStr);
  };

  const getEventsCountForMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    return getAllEvents().filter(event => {
      const [eventYear, eventMonth] = event.date.split('-').map(Number);
      return eventYear === year && (eventMonth - 1) === month;
    }).length;
  };

  const styles = {
    calendar: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.lg,
      boxShadow: shadows.md,
      padding: spacing.lg,
      width: '100%',
      position: 'relative' as const,
      overflow: 'hidden' as const,
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
      display: 'flex',
      alignItems: 'center',
      gap: spacing.sm,
    } as React.CSSProperties,

    eventCounter: {
      minWidth: '28px',
      height: '28px',
      padding: `0 ${spacing.xs}`,
      backgroundColor: colors.primary,
      color: colors.white,
      borderRadius: borderRadius.full,
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.semibold,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
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
      transition: `opacity ${transitions.normal}`,
    } as React.CSSProperties,
    
    dayCell: (isCurrentMonth: boolean, isSelected: boolean, isHovered: boolean, dateStr: string): React.CSSProperties => {
      let backgroundColor = colors.white;
      let color = colors.gray900;
      let fontWeight = typography.fontWeight.normal;
      let transform = 'scale(1)';

      if (isSelected) {
        backgroundColor = colors.primary;
        color = colors.white;
        fontWeight = typography.fontWeight.semibold;
      } else if (!isCurrentMonth) {
        backgroundColor = colors.gray50;
        color = colors.gray400;
      }

      if (isHovered && !isSelected) {
        backgroundColor = hasEventsOnDate(dateStr) ? colors.gray100 : colors.gray50;
        transform = 'scale(1.05)';
      }

      return {
        aspectRatio: '1',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: borderRadius.md,
        cursor: 'pointer',
        transition: `all ${transitions.fast}`,
        backgroundColor,
        color,
        fontSize: typography.fontSize.sm,
        fontWeight,
        position: 'relative' as const,
        border: 'none',
        transform,
      };
    },
    
    eventIndicator: {
      position: 'absolute' as const,
      bottom: '6px',
      width: '8px',
      height: '8px',
      backgroundColor: colors.success,
      borderRadius: '50%',
      boxShadow: `0 0 6px ${colors.success}60`,
    } as React.CSSProperties,
    
    emptyCell: {
      aspectRatio: '1',
    } as React.CSSProperties,

    loadingOverlay: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.white + '90',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.lg,
      zIndex: 10,
      transition: `opacity ${transitions.normal}`,
    } as React.CSSProperties,

    loadingSpinner: {
      width: '48px',
      height: '48px',
      position: 'relative' as const,
    } as React.CSSProperties,

    loadingText: {
      marginTop: spacing.md,
      fontSize: typography.fontSize.sm,
      color: colors.gray600,
      fontWeight: typography.fontWeight.medium,
    } as React.CSSProperties,

    loadingDots: {
      display: 'flex',
      gap: '4px',
      marginTop: spacing.sm,
    } as React.CSSProperties,

    loadingDot: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: colors.primary,
    } as React.CSSProperties,
  };

  const renderDays = () => {
    const days = [];
    
    for (let i = 1; i < startingDay; i++) {
      days.push(<div key={`empty-${i}`} style={styles.emptyCell} />);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDate(day);
      const hasEvents = hasEventsOnDate(dateStr);
      const dayIsSelected = isSelected(day);
      const dayIsHovered = hoveredDay === day;
      const eventsCount = getEventsForDate(dateStr).length;
      
      days.push(
        <button
          key={day}
          style={styles.dayCell(true, dayIsSelected, dayIsHovered, dateStr)}
          onClick={() => handleDayClick(dateStr)}
          onMouseEnter={() => setHoveredDay(day)}
          onMouseLeave={() => setHoveredDay(null)}
          title={hasEvents 
            ? `Событий: ${eventsCount}` 
            : 'Нет событий'}
        >
          <span>{day}</span>
          {hasEvents && (
            <div style={styles.eventIndicator} />
          )}
        </button>
      );
    }
    
    return days;
  };

  return (
    <div style={styles.calendar}>
      {isLoading && (
        <div style={styles.loadingOverlay}>
          <div style={styles.loadingSpinner}>
            <svg viewBox="0 0 48 48" style={{ width: '100%', height: '100%' }}>
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke={colors.gray200}
                strokeWidth="4"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke={colors.primary}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="80"
                strokeDashoffset="20"
                className="spinner-circle"
              />
            </svg>
          </div>
          <p style={styles.loadingText}>
            Загрузка
            <span className="loading-dots">...</span>
          </p>
          <div style={styles.loadingDots}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  ...styles.loadingDot,
                  animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                  opacity: 0.4,
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div style={{ opacity: isLoading ? 0.5 : 1, transition: `opacity ${transitions.normal}` }}>
        <div style={styles.header}>
          <button 
            style={styles.navButton} 
            onClick={prevMonth}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = colors.gray200;
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = colors.gray100;
              e.currentTarget.style.transform = 'scale(1)';
            }}
            disabled={isLoading}
          >
            ←
          </button>
          
          <h3 style={styles.monthTitle}>
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            <span style={styles.eventCounter}>
              {getEventsCountForMonth() > 99 ? '99+' : getEventsCountForMonth()}
            </span>
          </h3>
          
          <button 
            style={styles.navButton} 
            onClick={nextMonth}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = colors.gray200;
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = colors.gray100;
              e.currentTarget.style.transform = 'scale(1)';
            }}
            disabled={isLoading}
          >
            →
          </button>
        </div>
        
        <div style={{ textAlign: 'center', marginBottom: spacing.md }}>
          <button
            style={styles.todayButton}
            onClick={goToToday}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = colors.primaryDark;
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = colors.primary;
              e.currentTarget.style.transform = 'scale(1)';
            }}
            disabled={isLoading}
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

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { 
            opacity: 0.4;
            transform: scale(1);
          }
          50% { 
            opacity: 1;
            transform: scale(1.3);
          }
        }
        
        .spinner-circle {
          animation: spin 1.2s linear infinite;
          transform-origin: center;
        }
        
        .loading-dots {
          animation: dots 1.5s steps(4, end) infinite;
        }
        
        @keyframes dots {
          0%, 20% { content: ''; }
          40% { content: '.'; }
          60% { content: '..'; }
          80%, 100% { content: '...'; }
        }
      `}</style>
    </div>
  );
};

export default CalendarWidget;
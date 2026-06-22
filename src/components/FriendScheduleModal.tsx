import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useEvents } from '../context/EventsContext';
import { theme } from '../styles/theme';
import { 
  formatDate, 
  addDays, 
  timeToMinutes, 
  assignEventLanes,
  getInitials 
} from '../pages/CabinetPage';

interface FriendScheduleModalProps {
  isOpen: boolean;
  friendId: string;
  friendName: string;
  onClose: () => void;
}

export const FriendScheduleModal: React.FC<FriendScheduleModalProps> = ({
  isOpen,
  friendId,
  friendName,
  onClose,
}) => {
  const { getFriendEventsForDate } = useEvents();
  const { colors, typography, spacing, borderRadius, shadows, transitions } = theme;
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [events, setEvents] = useState<Array<{id: string; title: string; startTime: string; endTime: string; color: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isOpen && friendId) {
      loadFriendEvents(selectedDate);
    }
  }, [isOpen, friendId, selectedDate]);

  const loadFriendEvents = useCallback(async (date: string) => {
    setIsLoading(true);
    try {
      const friendEvents = await getFriendEventsForDate(friendId, date);
      setEvents(friendEvents.map(e => ({
        id: e.id,
        title: e.title,
        startTime: e.startTime,
        endTime: e.endTime,
        color: colors.primary,
      })));
    } catch (err) {
      console.error('Failed to load friend events:', err);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [friendId, getFriendEventsForDate, colors.primary]);

  const lanesAssignment = useMemo(() => {
    return assignEventLanes(events.map(e => ({ id: e.id, startTime: e.startTime, endTime: e.endTime })));
  }, [events]);

  const maxLane = Math.max(-1, ...lanesAssignment.map(a => a.lane));
  const laneCount = maxLane + 1;
  const laneHeight = 32;
  const timelineContentHeight = Math.max(50, laneCount * laneHeight + 8);

  const laneMap = useMemo(() => {
    const map = new Map<string, number>();
    lanesAssignment.forEach(a => map.set(a.id, a.lane));
    return map;
  }, [lanesAssignment]);

  const styles = {
    modalOverlay: {
      position: 'fixed' as const,
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3000,
      animation: 'fadeIn 0.2s ease',
      padding: isMobile ? spacing.md : spacing.lg,
    },
    modalContent: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.xl,
      boxShadow: shadows.xl,
      padding: isMobile ? spacing.lg : spacing.xl,
      maxWidth: isMobile ? '100%' : '700px',
      width: isMobile ? '100%' : '95%',
      maxHeight: '90vh',
      overflowY: 'auto' as const,
      animation: 'slideIn 0.2s ease',
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
      paddingBottom: spacing.md,
      borderBottom: `1px solid ${colors.gray200}`,
    },
    modalTitle: {
      margin: 0,
      fontSize: isMobile ? typography.fontSize.base : typography.fontSize.lg,
      fontWeight: typography.fontWeight.semibold,
      color: colors.gray900,
    },
    friendInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    friendAvatar: {
      width: '32px',
      height: '32px',
      borderRadius: borderRadius.full,
      backgroundColor: colors.primary,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: colors.white,
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.semibold,
    },
    friendName: {
      fontSize: typography.fontSize.sm,
      color: colors.gray600,
      margin: 0,
    },
    closeButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: spacing.sm,
      color: colors.gray500,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.md,
      transition: `all ${transitions.fast}`,
    },
    scheduleControls: {
      display: 'flex',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.lg,
      flexWrap: 'wrap' as const,
      justifyContent: isMobile ? 'center' : 'flex-start',
    },
    navButton: {
      padding: `${spacing.sm} ${spacing.md}`,
      fontSize: typography.fontSize.sm,
      backgroundColor: 'transparent',
      color: colors.gray700,
      border: `1px solid ${colors.gray300}`,
      borderRadius: borderRadius.md,
      cursor: 'pointer',
      fontWeight: typography.fontWeight.medium,
      transition: `all ${transitions.fast}`,
      display: 'flex',
      alignItems: 'center',
      gap: spacing.xs,
    },
    dateLabel: {
      fontSize: isMobile ? 14 : 16,
      fontWeight: 500,
      color: colors.gray900,
      minWidth: isMobile ? 120 : 160,
      textAlign: 'center' as const,
    },
    todayButton: {
      ...{ padding: '4px 12px', fontSize: 12 },
      backgroundColor: 'transparent',
      color: colors.gray700,
      border: `1px solid ${colors.gray300}`,
      borderRadius: borderRadius.md,
      cursor: 'pointer',
    },
    timelineWrapper: {
      overflowX: 'auto' as const,
      overflowY: 'auto' as const,
      WebkitOverflowScrolling: 'touch' as const,
      scrollbarWidth: 'thin' as const,
      msOverflowStyle: 'none' as const,
      border: `1px solid ${colors.gray200}`,
      borderRadius: borderRadius.md,
      backgroundColor: colors.gray50,
    },
    timelineContainer: {
      position: 'relative' as const,
      height: 'auto',
      minHeight: isMobile ? '100px' : '70px',
      minWidth: '1440px',
      overflow: 'visible' as const,
    },
    timelineHours: {
      display: 'flex',
      height: '24px',
      borderBottom: `1px solid ${colors.gray200}`,
      backgroundColor: colors.white,
      position: 'sticky' as const,
      top: 0,
      zIndex: 10,
      minWidth: '1440px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    },
    timelineHourSlot: {
      flex: '0 0 60px',
      borderRight: `1px solid ${colors.gray100}`,
      fontSize: typography.fontSize.xs,
      color: colors.gray500,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 2px',
      boxSizing: 'border-box' as const,
    },
    timelineEventsLayer: {
      position: 'absolute' as const,
      top: '24px',
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'visible',
      minWidth: '1440px',
    },
    timelineEvent: (start: string, end: string, color: string, top: number) => {
      const startMin = timeToMinutes(start);
      const endMin = timeToMinutes(end);
      const duration = Math.max(endMin - startMin, 15);
      const left = (startMin / 1440) * 1440;
      const width = Math.max((duration / 1440) * 1440, 30);
      return {
        position: 'absolute' as const,
        left: `${left}px`,
        width: `${width}px`,
        top: `${top}px`,
        height: `${laneHeight - 6}px`,
        backgroundColor: color,
        borderRadius: borderRadius.sm,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: `all ${transitions.fast}`,
        boxShadow: shadows.sm,
        overflow: 'hidden',
        zIndex: 1,
      };
    },
    timelineEventLabel: {
      fontSize: isMobile ? 10 : 11,
      fontWeight: typography.fontWeight.medium,
      color: colors.white,
      textAlign: 'center' as const,
      padding: '1px 4px',
      whiteSpace: 'nowrap' as const,
      overflow: 'hidden',
      textOverflow: 'ellipsis' as const,
      maxWidth: '100%',
    },
    timelineEmpty: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '80px',
      color: colors.gray500,
      fontSize: typography.fontSize.sm,
    },
    eventsList: {
      marginTop: spacing.lg,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: spacing.sm,
    },
    eventItem: {
      display: 'flex',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      backgroundColor: colors.gray50,
      borderRadius: borderRadius.md,
      border: `1px solid ${colors.gray200}`,
    },
    eventColor: {
      width: '4px',
      height: '32px',
      borderRadius: borderRadius.sm,
      backgroundColor: colors.primary,
    },
    eventInfo: {
      flex: 1,
      minWidth: 0,
    },
    eventTitle: {
      fontWeight: typography.fontWeight.semibold,
      fontSize: typography.fontSize.sm,
      color: colors.gray900,
      margin: 0,
      wordBreak: 'break-word' as const,
    },
    eventTime: {
      fontSize: typography.fontSize.xs,
      color: colors.gray500,
      margin: 0,
    },
    modalActions: {
      display: 'flex',
      justifyContent: 'flex-end',
      marginTop: spacing.lg,
      paddingTop: spacing.lg,
      borderTop: `1px solid ${colors.gray200}`,
    },
    closeButtonPrimary: {
      padding: `${spacing.sm} ${spacing.lg}`,
      backgroundColor: colors.primary,
      color: colors.white,
      border: 'none',
      borderRadius: borderRadius.md,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      cursor: 'pointer',
      transition: `all ${transitions.normal}`,
    },
  };

  if (!isOpen) return null;

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div>
            <h3 style={styles.modalTitle}>Расписание (GMT+7)</h3>
            <div style={styles.friendInfo}>
              <div style={styles.friendAvatar}>{getInitials(friendName)}</div>
              <p style={styles.friendName}>{friendName}</p>
            </div>
          </div>
          <button style={styles.closeButton} onClick={onClose} aria-label="Закрыть">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div style={styles.scheduleControls}>
          <button 
            style={styles.navButton}
            onClick={() => setSelectedDate(addDays(selectedDate, -1))}
            title="Предыдущий день"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          
          <span style={styles.dateLabel}>{formatDate(selectedDate)}</span>
          
          <button 
            style={styles.navButton}
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            title="Следующий день"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
          
          <button 
            style={styles.todayButton}
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
          >
            Сегодня
          </button>
        </div>

        <div style={styles.timelineWrapper}>
          <div style={{...styles.timelineContainer, height: `${timelineContentHeight + 24}px`}}>
            <div style={styles.timelineHours}>
              {Array.from({length: 24}, (_, h) => (
                <div key={h} style={styles.timelineHourSlot}>
                  {h.toString().padStart(2, '0')}:00
                </div>
              ))}
            </div>
            <div style={styles.timelineEventsLayer}>
              {isLoading ? (
                <div style={styles.timelineEmpty}>Загрузка...</div>
              ) : events.length === 0 ? (
                <div style={styles.timelineEmpty}>Нет встреч на этот день</div>
              ) : (
                events.map(ev => {
                  const lane = laneMap.get(ev.id) ?? 0;
                  return (
                    <div 
                      key={ev.id} 
                      style={styles.timelineEvent(ev.startTime, ev.endTime, ev.color, lane * laneHeight)}
                      title={`${ev.title}\n${ev.startTime} — ${ev.endTime}`}
                    >
                      <span style={styles.timelineEventLabel}>{ev.title}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {events.length > 0 && (
          <div style={styles.eventsList}>
            {events.map(ev => (
              <div key={ev.id} style={styles.eventItem}>
                <div style={{...styles.eventColor, backgroundColor: ev.color}} />
                <div style={styles.eventInfo}>
                  <p style={styles.eventTitle}>{ev.title}</p>
                  <p style={styles.eventTime}>{ev.startTime} — {ev.endTime}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={styles.modalActions}>
          <button style={styles.closeButtonPrimary} onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};
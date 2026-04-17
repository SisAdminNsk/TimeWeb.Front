import React, { useState, useEffect } from 'react';
import { useEvents } from '../context/EventsContext';
import { CalendarWidget } from '../components/CalendarWidget';
import { EventsList } from '../components/EventList';
import { AddEventModal } from '../components/AddEventModal';
import { theme } from '../styles/theme';

const EventsPageContent = () => {
  const { selectedDate, selectDate, refetchEvents } = useEvents();
  const { colors, typography, spacing } = theme;
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);

  useEffect(() => {
    refetchEvents();
  }, [refetchEvents]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refetchEvents();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refetchEvents]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const containerStyle: React.CSSProperties = {
    animation: 'fadeIn 0.4s ease-out',
    padding: isMobile ? spacing.md : 0,
  };

  const headerStyle: React.CSSProperties = {
    marginBottom: isMobile ? spacing.lg : spacing.xl,
    paddingBottom: isMobile ? spacing.md : spacing.lg,
    borderBottom: `1px solid ${colors.gray200}`,
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: isMobile ? typography.fontSize.xl : typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.gray900,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  };

  const subtitleStyle: React.CSSProperties = {
    margin: `${spacing.xs} 0 0 0`,
    color: colors.gray500,
    fontSize: typography.fontSize.sm,
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '400px 1fr',
    gap: isMobile ? spacing.md : spacing.lg,
    alignItems: 'start',
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>
          <span>Календарь встреч</span>
        </h1>
        <p style={subtitleStyle}>
          Планируйте встречи и приглашайте друзей
        </p>
      </header>

      <div style={gridStyle}>
        <CalendarWidget 
          onDateSelect={selectDate}
          selectedDate={selectedDate}
        />
        <EventsList 
          selectedDate={selectedDate}
          onAddEvent={() => setIsModalOpen(true)}
        />
      </div>

      {selectedDate && (
        <AddEventModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          selectedDate={selectedDate}
        />
      )}
    </div>
  );
};

export const EventsPage = () => {
  return <EventsPageContent />;
};

export default EventsPage;
// EventsList.tsx
import React, { useState, useMemo } from 'react';
import { useEvents } from '../context/EventsContext';
import { useToast } from '../context/ToastContext';
import { theme } from '../styles/theme';
import EventDetailsModal from './EventDetailsModal';

interface EventsListProps {
    selectedDate: string | null;
    onAddEvent: () => void;
}

export const EventsList: React.FC<EventsListProps> = ({
    selectedDate,
    onAddEvent
}) => {
    const { getEventsForDate, deleteEvent, isLoading, initiatorEvents } = useEvents();
    const { addToast } = useToast();
    const { colors, typography, spacing, borderRadius, shadows, transitions } = theme;

    const isDatePassed = useMemo(() => {
        if (!selectedDate) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selected = new Date(selectedDate);
        selected.setHours(0, 0, 0, 0);
        return selected.getTime() < today.getTime();
    }, [selectedDate]);
    
    // ✅ Вспомогательная функция: парсит время в минуты от начала суток
    const parseTimeToMinutes = (timeStr: string): number | null => {
        if (!timeStr) return null;
        if (typeof timeStr !== 'string' || !timeStr.includes(':')) return null;
        
        let hours = NaN;
        let minutes = NaN;
        
        if (timeStr.includes('T')) {
            const date = new Date(timeStr);
            hours = date.getHours();
            minutes = date.getMinutes();
        } else {
            const parts = timeStr.split(':');
            hours = parseInt(parts[0], 10);
            minutes = parseInt(parts[1], 10);
        }
        
        if (isNaN(hours) || isNaN(minutes)) return null;
        return hours * 60 + minutes;
    };
    
    // ✅ Проверяет, прошла ли встреча (текущее время >= времени окончания)
    const checkIsEventPassed = (event: any) => {
        if (!selectedDate) return false;
        
        const today = new Date();
        const selected = new Date(selectedDate);
        selected.setHours(0, 0, 0, 0);
        const todayNormalized = new Date(today);
        todayNormalized.setHours(0, 0, 0, 0);
        
        if (selected.getTime() < todayNormalized.getTime()) {
            return true;
        }
        
        if (selected.getTime() === todayNormalized.getTime()) {
            const endMinutes = parseTimeToMinutes(event.endTime);
            if (endMinutes === null) return false;
            
            const currentMinutes = today.getHours() * 60 + today.getMinutes();
            return currentMinutes >= endMinutes;
        }
        
        return false;
    };
    
    // ✅ Проверяет, идет ли встреча прямо сейчас
    const checkIsEventOngoing = (event: any) => {
        if (!selectedDate) return false;
        
        const today = new Date();
        const selected = new Date(selectedDate);
        selected.setHours(0, 0, 0, 0);
        const todayNormalized = new Date(today);
        todayNormalized.setHours(0, 0, 0, 0);
        
        // Только для сегодняшнего дня
        if (selected.getTime() !== todayNormalized.getTime()) {
            return false;
        }
        
        const startMinutes = parseTimeToMinutes(event.startTime);
        const endMinutes = parseTimeToMinutes(event.endTime);
        
        if (startMinutes === null || endMinutes === null) return false;
        
        const currentMinutes = today.getHours() * 60 + today.getMinutes();
        
        return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    };
    
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        eventId: string | null;
        eventTitle: string | null;
        deletedReason: string;
    }>({
        isOpen: false,
        eventId: null,
        eventTitle: null,
        deletedReason: '',
    });
    
    const [detailsModal, setDetailsModal] = useState<{
        isOpen: boolean;
        eventId: string | null;
    }>({
        isOpen: false,
        eventId: null,
    });
    
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const events = selectedDate ? getEventsForDate(selectedDate) : [];
    
    const isInitiator = (eventId: string) => {
        return initiatorEvents.some(event => event.id === eventId);
    };
    
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            weekday: 'long'
        });
    };
    
    const formatTime = (timeStr: string) => {
        return timeStr;
    };
    
    const getParticipantsCount = (friendIds: string[]) => {
        return friendIds.length;
    };
    
    const formatParticipantsText = (count: number) => {
        count++;
        if (count === 0) return 'Нет участников';
        if (count === 1) return '1 участник';
        if (count >= 2 && count <= 4) return `${count} участника`;
        return `${count} участников`;
    };
    
    const handleDeleteClick = (eventId: string, eventTitle: string) => {
        if (!isInitiator(eventId)) {
            console.warn('Пользователь не имеет прав на удаление этого события');
            setDeleteError('У вас нет прав на удаление этого события');
            setTimeout(() => setDeleteError(null), 3000);
            return;
        }
        
        const event = events.find(e => e.id === eventId);
        if (!event) return;
        
        if (checkIsEventOngoing(event)) {
            setDeleteError('Нельзя удалить встречу, которая сейчас идет');
            setTimeout(() => setDeleteError(null), 3000);
            return;
        }
        
        if (checkIsEventPassed(event)) {
            setDeleteError('Нельзя удалить встречу, которая уже прошла');
            setTimeout(() => setDeleteError(null), 3000);
            return;
        }
        
        setDeleteModal({
            isOpen: true,
            eventId,
            eventTitle,
            deletedReason: '',
        });
    };
    
    const handleDeleteConfirm = async () => {
        if (deleteModal.eventId) {
            if (!isInitiator(deleteModal.eventId)) {
                setDeleteError('У вас нет прав на удаление этого события');
                addToast({
                    title: 'Ошибка',
                    message: 'У вас нет прав на удаление этого события',
                    type: 'error',
                });
                setDeleteModal({ isOpen: false, eventId: null, eventTitle: null, deletedReason: '' });
                setTimeout(() => setDeleteError(null), 3000);
                return;
            }
            
            const event = events.find(e => e.id === deleteModal.eventId);
            if (event) {
                if (checkIsEventOngoing(event)) {
                    setDeleteError('Нельзя удалить встречу, которая сейчас идет');
                    addToast({
                        title: 'Ошибка',
                        message: 'Встреча сейчас идет и не может быть удалена',
                        type: 'error',
                    });
                    setDeleteModal({ isOpen: false, eventId: null, eventTitle: null, deletedReason: '' });
                    setTimeout(() => setDeleteError(null), 3000);
                    return;
                }
                
                if (checkIsEventPassed(event)) {
                    setDeleteError('Нельзя удалить встречу, которая уже прошла');
                    addToast({
                        title: 'Ошибка',
                        message: 'Встреча уже прошла и не может быть удалена',
                        type: 'error',
                    });
                    setDeleteModal({ isOpen: false, eventId: null, eventTitle: null, deletedReason: '' });
                    setTimeout(() => setDeleteError(null), 3000);
                    return;
                }
            }
            
            try {
                await deleteEvent(deleteModal.eventId, deleteModal.deletedReason || null);
                addToast({
                    title: 'Встреча удалена',
                    message: 'Встреча успешно удалена из календаря',
                    type: 'success',
                });
                setDeleteModal({ isOpen: false, eventId: null, eventTitle: null, deletedReason: '' });
            } catch (err) {
                console.error('Failed to delete event:', err);
                const errorMessage = err instanceof Error ? err.message : 'Не удалось удалить встречу';
                setDeleteError(errorMessage);
                addToast({
                    title: 'Ошибка при удалении',
                    message: errorMessage,
                    type: 'error',
                });
                setTimeout(() => setDeleteError(null), 3000);
            }
        }
    };
    
    const handleDeleteCancel = () => {
        setDeleteModal({ isOpen: false, eventId: null, eventTitle: null, deletedReason: '' });
    };
    
    const handleEventCardClick = (eventId: string) => {
        setDetailsModal({
            isOpen: true,
            eventId,
        });
    };
    
    const closeDetailsModal = () => {
        setDetailsModal({
            isOpen: false,
            eventId: null,
        });
    };

    const styles = {
        container: {
            backgroundColor: colors.white,
            borderRadius: borderRadius.lg,
            boxShadow: shadows.md,
            padding: spacing.lg,
            width: '100%',
            minHeight: '300px',
        } as React.CSSProperties,
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.lg,
            paddingBottom: spacing.md,
            borderBottom: `1px solid ${colors.gray200}`,
        } as React.CSSProperties,
        title: {
            margin: 0,
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.semibold,
            color: colors.gray900,
        } as React.CSSProperties,
        addButtonWrapper: {
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'flex-end',
            gap: spacing.xs,
        } as React.CSSProperties,
        addButton: {
            backgroundColor: colors.primary,
            color: colors.white,
            border: 'none',
            borderRadius: borderRadius.md,
            padding: `${spacing.sm} ${spacing.md}`,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            cursor: 'pointer',
            transition: `all ${transitions.normal}`,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
        } as React.CSSProperties,
        addButtonDisabled: {
            backgroundColor: colors.gray300,
            color: colors.gray500,
            border: 'none',
            borderRadius: borderRadius.md,
            padding: `${spacing.sm} ${spacing.md}`,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            cursor: 'not-allowed',
            transition: `all ${transitions.normal}`,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
            opacity: 0.7,
        } as React.CSSProperties,
        hint: {
            fontSize: typography.fontSize.xs,
            color: colors.gray500,
            fontStyle: 'italic',
            maxWidth: '180px',
            textAlign: 'right' as const,
            lineHeight: 1.3,
            margin: 0,
        } as React.CSSProperties,
        dateTitle: {
            fontSize: typography.fontSize.base,
            color: colors.gray600,
            marginBottom: spacing.sm,
            fontStyle: 'italic',
        } as React.CSSProperties,
        emptyState: {
            textAlign: 'center' as const,
            padding: spacing['2xl'],
            color: colors.gray400,
        } as React.CSSProperties,
        eventCard: {
            backgroundColor: colors.gray50,
            borderRadius: borderRadius.md,
            padding: spacing.md,
            marginBottom: spacing.md,
            border: `1px solid ${colors.gray200}`,
            transition: `all ${transitions.normal}`,
            cursor: 'pointer',
            position: 'relative' as const,
        } as React.CSSProperties,
        organizerBadge: {
            position: 'absolute' as const,
            top: spacing.sm,
            right: spacing.sm,
            backgroundColor: colors.primary,
            color: colors.white,
            padding: `${spacing.xs} ${spacing.sm}`,
            borderRadius: borderRadius.full,
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.semibold,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
        } as React.CSSProperties,
        // ✅ Шильдик "Идет сейчас"
        ongoingBadge: {
            position: 'absolute' as const,
            top: spacing.sm,
            right: spacing.sm,
            backgroundColor: colors.success || '#10b981',
            color: colors.white,
            padding: `${spacing.xs} ${spacing.sm}`,
            borderRadius: borderRadius.full,
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.semibold,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
            animation: 'pulse 2s infinite',
        } as React.CSSProperties,
        eventHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: spacing.sm,
            paddingRight: '100px', // ✅ Отступ под бейдж
        } as React.CSSProperties,
        eventTitle: {
            margin: 0,
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.semibold,
            color: colors.gray900,
        } as React.CSSProperties,
        eventTime: {
            fontSize: typography.fontSize.xs,
            color: colors.primary,
            fontWeight: typography.fontWeight.medium,
            backgroundColor: colors.primaryLight + '20',
            padding: `${spacing.xs} ${spacing.sm}`,
            borderRadius: borderRadius.full,
            display: 'inline-block',
            marginTop: spacing.xs,
        } as React.CSSProperties,
        eventDescription: {
            fontSize: typography.fontSize.sm,
            color: colors.gray600,
            marginBottom: spacing.sm,
            lineHeight: 1.5,
        } as React.CSSProperties,
        eventParticipants: {
            fontSize: typography.fontSize.xs,
            color: colors.gray500,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
            marginTop: spacing.xs,
        } as React.CSSProperties,
        participantsBadge: {
            backgroundColor: colors.gray200,
            padding: `${spacing.xs} ${spacing.sm}`,
            borderRadius: borderRadius.full,
            fontSize: typography.fontSize.xs,
            color: colors.gray700,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
        } as React.CSSProperties,
        deleteButtonContainer: {
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'flex-end',
            gap: spacing.xs,
            marginTop: spacing.sm,
            paddingTop: spacing.sm,
            borderTop: `1px dashed ${colors.gray200}`,
        } as React.CSSProperties,
        deleteButton: {
            backgroundColor: 'transparent',
            border: `1px solid ${colors.error}`,
            color: colors.error,
            cursor: 'pointer',
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.medium,
            padding: `${spacing.xs} ${spacing.md}`,
            borderRadius: borderRadius.md,
            transition: `all ${transitions.fast}`,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
        } as React.CSSProperties,
        deleteButtonDisabled: {
            backgroundColor: 'transparent',
            border: `1px solid ${colors.gray300}`,
            color: colors.gray400,
            cursor: 'not-allowed',
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.medium,
            padding: `${spacing.xs} ${spacing.md}`,
            borderRadius: borderRadius.md,
            transition: `all ${transitions.fast}`,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
            opacity: 0.6,
        } as React.CSSProperties,
        deleteHint: {
            fontSize: typography.fontSize.xs,
            color: colors.gray500,
            fontStyle: 'italic',
            maxWidth: '200px',
            textAlign: 'right' as const,
            lineHeight: 1.3,
            margin: 0,
        } as React.CSSProperties,
        noDateSelected: {
            textAlign: 'center' as const,
            padding: spacing['2xl'],
            color: colors.gray400,
        } as React.CSSProperties,
        errorToast: {
            position: 'fixed' as const,
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: colors.error,
            color: colors.white,
            padding: `${spacing.md} ${spacing.lg}`,
            borderRadius: borderRadius.md,
            boxShadow: shadows.lg,
            zIndex: 3000,
            animation: 'slideIn 0.3s ease',
        } as React.CSSProperties,
        modalOverlay: {
            position: 'fixed' as const,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.2s ease',
        } as React.CSSProperties,
        modalContent: {
            backgroundColor: colors.white,
            borderRadius: borderRadius.lg,
            boxShadow: shadows.xl,
            padding: spacing.lg,
            maxWidth: '400px',
            width: '90%',
            animation: 'slideIn 0.2s ease',
        } as React.CSSProperties,
        modalHeader: {
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            marginBottom: spacing.md,
        } as React.CSSProperties,
        modalIcon: {
            width: '40px',
            height: '40px',
            backgroundColor: colors.errorLight,
            borderRadius: borderRadius.full,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        } as React.CSSProperties,
        modalIconSvg: {
            width: '20px',
            height: '20px',
            color: colors.error,
        } as React.CSSProperties,
        modalTitle: {
            margin: 0,
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.semibold,
            color: colors.gray900,
        } as React.CSSProperties,
        modalMessage: {
            fontSize: typography.fontSize.base,
            color: colors.gray600,
            marginBottom: spacing.lg,
            lineHeight: 1.5,
        } as React.CSSProperties,
        modalEventName: {
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.semibold,
            color: colors.gray900,
            backgroundColor: colors.gray100,
            padding: `${spacing.xs} ${spacing.sm}`,
            borderRadius: borderRadius.md,
            display: 'inline-block',
            marginTop: spacing.sm,
        } as React.CSSProperties,
        modalActions: {
            display: 'flex',
            justifyContent: 'flex-end',
            gap: spacing.sm,
        } as React.CSSProperties,
        modalButtonCancel: {
            backgroundColor: 'transparent',
            color: colors.gray700,
            border: `1px solid ${colors.gray300}`,
            borderRadius: borderRadius.md,
            padding: `${spacing.sm} ${spacing.lg}`,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            cursor: 'pointer',
            transition: `all ${transitions.normal}`,
        } as React.CSSProperties,
        modalButtonDelete: {
            backgroundColor: colors.error,
            color: colors.white,
            border: 'none',
            borderRadius: borderRadius.md,
            padding: `${spacing.sm} ${spacing.lg}`,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            cursor: 'pointer',
            transition: `all ${transitions.normal}`,
        } as React.CSSProperties,
    };

    if (!selectedDate) {
        return (
            <div style={styles.container}>
                <div style={styles.noDateSelected}>
                    <p>Выберите дату в календаре</p>
                    <p style={{ fontSize: typography.fontSize.sm, marginTop: spacing.sm }}>
                        Нажмите на любую дату, чтобы просмотреть или создать встречу
                    </p>
                </div>
                {deleteError && (
                    <div style={styles.errorToast}>
                        {deleteError}
                    </div>
                )}
            </div>
        );
    }

    return (
        <>
            <div style={styles.container}>
                <div style={styles.header}>
                    <div>
                        <h3 style={styles.title}>Встречи</h3>
                        <p style={styles.dateTitle}>{formatDate(selectedDate)}</p>
                    </div>

                    <div style={styles.addButtonWrapper}>
                        <button
                            style={isDatePassed ? styles.addButtonDisabled : styles.addButton}
                            onClick={onAddEvent}
                            disabled={isLoading || isDatePassed}
                            onMouseOver={(e) => {
                                if (!isLoading && !isDatePassed) {
                                    e.currentTarget.style.backgroundColor = colors.primaryDark;
                                }
                            }}
                            onMouseOut={(e) => {
                                if (!isLoading && !isDatePassed) {
                                    e.currentTarget.style.backgroundColor = colors.primary;
                                }
                            }}
                            title={isDatePassed ? 'Нельзя добавить встречу на прошедшую дату' : undefined}
                        >
                            <span>+</span>
                            Добавить
                        </button>
                        {isDatePassed && (
                            <span style={styles.hint}>
                                Добавить встречу можно только на предстоящие дни
                            </span>
                        )}
                    </div>
                </div>

                {events.length === 0 ? (
                    <div style={styles.emptyState}>
                        {isDatePassed ? (
                            <>
                                <p>На эту дату встреч не было</p>
                                <p style={{ fontSize: typography.fontSize.sm, marginTop: spacing.sm }}>
                                    Создание встреч доступно только для будущих дат
                                </p>
                            </>
                        ) : (
                            <>
                                <p>На этот день нет запланированных встреч</p>
                                <p style={{ fontSize: typography.fontSize.sm, marginTop: spacing.sm }}>
                                    Нажмите «Добавить», чтобы создать новую встречу
                                </p>
                            </>
                        )}
                    </div>
                ) : (
                    <div>
                        {events.map(event => {
                            const isOrganizer = isInitiator(event.id);
                            const participantsCount = getParticipantsCount(event.friendIds);
                            const participantsText = formatParticipantsText(participantsCount);
                            const hasEventPassed = checkIsEventPassed(event);
                            const isEventOngoing = checkIsEventOngoing(event);
                            // ✅ Кнопка заблокирована, если встреча идет или уже прошла
                            const isDeleteDisabled = isLoading || hasEventPassed || isEventOngoing;
                            
                            return (
                                <div
                                    key={event.id}
                                    style={styles.eventCard}
                                    onClick={() => handleEventCardClick(event.id)}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.backgroundColor = colors.gray100;
                                        e.currentTarget.style.borderColor = colors.gray300;
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.backgroundColor = colors.gray50;
                                        e.currentTarget.style.borderColor = colors.gray200;
                                    }}
                                >
                                    {/* ✅ Бейджи в правом верхнем углу */}
                                    {isEventOngoing && (
                                        <div style={styles.ongoingBadge}>
                                            <span style={{
                                                width: '6px',
                                                height: '6px',
                                                borderRadius: '50%',
                                                backgroundColor: colors.white,
                                                display: 'inline-block',
                                            }} />
                                            Идет сейчас
                                        </div>
                                    )}
                                    {isOrganizer && !isEventOngoing && (
                                        <div style={styles.organizerBadge}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                <circle cx="12" cy="7" r="4" />
                                            </svg>
                                            Вы организатор
                                        </div>
                                    )}
                                    <div style={styles.eventHeader}>
                                        <div>
                                            <h4 style={styles.eventTitle}>{event.title}</h4>
                                            <span style={styles.eventTime}>
                                                {formatTime(event.startTime)} - {formatTime(event.endTime)}
                                            </span>
                                        </div>
                                    </div>
                                    {event.description && (
                                        <p style={styles.eventDescription}>{event.description}</p>
                                    )}
                                    <div style={styles.eventParticipants}>
                                        <span style={styles.participantsBadge}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                                <circle cx="9" cy="7" r="4" />
                                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                            </svg>
                                            {participantsText}
                                        </span>
                                    </div>
                                    {isOrganizer && (
                                        <div style={styles.deleteButtonContainer}>
                                            <button
                                                style={isDeleteDisabled ? styles.deleteButtonDisabled : styles.deleteButton}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (!isDeleteDisabled) {
                                                        handleDeleteClick(event.id, event.title);
                                                    }
                                                }}
                                                disabled={isDeleteDisabled}
                                                onMouseOver={(e) => {
                                                    if (!isDeleteDisabled) {
                                                        e.currentTarget.style.backgroundColor = colors.error;
                                                        e.currentTarget.style.color = colors.white;
                                                    }
                                                }}
                                                onMouseOut={(e) => {
                                                    if (!isDeleteDisabled) {
                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                        e.currentTarget.style.color = colors.error;
                                                    }
                                                }}
                                                title={
                                                    isEventOngoing 
                                                        ? 'Нельзя удалить встречу, которая сейчас идет' 
                                                        : hasEventPassed 
                                                            ? 'Нельзя удалить прошедшую встречу' 
                                                            : 'Удалить встречу'
                                                }
                                            >
                                                <svg
                                                    width="14"
                                                    height="14"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                </svg>
                                                Удалить
                                            </button>
                                            {isEventOngoing && (
                                                <span style={styles.deleteHint}>
                                                    Встреча сейчас идет, удаление недоступно
                                                </span>
                                            )}
                                            {!isEventOngoing && hasEventPassed && (
                                                <span style={styles.deleteHint}>
                                                    Встреча уже прошла, удаление недоступно
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
                
                {deleteError && (
                    <div style={styles.errorToast}>
                        {deleteError}
                    </div>
                )}
            </div>

            <EventDetailsModal
                isOpen={detailsModal.isOpen}
                eventId={detailsModal.eventId}
                onClose={closeDetailsModal}
            />

            {deleteModal.isOpen && (
                <div style={styles.modalOverlay} onClick={handleDeleteCancel}>
                    <div
                        style={styles.modalContent}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={styles.modalHeader}>
                            <div style={styles.modalIcon}>
                                <svg
                                    style={styles.modalIconSvg}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                            </div>
                            <h3 style={styles.modalTitle}>Удалить встречу?</h3>
                        </div>
                        <p style={styles.modalMessage}>
                            Вы уверены, что хотите удалить эту встречу? Это действие нельзя отменить.
                        </p>
                        {deleteModal.eventTitle && (
                            <div style={styles.modalEventName}>
                                {deleteModal.eventTitle}
                            </div>
                        )}
                        
                        <div style={{ marginBottom: spacing.lg }}>
                            <label style={{
                                display: 'block',
                                marginBottom: spacing.xs,
                                fontSize: typography.fontSize.sm,
                                fontWeight: typography.fontWeight.medium,
                                color: colors.gray700,
                            }}>
                                Причина удаления (необязательно)
                            </label>
                            <textarea
                                value={deleteModal.deletedReason}
                                onChange={(e) => setDeleteModal({
                                    ...deleteModal,
                                    deletedReason: e.target.value,
                                })}
                                placeholder="Укажите причину удаления встречи..."
                                style={{
                                    width: '100%',
                                    minHeight: '80px',
                                    padding: spacing.md,
                                    fontSize: typography.fontSize.sm,
                                    border: `1px solid ${colors.gray300}`,
                                    borderRadius: borderRadius.md,
                                    fontFamily: 'inherit',
                                    resize: 'none' as const,
                                    color: colors.gray900,
                                }}
                            />
                        </div>
                        
                        <div style={styles.modalActions}>
                            <button
                                style={styles.modalButtonCancel}
                                onClick={handleDeleteCancel}
                                disabled={isLoading}
                                onMouseOver={(e) => {
                                    if (!isLoading) {
                                        e.currentTarget.style.backgroundColor = colors.gray100;
                                    }
                                }}
                                onMouseOut={(e) => {
                                    if (!isLoading) {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }
                                }}
                            >
                                Отмена
                            </button>
                            <button
                                style={styles.modalButtonDelete}
                                onClick={handleDeleteConfirm}
                                disabled={isLoading}
                                onMouseOver={(e) => {
                                    if (!isLoading) {
                                        e.currentTarget.style.backgroundColor = colors.errorDark;
                                    }
                                }}
                                onMouseOut={(e) => {
                                    if (!isLoading) {
                                        e.currentTarget.style.backgroundColor = colors.error;
                                    }
                                }}
                            >
                                {isLoading ? 'Удаление...' : 'Удалить'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
            `}</style>
        </>
    );
};

export default EventsList;
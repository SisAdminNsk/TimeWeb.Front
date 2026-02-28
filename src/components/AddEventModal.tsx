import React, { useState } from 'react';
import { useEvents } from '../context/EventsContext';
import { theme } from '../styles/theme';
import { FriendsSelector } from './FriendsSelector';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
}

export const AddEventModal: React.FC<AddEventModalProps> = ({
  isOpen,
  onClose,
  selectedDate
}) => {
  const { addEvent, isLoading } = useEvents();
  const { colors, typography, spacing, borderRadius, shadows, transitions } = theme;
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFriendsSelectorOpen, setIsFriendsSelectorOpen] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) {
      newErrors.title = 'Введите заголовок';
    }
    if (!startTime) {
      newErrors.startTime = 'Укажите время начала';
    }
    if (!endTime) {
      newErrors.endTime = 'Укажите время окончания';
    }
    if (startTime && endTime && startTime >= endTime) {
      newErrors.endTime = 'Время окончания должно быть позже времени начала';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      await addEvent({
        title: title.trim(),
        description: description.trim(),
        date: selectedDate,
        startTime,
        endTime,
        friendIds: selectedFriendIds,
      });
      
      setTitle('');
      setDescription('');
      setStartTime('09:00');
      setEndTime('10:00');
      setSelectedFriendIds([]);
      setErrors({});
      onClose();
    } catch (err) {
      console.error('Failed to add event:', err);
    }
  };

  if (!isOpen) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const styles = {
    overlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      animation: 'fadeIn 0.2s ease-out',
    } as React.CSSProperties,
    modal: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.xl,
      boxShadow: shadows.xl,
      width: '100%',
      maxWidth: '500px',
      maxHeight: '80vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column' as const,
      animation: 'slideIn 0.3s ease-out',
    } as React.CSSProperties,
    header: {
      padding: spacing.lg,
      borderBottom: `1px solid ${colors.gray200}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.gray50,
    } as React.CSSProperties,
    title: {
      margin: 0,
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.semibold,
      color: colors.gray900,
    } as React.CSSProperties,
    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: typography.fontSize.xl,
      cursor: 'pointer',
      color: colors.gray500,
      padding: spacing.xs,
      borderRadius: borderRadius.md,
      transition: `all ${transitions.fast}`,
    } as React.CSSProperties,
    body: {
      padding: spacing.lg,
      overflowY: 'auto' as const,
      flex: 1,
    } as React.CSSProperties,
    formGroup: {
      marginBottom: spacing.lg,
    } as React.CSSProperties,
    label: {
      display: 'block',
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
      color: colors.gray700,
      marginBottom: spacing.xs,
    } as React.CSSProperties,
    input: {
      width: '100%',
      padding: `${spacing.sm} ${spacing.md}`,
      border: `1px solid ${colors.gray300}`,
      borderRadius: borderRadius.md,
      fontSize: typography.fontSize.base,
      transition: `all ${transitions.fast}`,
      boxSizing: 'border-box' as const,
    } as React.CSSProperties,
    textarea: {
      width: '100%',
      padding: `${spacing.sm} ${spacing.md}`,
      border: `1px solid ${colors.gray300}`,
      borderRadius: borderRadius.md,
      fontSize: typography.fontSize.base,
      transition: `all ${transitions.fast}`,
      boxSizing: 'border-box' as const,
      minHeight: '80px',
      resize: 'vertical' as const,
      fontFamily: 'inherit',
    } as React.CSSProperties,
    timeRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: spacing.md,
    } as React.CSSProperties,
    error: {
      color: colors.error,
      fontSize: typography.fontSize.xs,
      marginTop: spacing.xs,
    } as React.CSSProperties,
    footer: {
      padding: spacing.lg,
      borderTop: `1px solid ${colors.gray200}`,
      display: 'flex',
      justifyContent: 'flex-end',
      gap: spacing.sm,
      backgroundColor: colors.gray50,
    } as React.CSSProperties,
    button: (variant: 'primary' | 'secondary'): React.CSSProperties => ({
      padding: `${spacing.sm} ${spacing.lg}`,
      borderRadius: borderRadius.md,
      cursor: isLoading ? 'not-allowed' : 'pointer',
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      backgroundColor: variant === 'primary'
        ? (isLoading ? colors.gray400 : colors.primary)
        : colors.gray200,
      color: variant === 'primary' ? colors.white : colors.gray700,
      border: 'none',
      transition: `all ${transitions.normal}`,
      opacity: isLoading ? 0.6 : 1,
    }),
    selectedCount: {
      fontSize: typography.fontSize.xs,
      color: colors.gray500,
      marginTop: spacing.xs,
    } as React.CSSProperties,
    dateDisplay: {
      backgroundColor: colors.primaryLight + '20',
      padding: spacing.sm,
      borderRadius: borderRadius.md,
      marginBottom: spacing.lg,
      textAlign: 'center' as const,
    } as React.CSSProperties,
    dateText: {
      fontSize: typography.fontSize.sm,
      color: colors.primaryDark,
      fontWeight: typography.fontWeight.semibold,
      margin: 0,
    } as React.CSSProperties,
    friendsButton: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      padding: `${spacing.sm} ${spacing.md}`,
      border: `1px solid ${colors.gray300}`,
      borderRadius: borderRadius.md,
      backgroundColor: colors.white,
      cursor: isLoading ? 'not-allowed' : 'pointer',
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      color: colors.gray700,
      transition: `all ${transitions.fast}`,
    } as React.CSSProperties,
    friendBadge: {
      backgroundColor: colors.primary,
      color: colors.white,
      borderRadius: borderRadius.full,
      padding: `${spacing.xs} ${spacing.sm}`,
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.semibold,
    } as React.CSSProperties,
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={styles.title}>Добавить встречу</h3>
          <button
            style={styles.closeButton}
            onClick={onClose}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = colors.gray200}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            ✕
          </button>
        </div>

        <div style={styles.body}>
          <div style={styles.dateDisplay}>
            <p style={styles.dateText}>{formatDate(selectedDate)}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Заголовок *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  ...styles.input,
                  borderColor: errors.title ? colors.error : colors.gray300,
                }}
                placeholder="Название"
                disabled={isLoading}
                onFocus={(e) => e.target.style.borderColor = colors.primary}
                onBlur={(e) => e.target.style.borderColor = errors.title ? colors.error : colors.gray300}
              />
              {errors.title && <div style={styles.error}>{errors.title}</div>}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Описание</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={styles.textarea}
                placeholder="Описание"
                disabled={isLoading}
                onFocus={(e) => e.target.style.borderColor = colors.primary}
                onBlur={(e) => e.target.style.borderColor = colors.gray300}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Время проведения *</label>
              <div style={styles.timeRow}>
                <div>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    style={{
                      ...styles.input,
                      borderColor: errors.startTime ? colors.error : colors.gray300,
                    }}
                    disabled={isLoading}
                  />
                  {errors.startTime && <div style={styles.error}>{errors.startTime}</div>}
                  <div style={{ fontSize: typography.fontSize.xs, color: colors.gray500, marginTop: spacing.xs }}>
                    Начало
                  </div>
                </div>
                <div>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    style={{
                      ...styles.input,
                      borderColor: errors.endTime ? colors.error : colors.gray300,
                    }}
                    disabled={isLoading}
                  />
                  {errors.endTime && <div style={styles.error}>{errors.endTime}</div>}
                  <div style={{ fontSize: typography.fontSize.xs, color: colors.gray500, marginTop: spacing.xs }}>
                    Окончание
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Пригласить друзей</label>
              <button
                type="button"
                style={styles.friendsButton}
                onClick={() => setIsFriendsSelectorOpen(true)}
                disabled={isLoading}
                onMouseOver={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = colors.gray50;
                    e.currentTarget.style.borderColor = colors.primary;
                  }
                }}
                onMouseOut={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = colors.white;
                    e.currentTarget.style.borderColor = colors.gray300;
                  }
                }}
              >
                Выбрать друзей
                {selectedFriendIds.length > 0 && (
                  <span style={styles.friendBadge}>
                    {selectedFriendIds.length}
                  </span>
                )}
              </button>
              {selectedFriendIds.length > 0 && (
                <div style={styles.selectedCount}>
                  Выбрано друзей: {selectedFriendIds.length}
                </div>
              )}
            </div>

            <div style={styles.footer}>
              <button
                type="button"
                style={styles.button('secondary')}
                onClick={onClose}
                disabled={isLoading}
                onMouseOver={(e) => {
                  if (!isLoading) e.currentTarget.style.backgroundColor = colors.gray300;
                }}
                onMouseOut={(e) => {
                  if (!isLoading) e.currentTarget.style.backgroundColor = colors.gray200;
                }}
              >
                Отмена
              </button>
              <button
                type="submit"
                style={styles.button('primary')}
                disabled={isLoading}
                onMouseOver={(e) => {
                  if (!isLoading) e.currentTarget.style.backgroundColor = colors.primaryDark;
                }}
                onMouseOut={(e) => {
                  if (!isLoading) e.currentTarget.style.backgroundColor = colors.primary;
                }}
              >
                {isLoading ? 'Сохранение...' : 'Добавить'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {isFriendsSelectorOpen && (
        <div style={styles.overlay} onClick={() => setIsFriendsSelectorOpen(false)}>
          <div 
            style={{
              ...styles.modal,
              maxWidth: '400px',
              maxHeight: '500px',
            }} 
            onClick={e => e.stopPropagation()}
          >
            <FriendsSelector
              selectedFriendIds={selectedFriendIds}
              onSelectionChange={setSelectedFriendIds}
              onConfirm={() => setIsFriendsSelectorOpen(false)}
              onCancel={() => setIsFriendsSelectorOpen(false)}
            />
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
      `}</style>
    </div>
  );
};

export default AddEventModal;
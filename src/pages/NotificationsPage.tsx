import React from 'react';
import { useNotifications } from '../context/NotificationsContext';
import { theme } from '../styles/theme';

const tabTypes = [
  { key: 'NewEvent', label: 'Новые встречи' },
  { key: 'EventUpdated', label: 'Изменения по встречам' },
  { key: 'EventDeclined', label: 'Отмененные встречи' },
];

const blinkKeyframes = `
  @keyframes blinkDot {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.4;
      transform: scale(0.9);
    }
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

export const NotificationsPage: React.FC = () => {
  const {
    notifications,
    isLoading,
    isInitialLoading, // Используем новое поле
    totalCount,
    page,
    pageSize,
    type,
    setType,
    setPage,
    onAccept,
    onDecline,
    newNotificationIds,
  } = useNotifications();

  const { colors, typography, spacing, borderRadius, shadows, transitions } = theme;

  return (
    <div style={{ padding: spacing.xl, maxWidth: '1200px', margin: '0 auto' }}>
      <style>{blinkKeyframes}</style>

      {/* Заголовок */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl }}>
        <h2 style={{ 
          fontSize: typography.fontSize['2xl'], 
          fontWeight: typography.fontWeight.bold,
          color: colors.gray900,
          margin: 0
        }}>
          Новости
        </h2>
        {/* Маленький индикатор фоновой загрузки */}
        {isLoading && !isInitialLoading && (
          <div style={{
            width: '20px',
            height: '20px',
            border: `2px solid ${colors.gray200}`,
            borderTop: `2px solid ${colors.primary}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        )}
      </div>

      {/* Табы навигации */}
      <div style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.xl, flexWrap: 'wrap' }}>
        {tabTypes.map(tab => {
          const isActive = type === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setType(tab.key as typeof type)}
              style={{
                padding: `${spacing.sm} ${spacing.md}`,
                background: isActive ? colors.primary : colors.white,
                color: isActive ? colors.white : colors.gray700,
                border: `1px solid ${isActive ? colors.primary : colors.gray300}`,
                borderRadius: borderRadius.md,
                fontWeight: typography.fontWeight.medium,
                fontSize: typography.fontSize.sm,
                cursor: 'pointer',
                boxShadow: isActive ? shadows.md : 'none',
                transition: `all ${transitions.normal}`,
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = colors.gray50;
                  e.currentTarget.style.borderColor = colors.gray400;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = colors.white;
                  e.currentTarget.style.borderColor = colors.gray300;
                }
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Список уведомлений */}
      <div>
        {isInitialLoading ? (
          // Показываем большую заглушку ТОЛЬКО при первой загрузке
          <div style={{ 
            padding: spacing['2xl'], 
            textAlign: 'center', 
            color: colors.gray500,
            background: colors.gray50,
            borderRadius: borderRadius.lg,
          }}>
            <div style={{ fontSize: typography.fontSize.lg, marginBottom: spacing.sm }}>Загрузка...</div>
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ 
            padding: spacing['2xl'], 
            textAlign: 'center', 
            color: colors.gray500,
            background: colors.gray50,
            borderRadius: borderRadius.lg,
            border: `1px dashed ${colors.gray300}`
          }}>
            <div style={{ fontSize: typography.fontSize.lg, marginBottom: spacing.sm }}>Нет уведомлений</div>
            <div style={{ fontSize: typography.fontSize.sm }}>Попробуйте выбрать другой фильтр</div>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {notifications.map(n => {
              const notificationId = `${n.eventId}-${n.createdAt}`;
              const isNew = newNotificationIds.has(notificationId);
              
              return (
                <li 
                  key={notificationId} 
                  style={{ 
                    marginBottom: spacing.md, 
                    background: colors.white, 
                    padding: spacing.lg, 
                    borderRadius: borderRadius.lg,
                    border: `1px solid ${colors.gray200}`,
                    boxShadow: shadows.sm,
                    transition: `box-shadow ${transitions.normal}`,
                    position: 'relative',
                    // Предотвращаем мерцание контента при обновлении
                    opacity: isLoading ? 0.9 : 1, 
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = shadows.md;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = shadows.sm;
                  }}
                >
                  {isNew && (
                    <div style={{
                      position: 'absolute',
                      top: spacing.md,
                      right: spacing.md,
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: colors.success,
                      animation: 'blinkDot 2s ease-in-out infinite',
                      boxShadow: `0 0 4px ${colors.success}`,
                    }} />
                  )}

                  <div style={{ 
                    fontSize: typography.fontSize.sm, 
                    color: colors.gray600,
                    marginBottom: spacing.xs,
                  }}>
                    ID события: <span style={{ fontFamily: 'monospace', background: colors.gray100, padding: `0 ${spacing.xs}`, borderRadius: borderRadius.sm }}>{n.eventId}</span>
                  </div>
                  <div style={{ 
                    fontSize: typography.fontSize.xs, 
                    color: colors.gray500,
                    marginBottom: spacing.lg,
                  }}>
                    Получено: {new Date(n.createdAt).toLocaleString()}
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: spacing.sm,
                    flexWrap: 'wrap',
                    paddingTop: spacing.md,
                    borderTop: `1px solid ${colors.gray100}`,
                  }}>
                    <button
                      onClick={() => onAccept(notificationId)}
                      style={{
                        padding: `${spacing.xs} ${spacing.md}`,
                        background: colors.success,
                        color: colors.white,
                        border: 'none',
                        borderRadius: borderRadius.md,
                        fontWeight: typography.fontWeight.medium,
                        fontSize: typography.fontSize.sm,
                        cursor: 'pointer',
                        transition: `all ${transitions.fast}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.xs,
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = colors.successDark}
                      onMouseLeave={(e) => e.currentTarget.style.background = colors.success}
                    >
                      <span>✓</span> Принять
                    </button>

                    <button
                      onClick={() => onDecline(notificationId)}
                      style={{
                        padding: `${spacing.xs} ${spacing.md}`,
                        background: colors.error,
                        color: colors.white,
                        border: 'none',
                        borderRadius: borderRadius.md,
                        fontWeight: typography.fontWeight.medium,
                        fontSize: typography.fontSize.sm,
                        cursor: 'pointer',
                        transition: `all ${transitions.fast}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.xs,
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = colors.errorDark}
                      onMouseLeave={(e) => e.currentTarget.style.background = colors.error}
                    >
                      <span>✕</span> Отклонить
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Пагинация */}
      {totalCount > pageSize && (
        <div style={{ 
          marginTop: spacing.xl, 
          display: 'flex', 
          justifyContent: 'center',
          gap: spacing.xs,
          flexWrap: 'wrap'
        }}>
          {Array.from({ length: Math.ceil(totalCount / pageSize) }, (_, i) => {
            const pageNum = i + 1;
            const isActive = page === pageNum;
            return (
              <button
                key={pageNum}
                style={{
                  minWidth: '40px',
                  height: '40px',
                  padding: `${spacing.xs} ${spacing.sm}`,
                  background: isActive ? colors.primary : colors.white,
                  color: isActive ? colors.white : colors.gray700,
                  border: `1px solid ${isActive ? colors.primary : colors.gray300}`,
                  borderRadius: borderRadius.md,
                  cursor: 'pointer',
                  fontWeight: typography.fontWeight.medium,
                  fontSize: typography.fontSize.sm,
                  transition: `all ${transitions.fast}`,
                }}
                onClick={() => setPage(pageNum)}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = colors.gray50;
                    e.currentTarget.style.borderColor = colors.gray400;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = colors.white;
                    e.currentTarget.style.borderColor = colors.gray300;
                  }
                }}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
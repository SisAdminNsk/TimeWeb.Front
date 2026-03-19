import React from 'react';
import { useToast } from '../context/ToastContext';
import { theme } from '../styles/theme';

const toastKeyframes = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
  
  @keyframes progress {
    from { width: 100%; }
    to { width: 0%; }
  }
`;

const getToastColors = (type: 'success' | 'info' | 'warning' | 'error', colors: any) => {
  switch (type) {
    case 'success': return { bg: colors.success, border: colors.successDark};
    case 'info': return { bg: colors.primary, border: colors.primaryDark};
    case 'warning': return { bg: colors.warning, border: colors.warningDark};
    case 'error': return { bg: colors.error, border: colors.errorDark};
    default: return { bg: colors.primary, border: colors.primaryDark};
  }
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();
  const { colors, typography, spacing, borderRadius, shadows } = theme;

  if (toasts.length === 0) return null;

  return (
    <>
      <style>{toastKeyframes}</style>
      <div style={{
        position: 'fixed',
        top: spacing.xl,
        right: spacing.xl,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.sm,
        maxWidth: '400px',
        width: '100%',
      }}>
        {toasts.map(toast => {
          const colors_ = getToastColors(toast.type, colors);
          
          return (
            <div
              key={toast.id}
              style={{
                background: colors.white,
                border: `2px solid ${colors_.border}`,
                borderRadius: borderRadius.lg,
                boxShadow: shadows.lg,
                padding: spacing.md,
                display: 'flex',
                alignItems: 'flex-start',
                gap: spacing.sm,
                animation: 'slideInRight 0.3s ease-out',
                position: 'relative',
                overflow: 'hidden',
              }}
            >

              {/* Контент */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.gray900,
                  marginBottom: spacing.xs,
                }}>
                  {toast.title}
                </div>
                {toast.message && (
                  <div style={{
                    fontSize: typography.fontSize.xs,
                    color: colors.gray600,
                    lineHeight: 1.4,
                  }}>
                    {toast.message}
                  </div>
                )}
              </div>

              {/* Кнопка закрытия */}
              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: spacing.xs,
                  color: colors.gray400,
                  fontSize: typography.fontSize.lg,
                  lineHeight: 1,
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = colors.gray600}
                onMouseLeave={(e) => e.currentTarget.style.color = colors.gray400}
              >
                ✕
              </button>

              {/* Прогресс-бар времени */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: '3px',
                background: colors_.bg,
                animation: `progress ${5}s linear`,
                opacity: 0.3,
              }} />
            </div>
          );
        })}
      </div>
    </>
  );
};

export default ToastContainer;
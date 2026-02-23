import { theme } from '../styles/theme';

export const EventsPage = () => {
  const { colors, typography, spacing, borderRadius, shadows } = theme;

  const containerStyle: React.CSSProperties = {
    animation: 'fadeIn 0.3s ease-out',
  };

  const cardStyle: React.CSSProperties = {
    padding: spacing['2xl'],
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    boxShadow: shadows.md,
    textAlign: 'center',
  };

  const iconStyle: React.CSSProperties = {
    fontSize: '64px',
    marginBottom: spacing.lg,
  };

  const headingStyle: React.CSSProperties = {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray900,
    marginBottom: spacing.sm,
  };

  const textStyle: React.CSSProperties = {
    color: colors.gray500,
    fontSize: typography.fontSize.base,
    lineHeight: 1.6,
  };

  return (
    <div style={containerStyle}>      
      <div style={cardStyle}>
        <div style={iconStyle}>🚧</div>
        <h2 style={headingStyle}>Раздел в разработке</h2>
        <p style={textStyle}>
          Здесь будет список мероприятий и уведомлений.<br />
          Скоро мы добавим эту функциональность.
        </p>
      </div>
    </div>
  );
};
import { useAuth } from '../AuthContext';
import { FriendsProvider } from '../components/FriendsContext';
import { FriendsWidget } from '../components/FriendsWidget';
import { theme } from '../styles/theme';

export const CabinetPage = () => {
  const { user } = useAuth();
  const { colors, typography, spacing, borderRadius, shadows, transitions } = theme;

  if (!user) return null;

  const containerStyle: React.CSSProperties = {
    animation: 'fadeIn 0.4s ease-out',
    minHeight: 'calc(100vh - 80px)',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 400px',
    gap: spacing.lg,
    alignItems: 'start',
    minHeight: 'calc(100vh - 200px)',
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    boxShadow: shadows.md,
    animation: 'fadeIn 0.5s ease-out',
    transition: `box-shadow ${transitions.normal}`,
  };

  const cardTitleStyle: React.CSSProperties = {
    margin: `0 0 ${spacing.lg} 0`,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray900,
    paddingBottom: spacing.md,
    borderBottom: `1px solid ${colors.gray200}`,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
  };

  const infoGridStyle: React.CSSProperties = {
    display: 'grid',
    gap: spacing.md,
  };

  const infoItemStyle: React.CSSProperties = {
    padding: spacing.lg,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    border: `1px solid ${colors.gray200}`,
    transition: `all ${transitions.normal}`,
  };

  const infoLabelStyle: React.CSSProperties = {
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    marginBottom: spacing.xs,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    fontWeight: typography.fontWeight.semibold,
  };

  const infoValueStyle: React.CSSProperties = {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray900,
  };

  const widgetContainerStyle: React.CSSProperties = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    animation: 'fadeIn 0.5s ease-out 0.1s backwards',
  };

  return (
    <div style={containerStyle}>

      <div style={gridStyle}>
        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>
            Мои данные
          </h2>
          
          <div style={infoGridStyle}>
            <div style={infoItemStyle}>
              <div style={infoLabelStyle}>Имя пользователя</div>
              <div style={infoValueStyle}>{user.name}</div>
            </div>
            
            <div style={infoItemStyle}>
              <div style={infoLabelStyle}>Токен авторизации</div>
              <div style={{ 
                ...infoValueStyle, 
                fontSize: typography.fontSize.xs, 
                fontFamily: 'monospace', 
                color: colors.gray600,
                wordBreak: 'break-all' as const,
                backgroundColor: colors.white,
                padding: spacing.sm,
                borderRadius: borderRadius.sm,
                border: `1px solid ${colors.gray200}`,
              }}>
                {user.token.substring(0, 50)}...
              </div>
            </div>
          
          </div>
        </div>

        <div style={widgetContainerStyle}>
          <FriendsProvider>
            <FriendsWidget />
          </FriendsProvider>
        </div>
      </div>
    </div>
  );
};

export default CabinetPage;
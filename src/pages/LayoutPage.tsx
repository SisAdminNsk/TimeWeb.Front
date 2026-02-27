import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { theme } from '../styles/theme';

export const LayoutPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { colors, typography, spacing, borderRadius, transitions, shadows } = theme;

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  const handleLogout = () => {
    logout();
    navigate('/sign-in');
  };

  const checkConnection = async () => {
    if (!navigator.onLine) {
      setIsOnline(false);
      return;
    }

    try {
      await fetch('https://www.google.com/favicon.ico', { 
        method: 'HEAD', 
        mode: 'no-cors',
        cache: 'no-store' 
      });
      setIsOnline(true);
    } catch (error) {
      setIsOnline(false);
    }
  };

  useEffect(() => {
    checkConnection();

    const intervalId = setInterval(() => {
      checkConnection();
    }, 5000);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: colors.gray100,
  };

  const sidebarStyle: React.CSSProperties = {
    width: '280px',
    backgroundColor: colors.sidebar.bg,
    color: colors.sidebar.text,
    display: 'flex',
    flexDirection: 'column',
    padding: spacing.lg,
    position: 'fixed' as const,
    height: '100vh',
    left: 0,
    top: 0,
    boxShadow: shadows.lg,
    zIndex: 1000,
  };

  const logoStyle: React.CSSProperties = {
    marginBottom: spacing['2xl'],
    paddingLeft: spacing.sm,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
  };

  const logoTextStyle: React.CSSProperties = {
    margin: 0,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.sidebar.text,
  };

  const navStyle: React.CSSProperties = {
    flex: 1,
  };

  const navItemStyle = (path: string): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.sm} ${spacing.md}`,
    color: location.pathname === path ? colors.white : colors.sidebar.textMuted,
    backgroundColor: location.pathname === path ? colors.sidebar.active : 'transparent',
    borderRadius: borderRadius.md,
    textDecoration: 'none',
    marginBottom: spacing.xs,
    transition: `all ${transitions.normal}`,
    fontWeight: location.pathname === path ? typography.fontWeight.semibold : typography.fontWeight.normal,
    fontSize: typography.fontSize.sm,
  });

  const userProfileStyle: React.CSSProperties = {
    borderTop: `1px solid ${colors.sidebar.border}`,
    paddingTop: spacing.lg,
    marginTop: 'auto',
  };

  const userInfoStyle: React.CSSProperties = {
    marginBottom: spacing.md,
    paddingLeft: spacing.sm,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
  };

  const avatarStyle: React.CSSProperties = {
    width: '36px',
    height: '36px',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.sm,
  };

  const userNameStyle: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    color: colors.sidebar.text,
    fontWeight: typography.fontWeight.semibold,
  };

  const userStatusStyle: React.CSSProperties = {
    fontSize: typography.fontSize.xs,
    color: isOnline ? colors.sidebar.textMuted : colors.error,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    transition: `color ${transitions.normal}`,
  };

  const logoutButtonStyle: React.CSSProperties = {
    width: '100%',
    padding: `${spacing.sm} ${spacing.md}`,
    backgroundColor: 'transparent',
    border: `1px solid ${colors.error}`,
    color: colors.error,
    borderRadius: borderRadius.md,
    cursor: 'pointer',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    transition: `all ${transitions.normal}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  };

  const mainStyle: React.CSSProperties = {
    marginLeft: '280px',
    width: 'calc(100% - 280px)',
    padding: spacing.xl,
    minHeight: '100vh',
  };

  return (
    <div style={containerStyle}>
      <aside style={sidebarStyle}>
        <div style={logoStyle}>
          <div>
            <h2 style={logoTextStyle}>TimeWeb</h2>
          </div>
        </div>

        <nav style={navStyle}>
          <Link to="/cabinet" style={navItemStyle('/cabinet')}>
            Личный кабинет
          </Link>
          <Link to="/events" style={navItemStyle('/events')}>
            Календарь встреч
          </Link>
        </nav>

        <div style={userProfileStyle}>
          <div style={userInfoStyle}>
            <div style={avatarStyle}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <div style={userNameStyle}>{user?.name}</div>
              <div style={userStatusStyle}>
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    backgroundColor: isOnline ? colors.success : colors.error,
                    borderRadius: '50%',
                    display: 'inline-block',
                    transition: `background-color ${transitions.normal}`,
                  }}
                />
                {isOnline ? 'Онлайн' : 'Нет соединения'}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={logoutButtonStyle}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = colors.error;
              e.currentTarget.style.color = colors.white;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = colors.error;
            }}
          >
            Выйти
          </button>
        </div>
      </aside>

      <main style={mainStyle}>
        <Outlet />
      </main>
    </div>
  );
};
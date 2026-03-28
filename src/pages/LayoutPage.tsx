import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import { useEvents } from '../context/EventsContext';
import { theme } from '../styles/theme';
import ToastContainer from '../components/ToastContainer';

export const LayoutPage = () => {
  const { user, logout } = useAuth();
  const { totalNotificationsCount } = useNotifications();
  const { events, initiatorEvents } = useEvents();
  const navigate = useNavigate();
  const location = useLocation();
  const { colors, typography, spacing, borderRadius, transitions, shadows } = theme;

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    await logout('user');
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

  const handleNavClick = () => {
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  // Подсчет всех событий на текущий месяц
  const getEventsCountForMonth = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const allEvents = [...events, ...initiatorEvents];
    return allEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
    }).length;
  };

  const eventsCountForMonth = getEventsCountForMonth();

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: colors.gray100,
    position: 'relative',
    overflow: 'hidden',
  };

  const sidebarStyle: React.CSSProperties = {
    width: isMobile ? '100%' : '280px',
    maxWidth: isMobile ? '280px' : '280px',
    backgroundColor: colors.sidebar.bg,
    color: colors.sidebar.text,
    display: 'flex',
    flexDirection: 'column',
    padding: spacing.lg,
    position: 'fixed',
    height: '100vh',
    left: isMobile ? (isMobileMenuOpen ? '0' : '-100%') : '0',
    top: '0',
    boxShadow: shadows.lg,
    zIndex: 1001,
    transition: `left ${transitions.normal}`,
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    display: isMobile && isMobileMenuOpen ? 'block' : 'none',
    transition: `opacity ${transitions.normal}`,
  };

  const headerStyle: React.CSSProperties = {
    display: isMobile ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.sidebar.bg,
    boxShadow: shadows.md,
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    zIndex: 999,
  };

  const menuButtonStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: spacing.sm,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  };

  const menuBarStyle: React.CSSProperties = {
    width: '24px',
    height: '2px',
    backgroundColor: colors.sidebar.text,
    borderRadius: '2px',
    transition: `all ${transitions.normal}`,
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
    ...(isMobile ? { marginTop: spacing.md } : {}),
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

  const notificationBadgeStyle: React.CSSProperties = {
    minWidth: '20px',
    height: '20px',
    padding: `0 ${spacing.xs}`,
    backgroundColor: totalNotificationsCount > 0 ? colors.error : colors.gray400,
    color: colors.white,
    borderRadius: borderRadius.full,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
    transition: `all ${transitions.fast}`,
  };

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
    flexShrink: 0,
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
    marginLeft: isMobile ? '0' : '280px',
    width: isMobile ? '100%' : 'calc(100% - 280px)',
    padding: isMobile ? spacing.md : spacing.xl,
    paddingTop: isMobile ? '70px' : spacing.xl,
    minHeight: '100vh',
    boxSizing: 'border-box',
  };

  return (
    <div style={containerStyle}>
      {/* Toast-уведомления - видны на всех страницах */}
      <ToastContainer />

      {isMobile && (
        <div 
          style={overlayStyle} 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {isMobile && (
        <header style={headerStyle}>
          <button 
            style={menuButtonStyle}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Меню"
          >
            <span style={menuBarStyle} />
            <span style={menuBarStyle} />
            <span style={menuBarStyle} />
          </button>
          <h2 style={{ ...logoTextStyle, margin: 0, fontSize: typography.fontSize.lg }}>
            TimeWeb
          </h2>
          <div style={{ width: '40px' }} />
        </header>
      )}

      <aside style={sidebarStyle}>
        {!isMobile && (
          <div style={logoStyle}>
            <div>
              <h2 style={logoTextStyle}>TimeWeb</h2>
            </div>
          </div>
        )}

        <nav style={navStyle}>
           <Link to="/notifications" style={navItemStyle('/notifications')} onClick={handleNavClick}>
            <span>Новости по встречам</span>
            {/* Общий суммарный счетчик всех уведомлений */}
            <span style={notificationBadgeStyle}>
              {totalNotificationsCount > 99 ? '99+' : totalNotificationsCount}
            </span>
          </Link>
           <Link to="/events" style={navItemStyle('/events')} onClick={handleNavClick}>
            <span>Календарь встреч</span>
            {/* Счетчик встреч на текущий месяц */}
            <span style={notificationBadgeStyle}>
              {eventsCountForMonth > 99 ? '99+' : eventsCountForMonth}
            </span>
          </Link>
          <Link to="/cabinet" style={navItemStyle('/cabinet')} onClick={handleNavClick}>
            Личный кабинет
          </Link>   
          <Link to="/friends" style={navItemStyle('/friends')} onClick={handleNavClick}>
            Друзья
          </Link>
        </nav>

        <div style={userProfileStyle}>
          <div style={userInfoStyle}>
            <div style={avatarStyle}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ ...userNameStyle, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name}
              </div>
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

export default LayoutPage;
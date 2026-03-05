import React, { useState, useEffect } from 'react';
import { useCabinet } from '../context/CabinetContext';
import { theme } from '../styles/theme';
import type { SessionDto } from '../api/users/UsersContracts';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidEmail = (email: string): boolean => {
  if (!email || email.trim() === '') return false;
  return emailRegex.test(email.trim());
};

type SectionType = 'profile' | 'security' | 'activity';

export const CabinetPage = () => {
  const { userData, isLoading, updateUserData, getUserSessions, currentLoginId } = useCabinet();
  const { colors, typography, spacing, borderRadius, shadows, transitions } = theme;
  
  const [activeSection, setActiveSection] = useState<SectionType>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    birthDate: '',
    gender: '',
  });
  const [emailError, setEmailError] = useState<string>('');
  const [isEmailTouched, setIsEmailTouched] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Session state
  const [sessions, setSessions] = useState<SessionDto[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [totalSessions, setTotalSessions] = useState(0);
  const [terminatingSessionId, setTerminatingSessionId] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Mock data for security section
  const [securityData] = useState({
    passwordLastChanged: '2025-11-15',
    twoFactorEnabled: false,
    loginNotifications: true,
  });

  useEffect(() => {
    if (userData) {
      setFormData({
        email: userData.email || '',
        birthDate: userData.birthDate || '',
        gender: userData.gender || '',
      });
      setEmailError('');
      setIsEmailTouched(false);
    }
  }, [userData]);

  useEffect(() => {
    if (isEmailTouched && formData.email) {
      if (!isValidEmail(formData.email)) {
        setEmailError('Введите корректный email адрес');
      } else {
        setEmailError('');
      }
    } else {
      setEmailError('');
    }
  }, [formData.email, isEmailTouched]);

  // Load sessions when activity section is active or page changes
  useEffect(() => {
    if (activeSection === 'activity') {
      loadSessions(currentPage);
    }
  }, [activeSection, currentPage]);

  const loadSessions = async (page: number = 1) => {
    setSessionsLoading(true);
    setSessionsError(null);
    try {
      const response = await getUserSessions(pageSize, page, false);
      setSessions(response.logins || []);
      setTotalSessions(response.totalCount || 0);
    } catch (err) {
      console.error('Failed to load sessions:', err);
      setSessionsError('Не удалось загрузить данные о сессиях');
    } finally {
      setSessionsLoading(false);
    }
  };

  const terminateSession = async (sessionId: string) => {
    setTerminatingSessionId(sessionId);
    try {
      // TODO: Реальная логика удаления сессии по ID появится в будущем
      // await api.terminateSession(sessionId);
      
      // Пока просто удаляем из локального состояния для демонстрации
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      setTotalSessions(prev => prev - 1);
    } catch (err) {
      console.error('Failed to terminate session:', err);
      setSessionsError('Не удалось завершить сеанс');
    } finally {
      setTerminatingSessionId(null);
    }
  };

  const terminateAllSessions = async () => {
    try {
      // TODO: Реальная логика завершения всех сессий
      setSessions([]);
      setTotalSessions(0);
    } catch (err) {
      console.error('Failed to terminate all sessions:', err);
      setSessionsError('Не удалось завершить все сеансы');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleEditClick = () => {
    if (userData) {
      setFormData({
        email: userData.email || '',
        birthDate: userData.birthDate || '',
        gender: userData.gender || '',
      });
    }
    setIsEditing(true);
    setEmailError('');
    setIsEmailTouched(false);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    if (userData) {
      setFormData({
        email: userData.email || '',
        birthDate: userData.birthDate || '',
        gender: userData.gender || '',
      });
    }
    setEmailError('');
    setIsEmailTouched(false);
  };

  const handleSaveClick = async () => {
    if (!isValidEmail(formData.email)) {
      setEmailError('Введите корректный email адрес');
      setIsEmailTouched(true);
      return;
    }
    setIsSaving(true);
    try {
      await updateUserData(formData);
      setIsEditing(false);
      setEmailError('');
      setIsEmailTouched(false);
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'email' && !isEmailTouched) {
      setIsEmailTouched(true);
    }
  };

  const handleEmailBlur = () => {
    setIsEmailTouched(true);
    if (formData.email && !isValidEmail(formData.email)) {
      setEmailError('Введите корректный email адрес');
    }
  };

  const isSaveDisabled = isEditing && (!isValidEmail(formData.email) || emailError !== '');

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = () => {
    return colors.primary;
  };

  const getBrowserInfo = (userAgent: string) => {
    if (!userAgent) return { browser: 'Неизвестно', os: 'Неизвестно' };
    let browser = 'Неизвестно';
    let os = 'Неизвестно';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    else if (userAgent.includes('Opera')) browser = 'Opera';

    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';
    return { browser, os };
  };

  // ИСПРАВЛЕННАЯ ЛОГИКА: Проверка isLogout и expiresAt
  const isSessionActive = (session: SessionDto): boolean => {
    // Сессия активна если:
    // 1. isLogout === false (пользователь не вышел)
    // 2. expiresAt либо отсутствует, либо ещё не наступил
    if (session.isLogut === true) {
      return false;
    }
    
    if (session.expiresAt) {
      const expiresAt = new Date(session.expiresAt);
      const now = new Date();
      if (expiresAt <= now) {
        return false;
      }
    }
    
    return true;
  };

  // Определение текущей сессии по loginId из токена
  const isCurrentSession = (session: SessionDto): boolean => {
    return currentLoginId !== null && session.id === currentLoginId;
  };

  // Pagination Helpers
  const totalPages = Math.ceil(totalSessions / pageSize);
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // ==================== STYLES ====================
  const containerStyle: React.CSSProperties = {
    minHeight: '100%',
    padding: 0,
  };
  const pageHeaderStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottom: `1px solid ${colors.gray200}`,
  };
  const pageTitleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.gray900,
  };
  const pageDescriptionStyle: React.CSSProperties = {
    margin: `${spacing.xs} 0 0 0`,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
  };
  const layoutStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '280px 1fr',
    gap: spacing.xl,
  };
  const sidebarStyle: React.CSSProperties = {
    position: 'sticky' as const,
    top: spacing.xl,
    height: 'fit-content',
  };
  const profileCardStyle: React.CSSProperties = {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    boxShadow: shadows.sm,
    border: `1px solid ${colors.gray200}`,
    padding: spacing.xl,
    textAlign: 'center' as const,
  };
  const avatarStyle: React.CSSProperties = {
    width: '80px',
    height: '80px',
    borderRadius: borderRadius.full,
    backgroundColor: getAvatarColor(),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.xl,
    margin: '0 auto',
    marginBottom: spacing.md,
  };
  const profileNameStyle: React.CSSProperties = {
    margin: 0,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray900,
  };
  const profileEmailStyle: React.CSSProperties = {
    margin: `${spacing.xs} 0 0 0`,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
  };
  const profileMetaStyle: React.CSSProperties = {
    margin: `${spacing.md} 0 0 0`,
    paddingTop: spacing.md,
    borderTop: `1px solid ${colors.gray200}`,
  };
  const profileMetaItemStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${spacing.sm} 0`,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
  };
  const navMenuStyle: React.CSSProperties = {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    boxShadow: shadows.sm,
    border: `1px solid ${colors.gray200}`,
    padding: spacing.md,
    marginTop: spacing.lg,
  };
  const getNavMenuItemStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.sm} ${spacing.md}`,
    borderRadius: borderRadius.md,
    cursor: 'pointer',
    fontSize: typography.fontSize.sm,
    fontWeight: isActive ? typography.fontWeight.semibold : typography.fontWeight.normal,
    color: isActive ? colors.primary : colors.gray600,
    backgroundColor: isActive ? colors.gray50 : 'transparent',
    transition: `all ${transitions.fast}`,
    border: 'none',
    width: '100%',
    textAlign: 'left' as const,
    marginBottom: spacing.xs,
  });
  const contentAreaStyle: React.CSSProperties = {
    minWidth: 0,
  };
  const sectionCardStyle: React.CSSProperties = {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    boxShadow: shadows.sm,
    border: `1px solid ${colors.gray200}`,
    overflow: 'hidden',
  };
  const sectionHeaderStyle: React.CSSProperties = {
    padding: `${spacing.lg} ${spacing.xl}`,
    borderBottom: `1px solid ${colors.gray200}`,
    backgroundColor: colors.gray50,
  };
  const sectionTitleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray900,
  };
  const sectionDescriptionStyle: React.CSSProperties = {
    margin: `${spacing.xs} 0 0 0`,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
  };
  const sectionBodyStyle: React.CSSProperties = {
    padding: spacing.xl,
  };
  const infoGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: spacing.lg,
  };
  const infoItemStyle: React.CSSProperties = {
    marginBottom: 0,
  };
  const infoLabelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    marginBottom: spacing.xs,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    fontWeight: typography.fontWeight.semibold,
  };
  const fieldValueStyle: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray900,
    padding: `${spacing.sm} ${spacing.md}`,
    borderRadius: borderRadius.md,
    border: `1px solid ${colors.gray300}`,
    minHeight: '44px',
    display: 'flex',
    alignItems: 'center',
    boxSizing: 'border-box',
    width: '100%',
    margin: 0,
    lineHeight: 1.5,
    fontFamily: typography.fontFamily,
    backgroundColor: colors.white,
    transition: `all ${transitions.fast}`,
  };
  const fieldInputStyle: React.CSSProperties = {
    ...fieldValueStyle,
    cursor: 'text',
    outline: 'none',
  };
  const fieldErrorStyle: React.CSSProperties = {
    ...fieldInputStyle,
    borderColor: colors.error,
    backgroundColor: colors.errorLight,
  };
  const fieldDisabledStyle: React.CSSProperties = {
    ...fieldValueStyle,
    backgroundColor: colors.gray50,
    color: colors.gray500,
  };
  const selectStyle: React.CSSProperties = {
    ...fieldInputStyle,
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${colors.gray500}' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
  };
  const errorTextStyle: React.CSSProperties = {
    fontSize: typography.fontSize.xs,
    color: colors.error,
    marginTop: spacing.xs,
  };
  const buttonGroupStyle: React.CSSProperties = {
    display: 'flex',
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTop: `1px solid ${colors.gray200}`,
  };
  const buttonPrimaryStyle: React.CSSProperties = {
    padding: `${spacing.sm} ${spacing.lg}`,
    fontSize: typography.fontSize.sm,
    backgroundColor: colors.primary,
    color: colors.white,
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: 'pointer',
    fontWeight: typography.fontWeight.medium,
    transition: `all ${transitions.normal}`,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
  };
  const buttonDisabledStyle: React.CSSProperties = {
    ...buttonPrimaryStyle,
    backgroundColor: colors.gray300,
    cursor: 'not-allowed',
    opacity: 0.6,
  };
  const buttonSecondaryStyle: React.CSSProperties = {
    padding: `${spacing.sm} ${spacing.lg}`,
    fontSize: typography.fontSize.sm,
    backgroundColor: 'transparent',
    color: colors.gray700,
    border: `1px solid ${colors.gray300}`,
    borderRadius: borderRadius.md,
    cursor: 'pointer',
    fontWeight: typography.fontWeight.medium,
    transition: `all ${transitions.normal}`,
  };
  const buttonDangerStyle: React.CSSProperties = {
    padding: `${spacing.sm} ${spacing.lg}`,
    fontSize: typography.fontSize.sm,
    backgroundColor: colors.error,
    color: colors.white,
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: 'pointer',
    fontWeight: typography.fontWeight.medium,
    transition: `all ${transitions.normal}`,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
  };
  const statsGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: spacing.md,
    marginBottom: spacing.xl,
  };
  const statCardStyle: React.CSSProperties = {
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    border: `1px solid ${colors.gray200}`,
  };
  const statValueStyle: React.CSSProperties = {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    margin: 0,
  };
  const statLabelStyle: React.CSSProperties = {
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    marginTop: spacing.xs,
    margin: 0,
  };
  const securityItemStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${spacing.md} 0`,
    borderBottom: `1px solid ${colors.gray100}`,
  };
  const securityItemInfoStyle: React.CSSProperties = {
    flex: 1,
  };
  const securityItemTitleStyle: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray900,
    margin: 0,
  };
  const securityItemDescriptionStyle: React.CSSProperties = {
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    marginTop: spacing.xs,
    margin: 0,
  };
  const statusBadgeStyle = (active: boolean): React.CSSProperties => ({
    padding: `${spacing.xs} ${spacing.sm}`,
    borderRadius: borderRadius.full,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    backgroundColor: active ? colors.successLight : colors.gray200,
    color: active ? colors.successDark : colors.gray600,
  });
  const currentSessionBadgeStyle: React.CSSProperties = {
    padding: `${spacing.xs} ${spacing.sm}`,
    borderRadius: borderRadius.full,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    backgroundColor: colors.primaryLight,
    color: colors.primaryDark,
    marginLeft: spacing.xs,
  };
  const emptyStateStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: `${spacing['2xl']} ${spacing.xl}`,
    color: colors.gray500,
    fontSize: typography.fontSize.sm,
  };
  // Session table styles
  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse' as const,
    marginTop: spacing.lg,
  };
  const tableHeaderStyle: React.CSSProperties = {
    backgroundColor: colors.gray50,
    borderBottom: `2px solid ${colors.gray200}`,
  };
  const tableHeaderCellStyle: React.CSSProperties = {
    padding: `${spacing.sm} ${spacing.md}`,
    textAlign: 'left' as const,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  };
  const tableRowStyle: React.CSSProperties = {
    borderBottom: `1px solid ${colors.gray100}`,
    transition: `background-color ${transitions.fast}`,
  };
  const tableCellStyle: React.CSSProperties = {
    padding: `${spacing.md}`,
    fontSize: typography.fontSize.sm,
    color: colors.gray700,
    verticalAlign: 'middle',
  };
  const sessionInfoStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.xs,
  };
  const sessionBrowserStyle: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray900,
  };
  const sessionMetaStyle: React.CSSProperties = {
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
  };
  const sessionIpStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: typography.fontSize.xs,
    color: colors.gray600,
    backgroundColor: colors.gray100,
    padding: `${spacing.xs} ${spacing.sm}`,
    borderRadius: borderRadius.sm,
    display: 'inline-block',
  };
  
  // Pagination Styles
  const paginationStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTop: `1px solid ${colors.gray200}`,
  };
  const paginationInfoStyle: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
  };
  const paginationButtonsStyle: React.CSSProperties = {
    display: 'flex',
    gap: spacing.sm,
  };

  return (
    <div style={containerStyle}>
      <div style={pageHeaderStyle}>
        <div>
          <h1 style={pageTitleStyle}>Личный кабинет</h1>
          <p style={pageDescriptionStyle}>
            Управление профилем и настройками аккаунта
          </p>
        </div>
      </div>
      <div style={layoutStyle}>
        {/* Sidebar */}
        <aside style={sidebarStyle}>
          <div style={profileCardStyle}>
            <div style={avatarStyle}>
              {getInitials(userData?.name || '')}
            </div>
            <h3 style={profileNameStyle}>
              {userData?.name || 'Пользователь'}
            </h3>
            <p style={profileEmailStyle}>
              {userData?.email || 'Email не указан'}
            </p>
            <div style={profileMetaStyle}>
              <div style={profileMetaItemStyle}>
                <span>На сайте с</span>
                <span>{formatDate(userData?.registrationDate || '')}</span>
              </div>
            </div>
          </div>
          <nav style={navMenuStyle}>
            <button
              style={getNavMenuItemStyle(activeSection === 'profile')}
              onClick={() => setActiveSection('profile')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Данные
            </button>
            <button
              style={getNavMenuItemStyle(activeSection === 'security')}
              onClick={() => setActiveSection('security')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Безопасность
            </button>
            <button
              style={getNavMenuItemStyle(activeSection === 'activity')}
              onClick={() => setActiveSection('activity')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              Активность
            </button>
          </nav>
        </aside>
        {/* Main Content */}
        <main style={contentAreaStyle}>
          {isLoading ? (
            <div style={sectionCardStyle}>
              <div style={emptyStateStyle}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={colors.gray300} strokeWidth="2" style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }}>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
                <p style={{ marginTop: spacing.md }}>Загрузка...</p>
              </div>
            </div>
          ) : activeSection === 'profile' ? (
            <div style={sectionCardStyle}>
              <div style={sectionHeaderStyle}>
                <h2 style={sectionTitleStyle}>Данные</h2>
                <p style={sectionDescriptionStyle}>
                  Основная информация о вашем аккаунте
                </p>
              </div>
              <div style={sectionBodyStyle}>
                <div style={infoGridStyle}>
                  <div style={infoItemStyle}>
                    <label style={infoLabelStyle}>Имя пользователя</label>
                    <div style={fieldDisabledStyle}>
                      {userData?.name || 'Не указано'}
                    </div>
                  </div>
                  <div style={infoItemStyle}>
                    <label style={infoLabelStyle}>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={isEditing ? formData.email : (userData?.email || 'Не указан')}
                      onChange={handleInputChange}
                      onBlur={handleEmailBlur}
                      readOnly={!isEditing}
                      placeholder="example@mail.com"
                      style={isEditing && emailError ? fieldErrorStyle : isEditing ? fieldInputStyle : fieldDisabledStyle}
                      onFocus={(e) => {
                        e.currentTarget.style.outline = 'none';
                        e.currentTarget.style.borderColor = emailError ? colors.error : colors.primary;
                      }}
                      disabled={!isEditing}
                    />
                    {isEditing && emailError && (
                      <div style={errorTextStyle}>{emailError}</div>
                    )}
                  </div>
                  <div style={infoItemStyle}>
                    <label style={infoLabelStyle}>Дата рождения</label>
                    {isEditing ? (
                      <input
                        type="date"
                        name="birthDate"
                        value={formData.birthDate}
                        onChange={handleInputChange}
                        style={fieldInputStyle}
                        onFocus={(e) => {
                          e.currentTarget.style.outline = 'none';
                          e.currentTarget.style.borderColor = colors.primary;
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = colors.gray300;
                        }}
                      />
                    ) : (
                      <div style={fieldDisabledStyle}>
                        {formatDate(userData?.birthDate || '')}
                      </div>
                    )}
                  </div>
                  <div style={infoItemStyle}>
                    <label style={infoLabelStyle}>Пол</label>
                    {isEditing ? (
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        style={selectStyle}
                        onFocus={(e) => {
                          e.currentTarget.style.outline = 'none';
                          e.currentTarget.style.borderColor = colors.primary;
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = colors.gray300;
                        }}
                      >
                        <option value="">Не указан</option>
                        <option value="male">Мужской</option>
                        <option value="female">Женский</option>
                      </select>
                    ) : (
                      <div style={fieldDisabledStyle}>
                        {userData?.gender === 'male' ? 'Мужской' :
                          userData?.gender === 'female' ? 'Женский' : 'Не указан'}
                      </div>
                    )}
                  </div>
                </div>
                <div style={buttonGroupStyle}>
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSaveClick}
                        disabled={isSaveDisabled || isSaving}
                        style={isSaveDisabled || isSaving ? buttonDisabledStyle : buttonPrimaryStyle}
                      >
                        {isSaving ? 'Сохранение...' : 'Сохранить'}
                      </button>
                      <button
                        onClick={handleCancelClick}
                        style={buttonSecondaryStyle}
                      >
                        Отмена
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleEditClick}
                      style={buttonPrimaryStyle}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Редактировать
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : activeSection === 'security' ? (
            <div style={sectionCardStyle}>
              <div style={sectionHeaderStyle}>
                <h2 style={sectionTitleStyle}>Безопасность</h2>
                <p style={sectionDescriptionStyle}>
                  Настройки безопасности вашего аккаунта
                </p>
              </div>
              <div style={sectionBodyStyle}>
                <div style={securityItemStyle}>
                  <div style={securityItemInfoStyle}>
                    <h4 style={securityItemTitleStyle}>Пароль</h4>
                    <p style={securityItemDescriptionStyle}>
                      Последний раз изменён {formatDate(securityData.passwordLastChanged)}
                    </p>
                  </div>
                  <button style={buttonSecondaryStyle}>
                    Изменить
                  </button>
                </div>
                <div style={securityItemStyle}>
                  <div style={securityItemInfoStyle}>
                    <h4 style={securityItemTitleStyle}>Уведомления о входе</h4>
                    <p style={securityItemDescriptionStyle}>
                      Получать уведомления при новых входах в аккаунт
                    </p>
                  </div>
                  <span style={statusBadgeStyle(securityData.loginNotifications)}>
                    {securityData.loginNotifications ? 'Включено' : 'Отключено'}
                  </span>
                </div>
                <div style={{ marginTop: spacing.xl, paddingTop: spacing.lg, borderTop: `1px solid ${colors.gray200}` }}>
                  <button
                    onClick={terminateAllSessions}
                    style={buttonDangerStyle}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    Завершить все сеансы
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={sectionCardStyle}>
              <div style={sectionHeaderStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={sectionTitleStyle}>Активность</h2>
                    <p style={sectionDescriptionStyle}>
                      История входов и активные сеансы
                    </p>
                  </div>
                  <button
                    onClick={() => loadSessions(currentPage)}
                    style={buttonSecondaryStyle}
                    disabled={sessionsLoading}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: spacing.xs }}>
                      <path d="M23 4v6h-6" />
                      <path d="M1 20v-6h6" />
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                    Обновить
                  </button>
                </div>
              </div>
              <div style={sectionBodyStyle}>
                {/* Stats */}
                <div style={statsGridStyle}>
                  <div style={statCardStyle}>
                    <p style={statValueStyle}>{sessions.filter(s => isSessionActive(s)).length}</p>
                    <p style={statLabelStyle}>Активных сеансов</p>
                  </div>
                  <div style={statCardStyle}>
                    <p style={{ ...statValueStyle, fontSize: typography.fontSize.lg }}>
                      {sessions.length > 0 ? formatDateTime(sessions[0].loginAt) : '—'}
                    </p>
                    <p style={statLabelStyle}>Последний вход</p>
                  </div>
                </div>
                {/* Sessions Table */}
                <div style={{ marginTop: spacing.xl }}>
                  {sessionsLoading ? (
                    <div style={emptyStateStyle}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={colors.gray300} strokeWidth="2" style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }}>
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 2a10 10 0 0 1 10 10" />
                      </svg>
                      <p style={{ marginTop: spacing.md }}>Загрузка сеансов...</p>
                    </div>
                  ) : sessionsError ? (
                    <div style={{ ...emptyStateStyle, color: colors.error }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={colors.error} strokeWidth="2" style={{ margin: '0 auto' }}>
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v4M12 16h.01" />
                      </svg>
                      <p style={{ marginTop: spacing.md }}>{sessionsError}</p>
                      <button
                        onClick={() => loadSessions(currentPage)}
                        style={{ ...buttonPrimaryStyle, marginTop: spacing.md }}
                      >
                        Попробовать снова
                      </button>
                    </div>
                  ) : sessions.length === 0 ? (
                    <div style={emptyStateStyle}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={colors.gray300} strokeWidth="2" style={{ margin: '0 auto' }}>
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      <p style={{ marginTop: spacing.md }}>Нет активных сеансов</p>
                    </div>
                  ) : (
                    <>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={tableStyle}>
                          <thead>
                            <tr style={tableHeaderStyle}>
                              <th style={tableHeaderCellStyle}>Устройство</th>
                              <th style={tableHeaderCellStyle}>Вход</th>
                              <th style={tableHeaderCellStyle}>Действия</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sessions.map((session) => {
                              const { browser, os } = getBrowserInfo(session.userAgent);
                              const isActive = isSessionActive(session);
                              const isCurrent = isCurrentSession(session);
                              return (
                                <tr
                                  key={session.id}
                                  style={{
                                    ...tableRowStyle,
                                    backgroundColor: isCurrent ? colors.successLight : undefined,
                                  }}
                                >
                                  <td style={tableCellStyle}>
                                    <div style={sessionInfoStyle}>
                                      <span style={sessionBrowserStyle}>
                                        {browser}
                                      </span>
                                      <span style={sessionMetaStyle}>
                                        {os}
                                      </span>
                                    </div>
                                  </td>
                                  <td style={tableCellStyle}>
                                    {formatDateTime(session.loginAt)}
                                  </td>
                                  <td style={tableCellStyle}>
                                    {/* Кнопка действия отображается для всех сессий */}
                                    <button
                                      onClick={() => terminateSession(session.id)}
                                      disabled={terminatingSessionId === session.id || !isActive}
                                      style={{
                                        ...buttonSecondaryStyle,
                                        padding: `${spacing.xs} ${spacing.sm}`,
                                        fontSize: typography.fontSize.xs,
                                        opacity: (terminatingSessionId === session.id || !isActive) ? 0.6 : 1,
                                        cursor: (terminatingSessionId === session.id || !isActive) ? 'not-allowed' : 'pointer',
                                      }}
                                      title={!isActive ? "Сеанс уже завершен" : "Завершить сеанс"}
                                    >
                                      {terminatingSessionId === session.id ? '...' : 'Завершить'}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div style={paginationStyle}>
                          <div style={paginationInfoStyle}>
                            Страница {currentPage} из {totalPages}
                          </div>
                          <div style={paginationButtonsStyle}>
                            <button
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={!canGoPrev}
                              style={!canGoPrev ? buttonDisabledStyle : buttonSecondaryStyle}
                            >
                              Назад
                            </button>
                            <button
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={!canGoNext}
                              style={!canGoNext ? buttonDisabledStyle : buttonSecondaryStyle}
                            >
                              Вперед
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        button:focus {
          outline: none !important;
        }
        input[type="date"]::-webkit-calendar-picker-indicator {
          cursor: pointer;
        }
        table tbody tr:hover {
          background-color: ${colors.gray50};
        }
      `}</style>
    </div>
  );
};
export default CabinetPage;
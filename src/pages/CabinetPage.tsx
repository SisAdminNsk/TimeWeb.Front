import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCabinet } from '../context/CabinetContext';
import { theme } from '../styles/theme';
import type { SessionDto } from '../api/users/UsersContracts';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidEmail = (email: string): boolean => {
  if (!email || email.trim() === '') return false;
  return emailRegex.test(email.trim());
};

type SectionType = 'profile' | 'security' | 'activity';

interface TerminateModalState {
  isOpen: boolean;
  sessionId: string | null;
  sessionInfo: { userAgent: string; loginAt: string } | null;
}

interface TerminateAllModalState {
  isOpen: boolean;
}

interface ChangePasswordModalState {
  isOpen: boolean;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  currentPasswordError: string;
  newPasswordError: string;
  confirmPasswordError: string;
  generalError: string;
}

export const CabinetPage = () => {
  const {
    userData,
    isLoading,
    updateUserData,
    getUserSessions,
    currentLoginId,
    terminateSession,
    changePassword,
  } = useCabinet();
  const navigate = useNavigate();
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
  const [sessions, setSessions] = useState<SessionDto[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [totalSessions, setTotalSessions] = useState(0);
  const [terminatingSessionId, setTerminatingSessionId] = useState<string | null>(null);
  const [terminateModal, setTerminateModal] = useState<TerminateModalState>({
    isOpen: false,
    sessionId: null,
    sessionInfo: null,
  });
  const [terminateAllModal, setTerminateAllModal] = useState<TerminateAllModalState>({
    isOpen: false,
  });
  const [changePasswordModal, setChangePasswordModal] = useState<ChangePasswordModalState>({
    isOpen: false,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    currentPasswordError: '',
    newPasswordError: '',
    confirmPasswordError: '',
    generalError: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
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

  const handleTerminateClick = (session: SessionDto) => {
    setTerminateModal({
      isOpen: true,
      sessionId: session.id,
      sessionInfo: {
        loginAt: session.loginAt,
        userAgent: session.userAgent,
      },
    });
  };

  const handleTerminateCancel = () => {
    setTerminateModal({
      isOpen: false,
      sessionId: null,
      sessionInfo: null,
    });
  };

  const handleTerminateConfirm = async () => {
    if (!terminateModal.sessionId) return;
    setTerminatingSessionId(terminateModal.sessionId);
    try {
      await terminateSession(terminateModal.sessionId);
      setSessions(prev => prev.filter(s => s.id !== terminateModal.sessionId));
      setTotalSessions(prev => Math.max(0, prev - 1));
      handleTerminateCancel();
    } catch (err) {
      console.error('Failed to terminate session:', err);
      setSessionsError('Не удалось завершить сеанс');
    } finally {
      setTerminatingSessionId(null);
    }
  };

  const handleTerminateAllClick = () => {
    setTerminateAllModal({ isOpen: true });
  };

  const handleTerminateAllCancel = () => {
    setTerminateAllModal({ isOpen: false });
  };

  const terminateAllSessions = async () => {
    setTerminateAllModal({ isOpen: false });
    try {
      const sessionsToTerminate = [...sessions];
      const currentSession = sessionsToTerminate.find(s => s.id === currentLoginId);
      const otherSessions = sessionsToTerminate.filter(s => s.id !== currentLoginId);
      for (const session of otherSessions) {
        try {
          await terminateSession(session.id);
        } catch (err) {
          console.error(`Failed to terminate session ${session.id}:`, err);
        }
      }
      if (currentSession) {
        try {
          await terminateSession(currentSession.id);
        } catch (err) {
          console.error(`Failed to terminate current session ${currentSession.id}:`, err);
          throw err;
        }
      }
      setSessions([]);
      setTotalSessions(0);
      setSessionsError(null);
      navigate('/sign-in', {
        state: { message: 'Все сеансы завершены. Войдите снова.' },
      });
    } catch (err) {
      console.error('Failed to terminate all sessions:', err);
      setSessionsError('Не удалось завершить все сеансы');
      loadSessions(currentPage);
    }
  };

  const handleChangePasswordClick = () => {
    setChangePasswordModal({
      isOpen: true,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      currentPasswordError: '',
      newPasswordError: '',
      confirmPasswordError: '',
      generalError: '',
    });
  };

  const handlePasswordModalCancel = () => {
    setChangePasswordModal({
      isOpen: false,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      currentPasswordError: '',
      newPasswordError: '',
      confirmPasswordError: '',
      generalError: '',
    });
  };

  const validatePassword = (password: string): string => {
    if (!password) return '';
    if (password.length < 8) {
      return 'Минимум 8 символов';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Должна быть заглавная буква';
    }
    if (!/[a-z]/.test(password)) {
      return 'Должна быть строчная буква';
    }
    if (!/[0-9]/.test(password)) {
      return 'Должна быть цифра';
    }
    return '';
  };

  const handlePasswordChange = (
    field: 'currentPassword' | 'newPassword' | 'confirmPassword',
    value: string
  ) => {
    setChangePasswordModal(prev => {
      const updates: Partial<ChangePasswordModalState> = { [field]: value };

      if (field === 'newPassword') {
        updates.newPasswordError = validatePassword(value);
        if (prev.confirmPassword && value !== prev.confirmPassword) {
          updates.confirmPasswordError = 'Пароли не совпадают';
        } else if (prev.confirmPassword) {
          updates.confirmPasswordError = '';
        }
      }

      if (field === 'confirmPassword') {
        if (value !== prev.newPassword) {
          updates.confirmPasswordError = 'Пароли не совпадают';
        } else {
          updates.confirmPasswordError = '';
        }
      }

      return { ...prev, ...updates } as ChangePasswordModalState;
    });
  };

  const handlePasswordSubmit = async () => {
    const { currentPassword, newPassword, confirmPassword } = changePasswordModal;

    const errors: Partial<ChangePasswordModalState> = {
      currentPasswordError: '',
      newPasswordError: '',
      confirmPasswordError: '',
      generalError: '',
    };

    if (!currentPassword) {
      errors.currentPasswordError = 'Введите текущий пароль';
    }

    if (!newPassword) {
      errors.newPasswordError = 'Введите новый пароль';
    } else {
      const passwordValidation = validatePassword(newPassword);
      if (passwordValidation) {
        errors.newPasswordError = passwordValidation;
      }
    }

    if (!confirmPassword) {
      errors.confirmPasswordError = 'Подтвердите новый пароль';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPasswordError = 'Пароли не совпадают';
    }

    if (errors.currentPasswordError || errors.newPasswordError || errors.confirmPasswordError) {
      setChangePasswordModal(prev => ({ ...prev, ...errors } as ChangePasswordModalState));
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword, confirmPassword);
      handlePasswordModalCancel();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Не удалось сменить пароль';
      setChangePasswordModal(prev => ({ ...prev, generalError: errorMessage } as ChangePasswordModalState));
    } finally {
      setIsChangingPassword(false);
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

  const isSessionActive = (session: SessionDto): boolean => {
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

  const isCurrentSession = (session: SessionDto): boolean => {
    return currentLoginId !== null && session.id === currentLoginId;
  };

  const totalPages = Math.ceil(totalSessions / pageSize);
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

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

  const getTerminateButtonStyle = (disabled: boolean): React.CSSProperties => ({
    padding: `${spacing.xs} ${spacing.sm}`,
    fontSize: typography.fontSize.xs,
    backgroundColor: disabled ? colors.gray200 : colors.error,
    color: disabled ? colors.gray400 : colors.white,
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: typography.fontWeight.medium,
    transition: `all ${transitions.fast}`,
    opacity: disabled ? 0.6 : 1,
    outline: 'none',
  });

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

  const emptyStateStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: `${spacing['2xl']} ${spacing.xl}`,
    color: colors.gray500,
    fontSize: typography.fontSize.sm,
  };

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

  const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed',
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
  };

  const modalContentStyle: React.CSSProperties = {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    boxShadow: shadows.xl,
    padding: spacing.xl,
    maxWidth: '420px',
    width: '90%',
    animation: 'slideIn 0.2s ease',
  };

  const modalHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  };

  const modalIconStyle: React.CSSProperties = {
    width: '48px',
    height: '48px',
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.full,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  const modalIconSvgStyle: React.CSSProperties = {
    width: '24px',
    height: '24px',
    color: colors.error,
  };

  const modalIconSuccessStyle: React.CSSProperties = {
    width: '48px',
    height: '48px',
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.full,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  const modalIconSuccessSvgStyle: React.CSSProperties = {
    width: '24px',
    height: '24px',
    color: colors.success,
  };

  const modalTitleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray900,
  };

  const modalMessageStyle: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    marginBottom: spacing.lg,
    lineHeight: 1.6,
  };

  const modalSessionInfoStyle: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray900,
    backgroundColor: colors.gray100,
    padding: `${spacing.sm} ${spacing.md}`,
    borderRadius: borderRadius.md,
    display: 'inline-block',
    marginBottom: spacing.lg,
  };

  const modalActionsStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  };

  const modalButtonCancelStyle: React.CSSProperties = {
    padding: `${spacing.sm} ${spacing.lg}`,
    backgroundColor: colors.white,
    color: colors.gray700,
    border: `1px solid ${colors.gray300}`,
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    cursor: 'pointer',
    transition: `all ${transitions.normal}`,
  };

  const modalButtonDeleteStyle: React.CSSProperties = {
    padding: `${spacing.sm} ${spacing.lg}`,
    backgroundColor: colors.error,
    color: colors.white,
    border: 'none',
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    cursor: 'pointer',
    transition: `all ${transitions.normal}`,
  };

  const modalButtonPrimaryStyle: React.CSSProperties = {
    padding: `${spacing.sm} ${spacing.lg}`,
    backgroundColor: colors.primary,
    color: colors.white,
    border: 'none',
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    cursor: 'pointer',
    transition: `all ${transitions.normal}`,
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
                  <button
                    onClick={handleChangePasswordClick}
                    style={buttonSecondaryStyle}
                  >
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
                    onClick={handleTerminateAllClick}
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
                              const isActive = isSessionActive(session);
                              const isCurrent = isCurrentSession(session);
                              const isDisabled = terminatingSessionId === session.id || !isActive || isCurrent;
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
                                        {session.userAgent}
                                      </span>
                                    </div>
                                  </td>
                                  <td style={tableCellStyle}>
                                    {formatDateTime(session.loginAt)}
                                  </td>
                                  <td style={tableCellStyle}>
                                    <button
                                      onClick={() => handleTerminateClick(session)}
                                      disabled={isDisabled}
                                      style={getTerminateButtonStyle(isDisabled)}
                                      title={!isActive ? "Сеанс уже завершен" : isCurrent ? "Нельзя завершить текущий сеанс" : "Завершить сеанс"}
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
      {/* Termination Confirmation Modal */}
      {terminateModal.isOpen && (
        <div style={modalOverlayStyle} onClick={handleTerminateCancel}>
          <div
            style={modalContentStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={modalHeaderStyle}>
              <div style={modalIconStyle}>
                <svg
                  style={modalIconSvgStyle}
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
              <h3 style={modalTitleStyle}>Завершить сеанс?</h3>
            </div>
            <p style={modalMessageStyle}>
              Вы уверены, что хотите завершить этот сеанс? Пользователь будет вынужден войти в аккаунт снова.
            </p>
            {terminateModal.sessionInfo && (
              <div style={modalSessionInfoStyle}>
                {terminateModal.sessionInfo.userAgent}
                <br />
                <span style={{ fontWeight: typography.fontWeight.normal, color: colors.gray500 }}>
                  Вход: {formatDateTime(terminateModal.sessionInfo.loginAt)}
                </span>
              </div>
            )}
            <div style={modalActionsStyle}>
              <button
                style={modalButtonCancelStyle}
                onClick={handleTerminateCancel}
                disabled={terminatingSessionId !== null}
              >
                Отмена
              </button>
              <button
                style={modalButtonDeleteStyle}
                onClick={handleTerminateConfirm}
                disabled={terminatingSessionId !== null}
              >
                {terminatingSessionId !== null ? 'Завершение...' : 'Завершить'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Terminate All Sessions Confirmation Modal */}
      {terminateAllModal.isOpen && (
        <div style={modalOverlayStyle} onClick={handleTerminateAllCancel}>
          <div
            style={modalContentStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={modalHeaderStyle}>
              <div style={modalIconStyle}>
                <svg
                  style={modalIconSvgStyle}
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
              <h3 style={modalTitleStyle}>Завершить все сеансы?</h3>
            </div>
            <p style={modalMessageStyle}>
              Вы уверены, что хотите завершить все активные сеансы? Вам и всем другим пользователям придётся войти в аккаунт снова.
            </p>
            <div style={modalSessionInfoStyle}>
              Будет завершено сеансов: {sessions.length}
              <br />
              <span style={{ fontWeight: typography.fontWeight.normal, color: colors.gray500 }}>
                Включая текущий сеанс
              </span>
            </div>
            <div style={modalActionsStyle}>
              <button
                style={modalButtonCancelStyle}
                onClick={handleTerminateAllCancel}
              >
                Отмена
              </button>
              <button
                style={modalButtonDeleteStyle}
                onClick={terminateAllSessions}
              >
                Завершить все
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Change Password Modal */}
      {changePasswordModal.isOpen && (
        <div style={modalOverlayStyle} onClick={handlePasswordModalCancel}>
          <div
            style={modalContentStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={modalHeaderStyle}>
              <div style={modalIconSuccessStyle}>
                <svg
                  style={modalIconSuccessSvgStyle}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
              </div>
              <h3 style={modalTitleStyle}>Смена пароля</h3>
            </div>
            {changePasswordModal.generalError && (
              <div style={{
                ...errorTextStyle,
                marginBottom: spacing.md,
                padding: spacing.sm,
                backgroundColor: colors.errorLight,
                borderRadius: borderRadius.md,
              }}>
                {changePasswordModal.generalError}
              </div>
            )}
            <div style={{ marginBottom: spacing.md }}>
              <label style={infoLabelStyle}>Текущий пароль</label>
              <input
                type="password"
                value={changePasswordModal.currentPassword}
                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                placeholder="Введите текущий пароль"
                style={changePasswordModal.currentPasswordError ? fieldErrorStyle : fieldInputStyle}
                disabled={isChangingPassword}
                onFocus={(e) => {
                  e.currentTarget.style.outline = 'none';
                  e.currentTarget.style.borderColor = changePasswordModal.currentPasswordError ? colors.error : colors.primary;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = changePasswordModal.currentPasswordError ? colors.error : colors.gray300;
                }}
              />
              {changePasswordModal.currentPasswordError && (
                <div style={errorTextStyle}>{changePasswordModal.currentPasswordError}</div>
              )}
            </div>
            <div style={{ marginBottom: spacing.md }}>
              <label style={infoLabelStyle}>Новый пароль</label>
              <input
                type="password"
                value={changePasswordModal.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                placeholder="Введите новый пароль"
                style={changePasswordModal.newPasswordError ? fieldErrorStyle : fieldInputStyle}
                disabled={isChangingPassword}
                onFocus={(e) => {
                  e.currentTarget.style.outline = 'none';
                  e.currentTarget.style.borderColor = changePasswordModal.newPasswordError ? colors.error : colors.primary;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = changePasswordModal.newPasswordError ? colors.error : colors.gray300;
                }}
              />
              {changePasswordModal.newPasswordError && (
                <div style={errorTextStyle}>{changePasswordModal.newPasswordError}</div>
              )}
              <div style={{
                fontSize: typography.fontSize.xs,
                color: colors.gray500,
                marginTop: spacing.xs,
              }}>
                Минимум 8 символов, заглавная и строчная буквы, цифра
              </div>
            </div>
            <div style={{ marginBottom: spacing.lg }}>
              <label style={infoLabelStyle}>Подтверждение нового пароля</label>
              <input
                type="password"
                value={changePasswordModal.confirmPassword}
                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                placeholder="Повторите новый пароль"
                style={changePasswordModal.confirmPasswordError ? fieldErrorStyle : fieldInputStyle}
                disabled={isChangingPassword}
                onFocus={(e) => {
                  e.currentTarget.style.outline = 'none';
                  e.currentTarget.style.borderColor = changePasswordModal.confirmPasswordError ? colors.error : colors.primary;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = changePasswordModal.confirmPasswordError ? colors.error : colors.gray300;
                }}
              />
              {changePasswordModal.confirmPasswordError && (
                <div style={errorTextStyle}>{changePasswordModal.confirmPasswordError}</div>
              )}
            </div>
            <div style={modalActionsStyle}>
              <button
                style={modalButtonCancelStyle}
                onClick={handlePasswordModalCancel}
                disabled={isChangingPassword}
              >
                Отмена
              </button>
              <button
                style={modalButtonPrimaryStyle}
                onClick={handlePasswordSubmit}
                disabled={isChangingPassword}
              >
                {isChangingPassword ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
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
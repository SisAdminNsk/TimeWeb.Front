import React, { useState, useEffect } from 'react';
import { useFriends } from '../context/FriendsContext';
import { theme } from '../styles/theme';

type SectionType = 'friends' | 'incoming' | 'outgoing' | 'add';

interface DeleteModalState {
  isOpen: boolean;
  itemId: string | null;
  itemName: string | null;
  actionType: 'removeFriend' | 'declineInvite' | 'declineOutgoing' | null;
}

export const FriendsPage = () => {
  const {
    friends,
    incomingInvites,
    outgoingInvites,
    friendsTotalCount,
    incomingTotalCount,
    outgoingTotalCount,
    friendsPage,
    incomingPage,
    outgoingPage,
    pageSize,
    isLoading,
    error,
    notification,
    sendFriendRequest,
    acceptInvite,
    declineInvite,
    declineOutgoingInvite,
    removeFriend,
    refreshFriends,
    refreshIncomingInvites,
    refreshOutgoingInvites,
    refreshInvites,
    clearError,
    clearNotification,
  } = useFriends();

  const { colors, typography, spacing, borderRadius, shadows, transitions } = theme;

  const [activeSection, setActiveSection] = useState<SectionType>('friends');
  const [usernameInput, setUsernameInput] = useState('');
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);

  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    isOpen: false,
    itemId: null,
    itemName: null,
    actionType: null,
  });

  useEffect(() => {
    refreshFriends(1);
    refreshInvites();
  }, []);

  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [activeSection, isMobile]);

  const friendsTotalPages = Math.ceil(friendsTotalCount / pageSize);
  const incomingTotalPages = Math.ceil(incomingTotalCount / pageSize);
  const outgoingTotalPages = Math.ceil(outgoingTotalCount / pageSize);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;
    try {
      await sendFriendRequest(usernameInput.trim());
      setUsernameInput('');
    } catch {
      // Error handled by context
    }
  };

  const handleAcceptInvite = async (inviteId: string) => {
    try {
      await acceptInvite(inviteId);
    } catch (err) {
      console.error('Failed to accept invite:', err);
    }
  };

  const handleRemoveFriendClick = (friendId: string, friendName: string) => {
    setDeleteModal({
      isOpen: true,
      itemId: friendId,
      itemName: friendName,
      actionType: 'removeFriend',
    });
  };

  const handleDeclineInviteClick = (inviteId: string, inviteName: string) => {
    setDeleteModal({
      isOpen: true,
      itemId: inviteId,
      itemName: inviteName,
      actionType: 'declineInvite',
    });
  };

  const handleDeclineOutgoingInviteClick = (inviteId: string, inviteName: string) => {
    setDeleteModal({
      isOpen: true,
      itemId: inviteId,
      itemName: inviteName,
      actionType: 'declineOutgoing',
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.itemId || !deleteModal.actionType) return;
    try {
      switch (deleteModal.actionType) {
        case 'removeFriend':
          await removeFriend(deleteModal.itemId);
          break;
        case 'declineInvite':
          await declineInvite(deleteModal.itemId);
          break;
        case 'declineOutgoing':
          await declineOutgoingInvite(deleteModal.itemId);
          break;
      }
      setDeleteModal({ isOpen: false, itemId: null, itemName: null, actionType: null });
    } catch (err) {
      console.error('Failed to perform action:', err);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, itemId: null, itemName: null, actionType: null });
  };

  const handleRefreshAll = async () => {
    setIsRefreshingAll(true);
    try {
      await Promise.all([
        refreshFriends(friendsPage),
        refreshIncomingInvites(incomingPage),
        refreshOutgoingInvites(outgoingPage)
      ]);
    } catch (err) {
      console.error('Failed to refresh all:', err);
    } finally {
      setIsRefreshingAll(false);
    }
  };

  const handleFriendsPageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > friendsTotalPages) return;
    await refreshFriends(newPage);
  };

  const handleIncomingPageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > incomingTotalPages) return;
    await refreshIncomingInvites(newPage);
  };

  const handleOutgoingPageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > outgoingTotalPages) return;
    await refreshOutgoingInvites(newPage);
  };

  const getErrorMessage = () => {
    if (!error) return null;
    if (error.statusCode === 404) return 'Пользователь не найден';
    if (error.statusCode === 400) return error.errorMessage || 'Ошибка валидации';
    if (error.statusCode === 401) return 'Требуется авторизация';
    return error.errorMessage || 'Произошла ошибка';
  };

  const getInviteName = (invite: any, isIncoming: boolean) => {
    if (!invite) return 'Неизвестно';
    if (isIncoming) {
      return invite.initiatorName || `Пользователь (${invite.initiatorId?.substring(0, 8)}...)`;
    } else {
      return invite.recipientName || `Пользователь (${invite.recipientId?.substring(0, 8)}...)`;
    }
  };

  const getFriendName = (friend: any) => {
    if (!friend) return 'Неизвестно';
    return friend.friendName || `Пользователь (${friend.friendId?.substring(0, 8)}...)`;
  };

  const getInitials = (name: string) => {
    if (!name || name === 'Неизвестно') return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const avatarColors = [
      colors.primary,
      colors.success,
      colors.warning,
      colors.info,
      colors.primaryDark,
    ];
    const index = name.length % avatarColors.length;
    return avatarColors[index];
  };

  const friendsList = Array.isArray(friends) ? friends : [];
  const incomingList = Array.isArray(incomingInvites) ? incomingInvites : [];
  const outgoingList = Array.isArray(outgoingInvites) ? outgoingInvites : [];

  // 🔹 Стили с адаптивностью (как в CabinetPage)
  const containerStyle: React.CSSProperties = {
    minHeight: '100%',
    padding: isMobile ? spacing.md : 0,
  };

  const pageHeaderStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isMobile ? spacing.lg : spacing.xl,
    paddingBottom: isMobile ? spacing.md : spacing.lg,
    borderBottom: `1px solid ${colors.gray200}`,
    flexWrap: 'wrap',
    gap: spacing.sm,
  };

  const pageTitleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: isMobile ? typography.fontSize.xl : typography.fontSize['2xl'],
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
    gridTemplateColumns: isMobile ? '1fr' : '280px 1fr',
    gap: isMobile ? spacing.lg : spacing.xl,
  };

  const sidebarStyle: React.CSSProperties = {
    position: isMobile ? 'fixed' : 'sticky',
    top: isMobile ? '0' : spacing.xl,
    height: isMobile ? '100vh' : 'fit-content',
    width: isMobile ? '280px' : '100%',
    backgroundColor: isMobile ? colors.white : 'transparent',
    zIndex: 1000,
    left: isMobile ? (isSidebarOpen ? '0' : '-280px') : '0',
    transition: `left ${transitions.normal}`,
    overflowY: 'auto',
    padding: isMobile ? spacing.lg : 0,
    boxShadow: isMobile ? shadows.lg : 'none',
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
    display: isMobile && isSidebarOpen ? 'block' : 'none',
  };

  const mobileHeaderStyle: React.CSSProperties = {
    display: isMobile ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottom: `1px solid ${colors.gray200}`,
    marginBottom: spacing.md,
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
    backgroundColor: colors.gray700,
    borderRadius: '2px',
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

  const getBadgeStyle = (count: number): React.CSSProperties => ({
    backgroundColor: count > 0 ? colors.error : colors.gray300,
    color: colors.white,
    borderRadius: borderRadius.full,
    padding: `${spacing.xs} ${spacing.sm}`,
    fontSize: typography.fontSize.xs,
    marginLeft: 'auto',
    fontWeight: typography.fontWeight.semibold,
    minWidth: '20px',
    textAlign: 'center',
  });

  const contentAreaStyle: React.CSSProperties = {
    minWidth: 0,
    width: '100%',
  };

  const sectionCardStyle: React.CSSProperties = {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    boxShadow: shadows.sm,
    border: `1px solid ${colors.gray200}`,
    overflow: 'hidden',
  };

  const sectionHeaderStyle: React.CSSProperties = {
    padding: isMobile ? spacing.md : `${spacing.lg} ${spacing.xl}`,
    borderBottom: `1px solid ${colors.gray200}`,
    backgroundColor: colors.gray50,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  };

  const sectionTitleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: isMobile ? typography.fontSize.base : typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray900,
  };

  const sectionDescriptionStyle: React.CSSProperties = {
    margin: `${spacing.xs} 0 0 0`,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
  };

  const sectionBodyStyle: React.CSSProperties = {
    padding: isMobile ? spacing.md : spacing.xl,
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
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    flex: isMobile ? '1' : 'auto',
    justifyContent: 'center',
  };

  const getActionButtonStyle = (variant: 'success' | 'danger' | 'secondary', disabled: boolean = false): React.CSSProperties => ({
    padding: `${spacing.xs} ${spacing.sm}`,
    fontSize: typography.fontSize.xs,
    backgroundColor: disabled ? colors.gray200
      : variant === 'success' ? colors.success
      : variant === 'danger' ? colors.error
      : colors.gray100,
    color: disabled ? colors.gray400
      : variant === 'secondary' ? colors.gray600
      : colors.white,
    border: variant === 'secondary' ? `1px solid ${colors.gray300}` : 'none',
    borderRadius: borderRadius.md,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: typography.fontWeight.medium,
    transition: `all ${transitions.fast}`,
    opacity: disabled ? 0.6 : 1,
    outline: 'none',
    whiteSpace: 'nowrap' as const,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
  });

  const refreshButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    padding: `${spacing.sm} ${spacing.lg}`,
    backgroundColor: 'transparent',
    border: `1px solid ${colors.gray300}`,
    borderRadius: borderRadius.md,
    cursor: isRefreshingAll ? 'not-allowed' : 'pointer',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray700,
    transition: `all ${transitions.normal}`,
    outline: 'none',
    opacity: isRefreshingAll ? 0.7 : 1,
    whiteSpace: 'nowrap' as const,
  };

  const refreshIconStyle = (isRefreshing: boolean): React.CSSProperties => ({
    width: '16px',
    height: '16px',
    display: 'inline-block',
    animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none',
  });

  const listStyle: React.CSSProperties = {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    boxShadow: shadows.sm,
    border: `1px solid ${colors.gray200}`,
    overflow: 'hidden',
  };

  const listItemStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${spacing.md} ${spacing.lg}`,
    borderBottom: `1px solid ${colors.gray100}`,
    transition: `background ${transitions.fast}`,
  };

  const listItemMobileStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: `${spacing.md} ${spacing.lg}`,
    borderBottom: `1px solid ${colors.gray100}`,
    transition: `background ${transitions.fast}`,
    gap: spacing.md,
  };

  const listItemLeftStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    minWidth: 0,
    width: '100%',
  };

  const listItemContentStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
  };

  const listItemTitleStyle: React.CSSProperties = {
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.sm,
    color: colors.gray900,
    marginBottom: spacing.xs,
    wordBreak: 'break-word' as const,
  };

  const listItemMetaStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    flexWrap: 'wrap',
  };

  const listItemDescriptionStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    flexWrap: 'wrap',
  };

  const actionButtonsStyle: React.CSSProperties = {
    display: 'flex',
    gap: spacing.xs,
    flexShrink: 0,
  };

  const actionButtonsMobileStyle: React.CSSProperties = {
    display: 'flex',
    gap: spacing.sm,
    width: '100%',
  };

  const inputGroupStyle: React.CSSProperties = {
    marginBottom: spacing.lg,
  };

  const inputLabelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray700,
    marginBottom: spacing.sm,
  };

  const inputWrapperStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: `${spacing.sm} ${spacing.md}`,
    border: `1px solid ${colors.gray300}`,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    transition: `all ${transitions.fast}`,
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: isMobile ? '16px' : typography.fontSize.sm,
    color: colors.gray900,
    backgroundColor: 'transparent',
    width: '100%',
  };

  const addFriendContainerStyle: React.CSSProperties = {
    maxWidth: isMobile ? '100%' : '500px',
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
    flex: isMobile ? '1' : 'auto',
    justifyContent: 'center',
  };

  const buttonDisabledStyle: React.CSSProperties = {
    ...buttonPrimaryStyle,
    backgroundColor: colors.gray300,
    cursor: 'not-allowed',
    opacity: 0.6,
  };

  const errorStyle: React.CSSProperties = {
    color: colors.errorDark,
    fontSize: typography.fontSize.sm,
    padding: `${spacing.md} ${spacing.lg}`,
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: `1px solid ${colors.error}`,
    flexWrap: isMobile ? 'wrap' : 'nowrap',
    gap: spacing.sm,
  };

  const getNotificationStyle = (type: 'success' | 'error' | 'info'): React.CSSProperties => ({
    padding: `${spacing.md} ${spacing.lg}`,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    fontSize: typography.fontSize.sm,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: type === 'success' ? colors.successLight
      : type === 'error' ? colors.errorLight
      : colors.infoLight,
    color: type === 'success' ? colors.successDark
      : type === 'error' ? colors.errorDark
      : colors.infoDark,
    border: `1px solid ${type === 'success' ? colors.success
      : type === 'error' ? colors.error
      : colors.info}`,
    flexWrap: isMobile ? 'wrap' : 'nowrap',
  });

  const emptyStateStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: isMobile ? `${spacing.xl} ${spacing.md}` : `${spacing['2xl']} ${spacing.xl}`,
    color: colors.gray500,
    fontSize: typography.fontSize.sm,
  };

  const paginationStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTop: `1px solid ${colors.gray200}`,
    flexWrap: isMobile ? 'wrap' : 'nowrap',
    gap: spacing.sm,
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
    zIndex: 2000,
    animation: 'fadeIn 0.2s ease',
    padding: isMobile ? spacing.md : 0,
  };

  const modalContentStyle: React.CSSProperties = {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    boxShadow: shadows.xl,
    padding: isMobile ? spacing.lg : spacing.xl,
    maxWidth: isMobile ? '100%' : '420px',
    width: isMobile ? '100%' : '90%',
    animation: 'slideIn 0.2s ease',
    maxHeight: '90vh',
    overflowY: 'auto',
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

  const modalTitleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: isMobile ? typography.fontSize.base : typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray900,
  };

  const modalMessageStyle: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    marginBottom: spacing.lg,
    lineHeight: 1.6,
  };

  const modalItemNameStyle: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray900,
    backgroundColor: colors.gray100,
    padding: `${spacing.sm} ${spacing.md}`,
    borderRadius: borderRadius.md,
    display: 'inline-block',
    marginBottom: spacing.lg,
    maxWidth: '100%',
    wordBreak: 'break-word' as const,
  };

  const modalActionsStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    flexWrap: isMobile ? 'wrap' : 'nowrap',
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
    flex: isMobile ? '1' : 'auto',
    justifyContent: 'center',
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
    flex: isMobile ? '1' : 'auto',
    justifyContent: 'center',
  };

  const renderAvatar = (name: string, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeMap = { sm: 32, md: isMobile ? 36 : 40, lg: 48 };
    const fontSizeMap = { sm: 12, md: isMobile ? 13 : 14, lg: 18 };
    return (
      <div style={{
        width: sizeMap[size],
        height: sizeMap[size],
        borderRadius: borderRadius.full,
        backgroundColor: getAvatarColor(name),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.white,
        fontWeight: typography.fontWeight.semibold,
        fontSize: fontSizeMap[size],
        flexShrink: 0,
      }}>
        {getInitials(name)}
      </div>
    );
  };

  const renderPagination = (
    currentPage: number,
    totalPages: number,
    onPageChange: (page: number) => void,
    disabled: boolean
  ) => {
    if (totalPages <= 1) return null;
    const hasPrevPage = currentPage > 1;
    const hasNextPage = currentPage < totalPages;
    return (
      <div style={paginationStyle}>
        <div style={paginationInfoStyle}>
          Страница {currentPage} из {totalPages}
        </div>
        <div style={paginationButtonsStyle}>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!hasPrevPage || disabled}
            style={!hasPrevPage || disabled ? buttonDisabledStyle : buttonSecondaryStyle}
          >
            Назад
          </button>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!hasNextPage || disabled}
            style={!hasNextPage || disabled ? buttonDisabledStyle : buttonSecondaryStyle}
          >
            Вперед
          </button>
        </div>
      </div>
    );
  };

  const renderFriendsList = () => (
    <div style={sectionCardStyle}>
      <div style={sectionHeaderStyle}>
        <div>
          <h2 style={sectionTitleStyle}>Мои друзья</h2>
          <p style={sectionDescriptionStyle}>
            {friendsTotalCount} {friendsTotalCount === 1 ? 'друг' : friendsTotalCount < 5 ? 'друга' : 'друзей'}
          </p>
        </div>
        <button
          onClick={handleRefreshAll}
          disabled={isRefreshingAll}
          style={refreshButtonStyle}
        >
          <svg
            style={refreshIconStyle(isRefreshingAll)}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 21h5v-5" />
          </svg>
          {isMobile ? '' : (isRefreshingAll ? 'Обновление...' : 'Обновить')}
        </button>
      </div>
      <div style={sectionBodyStyle}>
        {friendsList.length === 0 ? (
          <div style={emptyStateStyle}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={colors.gray300} strokeWidth="1.5" style={{ margin: '0 auto' }}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <p style={{ marginTop: spacing.md }}>Пока нет друзей</p>
            <button
              onClick={() => setActiveSection('add')}
              style={{ ...buttonPrimaryStyle, marginTop: spacing.md }}
            >
              Добавить друга
            </button>
          </div>
        ) : (
          <div style={listStyle}>
            {friendsList.map((friend) => (
              <div key={friend.friendId} style={isMobile ? listItemMobileStyle : listItemStyle}>
                <div style={listItemLeftStyle}>
                  {renderAvatar(getFriendName(friend), 'md')}
                  <div style={listItemContentStyle}>
                    <div style={listItemTitleStyle}>{getFriendName(friend)}</div>
                    <div style={listItemMetaStyle}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.gray400} strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                      <span>
                        В друзьях с {friend.friendshipStartDate ? new Date(friend.friendshipStartDate).toLocaleDateString('ru-RU') : '-'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  style={isMobile ? getActionButtonStyle('danger', isLoading) : getActionButtonStyle('danger', isLoading)}
                  onClick={() => handleRemoveFriendClick(friend.friendId, getFriendName(friend))}
                  disabled={isLoading}
                  title="Удалить из друзей"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                  {isMobile ? 'Удалить' : ''}
                </button>
              </div>
            ))}
          </div>
        )}
        {renderPagination(friendsPage, friendsTotalPages, handleFriendsPageChange, isLoading)}
      </div>
    </div>
  );

  const renderIncomingInvites = () => (
    <div style={sectionCardStyle}>
      <div style={sectionHeaderStyle}>
        <div>
          <h2 style={sectionTitleStyle}>Входящие заявки</h2>
          <p style={sectionDescriptionStyle}>
            {incomingTotalCount} {incomingTotalCount === 1 ? 'заявка' : incomingTotalCount < 5 ? 'заявки' : 'заявок'} в друзья
          </p>
        </div>
        <button
          onClick={handleRefreshAll}
          disabled={isRefreshingAll}
          style={refreshButtonStyle}
        >
          <svg
            style={refreshIconStyle(isRefreshingAll)}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 21h5v-5" />
          </svg>
          {isMobile ? '' : (isRefreshingAll ? 'Обновление...' : 'Обновить')}
        </button>
      </div>
      <div style={sectionBodyStyle}>
        {incomingList.length === 0 ? (
          <div style={emptyStateStyle}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={colors.gray300} strokeWidth="1.5" style={{ margin: '0 auto' }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
            </svg>
            <p style={{ marginTop: spacing.md }}>Нет входящих заявок</p>
          </div>
        ) : (
          <div style={listStyle}>
            {incomingList.map((invite) => (
              <div key={invite.id} style={isMobile ? listItemMobileStyle : listItemStyle}>
                <div style={listItemLeftStyle}>
                  {renderAvatar(getInviteName(invite, true), 'md')}
                  <div style={listItemContentStyle}>
                    <div style={listItemTitleStyle}>{getInviteName(invite, true)}</div>
                    <div style={listItemDescriptionStyle}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="8.5" cy="7" r="4" />
                        <line x1="20" y1="8" x2="20" y2="14" />
                        <line x1="23" y1="11" x2="17" y2="11" />
                      </svg>
                      <span>Хочет добавить вас в друзья</span>
                    </div>
                  </div>
                </div>
                <div style={isMobile ? actionButtonsMobileStyle : actionButtonsStyle}>
                  <button
                    style={getActionButtonStyle('success', isLoading || isRefreshingAll)}
                    onClick={() => handleAcceptInvite(invite.id)}
                    disabled={isLoading || isRefreshingAll}
                    title="Принять"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    {isMobile ? 'Принять' : ''}
                  </button>
                  <button
                    style={getActionButtonStyle('danger', isLoading || isRefreshingAll)}
                    onClick={() => handleDeclineInviteClick(invite.id, getInviteName(invite, true))}
                    disabled={isLoading || isRefreshingAll}
                    title="Отклонить"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                    {isMobile ? 'Отклонить' : ''}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {renderPagination(incomingPage, incomingTotalPages, handleIncomingPageChange, isLoading || isRefreshingAll)}
      </div>
    </div>
  );

  const renderOutgoingInvites = () => (
    <div style={sectionCardStyle}>
      <div style={sectionHeaderStyle}>
        <div>
          <h2 style={sectionTitleStyle}>Исходящие заявки</h2>
          <p style={sectionDescriptionStyle}>
            {outgoingTotalCount} {outgoingTotalCount === 1 ? 'заявка' : outgoingTotalCount < 5 ? 'заявки' : 'заявок'} ожидает подтверждения
          </p>
        </div>
        <button
          onClick={handleRefreshAll}
          disabled={isRefreshingAll}
          style={refreshButtonStyle}
        >
          <svg
            style={refreshIconStyle(isRefreshingAll)}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 21h5v-5" />
          </svg>
          {isMobile ? '' : (isRefreshingAll ? 'Обновление...' : 'Обновить')}
        </button>
      </div>
      <div style={sectionBodyStyle}>
        {outgoingList.length === 0 ? (
          <div style={emptyStateStyle}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={colors.gray300} strokeWidth="1.5" style={{ margin: '0 auto' }}>
              <path d="M12 19l7-7 3 3-7 7-3-3z" />
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
              <path d="M2 2l7.586 7.586" />
              <circle cx="11" cy="11" r="2" />
            </svg>
            <p style={{ marginTop: spacing.md }}>Нет исходящих заявок</p>
          </div>
        ) : (
          <div style={listStyle}>
            {outgoingList.map((invite) => (
              <div key={invite.id} style={isMobile ? listItemMobileStyle : listItemStyle}>
                <div style={listItemLeftStyle}>
                  {renderAvatar(getInviteName(invite, false), 'md')}
                  <div style={listItemContentStyle}>
                    <div style={listItemTitleStyle}>{getInviteName(invite, false)}</div>
                    <div style={listItemDescriptionStyle}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.gray400} strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                      <span>Ожидает подтверждения</span>
                    </div>
                  </div>
                </div>
                <button
                  style={getActionButtonStyle('secondary', isLoading)}
                  onClick={() => handleDeclineOutgoingInviteClick(invite.id, getInviteName(invite, false))}
                  disabled={isLoading}
                  title="Отозвать заявку"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                    <line x1="18" y1="9" x2="12" y2="15" />
                    <line x1="12" y1="9" x2="18" y2="15" />
                  </svg>
                  {isMobile ? 'Отозвать' : ''}
                </button>
              </div>
            ))}
          </div>
        )}
        {renderPagination(outgoingPage, outgoingTotalPages, handleOutgoingPageChange, isLoading)}
      </div>
    </div>
  );

  const renderAddFriend = () => (
    <div style={sectionCardStyle}>
      <div style={sectionHeaderStyle}>
        <div>
          <h2 style={sectionTitleStyle}>Добавить друга</h2>
          <p style={sectionDescriptionStyle}>
            Введите имя пользователя, чтобы отправить заявку в друзья
          </p>
        </div>
      </div>
      <div style={sectionBodyStyle}>
        <div style={addFriendContainerStyle}>
          <form onSubmit={handleSendRequest}>
            <div style={inputGroupStyle}>
              <label style={inputLabelStyle}>Имя пользователя</label>
              <div style={inputWrapperStyle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.gray400} strokeWidth="2" style={{ marginRight: spacing.sm }}>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  type="text"
                  placeholder="Например: ivan_ivanov"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  style={inputStyle}
                  disabled={isLoading}
                />
              </div>
            </div>
            <button
              type="submit"
              style={!usernameInput.trim() || isLoading ? buttonDisabledStyle : buttonPrimaryStyle}
              disabled={isLoading || !usernameInput.trim()}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
              {isLoading ? 'Отправка...' : 'Отправить заявку'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  const getModalTitle = () => {
    switch (deleteModal.actionType) {
      case 'removeFriend':
        return 'Удалить друга?';
      case 'declineInvite':
        return 'Отклонить заявку?';
      case 'declineOutgoing':
        return 'Отозвать заявку?';
      default:
        return 'Подтверждение';
    }
  };

  const getModalMessage = () => {
    switch (deleteModal.actionType) {
      case 'removeFriend':
        return 'Вы уверены, что хотите удалить этого друга? Это действие нельзя отменить.';
      case 'declineInvite':
        return 'Вы уверены, что хотите отклонить эту заявку?';
      case 'declineOutgoing':
        return 'Вы уверены, что хотите отозвать эту заявку?';
      default:
        return 'Вы уверены?';
    }
  };

  const getConfirmButtonText = () => {
    switch (deleteModal.actionType) {
      case 'removeFriend':
        return isLoading ? 'Удаление...' : 'Удалить';
      case 'declineInvite':
        return isLoading ? 'Отклонение...' : 'Отклонить';
      case 'declineOutgoing':
        return isLoading ? 'Отмена...' : 'Отозвать';
      default:
        return 'Подтвердить';
    }
  };

  return (
    <div style={containerStyle}>
      {/* 🔹 Оверлей для мобильного меню */}
      {isMobile && isSidebarOpen && (
        <div style={overlayStyle} onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* 🔹 Мобильный хедер с кнопкой меню */}
      {isMobile && (
        <header style={mobileHeaderStyle}>
          <button
            style={menuButtonStyle}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label="Меню"
          >
            <span style={menuBarStyle} />
            <span style={menuBarStyle} />
            <span style={menuBarStyle} />
          </button>
          <h1 style={{ ...pageTitleStyle, margin: 0, fontSize: typography.fontSize.lg }}>
            Друзья
          </h1>
          <div style={{ width: '40px' }} />
        </header>
      )}

      <div style={pageHeaderStyle}>
        <div>
          <h1 style={pageTitleStyle}>Друзья</h1>
          <p style={pageDescriptionStyle}>
            Управление списком друзей и заявками
          </p>
        </div>
      </div>

      <div style={layoutStyle}>
        {/* Sidebar */}
        <aside style={sidebarStyle}>
          <nav style={navMenuStyle}>
            <button
              style={getNavMenuItemStyle(activeSection === 'friends')}
              onClick={() => setActiveSection('friends')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Мои друзья
              {friendsTotalCount > 0 && (
                <span style={getBadgeStyle(friendsTotalCount)}>{friendsTotalCount}</span>
              )}
            </button>
            <button
              style={getNavMenuItemStyle(activeSection === 'incoming')}
              onClick={() => setActiveSection('incoming')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
              </svg>
              Входящие
              {incomingTotalCount > 0 && (
                <span style={getBadgeStyle(incomingTotalCount)}>{incomingTotalCount}</span>
              )}
            </button>
            <button
              style={getNavMenuItemStyle(activeSection === 'outgoing')}
              onClick={() => setActiveSection('outgoing')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 19l7-7 3 3-7 7-3-3z" />
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
              </svg>
              Исходящие
              {outgoingTotalCount > 0 && (
                <span style={getBadgeStyle(outgoingTotalCount)}>{outgoingTotalCount}</span>
              )}
            </button>
            <button
              style={getNavMenuItemStyle(activeSection === 'add')}
              onClick={() => setActiveSection('add')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
              Добавить
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main style={contentAreaStyle}>
          {notification && (
            <div style={getNotificationStyle(notification.type)}>
              <span style={{ flex: isMobile ? '1 1 100%' : 'auto' }}>
                {notification.type === 'success'}
                {notification.type === 'error'}
                {notification.type === 'info'}
                {notification.message}
              </span>
              <button
                onClick={clearNotification}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  padding: isMobile ? '8px' : '0 4px',
                  color: 'inherit',
                  outline: 'none',
                  minWidth: '32px',
                  minHeight: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Закрыть уведомление"
              >
                ×
              </button>
            </div>
          )}

          {!notification && error && (
            <div style={errorStyle}>
              <span style={{ flex: isMobile ? '1 1 100%' : 'auto' }}>! {getErrorMessage()}</span>
              <button
                onClick={clearError}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'inherit',
                  fontSize: '18px',
                  padding: isMobile ? '8px' : '0 4px',
                  outline: 'none',
                  minWidth: '32px',
                  minHeight: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Закрыть ошибку"
              >
                ×
              </button>
            </div>
          )}

          {isLoading && !isRefreshingAll && (
            <div style={sectionCardStyle}>
              <div style={emptyStateStyle}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={colors.gray300} strokeWidth="2" style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }}>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
                <p style={{ marginTop: spacing.md }}>Загрузка...</p>
              </div>
            </div>
          )}

          {!isLoading && activeSection === 'friends' && renderFriendsList()}
          {!isLoading && activeSection === 'incoming' && renderIncomingInvites()}
          {!isLoading && activeSection === 'outgoing' && renderOutgoingInvites()}
          {!isLoading && activeSection === 'add' && renderAddFriend()}
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div style={modalOverlayStyle} onClick={handleDeleteCancel}>
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
              <h3 style={modalTitleStyle}>{getModalTitle()}</h3>
            </div>
            <p style={modalMessageStyle}>
              {getModalMessage()}
            </p>
            {deleteModal.itemName && (
              <div style={modalItemNameStyle}>
                {deleteModal.itemName}
              </div>
            )}
            <div style={modalActionsStyle}>
              <button
                style={modalButtonCancelStyle}
                onClick={handleDeleteCancel}
                disabled={isLoading}
              >
                Отмена
              </button>
              <button
                style={modalButtonDeleteStyle}
                onClick={handleDeleteConfirm}
                disabled={isLoading}
              >
                {getConfirmButtonText()}
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
        /* 🔹 Увеличение шрифта input на iOS для предотвращения зума */
        @media (max-width: 767px) {
          input, select, textarea {
            font-size: 16px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default FriendsPage;
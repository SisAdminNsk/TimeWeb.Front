import React, { useState, useEffect } from 'react';
import { useFriends } from './FriendsContext';
import { theme } from '../styles/theme';

type TabType = 'friends' | 'incoming' | 'outgoing' | 'add';

interface DeleteModalState {
  isOpen: boolean;
  itemId: string | null;
  itemName: string | null;
  actionType: 'removeFriend' | 'declineInvite' | 'declineOutgoing' | null;
}

export const FriendsWidget = () => {
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [usernameInput, setUsernameInput] = useState('');
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    isOpen: false,
    itemId: null,
    itemName: null,
    actionType: null,
  });
  
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

  useEffect(() => {
    refreshFriends(1);
    refreshInvites();
  }, []);

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

  const { colors, typography, spacing, borderRadius, shadows, transitions } = theme;

  const styles = {
    widget: {
      border: `1px solid ${colors.gray200}`,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.white,
      boxShadow: shadows.md,
      width: '100%',
      fontFamily: typography.fontFamily,
      overflow: 'hidden',
      animation: 'fadeIn 0.4s ease-out',
      display: 'flex',
      flexDirection: 'column' as const,
      height: '100%',
      minHeight: '400px',
    } as React.CSSProperties,
    
    header: {
      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
      color: colors.white,
      padding: `${spacing.md} ${spacing.lg}`,
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.semibold,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexShrink: 0,
    } as React.CSSProperties,
    
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: spacing.sm,
    } as React.CSSProperties,
    
    headerButton: {
      background: 'rgba(255, 255, 255, 0.15)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      borderRadius: borderRadius.md,
      padding: `${spacing.xs} ${spacing.md}`,
      color: colors.white,
      cursor: 'pointer',
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.medium,
      display: 'flex',
      alignItems: 'center',
      gap: spacing.xs,
      transition: `all ${transitions.normal}`,
      backdropFilter: 'blur(4px)',
      outline: 'none',
    } as React.CSSProperties,
    
    tabs: {
      display: 'flex',
      borderBottom: `1px solid ${colors.gray200}`,
      backgroundColor: colors.gray50,
      flexShrink: 0,
    } as React.CSSProperties,
    
    tab: (isActive: boolean): React.CSSProperties => ({
      flex: 1,
      padding: `${spacing.sm} ${spacing.md}`,
      border: 'none',
      background: isActive ? colors.white : 'transparent',
      borderBottom: isActive ? `2px solid ${colors.primary}` : '2px solid transparent',
      cursor: 'pointer',
      fontWeight: isActive ? typography.fontWeight.semibold : typography.fontWeight.normal,
      fontSize: typography.fontSize.sm,
      transition: `all ${transitions.normal}`,
      color: isActive ? colors.primary : colors.gray500,
      outline: 'none',
    }),
    
    content: {
      padding: spacing.lg,
      flex: 1,
      overflowY: 'auto' as const,
      overflowX: 'hidden' as const,
      scrollbarWidth: 'thin',
      scrollbarColor: `${colors.gray300} ${colors.gray50}`,
    } as React.CSSProperties,
    
    item: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: `${spacing.md} ${spacing.lg}`,
      borderBottom: `1px solid ${colors.gray100}`,
      transition: `background ${transitions.fast}`,
    } as React.CSSProperties,
    
    itemName: {
      fontWeight: typography.fontWeight.medium,
      fontSize: typography.fontSize.sm,
      color: colors.gray900,
    } as React.CSSProperties,
    
    itemMeta: {
      fontSize: typography.fontSize.xs,
      color: colors.gray400,
      marginTop: spacing.xs,
    } as React.CSSProperties,
    
    buttonGroup: {
      display: 'flex',
      gap: spacing.xs,
    } as React.CSSProperties,
    
    button: (variant: 'primary' | 'success' | 'danger' | 'secondary' | 'pagination', disabled: boolean = false): React.CSSProperties => ({
      padding: variant === 'pagination' ? `${spacing.xs} ${spacing.sm}` : `${spacing.xs} ${spacing.sm}`,
      borderRadius: borderRadius.sm,
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.medium,
      backgroundColor: disabled ? colors.gray300 
        : variant === 'primary' ? colors.primary 
        : variant === 'success' ? colors.success 
        : variant === 'danger' ? colors.error 
        : variant === 'pagination' ? colors.gray50
        : colors.gray500,
      color: variant === 'pagination' ? colors.gray700 : colors.white,
      border: variant === 'pagination' ? `1px solid ${colors.gray300}` : 'none',
      transition: `all ${transitions.normal}`,
      opacity: disabled ? 0.6 : 1,
      outline: 'none',
    }),
    
    input: {
      width: '100%',
      padding: `${spacing.sm} ${spacing.md}`,
      border: `1px solid ${colors.gray300}`,
      borderRadius: borderRadius.md,
      fontSize: typography.fontSize.sm,
      marginBottom: spacing.sm,
      boxSizing: 'border-box' as const,
      transition: `all ${transitions.fast}`,
    } as React.CSSProperties,
    
    error: {
      color: colors.errorDark,
      fontSize: typography.fontSize.xs,
      padding: spacing.sm,
      backgroundColor: colors.errorLight,
      borderRadius: borderRadius.sm,
      marginBottom: spacing.md,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      border: `1px solid ${colors.error}`,
    } as React.CSSProperties,
    
    notification: (type: 'success' | 'error' | 'info'): React.CSSProperties => ({
      padding: `${spacing.sm} ${spacing.md}`,
      borderRadius: borderRadius.md,
      marginBottom: spacing.md,
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
    }),
    
    empty: {
      textAlign: 'center' as const,
      color: colors.gray400,
      padding: `${spacing.xl} ${spacing.md}`,
      fontSize: typography.fontSize.sm,
    } as React.CSSProperties,
    
    badge: (count: number): React.CSSProperties => ({
      backgroundColor: count > 0 ? colors.error : colors.gray300,
      color: count > 0 ? colors.white : colors.gray500,
      borderRadius: borderRadius.full,
      padding: `${spacing.xs} ${spacing.sm}`,
      fontSize: typography.fontSize.xs,
      marginLeft: spacing.xs,
      fontWeight: typography.fontWeight.semibold,
    }),
    
    loading: {
      textAlign: 'center' as const,
      padding: spacing.xl,
      color: colors.gray400,
      fontSize: typography.fontSize.sm,
    } as React.CSSProperties,
    
    sectionHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    } as React.CSSProperties,
    
    paginationContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.lg,
      paddingTop: spacing.md,
      borderTop: `1px solid ${colors.gray100}`,
    } as React.CSSProperties,
    
    pageInfo: {
      fontSize: typography.fontSize.xs,
      color: colors.gray500,
      minWidth: '80px',
      textAlign: 'center' as const,
    } as React.CSSProperties,
    
    refreshIcon: (isRefreshing: boolean): React.CSSProperties => ({
      width: '14px',
      height: '14px',
      display: 'inline-block',
      animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none',
    }),
    
    sectionTitle: {
      margin: 0,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
      color: colors.gray900,
    } as React.CSSProperties,
    
    sectionCount: {
      fontSize: typography.fontSize.xs,
      color: colors.gray400,
    } as React.CSSProperties,

    // ✅ Стили для модального окна (аналогично EventsList)
    modalOverlay: {
      position: 'fixed' as const,
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
    } as React.CSSProperties,
    
    modalContent: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.lg,
      boxShadow: shadows.xl,
      padding: spacing.lg,
      maxWidth: '400px',
      width: '90%',
      animation: 'slideIn 0.2s ease',
    } as React.CSSProperties,
    
    modalHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.md,
    } as React.CSSProperties,
    
    modalIcon: {
      width: '40px',
      height: '40px',
      backgroundColor: colors.errorLight,
      borderRadius: borderRadius.full,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    } as React.CSSProperties,
    
    modalIconSvg: {
      width: '20px',
      height: '20px',
      color: colors.error,
    } as React.CSSProperties,
    
    modalTitle: {
      margin: 0,
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.semibold,
      color: colors.gray900,
    } as React.CSSProperties,
    
    modalMessage: {
      fontSize: typography.fontSize.base,
      color: colors.gray600,
      marginBottom: spacing.lg,
      lineHeight: 1.5,
    } as React.CSSProperties,
    
    modalEventName: {
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.semibold,
      color: colors.gray900,
      backgroundColor: colors.gray100,
      padding: `${spacing.xs} ${spacing.sm}`,
      borderRadius: borderRadius.md,
      display: 'inline-block',
      marginTop: spacing.sm,
    } as React.CSSProperties,
    
    modalActions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: spacing.sm,
    } as React.CSSProperties,
    
    modalButtonCancel: {
      backgroundColor: 'transparent',
      color: colors.gray700,
      border: `1px solid ${colors.gray300}`,
      borderRadius: borderRadius.md,
      padding: `${spacing.sm} ${spacing.lg}`,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      cursor: 'pointer',
      transition: `all ${transitions.normal}`,
    } as React.CSSProperties,
    
    modalButtonDelete: {
      backgroundColor: colors.error,
      color: colors.white,
      border: 'none',
      borderRadius: borderRadius.md,
      padding: `${spacing.sm} ${spacing.lg}`,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      cursor: 'pointer',
      transition: `all ${transitions.normal}`,
    } as React.CSSProperties,
  };

  const friendsList = Array.isArray(friends) ? friends : [];
  const incomingList = Array.isArray(incomingInvites) ? incomingInvites : [];
  const outgoingList = Array.isArray(outgoingInvites) ? outgoingInvites : [];

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
      <div style={styles.paginationContainer}>
        <button
          style={styles.button('pagination', !hasPrevPage || disabled)}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrevPage || disabled}
        >
          ← Назад
        </button>
        <span style={styles.pageInfo}>Стр. {currentPage} из {totalPages}</span>
        <button
          style={styles.button('pagination', !hasNextPage || disabled)}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage || disabled}
        >
          Вперед →
        </button>
      </div>
    );
  };

  const renderFriendsList = () => {
    return (
      <div>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>Друзья</h3>
          <span style={styles.sectionCount}>
            {friendsTotalCount > 0 ? `Всего: ${friendsTotalCount}` : '0'}
          </span>
        </div>
        {friendsList.length === 0 ? (
          <div style={styles.empty}>У вас пока нет друзей</div>
        ) : (
          friendsList.map((friend) => (
            <div key={friend.friendId} style={styles.item}>
              <div>
                <div style={styles.itemName}>{getFriendName(friend)}</div>
                <div style={styles.itemMeta}>
                  {friend.friendshipStartDate ? new Date(friend.friendshipStartDate).toLocaleDateString('ru-RU') : '-'}
                </div>
              </div>
              <button
                style={styles.button('danger', isLoading)}
                onClick={() => handleRemoveFriendClick(friend.friendId, getFriendName(friend))}
                disabled={isLoading}
                onMouseOver={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = colors.errorDark;
                  }
                }}
                onMouseOut={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = colors.error;
                  }
                }}
              >
                Удалить
              </button>
            </div>
          ))
        )}

        {renderPagination(friendsPage, friendsTotalPages, handleFriendsPageChange, isLoading)}
      </div>
    );
  };

  const renderIncomingInvites = () => (
    <div>
      <div style={styles.sectionHeader}>
        <h3 style={styles.sectionTitle}>Входящие заявки</h3>
        <span style={styles.sectionCount}>{incomingTotalCount}</span>
      </div>
      {incomingList.length === 0 ? (
        <div style={styles.empty}>Нет входящих заявок</div>
      ) : (
        incomingList.map((invite) => (
          <div key={invite.id} style={styles.item}>
            <div>
              <div style={styles.itemName}>{getInviteName(invite, true)}</div>
              <div style={styles.itemMeta}>
                {invite.initiatorName ? `ID: ${invite.initiatorId?.substring(0, 8)}...` : `От: ${invite.initiatorId?.substring(0, 8)}...`}
              </div>
            </div>
            <div style={styles.buttonGroup}>
              <button
                style={styles.button('success', isLoading || isRefreshingAll)}
                onClick={() => handleAcceptInvite(invite.id)}
                disabled={isLoading || isRefreshingAll}
                title="Принять"
                onMouseOver={(e) => {
                  if (!isLoading && !isRefreshingAll) {
                    e.currentTarget.style.backgroundColor = colors.successDark;
                  }
                }}
                onMouseOut={(e) => {
                  if (!isLoading && !isRefreshingAll) {
                    e.currentTarget.style.backgroundColor = colors.success;
                  }
                }}
              >
                ✓
              </button>
              <button
                style={styles.button('danger', isLoading || isRefreshingAll)}
                onClick={() => handleDeclineInviteClick(invite.id, getInviteName(invite, true))}
                disabled={isLoading || isRefreshingAll}
                title="Отклонить"
                onMouseOver={(e) => {
                  if (!isLoading && !isRefreshingAll) {
                    e.currentTarget.style.backgroundColor = colors.errorDark;
                  }
                }}
                onMouseOut={(e) => {
                  if (!isLoading && !isRefreshingAll) {
                    e.currentTarget.style.backgroundColor = colors.error;
                  }
                }}
              >
                ✕
              </button>
            </div>
          </div>
        ))
      )}

      {renderPagination(incomingPage, incomingTotalPages, handleIncomingPageChange, isLoading || isRefreshingAll)}
    </div>
  );

  const renderOutgoingInvites = () => (
    <div>
      <div style={styles.sectionHeader}>
        <h3 style={styles.sectionTitle}>Исходящие заявки</h3>
        <span style={styles.sectionCount}>{outgoingTotalCount}</span>
      </div>
      {outgoingList.length === 0 ? (
        <div style={styles.empty}>Нет исходящих заявок</div>
      ) : (
        outgoingList.map((invite) => (
          <div key={invite.id} style={styles.item}>
            <div>
              <div style={styles.itemName}>{getInviteName(invite, false)}</div>
              <div style={styles.itemMeta}>
                {invite.recipientName ? `ID: ${invite.recipientId?.substring(0, 8)}...` : `Кому: ${invite.recipientId?.substring(0, 8)}...`}
              </div>
            </div>
            <button
              style={styles.button('secondary', isLoading)}
              onClick={() => handleDeclineOutgoingInviteClick(invite.id, getInviteName(invite, false))}
              disabled={isLoading}
              onMouseOver={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = colors.gray600;
                }
              }}
              onMouseOut={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = colors.gray500;
                }
              }}
            >
              Отозвать
            </button>
          </div>
        ))
      )}

      {renderPagination(outgoingPage, outgoingTotalPages, handleOutgoingPageChange, isLoading)}
    </div>
  );

  const renderAddFriend = () => (
    <div>
      <h3 style={{ ...styles.sectionTitle, marginBottom: spacing.md }}>
        Добавить друга
      </h3>
      
      <form onSubmit={handleSendRequest}>
        <input
          type="text"
          placeholder="Введите имя пользователя"
          value={usernameInput}
          onChange={(e) => setUsernameInput(e.target.value)}
          style={styles.input}
          disabled={isLoading}
          onFocus={(e) => e.target.style.borderColor = colors.primary}
          onBlur={(e) => e.target.style.borderColor = colors.gray300}
        />
        <button
          type="submit"
          style={{ 
            ...styles.button('primary', isLoading || !usernameInput.trim()), 
            width: '100%',
            padding: `${spacing.md} ${spacing.lg}`,
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.semibold,
          }}
          disabled={isLoading || !usernameInput.trim()}
          onMouseOver={(e) => {
            if (!isLoading && usernameInput.trim()) {
              e.currentTarget.style.backgroundColor = colors.primaryDark;
            }
          }}
          onMouseOut={(e) => {
            if (!isLoading && usernameInput.trim()) {
              e.currentTarget.style.backgroundColor = colors.primary;
            }
          }}
        >
          {isLoading ? 'Отправка...' : 'Отправить заявку'}
        </button>
      </form>
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
    <div style={styles.widget}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span>Друзья</span>
        </div>
        <button
          onClick={handleRefreshAll}
          disabled={isRefreshingAll}
          style={{
            ...styles.headerButton,
            opacity: isRefreshingAll ? 0.7 : 1,
            cursor: isRefreshingAll ? 'not-allowed' : 'pointer',
          }}
          title="Обновить все данные"
          onMouseOver={(e) => {
            if (!isRefreshingAll) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
          }}
        >
          <svg 
            style={styles.refreshIcon(isRefreshingAll)} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5"
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 21h5v-5" />
          </svg>
          <span>{isRefreshingAll ? 'Обновление...' : 'Обновить'}</span>
        </button>
      </div>
      
      <div style={styles.tabs}>
        <button
          style={styles.tab(activeTab === 'friends')}
          onClick={() => setActiveTab('friends')}
        >
          Друзья
        </button>
        <button
          style={styles.tab(activeTab === 'incoming')}
          onClick={() => setActiveTab('incoming')}
        >
          Входящие
          {incomingTotalCount > 0 && (
            <span style={styles.badge(incomingTotalCount)}>{incomingTotalCount}</span>
          )}
        </button>
        <button
          style={styles.tab(activeTab === 'outgoing')}
          onClick={() => setActiveTab('outgoing')}
        >
          Исходящие
        </button>
        <button
          style={styles.tab(activeTab === 'add')}
          onClick={() => setActiveTab('add')}
        >
          Добавить
        </button>
      </div>
      
      <div style={styles.content}>
        {notification && (
          <div style={styles.notification(notification.type)}>
            <span>
              {notification.type === 'success' && '✓ '}
              {notification.type === 'error' && '⚠️ '}
              {notification.type === 'info' && 'ℹ️ '}
              {notification.message}
            </span>
            <button
              onClick={clearNotification}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '0 4px', color: 'inherit', outline: 'none' }}
            >
              ✕
            </button>
          </div>
        )}
        
        {!notification && error && (
          <div style={styles.error}>
            <span>⚠️ {getErrorMessage()}</span>
            <button
              onClick={clearError}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '16px', padding: '0 4px', outline: 'none' }}
            >
              ✕
            </button>
          </div>
        )}
        
        {isLoading && !isRefreshingAll && (
          <div style={styles.loading}>
            Загрузка...
          </div>
        )}
        
        {!isLoading && activeTab === 'friends' && renderFriendsList()}
        {!isLoading && activeTab === 'incoming' && renderIncomingInvites()}
        {!isLoading && activeTab === 'outgoing' && renderOutgoingInvites()}
        {!isLoading && activeTab === 'add' && renderAddFriend()}
      </div>

      {deleteModal.isOpen && (
        <div style={styles.modalOverlay} onClick={handleDeleteCancel}>
          <div 
            style={styles.modalContent} 
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.modalHeader}>
              <div style={styles.modalIcon}>
                <svg 
                  style={styles.modalIconSvg}
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
              <h3 style={styles.modalTitle}>{getModalTitle()}</h3>
            </div>
            
            <p style={styles.modalMessage}>
              {getModalMessage()}
            </p>
            
            {deleteModal.itemName && (
              <div style={styles.modalEventName}>
                {deleteModal.itemName}
              </div>
            )}
            
            <div style={styles.modalActions}>
              <button
                style={styles.modalButtonCancel}
                onClick={handleDeleteCancel}
                disabled={isLoading}
                onMouseOver={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = colors.gray100;
                  }
                }}
                onMouseOut={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                Отмена
              </button>
              <button
                style={styles.modalButtonDelete}
                onClick={handleDeleteConfirm}
                disabled={isLoading}
                onMouseOver={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = colors.errorDark;
                  }
                }}
                onMouseOut={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = colors.error;
                  }
                }}
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
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
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
        
        .friends-widget button:focus {
          outline: none !important;
        }
        
        .friends-widget-content::-webkit-scrollbar {
          width: 6px;
        }
        
        .friends-widget-content::-webkit-scrollbar-track {
          background: #f9fafb;
          border-radius: 3px;
        }
        
        .friends-widget-content::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 3px;
        }
        
        .friends-widget-content::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
};

export default FriendsWidget;
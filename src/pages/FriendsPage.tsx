import React, { useState, useEffect } from 'react';
import { useFriends } from '../context/FriendsContext';
import { theme } from '../styles/theme';

type TabType = 'friends' | 'incoming' | 'outgoing' | 'add';

interface DeleteModalState {
  isOpen: boolean;
  itemId: string | null;
  itemName: string | null;
  actionType: 'removeFriend' | 'declineInvite' | 'declineOutgoing' | null;
}

export const FriendsPage = () => {
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

  const { colors, typography, spacing, borderRadius, shadows, transitions } = theme;

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
      <div style={paginationContainerStyle}>
        <button
          style={getPaginationButtonStyle(!hasPrevPage || disabled)}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrevPage || disabled}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span style={pageInfoStyle}>
          {currentPage} из {totalPages}
        </span>
        <button
          style={getPaginationButtonStyle(!hasNextPage || disabled)}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage || disabled}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    );
  };

  const renderAvatar = (name: string, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeMap = { sm: 32, md: 40, lg: 48 };
    const fontSizeMap = { sm: 12, md: 14, lg: 18 };
    
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

  const renderFriendsList = () => {
    return (
      <div>
        <div style={sectionHeaderStyle}>
          <div>
            <h2 style={sectionTitleStyle}>Мои друзья</h2>
            <p style={sectionDescriptionStyle}>
              {friendsTotalCount} {friendsTotalCount === 1 ? 'друг' : friendsTotalCount < 5 ? 'друга' : 'друзей'}
            </p>
          </div>
        </div>
        
        {friendsList.length === 0 ? (
          <div style={emptyStateStyle}>
            <div style={emptyStateIconStyle}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={colors.gray400} strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 style={emptyStateTitleStyle}>Пока нет друзей</h3>
            <p style={emptyStateDescriptionStyle}>
              Добавьте друзей, чтобы видеть их здесь
            </p>
            <button
              style={emptyStateButtonStyle}
              onClick={() => setActiveTab('add')}
            >
              Добавить друга
            </button>
          </div>
        ) : (
          <div style={listStyle}>
            {friendsList.map((friend) => (
              <div key={friend.friendId} style={listItemStyle}>
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
                  style={getActionButtonStyle('danger', isLoading)}
                  onClick={() => handleRemoveFriendClick(friend.friendId, getFriendName(friend))}
                  disabled={isLoading}
                  title="Удалить из друзей"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {renderPagination(friendsPage, friendsTotalPages, handleFriendsPageChange, isLoading)}
      </div>
    );
  };

  const renderIncomingInvites = () => (
    <div>
      <div style={sectionHeaderStyle}>
        <div>
          <h2 style={sectionTitleStyle}>Входящие заявки</h2>
          <p style={sectionDescriptionStyle}>
            {incomingTotalCount} {incomingTotalCount === 1 ? 'заявка' : incomingTotalCount < 5 ? 'заявки' : 'заявок'} в друзья
          </p>
        </div>
      </div>
      
      {incomingList.length === 0 ? (
        <div style={emptyStateStyle}>
          <div style={emptyStateIconStyle}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={colors.gray400} strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
            </svg>
          </div>
          <h3 style={emptyStateTitleStyle}>Нет входящих заявок</h3>
          <p style={emptyStateDescriptionStyle}>
            Когда кто-то добавит вас в друзья, заявка появится здесь
          </p>
        </div>
      ) : (
        <div style={listStyle}>
          {incomingList.map((invite) => (
            <div key={invite.id} style={listItemStyle}>
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
              <div style={actionButtonsStyle}>
                <button
                  style={getActionButtonStyle('success', isLoading || isRefreshingAll)}
                  onClick={() => handleAcceptInvite(invite.id)}
                  disabled={isLoading || isRefreshingAll}
                  title="Принять"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </button>
                <button
                  style={getActionButtonStyle('danger', isLoading || isRefreshingAll)}
                  onClick={() => handleDeclineInviteClick(invite.id, getInviteName(invite, true))}
                  disabled={isLoading || isRefreshingAll}
                  title="Отклонить"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {renderPagination(incomingPage, incomingTotalPages, handleIncomingPageChange, isLoading || isRefreshingAll)}
    </div>
  );

  const renderOutgoingInvites = () => (
    <div>
      <div style={sectionHeaderStyle}>
        <div>
          <h2 style={sectionTitleStyle}>Исходящие заявки</h2>
          <p style={sectionDescriptionStyle}>
            {outgoingTotalCount} {outgoingTotalCount === 1 ? 'заявка' : outgoingTotalCount < 5 ? 'заявки' : 'заявок'} ожидает подтверждения
          </p>
        </div>
      </div>
      
      {outgoingList.length === 0 ? (
        <div style={emptyStateStyle}>
          <div style={emptyStateIconStyle}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={colors.gray400} strokeWidth="1.5">
              <path d="M12 19l7-7 3 3-7 7-3-3z" />
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
              <path d="M2 2l7.586 7.586" />
              <circle cx="11" cy="11" r="2" />
            </svg>
          </div>
          <h3 style={emptyStateTitleStyle}>Нет исходящих заявок</h3>
          <p style={emptyStateDescriptionStyle}>
            Отправленные вами заявки появятся здесь
          </p>
        </div>
      ) : (
        <div style={listStyle}>
          {outgoingList.map((invite) => (
            <div key={invite.id} style={listItemStyle}>
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                  <line x1="18" y1="9" x2="12" y2="15" />
                  <line x1="12" y1="9" x2="18" y2="15" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {renderPagination(outgoingPage, outgoingTotalPages, handleOutgoingPageChange, isLoading)}
    </div>
  );

  const renderAddFriend = () => (
    <div style={addFriendContainerStyle}>
      <div style={addFriendHeaderStyle}>
        <h2 style={sectionTitleStyle}>Добавить друга</h2>
        <p style={sectionDescriptionStyle}>
          Введите имя пользователя, чтобы отправить заявку в друзья
        </p>
      </div>
      
      <form onSubmit={handleSendRequest} style={addFriendFormStyle}>
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
          style={{ 
            ...getPrimaryButtonStyle(isLoading || !usernameInput.trim()), 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm,
          }}
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

  const getPrimaryButtonStyle = (disabled: boolean = false): React.CSSProperties => ({
    width: '100%',
    padding: `${spacing.md} ${spacing.lg}`,
    borderRadius: borderRadius.md,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    backgroundColor: disabled ? colors.gray300 : colors.primary,
    color: colors.white,
    border: 'none',
    transition: `all ${transitions.normal}`,
    opacity: disabled ? 0.6 : 1,
    outline: 'none',
  });

  const getActionButtonStyle = (variant: 'primary' | 'success' | 'danger' | 'secondary', disabled: boolean = false): React.CSSProperties => ({
    width: '40px',
    height: '40px',
    borderRadius: borderRadius.md,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: disabled ? colors.gray200 
      : variant === 'success' ? colors.success 
      : variant === 'danger' ? colors.error 
      : variant === 'primary' ? colors.primary
      : colors.gray100,
    color: disabled ? colors.gray400 
      : variant === 'secondary' ? colors.gray600 
      : colors.white,
    border: variant === 'secondary' ? `1px solid ${colors.gray300}` : 'none',
    transition: `all ${transitions.fast}`,
    opacity: disabled ? 0.6 : 1,
    outline: 'none',
  });

  const getPaginationButtonStyle = (disabled: boolean = false): React.CSSProperties => ({
    width: '36px',
    height: '36px',
    borderRadius: borderRadius.md,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: disabled ? colors.gray100 : colors.white,
    color: disabled ? colors.gray400 : colors.gray700,
    border: `1px solid ${disabled ? colors.gray200 : colors.gray300}`,
    transition: `all ${transitions.fast}`,
    outline: 'none',
  });

  // ==================== STYLES ====================

  const containerStyle: React.CSSProperties = {
    minHeight: '100%',
    padding: 0,
  };

  const tabsContainerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
    borderBottom: `1px solid ${colors.gray200}`,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  };

  const tabsStyle: React.CSSProperties = {
    display: 'flex',
    gap: spacing.xs,
  };

  const getTabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: `${spacing.sm} ${spacing.lg}`,
    border: 'none',
    background: 'transparent',
    borderRadius: borderRadius.md,
    cursor: 'pointer',
    fontWeight: isActive ? typography.fontWeight.semibold : typography.fontWeight.normal,
    fontSize: typography.fontSize.sm,
    transition: `all ${transitions.normal}`,
    color: isActive ? colors.primary : colors.gray500,
    outline: 'none',
    backgroundColor: isActive ? colors.gray50 : 'transparent',
  });

  const getBadgeStyle = (count: number): React.CSSProperties => ({
    backgroundColor: count > 0 ? colors.error : colors.gray300,
    color: colors.white,
    borderRadius: borderRadius.full,
    padding: `${spacing.xs} ${spacing.sm}`,
    fontSize: typography.fontSize.xs,
    marginLeft: spacing.xs,
    fontWeight: typography.fontWeight.semibold,
    minWidth: '20px',
    textAlign: 'center',
  });

  const refreshButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.sm} ${spacing.lg}`,
    backgroundColor: colors.primary,
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: isRefreshingAll ? 'not-allowed' : 'pointer',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
    transition: `all ${transitions.normal}`,
    outline: 'none',
    opacity: isRefreshingAll ? 0.7 : 1,
    boxShadow: shadows.sm,
  };

  const refreshIconStyle = (isRefreshing: boolean): React.CSSProperties => ({
    width: '18px',
    height: '18px',
    display: 'inline-block',
    animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none',
  });

  const contentStyle: React.CSSProperties = {
    flex: 1,
  };

  const sectionHeaderStyle: React.CSSProperties = {
    marginBottom: spacing.lg,
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

  const listItemLeftStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    minWidth: 0,
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
  };

  const listItemMetaStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
  };

  const listItemDescriptionStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
  };

  const actionButtonsStyle: React.CSSProperties = {
    display: 'flex',
    gap: spacing.xs,
    flexShrink: 0,
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
    fontSize: typography.fontSize.sm,
    color: colors.gray900,
    backgroundColor: 'transparent',
  };

  const addFriendContainerStyle: React.CSSProperties = {
    maxWidth: '500px',
  };

  const addFriendHeaderStyle: React.CSSProperties = {
    marginBottom: spacing.xl,
  };

  const addFriendFormStyle: React.CSSProperties = {
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    boxShadow: shadows.sm,
    border: `1px solid ${colors.gray200}`,
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
  });

  const emptyStateStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: `${spacing['2xl']} ${spacing.xl}`,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    border: `1px solid ${colors.gray200}`,
  };

  const emptyStateIconStyle: React.CSSProperties = {
    marginBottom: spacing.lg,
  };

  const emptyStateTitleStyle: React.CSSProperties = {
    margin: `0 0 ${spacing.sm} 0`,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray700,
  };

  const emptyStateDescriptionStyle: React.CSSProperties = {
    margin: `0 0 ${spacing.lg} 0`,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    maxWidth: '400px',
    marginLeft: 'auto',
    marginRight: 'auto',
  };

  const emptyStateButtonStyle: React.CSSProperties = {
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

  const paginationContainerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
  };

  const pageInfoStyle: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    minWidth: '100px',
    textAlign: 'center',
    fontWeight: typography.fontWeight.medium,
  };

  const loadingStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: spacing['2xl'],
    color: colors.gray400,
    fontSize: typography.fontSize.sm,
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

  const modalItemNameStyle: React.CSSProperties = {
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

  return (
    <div style={containerStyle}>
      <div style={tabsContainerStyle}>
        <div style={tabsStyle}>
          <button
            style={getTabStyle(activeTab === 'friends')}
            onClick={() => setActiveTab('friends')}
          >
            Мои друзья
            {friendsTotalCount > 0 && (
              <span style={{...getBadgeStyle(friendsTotalCount), backgroundColor: colors.primary, marginLeft: spacing.sm}}>
                {friendsTotalCount}
              </span>
            )}
          </button>
          <button
            style={getTabStyle(activeTab === 'incoming')}
            onClick={() => setActiveTab('incoming')}
          >
            Входящие
            {incomingTotalCount > 0 && (
              <span style={getBadgeStyle(incomingTotalCount)}>{incomingTotalCount}</span>
            )}
          </button>
          <button
            style={getTabStyle(activeTab === 'outgoing')}
            onClick={() => setActiveTab('outgoing')}
          >
            Исходящие
            {outgoingTotalCount > 0 && (
              <span style={getBadgeStyle(outgoingTotalCount)}>{outgoingTotalCount}</span>
            )}
          </button>
          <button
            style={getTabStyle(activeTab === 'add')}
            onClick={() => setActiveTab('add')}
          >
            Добавить
          </button>
        </div>
        
        <button
          onClick={handleRefreshAll}
          disabled={isRefreshingAll}
          style={refreshButtonStyle}
          title="Обновить все данные"
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
          {isRefreshingAll ? 'Обновление...' : 'Обновить'}
        </button>
      </div>
      
      <div style={contentStyle}>
        {notification && (
          <div style={getNotificationStyle(notification.type)}>
            <span>
              {notification.type === 'success' && '✓ '}
              {notification.type === 'error' && '! '}
              {notification.type === 'info' && 'i '}
              {notification.message}
            </span>
            <button
              onClick={clearNotification}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '0 4px', color: 'inherit', outline: 'none' }}
            >
              ×
            </button>
          </div>
        )}
        
        {!notification && error && (
          <div style={errorStyle}>
            <span>! {getErrorMessage()}</span>
            <button
              onClick={clearError}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '18px', padding: '0 4px', outline: 'none' }}
            >
              ×
            </button>
          </div>
        )}
        
        {isLoading && !isRefreshingAll && (
          <div style={loadingStyle}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={colors.gray300} strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
            <p style={{ marginTop: spacing.md, color: colors.gray500 }}>Загрузка...</p>
          </div>
        )}
        
        {!isLoading && activeTab === 'friends' && renderFriendsList()}
        {!isLoading && activeTab === 'incoming' && renderIncomingInvites()}
        {!isLoading && activeTab === 'outgoing' && renderOutgoingInvites()}
        {!isLoading && activeTab === 'add' && renderAddFriend()}
      </div>

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
      `}</style>
    </div>
  );
};

export default FriendsPage;
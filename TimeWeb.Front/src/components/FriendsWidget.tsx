import React, { useState, useEffect } from 'react';
import { useFriends } from './FriendsContext';
import { theme } from '../styles/theme';

type TabType = 'friends' | 'incoming' | 'outgoing' | 'add';

export const FriendsWidget = () => {
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [usernameInput, setUsernameInput] = useState('');
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  
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

  const handleDeclineInvite = async (inviteId: string) => {
    try {
      await declineInvite(inviteId);
    } catch (err) {
      console.error('Failed to decline invite:', err);
    }
  };

  const handleDeclineOutgoingInvite = async (inviteId: string) => {
    try {
      await declineOutgoingInvite(inviteId);
    } catch (err) {
      console.error('Failed to decline outgoing invite:', err);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      await removeFriend(friendId);
    } catch (err) {
      console.error('Failed to remove friend:', err);
    }
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
      return `Пользователь (${invite.initiatorId?.substring(0, 8)}...)`;
    } else {
      return `Пользователь (${invite.recipientId?.substring(0, 8)}...)`;
    }
  };

  const getFriendName = (friend: any) => {
    if (!friend) return 'Неизвестно';
    return `Друг (${friend.friendId?.substring(0, 8)}...)`;
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
                onClick={() => handleRemoveFriend(friend.friendId)}
                disabled={isLoading}
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
                ID: {invite.initiatorId?.substring(0, 8)}...
              </div>
            </div>
            <div style={styles.buttonGroup}>
              <button
                style={styles.button('success', isLoading || isRefreshingAll)}
                onClick={() => handleAcceptInvite(invite.id)}
                disabled={isLoading || isRefreshingAll}
                title="Принять"
              >
                ✓
              </button>
              <button
                style={styles.button('danger', isLoading || isRefreshingAll)}
                onClick={() => handleDeclineInvite(invite.id)}
                disabled={isLoading || isRefreshingAll}
                title="Отклонить"
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
                ID: {invite.recipientId?.substring(0, 8)}...
              </div>
            </div>
            <button
              style={styles.button('secondary', isLoading)}
              onClick={() => handleDeclineOutgoingInvite(invite.id)}
              disabled={isLoading}
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
        >
          {isLoading ? 'Отправка...' : 'Отправить заявку'}
        </button>
      </form>
    </div>
  );

  return (
    <div style={styles.widget}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span>👥</span>
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
            ⏳ Загрузка...
          </div>
        )}
        
        {!isLoading && activeTab === 'friends' && renderFriendsList()}
        {!isLoading && activeTab === 'incoming' && renderIncomingInvites()}
        {!isLoading && activeTab === 'outgoing' && renderOutgoingInvites()}
        {!isLoading && activeTab === 'add' && renderAddFriend()}
      </div>
      
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
        
        .friends-widget button:focus {
          outline: none !important;
        }
        
        /* ✅ Кастомный скроллбар для контента виджета */
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
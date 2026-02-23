import React, { useState, useEffect } from 'react';
import { useFriends } from './FriendsContext';

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

  const styles = {
    widget: {
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      backgroundColor: '#fff',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      width: '100%',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflow: 'hidden',
    } as React.CSSProperties,
    header: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '14px 18px',
      fontSize: '16px',
      fontWeight: 600,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    } as React.CSSProperties,
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    } as React.CSSProperties,
    headerButton: {
      background: 'rgba(255, 255, 255, 0.15)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '8px',
      padding: '6px 14px',
      color: 'white',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: 500,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s',
      backdropFilter: 'blur(4px)',
    } as React.CSSProperties,
    tabs: {
      display: 'flex',
      borderBottom: '1px solid #e0e0e0',
      backgroundColor: '#fafafa',
    } as React.CSSProperties,
    tab: (isActive: boolean) => ({
      flex: 1,
      padding: '12px 8px',
      border: 'none',
      background: isActive ? 'white' : 'transparent',
      borderBottom: isActive ? '2px solid #667eea' : '2px solid transparent',
      cursor: 'pointer',
      fontWeight: isActive ? 600 : 400,
      fontSize: '13px',
      transition: 'all 0.2s',
      color: isActive ? '#667eea' : '#666',
    } as React.CSSProperties),
    content: {
      padding: '16px',
      maxHeight: '400px',
      overflowY: 'auto' as const,
    } as React.CSSProperties,
    item: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px',
      borderBottom: '1px solid #f0f0f0',
      transition: 'background 0.2s',
    } as React.CSSProperties,
    itemName: {
      fontWeight: 500,
      fontSize: '14px',
      color: '#333',
    } as React.CSSProperties,
    itemMeta: {
      fontSize: '11px',
      color: '#888',
      marginTop: '4px',
    } as React.CSSProperties,
    buttonGroup: {
      display: 'flex',
      gap: '6px',
    } as React.CSSProperties,
    button: (variant: 'primary' | 'success' | 'danger' | 'secondary' | 'pagination', disabled: boolean = false) => ({
      padding: variant === 'pagination' ? '6px 12px' : '6px 10px',
      borderRadius: '4px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: '12px',
      fontWeight: 500,
      backgroundColor: disabled ? '#ccc' 
        : variant === 'primary' ? '#667eea' 
        : variant === 'success' ? '#28a745' 
        : variant === 'danger' ? '#dc3545' 
        : variant === 'pagination' ? '#f8f9fa'
        : '#6c757d',
      color: variant === 'pagination' ? '#333' : 'white',
      border: variant === 'pagination' ? '1px solid #ddd' : 'none',
      transition: 'all 0.2s',
      opacity: disabled ? 0.6 : 1,
    } as React.CSSProperties),
    input: {
      width: '100%',
      padding: '10px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '14px',
      marginBottom: '10px',
      boxSizing: 'border-box' as const,
    } as React.CSSProperties,
    error: {
      color: '#dc3545',
      fontSize: '12px',
      padding: '8px',
      backgroundColor: '#ffe6e6',
      borderRadius: '4px',
      marginBottom: '12px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    } as React.CSSProperties,
    notification: (type: 'success' | 'error' | 'info') => ({
      padding: '10px 14px',
      borderRadius: '6px',
      marginBottom: '12px',
      fontSize: '13px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '10px',
      backgroundColor: type === 'success' ? '#d4edda' 
        : type === 'error' ? '#f8d7da' 
        : '#d1ecf1',
      color: type === 'success' ? '#155724' 
        : type === 'error' ? '#721c24' 
        : '#0c5460',
      border: `1px solid ${type === 'success' ? '#c3e6cb' 
        : type === 'error' ? '#f5c6cb' 
        : '#bee5eb'}`,
    } as React.CSSProperties),
    empty: {
      textAlign: 'center' as const,
      color: '#888',
      padding: '30px 10px',
      fontSize: '14px',
    } as React.CSSProperties,
    badge: (count: number) => ({
      backgroundColor: count > 0 ? '#dc3545' : '#e0e0e0',
      color: count > 0 ? 'white' : '#888',
      borderRadius: '10px',
      padding: '2px 6px',
      fontSize: '11px',
      marginLeft: '6px',
      fontWeight: 600,
    } as React.CSSProperties),
    loading: {
      textAlign: 'center' as const,
      padding: '30px',
      color: '#888',
      fontSize: '14px',
    } as React.CSSProperties,
    sectionHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '12px',
    } as React.CSSProperties,
    paginationContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '10px',
      marginTop: '16px',
      paddingTop: '12px',
      borderTop: '1px solid #f0f0f0',
    } as React.CSSProperties,
    pageInfo: {
      fontSize: '12px',
      color: '#666',
      minWidth: '80px',
      textAlign: 'center' as const,
    } as React.CSSProperties,
    refreshIcon: (isRefreshing: boolean) => ({
      width: '16px',
      height: '16px',
      display: 'inline-block',
      animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none',
    } as React.CSSProperties),
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
          <h3 style={{ margin: 0, fontSize: '15px', color: '#333' }}>Друзья</h3>
          <span style={{ fontSize: '12px', color: '#888' }}>
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
        <h3 style={{ margin: 0, fontSize: '15px', color: '#333' }}>Входящие заявки</h3>
        <span style={{ fontSize: '12px', color: '#888' }}>{incomingTotalCount}</span>
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
              >
                ✓
              </button>
              <button
                style={styles.button('danger', isLoading || isRefreshingAll)}
                onClick={() => handleDeclineInvite(invite.id)}
                disabled={isLoading || isRefreshingAll}
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
        <h3 style={{ margin: 0, fontSize: '15px', color: '#333' }}>Исходящие заявки</h3>
        <span style={{ fontSize: '12px', color: '#888' }}>{outgoingTotalCount}</span>
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
      <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#333' }}>
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
        />
        <button
          type="submit"
          style={{ ...styles.button('primary', isLoading || !usernameInput.trim()), width: '100%' }}
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
          <span>👥 Друзья</span>
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
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '0 4px' }}
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
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc3545', fontSize: '16px', padding: '0 4px' }}
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
      `}</style>
    </div>
  );
};
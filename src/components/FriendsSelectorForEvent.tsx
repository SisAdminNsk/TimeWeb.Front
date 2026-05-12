import React, { useState, useEffect, useMemo } from 'react';
import { useFriends } from '../context/FriendsContext';
import { theme } from '../styles/theme';
import type { FriendshipDto } from '../api/friends/FriendsContracts';

interface FriendsSelectorForEventProps {
  existingParticipantIds: string[];
  onConfirm: (friendId: string) => void;
  onCancel: () => void;
}

export const FriendsSelectorForEvent: React.FC<FriendsSelectorForEventProps> = ({
  existingParticipantIds,
  onConfirm,
  onCancel,
}) => {
  const { friends, isLoading, refreshFriends, pageSize } = useFriends();
  const { colors, typography, spacing, borderRadius, shadows, transitions } = theme;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    refreshFriends(1);
  }, [refreshFriends]);

  const availableFriends = useMemo(() => {
    return friends
      .filter((friend: FriendshipDto) => !existingParticipantIds.includes(friend.friendId))
      .map((friend: FriendshipDto) => ({
        id: friend.friendId,
        username: friend.friendName || 'Неизвестно',
      }));
  }, [friends, existingParticipantIds]);

  const filteredFriends = useMemo(() => {
    return availableFriends.filter(friend =>
      friend.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [availableFriends, searchQuery]);

  const paginatedFriends = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredFriends.slice(start, start + pageSize);
  }, [filteredFriends, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredFriends.length / pageSize);

  const handleConfirm = () => {
    if (selectedFriendId) {
      onConfirm(selectedFriendId);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };

  const styles = {
    overlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2002,
      animation: 'fadeIn 0.2s ease',
      padding: spacing.md,
    },
    modal: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.xl,
      boxShadow: shadows.xl,
      width: '100%',
      maxWidth: '400px',
      maxHeight: '80vh',
      display: 'flex',
      flexDirection: 'column' as const,
      animation: 'slideIn 0.2s ease',
    },
    header: {
      padding: spacing.lg,
      borderBottom: `1px solid ${colors.gray200}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      margin: 0,
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.semibold,
      color: colors.gray900,
    },
    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: typography.fontSize.xl,
      cursor: 'pointer',
      color: colors.gray500,
      padding: spacing.xs,
      borderRadius: borderRadius.md,
      transition: `all ${transitions.fast}`,
    },
    searchContainer: {
      padding: spacing.md,
      borderBottom: `1px solid ${colors.gray200}`,
    },
    searchInput: {
      width: '100%',
      padding: `${spacing.sm} ${spacing.md}`,
      border: `1px solid ${colors.gray300}`,
      borderRadius: borderRadius.md,
      fontSize: typography.fontSize.sm,
      boxSizing: 'border-box' as const,
      fontFamily: 'inherit',
      color: colors.gray900,
      '&:focus': {
        outline: 'none',
        borderColor: colors.primary,
        boxShadow: `0 0 0 3px ${colors.primary}20`,
      },
    },
    list: {
      padding: spacing.md,
      overflowY: 'auto' as const,
      flex: 1,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: spacing.xs,
    },
    friendItem: (isSelected: boolean): React.CSSProperties => ({
      display: 'flex',
      alignItems: 'center',
      padding: `${spacing.sm} ${spacing.md}`,
      borderRadius: borderRadius.md,
      cursor: 'pointer',
      transition: `all ${transitions.fast}`,
      border: `1px solid ${isSelected ? colors.primary : 'transparent'}`,
      backgroundColor: isSelected ? colors.primary + '15' : 'transparent',
    }),
    radio: {
      width: '18px',
      height: '18px',
      marginRight: spacing.sm,
      cursor: 'pointer',
      accentColor: colors.primary,
    },
    friendAvatar: {
      width: '32px',
      height: '32px',
      borderRadius: borderRadius.full,
      backgroundColor: colors.primary,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: colors.white,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
      marginRight: spacing.sm,
      flexShrink: 0,
    },
    friendInfo: {
      flex: 1,
      minWidth: 0,
    },
    friendName: {
      fontSize: typography.fontSize.sm,
      color: colors.gray900,
      fontWeight: typography.fontWeight.medium,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    emptyState: {
      padding: spacing.xl,
      textAlign: 'center' as const,
      color: colors.gray500,
      fontSize: typography.fontSize.sm,
    },
    pagination: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.sm,
      padding: `${spacing.sm} ${spacing.md}`,
      borderTop: `1px solid ${colors.gray200}`,
    },
    pageButton: (disabled: boolean): React.CSSProperties => ({
      padding: `${spacing.xs} ${spacing.sm}`,
      borderRadius: borderRadius.sm,
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.medium,
      backgroundColor: disabled ? colors.gray300 : colors.gray50,
      color: disabled ? colors.gray500 : colors.gray700,
      border: `1px solid ${colors.gray300}`,
      transition: `all ${transitions.normal}`,
      opacity: disabled ? 0.6 : 1,
    }),
    pageInfo: {
      fontSize: typography.fontSize.xs,
      color: colors.gray500,
    },
    footer: {
      padding: spacing.lg,
      borderTop: `1px solid ${colors.gray200}`,
      display: 'flex',
      justifyContent: 'flex-end',
      gap: spacing.sm,
      backgroundColor: colors.gray50,
    },
    button: (variant: 'primary' | 'secondary', disabled: boolean = false): React.CSSProperties => ({
      padding: `${spacing.sm} ${spacing.lg}`,
      borderRadius: borderRadius.md,
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      backgroundColor: disabled 
        ? colors.gray300 
        : variant === 'primary' ? colors.primary : colors.gray200,
      color: variant === 'primary' ? colors.white : colors.gray700,
      border: 'none',
      transition: `all ${transitions.normal}`,
      opacity: disabled ? 0.6 : 1,
    }),
  };

  return (
    <>
      <div style={styles.overlay} onClick={onCancel}>
        <div style={styles.modal} onClick={e => e.stopPropagation()}>
          <div style={styles.header}>
            <h3 style={styles.title}>Пригласить участника</h3>
            <button
              style={styles.closeButton}
              onClick={onCancel}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = colors.gray200}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              ✕
            </button>
          </div>

          <div style={styles.searchContainer}>
            <input
              type="text"
              placeholder="Поиск по имени..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
              autoFocus
            />
          </div>

          <div style={styles.list}>
            {isLoading && currentPage === 1 ? (
              <div style={styles.emptyState}>Загрузка друзей...</div>
            ) : paginatedFriends.length === 0 ? (
              <div style={styles.emptyState}>
                {searchQuery 
                  ? 'Никто не найден' 
                  : availableFriends.length === 0 
                    ? 'Все друзья уже участвуют во встрече' 
                    : 'Нет доступных друзей для приглашения'}
              </div>
            ) : (
              paginatedFriends.map(friend => (
                <div
                  key={friend.id}
                  style={styles.friendItem(selectedFriendId === friend.id)}
                  onClick={() => setSelectedFriendId(friend.id)}
                  onMouseOver={(e) => {
                    if (selectedFriendId !== friend.id) {
                      e.currentTarget.style.backgroundColor = colors.gray100;
                    }
                  }}
                  onMouseOut={(e) => {
                    if (selectedFriendId !== friend.id) {
                      e.currentTarget.style.backgroundColor = selectedFriendId === friend.id 
                        ? colors.primary + '15' 
                        : 'transparent';
                    }
                  }}
                >
                  <input
                    type="radio"
                    name="friend-select"
                    checked={selectedFriendId === friend.id}
                    onChange={() => setSelectedFriendId(friend.id)}
                    style={styles.radio}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div style={styles.friendAvatar}>
                    {friend.username.charAt(0).toUpperCase()}
                  </div>
                  <div style={styles.friendInfo}>
                    <span style={styles.friendName}>{friend.username}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div style={styles.pagination}>
              <button
                style={styles.pageButton(currentPage === 1)}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ← Назад
              </button>
              <span style={styles.pageInfo}>
                Стр. {currentPage} из {totalPages}
              </span>
              <button
                style={styles.pageButton(currentPage === totalPages)}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Вперед →
              </button>
            </div>
          )}

          <div style={styles.footer}>
            <button
              style={styles.button('secondary')}
              onClick={onCancel}
            >
              Отмена
            </button>
            <button
              style={styles.button('primary', !selectedFriendId)}
              onClick={handleConfirm}
              disabled={!selectedFriendId}
            >
              Пригласить
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
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
      `}</style>
    </>
  );
};
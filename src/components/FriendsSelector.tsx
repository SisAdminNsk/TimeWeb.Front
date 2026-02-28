import React, { useState, useEffect } from 'react';
import { useFriends } from '../context/FriendsContext';
import { theme } from '../styles/theme';
import type { FriendshipDto } from '../api/friends/FriendsContracts';

interface FriendsSelectorProps {
  selectedFriendIds: string[];
  onSelectionChange: (friendIds: string[]) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const FriendsSelector: React.FC<FriendsSelectorProps> = ({
  selectedFriendIds,
  onSelectionChange,
  onConfirm,
  onCancel,
}) => {
  const { friends, isLoading, refreshFriends, friendsTotalCount, pageSize } = useFriends();
  const { colors, typography, spacing, borderRadius, transitions } = theme;
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedFriendIds);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    refreshFriends(1);
  }, []);

  useEffect(() => {
    setLocalSelectedIds(selectedFriendIds);
  }, [selectedFriendIds]);

  const totalPages = Math.ceil(friendsTotalCount / pageSize);

  const toggleFriend = (friendId: string) => {
    setLocalSelectedIds(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleConfirm = () => {
    onSelectionChange(localSelectedIds);
    onConfirm();
  };

  const handlePageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    await refreshFriends(newPage);
  };

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      height: '100%',
      maxHeight: '400px',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: `${spacing.md} ${spacing.lg}`,
      borderBottom: `1px solid ${colors.gray200}`,
      backgroundColor: colors.gray50,
    },
    title: {
      margin: 0,
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.semibold,
      color: colors.gray900,
    },
    selectedCount: {
      fontSize: typography.fontSize.xs,
      color: colors.primaryDark,
      backgroundColor: colors.primaryLight + '30',
      padding: `${spacing.xs} ${spacing.sm}`,
      borderRadius: borderRadius.full,
    },
    friendsList: {
      flex: 1,
      overflowY: 'auto' as const,
      border: `1px solid ${colors.gray200}`,
      borderRadius: borderRadius.md,
      margin: spacing.md,
    },
    friendItem: (isSelected: boolean): React.CSSProperties => ({
      display: 'flex',
      alignItems: 'center',
      padding: `${spacing.sm} ${spacing.md}`,
      borderBottom: `1px solid ${colors.gray100}`,
      cursor: 'pointer',
      transition: `all ${transitions.fast}`,
      backgroundColor: isSelected ? colors.primaryLight + '20' : 'transparent',
    }),
    checkbox: {
      width: '18px',
      height: '18px',
      marginRight: spacing.sm,
      cursor: 'pointer',
    },
    friendName: {
      fontSize: typography.fontSize.sm,
      color: colors.gray900,
      flex: 1,
    },
    friendMeta: {
      fontSize: typography.fontSize.xs,
      color: colors.gray400,
    },
    empty: {
      textAlign: 'center' as const,
      color: colors.gray400,
      padding: `${spacing.xl} ${spacing.md}`,
      fontSize: typography.fontSize.sm,
    },
    loading: {
      textAlign: 'center' as const,
      padding: spacing.xl,
      color: colors.gray400,
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
      display: 'flex',
      justifyContent: 'flex-end',
      gap: spacing.sm,
      padding: `${spacing.md} ${spacing.lg}`,
      borderTop: `1px solid ${colors.gray200}`,
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
    <div style={styles.container}>
      <div style={styles.header}>
        <h4 style={styles.title}>Выберите друзей</h4>
        <span style={styles.selectedCount}>
          Выбрано: {localSelectedIds.length}
        </span>
      </div>

      <div style={styles.friendsList}>
        {isLoading ? (
          <div style={styles.loading}>Загрузка...</div>
        ) : friends.length === 0 ? (
          <div style={styles.empty}>У вас пока нет друзей</div>
        ) : (
          friends.map((friend: FriendshipDto) => (
            <div
              key={friend.friendId}
              style={styles.friendItem(localSelectedIds.includes(friend.friendId))}
              onClick={() => toggleFriend(friend.friendId)}
            >
              <input
                type="checkbox"
                checked={localSelectedIds.includes(friend.friendId)}
                onChange={() => toggleFriend(friend.friendId)}
                style={styles.checkbox}
                disabled={isLoading}
                onClick={(e) => e.stopPropagation()}
              />
              <div style={{ flex: 1 }}>
                <div style={styles.friendName}>{friend.friendName || 'Неизвестно'}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            style={styles.pageButton(currentPage === 1 || isLoading)}
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
          >
            ← Назад
          </button>
          <span style={styles.pageInfo}>
            Стр. {currentPage} из {totalPages}
          </span>
          <button
            style={styles.pageButton(currentPage === totalPages || isLoading)}
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
          >
            Вперед →
          </button>
        </div>
      )}

      <div style={styles.footer}>
        <button
          style={styles.button('secondary')}
          onClick={onCancel}
          disabled={isLoading}
        >
          Отмена
        </button>
        <button
          style={styles.button('primary', isLoading)}
          onClick={handleConfirm}
          disabled={isLoading}
        >
          {isLoading ? 'Загрузка...' : 'Пригласить'}
        </button>
      </div>
    </div>
  );
};

export default FriendsSelector;
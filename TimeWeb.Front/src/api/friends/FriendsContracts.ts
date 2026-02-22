export interface SendFriendshipInviteRequest {
  recipientId: string;
}

export interface FriendshipInviteDto {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  status: 'Pending' | 'Accepted' | 'Declined';
  createdAt: string;
}

export interface FriendshipDto {
  id: string;
  userId: string;
  userName: string;
  friendId: string;
  friendName: string;
  status: 'Friends' | 'Pending' | 'Blocked';
  createdAt: string;
}

export interface GetFriendshipInviteListResponse {
  totalCount: number;
  friendshipInvites: FriendshipInviteDto[];
}

export interface GetFriendListResponse {
  totalCount: number;
  friends: FriendshipDto[];
}

export interface CheckFriendshipRequest {
  userIds: string[];
}

export interface CheckFriendshipResponse {
  friendIds: string[];
}
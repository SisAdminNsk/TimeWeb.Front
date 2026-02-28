export interface SendFriendshipInviteRequest {
  recipientId: string;
}

export interface FriendshipInviteDto {
  id: string;
  initiatorId: string;
  recipientId: string;
  initiatorName: string;
  recipientName: string;
  status: 'Pending' | 'Accepted' | 'Declined';
}

export interface FriendshipDto {
  friendId: string;
  friendName: string;
  friendshipStartDate: string;
}

export interface GetFriendshipInviteListResponse {
  totalCount: number;
  invites: FriendshipInviteDto[];
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
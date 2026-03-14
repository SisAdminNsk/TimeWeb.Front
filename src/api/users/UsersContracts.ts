export interface SignUpRequest {
  name: string;
  password: string;
}

export interface SignUpResponse {
  id: string;
  name: string;
}

export interface SignInRequest {
  username: string;
  password: string;
}

export interface SignInResponse {
  accessToken: string;
  refreshToken: string;
}

export interface CheckUserExistenceResponse{
  userId: string;
}

export interface UserDto{
  id: string,
  name: string,
  createdAt: string
}

export interface GetUserResponse{
  user: UserDto
}

export interface GetUsersRequest{
  usersIds: string[]
}

export interface GetUsersResponse{
  users: UserDto[]
}

export interface GetProfileResponse{
  profile: ProfileDto
}

export interface ProfileDto {
    userId: string;
    attributes: Record<string, string>;
}

export interface UpdateProfileRequest {
    profileAttributes: Record<string, string>;
}

export interface UpdateProfileResponse {
    profile: ProfileDto;
}

export interface RefreshTokenRequest{
  token: string;
}

export interface RefreshTokenResponse{
  refreshToken: string;
  accessToken: string;
}

export interface SessionDto{
  id: string,
  userId: string,
  isLogut: boolean,
  loginAt: string,
  logoutAt: string | null,
  expiresAt: string,
  logoutReason: string | null,
  ipAddress: string,
  userAgent: string
}

export interface GetLoginsResponse{
  totalCount: number,
  logins: SessionDto[]
}

export interface ChangePasswordRequest{
  oldPassword: string,
  newPassword: string
}

export const PROFILE_ATTRIBUTES = {
  Email: 'base/email',
  Birthdate: 'base/birthdate',
  Gender: 'base/gender',
} as const;

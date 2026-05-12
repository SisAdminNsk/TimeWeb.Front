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
  userId: string;
}

export interface CheckUserExistenceResponse{
  userId: string;
}

export interface UserDto{
  id: string,
  name: string,
  email: string | null,
  emailChangedDate: string | null,
  passwordChangedDate: string | null,
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

export interface GetUsersLastSeenRequest{
    userIds: string[]
}

export interface GetUsersLastSeenResponse{
    usersLastSeen: UserLastSeenDto[]
}

export interface UserLastSeenDto{
    userId: string,
    lastSeenAt: string | null
}

export interface RecoverAccountRequest{
  email: string,
  captchaToken: string,
}

export interface RecoverAccountResponse{
  verificationId: string
}

export interface EndRecoverAccountRequest{
  verificationId: string,
  confirmationCode: string
}

export interface EndRecoverAccountResponse{
  resetToken: string
}

export interface ResetPasswordRequest{
  resetToken: string,
  newPassword: string
}

export interface BindEmailRequest{
  newEmail: string
  accountPassword: string,
  captchaToken: string
}

export interface BindEmailResponse{
  verificationId: string
}

export interface EndBindEmailRequest{
  verificationId: string,
  confirmationCode: string
}

export interface EndBindEmailResponse{
  emailChangedDate: string
}
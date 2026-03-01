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
  token: string;
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

export const PROFILE_ATTRIBUTES = {
  Email: 'base/email',
  Birthdate: 'base/birthdate',
  Gender: 'base/gender',
} as const;

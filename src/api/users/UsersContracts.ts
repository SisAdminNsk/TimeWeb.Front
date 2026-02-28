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

export interface UserProfileDto{
  userId: string,
  birthdate: string | null,
  email: string | null,
  gender: string | null
}

export interface GetProfileResponse{
  profile: UserProfileDto
}

export interface UpdateProfileRequest{
  birthdate: string | null,
  email: string | null,
  gender: string | null
}

export interface UpdateProfileResponse{
  profile: UserProfileDto
}

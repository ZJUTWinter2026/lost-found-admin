export interface UserLoginRequest {
  username: string
  password: string
}

export interface UserLoginResponse {
  campus: string
  id: number
  name: string
  need_update: boolean
  token: string
  user_type: string
}

export interface UserUpdatePasswordRequest {
  new_password: string
  old_password: string
}

export interface UserUpdatePasswordResponse {
  token: string
}

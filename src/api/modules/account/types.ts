export interface AccountListRequest {
  page?: number
  page_size?: number
  username?: string
  user_type?: 'STUDENT' | 'ADMIN' | 'SYSTEM_ADMIN'
}

export interface AccountListItem {
  created_at: string
  disabled_until?: unknown
  first_login: boolean
  id: number
  name: string
  username: string | number
  user_type: string
}

export interface AccountListResponse {
  list: AccountListItem[]
  page: number
  page_size: number
  total: number
}

export interface CreateAccountRequest {
  campus?: 'ZHAO_HUI' | 'PING_FENG' | 'MO_GAN_SHAN'
  id_card: string
  name: string
  password?: string
  username: string
  user_type: 'STUDENT' | 'ADMIN' | 'SYSTEM_ADMIN'
}

export interface CreateAccountResponse {
  id: number
}

export interface DisableAccountRequest {
  duration: '7days' | '1month' | '6months' | '1year'
  id: number
}

export interface EnableAccountRequest {
  id: number
}

export interface UpdateAccountRequest {
  campus?: 'ZHAO_HUI' | 'PING_FENG' | 'MO_GAN_SHAN'
  id: number
  reset_password?: boolean
  user_type?: 'STUDENT' | 'ADMIN' | 'SYSTEM_ADMIN'
}

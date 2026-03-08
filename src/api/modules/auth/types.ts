import type { CampusName } from '@/api/shared/transforms'
import type { AdminRole } from '@/constants/admin-access'

export interface LoginRequest {
  employeeNo: string
  password: string
}

export interface LoginResponse {
  campus: CampusName | null
  employeeNo: string
  needUpdatePassword: boolean
  role: AdminRole
  token: string
  userId: number
}

export interface ForgotPasswordRequest {
  employeeNo: string
  idCard: string
}

export interface ForgotPasswordResponse {
  success: boolean
}

export interface ResetPasswordRequest {
  confirmPassword: string
  newPassword: string
  oldPassword: string
}

export interface ResetPasswordResponse {
  token: string
}

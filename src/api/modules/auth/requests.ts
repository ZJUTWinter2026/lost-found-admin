import type { ForgotPasswordRequest, ForgotPasswordResponse, LoginRequest, LoginResponse, ResetPasswordRequest, ResetPasswordResponse } from './types'
import { RequestError } from '@/api/core/errors'
import { userForgotPasswordRequest, userLoginRequest, userUpdatePasswordRequest } from '@/api/modules/user'
import { toAdminRole, toCampusName } from '@/api/shared/transforms'

export function loginRequest(payload: LoginRequest): Promise<LoginResponse> {
  return userLoginRequest({
    password: payload.password,
    username: payload.employeeNo.trim(),
  }).then((result) => {
    const role = toAdminRole(result.user_type)
    if (!role) {
      throw new RequestError('当前账号无管理端访问权限')
    }

    return {
      campus: toCampusName(result.campus),
      employeeNo: payload.employeeNo.trim(),
      needUpdatePassword: result.need_update,
      role,
      token: result.token ?? '',
      userId: result.id,
    }
  })
}

export function forgotPasswordRequest(payload: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
  return userForgotPasswordRequest({
    id_card: payload.idCard.trim().toUpperCase(),
    username: payload.employeeNo.trim(),
  })
}

export function resetPasswordRequest(payload: ResetPasswordRequest): Promise<ResetPasswordResponse> {
  if (payload.newPassword !== payload.confirmPassword) {
    throw new RequestError('两次输入的密码不一致')
  }

  return userUpdatePasswordRequest({
    new_password: payload.newPassword,
    old_password: payload.oldPassword,
  })
}

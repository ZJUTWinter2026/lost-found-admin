import { useMutation } from '@tanstack/react-query'
import { forgotPasswordRequest, loginRequest, resetPasswordRequest } from '@/api/modules/auth'

export function useLoginMutation() {
  return useMutation({
    mutationFn: loginRequest,
  })
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: forgotPasswordRequest,
  })
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: resetPasswordRequest,
  })
}

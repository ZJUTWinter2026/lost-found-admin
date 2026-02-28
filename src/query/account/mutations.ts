import { useMutation } from '@tanstack/react-query'
import { createAccount, disableAccount, enableAccount, updateAccount } from '@/api/modules/account'

export function useCreateAccountMutation() {
  return useMutation({
    mutationFn: createAccount,
  })
}

export function useDisableAccountMutation() {
  return useMutation({
    mutationFn: disableAccount,
  })
}

export function useEnableAccountMutation() {
  return useMutation({
    mutationFn: enableAccount,
  })
}

export function useUpdateAccountMutation() {
  return useMutation({
    mutationFn: updateAccount,
  })
}

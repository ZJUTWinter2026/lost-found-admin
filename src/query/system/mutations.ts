import { useMutation } from '@tanstack/react-query'
import { updateClaimValidityDays, updateFeedbackTypes, updateItemTypes, updatePublishLimit } from '@/api/modules/system'

export function useUpdateFeedbackTypesMutation() {
  return useMutation({
    mutationFn: updateFeedbackTypes,
  })
}

export function useUpdateItemTypesMutation() {
  return useMutation({
    mutationFn: updateItemTypes,
  })
}

export function useUpdateClaimValidityDaysMutation() {
  return useMutation({
    mutationFn: updateClaimValidityDays,
  })
}

export function useUpdatePublishLimitMutation() {
  return useMutation({
    mutationFn: updatePublishLimit,
  })
}

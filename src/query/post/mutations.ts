import { useMutation } from '@tanstack/react-query'
import { updatePost } from '@/api/modules/post'

export function useUpdatePostMutation() {
  return useMutation({
    mutationFn: updatePost,
  })
}

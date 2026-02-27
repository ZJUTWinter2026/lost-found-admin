import { useQuery } from '@tanstack/react-query'
import { getFeedbackDetail, getFeedbackList } from '@/api/modules/feedback'
import { queryKeys } from '@/query/query-keys'

export function useFeedbackListQuery() {
  return useQuery({
    queryFn: () => getFeedbackList({ page: 1, page_size: 20 }),
    queryKey: queryKeys.feedback.list(),
  })
}

export function useFeedbackDetailQuery(id?: number | null) {
  return useQuery({
    enabled: Boolean(id),
    queryFn: () => getFeedbackDetail(id as number),
    queryKey: queryKeys.feedback.detail(id),
  })
}

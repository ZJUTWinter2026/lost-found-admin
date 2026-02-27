import { useQuery } from '@tanstack/react-query'
import { getAdminPendingPostList, getAdminPostDetail, getAdminStatistics } from '@/api/modules/admin'
import { queryKeys } from '@/query/query-keys'

export function useAdminPendingListQuery() {
  return useQuery({
    queryFn: () => getAdminPendingPostList({ page: 1, page_size: 20 }),
    queryKey: queryKeys.admin.pendingList(),
  })
}

export function useAdminPendingDetailQuery(postId?: number | null) {
  return useQuery({
    enabled: Boolean(postId),
    queryFn: () => getAdminPostDetail(postId as number),
    queryKey: queryKeys.admin.pendingDetail(postId),
  })
}

export function useAdminStatisticsQuery(enabled = true) {
  return useQuery({
    enabled,
    queryFn: getAdminStatistics,
    queryKey: queryKeys.admin.statistics(),
  })
}

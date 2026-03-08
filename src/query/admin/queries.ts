import type {
  AdminExpiredListRequest,
  AdminPendingListRequest,
  AdminPostListRequest,
  AdminPublishedListRequest,
  AdminReviewRecordsRequest,
} from '@/api/modules/admin'
import type { PublishKind } from '@/api/shared/transforms'
import { useQuery } from '@tanstack/react-query'
import {
  getAdminExpiredList,
  getAdminPendingPostList,
  getAdminPostDetail,
  getAdminPostList,
  getAdminPublishedPostList,
  getAdminReviewRecords,
  getAdminStatistics,
} from '@/api/modules/admin'
import { queryKeys } from '@/query/query-keys'

type PendingListPageParams = Pick<AdminPendingListRequest, 'Page' | 'PageSize' | 'page' | 'page_size'>

export function useAdminPendingListQuery(publishType: PublishKind, params: PendingListPageParams = {}) {
  const page = params.page ?? params.Page ?? 1
  const pageSize = params.page_size ?? params.PageSize ?? 20

  return useQuery({
    queryFn: () => getAdminPendingPostList({
      page,
      page_size: pageSize,
      publish_type: publishType,
    }),
    queryKey: [...queryKeys.admin.pendingList(), publishType, page, pageSize],
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

export function useAdminPostListQuery(params: AdminPostListRequest, enabled = true) {
  return useQuery({
    enabled,
    queryFn: () => getAdminPostList(params),
    queryKey: queryKeys.admin.postList(params),
  })
}

export function useAdminPublishedListQuery(params: AdminPublishedListRequest, enabled = true) {
  return useQuery({
    enabled,
    queryFn: () => getAdminPublishedPostList(params),
    queryKey: [
      ...queryKeys.admin.publishedList(),
      params.publish_type,
      params.page ?? 1,
      params.page_size ?? 20,
    ],
  })
}

export function useAdminExpiredListQuery(params: AdminExpiredListRequest, enabled = true) {
  return useQuery({
    enabled,
    queryFn: () => getAdminExpiredList(params),
    queryKey: queryKeys.admin.expiredList(params),
  })
}

export function useAdminReviewRecordsQuery(params: AdminReviewRecordsRequest, enabled = true) {
  return useQuery({
    enabled,
    queryFn: () => getAdminReviewRecords(params),
    queryKey: queryKeys.admin.reviewRecords(params),
  })
}

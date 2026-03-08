import type {
  AdminArchivePostRequest,
  AdminExpiredCleanResponse,
  AdminExpiredListRequest,
  AdminExpiredListResponse,
  AdminExportResponse,
  AdminOperationResponse,
  AdminPendingListRequest,
  AdminPendingListResponse,
  AdminPostDetail,
  AdminPostListRequest,
  AdminPostListResponse,
  AdminPostOperationRequest,
  AdminPublishedListRequest,
  AdminRejectPostRequest,
  AdminReviewRecordsRequest,
  AdminReviewRecordsResponse,
  AdminStatisticsResponse,
} from './types'
import { request } from '@/api/core/request'
import { toCampusParam, toPublishTypeParam } from '@/api/shared/transforms'

export function getAdminPendingPostList(params: AdminPendingListRequest = {}) {
  const page = params.page ?? params.Page
  const pageSize = params.page_size ?? params.PageSize
  const publishType = params.type ?? params.Type ?? toPublishTypeParam(params.publish_type)

  return request<AdminPendingListResponse>({
    method: 'GET',
    params: {
      Page: page,
      PageSize: pageSize,
      Type: publishType,
      page,
      page_size: pageSize,
      type: publishType,
    },
    url: '/admin/list',
  })
}

export function getAdminPostDetail(postId: number) {
  return request<AdminPostDetail>({
    method: 'GET',
    params: { post_id: postId },
    url: '/admin/detail',
  })
}

export function getAdminReviewRecords(params: AdminReviewRecordsRequest = {}) {
  return request<AdminReviewRecordsResponse>({
    method: 'GET',
    params: {
      page: params.page ?? 1,
      page_size: params.page_size ?? 20,
    },
    url: '/admin/review-records',
  })
}

export function getAdminPostList(params: AdminPostListRequest) {
  return request<AdminPostListResponse>({
    method: 'GET',
    params: {
      campus: toCampusParam(params.campus),
      end_time: params.end_time,
      item_type: params.item_type,
      location: params.location,
      page: params.page,
      page_size: params.page_size,
      publish_type: toPublishTypeParam(params.publish_type),
      start_time: params.start_time,
      status: params.status,
    },
    url: '/admin/post-list',
  })
}

export function getAdminPublishedPostList(params: AdminPublishedListRequest) {
  return request<AdminPostListResponse>({
    method: 'GET',
    params: {
      page: params.page ?? 1,
      page_size: params.page_size ?? 20,
      type: toPublishTypeParam(params.publish_type),
    },
    url: '/admin/published-list',
  })
}

export function approveAdminPost(payload: AdminPostOperationRequest) {
  return request<AdminOperationResponse>({
    data: payload,
    method: 'POST',
    url: '/admin/approve',
  })
}

export function rejectAdminPost(payload: AdminRejectPostRequest) {
  return request<AdminOperationResponse>({
    data: payload,
    method: 'POST',
    url: '/admin/reject',
  })
}

export function claimAdminPost(payload: AdminPostOperationRequest) {
  return request<AdminOperationResponse>({
    data: payload,
    method: 'POST',
    url: '/admin/claim',
  })
}

export function archiveAdminPost(payload: AdminArchivePostRequest) {
  return request<AdminOperationResponse>({
    data: payload,
    method: 'POST',
    url: '/admin/archive',
  })
}

export function deleteAdminPost(payload: AdminPostOperationRequest) {
  return request<AdminOperationResponse>({
    data: payload,
    method: 'DELETE',
    url: '/admin/post/delete',
  })
}

export function getAdminStatistics() {
  return request<AdminStatisticsResponse>({
    method: 'GET',
    url: '/admin/statistics',
  })
}

export function getAdminExpiredList(params: AdminExpiredListRequest = {}) {
  return request<AdminExpiredListResponse>({
    method: 'GET',
    params: {
      page: params.page ?? 1,
      page_size: params.page_size ?? 20,
    },
    url: '/admin/expired-list',
  })
}

export function cleanAdminExpiredData() {
  return request<AdminExpiredCleanResponse>({
    data: {},
    method: 'DELETE',
    url: '/admin/expired-clean',
  })
}

export function exportAdminSystemData() {
  return request<AdminExportResponse>({
    method: 'GET',
    url: '/admin/export',
  })
}

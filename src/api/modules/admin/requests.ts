import type {
  AdminArchivePostRequest,
  AdminOperationResponse,
  AdminPendingListRequest,
  AdminPendingListResponse,
  AdminPostDetail,
  AdminPostOperationRequest,
  AdminRejectPostRequest,
  AdminStatisticsResponse,
} from './types'
import { request } from '@/api/core/request'

export function getAdminPendingPostList(params: AdminPendingListRequest = {}) {
  return request<AdminPendingListResponse>({
    method: 'GET',
    params,
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

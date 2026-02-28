import type {
  FeedbackDetail,
  FeedbackListRequest,
  FeedbackListResponse,
  ProcessFeedbackRequest,
  ProcessFeedbackResponse,
} from './types'
import { request } from '@/api/core/request'

export function getFeedbackList(params: FeedbackListRequest) {
  return request<FeedbackListResponse>({
    method: 'GET',
    params,
    url: '/feedback/list',
  })
}

export function getFeedbackDetail(id: number) {
  return request<FeedbackDetail>({
    method: 'GET',
    params: { id },
    url: '/feedback/detail',
  })
}

export function processFeedback(payload: ProcessFeedbackRequest) {
  return request<ProcessFeedbackResponse>({
    data: payload,
    method: 'POST',
    url: '/feedback/process',
  })
}

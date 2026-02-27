import type { SystemConfig, UpdateClaimValidityDaysRequest, UpdateFeedbackTypesRequest, UpdateItemTypesRequest, UpdatePublishLimitRequest } from './types'
import { request } from '@/api/core/request'

export function getSystemConfig() {
  return request<SystemConfig>({
    method: 'GET',
    url: '/system/config',
  })
}

export function updateFeedbackTypes(payload: UpdateFeedbackTypesRequest) {
  return request<Record<string, never>>({
    data: payload,
    method: 'PUT',
    url: '/system/feedback-types',
  })
}

export function updateItemTypes(payload: UpdateItemTypesRequest) {
  return request<Record<string, never>>({
    data: payload,
    method: 'PUT',
    url: '/system/item-types',
  })
}

export function updateClaimValidityDays(payload: UpdateClaimValidityDaysRequest) {
  return request<Record<string, never>>({
    data: payload,
    method: 'PUT',
    url: '/system/claim-validity-days',
  })
}

export function updatePublishLimit(payload: UpdatePublishLimitRequest) {
  return request<Record<string, never>>({
    data: payload,
    method: 'PUT',
    url: '/system/publish-limit',
  })
}

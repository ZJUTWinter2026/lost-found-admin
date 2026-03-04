import type { CampusName, PublishKind } from '@/api/shared/transforms'

export interface AdminPendingListRequest {
  Page?: number
  PageSize?: number
  page?: number
  page_size?: number
}

export interface AdminPendingPostItem {
  contact_name: string
  created_at: string
  event_time: string
  id: number
  item_name: string
  item_type: string
  location: string
  publish_type: string
}

export interface AdminPendingListResponse {
  list: AdminPendingPostItem[]
  page: number
  page_size: number
  total: number
}

export type ManagedPostStatus = 'PENDING' | 'APPROVED' | 'SOLVED' | 'CANCELLED' | 'REJECTED' | 'ARCHIVED'

export interface AdminPostListRequest {
  campus?: CampusName
  end_time?: string
  item_type?: string
  location?: string
  page?: number
  page_size?: number
  publish_type?: PublishKind
  start_time?: string
  status?: ManagedPostStatus
}

export interface AdminPostListItem {
  campus: string
  created_at: string
  event_time: string
  features: string
  has_reward: boolean
  id: number
  images: string[]
  item_name: string
  item_type: string
  location: string
  publish_type: string
  publisher_id: number
  reward_description: string
  status: string
}

export interface AdminPostListResponse {
  list: AdminPostListItem[]
  page: number
  page_size: number
  total: number
}

export interface AdminPostDetail {
  contact_name: string
  contact_phone: string
  created_at: string
  event_time: string
  features: string
  has_reward: boolean
  id: number
  images: string[]
  item_name: string
  item_type: string
  location: string
  publish_type: string
  publisher_id: number
  reward_description: string
  status: string
}

export interface AdminPostOperationRequest {
  post_id: number
}

export interface AdminRejectPostRequest extends AdminPostOperationRequest {
  reason: string
}

export interface AdminArchivePostRequest extends AdminPostOperationRequest {
  archive_method: string
}

export interface AdminOperationResponse {
  success: boolean
}

export interface AdminStatisticsResponse {
  status_counts: Record<string, number>
  type_counts: Record<string, number>
  type_percentage: Record<string, string>
}

export interface AdminExpiredListRequest {
  page?: number
  page_size?: number
}

export interface AdminExpiredListItem {
  archive_method?: string
  cancel_reason?: string
  campus: string
  created_at: string
  id: number
  item_name: string
  item_type: string
  location: string
  publish_type: string
  publisher_id: number
  reject_reason?: string
  status: string
  updated_at: string
}

export interface AdminExpiredListResponse {
  list: AdminExpiredListItem[]
  page: number
  page_size: number
  total: number
}

export interface AdminExportResponse {
  url: string
}

export interface AdminExpiredCleanResponse {
  deleted_count: number
}

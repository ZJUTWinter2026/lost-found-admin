export interface AdminPendingListRequest {
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

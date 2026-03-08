import type { CampusName, PublishKind } from '@/api/shared/transforms'

export interface PostListRequest {
  campus?: CampusName
  end_time?: string
  item_type?: string
  location?: string
  page?: number
  page_size?: number
  publish_type?: PublishKind
  start_time?: string
  status?: string
}

export interface PostListItem {
  campus: string
  event_time: string
  features: string
  has_reward: boolean
  id: number
  images: string[]
  item_name: string
  item_type: string
  location: string
  publish_type: string
  reward_description: string
  status: string
}

export interface PostListResponse {
  list: PostListItem[]
  page: number
  page_size: number
  total: number
}

export interface PostDetail {
  archive_method?: string
  campus: string
  cancel_reason?: string
  claim_count: number
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
  reject_reason?: string
  reward_description: string
  status: string
  storage_location: string
}

export interface UpdatePostRequest {
  campus: string
  contact_name: string
  contact_phone: string
  event_time: string
  features: string
  has_reward?: boolean
  images?: string[]
  item_name: string
  item_type: string
  location: string
  post_id: number
  reward_description?: string
  storage_location?: string
}

export interface UpdatePostResponse {
  id: number
}

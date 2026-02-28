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

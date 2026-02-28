export interface FeedbackListRequest {
  page?: number
  page_size?: number
  processed: 'ALL' | 'YES' | 'NO'
}

export interface FeedbackListItem {
  created_at: string
  description: string
  id: number
  post_id: number
  processed: boolean
  processed_at?: unknown
  processed_by?: number
  reporter_id: number
  type: string
}

export interface FeedbackListResponse {
  list: FeedbackListItem[]
  page: number
  page_size: number
  total: number
}

export interface FeedbackRelatedPost {
  campus: string
  created_at: string
  id: number
  item_name: string
  item_type: string
  location: string
  publisher_id: number
  status: string
}

export interface FeedbackDetail {
  created_at: string
  description: string
  id: number
  post?: FeedbackRelatedPost
  post_id: number
  processed: boolean
  processed_at?: unknown
  processed_by?: number
  reporter_id: number
  type: string
}

export interface ProcessFeedbackRequest {
  feedback_id: number
}

export interface ProcessFeedbackResponse {
  success: boolean
}

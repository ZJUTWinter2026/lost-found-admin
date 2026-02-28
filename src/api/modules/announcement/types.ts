export interface AnnouncementListRequest {
  page?: number
  page_size?: number
}

export interface AnnouncementItem {
  campus: string
  content: string
  created_at: string
  id: number
  publisher_id?: number
  status: string
  title: string
  type: string
}

export interface AnnouncementListResponse {
  list: AnnouncementItem[]
  page: number
  page_size: number
  total: number
}

export interface PublishAnnouncementRequest {
  campus?: string
  content: string
  target_user_id?: number
  title: string
  type: 'SYSTEM' | 'REGION'
}

export interface PublishAnnouncementResponse {
  id: number
}

export interface ApproveAnnouncementRequest {
  approve: boolean
  id: number
}

export interface DeleteAnnouncementRequest {
  id: number
}

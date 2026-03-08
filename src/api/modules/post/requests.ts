import type { PostDetail, PostListRequest, PostListResponse, UpdatePostRequest, UpdatePostResponse } from './types'
import { request } from '@/api/core/request'
import { toCampusParam, toPublishTypeParam } from '@/api/shared/transforms'

export function getPostList(params: PostListRequest = {}) {
  return request<PostListResponse>({
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
    url: '/post/list',
  })
}

export function getPostDetail(id: number) {
  return request<PostDetail>({
    method: 'GET',
    params: { id },
    url: '/post/detail',
  })
}

export function updatePost(payload: UpdatePostRequest) {
  return request<UpdatePostResponse>({
    data: payload,
    method: 'PUT',
    url: '/post/update',
  })
}

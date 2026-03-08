import type { PostListRequest } from '@/api/modules/post'
import { useQuery } from '@tanstack/react-query'
import { getPostDetail, getPostList } from '@/api/modules/post'
import { queryKeys } from '@/query/query-keys'

export function usePostListQuery(params: PostListRequest) {
  return useQuery({
    queryFn: () => getPostList(params),
    queryKey: queryKeys.post.list(params),
  })
}

export function usePostDetailQuery(id?: number | null) {
  return useQuery({
    enabled: Boolean(id),
    queryFn: () => getPostDetail(id as number),
    queryKey: queryKeys.post.detail(id),
  })
}

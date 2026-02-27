import { useQuery } from '@tanstack/react-query'
import { getAnnouncementList, getAnnouncementReviewList } from '@/api/modules/announcement'
import { queryKeys } from '@/query/query-keys'

export function useAnnouncementReviewListQuery() {
  return useQuery({
    queryFn: () => getAnnouncementReviewList({ page: 1, page_size: 20 }),
    queryKey: queryKeys.announcement.reviewList(),
  })
}

export function useAnnouncementApprovedListQuery() {
  return useQuery({
    queryFn: () => getAnnouncementList({ page: 1, page_size: 20 }),
    queryKey: queryKeys.announcement.approvedList(),
  })
}

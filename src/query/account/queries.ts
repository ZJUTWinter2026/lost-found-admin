import { useQuery } from '@tanstack/react-query'
import { getAccountList } from '@/api/modules/account'
import { queryKeys } from '@/query/query-keys'

export function useAccountListQuery(uid?: number) {
  return useQuery({
    queryFn: () => getAccountList({ page: 1, page_size: 20, uid }),
    queryKey: queryKeys.account.list({ uid }),
  })
}

import { useQuery } from '@tanstack/react-query'
import { getAccountList } from '@/api/modules/account'
import { queryKeys } from '@/query/query-keys'

export function useAccountListQuery(username?: number) {
  return useQuery({
    queryFn: () => getAccountList({ page: 1, page_size: 20, username }),
    queryKey: queryKeys.account.list({ username }),
  })
}

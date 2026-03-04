export const queryKeys = {
  account: {
    list: (params?: { username?: string }) => ['account', 'list', params?.username ?? null] as const,
  },
  admin: {
    expiredList: (params?: { page?: number, page_size?: number }) => ['admin', 'expired-list', params?.page ?? 1, params?.page_size ?? 20] as const,
    pendingDetail: (postId?: number | null) => ['admin', 'pending-detail', postId ?? null] as const,
    pendingList: () => ['admin', 'pending-list'] as const,
    postList: (params?: object) => ['admin', 'post-list', params ?? {}] as const,
    statistics: () => ['admin', 'statistics'] as const,
  },
  announcement: {
    approvedList: () => ['announcement', 'approved-list'] as const,
    reviewList: () => ['announcement', 'review-list'] as const,
  },
  auth: {
    currentUser: () => ['auth', 'current-user'] as const,
  },
  feedback: {
    detail: (id?: number | null) => ['feedback', 'detail', id ?? null] as const,
    list: () => ['feedback', 'list'] as const,
  },
  post: {
    list: (params?: object) => ['post', 'list', params ?? {}] as const,
  },
  system: {
    config: () => ['system', 'config'] as const,
  },
}

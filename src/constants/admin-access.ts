export type AdminRole = 'lost_found_admin' | 'system_admin'

export interface AdminNavItem {
  key: string
  label: string
}

export const ADMIN_ROLE_LABEL: Record<AdminRole, string> = {
  lost_found_admin: '失物招领管理员',
  system_admin: '系统管理员',
}

export const ADMIN_NAV_BY_ROLE: Record<AdminRole, AdminNavItem[]> = {
  lost_found_admin: [
    { key: '/review-publish', label: '审核发布信息' },
    { key: '/item-status', label: '管理物品状态' },
    { key: '/info-maintenance', label: '信息维护与查询' },
  ],
  system_admin: [
    { key: '/global-management', label: '全局管理' },
    { key: '/account-permission', label: '账号与权限管理' },
    { key: '/announcement-content', label: '公告与内容管理' },
  ],
}

export const DEFAULT_ROUTE_BY_ROLE: Record<AdminRole, string> = {
  lost_found_admin: '/review-publish',
  system_admin: '/global-management',
}

const ADMIN_ALLOWED_ROUTE_PREFIXES: Record<AdminRole, string[]> = {
  lost_found_admin: ['/review-publish', '/item-status', '/info-maintenance'],
  system_admin: ['/global-management', '/account-permission', '/announcement-content'],
}

export function hasAdminRouteAccess(role: AdminRole, pathname: string) {
  return ADMIN_ALLOWED_ROUTE_PREFIXES[role].some(prefix => pathname.startsWith(prefix))
}

export function getDefaultRouteByRole(role: AdminRole) {
  return DEFAULT_ROUTE_BY_ROLE[role]
}

export function getAdminNavByRole(role: AdminRole) {
  return ADMIN_NAV_BY_ROLE[role]
}

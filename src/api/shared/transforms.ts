import type { AdminRole } from '@/constants/admin-access'

export type PublishKind = 'lost' | 'found'
export type CampusName = '朝晖' | '屏峰' | '莫干山'

const CAMPUS_TO_API_MAP: Record<CampusName, string> = {
  朝晖: 'ZHAO_HUI',
  屏峰: 'PING_FENG',
  莫干山: 'MO_GAN_SHAN',
}

const API_TO_CAMPUS_MAP: Record<string, CampusName> = {
  ZHAO_HUI: '朝晖',
  PING_FENG: '屏峰',
  MO_GAN_SHAN: '莫干山',
  朝晖: '朝晖',
  屏峰: '屏峰',
  莫干山: '莫干山',
}

const USER_TYPE_TO_ROLE_MAP: Record<string, AdminRole> = {
  ADMIN: 'lost_found_admin',
  SYSTEM_ADMIN: 'system_admin',
}

const ROLE_TO_USER_TYPE_MAP: Record<AdminRole, string> = {
  lost_found_admin: 'ADMIN',
  system_admin: 'SYSTEM_ADMIN',
}

const ACCOUNT_ROLE_LABEL_MAP: Record<string, string> = {
  ADMIN: '失物招领管理员',
  STUDENT: '学生',
  SYSTEM_ADMIN: '系统管理员',
}

export function toPublishKind(value: string | number | null | undefined): PublishKind {
  if (value === 'FOUND' || value === 'found' || value === '2' || value === 2)
    return 'found'

  return 'lost'
}

export function toPublishTypeParam(kind?: PublishKind) {
  if (!kind)
    return undefined

  return kind === 'lost' ? 'LOST' : 'FOUND'
}

export function toCampusName(value: string | null | undefined): CampusName | null {
  if (!value)
    return null

  return API_TO_CAMPUS_MAP[value] ?? null
}

export function toCampusParam(value?: CampusName) {
  if (!value)
    return undefined

  return CAMPUS_TO_API_MAP[value]
}

export function toAdminRole(userType: string | null | undefined): AdminRole | null {
  if (!userType)
    return null

  return USER_TYPE_TO_ROLE_MAP[userType] ?? null
}

export function toUserTypeByRole(role: AdminRole) {
  return ROLE_TO_USER_TYPE_MAP[role]
}

export function toAccountRoleLabel(value: string | null | undefined) {
  if (!value)
    return '-'

  return ACCOUNT_ROLE_LABEL_MAP[value] ?? value
}

export function toDisableDurationParam(value: '7d' | '1m' | '6m' | '1y') {
  const map = {
    '7d': '7days',
    '1m': '1month',
    '6m': '6months',
    '1y': '1year',
  } as const

  return map[value]
}

export function normalizeDateTime(value: unknown) {
  if (typeof value === 'string')
    return value

  return null
}

export function normalizePostStatus(value: string | null | undefined) {
  if (!value)
    return 'unknown'

  return value.toLowerCase()
}

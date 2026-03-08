import type { ManagedPostStatus } from '@/api/modules/admin'

const MANAGED_POST_STATUS_LIST: ManagedPostStatus[] = [
  'PENDING',
  'APPROVED',
  'SOLVED',
  'CANCELLED',
  'REJECTED',
  'ARCHIVED',
]

const MANAGED_POST_STATUS_LABEL_MAP: Record<ManagedPostStatus, string> = {
  PENDING: '待审核',
  APPROVED: '寻找中',
  SOLVED: '已归还/已找回',
  CANCELLED: '已取消',
  REJECTED: '被驳回',
  ARCHIVED: '已归档',
}

const MANAGED_POST_STATUS_COLOR_MAP: Record<ManagedPostStatus, string> = {
  PENDING: 'warning',
  APPROVED: 'processing',
  SOLVED: 'success',
  CANCELLED: 'error',
  REJECTED: 'error',
  ARCHIVED: 'default',
}

const EXTRA_POST_STATUS_LABEL_MAP: Record<string, string> = {
  DELETED: '已删除',
}

const EXTRA_POST_STATUS_COLOR_MAP: Record<string, string> = {
  DELETED: 'error',
}

export const MANAGED_POST_STATUS_OPTIONS = MANAGED_POST_STATUS_LIST.map(status => ({
  label: MANAGED_POST_STATUS_LABEL_MAP[status],
  value: status,
}))

function normalizeStatus(status: string | null | undefined) {
  if (!status)
    return null

  const normalized = status.trim().toUpperCase()
  return normalized || null
}

export function resolveManagedPostStatus(status: string | null | undefined): ManagedPostStatus | null {
  const normalized = normalizeStatus(status)
  if (!normalized)
    return null

  if ((MANAGED_POST_STATUS_LIST as string[]).includes(normalized))
    return normalized as ManagedPostStatus

  return null
}

export function toPostStatusLabel(status: string | null | undefined) {
  const normalized = normalizeStatus(status)
  if (!normalized)
    return '-'

  const managedStatus = resolveManagedPostStatus(normalized)
  if (managedStatus)
    return MANAGED_POST_STATUS_LABEL_MAP[managedStatus]

  return EXTRA_POST_STATUS_LABEL_MAP[normalized] ?? status
}

export function toPostStatusTagColor(status: string | null | undefined) {
  const normalized = normalizeStatus(status)
  if (!normalized)
    return 'default'

  const managedStatus = resolveManagedPostStatus(normalized)
  if (managedStatus)
    return MANAGED_POST_STATUS_COLOR_MAP[managedStatus]

  return EXTRA_POST_STATUS_COLOR_MAP[normalized] ?? 'blue'
}

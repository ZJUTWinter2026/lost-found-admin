export function buildMockPhoto(title: string, colorStart = '#3b82f6', colorEnd = '#1d4ed8') {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="600" height="420">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${colorStart}" />
        <stop offset="100%" stop-color="${colorEnd}" />
      </linearGradient>
    </defs>
    <rect width="600" height="420" fill="url(#g)" rx="24" ry="24" />
    <rect x="52" y="44" width="496" height="332" fill="rgba(255,255,255,0.18)" rx="18" ry="18" />
    <text x="300" y="225" fill="#fff" font-size="42" text-anchor="middle" font-family="PingFang SC, Microsoft YaHei, sans-serif">${title}</text>
  </svg>
  `

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

const BEIJING_TIME_ZONE = 'Asia/Shanghai'
const ONE_DAY_MS = 24 * 60 * 60 * 1000
const ONE_MINUTE_MS = 60 * 1000
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/
const TZ_SUFFIX_PATTERN = /(?:Z|[+-]\d{2}:?\d{2})$/i

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  day: '2-digit',
  month: '2-digit',
  timeZone: BEIJING_TIME_ZONE,
  year: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
  day: '2-digit',
  hour: '2-digit',
  hour12: false,
  minute: '2-digit',
  month: '2-digit',
  second: '2-digit',
  timeZone: BEIJING_TIME_ZONE,
  year: 'numeric',
})

const dateTimePartsFormatter = new Intl.DateTimeFormat('en-CA', {
  day: '2-digit',
  hour: '2-digit',
  hour12: false,
  minute: '2-digit',
  month: '2-digit',
  second: '2-digit',
  timeZone: BEIJING_TIME_ZONE,
  year: 'numeric',
})

function parseDateInput(value: Date | string | null | undefined) {
  if (!value)
    return null

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime()))
      return null
    return value
  }

  const trimmed = value.trim()
  if (!trimmed)
    return null

  const normalized = trimmed.includes(' ')
    ? trimmed.replace(' ', 'T')
    : trimmed

  if (TZ_SUFFIX_PATTERN.test(normalized)) {
    const normalizedOffset = normalized.replace(/([+-]\d{2})(\d{2})$/, '$1:$2')
    const parsed = new Date(normalizedOffset)
    if (!Number.isNaN(parsed.getTime()))
      return parsed
  }

  if (DATE_ONLY_PATTERN.test(normalized)) {
    const parsed = new Date(`${normalized}T00:00:00+08:00`)
    if (!Number.isNaN(parsed.getTime()))
      return parsed
  }

  if (DATE_TIME_PATTERN.test(normalized)) {
    const withSeconds = normalized.length === 16 ? `${normalized}:00` : normalized
    const parsed = new Date(`${withSeconds}+08:00`)
    if (!Number.isNaN(parsed.getTime()))
      return parsed
  }

  const parsed = new Date(normalized)
  if (Number.isNaN(parsed.getTime()))
    return null

  return parsed
}

function formatToBeijingOffsetString(date: Date) {
  const parts = dateTimePartsFormatter.formatToParts(date)

  const map: Partial<Record<'year' | 'month' | 'day' | 'hour' | 'minute' | 'second', string>> = {}
  parts.forEach((part) => {
    if (part.type === 'year' || part.type === 'month' || part.type === 'day' || part.type === 'hour' || part.type === 'minute' || part.type === 'second')
      map[part.type] = part.value
  })

  return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}:${map.second}+08:00`
}

function getBeijingTodayStart() {
  const today = formatToBeijingOffsetString(new Date()).slice(0, 10)
  return new Date(`${today}T00:00:00+08:00`)
}

export function createDateByDaysAgo(daysAgo: number, hour: number, minute: number) {
  const target = new Date(
    getBeijingTodayStart().getTime()
    - (daysAgo * ONE_DAY_MS)
    + (((hour * 60) + minute) * ONE_MINUTE_MS),
  )

  return formatToBeijingOffsetString(target)
}

export function formatDate(value: string) {
  const parsed = parseDateInput(value)
  if (!parsed)
    return '-'

  return dateFormatter.format(parsed).replace(/\//g, '/')
}

export function formatDateTime(value: string) {
  const parsed = parseDateInput(value)
  if (!parsed)
    return '-'

  return dateTimeFormatter.format(parsed).replace(/\//g, '-')
}

export function getBeijingTimestamp(value: Date | string | null | undefined) {
  const parsed = parseDateInput(value)
  if (!parsed)
    return 0

  return parsed.getTime()
}

export function getNowInBeijing() {
  return formatToBeijingOffsetString(new Date())
}

export function toBeijingDayBoundary(date: string, boundary: 'start' | 'end') {
  const trimmed = date.trim()
  if (!DATE_ONLY_PATTERN.test(trimmed))
    return undefined

  if (boundary === 'start')
    return `${trimmed}T00:00:00+08:00`

  return `${trimmed}T23:59:59+08:00`
}

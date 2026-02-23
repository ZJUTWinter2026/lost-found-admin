'use client'

import type { RangePickerProps } from 'antd/es/date-picker'
import { App, Button, Card, DatePicker, Descriptions, Empty, Flex, Image, Input, Modal, Select, Space, Statistic, Table, Tag, Typography } from 'antd'
import { useMemo, useState } from 'react'

const { Text } = Typography
const { RangePicker } = DatePicker

type PublishKind = 'lost' | 'found'
type ItemStatus = 'unmatched' | 'matched' | 'claimed'
type Campus = '朝晖' | '屏峰' | '莫干山'

interface ItemInfo {
  id: string
  kind: PublishKind
  itemType: string
  itemName: string
  campus: Campus
  locationDetail: string
  eventTime: string
  status: ItemStatus
  description: string
  features: string
  storageLocation: string
  claimCount: number
  contactPhone: string
  hasReward: boolean
  rewardAmount?: number
  photos: string[]
}

interface ItemSeedInfo extends Omit<ItemInfo, 'eventTime' | 'id' | 'photos'> {
  eventDaysAgo: number
  eventHour: number
  eventMinute: number
  photoCount: 1 | 2 | 3
}

interface StatisticsRow {
  key: string
  claimRate: string
  claimedCount: number
  dimension: string
  matchedCount: number
  totalCount: number
  unmatchedCount: number
}

const DEFAULT_ITEM_TYPES = ['电子', '饭卡', '文体', '证件', '衣包', '饰品'] as const
const OTHER_TYPE_VALUE = '__other_type__'

const KIND_LABEL: Record<PublishKind, string> = {
  lost: '失物',
  found: '招领',
}

const STATUS_LABEL: Record<ItemStatus, string> = {
  unmatched: '未匹配',
  matched: '已匹配',
  claimed: '已认领',
}

const STATUS_COLOR: Record<ItemStatus, string> = {
  unmatched: 'processing',
  matched: 'success',
  claimed: 'gold',
}

const STATUS_OPTIONS = [
  { label: '未匹配', value: 'unmatched' },
  { label: '已匹配', value: 'matched' },
  { label: '已认领', value: 'claimed' },
]

const CAMPUS_OPTIONS = [
  { label: '朝晖', value: '朝晖' },
  { label: '屏峰', value: '屏峰' },
  { label: '莫干山', value: '莫干山' },
]

const PHOTO_PALETTE = [
  ['#3b82f6', '#60a5fa'],
  ['#2563eb', '#1d4ed8'],
  ['#0ea5e9', '#0284c7'],
  ['#38bdf8', '#1e40af'],
  ['#60a5fa', '#1e3a8a'],
] as const

function buildMockPhoto(title: string, colorStart: string, colorEnd: string) {
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

function createDateByDaysAgo(daysAgo: number, hour: number, minute: number) {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

function buildPhotos(baseTitle: string, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const [start, end] = PHOTO_PALETTE[index % PHOTO_PALETTE.length]
    return buildMockPhoto(`${baseTitle} ${index + 1}`, start, end)
  })
}

const ITEM_SEEDS: ItemSeedInfo[] = [
  {
    kind: 'lost',
    itemType: '证件',
    itemName: '校园卡',
    campus: '朝晖',
    locationDetail: '图书馆三层自习区',
    eventDaysAgo: 1,
    eventHour: 9,
    eventMinute: 25,
    status: 'unmatched',
    description: '蓝色校园卡套，挂绳带学院 LOGO。',
    features: '卡套背面有猫咪贴纸，边角磨损明显。',
    storageLocation: '行政楼失物招领处 1 号柜',
    claimCount: 0,
    contactPhone: '13800001234',
    hasReward: false,
    photoCount: 2,
  },
  {
    kind: 'found',
    itemType: '衣包',
    itemName: '灰色双肩包',
    campus: '屏峰',
    locationDetail: '体育馆看台二层',
    eventDaysAgo: 2,
    eventHour: 14,
    eventMinute: 10,
    status: 'matched',
    description: '中等容量双肩包，前袋有学校徽章。',
    features: '内含高数笔记，拉链头有蓝色绳结。',
    storageLocation: '屏峰校区后勤仓 3 区',
    claimCount: 1,
    contactPhone: '13600009999',
    hasReward: false,
    photoCount: 3,
  },
  {
    kind: 'lost',
    itemType: '电子',
    itemName: 'AirPods 充电盒',
    campus: '朝晖',
    locationDetail: '一食堂东门',
    eventDaysAgo: 3,
    eventHour: 12,
    eventMinute: 35,
    status: 'unmatched',
    description: '白色耳机盒，外壳有透明保护套。',
    features: '盒盖内侧有字母“LQ”，右下角轻微磕碰。',
    storageLocation: '朝晖校区服务中心 A-12',
    claimCount: 0,
    contactPhone: '13900004567',
    hasReward: true,
    rewardAmount: 80,
    photoCount: 1,
  },
  {
    kind: 'found',
    itemType: '饭卡',
    itemName: '蓝色饭卡',
    campus: '莫干山',
    locationDetail: '二食堂收银台附近',
    eventDaysAgo: 4,
    eventHour: 18,
    eventMinute: 5,
    status: 'claimed',
    description: '饭卡套透明，挂有短链。',
    features: '卡面右上角有笑脸贴纸。',
    storageLocation: '莫干山食堂值班室',
    claimCount: 2,
    contactPhone: '13700001111',
    hasReward: false,
    photoCount: 1,
  },
  {
    kind: 'lost',
    itemType: '文体',
    itemName: '羽毛球拍',
    campus: '屏峰',
    locationDetail: '体育馆羽毛球场 2 号场',
    eventDaysAgo: 5,
    eventHour: 20,
    eventMinute: 45,
    status: 'matched',
    description: '黑金配色球拍，拍柄缠白色手胶。',
    features: '拍框右侧有小凹痕。',
    storageLocation: '体育馆器材室登记架',
    claimCount: 1,
    contactPhone: '13500001122',
    hasReward: false,
    photoCount: 2,
  },
  {
    kind: 'found',
    itemType: '饰品',
    itemName: '银色项链',
    campus: '朝晖',
    locationDetail: '主楼一层大厅',
    eventDaysAgo: 7,
    eventHour: 10,
    eventMinute: 20,
    status: 'unmatched',
    description: '细链款，吊坠为四叶草样式。',
    features: '吊坠背面刻有字母“Y”。',
    storageLocation: '行政楼招领柜 2 层',
    claimCount: 0,
    contactPhone: '13400003333',
    hasReward: false,
    photoCount: 1,
  },
  {
    kind: 'lost',
    itemType: '衣包',
    itemName: '黑色电脑包',
    campus: '莫干山',
    locationDetail: '信息楼 204 教室',
    eventDaysAgo: 8,
    eventHour: 16,
    eventMinute: 30,
    status: 'unmatched',
    description: '手提电脑包，侧边有肩带接口。',
    features: '前袋放有网线和转换头。',
    storageLocation: '莫干山后勤值班室 6 号架',
    claimCount: 0,
    contactPhone: '13300005555',
    hasReward: true,
    rewardAmount: 120,
    photoCount: 3,
  },
  {
    kind: 'found',
    itemType: '电子',
    itemName: '金属 U 盘',
    campus: '屏峰',
    locationDetail: '实验楼 5 层走廊',
    eventDaysAgo: 9,
    eventHour: 9,
    eventMinute: 8,
    status: 'claimed',
    description: '银色金属 U 盘，带红色挂绳。',
    features: '外壳左侧有一道白色划痕。',
    storageLocation: '屏峰实验楼值班前台',
    claimCount: 3,
    contactPhone: '13200006666',
    hasReward: false,
    photoCount: 1,
  },
  {
    kind: 'lost',
    itemType: '证件',
    itemName: '身份证',
    campus: '朝晖',
    locationDetail: '教学楼 B 座 201',
    eventDaysAgo: 11,
    eventHour: 13,
    eventMinute: 55,
    status: 'matched',
    description: '透明证件套，附蓝色绳结。',
    features: '证件套右下角有褶皱。',
    storageLocation: '朝晖保卫处窗口 3',
    claimCount: 1,
    contactPhone: '13100007777',
    hasReward: false,
    photoCount: 1,
  },
  {
    kind: 'found',
    itemType: '文体',
    itemName: '篮球',
    campus: '莫干山',
    locationDetail: '操场北侧看台',
    eventDaysAgo: 12,
    eventHour: 17,
    eventMinute: 16,
    status: 'unmatched',
    description: '7 号篮球，表面磨损较明显。',
    features: '有一处黑色记号笔签名。',
    storageLocation: '体育器材室 2 号架',
    claimCount: 0,
    contactPhone: '13000009999',
    hasReward: false,
    photoCount: 2,
  },
  {
    kind: 'lost',
    itemType: '饭卡',
    itemName: '红色饭卡套',
    campus: '屏峰',
    locationDetail: '图书馆入口闸机处',
    eventDaysAgo: 13,
    eventHour: 8,
    eventMinute: 52,
    status: 'claimed',
    description: '饭卡套正面印有学院活动标识。',
    features: '背面贴有电话号码标签。',
    storageLocation: '图书馆服务台抽屉 C',
    claimCount: 2,
    contactPhone: '13900008888',
    hasReward: false,
    photoCount: 1,
  },
  {
    kind: 'found',
    itemType: '饰品',
    itemName: '黑框眼镜',
    campus: '朝晖',
    locationDetail: '化学楼 3 层实验室外',
    eventDaysAgo: 14,
    eventHour: 15,
    eventMinute: 48,
    status: 'matched',
    description: '半框眼镜，镜腿末端为深蓝色。',
    features: '左镜腿有白色刮痕。',
    storageLocation: '化学楼值班室失物架',
    claimCount: 1,
    contactPhone: '13800007654',
    hasReward: false,
    photoCount: 1,
  },
  {
    kind: 'lost',
    itemType: '电子',
    itemName: '机械键盘',
    campus: '莫干山',
    locationDetail: '创新实验室 305',
    eventDaysAgo: 16,
    eventHour: 21,
    eventMinute: 18,
    status: 'unmatched',
    description: '白色 87 键机械键盘。',
    features: 'ESC 键帽缺失，空格键略松。',
    storageLocation: '创新实验楼前台 4 号柜',
    claimCount: 0,
    contactPhone: '13700006789',
    hasReward: true,
    rewardAmount: 200,
    photoCount: 3,
  },
  {
    kind: 'found',
    itemType: '衣包',
    itemName: '米白色外套',
    campus: '屏峰',
    locationDetail: '北门快递点旁',
    eventDaysAgo: 18,
    eventHour: 11,
    eventMinute: 22,
    status: 'unmatched',
    description: '短款外套，左臂有蓝色条纹。',
    features: '内衬口袋有健身房体验卡。',
    storageLocation: '北门驿站值班台',
    claimCount: 0,
    contactPhone: '13600001010',
    hasReward: false,
    photoCount: 2,
  },
]

const INITIAL_ITEMS: ItemInfo[] = ITEM_SEEDS.map((item, index) => {
  const { eventDaysAgo, eventHour, eventMinute, photoCount, ...rest } = item

  return {
    ...rest,
    id: `info-item-${index + 1}`,
    eventTime: createDateByDaysAgo(eventDaysAgo, eventHour, eventMinute),
    photos: buildPhotos(item.itemName, photoCount),
  }
})

function toTimestamp(value: string) {
  return new Date(value).getTime()
}

function formatDateTime(value: string) {
  const formatter = new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: '2-digit',
    second: '2-digit',
    year: 'numeric',
  })

  return formatter.format(new Date(value)).replace(/\//g, '-')
}

function parseRangeBoundary(value: string, endOfDay: boolean) {
  const normalized = value.replace(/\//g, '-')
  const suffix = endOfDay ? ' 23:59:59' : ' 00:00:00'
  return new Date(`${normalized}${suffix}`).getTime()
}

function buildStatisticsRows(source: ItemInfo[]): StatisticsRow[] {
  if (source.length === 0)
    return []

  const grouped = new Map<string, ItemInfo[]>()
  source.forEach((item) => {
    const list = grouped.get(item.itemType) ?? []
    list.push(item)
    grouped.set(item.itemType, list)
  })

  const rows: StatisticsRow[] = [...grouped.entries()]
    .map(([type, items]) => {
      const totalCount = items.length
      const unmatchedCount = items.filter(item => item.status === 'unmatched').length
      const matchedCount = items.filter(item => item.status === 'matched').length
      const claimedCount = items.filter(item => item.status === 'claimed').length
      const claimRate = `${((claimedCount / totalCount) * 100).toFixed(1)}%`

      return {
        key: `type-${type}`,
        dimension: type,
        totalCount,
        unmatchedCount,
        matchedCount,
        claimedCount,
        claimRate,
      }
    })
    .sort((a, b) => b.totalCount - a.totalCount)

  const totalCount = source.length
  const unmatchedCount = source.filter(item => item.status === 'unmatched').length
  const matchedCount = source.filter(item => item.status === 'matched').length
  const claimedCount = source.filter(item => item.status === 'claimed').length

  return [
    {
      key: 'summary-total',
      dimension: '总计',
      totalCount,
      unmatchedCount,
      matchedCount,
      claimedCount,
      claimRate: `${((claimedCount / totalCount) * 100).toFixed(1)}%`,
    },
    ...rows,
  ]
}

export default function InfoMaintenancePage() {
  const { message } = App.useApp()

  const [items, setItems] = useState<ItemInfo[]>(INITIAL_ITEMS)
  const [resultItems, setResultItems] = useState<ItemInfo[]>([])
  const [hasViewed, setHasViewed] = useState(false)
  const [statisticsVisible, setStatisticsVisible] = useState(false)

  const [selectedType, setSelectedType] = useState<string>()
  const [selectedCampus, setSelectedCampus] = useState<Campus>()
  const [selectedStatus, setSelectedStatus] = useState<ItemStatus>()
  const [selectedTimeRange, setSelectedTimeRange] = useState<[string, string]>()

  const [customTypeOpen, setCustomTypeOpen] = useState(false)
  const [customTypeInput, setCustomTypeInput] = useState('')
  const [customTypes, setCustomTypes] = useState<string[]>([])

  const [detailItem, setDetailItem] = useState<ItemInfo | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editingStorageLocation, setEditingStorageLocation] = useState('')
  const [editingContactPhone, setEditingContactPhone] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const itemTypeOptions = useMemo(
    () => [
      ...DEFAULT_ITEM_TYPES.map(type => ({ label: type, value: type })),
      ...customTypes.map(type => ({ label: type, value: type })),
      { label: '其它类型', value: OTHER_TYPE_VALUE },
    ],
    [customTypes],
  )

  const hasAnyFilter = Boolean(
    selectedType
    || selectedCampus
    || selectedStatus
    || (selectedTimeRange?.[0] && selectedTimeRange?.[1]),
  )

  const filteredItemsPreview = useMemo(() => {
    return items
      .filter((item) => {
        if (selectedType && item.itemType !== selectedType)
          return false

        if (selectedCampus && item.campus !== selectedCampus)
          return false

        if (selectedStatus && item.status !== selectedStatus)
          return false

        if (selectedTimeRange?.[0] && selectedTimeRange?.[1]) {
          const start = parseRangeBoundary(selectedTimeRange[0], false)
          const end = parseRangeBoundary(selectedTimeRange[1], true)
          const current = toTimestamp(item.eventTime)

          if (Number.isNaN(start) || Number.isNaN(end))
            return false

          if (current < start || current > end)
            return false
        }

        return true
      })
      .sort((a, b) => toTimestamp(b.eventTime) - toTimestamp(a.eventTime))
  }, [items, selectedCampus, selectedStatus, selectedTimeRange, selectedType])

  const statisticsRows = useMemo(
    () => buildStatisticsRows(resultItems),
    [resultItems],
  )

  const summaryData = useMemo(() => {
    const total = resultItems.length
    const unmatched = resultItems.filter(item => item.status === 'unmatched').length
    const matched = resultItems.filter(item => item.status === 'matched').length
    const claimed = resultItems.filter(item => item.status === 'claimed').length

    return { total, unmatched, matched, claimed }
  }, [resultItems])

  const statisticsColumns = useMemo(
    () => [
      { dataIndex: 'dimension', key: 'dimension', title: '统计维度' },
      { dataIndex: 'totalCount', key: 'totalCount', title: '发布总数' },
      { dataIndex: 'unmatchedCount', key: 'unmatchedCount', title: '未匹配' },
      { dataIndex: 'matchedCount', key: 'matchedCount', title: '已匹配' },
      { dataIndex: 'claimedCount', key: 'claimedCount', title: '已认领' },
      { dataIndex: 'claimRate', key: 'claimRate', title: '认领率' },
    ],
    [],
  )

  const handleRangeChange: RangePickerProps['onChange'] = (_value, dateStrings) => {
    if (dateStrings[0] && dateStrings[1]) {
      setSelectedTimeRange([dateStrings[0], dateStrings[1]])
      return
    }

    setSelectedTimeRange(undefined)
  }

  const handleTypeChange = (value: string) => {
    if (value === OTHER_TYPE_VALUE) {
      setCustomTypeInput('')
      setCustomTypeOpen(true)
      return
    }

    setSelectedType(value)
  }

  const handleView = () => {
    if (!hasAnyFilter)
      return

    setResultItems(filteredItemsPreview)
    setHasViewed(true)
    setStatisticsVisible(false)
  }

  const handleStatistics = () => {
    setStatisticsVisible(true)
  }

  const handleExport = () => {
    if (!statisticsVisible || statisticsRows.length === 0)
      return

    const headers = ['统计维度', '发布总数', '未匹配', '已匹配', '已认领', '认领率']
    const rows = statisticsRows.map(row => [
      row.dimension,
      String(row.totalCount),
      String(row.unmatchedCount),
      String(row.matchedCount),
      String(row.claimedCount),
      row.claimRate,
    ])

    const csvContent = `\uFEFF${[headers, ...rows].map(row => row.join(',')).join('\n')}`
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `信息统计_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)

    message.success('统计数据已导出')
  }

  const handleCustomTypeConfirm = () => {
    const nextType = customTypeInput.trim()
    if (!nextType) {
      message.warning('请输入其它类型名称')
      return
    }

    if (nextType.length > 15) {
      message.warning('其它类型最多 15 字')
      return
    }

    if (!customTypes.includes(nextType) && !DEFAULT_ITEM_TYPES.includes(nextType as (typeof DEFAULT_ITEM_TYPES)[number]))
      setCustomTypes(prev => [...prev, nextType])

    setSelectedType(nextType)
    setCustomTypeOpen(false)
    setCustomTypeInput('')
  }

  const openDetail = (item: ItemInfo) => {
    setDetailItem(item)
    setEditMode(false)
    setEditingStorageLocation(item.storageLocation)
    setEditingContactPhone(item.contactPhone)
  }

  const closeDetail = () => {
    if (isSaving)
      return

    setDetailItem(null)
    setEditMode(false)
  }

  const handleStartEdit = () => {
    if (!detailItem)
      return

    setEditMode(true)
    setEditingStorageLocation(detailItem.storageLocation)
    setEditingContactPhone(detailItem.contactPhone)
  }

  const handleCancelEdit = () => {
    if (!detailItem || isSaving)
      return

    setEditMode(false)
    setEditingStorageLocation(detailItem.storageLocation)
    setEditingContactPhone(detailItem.contactPhone)
  }

  const handleConfirmEdit = async () => {
    if (!detailItem)
      return

    const nextStorage = editingStorageLocation.trim()
    const nextPhone = editingContactPhone.trim()

    if (!nextStorage) {
      message.warning('请填写存放地点')
      return
    }

    if (nextStorage.length > 30) {
      message.warning('存放地点最多 30 字')
      return
    }

    if (!/^\d{11}$/.test(nextPhone)) {
      message.warning('联系方式需为 11 位数字')
      return
    }

    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 320))

    const nextItem: ItemInfo = {
      ...detailItem,
      storageLocation: nextStorage,
      contactPhone: nextPhone,
    }

    setItems(prev => prev.map(item => (item.id === nextItem.id ? nextItem : item)))
    setResultItems(prev => prev.map(item => (item.id === nextItem.id ? nextItem : item)))
    setDetailItem(nextItem)

    setEditMode(false)
    setIsSaving(false)
    message.success('物品信息已更新')
  }

  return (
    <Flex vertical gap={16}>
      <Card title="筛选框" styles={{ body: { padding: 16 } }}>
        <Flex vertical gap={12}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Select
              allowClear
              placeholder="物品类型"
              options={itemTypeOptions}
              value={selectedType}
              onChange={handleTypeChange}
              onClear={() => setSelectedType(undefined)}
            />

            <Select
              allowClear
              placeholder="丢失/拾取校区"
              options={CAMPUS_OPTIONS}
              value={selectedCampus}
              onChange={value => setSelectedCampus(value as Campus)}
              onClear={() => setSelectedCampus(undefined)}
            />

            <RangePicker
              allowClear
              className="w-full"
              format="YYYY/MM/DD"
              onChange={handleRangeChange}
            />

            <Select
              allowClear
              placeholder="物品状态"
              options={STATUS_OPTIONS}
              value={selectedStatus}
              onChange={value => setSelectedStatus(value as ItemStatus)}
              onClear={() => setSelectedStatus(undefined)}
            />
          </div>

          <Flex justify="end">
            <Button type="primary" disabled={!hasAnyFilter} onClick={handleView}>
              查看
            </Button>
          </Flex>
        </Flex>
      </Card>

      <Card styles={{ body: { padding: 16 } }}>
        <Flex vertical gap={12}>
          <Flex gap={8} wrap>
            <Button onClick={handleStatistics} disabled={!hasViewed}>
              统计数据
            </Button>
            <Button type="primary" onClick={handleExport} disabled={!statisticsVisible || statisticsRows.length === 0}>
              导出
            </Button>
          </Flex>

          {statisticsVisible && (
            <Flex vertical gap={12}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Card size="small"><Statistic title="发布总数" value={summaryData.total} /></Card>
                <Card size="small"><Statistic title="未匹配" value={summaryData.unmatched} /></Card>
                <Card size="small"><Statistic title="已匹配" value={summaryData.matched} /></Card>
                <Card size="small"><Statistic title="已认领" value={summaryData.claimed} /></Card>
              </div>

              <Table<StatisticsRow>
                size="small"
                rowKey="key"
                columns={statisticsColumns}
                dataSource={statisticsRows}
                pagination={false}
                scroll={{ x: 680 }}
                locale={{ emptyText: '暂无可统计的数据' }}
              />
            </Flex>
          )}
        </Flex>
      </Card>

      <Card title="物品信息列表" styles={{ body: { padding: '12px 14px' } }}>
        {!hasViewed && (
          <div className="py-10">
            <Empty description="请选择至少一个筛选条件并点击“查看”" />
          </div>
        )}

        {hasViewed && resultItems.length === 0 && (
          <div className="py-10">
            <Empty description="未查询到符合条件的物品信息" />
          </div>
        )}

        {hasViewed && resultItems.length > 0 && (
          <div className="max-h-[calc(100vh-420px)] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {resultItems.map(item => (
                <Card
                  key={item.id}
                  hoverable
                  size="small"
                  className="h-full"
                  onClick={() => openDetail(item)}
                >
                  <Flex vertical gap={8}>
                    <Flex justify="space-between" align="center" wrap>
                      <Space size={8}>
                        <Text strong>{item.itemName}</Text>
                        <Tag color="blue">{item.itemType}</Tag>
                      </Space>

                      <Space size={8}>
                        <Tag>{KIND_LABEL[item.kind]}</Tag>
                        <Tag color={STATUS_COLOR[item.status]}>{STATUS_LABEL[item.status]}</Tag>
                      </Space>
                    </Flex>

                    <Text type="secondary">
                      丢失/拾取地点：
                      {item.campus}
                      {' / '}
                      {item.locationDetail}
                    </Text>

                    <Text type="secondary">
                      丢失/拾取时间：
                      {formatDateTime(item.eventTime)}
                    </Text>
                  </Flex>
                </Card>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Modal
        title={detailItem ? `${detailItem.itemName} 信息详情` : '物品详情'}
        open={Boolean(detailItem)}
        onCancel={closeDetail}
        footer={null}
        width={760}
        maskClosable={!isSaving}
        closable={!isSaving}
        destroyOnHidden
        styles={{ body: { maxHeight: '72vh', overflowY: 'auto', paddingTop: 12 } }}
      >
        {detailItem && (
          <Flex vertical gap={16}>
            <Card size="small" title="物品详情">
              <Flex vertical gap={12}>
                <Descriptions
                  size="small"
                  column={1}
                  items={[
                    { label: '物品类型', children: detailItem.itemType },
                    { label: '名称', children: detailItem.itemName },
                    {
                      label: '物品状态',
                      children: (
                        <Tag color={STATUS_COLOR[detailItem.status]}>
                          {STATUS_LABEL[detailItem.status]}
                        </Tag>
                      ),
                    },
                    { label: '描述特征', children: `${detailItem.description} ${detailItem.features}` },
                    {
                      label: '拾取/丢失校区',
                      children: detailItem.campus,
                    },
                    { label: '具体地点', children: detailItem.locationDetail },
                    {
                      label: '时间范围',
                      children: formatDateTime(detailItem.eventTime),
                    },
                    { label: '存放地点', children: detailItem.storageLocation },
                    { label: '认领人数', children: `${detailItem.claimCount}` },
                    { label: '联系方式', children: detailItem.contactPhone },
                    {
                      label: '有无悬赏',
                      children: detailItem.hasReward
                        ? `有${detailItem.rewardAmount ? `（¥${detailItem.rewardAmount}）` : ''}`
                        : '无',
                    },
                  ]}
                />

                <Flex vertical gap={8}>
                  <Text strong>照片</Text>
                  {detailItem.photos.length > 0
                    ? (
                        <Image.PreviewGroup>
                          <Flex gap={8} wrap justify="start">
                            {detailItem.photos.slice(0, 3).map(photo => (
                              <Image
                                key={`${detailItem.id}-${photo}`}
                                src={photo}
                                alt={`${detailItem.itemName}-照片`}
                                width={112}
                                height={80}
                                style={{ borderRadius: 8, objectFit: 'cover' }}
                              />
                            ))}
                          </Flex>
                        </Image.PreviewGroup>
                      )
                    : (
                        <Text type="secondary">无</Text>
                      )}
                </Flex>
              </Flex>
            </Card>

            <Card size="small" title="信息维护">
              <Flex vertical gap={10}>
                <Flex justify="start">
                  <Button onClick={handleStartEdit} disabled={editMode || isSaving}>
                    更改信息
                  </Button>
                </Flex>

                {editMode && (
                  <Space direction="vertical" size={8} className="w-full">
                    <Input
                      value={editingStorageLocation}
                      maxLength={30}
                      placeholder="请输入新的存放地点（最多 30 字）"
                      onChange={event => setEditingStorageLocation(event.target.value)}
                    />

                    <Input
                      value={editingContactPhone}
                      maxLength={11}
                      placeholder="请输入新的联系方式（11 位数字）"
                      onChange={event => setEditingContactPhone(event.target.value.replace(/\D/g, ''))}
                    />

                    <Flex gap={8}>
                      <Button onClick={handleCancelEdit} disabled={isSaving}>
                        取消
                      </Button>

                      <Button type="primary" onClick={handleConfirmEdit} loading={isSaving}>
                        确认
                      </Button>
                    </Flex>
                  </Space>
                )}
              </Flex>
            </Card>

            <Flex justify="end">
              <Button onClick={closeDetail} disabled={isSaving}>
                返回
              </Button>
            </Flex>
          </Flex>
        )}
      </Modal>

      <Modal
        title="其它类型"
        open={customTypeOpen}
        onCancel={() => {
          setCustomTypeOpen(false)
          setCustomTypeInput('')
        }}
        onOk={handleCustomTypeConfirm}
        okText="确认"
        cancelText="取消"
        destroyOnHidden
      >
        <Input
          value={customTypeInput}
          maxLength={15}
          placeholder="请输入物品类型（最多 15 字）"
          onChange={event => setCustomTypeInput(event.target.value)}
        />
      </Modal>
    </Flex>
  )
}

'use client'

import type { SegmentedProps } from 'antd'
import { App, Button, Card, Descriptions, Empty, Flex, Image, Input, Modal, Segmented, Space, Tag, Typography } from 'antd'
import { useMemo, useState } from 'react'

const { TextArea } = Input
const { Text, Title } = Typography

const CLAIM_TIMEOUT_DAYS = 30
const MS_PER_DAY = 24 * 60 * 60 * 1000

type ItemTab = 'lost' | 'found'
type PublishKind = 'lost' | 'found'
type ItemFlowStatus = 'unmatched' | 'matched' | 'archived'

interface ManagedItem {
  id: string
  kind: PublishKind
  status: ItemFlowStatus
  itemType: string
  itemName: string
  location: string
  eventTime: string
  features: string
  contactName: string
  contactPhone: string
  hasReward: boolean
  rewardAmount?: number
  photos: string[]
  extraProof: string
  approvedAt: string
  claimCount: number
  archiveMethod?: string
}

type ManagedSeedItem = Omit<ManagedItem, 'approvedAt' | 'eventTime' | 'id' | 'photos'> & {
  approvedDaysAgo: number
  eventDaysAgo: number
  photoEnd: string
  photoStart: string
  photoTitle: string
}

const KIND_LABEL: Record<PublishKind, string> = {
  lost: '失物',
  found: '招领',
}

const STATUS_LABEL: Record<ItemFlowStatus, string> = {
  unmatched: '未匹配',
  matched: '已匹配',
  archived: '已归档',
}

const STATUS_COLOR: Record<ItemFlowStatus, string> = {
  unmatched: 'processing',
  matched: 'success',
  archived: 'default',
}

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
    <text x="300" y="225" fill="#fff" font-size="44" text-anchor="middle" font-family="PingFang SC, Microsoft YaHei, sans-serif">${title}</text>
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

const MANAGED_SEED_ITEMS: ManagedSeedItem[] = [
  {
    kind: 'lost',
    status: 'unmatched',
    itemType: '证件',
    itemName: '校园卡',
    location: '图书馆三层自习区',
    eventDaysAgo: 2,
    approvedDaysAgo: 1,
    features: '蓝色挂绳，背面有猫咪贴纸',
    contactName: '张同学',
    contactPhone: '13800001234',
    hasReward: false,
    claimCount: 0,
    extraProof: '卡号尾号 4821，卡套边缘有磨损痕迹。',
    photoTitle: '校园卡',
    photoStart: '#3b82f6',
    photoEnd: '#60a5fa',
  },
  {
    kind: 'found',
    status: 'unmatched',
    itemType: '包袋',
    itemName: '灰色双肩包',
    location: '体育馆看台二层',
    eventDaysAgo: 5,
    approvedDaysAgo: 4,
    features: '前袋有校徽，内含一本高数笔记',
    contactName: '赵老师',
    contactPhone: '13600009999',
    hasReward: false,
    claimCount: 0,
    extraProof: '背包夹层中有写着“机械原理”的手写草稿。',
    photoTitle: '灰色双肩包',
    photoStart: '#60a5fa',
    photoEnd: '#2563eb',
  },
  {
    kind: 'lost',
    status: 'unmatched',
    itemType: '电子产品',
    itemName: 'AirPods 充电盒',
    location: '一食堂东门',
    eventDaysAgo: 10,
    approvedDaysAgo: 8,
    features: '白色保护套，壳体有轻微划痕',
    contactName: '李老师',
    contactPhone: '13900004567',
    hasReward: true,
    rewardAmount: 80,
    claimCount: 0,
    extraProof: '盒盖内侧印有字母“LQ”，右下角有小磕碰。',
    photoTitle: 'AirPods 盒',
    photoStart: '#0ea5e9',
    photoEnd: '#0284c7',
  },
  {
    kind: 'found',
    status: 'matched',
    itemType: '生活用品',
    itemName: '银色保温杯',
    location: '一食堂二楼靠窗区',
    eventDaysAgo: 14,
    approvedDaysAgo: 13,
    features: '杯盖有星星贴纸',
    contactName: '马同学',
    contactPhone: '13000006666',
    hasReward: false,
    claimCount: 1,
    extraProof: '杯底有激光刻字“M-12”。',
    photoTitle: '保温杯',
    photoStart: '#38bdf8',
    photoEnd: '#1d4ed8',
  },
  {
    kind: 'lost',
    status: 'unmatched',
    itemType: '包袋',
    itemName: '棕色钱包',
    location: '教学楼 B 座连廊',
    eventDaysAgo: 22,
    approvedDaysAgo: 20,
    features: '内有交通卡，拉链头磨损',
    contactName: '陈同学',
    contactPhone: '13300003333',
    hasReward: true,
    rewardAmount: 150,
    claimCount: 0,
    extraProof: '钱包内夹层有两张电影票根。',
    photoTitle: '棕色钱包',
    photoStart: '#2563eb',
    photoEnd: '#1e40af',
  },
  {
    kind: 'found',
    status: 'unmatched',
    itemType: '钥匙',
    itemName: '钥匙串',
    location: '三教楼下长椅',
    eventDaysAgo: 25,
    approvedDaysAgo: 24,
    features: '蓝色小熊挂件，三把钥匙',
    contactName: '高同学',
    contactPhone: '13200004444',
    hasReward: false,
    claimCount: 0,
    extraProof: '其中一把钥匙有“D-12”标记。',
    photoTitle: '钥匙串',
    photoStart: '#3b82f6',
    photoEnd: '#1d4ed8',
  },
  {
    kind: 'lost',
    status: 'unmatched',
    itemType: '书本文具',
    itemName: '蓝色笔记本',
    location: '学院楼 105 教室',
    eventDaysAgo: 33,
    approvedDaysAgo: 31,
    features: '封面贴有课程表，夹页有便签',
    contactName: '宋同学',
    contactPhone: '13700009998',
    hasReward: true,
    rewardAmount: 50,
    claimCount: 0,
    extraProof: '内页有“数据结构”章节手绘思维导图。',
    photoTitle: '蓝色笔记本',
    photoStart: '#60a5fa',
    photoEnd: '#1e3a8a',
  },
  {
    kind: 'found',
    status: 'unmatched',
    itemType: '衣物',
    itemName: '米白色外套',
    location: '北门快递点旁',
    eventDaysAgo: 36,
    approvedDaysAgo: 34,
    features: '左臂有蓝色条纹，M 码',
    contactName: '冯老师',
    contactPhone: '13600001010',
    hasReward: false,
    claimCount: 0,
    extraProof: '内衬口袋里有一张健身房体验卡。',
    photoTitle: '米白外套',
    photoStart: '#93c5fd',
    photoEnd: '#2563eb',
  },
  {
    kind: 'lost',
    status: 'archived',
    itemType: '摄影器材',
    itemName: '镜头盖',
    location: '艺术楼影棚',
    eventDaysAgo: 45,
    approvedDaysAgo: 43,
    features: '52mm 口径，边缘有白色划痕',
    contactName: '蒋老师',
    contactPhone: '13600008765',
    hasReward: false,
    claimCount: 0,
    archiveMethod: '已移交保卫处失物柜，保留 90 天后统一处理。',
    extraProof: '边缘刻有“JY”字样，可作为识别依据。',
    photoTitle: '镜头盖',
    photoStart: '#3b82f6',
    photoEnd: '#1e3a8a',
  },
  {
    kind: 'found',
    status: 'matched',
    itemType: '电子产品',
    itemName: '机械键盘',
    location: '创新实验室 305',
    eventDaysAgo: 52,
    approvedDaysAgo: 50,
    features: '白色 87 键，缺失 ESC 键帽',
    contactName: '樊同学',
    contactPhone: '13100006688',
    hasReward: false,
    claimCount: 2,
    extraProof: '机身背部序列号尾号 49A。',
    photoTitle: '机械键盘',
    photoStart: '#38bdf8',
    photoEnd: '#2563eb',
  },
  {
    kind: 'lost',
    status: 'unmatched',
    itemType: '电子产品',
    itemName: '黑色 U 盘',
    location: '教学楼 C 座 402',
    eventDaysAgo: 56,
    approvedDaysAgo: 55,
    features: 'USB 3.0，挂绳为橙色',
    contactName: '卢同学',
    contactPhone: '13000008899',
    hasReward: false,
    claimCount: 0,
    extraProof: '存储空间 64G，外壳侧面有白点。',
    photoTitle: '黑色U盘',
    photoStart: '#1d4ed8',
    photoEnd: '#0ea5e9',
  },
  {
    kind: 'found',
    status: 'archived',
    itemType: '钥匙',
    itemName: '车钥匙',
    location: '东门停车场入口',
    eventDaysAgo: 61,
    approvedDaysAgo: 59,
    features: '黑色遥控钥匙，挂件为银色圆环',
    contactName: '苏老师',
    contactPhone: '13500009761',
    hasReward: false,
    claimCount: 0,
    archiveMethod: '联系校警备案后封存于车钥匙专项箱。',
    extraProof: '钥匙背面有“R7”刻痕。',
    photoTitle: '车钥匙',
    photoStart: '#2563eb',
    photoEnd: '#0ea5e9',
  },
]

const INITIAL_MANAGED_ITEMS: ManagedItem[] = MANAGED_SEED_ITEMS.map((item, index) => {
  const { approvedDaysAgo, eventDaysAgo, photoEnd, photoStart, photoTitle, ...rest } = item

  return {
    ...rest,
    id: `managed-${item.kind}-${index + 1}`,
    eventTime: createDateByDaysAgo(eventDaysAgo, 10, 15),
    approvedAt: createDateByDaysAgo(approvedDaysAgo, 16, 30),
    photos: [buildMockPhoto(photoTitle, photoStart, photoEnd)],
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

function getApprovedDays(item: ManagedItem) {
  const diff = Date.now() - toTimestamp(item.approvedAt)
  return Math.max(0, Math.floor(diff / MS_PER_DAY))
}

function getDaysToArchive(item: ManagedItem) {
  return Math.max(0, CLAIM_TIMEOUT_DAYS - getApprovedDays(item))
}

function isArchiveEligible(item: ManagedItem) {
  return item.status === 'unmatched'
    && item.claimCount === 0
    && getApprovedDays(item) >= CLAIM_TIMEOUT_DAYS
}

function getArchiveGuardText(item: ManagedItem) {
  if (item.status === 'archived')
    return '该条信息已归档。'

  if (item.status === 'matched' || item.claimCount > 0)
    return '已有认领记录，不能归档。'

  const daysToArchive = getDaysToArchive(item)
  if (daysToArchive > 0)
    return `需满 ${CLAIM_TIMEOUT_DAYS} 天无人认领后可归档，当前还需 ${daysToArchive} 天。`

  return ''
}

function ManagedInfoBlock({ item }: { item: ManagedItem }) {
  const locationLabel = item.kind === 'lost' ? '丢失地点' : '拾取地点'
  const timeLabel = item.kind === 'lost' ? '丢失时间' : '拾取时间'
  const rewardText = item.hasReward
    ? `有${item.rewardAmount ? `（¥${item.rewardAmount}）` : ''}`
    : '无'

  return (
    <Flex vertical gap={12}>
      <Descriptions
        column={1}
        size="small"
        items={[
          {
            label: '物品状态',
            children: (
              <Tag color={STATUS_COLOR[item.status]}>
                {STATUS_LABEL[item.status]}
              </Tag>
            ),
          },
          { label: '物品类型', children: item.itemType },
          { label: '物品名称', children: item.itemName },
          { label: locationLabel, children: item.location },
          { label: timeLabel, children: formatDateTime(item.eventTime) },
          { label: '物品特征', children: item.features },
          { label: '联系人', children: item.contactName },
          { label: '联系电话', children: item.contactPhone },
          { label: '是否有悬赏', children: rewardText },
          { label: '审核通过时间', children: formatDateTime(item.approvedAt) },
          { label: '认领人数', children: `${item.claimCount}` },
        ]}
      />

      <Flex vertical gap={8}>
        <Text strong>物品相关照片</Text>
        {item.photos.length > 0
          ? (
              <Image.PreviewGroup>
                <Flex gap={8} wrap>
                  {item.photos.map(photo => (
                    <Image
                      key={`${item.id}-${photo}`}
                      src={photo}
                      alt={`${item.itemName}-照片`}
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
  )
}

interface ManagedItemGridProps {
  items: ManagedItem[]
  onSelect: (item: ManagedItem) => void
}

function ManagedItemGrid({ items, onSelect }: ManagedItemGridProps) {
  return (
    <Card title="已通过列表" styles={{ body: { padding: '12px 14px' } }}>
      {items.length === 0
        ? (
            <div className="py-10">
              <Empty description="当前没有可管理的物品信息" />
            </div>
          )
        : (
            <div className="max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => {
                  const daysToArchive = getDaysToArchive(item)

                  return (
                    <Card
                      key={item.id}
                      hoverable
                      size="small"
                      className="h-full"
                      onClick={() => onSelect(item)}
                    >
                      <Flex vertical gap={8}>
                        <Flex justify="space-between" align="center" wrap>
                          <Text strong>{item.itemName}</Text>
                          <Tag color={STATUS_COLOR[item.status]}>{STATUS_LABEL[item.status]}</Tag>
                        </Flex>

                        <Text type="secondary">{item.itemType}</Text>

                        <Text type="secondary">
                          {item.kind === 'lost' ? '丢失地点：' : '拾取地点：'}
                          {item.location}
                        </Text>

                        <Text type="secondary">
                          通过时间：
                          {formatDateTime(item.approvedAt)}
                        </Text>

                        <Text type="secondary">
                          认领人数：
                          {item.claimCount}
                        </Text>

                        {item.status === 'unmatched' && (
                          <Text type="secondary">
                            {daysToArchive > 0 ? `距可归档还需 ${daysToArchive} 天` : '已满足归档条件'}
                          </Text>
                        )}

                        {item.status === 'archived' && item.archiveMethod && (
                          <Text type="secondary" ellipsis={{ tooltip: item.archiveMethod }}>
                            归档方式：
                            {item.archiveMethod}
                          </Text>
                        )}
                      </Flex>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
    </Card>
  )
}

export default function ItemStatusPage() {
  const { message } = App.useApp()

  const [activeTab, setActiveTab] = useState<ItemTab>('lost')
  const [items, setItems] = useState<ManagedItem[]>(INITIAL_MANAGED_ITEMS)

  const [currentItem, setCurrentItem] = useState<ManagedItem | null>(null)
  const [showArchiveEditor, setShowArchiveEditor] = useState(false)
  const [archiveMethodInput, setArchiveMethodInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const sortedItems = useMemo(
    () => items
      .filter(item => item.kind === activeTab)
      .sort((a, b) => toTimestamp(b.approvedAt) - toTimestamp(a.approvedAt)),
    [activeTab, items],
  )

  const lostCount = useMemo(() => items.filter(item => item.kind === 'lost').length, [items])
  const foundCount = useMemo(() => items.filter(item => item.kind === 'found').length, [items])

  const tabOptions = useMemo<SegmentedProps['options']>(
    () => [
      { label: `失物（${lostCount}）`, value: 'lost' },
      { label: `招领（${foundCount}）`, value: 'found' },
    ],
    [foundCount, lostCount],
  )

  const resetArchiveState = () => {
    setShowArchiveEditor(false)
    setArchiveMethodInput('')
  }

  const closeModal = () => {
    if (isSubmitting)
      return

    setCurrentItem(null)
    resetArchiveState()
  }

  const openModal = (item: ManagedItem) => {
    setCurrentItem(item)
    resetArchiveState()
  }

  const updateCurrentItem = (nextItem: ManagedItem) => {
    setItems(prev => prev.map(item => (item.id === nextItem.id ? nextItem : item)))
    setCurrentItem(nextItem)
  }

  const handleClaimed = async () => {
    if (!currentItem || currentItem.status !== 'unmatched')
      return

    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 350))

    const nextItem: ManagedItem = {
      ...currentItem,
      claimCount: currentItem.claimCount + 1,
      status: 'matched',
    }

    updateCurrentItem(nextItem)
    resetArchiveState()
    setIsSubmitting(false)
    message.success('已标记为“已匹配”，认领人数已加 1')
  }

  const handleArchiveConfirm = async () => {
    const method = archiveMethodInput.trim()
    if (!currentItem || !method || !isArchiveEligible(currentItem))
      return

    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 350))

    const nextItem: ManagedItem = {
      ...currentItem,
      archiveMethod: method,
      status: 'archived',
    }

    updateCurrentItem(nextItem)
    resetArchiveState()
    setIsSubmitting(false)
    message.success('已归档，物品状态已更新为“已归档”')
  }

  const handleArchiveCancel = () => {
    if (isSubmitting)
      return

    resetArchiveState()
  }

  const canClaim = currentItem?.status === 'unmatched'
  const canArchive = currentItem ? isArchiveEligible(currentItem) : false
  const archiveGuardText = currentItem ? getArchiveGuardText(currentItem) : ''

  return (
    <Flex vertical gap={16}>
      <Card styles={{ body: { padding: 16 } }}>
        <Flex vertical gap={12}>
          <Title level={4} className="!mb-0 !text-slate-900">
            管理物品状态
          </Title>

          <Segmented
            block
            options={tabOptions}
            value={activeTab}
            onChange={value => setActiveTab(value as ItemTab)}
          />
        </Flex>
      </Card>

      <ManagedItemGrid items={sortedItems} onSelect={openModal} />

      <Modal
        title={currentItem ? `${KIND_LABEL[currentItem.kind]}信息` : '物品信息'}
        open={Boolean(currentItem)}
        onCancel={closeModal}
        footer={null}
        width={760}
        maskClosable={!isSubmitting}
        closable={!isSubmitting}
        destroyOnHidden
        styles={{ body: { maxHeight: '72vh', overflowY: 'auto', paddingTop: 12 } }}
      >
        {currentItem && (
          <Flex vertical gap={16}>
            <Card size="small" title="物品信息">
              <ManagedInfoBlock item={currentItem} />
            </Card>

            <Card size="small" title="物品额外特征或相关证明信息">
              <Space direction="vertical" size={8} className="w-full">
                <Text>{currentItem.extraProof}</Text>
                {currentItem.archiveMethod && (
                  <Text type="secondary">
                    归档处理方式：
                    {currentItem.archiveMethod}
                  </Text>
                )}
              </Space>
            </Card>

            <Flex justify="space-between" align="start" gap={16} wrap>
              <Flex vertical gap={10} className="w-full sm:max-w-[420px]">
                <Button
                  onClick={() => setShowArchiveEditor(true)}
                  disabled={!canArchive || isSubmitting}
                >
                  已归档
                </Button>

                {!showArchiveEditor && archiveGuardText && (
                  <Text type="secondary">{archiveGuardText}</Text>
                )}

                {showArchiveEditor && (
                  <Space direction="vertical" size={8} className="w-full">
                    <TextArea
                      value={archiveMethodInput}
                      maxLength={100}
                      showCount
                      placeholder="请输入物品处理方式（最多 100 字）"
                      autoSize={{ minRows: 3, maxRows: 5 }}
                      onChange={event => setArchiveMethodInput(event.target.value)}
                    />

                    <Flex gap={8}>
                      <Button onClick={handleArchiveCancel} disabled={isSubmitting}>
                        取消
                      </Button>

                      <Button
                        type="primary"
                        onClick={handleArchiveConfirm}
                        disabled={!archiveMethodInput.trim()}
                        loading={isSubmitting}
                      >
                        确认
                      </Button>
                    </Flex>
                  </Space>
                )}
              </Flex>

              <Button
                type="primary"
                onClick={handleClaimed}
                disabled={!canClaim || isSubmitting}
                loading={isSubmitting}
              >
                已认领
              </Button>
            </Flex>

            <Flex justify="end">
              <Button onClick={closeModal} disabled={isSubmitting}>
                返回
              </Button>
            </Flex>
          </Flex>
        )}
      </Modal>
    </Flex>
  )
}

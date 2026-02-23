'use client'

import type { SegmentedProps } from 'antd'
import { App, Button, Card, Descriptions, Empty, Flex, Image, Input, Modal, Segmented, Space, Tag, Typography } from 'antd'
import { useMemo, useState } from 'react'

const { TextArea } = Input
const { Text, Title } = Typography

type ReviewTab = 'lost' | 'found' | 'history'
type PublishKind = 'lost' | 'found'
type ReviewResult = 'approved' | 'rejected'

interface PublishInfo {
  id: string
  kind: PublishKind
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
  publishedAt: string
}

interface ReviewHistoryItem extends PublishInfo {
  rejectReason?: string
  reviewResult: ReviewResult
  reviewedAt: string
  reviewer: string
}

const KIND_LABEL: Record<PublishKind, string> = {
  lost: '失物',
  found: '招领',
}

const RESULT_LABEL: Record<ReviewResult, string> = {
  approved: '已通过',
  rejected: '已驳回',
}

const RESULT_COLOR: Record<ReviewResult, string> = {
  approved: 'success',
  rejected: 'error',
}

const REVIEWER_NAME = '系统管理员'

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

type PendingSeedItem = Omit<PublishInfo, 'id' | 'photos'> & {
  photoEnd: string
  photoStart: string
  photoTitle: string
}

type HistorySeedItem = Omit<ReviewHistoryItem, 'id' | 'photos' | 'reviewer'> & {
  photoEnd: string
  photoStart: string
  photoTitle: string
}

const PENDING_SEED_ITEMS: PendingSeedItem[] = [
  {
    kind: 'lost',
    itemType: '证件',
    itemName: '校园卡',
    location: '图书馆三层自习区',
    eventTime: '2026-02-21T08:40:00+08:00',
    features: '蓝色挂绳，背面有猫咪贴纸',
    contactName: '张同学',
    contactPhone: '13800001234',
    hasReward: false,
    publishedAt: '2026-02-22T18:20:00+08:00',
    photoTitle: '校园卡',
    photoStart: '#3b82f6',
    photoEnd: '#60a5fa',
  },
  {
    kind: 'found',
    itemType: '生活用品',
    itemName: '黑色雨伞',
    location: '教学楼 A 座 203 教室',
    eventTime: '2026-02-22T09:30:00+08:00',
    features: '折叠伞，伞柄有银色挂扣',
    contactName: '王同学',
    contactPhone: '13700006789',
    hasReward: false,
    publishedAt: '2026-02-22T17:40:00+08:00',
    photoTitle: '黑色雨伞',
    photoStart: '#2563eb',
    photoEnd: '#1d4ed8',
  },
  {
    kind: 'lost',
    itemType: '电子产品',
    itemName: 'AirPods 充电盒',
    location: '一食堂东门',
    eventTime: '2026-02-20T12:15:00+08:00',
    features: '白色保护套，壳体有轻微划痕',
    contactName: '李老师',
    contactPhone: '13900004567',
    hasReward: true,
    rewardAmount: 80,
    publishedAt: '2026-02-22T14:10:00+08:00',
    photoTitle: 'AirPods 盒',
    photoStart: '#0ea5e9',
    photoEnd: '#0284c7',
  },
  {
    kind: 'found',
    itemType: '包袋',
    itemName: '灰色双肩包',
    location: '体育馆看台二层',
    eventTime: '2026-02-21T19:05:00+08:00',
    features: '前袋有校徽，内含一本高数笔记',
    contactName: '赵老师',
    contactPhone: '13600009999',
    hasReward: true,
    rewardAmount: 120,
    publishedAt: '2026-02-22T13:05:00+08:00',
    photoTitle: '灰色双肩包',
    photoStart: '#60a5fa',
    photoEnd: '#2563eb',
  },
  {
    kind: 'lost',
    itemType: '包袋',
    itemName: '棕色钱包',
    location: '教学楼 B 座连廊',
    eventTime: '2026-02-22T10:20:00+08:00',
    features: '内有交通卡，拉链头磨损',
    contactName: '陈同学',
    contactPhone: '13300003333',
    hasReward: true,
    rewardAmount: 150,
    publishedAt: '2026-02-22T11:32:00+08:00',
    photoTitle: '棕色钱包',
    photoStart: '#2563eb',
    photoEnd: '#1e40af',
  },
  {
    kind: 'found',
    itemType: '钥匙',
    itemName: '钥匙串',
    location: '三教楼下长椅',
    eventTime: '2026-02-22T08:50:00+08:00',
    features: '蓝色小熊挂件，三把钥匙',
    contactName: '高同学',
    contactPhone: '13200004444',
    hasReward: false,
    publishedAt: '2026-02-22T09:18:00+08:00',
    photoTitle: '钥匙串',
    photoStart: '#3b82f6',
    photoEnd: '#1d4ed8',
  },
  {
    kind: 'lost',
    itemType: '配饰',
    itemName: '黑框眼镜',
    location: '实验楼 402 教室',
    eventTime: '2026-02-21T20:30:00+08:00',
    features: '镜框左侧有白色划痕',
    contactName: '何老师',
    contactPhone: '13100005555',
    hasReward: false,
    publishedAt: '2026-02-21T21:16:00+08:00',
    photoTitle: '黑框眼镜',
    photoStart: '#0ea5e9',
    photoEnd: '#2563eb',
  },
  {
    kind: 'found',
    itemType: '生活用品',
    itemName: '银色保温杯',
    location: '一食堂二楼靠窗区',
    eventTime: '2026-02-21T18:40:00+08:00',
    features: '杯盖有星星贴纸',
    contactName: '马同学',
    contactPhone: '13000006666',
    hasReward: false,
    publishedAt: '2026-02-21T20:20:00+08:00',
    photoTitle: '保温杯',
    photoStart: '#38bdf8',
    photoEnd: '#1d4ed8',
  },
  {
    kind: 'lost',
    itemType: '电子产品',
    itemName: '金属 U 盘',
    location: '信息楼机房门口',
    eventTime: '2026-02-21T16:48:00+08:00',
    features: '银色 64G，带红色挂绳',
    contactName: '徐同学',
    contactPhone: '13900007777',
    hasReward: false,
    publishedAt: '2026-02-21T17:55:00+08:00',
    photoTitle: '金属U盘',
    photoStart: '#1d4ed8',
    photoEnd: '#3b82f6',
  },
  {
    kind: 'found',
    itemType: '电子产品',
    itemName: '有线耳机',
    location: '操场东看台',
    eventTime: '2026-02-21T13:56:00+08:00',
    features: '白色线材，3.5mm 接口',
    contactName: '吕同学',
    contactPhone: '13800008888',
    hasReward: false,
    publishedAt: '2026-02-21T15:08:00+08:00',
    photoTitle: '有线耳机',
    photoStart: '#0284c7',
    photoEnd: '#2563eb',
  },
  {
    kind: 'lost',
    itemType: '书本文具',
    itemName: '蓝色笔记本',
    location: '学院楼 105 教室',
    eventTime: '2026-02-21T11:58:00+08:00',
    features: '封面贴有课程表，夹页有便签',
    contactName: '宋同学',
    contactPhone: '13700009998',
    hasReward: true,
    rewardAmount: 50,
    publishedAt: '2026-02-21T12:31:00+08:00',
    photoTitle: '蓝色笔记本',
    photoStart: '#60a5fa',
    photoEnd: '#1e3a8a',
  },
  {
    kind: 'found',
    itemType: '衣物',
    itemName: '米白色外套',
    location: '北门快递点旁',
    eventTime: '2026-02-21T07:35:00+08:00',
    features: '左臂有蓝色条纹，M 码',
    contactName: '冯老师',
    contactPhone: '13600001010',
    hasReward: false,
    publishedAt: '2026-02-21T08:42:00+08:00',
    photoTitle: '米白外套',
    photoStart: '#93c5fd',
    photoEnd: '#2563eb',
  },
]

const INITIAL_PENDING_ITEMS: PublishInfo[] = PENDING_SEED_ITEMS.map((item, index) => {
  const { photoEnd, photoStart, photoTitle, ...rest } = item

  return {
    ...rest,
    id: `pending-${item.kind}-${index + 1}`,
    photos: [buildMockPhoto(photoTitle, photoStart, photoEnd)],
  }
})

const HISTORY_SEED_ITEMS: HistorySeedItem[] = [
  {
    kind: 'found',
    itemType: '证件',
    itemName: '身份证',
    location: '主楼大厅服务台',
    eventTime: '2026-02-20T16:00:00+08:00',
    features: '卡套透明，附钥匙圈',
    contactName: '孙老师',
    contactPhone: '13500001111',
    hasReward: false,
    publishedAt: '2026-02-20T18:05:00+08:00',
    reviewResult: 'approved',
    reviewedAt: '2026-02-20T19:30:00+08:00',
    photoTitle: '身份证',
    photoStart: '#1d4ed8',
    photoEnd: '#3b82f6',
  },
  {
    kind: 'lost',
    itemType: '电子产品',
    itemName: '平板电脑',
    location: '自习楼一层休息区',
    eventTime: '2026-02-20T14:20:00+08:00',
    features: '深空灰色，保护壳右下角破损',
    contactName: '周同学',
    contactPhone: '13400002222',
    hasReward: true,
    rewardAmount: 200,
    publishedAt: '2026-02-20T15:08:00+08:00',
    reviewResult: 'rejected',
    reviewedAt: '2026-02-20T17:05:00+08:00',
    rejectReason: '关键描述不完整，请补充设备序列特征后重新提交。',
    photoTitle: '平板电脑',
    photoStart: '#3b82f6',
    photoEnd: '#0ea5e9',
  },
  {
    kind: 'found',
    itemType: '电子产品',
    itemName: '蓝牙耳机盒',
    location: '图书馆借阅台',
    eventTime: '2026-02-20T13:10:00+08:00',
    features: '深灰色外壳，右侧有小裂痕',
    contactName: '吴同学',
    contactPhone: '13300002211',
    hasReward: false,
    publishedAt: '2026-02-20T13:40:00+08:00',
    reviewResult: 'approved',
    reviewedAt: '2026-02-20T15:12:00+08:00',
    photoTitle: '蓝牙耳机',
    photoStart: '#0ea5e9',
    photoEnd: '#1d4ed8',
  },
  {
    kind: 'lost',
    itemType: '包袋',
    itemName: '深蓝钱包',
    location: '行政楼一层走廊',
    eventTime: '2026-02-20T09:22:00+08:00',
    features: '内有饭卡和门禁卡',
    contactName: '段老师',
    contactPhone: '13200003344',
    hasReward: true,
    rewardAmount: 100,
    publishedAt: '2026-02-20T10:03:00+08:00',
    reviewResult: 'approved',
    reviewedAt: '2026-02-20T11:48:00+08:00',
    photoTitle: '深蓝钱包',
    photoStart: '#2563eb',
    photoEnd: '#1e40af',
  },
  {
    kind: 'found',
    itemType: '电子产品',
    itemName: '机械键盘',
    location: '创新实验室 305',
    eventTime: '2026-02-19T18:50:00+08:00',
    features: '白色 87 键，缺失 ESC 键帽',
    contactName: '樊同学',
    contactPhone: '13100006688',
    hasReward: false,
    publishedAt: '2026-02-19T19:15:00+08:00',
    reviewResult: 'rejected',
    reviewedAt: '2026-02-19T20:33:00+08:00',
    rejectReason: '发布照片与文字描述不一致，请核实后重新提交。',
    photoTitle: '机械键盘',
    photoStart: '#38bdf8',
    photoEnd: '#2563eb',
  },
  {
    kind: 'lost',
    itemType: '电子产品',
    itemName: '黑色 U 盘',
    location: '教学楼 C 座 402',
    eventTime: '2026-02-19T16:05:00+08:00',
    features: 'USB 3.0，挂绳为橙色',
    contactName: '卢同学',
    contactPhone: '13000008899',
    hasReward: false,
    publishedAt: '2026-02-19T16:40:00+08:00',
    reviewResult: 'approved',
    reviewedAt: '2026-02-19T18:02:00+08:00',
    photoTitle: '黑色U盘',
    photoStart: '#1d4ed8',
    photoEnd: '#0ea5e9',
  },
  {
    kind: 'found',
    itemType: '衣物',
    itemName: '黑色羽绒服',
    location: '体育馆更衣区',
    eventTime: '2026-02-19T14:10:00+08:00',
    features: '胸前白色字母 LOGO，L 码',
    contactName: '谭老师',
    contactPhone: '13900001221',
    hasReward: false,
    publishedAt: '2026-02-19T14:48:00+08:00',
    reviewResult: 'approved',
    reviewedAt: '2026-02-19T15:25:00+08:00',
    photoTitle: '羽绒服',
    photoStart: '#60a5fa',
    photoEnd: '#1d4ed8',
  },
  {
    kind: 'lost',
    itemType: '配饰',
    itemName: '半框眼镜',
    location: '化学楼 210 实验室',
    eventTime: '2026-02-19T08:55:00+08:00',
    features: '镜腿尾部有蓝色保护套',
    contactName: '贺同学',
    contactPhone: '13800002112',
    hasReward: false,
    publishedAt: '2026-02-19T09:25:00+08:00',
    reviewResult: 'rejected',
    reviewedAt: '2026-02-19T10:44:00+08:00',
    rejectReason: '联系人信息填写不完整，请补充后再提交。',
    photoTitle: '半框眼镜',
    photoStart: '#0ea5e9',
    photoEnd: '#3b82f6',
  },
  {
    kind: 'found',
    itemType: '生活用品',
    itemName: '绿色保温杯',
    location: '南区食堂一层',
    eventTime: '2026-02-18T19:20:00+08:00',
    features: '杯身有“Keep”贴纸',
    contactName: '侯同学',
    contactPhone: '13700007654',
    hasReward: false,
    publishedAt: '2026-02-18T19:52:00+08:00',
    reviewResult: 'approved',
    reviewedAt: '2026-02-18T21:16:00+08:00',
    photoTitle: '绿色保温杯',
    photoStart: '#38bdf8',
    photoEnd: '#1e40af',
  },
  {
    kind: 'lost',
    itemType: '摄影器材',
    itemName: '镜头盖',
    location: '艺术楼影棚',
    eventTime: '2026-02-18T14:35:00+08:00',
    features: '52mm 口径，边缘有白色划痕',
    contactName: '蒋老师',
    contactPhone: '13600008765',
    hasReward: true,
    rewardAmount: 60,
    publishedAt: '2026-02-18T15:02:00+08:00',
    reviewResult: 'approved',
    reviewedAt: '2026-02-18T16:20:00+08:00',
    photoTitle: '镜头盖',
    photoStart: '#3b82f6',
    photoEnd: '#1e3a8a',
  },
  {
    kind: 'found',
    itemType: '钥匙',
    itemName: '车钥匙',
    location: '东门停车场入口',
    eventTime: '2026-02-18T11:50:00+08:00',
    features: '黑色遥控钥匙，挂件为银色圆环',
    contactName: '苏老师',
    contactPhone: '13500009761',
    hasReward: false,
    publishedAt: '2026-02-18T12:15:00+08:00',
    reviewResult: 'rejected',
    reviewedAt: '2026-02-18T13:05:00+08:00',
    rejectReason: '拾取地点描述过于笼统，请标注更准确的位置。',
    photoTitle: '车钥匙',
    photoStart: '#2563eb',
    photoEnd: '#0ea5e9',
  },
  {
    kind: 'lost',
    itemType: '书本文具',
    itemName: '课程资料袋',
    location: '教学楼 D 座 506',
    eventTime: '2026-02-18T08:10:00+08:00',
    features: '透明文件袋，内有数学作业与讲义',
    contactName: '潘同学',
    contactPhone: '13400004321',
    hasReward: false,
    publishedAt: '2026-02-18T08:42:00+08:00',
    reviewResult: 'approved',
    reviewedAt: '2026-02-18T09:42:00+08:00',
    photoTitle: '课程资料袋',
    photoStart: '#60a5fa',
    photoEnd: '#1d4ed8',
  },
]

const INITIAL_HISTORY_ITEMS: ReviewHistoryItem[] = HISTORY_SEED_ITEMS.map((item, index) => {
  const { photoEnd, photoStart, photoTitle, ...rest } = item

  return {
    ...rest,
    id: `history-${index + 1}`,
    photos: [buildMockPhoto(photoTitle, photoStart, photoEnd)],
    reviewer: REVIEWER_NAME,
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

function PublishInfoBlock({ item }: { item: PublishInfo }) {
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
          { label: '物品类型', children: item.itemType },
          { label: '物品名称', children: item.itemName },
          { label: locationLabel, children: item.location },
          { label: timeLabel, children: formatDateTime(item.eventTime) },
          { label: '物品特征', children: item.features },
          { label: '联系人', children: item.contactName },
          { label: '联系电话', children: item.contactPhone },
          { label: '是否有悬赏', children: rewardText },
          { label: '发布时间', children: formatDateTime(item.publishedAt) },
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

interface PendingReviewListProps {
  items: PublishInfo[]
  onSelect: (item: PublishInfo) => void
}

function PendingReviewList({ items, onSelect }: PendingReviewListProps) {
  return (
    <Card title="待审核列表" styles={{ body: { padding: '12px 14px' } }}>
      {items.length === 0
        ? (
            <div className="py-10">
              <Empty description="当前没有待审核信息" />
            </div>
          )
        : (
            <div className="max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {items.map(item => (
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
                        <Tag color="processing">{KIND_LABEL[item.kind]}</Tag>
                      </Flex>
                      <Text type="secondary">{item.itemType}</Text>
                      <Text type="secondary">
                        {item.kind === 'lost' ? '丢失地点：' : '拾取地点：'}
                        {item.location}
                      </Text>
                      <Text type="secondary">
                        发布时间：
                        {formatDateTime(item.publishedAt)}
                      </Text>
                    </Flex>
                  </Card>
                ))}
              </div>
            </div>
          )}
    </Card>
  )
}

interface HistoryReviewListProps {
  items: ReviewHistoryItem[]
  onSelect: (item: ReviewHistoryItem) => void
}

function HistoryReviewList({ items, onSelect }: HistoryReviewListProps) {
  return (
    <Card title="历史审核记录" styles={{ body: { padding: '12px 14px' } }}>
      {items.length === 0
        ? (
            <div className="py-10">
              <Empty description="暂无历史审核记录" />
            </div>
          )
        : (
            <div className="max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {items.map(item => (
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
                        <Tag color={RESULT_COLOR[item.reviewResult]}>
                          {RESULT_LABEL[item.reviewResult]}
                        </Tag>
                      </Flex>
                      <Text type="secondary">
                        发布类型：
                        {KIND_LABEL[item.kind]}
                      </Text>
                      <Text type="secondary">
                        审核时间：
                        {formatDateTime(item.reviewedAt)}
                      </Text>
                      <Text type="secondary">
                        审核人：
                        {item.reviewer}
                      </Text>
                    </Flex>
                  </Card>
                ))}
              </div>
            </div>
          )}
    </Card>
  )
}

export default function ReviewPublishPage() {
  const { message } = App.useApp()

  const [activeTab, setActiveTab] = useState<ReviewTab>('lost')
  const [pendingItems, setPendingItems] = useState<PublishInfo[]>(INITIAL_PENDING_ITEMS)
  const [historyItems, setHistoryItems] = useState<ReviewHistoryItem[]>(INITIAL_HISTORY_ITEMS)

  const [currentPending, setCurrentPending] = useState<PublishInfo | null>(null)
  const [currentHistory, setCurrentHistory] = useState<ReviewHistoryItem | null>(null)

  const [rejectReason, setRejectReason] = useState('')
  const [showRejectEditor, setShowRejectEditor] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const pendingKind: PublishKind = activeTab === 'found' ? 'found' : 'lost'

  const sortedPending = useMemo(
    () => pendingItems
      .filter(item => item.kind === pendingKind)
      .sort((a, b) => toTimestamp(b.publishedAt) - toTimestamp(a.publishedAt)),
    [pendingItems, pendingKind],
  )

  const sortedHistory = useMemo(
    () => [...historyItems].sort((a, b) => toTimestamp(b.reviewedAt) - toTimestamp(a.reviewedAt)),
    [historyItems],
  )

  const lostPendingCount = useMemo(
    () => pendingItems.filter(item => item.kind === 'lost').length,
    [pendingItems],
  )

  const foundPendingCount = useMemo(
    () => pendingItems.filter(item => item.kind === 'found').length,
    [pendingItems],
  )

  const tabOptions = useMemo<SegmentedProps['options']>(
    () => [
      { label: `失物（${lostPendingCount}）`, value: 'lost' },
      { label: `招领（${foundPendingCount}）`, value: 'found' },
      { label: `历史审核记录（${sortedHistory.length}）`, value: 'history' },
    ],
    [foundPendingCount, lostPendingCount, sortedHistory.length],
  )

  const resetRejectState = () => {
    setShowRejectEditor(false)
    setRejectReason('')
  }

  const closePendingModal = () => {
    if (isSubmitting)
      return

    setCurrentPending(null)
    resetRejectState()
  }

  const appendHistoryRecord = (
    item: PublishInfo,
    reviewResult: ReviewResult,
    reason?: string,
  ) => {
    const reviewedItem: ReviewHistoryItem = {
      ...item,
      rejectReason: reviewResult === 'rejected' ? reason : undefined,
      reviewResult,
      reviewedAt: new Date().toISOString(),
      reviewer: REVIEWER_NAME,
    }

    setPendingItems(prev => prev.filter(entry => entry.id !== item.id))
    setHistoryItems(prev => [reviewedItem, ...prev])
  }

  const handleApprove = async () => {
    const targetItem = currentPending
    if (!targetItem)
      return

    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 350))

    appendHistoryRecord(targetItem, 'approved')

    setIsSubmitting(false)
    closePendingModal()
    message.success('审核通过，物品状态已更新为“已通过”')
  }

  const handleRejectConfirm = async () => {
    const targetItem = currentPending
    const reason = rejectReason.trim()

    if (!targetItem || !reason)
      return

    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 350))

    appendHistoryRecord(targetItem, 'rejected', reason)

    setIsSubmitting(false)
    closePendingModal()
    message.success('审核驳回成功，物品状态已更新为“已驳回”')
  }

  const handleRejectCancel = () => {
    if (isSubmitting)
      return

    resetRejectState()
  }

  const openPendingModal = (item: PublishInfo) => {
    setCurrentPending(item)
    resetRejectState()
  }

  return (
    <Flex vertical gap={16}>
      <Card styles={{ body: { padding: 16 } }}>
        <Flex vertical gap={12}>
          <Title level={4} className="!mb-0 !text-slate-900">
            审核发布信息
          </Title>
          <Segmented
            block
            options={tabOptions}
            value={activeTab}
            onChange={value => setActiveTab(value as ReviewTab)}
          />
        </Flex>
      </Card>

      {activeTab === 'history'
        ? (
            <HistoryReviewList
              items={sortedHistory}
              onSelect={item => setCurrentHistory(item)}
            />
          )
        : (
            <PendingReviewList items={sortedPending} onSelect={openPendingModal} />
          )}

      <Modal
        title={currentPending ? `${KIND_LABEL[currentPending.kind]}发布信息` : '发布信息'}
        open={Boolean(currentPending)}
        onCancel={closePendingModal}
        footer={null}
        width={760}
        maskClosable={!isSubmitting}
        closable={!isSubmitting}
        destroyOnHidden
        styles={{ body: { maxHeight: '72vh', overflowY: 'auto', paddingTop: 12 } }}
      >
        {currentPending && (
          <Flex vertical gap={16}>
            <Card size="small" title="发布信息">
              <PublishInfoBlock item={currentPending} />
            </Card>

            <Flex justify="space-between" align="start" gap={16} wrap>
              <Flex vertical gap={10} className="w-full sm:max-w-[420px]">
                <Button
                  danger
                  onClick={() => setShowRejectEditor(true)}
                  disabled={isSubmitting}
                >
                  驳回
                </Button>

                {showRejectEditor && (
                  <Space direction="vertical" size={8} className="w-full">
                    <TextArea
                      value={rejectReason}
                      maxLength={500}
                      showCount
                      placeholder="请输入驳回理由（最多 500 字）"
                      autoSize={{ minRows: 4, maxRows: 6 }}
                      onChange={event => setRejectReason(event.target.value)}
                    />

                    <Flex gap={8}>
                      <Button onClick={handleRejectCancel} disabled={isSubmitting}>
                        取消
                      </Button>
                      <Button
                        type="primary"
                        danger
                        onClick={handleRejectConfirm}
                        disabled={!rejectReason.trim()}
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
                onClick={handleApprove}
                loading={isSubmitting}
              >
                通过
              </Button>
            </Flex>

            <Flex justify="end">
              <Button onClick={closePendingModal} disabled={isSubmitting}>
                返回
              </Button>
            </Flex>
          </Flex>
        )}
      </Modal>

      <Modal
        title="审核信息"
        open={Boolean(currentHistory)}
        onCancel={() => setCurrentHistory(null)}
        footer={null}
        width={760}
        destroyOnHidden
        styles={{ body: { maxHeight: '72vh', overflowY: 'auto', paddingTop: 12 } }}
      >
        {currentHistory && (
          <Flex vertical gap={16}>
            <Card size="small" title="审核区域">
              <Descriptions
                size="small"
                column={1}
                items={[
                  {
                    label: '物品状态',
                    children: (
                      <Tag color={RESULT_COLOR[currentHistory.reviewResult]}>
                        {RESULT_LABEL[currentHistory.reviewResult]}
                      </Tag>
                    ),
                  },
                  { label: '审核时间', children: formatDateTime(currentHistory.reviewedAt) },
                  { label: '审核人', children: currentHistory.reviewer },
                  {
                    label: '理由',
                    children: currentHistory.reviewResult === 'rejected'
                      ? currentHistory.rejectReason
                      : '无',
                  },
                ]}
              />
            </Card>

            <Card size="small" title="发布信息区域">
              <PublishInfoBlock item={currentHistory} />
            </Card>

            <Flex justify="end">
              <Button onClick={() => setCurrentHistory(null)}>
                返回
              </Button>
            </Flex>
          </Flex>
        )}
      </Modal>
    </Flex>
  )
}

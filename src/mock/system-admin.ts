import { buildMockPhoto, createDateByDaysAgo } from '@/utils/admin-mock'

export type PublishKind = 'lost' | 'found'
export type ItemStatus = 'unmatched' | 'matched' | 'claimed' | 'archived' | 'pending_deleted' | 'approved_canceled'
export type Campus = '朝晖' | '屏峰' | '莫干山'
export type AccountRole = 'student' | 'teacher' | 'lost_found_admin' | 'system_admin'
export type AnnouncementStatus = 'pending' | 'approved'

export interface SystemItem {
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

export interface AccountRecord {
  id: string
  userNo: string
  name: string
  idCard: string
  role: AccountRole
  disabledUntil: string | null
}

export interface RegionalAnnouncement {
  id: string
  title: string
  content: string
  publishedAt: string
  status: AnnouncementStatus
}

export interface ReviewPublishPost extends SystemItem {
  postStatus: 'pending' | 'approved'
}

export interface ComplaintFeedback {
  id: string
  accountNo: string
  accountName: string
  complaintType: string
  description: string
  postId: string
  postedAt: string
}

export const DEFAULT_ITEM_TYPES = ['电子', '饭卡', '文体', '证件', '衣包', '饰品', '其它类型'] as const

export const DEFAULT_COMPLAINT_TYPES = ['恶意发布', '信息不全', '不实消息', '恶心血腥', '涉黄信息', '其它类型'] as const

interface ItemSeed {
  campus: Campus
  claimCount: number
  colorEnd: string
  colorStart: string
  contactPhone: string
  description: string
  eventDaysAgo: number
  features: string
  hasReward: boolean
  itemName: string
  itemType: string
  kind: PublishKind
  locationDetail: string
  photoTitle: string
  rewardAmount?: number
  status: ItemStatus
  storageLocation: string
}

const ITEM_SEEDS: ItemSeed[] = [
  {
    kind: 'lost' as const,
    itemType: '证件',
    itemName: '校园卡',
    campus: '朝晖' as const,
    locationDetail: '图书馆三层自习区',
    status: 'unmatched' as const,
    description: '蓝色挂绳，卡套背面有猫咪贴纸。',
    features: '卡号尾号 4821，边角略磨损。',
    storageLocation: '行政楼失物招领处 1 号柜',
    claimCount: 0,
    contactPhone: '13800001234',
    hasReward: false,
    eventDaysAgo: 2,
    photoTitle: '校园卡',
    colorStart: '#3b82f6',
    colorEnd: '#60a5fa',
  },
  {
    kind: 'found' as const,
    itemType: '衣包',
    itemName: '灰色双肩包',
    campus: '屏峰' as const,
    locationDetail: '体育馆看台二层',
    status: 'matched' as const,
    description: '前袋有校徽，内含一本高数笔记。',
    features: '拉链头有蓝色绳结。',
    storageLocation: '屏峰后勤仓 3 区',
    claimCount: 1,
    contactPhone: '13600009999',
    hasReward: false,
    eventDaysAgo: 4,
    photoTitle: '双肩包',
    colorStart: '#60a5fa',
    colorEnd: '#2563eb',
  },
  {
    kind: 'lost' as const,
    itemType: '电子',
    itemName: 'AirPods 充电盒',
    campus: '朝晖' as const,
    locationDetail: '一食堂东门',
    status: 'unmatched' as const,
    description: '白色保护壳，盒体右下角有轻微磕碰。',
    features: '盒盖内侧有字母 LQ。',
    storageLocation: '朝晖服务中心 A-12',
    claimCount: 0,
    contactPhone: '13900004567',
    hasReward: true,
    rewardAmount: 80,
    eventDaysAgo: 6,
    photoTitle: '耳机盒',
    colorStart: '#0ea5e9',
    colorEnd: '#0284c7',
  },
  {
    kind: 'found' as const,
    itemType: '饭卡',
    itemName: '蓝色饭卡',
    campus: '莫干山' as const,
    locationDetail: '二食堂收银台',
    status: 'claimed' as const,
    description: '透明卡套，挂有短链。',
    features: '卡套右上角贴有笑脸贴纸。',
    storageLocation: '莫干山食堂值班室',
    claimCount: 2,
    contactPhone: '13700001111',
    hasReward: false,
    eventDaysAgo: 8,
    photoTitle: '饭卡',
    colorStart: '#2563eb',
    colorEnd: '#1d4ed8',
  },
  {
    kind: 'lost' as const,
    itemType: '文体',
    itemName: '羽毛球拍',
    campus: '屏峰' as const,
    locationDetail: '体育馆 2 号场',
    status: 'matched' as const,
    description: '黑金配色球拍，拍柄缠白色手胶。',
    features: '拍框右侧有凹痕。',
    storageLocation: '体育馆器材室',
    claimCount: 1,
    contactPhone: '13500001122',
    hasReward: false,
    eventDaysAgo: 10,
    photoTitle: '球拍',
    colorStart: '#38bdf8',
    colorEnd: '#1e40af',
  },
  {
    kind: 'found' as const,
    itemType: '饰品',
    itemName: '银色项链',
    campus: '朝晖' as const,
    locationDetail: '主楼一层大厅',
    status: 'unmatched' as const,
    description: '细链款，吊坠为四叶草。',
    features: '吊坠背面刻有字母 Y。',
    storageLocation: '行政楼招领柜 2 层',
    claimCount: 0,
    contactPhone: '13400003333',
    hasReward: false,
    eventDaysAgo: 14,
    photoTitle: '项链',
    colorStart: '#60a5fa',
    colorEnd: '#1e3a8a',
  },
  {
    kind: 'lost' as const,
    itemType: '衣包',
    itemName: '黑色电脑包',
    campus: '莫干山' as const,
    locationDetail: '信息楼 204',
    status: 'archived' as const,
    description: '手提电脑包，侧边有肩带接口。',
    features: '前袋有网线和转换头。',
    storageLocation: '莫干山后勤值班室 6 号架',
    claimCount: 0,
    contactPhone: '13300005555',
    hasReward: true,
    rewardAmount: 120,
    eventDaysAgo: 46,
    photoTitle: '电脑包',
    colorStart: '#1d4ed8',
    colorEnd: '#0ea5e9',
  },
  {
    kind: 'found' as const,
    itemType: '电子',
    itemName: '机械键盘',
    campus: '莫干山' as const,
    locationDetail: '创新实验室 305',
    status: 'pending_deleted' as const,
    description: '白色 87 键，缺失 ESC 键帽。',
    features: '空格键略松。',
    storageLocation: '实验楼前台 4 号柜',
    claimCount: 0,
    contactPhone: '13700006789',
    hasReward: false,
    eventDaysAgo: 55,
    photoTitle: '键盘',
    colorStart: '#0284c7',
    colorEnd: '#2563eb',
  },
  {
    kind: 'lost' as const,
    itemType: '证件',
    itemName: '身份证',
    campus: '朝晖' as const,
    locationDetail: '教学楼 B 座 201',
    status: 'approved_canceled' as const,
    description: '透明证件套，附蓝色绳结。',
    features: '证件套右下角有褶皱。',
    storageLocation: '朝晖保卫处窗口 3',
    claimCount: 0,
    contactPhone: '13100007777',
    hasReward: false,
    eventDaysAgo: 62,
    photoTitle: '身份证',
    colorStart: '#2563eb',
    colorEnd: '#1e40af',
  },
  {
    kind: 'found' as const,
    itemType: '饰品',
    itemName: '黑框眼镜',
    campus: '朝晖' as const,
    locationDetail: '化学楼 3 层',
    status: 'matched' as const,
    description: '半框眼镜，镜腿末端为深蓝色。',
    features: '左镜腿有白色划痕。',
    storageLocation: '化学楼值班室',
    claimCount: 1,
    contactPhone: '13800007654',
    hasReward: false,
    eventDaysAgo: 18,
    photoTitle: '眼镜',
    colorStart: '#3b82f6',
    colorEnd: '#1d4ed8',
  },
] as const

export const SYSTEM_ITEMS: SystemItem[] = ITEM_SEEDS.map((item, index) => ({
  id: `system-item-${index + 1}`,
  kind: item.kind,
  itemType: item.itemType,
  itemName: item.itemName,
  campus: item.campus,
  locationDetail: item.locationDetail,
  eventTime: createDateByDaysAgo(item.eventDaysAgo, 10 + (index % 5), 18),
  status: item.status,
  description: item.description,
  features: item.features,
  storageLocation: item.storageLocation,
  claimCount: item.claimCount,
  contactPhone: item.contactPhone,
  hasReward: item.hasReward,
  rewardAmount: item.rewardAmount,
  photos: [buildMockPhoto(item.photoTitle, item.colorStart, item.colorEnd)],
}))

export const SYSTEM_ACCOUNTS: AccountRecord[] = [
  { id: 'acc-1', userNo: '20230001', name: '张晨', idCard: '330102200101015678', role: 'student', disabledUntil: null },
  { id: 'acc-2', userNo: '20230002', name: '李洋', idCard: '330102200001018765', role: 'student', disabledUntil: null },
  { id: 'acc-3', userNo: '100201', name: '王敏', idCard: '330102198901022233', role: 'teacher', disabledUntil: null },
  { id: 'acc-4', userNo: '100202', name: '何静', idCard: '330102198803011122', role: 'teacher', disabledUntil: null },
  { id: 'acc-5', userNo: '300101', name: '赵强', idCard: '330102198605013344', role: 'lost_found_admin', disabledUntil: null },
  { id: 'acc-6', userNo: '300102', name: '陈雨', idCard: '330102198707028899', role: 'lost_found_admin', disabledUntil: null },
  { id: 'acc-7', userNo: '900001', name: '系统总管', idCard: '330102197901016666', role: 'system_admin', disabledUntil: null },
  { id: 'acc-8', userNo: '20230009', name: '高飞', idCard: '330102200212126666', role: 'student', disabledUntil: createDateByDaysAgo(-6, 12, 0) },
]

export const REGIONAL_ANNOUNCEMENTS: RegionalAnnouncement[] = [
  {
    id: 'ann-1',
    title: '朝晖校区招领处临时调整',
    content: '朝晖校区招领处将于本周五搬迁至行政楼一层，请同学知悉。',
    publishedAt: createDateByDaysAgo(1, 9, 30),
    status: 'pending',
  },
  {
    id: 'ann-2',
    title: '屏峰校区失物柜维护通知',
    content: '屏峰校区 2 号失物柜将于明日 10:00-12:00 维护。',
    publishedAt: createDateByDaysAgo(2, 14, 0),
    status: 'pending',
  },
  {
    id: 'ann-3',
    title: '莫干山校区认领时段调整',
    content: '认领时段调整为工作日 09:00-18:00。',
    publishedAt: createDateByDaysAgo(3, 16, 20),
    status: 'approved',
  },
]

export const REVIEW_PUBLISH_POSTS: ReviewPublishPost[] = SYSTEM_ITEMS.map((item, index) => ({
  ...item,
  id: `review-post-${index + 1}`,
  postStatus: index % 3 === 0 ? 'pending' : 'approved',
}))

export const COMPLAINT_FEEDBACKS: ComplaintFeedback[] = [
  {
    id: 'fb-1',
    accountNo: '20230002',
    accountName: '李洋',
    complaintType: '不实消息',
    description: '该帖子描述与实际物品不符，怀疑恶意占位。',
    postId: 'review-post-3',
    postedAt: createDateByDaysAgo(1, 11, 40),
  },
  {
    id: 'fb-2',
    accountNo: '20230009',
    accountName: '高飞',
    complaintType: '恶意发布',
    description: '同一用户短时间重复发布 8 条相同内容。',
    postId: 'review-post-8',
    postedAt: createDateByDaysAgo(2, 18, 25),
  },
  {
    id: 'fb-3',
    accountNo: '100201',
    accountName: '王敏',
    complaintType: '信息不全',
    description: '帖子缺少关键特征，导致无法判断是否可认领。',
    postId: 'review-post-1',
    postedAt: createDateByDaysAgo(3, 9, 12),
  },
]

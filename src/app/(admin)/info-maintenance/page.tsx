'use client'

import type { AdminPostListItem, ManagedPostStatus } from '@/api/modules/admin'
import type { CampusName, PublishKind } from '@/api/shared/transforms'
import { useQueryClient } from '@tanstack/react-query'
import { App, Button, Card, DatePicker, Descriptions, Empty, Flex, Image, Input, List, Modal, Select, Space, Tag, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { resolveErrorMessage } from '@/api/core/errors'
import { toCampusName, toPublishKind } from '@/api/shared/transforms'
import { useAdminPostListQuery } from '@/query/admin'
import { usePostDetailQuery, useUpdatePostMutation } from '@/query/post'
import { queryKeys } from '@/query/query-keys'
import { useSystemConfigQuery } from '@/query/system'
import { formatDateTime, getBeijingTimestamp, toBeijingDayBoundary } from '@/utils/admin-mock'

const { RangePicker } = DatePicker
const { Text, Title } = Typography

type ApiCampusCode = 'ZHAO_HUI' | 'PING_FENG' | 'MO_GAN_SHAN'

interface FilterValues {
  campus?: CampusName
  endDate?: string
  itemType?: string
  location?: string
  publishType?: PublishKind
  startDate?: string
  status?: ManagedPostStatus
}

const DEFAULT_ITEM_TYPES = ['电子', '饭卡', '文体', '证件', '衣包', '饰品', '其他类型'] as const
const OTHER_ITEM_TYPE = '其他类型'

const CAMPUS_OPTIONS: Array<{ label: string, value: CampusName }> = [
  { label: '朝晖', value: '朝晖' },
  { label: '屏峰', value: '屏峰' },
  { label: '莫干山', value: '莫干山' },
]

const PUBLISH_TYPE_OPTIONS: Array<{ label: string, value: PublishKind }> = [
  { label: '失物', value: 'lost' },
  { label: '招领', value: 'found' },
]

const PUBLISH_TYPE_LABEL_MAP: Record<PublishKind, string> = {
  found: '招领',
  lost: '失物',
}

const STATUS_OPTIONS: Array<{ label: string, value: ManagedPostStatus }> = [
  { label: '待审核', value: 'PENDING' },
  { label: '已通过', value: 'APPROVED' },
  { label: '已认领', value: 'SOLVED' },
  { label: '已取消', value: 'CANCELLED' },
  { label: '已驳回', value: 'REJECTED' },
  { label: '已归档', value: 'ARCHIVED' },
]

const STATUS_LABEL_MAP: Record<ManagedPostStatus, string> = {
  APPROVED: '已通过',
  ARCHIVED: '已归档',
  CANCELLED: '已取消',
  PENDING: '待审核',
  REJECTED: '已驳回',
  SOLVED: '已认领',
}

const STATUS_COLOR_MAP: Record<ManagedPostStatus, string> = {
  APPROVED: 'processing',
  ARCHIVED: 'default',
  CANCELLED: 'error',
  PENDING: 'warning',
  REJECTED: 'error',
  SOLVED: 'success',
}

function resolveManagedStatus(status: string | undefined): ManagedPostStatus | null {
  if (!status)
    return null

  const normalized = status.toUpperCase()

  if (normalized === 'PENDING')
    return 'PENDING'

  if (normalized === 'APPROVED')
    return 'APPROVED'

  if (normalized === 'SOLVED')
    return 'SOLVED'

  if (normalized === 'CANCELLED')
    return 'CANCELLED'

  if (normalized === 'REJECTED')
    return 'REJECTED'

  if (normalized === 'ARCHIVED')
    return 'ARCHIVED'

  return null
}

function renderStatusTag(status: string) {
  const resolvedStatus = resolveManagedStatus(status)

  if (!resolvedStatus)
    return <Tag>{status || '-'}</Tag>

  return (
    <Tag color={STATUS_COLOR_MAP[resolvedStatus]}>
      {STATUS_LABEL_MAP[resolvedStatus]}
    </Tag>
  )
}

function renderPublishTypeTag(publishType: string) {
  const kind = toPublishKind(publishType)

  return (
    <Tag color={kind === 'lost' ? 'gold' : 'blue'}>
      {PUBLISH_TYPE_LABEL_MAP[kind]}
    </Tag>
  )
}

function toApiCampusCode(value: string | undefined): ApiCampusCode | undefined {
  if (!value)
    return undefined

  const normalized = value.trim()

  if (normalized === '朝晖' || normalized === 'ZHAO_HUI')
    return 'ZHAO_HUI'

  if (normalized === '屏峰' || normalized === 'PING_FENG')
    return 'PING_FENG'

  if (normalized === '莫干山' || normalized === 'MO_GAN_SHAN')
    return 'MO_GAN_SHAN'

  return undefined
}

export default function InfoMaintenancePage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  const [filters, setFilters] = useState<FilterValues>({})
  const [appliedFilters, setAppliedFilters] = useState<FilterValues>({})
  const [hasSearched, setHasSearched] = useState(false)
  const [rangePickerVersion, setRangePickerVersion] = useState(0)

  const [showOtherTypeModal, setShowOtherTypeModal] = useState(false)
  const [otherTypeInput, setOtherTypeInput] = useState('')

  const [selectedPostId, setSelectedPostId] = useState<number | null>(null)
  const [showEditSection, setShowEditSection] = useState(false)
  const [editedStorageLocation, setEditedStorageLocation] = useState('')
  const [editedContactPhone, setEditedContactPhone] = useState('')

  const configQuery = useSystemConfigQuery()
  const detailQuery = usePostDetailQuery(selectedPostId)
  const updatePostMutation = useUpdatePostMutation()

  const queryParams = useMemo(
    () => ({
      campus: appliedFilters.campus,
      end_time: toBeijingDayBoundary(appliedFilters.endDate ?? '', 'end'),
      item_type: appliedFilters.itemType,
      location: appliedFilters.location,
      page: 1,
      page_size: 50,
      publish_type: appliedFilters.publishType,
      start_time: toBeijingDayBoundary(appliedFilters.startDate ?? '', 'start'),
      status: appliedFilters.status,
    }),
    [appliedFilters],
  )

  const postListQuery = useAdminPostListQuery(queryParams, hasSearched)

  const canSearch = Boolean(
    filters.itemType
    || filters.campus
    || filters.location?.trim()
    || filters.publishType
    || filters.startDate
    || filters.endDate
    || filters.status,
  )

  const canReset = canSearch || hasSearched

  const itemTypeOptions = useMemo(() => {
    const base = new Set<string>(DEFAULT_ITEM_TYPES)
    ;(configQuery.data?.item_types ?? []).forEach(type => base.add(type))

    if (filters.itemType && !base.has(filters.itemType))
      base.add(filters.itemType)

    return Array.from(base).map(type => ({
      label: type,
      value: type,
    }))
  }, [configQuery.data?.item_types, filters.itemType])

  const sortedRows = useMemo(
    () => [...(postListQuery.data?.list ?? [])]
      .sort((a, b) => getBeijingTimestamp(b.event_time) - getBeijingTimestamp(a.event_time)),
    [postListQuery.data?.list],
  )

  const closeDetailModal = () => {
    if (updatePostMutation.isPending)
      return

    setSelectedPostId(null)
    setShowEditSection(false)
    setEditedStorageLocation('')
    setEditedContactPhone('')
  }

  const openDetailModal = (item: AdminPostListItem) => {
    setSelectedPostId(item.id)
    setShowEditSection(false)
    setEditedStorageLocation('')
    setEditedContactPhone('')
  }

  const currentDetail = detailQuery.data

  const handleSearch = () => {
    setAppliedFilters({
      ...filters,
      location: filters.location?.trim() || undefined,
    })
    setHasSearched(true)
  }

  const handleReset = () => {
    setFilters({})
    setAppliedFilters({})
    setHasSearched(false)
    setRangePickerVersion(prev => prev + 1)
  }

  const handleConfirmOtherType = () => {
    const value = otherTypeInput.trim()
    if (!value) {
      message.warning('请输入物品类型')
      return
    }

    if (value.length > 15) {
      message.warning('其它类型最多输入 15 个字')
      return
    }

    setFilters(prev => ({ ...prev, itemType: value }))
    setShowOtherTypeModal(false)
    setOtherTypeInput('')
  }

  const handleOpenEdit = () => {
    if (!currentDetail)
      return

    setEditedStorageLocation(currentDetail.storage_location ?? '')
    setEditedContactPhone(currentDetail.contact_phone ?? '')
    setShowEditSection(true)
  }

  const handleUpdatePost = async () => {
    if (!currentDetail)
      return

    const nextStorageLocation = editedStorageLocation.trim()
    const nextContactPhone = editedContactPhone.trim()

    if (!nextStorageLocation) {
      message.warning('请填写存放地点')
      return
    }

    if (nextStorageLocation.length > 30) {
      message.warning('存放地点最多 30 个字')
      return
    }

    if (!/^\d{11}$/.test(nextContactPhone)) {
      message.warning('联系方式必须为 11 位数字')
      return
    }

    const campusCode = toApiCampusCode(currentDetail.campus)
    if (!campusCode) {
      message.warning('当前记录缺少校区信息，无法提交修改')
      return
    }

    try {
      await updatePostMutation.mutateAsync({
        campus: campusCode,
        contact_name: currentDetail.contact_name,
        contact_phone: nextContactPhone,
        event_time: currentDetail.event_time,
        features: currentDetail.features,
        has_reward: currentDetail.has_reward,
        images: currentDetail.images,
        item_name: currentDetail.item_name,
        item_type: currentDetail.item_type,
        location: currentDetail.location,
        post_id: currentDetail.id,
        reward_description: currentDetail.reward_description,
        storage_location: nextStorageLocation,
      })

      message.success('物品信息已更新')
      setShowEditSection(false)

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'post-list'] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.post.detail(currentDetail.id) }),
      ])
    }
    catch (error) {
      message.error(resolveErrorMessage(error, '更新失败，请稍后再试'))
    }
  }

  const detailItems = useMemo(() => {
    if (!currentDetail)
      return []

    const displayCampus = toCampusName(currentDetail.campus) ?? currentDetail.campus

    return [
      { key: 'publishType', label: '发布类型', children: PUBLISH_TYPE_LABEL_MAP[toPublishKind(currentDetail.publish_type)] },
      { key: 'itemType', label: '物品类型', children: currentDetail.item_type || '-' },
      { key: 'itemName', label: '名称', children: currentDetail.item_name || '-' },
      {
        key: 'status',
        label: '物品状态',
        children: renderStatusTag(currentDetail.status),
      },
      { key: 'features', label: '描述特征', children: currentDetail.features || '-' },
      { key: 'campus', label: '拾取/丢失校区', children: displayCampus },
      { key: 'location', label: '具体地点', children: currentDetail.location || '-' },
      { key: 'timeRange', label: '时间范围', children: formatDateTime(currentDetail.event_time) },
      { key: 'storage', label: '存放地点', children: currentDetail.storage_location || '-' },
      { key: 'claimCount', label: '认领人数', children: currentDetail.claim_count ?? 0 },
      { key: 'contactPhone', label: '联系方式', children: currentDetail.contact_phone || '-' },
      {
        key: 'reward',
        label: '有无悬赏',
        children: currentDetail.has_reward ? currentDetail.reward_description || '有' : '无',
      },
    ]
  }, [currentDetail])

  return (
    <Space direction="vertical" size={16} className="w-full">
      <Card styles={{ body: { padding: 20 } }}>
        <Flex vertical gap={16}>
          <Title level={4} className="!mb-0">
            信息维护与查询
          </Title>

          <Flex vertical gap={10}>
            <Flex gap={8} wrap>
              <Select
                value={filters.publishType}
                placeholder="发布类型"
                className="w-full sm:w-36"
                options={PUBLISH_TYPE_OPTIONS}
                onChange={value => setFilters(prev => ({ ...prev, publishType: value }))}
                allowClear
              />

              <Select
                value={filters.itemType}
                placeholder="物品类型"
                className="w-full sm:w-44"
                options={itemTypeOptions}
                onChange={(value) => {
                  if (value === OTHER_ITEM_TYPE) {
                    setShowOtherTypeModal(true)
                    return
                  }

                  setFilters(prev => ({ ...prev, itemType: value }))
                }}
                allowClear
              />

              <Select
                value={filters.campus}
                placeholder="丢失/拾取校区"
                className="w-full sm:w-44"
                options={CAMPUS_OPTIONS}
                onChange={value => setFilters(prev => ({ ...prev, campus: value }))}
                allowClear
              />

              <Input
                value={filters.location}
                placeholder="地点"
                className="!w-64"
                onChange={event => setFilters(prev => ({ ...prev, location: event.target.value }))}
                allowClear
              />
            </Flex>

            <Flex gap={8} wrap align="center">
              <RangePicker
                key={rangePickerVersion}
                className="w-full sm:w-[320px]"
                onChange={(_, dateStrings) => {
                  setFilters(prev => ({
                    ...prev,
                    endDate: dateStrings[1] || undefined,
                    startDate: dateStrings[0] || undefined,
                  }))
                }}
              />

              <Select
                value={filters.status}
                placeholder="物品状态"
                className="w-full sm:w-44"
                options={STATUS_OPTIONS}
                onChange={value => setFilters(prev => ({ ...prev, status: value }))}
                allowClear
              />

              <Flex gap={8} className="w-full sm:w-auto">
                <Button
                  className="flex-1 sm:flex-none"
                  disabled={!canReset}
                  onClick={handleReset}
                >
                  重置
                </Button>

                <Button
                  type="primary"
                  className="flex-1 sm:flex-none"
                  disabled={!canSearch}
                  onClick={handleSearch}
                >
                  查看
                </Button>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </Card>

      <Card
        title="物品信息列表"
        extra={hasSearched ? <Text type="secondary">{`共 ${postListQuery.data?.total ?? 0} 条`}</Text> : null}
        loading={hasSearched && postListQuery.isLoading}
      >
        {!hasSearched && (
          <Empty description="请选择至少一个筛选条件后点击查看" />
        )}

        {hasSearched && !postListQuery.isLoading && sortedRows.length === 0 && (
          <Empty description="暂无符合条件的物品信息" />
        )}

        {hasSearched && !postListQuery.isLoading && sortedRows.length > 0 && (
          <div className="max-h-[calc(100vh-360px)] overflow-y-auto pr-1">
            <List
              dataSource={sortedRows}
              renderItem={item => (
                <List.Item className="!px-0">
                  <Card
                    size="small"
                    hoverable
                    className="w-full"
                    onClick={() => openDetailModal(item)}
                  >
                    <Flex justify="space-between" align="start" gap={10}>
                      <Flex vertical gap={6}>
                        <Space size={8} wrap>
                          {renderPublishTypeTag(item.publish_type)}
                          <Text strong>{item.item_name}</Text>
                        </Space>
                        <Text type="secondary">
                          丢失/拾取地点：
                          {item.location}
                        </Text>
                        <Text type="secondary">
                          遗失时间：
                          {formatDateTime(item.event_time)}
                        </Text>
                      </Flex>

                      {renderStatusTag(item.status)}
                    </Flex>
                  </Card>
                </List.Item>
              )}
            />
          </div>
        )}
      </Card>

      <Modal
        title="物品详情修改页"
        open={Boolean(selectedPostId)}
        onCancel={closeDetailModal}
        footer={null}
        width={860}
        destroyOnHidden
        maskClosable={!updatePostMutation.isPending}
      >
        <Card loading={detailQuery.isLoading} bordered={false}>
          {currentDetail && (
            <Flex vertical gap={14}>
              <Flex gap={8} wrap>
                {!showEditSection && (
                  <Button type="primary" onClick={handleOpenEdit}>
                    更改信息
                  </Button>
                )}

                <Button onClick={closeDetailModal}>
                  返回
                </Button>
              </Flex>

              <Descriptions
                column={1}
                size="small"
                items={detailItems}
              />

              <Flex vertical gap={8}>
                <Text strong>照片（最多显示3张）</Text>
                {currentDetail.images?.length > 0
                  ? (
                      <Image.PreviewGroup>
                        <Flex gap={8} wrap>
                          {currentDetail.images.slice(0, 3).map(image => (
                            <Image
                              key={`${currentDetail.id}-${image}`}
                              src={image}
                              width={104}
                              height={104}
                              className="rounded"
                              style={{ objectFit: 'cover' }}
                              fallback="data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='104' height='104'%3E%3Crect width='100%25' height='100%25' fill='%23dbeafe'/%3E%3Ctext x='50%25' y='54%25' font-size='12' fill='%2364748b' text-anchor='middle'%3E图片%3C/text%3E%3C/svg%3E"
                            />
                          ))}
                        </Flex>
                      </Image.PreviewGroup>
                    )
                  : <Text type="secondary">暂无照片</Text>}
              </Flex>

              {showEditSection && (
                <Card size="small" title="修改存放地点与联系方式">
                  <Flex vertical gap={10}>
                    <Input
                      maxLength={30}
                      value={editedStorageLocation}
                      placeholder="请输入存放地点（限30字）"
                      onChange={event => setEditedStorageLocation(event.target.value)}
                    />

                    <Input
                      maxLength={11}
                      value={editedContactPhone}
                      placeholder="请输入联系方式（11位数字）"
                      onChange={event => setEditedContactPhone(event.target.value.replace(/\D/g, '').slice(0, 11))}
                    />

                    <Flex gap={8} wrap>
                      <Button
                        type="primary"
                        loading={updatePostMutation.isPending}
                        onClick={() => {
                          void handleUpdatePost()
                        }}
                      >
                        确认
                      </Button>
                      <Button
                        disabled={updatePostMutation.isPending}
                        onClick={() => {
                          setShowEditSection(false)
                          setEditedStorageLocation('')
                          setEditedContactPhone('')
                        }}
                      >
                        取消
                      </Button>
                    </Flex>
                  </Flex>
                </Card>
              )}
            </Flex>
          )}
        </Card>
      </Modal>

      <Modal
        title="填写其它类型"
        open={showOtherTypeModal}
        onCancel={() => {
          setShowOtherTypeModal(false)
          setOtherTypeInput('')
        }}
        onOk={handleConfirmOtherType}
        okText="确认"
        cancelText="取消"
        destroyOnHidden
      >
        <Input
          maxLength={15}
          value={otherTypeInput}
          placeholder="请输入物品类型（限15字）"
          onChange={event => setOtherTypeInput(event.target.value)}
        />
      </Modal>
    </Space>
  )
}

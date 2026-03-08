'use client'

import type { AdminPostListItem } from '@/api/modules/admin'
import type { CampusName } from '@/api/shared/transforms'
import { useQueryClient } from '@tanstack/react-query'
import { App, Button, Card, DatePicker, Descriptions, Empty, Flex, Image, Input, List, Modal, Select, Space, Tag, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { resolveErrorMessage } from '@/api/core/errors'
import { toCampusName } from '@/api/shared/transforms'
import { useAdminPostListQuery } from '@/query/admin'
import { usePostDetailQuery, useUpdatePostMutation } from '@/query/post'
import { queryKeys } from '@/query/query-keys'
import { useSystemConfigQuery } from '@/query/system'
import { formatDateTime, getBeijingTimestamp, toBeijingDayBoundary } from '@/utils/admin-mock'

const { RangePicker } = DatePicker
const { Text, Title } = Typography

type FlowStatusFilter = 'unmatched' | 'matched' | 'claimed'
type ApiCampusCode = 'ZHAO_HUI' | 'PING_FENG' | 'MO_GAN_SHAN'

interface FilterValues {
  campus?: CampusName
  endDate?: string
  itemType?: string
  startDate?: string
  status?: FlowStatusFilter
}

const DEFAULT_ITEM_TYPES = ['电子', '饭卡', '文体', '证件', '衣包', '饰品', '其他类型'] as const
const OTHER_ITEM_TYPE = '其他类型'

const CAMPUS_OPTIONS: Array<{ label: string, value: CampusName }> = [
  { label: '朝晖', value: '朝晖' },
  { label: '屏峰', value: '屏峰' },
  { label: '莫干山', value: '莫干山' },
]

const FLOW_STATUS_OPTIONS: Array<{ label: string, value: FlowStatusFilter }> = [
  { label: '未匹配', value: 'unmatched' },
  { label: '已匹配', value: 'matched' },
  { label: '已认领', value: 'claimed' },
]

const FLOW_STATUS_LABEL_MAP: Record<FlowStatusFilter, string> = {
  claimed: '已认领',
  matched: '已匹配',
  unmatched: '未匹配',
}

const FLOW_STATUS_COLOR_MAP: Record<FlowStatusFilter, string> = {
  claimed: 'success',
  matched: 'processing',
  unmatched: 'default',
}

function toFlowStatus(status: string): FlowStatusFilter {
  const normalized = status.toLowerCase()

  if (normalized.includes('claim') || normalized.includes('solve'))
    return 'claimed'

  if (normalized.includes('match'))
    return 'matched'

  return 'unmatched'
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
      page: 1,
      page_size: 50,
      start_time: toBeijingDayBoundary(appliedFilters.startDate ?? '', 'start'),
    }),
    [appliedFilters],
  )

  const postListQuery = useAdminPostListQuery(queryParams, hasSearched)

  const canSearch = Boolean(
    filters.itemType
    || filters.campus
    || filters.startDate
    || filters.endDate
    || filters.status,
  )

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

  const displayRows = useMemo(() => {
    if (!appliedFilters.status)
      return sortedRows

    return sortedRows.filter(item => toFlowStatus(item.status) === appliedFilters.status)
  }, [appliedFilters.status, sortedRows])

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
    setAppliedFilters({ ...filters })
    setHasSearched(true)
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
    const flowStatus = toFlowStatus(currentDetail.status)

    return [
      { key: 'itemType', label: '物品类型', children: currentDetail.item_type || '-' },
      { key: 'itemName', label: '名称', children: currentDetail.item_name || '-' },
      {
        key: 'status',
        label: '物品状态',
        children: (
          <Tag color={FLOW_STATUS_COLOR_MAP[flowStatus]}>
            {FLOW_STATUS_LABEL_MAP[flowStatus]}
          </Tag>
        ),
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
      <Card>
        <Flex vertical gap={12}>
          <Title level={4} className="!mb-0">
            信息维护与查询
          </Title>

          <Flex gap={8} wrap>
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

            <RangePicker
              className="w-full sm:w-[300px]"
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
              options={FLOW_STATUS_OPTIONS}
              onChange={value => setFilters(prev => ({ ...prev, status: value }))}
              allowClear
            />

            <Button
              type="primary"
              disabled={!canSearch}
              onClick={handleSearch}
            >
              查看
            </Button>
          </Flex>
        </Flex>
      </Card>

      <Card title="物品信息列表" loading={hasSearched && postListQuery.isLoading}>
        {!hasSearched && (
          <Empty description="请选择至少一个筛选条件后点击查看" />
        )}

        {hasSearched && !postListQuery.isLoading && displayRows.length === 0 && (
          <Empty description="暂无符合条件的物品信息" />
        )}

        {hasSearched && !postListQuery.isLoading && displayRows.length > 0 && (
          <div className="max-h-[calc(100vh-360px)] overflow-y-auto pr-1">
            <List
              dataSource={displayRows}
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
                        <Text strong>{item.item_name}</Text>
                        <Text type="secondary">
                          丢失/拾取地点：
                          {item.location}
                        </Text>
                        <Text type="secondary">
                          遗失时间：
                          {formatDateTime(item.event_time)}
                        </Text>
                      </Flex>

                      <Tag color={FLOW_STATUS_COLOR_MAP[toFlowStatus(item.status)]}>
                        {FLOW_STATUS_LABEL_MAP[toFlowStatus(item.status)]}
                      </Tag>
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

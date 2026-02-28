'use client'

import type { SegmentedProps } from 'antd'
import type { AdminPostDetail } from '@/api/modules/admin'
import { useQueryClient } from '@tanstack/react-query'
import { App, Button, Card, Descriptions, Empty, Flex, Image, Input, Modal, Segmented, Space, Tag, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { toPublishKind } from '@/api/shared/transforms'
import {
  useAdminPendingDetailQuery,
  useAdminPendingListQuery,
  useApproveAdminPostMutation,
  useRejectAdminPostMutation,
} from '@/query/admin'
import { queryKeys } from '@/query/query-keys'
import { formatDateTime } from '@/utils/admin-mock'

const { TextArea } = Input
const { Text, Title } = Typography

type ReviewTab = 'lost' | 'found' | 'history'
type ReviewResult = 'approved' | 'rejected'

interface ReviewHistoryItem {
  id: number
  itemName: string
  itemType: string
  kind: 'lost' | 'found'
  contactName: string
  contactPhone: string
  eventTime: string
  features: string
  images: string[]
  reviewResult: ReviewResult
  reviewedAt: string
  rejectReason?: string
}

const KIND_LABEL = {
  lost: '失物',
  found: '招领',
} as const

const RESULT_LABEL: Record<ReviewResult, string> = {
  approved: '已通过',
  rejected: '已驳回',
}

const RESULT_COLOR: Record<ReviewResult, string> = {
  approved: 'success',
  rejected: 'error',
}

function toHistoryItem(detail: AdminPostDetail, result: ReviewResult, reason?: string): ReviewHistoryItem {
  return {
    id: detail.id,
    itemName: detail.item_name,
    itemType: detail.item_type,
    kind: toPublishKind(detail.publish_type),
    contactName: detail.contact_name,
    contactPhone: detail.contact_phone,
    eventTime: detail.event_time,
    features: detail.features,
    images: detail.images ?? [],
    reviewResult: result,
    reviewedAt: new Date().toISOString(),
    rejectReason: reason,
  }
}

export default function ReviewPublishPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<ReviewTab>('lost')
  const [currentPostId, setCurrentPostId] = useState<number | null>(null)
  const [historyItems, setHistoryItems] = useState<ReviewHistoryItem[]>([])
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectEditor, setShowRejectEditor] = useState(false)

  const pendingListQuery = useAdminPendingListQuery()
  const pendingDetailQuery = useAdminPendingDetailQuery(currentPostId)

  const approveMutation = useApproveAdminPostMutation()
  const rejectMutation = useRejectAdminPostMutation()

  const pendingItems = useMemo(
    () => pendingListQuery.data?.list ?? [],
    [pendingListQuery.data?.list],
  )

  const pendingLostItems = useMemo(
    () => pendingItems
      .filter(item => toPublishKind(item.publish_type) === 'lost')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [pendingItems],
  )

  const pendingFoundItems = useMemo(
    () => pendingItems
      .filter(item => toPublishKind(item.publish_type) === 'found')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [pendingItems],
  )

  const sortedHistory = useMemo(
    () => [...historyItems].sort((a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime()),
    [historyItems],
  )

  const tabOptions = useMemo<SegmentedProps['options']>(
    () => [
      { label: `失物（${pendingLostItems.length}）`, value: 'lost' },
      { label: `招领（${pendingFoundItems.length}）`, value: 'found' },
      { label: `历史审核记录（${sortedHistory.length}）`, value: 'history' },
    ],
    [pendingFoundItems.length, pendingLostItems.length, sortedHistory.length],
  )

  const currentPendingDetail = pendingDetailQuery.data

  const resetRejectState = () => {
    setShowRejectEditor(false)
    setRejectReason('')
  }

  const closePendingModal = () => {
    if (approveMutation.isPending || rejectMutation.isPending)
      return

    setCurrentPostId(null)
    resetRejectState()
  }

  const openPendingModal = (postId: number) => {
    setCurrentPostId(postId)
    resetRejectState()
  }

  const isSubmitting = approveMutation.isPending || rejectMutation.isPending

  const handleApprove = async () => {
    if (!currentPendingDetail)
      return

    await approveMutation.mutateAsync({ post_id: currentPendingDetail.id })
    setHistoryItems(prev => [toHistoryItem(currentPendingDetail, 'approved'), ...prev])

    message.success('审核通过成功')
    await queryClient.invalidateQueries({ queryKey: queryKeys.admin.pendingList() })
    closePendingModal()
  }

  const handleRejectConfirm = async () => {
    if (!currentPendingDetail)
      return

    const reason = rejectReason.trim()
    if (!reason) {
      message.warning('请填写驳回理由')
      return
    }

    await rejectMutation.mutateAsync({
      post_id: currentPendingDetail.id,
      reason,
    })

    setHistoryItems(prev => [toHistoryItem(currentPendingDetail, 'rejected', reason), ...prev])
    message.success('审核驳回成功')

    await queryClient.invalidateQueries({ queryKey: queryKeys.admin.pendingList() })
    closePendingModal()
  }

  const visiblePendingItems = activeTab === 'found' ? pendingFoundItems : pendingLostItems

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
            <Card title="历史审核记录" styles={{ body: { padding: '12px 14px' } }}>
              {sortedHistory.length === 0
                ? (
                    <div className="py-10">
                      <Empty description="暂无历史审核记录" />
                    </div>
                  )
                : (
                    <div className="max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {sortedHistory.map(item => (
                          <Card key={item.id} size="small">
                            <Flex vertical gap={8}>
                              <Flex justify="space-between" align="center" wrap>
                                <Text strong>{item.itemName}</Text>
                                <Tag color={RESULT_COLOR[item.reviewResult]}>{RESULT_LABEL[item.reviewResult]}</Tag>
                              </Flex>
                              <Text type="secondary">
                                发布类型：
                                {KIND_LABEL[item.kind]}
                              </Text>
                              <Text type="secondary">
                                审核时间：
                                {formatDateTime(item.reviewedAt)}
                              </Text>
                              {item.rejectReason && (
                                <Text type="secondary">
                                  驳回理由：
                                  {item.rejectReason}
                                </Text>
                              )}
                            </Flex>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
            </Card>
          )
        : (
            <Card title="待审核列表" styles={{ body: { padding: '12px 14px' } }} loading={pendingListQuery.isLoading}>
              {!pendingListQuery.isLoading && visiblePendingItems.length === 0 && (
                <div className="py-10">
                  <Empty description="当前没有待审核信息" />
                </div>
              )}

              {!pendingListQuery.isLoading && visiblePendingItems.length > 0 && (
                <div className="max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {visiblePendingItems.map(item => (
                      <Card
                        key={item.id}
                        hoverable
                        size="small"
                        className="h-full"
                        onClick={() => openPendingModal(item.id)}
                      >
                        <Flex vertical gap={8}>
                          <Flex justify="space-between" align="center" wrap>
                            <Text strong>{item.item_name}</Text>
                            <Tag color="processing">{KIND_LABEL[toPublishKind(item.publish_type)]}</Tag>
                          </Flex>
                          <Text type="secondary">{item.item_type}</Text>
                          <Text type="secondary">
                            地点：
                            {item.location}
                          </Text>
                          <Text type="secondary">
                            发布时间：
                            {formatDateTime(item.created_at)}
                          </Text>
                        </Flex>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

      <Modal
        title={currentPendingDetail ? `${KIND_LABEL[toPublishKind(currentPendingDetail.publish_type)]}发布信息` : '发布信息'}
        open={Boolean(currentPostId)}
        onCancel={closePendingModal}
        footer={null}
        width={760}
        maskClosable={!isSubmitting}
        closable={!isSubmitting}
        destroyOnHidden
        styles={{ body: { maxHeight: '72vh', overflowY: 'auto', paddingTop: 12 } }}
      >
        <Card loading={pendingDetailQuery.isLoading}>
          {currentPendingDetail && (
            <Flex vertical gap={16}>
              <Card size="small" title="发布信息">
                <Descriptions
                  column={1}
                  size="small"
                  items={[
                    { label: '发布类型', children: KIND_LABEL[toPublishKind(currentPendingDetail.publish_type)] },
                    { label: '物品类型', children: currentPendingDetail.item_type },
                    { label: '物品名称', children: currentPendingDetail.item_name },
                    { label: '地点', children: currentPendingDetail.location },
                    { label: '事件时间', children: formatDateTime(currentPendingDetail.event_time) },
                    { label: '物品特征', children: currentPendingDetail.features },
                    { label: '联系人', children: currentPendingDetail.contact_name },
                    { label: '联系电话', children: currentPendingDetail.contact_phone },
                    { label: '是否悬赏', children: currentPendingDetail.has_reward ? '有' : '无' },
                    { label: '发布时间', children: formatDateTime(currentPendingDetail.created_at) },
                  ]}
                />

                <Flex vertical gap={8}>
                  <Text strong>物品相关照片</Text>
                  {currentPendingDetail.images.length > 0
                    ? (
                        <Image.PreviewGroup>
                          <Flex gap={8} wrap>
                            {currentPendingDetail.images.map(photo => (
                              <Image
                                key={`${currentPendingDetail.id}-${photo}`}
                                src={photo}
                                alt={`${currentPendingDetail.item_name}-照片`}
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
                        <Button onClick={resetRejectState} disabled={isSubmitting}>
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

                <Button type="primary" onClick={handleApprove} loading={isSubmitting}>
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
        </Card>
      </Modal>
    </Flex>
  )
}

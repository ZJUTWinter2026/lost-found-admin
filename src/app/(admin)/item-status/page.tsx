'use client'

import type { SegmentedProps } from 'antd'
import { useQueryClient } from '@tanstack/react-query'
import { App, Button, Card, Descriptions, Empty, Flex, Image, Input, Modal, Segmented, Space, Tag, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { normalizePostStatus, toPublishKind } from '@/api/shared/transforms'
import {
  useAdminPendingDetailQuery,
  useArchiveAdminPostMutation,
  useClaimAdminPostMutation,
} from '@/query/admin'
import { usePostListQuery } from '@/query/post'
import { queryKeys } from '@/query/query-keys'
import { formatDateTime } from '@/utils/admin-mock'

const { TextArea } = Input
const { Text, Title } = Typography

type ItemTab = 'lost' | 'found'

type ItemFlowStatus = 'unmatched' | 'matched' | 'archived'

const KIND_LABEL: Record<ItemTab, string> = {
  lost: '失物',
  found: '招领',
}

const STATUS_LABEL: Record<ItemFlowStatus, string> = {
  unmatched: '未匹配',
  matched: '已认领',
  archived: '已归档',
}

const STATUS_COLOR: Record<ItemFlowStatus, string> = {
  unmatched: 'processing',
  matched: 'success',
  archived: 'default',
}

function resolveFlowStatus(status: string): ItemFlowStatus {
  const normalized = normalizePostStatus(status)

  if (normalized.includes('archive'))
    return 'archived'

  if (normalized.includes('claim') || normalized.includes('match'))
    return 'matched'

  return 'unmatched'
}

export default function ItemStatusPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<ItemTab>('lost')
  const [currentPostId, setCurrentPostId] = useState<number | null>(null)
  const [archiveMethodInput, setArchiveMethodInput] = useState('')
  const [showArchiveEditor, setShowArchiveEditor] = useState(false)

  const postListQuery = usePostListQuery({
    page: 1,
    page_size: 20,
    publish_type: activeTab,
  })

  const postDetailQuery = useAdminPendingDetailQuery(currentPostId)
  const claimMutation = useClaimAdminPostMutation()
  const archiveMutation = useArchiveAdminPostMutation()

  const rows = useMemo(
    () => (postListQuery.data?.list ?? []).sort((a, b) => new Date(b.event_time).getTime() - new Date(a.event_time).getTime()),
    [postListQuery.data?.list],
  )

  const allRowsForCount = usePostListQuery({
    page: 1,
    page_size: 20,
  })

  const lostCount = useMemo(
    () => (allRowsForCount.data?.list ?? []).filter(item => toPublishKind(item.publish_type) === 'lost').length,
    [allRowsForCount.data?.list],
  )

  const foundCount = useMemo(
    () => (allRowsForCount.data?.list ?? []).filter(item => toPublishKind(item.publish_type) === 'found').length,
    [allRowsForCount.data?.list],
  )

  const tabOptions = useMemo<SegmentedProps['options']>(
    () => [
      { label: `失物（${lostCount}）`, value: 'lost' },
      { label: `招领（${foundCount}）`, value: 'found' },
    ],
    [foundCount, lostCount],
  )

  const currentDetail = postDetailQuery.data
  const currentFlowStatus = currentDetail ? resolveFlowStatus(currentDetail.status) : null

  const isSubmitting = claimMutation.isPending || archiveMutation.isPending

  const closeModal = () => {
    if (isSubmitting)
      return

    setCurrentPostId(null)
    setShowArchiveEditor(false)
    setArchiveMethodInput('')
  }

  const handleClaimed = async () => {
    if (!currentDetail)
      return

    await claimMutation.mutateAsync({ post_id: currentDetail.id })
    message.success('已标记为已认领')

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.post.list({}) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.post.list({ page: 1, page_size: 20, publish_type: activeTab }) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.pendingDetail(currentDetail.id) }),
    ])
  }

  const handleArchiveConfirm = async () => {
    if (!currentDetail) {
      return
    }

    const archiveMethod = archiveMethodInput.trim()
    if (!archiveMethod) {
      message.warning('请填写归档处理方式')
      return
    }

    await archiveMutation.mutateAsync({
      archive_method: archiveMethod,
      post_id: currentDetail.id,
    })

    message.success('归档成功')
    setShowArchiveEditor(false)
    setArchiveMethodInput('')

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.post.list({}) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.post.list({ page: 1, page_size: 20, publish_type: activeTab }) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.pendingDetail(currentDetail.id) }),
    ])
  }

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

      <Card title="已发布列表" styles={{ body: { padding: '12px 14px' } }} loading={postListQuery.isLoading}>
        {!postListQuery.isLoading && rows.length === 0 && (
          <div className="py-10">
            <Empty description="当前没有可管理的物品信息" />
          </div>
        )}

        {!postListQuery.isLoading && rows.length > 0 && (
          <div className="max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {rows.map(item => (
                <Card
                  key={item.id}
                  hoverable
                  size="small"
                  className="h-full"
                  onClick={() => setCurrentPostId(item.id)}
                >
                  <Flex vertical gap={8}>
                    <Flex justify="space-between" align="center" wrap>
                      <Text strong>{item.item_name}</Text>
                      <Tag color={STATUS_COLOR[resolveFlowStatus(item.status)]}>{STATUS_LABEL[resolveFlowStatus(item.status)]}</Tag>
                    </Flex>

                    <Text type="secondary">{item.item_type_other || item.item_type}</Text>

                    <Text type="secondary">
                      地点：
                      {item.location}
                    </Text>

                    <Text type="secondary">
                      时间：
                      {formatDateTime(item.event_time)}
                    </Text>
                  </Flex>
                </Card>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Modal
        title={currentDetail ? `${KIND_LABEL[toPublishKind(currentDetail.publish_type)]}信息` : '物品信息'}
        open={Boolean(currentPostId)}
        onCancel={closeModal}
        footer={null}
        width={760}
        maskClosable={!isSubmitting}
        closable={!isSubmitting}
        destroyOnHidden
        styles={{ body: { maxHeight: '72vh', overflowY: 'auto', paddingTop: 12 } }}
      >
        <Card loading={postDetailQuery.isLoading}>
          {currentDetail && (
            <Flex vertical gap={16}>
              <Card size="small" title="物品信息">
                <Descriptions
                  column={1}
                  size="small"
                  items={[
                    {
                      label: '物品状态',
                      children: (
                        <Tag color={STATUS_COLOR[currentFlowStatus as ItemFlowStatus]}>
                          {STATUS_LABEL[currentFlowStatus as ItemFlowStatus]}
                        </Tag>
                      ),
                    },
                    { label: '物品类型', children: currentDetail.item_type_other || currentDetail.item_type },
                    { label: '物品名称', children: currentDetail.item_name },
                    { label: '地点', children: currentDetail.location },
                    { label: '时间', children: formatDateTime(currentDetail.event_time) },
                    { label: '物品特征', children: currentDetail.features },
                    { label: '联系人', children: currentDetail.contact_name },
                    { label: '联系电话', children: currentDetail.contact_phone },
                    { label: '审核通过时间', children: formatDateTime(currentDetail.created_at) },
                  ]}
                />

                <Flex vertical gap={8}>
                  <Text strong>物品相关照片</Text>
                  {currentDetail.images.length > 0
                    ? (
                        <Image.PreviewGroup>
                          <Flex gap={8} wrap>
                            {currentDetail.images.map(photo => (
                              <Image
                                key={`${currentDetail.id}-${photo}`}
                                src={photo}
                                alt={`${currentDetail.item_name}-照片`}
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
                    onClick={() => setShowArchiveEditor(true)}
                    disabled={currentFlowStatus !== 'unmatched' || isSubmitting}
                  >
                    已归档
                  </Button>

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
                        <Button onClick={() => setShowArchiveEditor(false)} disabled={isSubmitting}>
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
                  disabled={currentFlowStatus !== 'unmatched' || isSubmitting}
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
        </Card>
      </Modal>
    </Flex>
  )
}

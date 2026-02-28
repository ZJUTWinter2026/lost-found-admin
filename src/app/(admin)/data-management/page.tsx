'use client'

import { useQueryClient } from '@tanstack/react-query'
import { App, Button, Card, Descriptions, Empty, Flex, Modal, Radio, Segmented, Space, Tag, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { normalizePostStatus, toCampusName } from '@/api/shared/transforms'
import { useDisableAccountMutation } from '@/query/account'
import { useDeleteAdminPostMutation } from '@/query/admin'
import { useFeedbackDetailQuery, useFeedbackListQuery, useProcessFeedbackMutation } from '@/query/feedback'
import { usePostListQuery } from '@/query/post'
import { queryKeys } from '@/query/query-keys'
import { formatDateTime, getBeijingTimestamp } from '@/utils/admin-mock'

type MainTab = 'all_info' | 'feedback'
type DisableDuration = '7d' | '1m' | '6m' | '1y'

const EXPIRED_STATUS_KEYS = ['archived', 'pending_deleted', 'approved_canceled', 'deleted', 'cancel']

function toDurationParam(value: DisableDuration) {
  const map = {
    '7d': '7days',
    '1m': '1month',
    '6m': '6months',
    '1y': '1year',
  } as const

  return map[value]
}

export default function DataManagementPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<MainTab>('all_info')
  const [showExpiredData, setShowExpiredData] = useState(false)
  const [isClearModalOpen, setIsClearModalOpen] = useState(false)
  const [hiddenPostIds, setHiddenPostIds] = useState<number[]>([])

  const [selectedFeedbackId, setSelectedFeedbackId] = useState<number | null>(null)
  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false)
  const [disableDuration, setDisableDuration] = useState<DisableDuration | null>(null)

  const postListQuery = usePostListQuery({ page: 1, page_size: 20 })
  const feedbackListQuery = useFeedbackListQuery()
  const feedbackDetailQuery = useFeedbackDetailQuery(selectedFeedbackId)

  const processFeedbackMutation = useProcessFeedbackMutation()
  const deletePostMutation = useDeleteAdminPostMutation()
  const disableAccountMutation = useDisableAccountMutation()

  const visibleItems = useMemo(() => {
    const source = (postListQuery.data?.list ?? []).filter(item => !hiddenPostIds.includes(item.id))

    if (!showExpiredData) {
      return [...source].sort((a, b) => getBeijingTimestamp(b.event_time) - getBeijingTimestamp(a.event_time))
    }

    return source
      .filter((item) => {
        const status = normalizePostStatus(item.status)
        return EXPIRED_STATUS_KEYS.some(key => status.includes(key))
      })
      .sort((a, b) => getBeijingTimestamp(b.event_time) - getBeijingTimestamp(a.event_time))
  }, [hiddenPostIds, postListQuery.data?.list, showExpiredData])

  const sortedFeedbacks = useMemo(
    () => [...(feedbackListQuery.data?.list ?? [])].sort((a, b) => getBeijingTimestamp(b.created_at) - getBeijingTimestamp(a.created_at)),
    [feedbackListQuery.data?.list],
  )

  const selectedFeedback = feedbackDetailQuery.data
  const relatedPost = selectedFeedback?.post

  return (
    <Space direction="vertical" size={16} className="w-full">
      <Card>
        <Segmented
          block
          value={activeTab}
          options={[
            { label: '全校失物招领信息', value: 'all_info' },
            { label: '投诉与反馈', value: 'feedback' },
          ]}
          onChange={value => setActiveTab(value as MainTab)}
        />
      </Card>

      {activeTab === 'all_info' && (
        <Space direction="vertical" size={16} className="w-full">
          <Card>
            <Flex wrap gap={10}>
              <Button onClick={() => message.success('已触发数据备份流程（可继续接后端文件接口）')}>备份</Button>
              <Button onClick={() => message.success('已触发数据导出流程（可继续接后端文件接口）')}>导出</Button>
              <Button type={showExpiredData ? 'primary' : 'default'} onClick={() => setShowExpiredData(prev => !prev)}>
                过期无效数据
              </Button>
              {showExpiredData && (
                <Button danger onClick={() => setIsClearModalOpen(true)}>
                  清理
                </Button>
              )}
            </Flex>
          </Card>

          <Card title={showExpiredData ? '过期无效信息总览' : '全校失物招领信息总览'} loading={postListQuery.isLoading}>
            <Space direction="vertical" size={10} className="w-full">
              {visibleItems.length === 0 && <Empty description="暂无数据" />}
              {visibleItems.map(item => (
                <Button
                  key={item.id}
                  block
                  className="!h-auto !justify-start !rounded-lg !border-sky-100 !px-4 !py-3 !text-left"
                >
                  <Flex justify="space-between" align="center" className="w-full gap-2">
                    <Space wrap>
                      <Tag color="blue">{item.item_type}</Tag>
                      <Typography.Text>{item.item_name}</Typography.Text>
                      <Typography.Text type="secondary">
                        {toCampusName(item.campus) ?? item.campus}
                        {' '}
                        ·
                        {' '}
                        {item.location}
                      </Typography.Text>
                    </Space>
                    <Typography.Text type="secondary">{formatDateTime(item.event_time)}</Typography.Text>
                  </Flex>
                </Button>
              ))}
            </Space>
          </Card>
        </Space>
      )}

      {activeTab === 'feedback' && (
        <Space direction="vertical" size={16} className="w-full">
          {!selectedFeedbackId && (
            <Card title="用户投诉与反馈列表" loading={feedbackListQuery.isLoading}>
              <Space direction="vertical" size={10} className="w-full">
                {sortedFeedbacks.length === 0 && <Empty description="暂无投诉反馈" />}
                {sortedFeedbacks.map(feedback => (
                  <Button
                    key={feedback.id}
                    block
                    className="!h-auto !justify-start !rounded-lg !border-sky-100 !px-4 !py-3 !text-left"
                    onClick={() => setSelectedFeedbackId(feedback.id)}
                  >
                    <Flex justify="space-between" align="center" className="w-full gap-2">
                      <Space wrap>
                        <Tag color="warning">{feedback.type}</Tag>
                        <Typography.Text>
                          举报人ID：
                          {feedback.reporter_id}
                        </Typography.Text>
                      </Space>
                      <Typography.Text type="secondary">{formatDateTime(feedback.created_at)}</Typography.Text>
                    </Flex>
                  </Button>
                ))}
              </Space>
            </Card>
          )}

          {selectedFeedbackId && (
            <Card title="投诉反馈详情" loading={feedbackDetailQuery.isLoading}>
              {selectedFeedback && (
                <Space direction="vertical" size={16} className="w-full">
                  <Descriptions
                    bordered
                    column={1}
                    title="投诉与反馈"
                    items={[
                      { key: 'type', label: '投诉类型', children: selectedFeedback.type },
                      { key: 'time', label: '时间', children: formatDateTime(selectedFeedback.created_at) },
                      { key: 'desc', label: '说明', children: selectedFeedback.description },
                      { key: 'user', label: '投诉人', children: `用户ID ${selectedFeedback.reporter_id}` },
                      { key: 'processed', label: '处理状态', children: selectedFeedback.processed ? '已处理' : '待处理' },
                    ]}
                  />

                  <Descriptions
                    bordered
                    column={{ xs: 1, md: 2 }}
                    title="被反馈物品详情"
                    items={[
                      { key: 'name', label: '物品名称', children: relatedPost?.item_name ?? '已删除' },
                      { key: 'type', label: '物品类型', children: relatedPost?.item_type ?? '-' },
                      { key: 'campus', label: '校区', children: toCampusName(relatedPost?.campus) ?? relatedPost?.campus ?? '-' },
                      { key: 'location', label: '地点', children: relatedPost?.location ?? '-' },
                      { key: 'status', label: '状态', children: relatedPost?.status ?? '-' },
                    ]}
                  />

                  <Flex wrap gap={10}>
                    <Button
                      danger
                      type="primary"
                      loading={deletePostMutation.isPending}
                      disabled={!relatedPost}
                      onClick={async () => {
                        if (!relatedPost)
                          return

                        await deletePostMutation.mutateAsync({ post_id: relatedPost.id })
                        message.success('该帖子已删除')

                        await Promise.all([
                          queryClient.invalidateQueries({ queryKey: ['post', 'list'] }),
                          queryClient.invalidateQueries({ queryKey: queryKeys.feedback.detail(selectedFeedbackId) }),
                        ])
                      }}
                    >
                      删除该帖子
                    </Button>

                    <Button
                      disabled={!relatedPost || disableAccountMutation.isPending}
                      onClick={() => {
                        setIsDisableModalOpen(true)
                        setDisableDuration(null)
                      }}
                    >
                      禁用被投诉的账号
                    </Button>

                    <Button
                      type="primary"
                      loading={processFeedbackMutation.isPending}
                      disabled={selectedFeedback.processed}
                      onClick={async () => {
                        await processFeedbackMutation.mutateAsync({ feedback_id: selectedFeedback.id })
                        message.success('投诉反馈已处理')

                        await Promise.all([
                          queryClient.invalidateQueries({ queryKey: queryKeys.feedback.list() }),
                          queryClient.invalidateQueries({ queryKey: queryKeys.feedback.detail(selectedFeedback.id) }),
                        ])
                      }}
                    >
                      标记已处理
                    </Button>

                    <Button onClick={() => setSelectedFeedbackId(null)}>返回</Button>
                  </Flex>
                </Space>
              )}
            </Card>
          )}
        </Space>
      )}

      <Modal
        title="确认清理过期无效数据"
        open={isClearModalOpen}
        okText="确认"
        cancelText="返回"
        onCancel={() => setIsClearModalOpen(false)}
        onOk={() => {
          const expiredIds = visibleItems.map(item => item.id)
          setHiddenPostIds(prev => Array.from(new Set([...prev, ...expiredIds])))
          setIsClearModalOpen(false)
          message.success('过期无效数据清理完成（当前为前端隐藏，可继续接后端清理接口）')
        }}
      >
        <Typography.Text>清理后数据不可恢复，是否继续？</Typography.Text>
      </Modal>

      <Modal
        title={relatedPost ? '禁用账号' : '禁用账号'}
        open={isDisableModalOpen}
        okText="确认"
        cancelText="返回"
        okButtonProps={{ disabled: !disableDuration, loading: disableAccountMutation.isPending }}
        onCancel={() => {
          if (disableAccountMutation.isPending)
            return

          setIsDisableModalOpen(false)
          setDisableDuration(null)
        }}
        onOk={async () => {
          if (!relatedPost || !disableDuration)
            return

          await disableAccountMutation.mutateAsync({
            duration: toDurationParam(disableDuration),
            id: relatedPost.publisher_id,
          })

          setIsDisableModalOpen(false)
          setDisableDuration(null)
          message.success('该账号已禁用')
        }}
      >
        <Radio.Group
          options={[
            { label: '7天', value: '7d' },
            { label: '1个月', value: '1m' },
            { label: '半年', value: '6m' },
            { label: '1年', value: '1y' },
          ]}
          value={disableDuration}
          onChange={event => setDisableDuration(event.target.value as DisableDuration)}
        />
      </Modal>
    </Space>
  )
}

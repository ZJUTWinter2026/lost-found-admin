'use client'

import { ExclamationCircleOutlined } from '@ant-design/icons'
import { useQueryClient } from '@tanstack/react-query'
import { App, Button, Card, Descriptions, Empty, Flex, Image, Input, Modal, Radio, Segmented, Select, Space, Tag, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { resolveErrorMessage } from '@/api/core/errors'
import { toCampusName, toDisableDurationParam, toPublishKind } from '@/api/shared/transforms'
import { toPostStatusLabel } from '@/constants/post-status'
import { useDisableAccountMutation } from '@/query/account'
import {
  useAdminPendingDetailQuery,
  useAdminPendingListQuery,
  useApproveAdminPostMutation,
  useDeleteAdminPostMutation,
  useRejectAdminPostMutation,
} from '@/query/admin'
import { useAnnouncementReviewListQuery, useApproveAnnouncementMutation, usePublishAnnouncementMutation } from '@/query/announcement'
import { useFeedbackDetailQuery, useFeedbackListQuery, useProcessFeedbackMutation } from '@/query/feedback'
import { queryKeys } from '@/query/query-keys'
import { formatDate, formatDateTime, getBeijingTimestamp } from '@/utils/admin-mock'

const { TextArea } = Input

type MainTab = 'global' | 'regional-review' | 'regional-send' | 'review' | 'feedback'
type DisableDuration = '7d' | '1m' | '6m' | '1y'
type CampusCode = 'ZHAO_HUI' | 'PING_FENG' | 'MO_GAN_SHAN'
const KIND_LABEL = {
  lost: '失物',
  found: '招领',
} as const
const CAMPUS_OPTIONS: { label: string, value: CampusCode }[] = [
  { label: '朝晖', value: 'ZHAO_HUI' },
  { label: '屏峰', value: 'PING_FENG' },
  { label: '莫干山', value: 'MO_GAN_SHAN' },
]

export default function AnnouncementContentPage() {
  const { message, modal } = App.useApp()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<MainTab>('review')

  const [globalTitle, setGlobalTitle] = useState('系统公告')
  const [globalContent, setGlobalContent] = useState('')
  const [regionalCampus, setRegionalCampus] = useState<CampusCode>()
  const [regionalTitle, setRegionalTitle] = useState('')
  const [regionalContent, setRegionalContent] = useState('')

  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<number | null>(null)

  const [selectedPostId, setSelectedPostId] = useState<number | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<number | null>(null)
  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false)
  const [disableDuration, setDisableDuration] = useState<DisableDuration | null>(null)

  const reviewListQuery = useAnnouncementReviewListQuery()
  const publishMutation = usePublishAnnouncementMutation()
  const approveMutation = useApproveAnnouncementMutation()

  const feedbackListQuery = useFeedbackListQuery()
  const feedbackDetailQuery = useFeedbackDetailQuery(selectedFeedbackId)
  const processFeedbackMutation = useProcessFeedbackMutation()
  const disableAccountMutation = useDisableAccountMutation()

  const pendingLostQuery = useAdminPendingListQuery('lost', { page: 1, page_size: 20 })
  const pendingFoundQuery = useAdminPendingListQuery('found', { page: 1, page_size: 20 })
  const postDetailQuery = useAdminPendingDetailQuery(selectedPostId)
  const approvePostMutation = useApproveAdminPostMutation()
  const rejectPostMutation = useRejectAdminPostMutation()
  const deletePostMutation = useDeleteAdminPostMutation()

  const sortedAnnouncements = useMemo(
    () => [...(reviewListQuery.data?.list ?? [])]
      .sort((a, b) => getBeijingTimestamp(b.created_at) - getBeijingTimestamp(a.created_at)),
    [reviewListQuery.data?.list],
  )

  const selectedAnnouncement = useMemo(
    () => sortedAnnouncements.find(item => item.id === selectedAnnouncementId) ?? null,
    [selectedAnnouncementId, sortedAnnouncements],
  )

  const visibleReviewPosts = useMemo(
    () => [
      ...(pendingLostQuery.data?.list ?? []).map(item => ({ ...item, publish_type: item.publish_type ?? 'LOST' })),
      ...(pendingFoundQuery.data?.list ?? []).map(item => ({ ...item, publish_type: item.publish_type ?? 'FOUND' })),
    ].sort((a, b) => getBeijingTimestamp(b.event_time) - getBeijingTimestamp(a.event_time)),
    [pendingFoundQuery.data?.list, pendingLostQuery.data?.list],
  )
  const pendingListLoading = pendingLostQuery.isLoading || pendingFoundQuery.isLoading

  const sortedFeedbacks = useMemo(
    () => [...(feedbackListQuery.data?.list ?? [])]
      .sort((a, b) => getBeijingTimestamp(b.created_at) - getBeijingTimestamp(a.created_at)),
    [feedbackListQuery.data?.list],
  )

  const selectedFeedback = feedbackDetailQuery.data
  const relatedPost = selectedFeedback?.post

  const handleApproveAnnouncement = async () => {
    if (!selectedAnnouncement)
      return

    await approveMutation.mutateAsync({ approve: true, id: selectedAnnouncement.id })
    message.success('区域公告审核通过')

    await queryClient.invalidateQueries({ queryKey: queryKeys.announcement.reviewList() })
  }

  const handlePublishGlobalAnnouncement = async () => {
    const title = globalTitle.trim()
    const content = globalContent.trim()

    if (!title) {
      message.warning('请输入公告标题')
      return
    }

    if (!content) {
      message.warning('请输入公告内容')
      return
    }

    try {
      await publishMutation.mutateAsync({
        content,
        title,
        type: 'SYSTEM',
      })

      setGlobalContent('')
      message.success('全局公告已发送')

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.announcement.approvedList() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.announcement.reviewList() }),
      ])
    }
    catch (error) {
      message.error(resolveErrorMessage(error, '发送全局公告失败，请稍后再试'))
    }
  }

  const handlePublishRegionalAnnouncement = async () => {
    const title = regionalTitle.trim()
    const content = regionalContent.trim()

    if (!regionalCampus) {
      message.warning('请选择通知校区')
      return
    }

    if (!title) {
      message.warning('请输入公告标题')
      return
    }

    if (!content) {
      message.warning('请输入公告内容')
      return
    }

    try {
      await publishMutation.mutateAsync({
        campus: regionalCampus,
        content,
        title,
        type: 'REGION',
      })

      setRegionalCampus(undefined)
      setRegionalTitle('')
      setRegionalContent('')
      message.success('区域公告已发送')

      await queryClient.invalidateQueries({ queryKey: queryKeys.announcement.reviewList() })
    }
    catch (error) {
      message.error(resolveErrorMessage(error, '发送区域公告失败，请稍后再试'))
    }
  }

  const handleDeletePost = async () => {
    if (!selectedPostId)
      return

    if (deletePostMutation.isPending)
      return

    const postId = selectedPostId
    const itemName = postDetailQuery.data?.item_name ?? `ID ${postId}`

    modal.confirm({
      title: '确认删除发布信息？',
      content: `删除后不可恢复：${itemName}`,
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true, type: 'primary' },
      icon: <ExclamationCircleOutlined />,
      onOk: async () => {
        await deletePostMutation.mutateAsync({ post_id: postId })
        setSelectedPostId(null)
        message.success('发布信息已删除')

        await queryClient.invalidateQueries({ queryKey: queryKeys.admin.pendingList() })
      },
    })
  }

  const handleDeleteFeedbackPost = async () => {
    if (!relatedPost)
      return

    if (deletePostMutation.isPending)
      return

    const postId = relatedPost.id
    const itemName = relatedPost.item_name || `ID ${postId}`

    modal.confirm({
      title: '确认删除该帖子？',
      content: `删除后不可恢复：${itemName}`,
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true, type: 'primary' },
      icon: <ExclamationCircleOutlined />,
      onOk: async () => {
        await deletePostMutation.mutateAsync({ post_id: postId })
        message.success('该帖子已删除')

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['post', 'list'] }),
          queryClient.invalidateQueries({ queryKey: queryKeys.admin.pendingList() }),
          queryClient.invalidateQueries({ queryKey: queryKeys.feedback.list() }),
          queryClient.invalidateQueries({ queryKey: queryKeys.feedback.detail(selectedFeedbackId) }),
        ])
      },
    })
  }

  const closeRejectModal = () => {
    if (rejectPostMutation.isPending)
      return

    setShowRejectModal(false)
    setRejectReason('')
  }

  const handleApprovePost = async () => {
    if (!selectedPostId)
      return

    if (approvePostMutation.isPending || rejectPostMutation.isPending || deletePostMutation.isPending)
      return

    await approvePostMutation.mutateAsync({ post_id: selectedPostId })
    setSelectedPostId(null)
    message.success('发布信息审核通过')

    await queryClient.invalidateQueries({ queryKey: queryKeys.admin.pendingList() })
  }

  const handleRejectPost = async () => {
    if (!selectedPostId)
      return

    const reason = rejectReason.trim()
    if (!reason) {
      message.warning('请填写驳回理由')
      return
    }

    await rejectPostMutation.mutateAsync({ post_id: selectedPostId, reason })
    setShowRejectModal(false)
    setRejectReason('')
    setSelectedPostId(null)
    message.success('发布信息审核驳回')

    await queryClient.invalidateQueries({ queryKey: queryKeys.admin.pendingList() })
  }

  return (
    <Space direction="vertical" size={16} className="w-full">
      <Card>
        <Segmented
          block
          value={activeTab}
          options={[
            { label: '审核发布信息', value: 'review' },
            { label: '发送全体系统通知', value: 'global' },
            { label: '发送系统通知', value: 'regional-send' },
            { label: '审核区域公告', value: 'regional-review' },
            { label: '投诉与反馈', value: 'feedback' },
          ]}
          onChange={value => setActiveTab(value as MainTab)}
        />
      </Card>

      {activeTab === 'global' && (
        <Card title="发送全体系统通知（全局公告）">
          <Space direction="vertical" size={12} className="w-full">
            <Input
              value={globalTitle}
              maxLength={100}
              placeholder="请输入公告标题（限100字）"
              onChange={event => setGlobalTitle(event.target.value)}
            />

            <TextArea
              rows={8}
              maxLength={5000}
              value={globalContent}
              placeholder="请输入公告内容（限5000字）"
              onChange={event => setGlobalContent(event.target.value)}
            />

            <Button
              type="primary"
              className="w-fit"
              loading={publishMutation.isPending}
              disabled={!globalTitle.trim() || !globalContent.trim()}
              onClick={() => {
                void handlePublishGlobalAnnouncement()
              }}
            >
              发送全体系统通知
            </Button>
          </Space>
        </Card>
      )}

      {activeTab === 'regional-send' && (
        <Card title="发送系统通知（区域公告）">
          <Space direction="vertical" size={12} className="w-full">
            <Select
              value={regionalCampus}
              placeholder="请选择通知校区"
              options={CAMPUS_OPTIONS}
              onChange={value => setRegionalCampus(value)}
            />

            <Input
              value={regionalTitle}
              maxLength={100}
              placeholder="请输入公告标题（限100字）"
              onChange={event => setRegionalTitle(event.target.value)}
            />

            <TextArea
              rows={6}
              maxLength={5000}
              value={regionalContent}
              placeholder="请输入公告内容（限5000字）"
              onChange={event => setRegionalContent(event.target.value)}
            />

            <div className="pb-1 text-right text-xs text-slate-400">
              {regionalContent.length}
              {' / 5000'}
            </div>

            <Button
              type="primary"
              className="w-fit"
              loading={publishMutation.isPending}
              disabled={!regionalCampus || !regionalTitle.trim() || !regionalContent.trim()}
              onClick={() => {
                void handlePublishRegionalAnnouncement()
              }}
            >
              发送系统通知
            </Button>
          </Space>
        </Card>
      )}

      {activeTab === 'regional-review' && (
        <Flex vertical gap={16}>
          <Card title="区域公告列表" loading={reviewListQuery.isLoading}>
            <Space direction="vertical" size={10} className="w-full">
              {sortedAnnouncements.length === 0 && <Empty description="暂无区域公告" />}
              {sortedAnnouncements.map(item => (
                <Button
                  key={item.id}
                  block
                  className="!h-auto !justify-start !rounded-lg !border-sky-100 !px-4 !py-3 !text-left"
                  onClick={() => setSelectedAnnouncementId(item.id)}
                >
                  <Flex justify="space-between" align="center" className="w-full gap-2">
                    <Space wrap>
                      <Typography.Text strong>{item.title}</Typography.Text>
                      <Tag color="processing">待审核</Tag>
                    </Space>
                    <Typography.Text type="secondary">{formatDate(item.created_at)}</Typography.Text>
                  </Flex>
                </Button>
              ))}
            </Space>
          </Card>

          {selectedAnnouncement && (
            <Card title="区域公告详情">
              <Space direction="vertical" size={16} className="w-full">
                <Typography.Title level={5} className="!mb-0">
                  {selectedAnnouncement.title}
                </Typography.Title>

                <Typography.Paragraph className="!mb-0">
                  {selectedAnnouncement.content}
                </Typography.Paragraph>

                <Flex justify="space-between" align="center">
                  <Typography.Text type="secondary">{formatDate(selectedAnnouncement.created_at)}</Typography.Text>
                  <Button type="primary" loading={approveMutation.isPending} onClick={handleApproveAnnouncement}>
                    审核通过
                  </Button>
                </Flex>
              </Space>
            </Card>
          )}
        </Flex>
      )}

      {activeTab === 'review' && (
        <Space direction="vertical" size={16} className="w-full">
          {!selectedPostId && (
            <Card title="发布信息列表" loading={pendingListLoading}>
              <Space direction="vertical" size={10} className="w-full">
                {visibleReviewPosts.length === 0 && <Empty description="暂无可审核发布信息" />}
                {visibleReviewPosts.map(post => (
                  <Button
                    key={post.id}
                    block
                    className="!h-auto !justify-start !rounded-lg !border-sky-100 !px-4 !py-3 !text-left"
                    onClick={() => setSelectedPostId(post.id)}
                  >
                    <Flex justify="space-between" align="center" className="w-full gap-2">
                      <Space wrap>
                        <Tag color={toPublishKind(post.publish_type) === 'lost' ? 'gold' : 'blue'}>{KIND_LABEL[toPublishKind(post.publish_type)]}</Tag>
                        <Typography.Text>{post.item_name}</Typography.Text>
                        <Typography.Text type="secondary">{post.item_type}</Typography.Text>
                      </Space>
                      <Typography.Text type="secondary">{formatDateTime(post.event_time)}</Typography.Text>
                    </Flex>
                  </Button>
                ))}
              </Space>
            </Card>
          )}

          {selectedPostId && (
            <Card title="物品详情页" loading={postDetailQuery.isLoading}>
              {postDetailQuery.data && (
                <Space direction="vertical" size={16} className="w-full">
                  <Descriptions
                    bordered
                    column={{ xs: 1, md: 2 }}
                    items={[
                      { key: 'kind', label: '发布类型', children: KIND_LABEL[toPublishKind(postDetailQuery.data.publish_type)] },
                      { key: 'type', label: '物品类型', children: postDetailQuery.data.item_type },
                      { key: 'name', label: '名称', children: postDetailQuery.data.item_name },
                      { key: 'status', label: '物品状态', children: toPostStatusLabel(postDetailQuery.data.status) },
                      { key: 'features', label: '描述特征', children: postDetailQuery.data.features },
                      { key: 'location', label: '具体地点', children: postDetailQuery.data.location },
                      { key: 'time', label: '时间范围', children: formatDateTime(postDetailQuery.data.event_time) },
                      { key: 'contact', label: '联系方式', children: postDetailQuery.data.contact_phone },
                    ]}
                  />

                  <Flex wrap gap={8}>
                    {postDetailQuery.data.images.map((photo, index) => (
                      <Image
                        key={`${postDetailQuery.data?.id}-${photo}`}
                        src={photo}
                        alt={`${postDetailQuery.data?.item_name}-${index + 1}`}
                        width={160}
                        height={112}
                        className="rounded-lg object-cover"
                      />
                    ))}
                  </Flex>

                  <Flex gap={10}>
                    <Button onClick={() => setSelectedPostId(null)}>返回</Button>
                    <Button
                      type="primary"
                      loading={approvePostMutation.isPending}
                      disabled={rejectPostMutation.isPending || deletePostMutation.isPending}
                      onClick={handleApprovePost}
                    >
                      审核通过
                    </Button>
                    <Button
                      danger
                      disabled={approvePostMutation.isPending || rejectPostMutation.isPending || deletePostMutation.isPending}
                      onClick={() => setShowRejectModal(true)}
                    >
                      审核驳回
                    </Button>
                    <Button
                      danger
                      type="primary"
                      loading={deletePostMutation.isPending}
                      disabled={approvePostMutation.isPending || rejectPostMutation.isPending}
                      onClick={handleDeletePost}
                    >
                      删除
                    </Button>
                  </Flex>

                  <Modal
                    title="审核驳回"
                    open={showRejectModal}
                    okText="确认驳回"
                    cancelText="取消"
                    onCancel={closeRejectModal}
                    onOk={handleRejectPost}
                    okButtonProps={{ danger: true, loading: rejectPostMutation.isPending, disabled: !rejectReason.trim() }}
                    cancelButtonProps={{ disabled: rejectPostMutation.isPending }}
                    maskClosable={!rejectPostMutation.isPending}
                    closable={!rejectPostMutation.isPending}
                    destroyOnHidden
                  >
                    <Space direction="vertical" size={8} className="w-full">
                      <Typography.Text type="secondary">请填写驳回理由（最多 500 字）</Typography.Text>
                      <TextArea
                        value={rejectReason}
                        maxLength={500}
                        showCount
                        autoSize={{ minRows: 4, maxRows: 6 }}
                        placeholder="请输入驳回理由"
                        onChange={event => setRejectReason(event.target.value)}
                      />
                    </Space>
                  </Modal>
                </Space>
              )}
            </Card>
          )}
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
                      { key: 'status', label: '状态', children: toPostStatusLabel(relatedPost?.status) },
                    ]}
                  />

                  <Flex wrap gap={10}>
                    <Button
                      danger
                      type="primary"
                      loading={deletePostMutation.isPending}
                      disabled={!relatedPost || disableAccountMutation.isPending || processFeedbackMutation.isPending}
                      onClick={handleDeleteFeedbackPost}
                    >
                      删除该帖子
                    </Button>

                    <Button
                      disabled={!relatedPost || disableAccountMutation.isPending || deletePostMutation.isPending}
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
                      disabled={selectedFeedback.processed || disableAccountMutation.isPending || deletePostMutation.isPending}
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
        title="禁用账号"
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
            duration: toDisableDurationParam(disableDuration),
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

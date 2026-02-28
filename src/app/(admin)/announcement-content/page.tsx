'use client'

import { useQueryClient } from '@tanstack/react-query'
import { App, Button, Card, Descriptions, Empty, Flex, Image, Input, Segmented, Space, Tag, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { toPublishKind } from '@/api/shared/transforms'
import { useAdminPendingDetailQuery, useDeleteAdminPostMutation } from '@/query/admin'
import { useAnnouncementReviewListQuery, useApproveAnnouncementMutation, usePublishAnnouncementMutation } from '@/query/announcement'
import { usePostListQuery } from '@/query/post'
import { queryKeys } from '@/query/query-keys'
import { formatDate, formatDateTime, getBeijingTimestamp } from '@/utils/admin-mock'

const { TextArea } = Input

type MainTab = 'global' | 'regional' | 'review'
type PublishKind = 'lost' | 'found'

const KIND_LABEL: Record<PublishKind, string> = {
  lost: '失物',
  found: '招领',
}

export default function AnnouncementContentPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<MainTab>('global')

  const [globalTitle, setGlobalTitle] = useState('系统公告')
  const [globalContent, setGlobalContent] = useState('')

  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<number | null>(null)

  const [postKind, setPostKind] = useState<PublishKind>('lost')
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null)

  const reviewListQuery = useAnnouncementReviewListQuery()
  const publishMutation = usePublishAnnouncementMutation()
  const approveMutation = useApproveAnnouncementMutation()

  const postListQuery = usePostListQuery({ page: 1, page_size: 20 })
  const postDetailQuery = useAdminPendingDetailQuery(selectedPostId)
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
    () => (postListQuery.data?.list ?? [])
      .filter(post => toPublishKind(post.publish_type) === postKind)
      .sort((a, b) => getBeijingTimestamp(b.event_time) - getBeijingTimestamp(a.event_time)),
    [postKind, postListQuery.data?.list],
  )

  const handleApproveAnnouncement = async () => {
    if (!selectedAnnouncement)
      return

    await approveMutation.mutateAsync({ approve: true, id: selectedAnnouncement.id })
    message.success('区域公告审核通过')

    await queryClient.invalidateQueries({ queryKey: queryKeys.announcement.reviewList() })
  }

  const handleDeletePost = async () => {
    if (!selectedPostId)
      return

    await deletePostMutation.mutateAsync({ post_id: selectedPostId })
    setSelectedPostId(null)
    message.success('发布信息已删除')

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['post', 'list'] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.pendingList() }),
    ])
  }

  return (
    <Space direction="vertical" size={16} className="w-full">
      <Card>
        <Segmented
          block
          value={activeTab}
          options={[
            { label: '发布全局公告', value: 'global' },
            { label: '审核区域公告', value: 'regional' },
            { label: '审核发布信息', value: 'review' },
          ]}
          onChange={value => setActiveTab(value as MainTab)}
        />
      </Card>

      {activeTab === 'global' && (
        <Card title="发布全局公告">
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
              onClick={async () => {
                await publishMutation.mutateAsync({
                  content: globalContent.trim(),
                  title: globalTitle.trim(),
                  type: 'SYSTEM',
                })

                setGlobalContent('')
                message.success('全局公告已发布')
              }}
            >
              确认
            </Button>
          </Space>
        </Card>
      )}

      {activeTab === 'regional' && (
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
          <Card>
            <Segmented
              value={postKind}
              options={[
                { label: '失物', value: 'lost' },
                { label: '招领', value: 'found' },
              ]}
              onChange={value => setPostKind(value as PublishKind)}
            />
          </Card>

          {!selectedPostId && (
            <Card title="发布信息列表" loading={postListQuery.isLoading}>
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
                      { key: 'status', label: '物品状态', children: postDetailQuery.data.status },
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
                      danger
                      type="primary"
                      loading={deletePostMutation.isPending}
                      onClick={handleDeletePost}
                    >
                      删除
                    </Button>
                  </Flex>
                </Space>
              )}
            </Card>
          )}
        </Space>
      )}
    </Space>
  )
}

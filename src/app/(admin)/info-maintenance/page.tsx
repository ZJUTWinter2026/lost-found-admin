'use client'

import type { RangePickerProps } from 'antd/es/date-picker'
import type { PostListItem } from '@/api/modules/post'
import { App, Button, Card, DatePicker, Descriptions, Empty, Flex, Image, Input, Modal, Select, Space, Statistic, Table, Tag, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { toCampusName, toPublishKind } from '@/api/shared/transforms'
import { useAdminPendingDetailQuery } from '@/query/admin'
import { usePostListQuery } from '@/query/post'
import { formatDateTime } from '@/utils/admin-mock'

const { Text } = Typography
const { RangePicker } = DatePicker

type PublishKind = 'lost' | 'found'
type DisplayStatus = 'unmatched' | 'matched' | 'claimed' | 'archived'

type Campus = '朝晖' | '屏峰' | '莫干山'

interface StatisticsRow {
  key: string
  claimRate: string
  claimedCount: number
  dimension: string
  matchedCount: number
  totalCount: number
  unmatchedCount: number
}

const KIND_LABEL: Record<PublishKind, string> = {
  lost: '失物',
  found: '招领',
}

const STATUS_LABEL: Record<DisplayStatus, string> = {
  unmatched: '待处理',
  matched: '已发布',
  claimed: '已认领',
  archived: '已归档',
}

const STATUS_COLOR: Record<DisplayStatus, string> = {
  unmatched: 'processing',
  matched: 'success',
  claimed: 'gold',
  archived: 'default',
}

function resolveStatus(status: string): DisplayStatus {
  const normalized = status.toLowerCase()

  if (normalized.includes('archive'))
    return 'archived'
  if (normalized.includes('claim'))
    return 'claimed'
  if (normalized.includes('publish') || normalized.includes('approve') || normalized.includes('match'))
    return 'matched'

  return 'unmatched'
}

function buildStatisticsRows(source: PostListItem[]): StatisticsRow[] {
  if (source.length === 0)
    return []

  const grouped = new Map<string, PostListItem[]>()
  source.forEach((item) => {
    const key = item.item_type_other || item.item_type
    const list = grouped.get(key) ?? []
    list.push(item)
    grouped.set(key, list)
  })

  return [...grouped.entries()]
    .map(([type, items]) => {
      const totalCount = items.length
      const unmatchedCount = items.filter(item => resolveStatus(item.status) === 'unmatched').length
      const matchedCount = items.filter(item => resolveStatus(item.status) === 'matched').length
      const claimedCount = items.filter(item => resolveStatus(item.status) === 'claimed').length

      return {
        key: `type-${type}`,
        claimRate: `${totalCount === 0 ? 0 : ((claimedCount / totalCount) * 100).toFixed(1)}%`,
        claimedCount,
        dimension: type,
        matchedCount,
        totalCount,
        unmatchedCount,
      }
    })
    .sort((a, b) => b.totalCount - a.totalCount)
}

export default function InfoMaintenancePage() {
  const { message } = App.useApp()

  const [selectedType, setSelectedType] = useState<string>()
  const [selectedCampus, setSelectedCampus] = useState<Campus>()
  const [selectedStatus, setSelectedStatus] = useState<DisplayStatus>()
  const [selectedRange, setSelectedRange] = useState<[string, string]>()

  const [appliedType, setAppliedType] = useState<string>()
  const [appliedCampus, setAppliedCampus] = useState<Campus>()
  const [appliedRange, setAppliedRange] = useState<[string, string]>()
  const [hasViewed, setHasViewed] = useState(false)

  const [statisticsVisible, setStatisticsVisible] = useState(false)

  const [detailPostId, setDetailPostId] = useState<number | null>(null)

  const postListQuery = usePostListQuery({
    campus: appliedCampus,
    end_time: appliedRange?.[1],
    item_type: appliedType,
    page: 1,
    page_size: 20,
    start_time: appliedRange?.[0],
  })

  const detailQuery = useAdminPendingDetailQuery(detailPostId)

  const allRows = useMemo(
    () => postListQuery.data?.list ?? [],
    [postListQuery.data?.list],
  )

  const filteredRows = useMemo(
    () => allRows
      .filter((item) => {
        if (selectedStatus && resolveStatus(item.status) !== selectedStatus)
          return false

        return true
      })
      .sort((a, b) => new Date(b.event_time).getTime() - new Date(a.event_time).getTime()),
    [allRows, selectedStatus],
  )

  const statisticsRows = useMemo(
    () => buildStatisticsRows(filteredRows),
    [filteredRows],
  )

  const summaryData = useMemo(() => {
    const total = filteredRows.length
    const unmatched = filteredRows.filter(item => resolveStatus(item.status) === 'unmatched').length
    const matched = filteredRows.filter(item => resolveStatus(item.status) === 'matched').length
    const claimed = filteredRows.filter(item => resolveStatus(item.status) === 'claimed').length

    return { claimed, matched, total, unmatched }
  }, [filteredRows])

  const hasAnyFilter = Boolean(selectedType || selectedCampus || selectedStatus || (selectedRange?.[0] && selectedRange?.[1]))

  const handleRangeChange: RangePickerProps['onChange'] = (_value, dateStrings) => {
    if (dateStrings[0] && dateStrings[1]) {
      setSelectedRange([dateStrings[0], dateStrings[1]])
      return
    }

    setSelectedRange(undefined)
  }

  const handleView = () => {
    setAppliedType(selectedType)
    setAppliedCampus(selectedCampus)
    setAppliedRange(selectedRange)
    setHasViewed(true)
    setStatisticsVisible(false)
  }

  return (
    <Flex vertical gap={16}>
      <Card title="筛选框" styles={{ body: { padding: 16 } }}>
        <Flex vertical gap={12}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Input
              allowClear
              placeholder="物品类型"
              value={selectedType}
              onChange={event => setSelectedType(event.target.value || undefined)}
            />

            <Select
              allowClear
              placeholder="丢失/拾取校区"
              value={selectedCampus}
              options={[
                { label: '朝晖', value: '朝晖' },
                { label: '屏峰', value: '屏峰' },
                { label: '莫干山', value: '莫干山' },
              ]}
              onChange={value => setSelectedCampus(value as Campus)}
              onClear={() => setSelectedCampus(undefined)}
            />

            <RangePicker
              allowClear
              className="w-full"
              format="YYYY-MM-DD"
              onChange={handleRangeChange}
            />

            <Select
              allowClear
              placeholder="物品状态"
              value={selectedStatus}
              options={[
                { label: '待处理', value: 'unmatched' },
                { label: '已发布', value: 'matched' },
                { label: '已认领', value: 'claimed' },
                { label: '已归档', value: 'archived' },
              ]}
              onChange={value => setSelectedStatus(value as DisplayStatus)}
              onClear={() => setSelectedStatus(undefined)}
            />
          </div>

          <Flex justify="end">
            <Button type="primary" disabled={!hasAnyFilter} onClick={handleView}>
              查看
            </Button>
          </Flex>
        </Flex>
      </Card>

      <Card styles={{ body: { padding: 16 } }}>
        <Flex vertical gap={12}>
          <Flex gap={8} wrap>
            <Button onClick={() => setStatisticsVisible(true)} disabled={!hasViewed || filteredRows.length === 0}>
              统计数据
            </Button>
            <Button
              type="primary"
              disabled={!statisticsVisible || statisticsRows.length === 0}
              onClick={() => message.info('导出能力可按当前统计表扩展后端文件接口')}
            >
              导出
            </Button>
          </Flex>

          {statisticsVisible && (
            <Flex vertical gap={12}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Card size="small"><Statistic title="发布总数" value={summaryData.total} /></Card>
                <Card size="small"><Statistic title="待处理" value={summaryData.unmatched} /></Card>
                <Card size="small"><Statistic title="已发布" value={summaryData.matched} /></Card>
                <Card size="small"><Statistic title="已认领" value={summaryData.claimed} /></Card>
              </div>

              <Table<StatisticsRow>
                size="small"
                rowKey="key"
                columns={[
                  { dataIndex: 'dimension', key: 'dimension', title: '统计维度' },
                  { dataIndex: 'totalCount', key: 'totalCount', title: '发布总数' },
                  { dataIndex: 'unmatchedCount', key: 'unmatchedCount', title: '待处理' },
                  { dataIndex: 'matchedCount', key: 'matchedCount', title: '已发布' },
                  { dataIndex: 'claimedCount', key: 'claimedCount', title: '已认领' },
                  { dataIndex: 'claimRate', key: 'claimRate', title: '认领率' },
                ]}
                dataSource={statisticsRows}
                pagination={false}
                scroll={{ x: 680 }}
                locale={{ emptyText: '暂无可统计的数据' }}
              />
            </Flex>
          )}
        </Flex>
      </Card>

      <Card title="物品信息列表" styles={{ body: { padding: '12px 14px' } }} loading={postListQuery.isLoading}>
        {!hasViewed && (
          <div className="py-10">
            <Empty description="请选择至少一个筛选条件并点击查看" />
          </div>
        )}

        {hasViewed && filteredRows.length === 0 && (
          <div className="py-10">
            <Empty description="未查询到符合条件的物品信息" />
          </div>
        )}

        {hasViewed && filteredRows.length > 0 && (
          <div className="max-h-[calc(100vh-420px)] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredRows.map(item => (
                <Card
                  key={item.id}
                  hoverable
                  size="small"
                  className="h-full"
                  onClick={() => setDetailPostId(item.id)}
                >
                  <Flex vertical gap={8}>
                    <Flex justify="space-between" align="center" wrap>
                      <Space size={8}>
                        <Text strong>{item.item_name}</Text>
                        <Tag color="blue">{item.item_type_other || item.item_type}</Tag>
                      </Space>

                      <Space size={8}>
                        <Tag>{KIND_LABEL[toPublishKind(item.publish_type)]}</Tag>
                        <Tag color={STATUS_COLOR[resolveStatus(item.status)]}>{STATUS_LABEL[resolveStatus(item.status)]}</Tag>
                      </Space>
                    </Flex>

                    <Text type="secondary">
                      丢失/拾取地点：
                      {toCampusName(item.campus) ?? item.campus}
                      {' / '}
                      {item.location}
                    </Text>

                    <Text type="secondary">
                      丢失/拾取时间：
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
        title={detailQuery.data ? `${detailQuery.data.item_name} 信息详情` : '物品详情'}
        open={Boolean(detailPostId)}
        onCancel={() => setDetailPostId(null)}
        footer={null}
        width={760}
        destroyOnHidden
        styles={{ body: { maxHeight: '72vh', overflowY: 'auto', paddingTop: 12 } }}
      >
        <Card loading={detailQuery.isLoading}>
          {detailQuery.data && (
            <Flex vertical gap={16}>
              <Card size="small" title="物品详情">
                <Flex vertical gap={12}>
                  <Descriptions
                    size="small"
                    column={1}
                    items={[
                      { label: '物品类型', children: detailQuery.data.item_type_other || detailQuery.data.item_type },
                      { label: '名称', children: detailQuery.data.item_name },
                      {
                        label: '物品状态',
                        children: (
                          <Tag color={STATUS_COLOR[resolveStatus(detailQuery.data.status)]}>
                            {STATUS_LABEL[resolveStatus(detailQuery.data.status)]}
                          </Tag>
                        ),
                      },
                      { label: '描述特征', children: detailQuery.data.features },
                      { label: '具体地点', children: detailQuery.data.location },
                      { label: '时间范围', children: formatDateTime(detailQuery.data.event_time) },
                      { label: '联系方式', children: detailQuery.data.contact_phone },
                      { label: '联系人', children: detailQuery.data.contact_name },
                    ]}
                  />

                  <Flex vertical gap={8}>
                    <Text strong>照片</Text>
                    {detailQuery.data.images.length > 0
                      ? (
                          <Image.PreviewGroup>
                            <Flex gap={8} wrap justify="start">
                              {detailQuery.data.images.slice(0, 3).map(photo => (
                                <Image
                                  key={`${detailQuery.data?.id}-${photo}`}
                                  src={photo}
                                  alt={`${detailQuery.data?.item_name}-照片`}
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
              </Card>

              <Card size="small" title="信息维护">
                <Button onClick={() => message.info('后端暂未提供该页面的信息更新接口')}>更改信息</Button>
              </Card>

              <Flex justify="end">
                <Button onClick={() => setDetailPostId(null)}>返回</Button>
              </Flex>
            </Flex>
          )}
        </Card>
      </Modal>
    </Flex>
  )
}

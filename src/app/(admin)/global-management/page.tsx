'use client'

import type { RangePickerProps } from 'antd/es/date-picker'
import { PlusOutlined } from '@ant-design/icons'
import { useQueryClient } from '@tanstack/react-query'
import { App, Button, Card, DatePicker, Flex, Input, InputNumber, Segmented, Select, Space, Statistic, Table, Tag, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { toCampusName } from '@/api/shared/transforms'
import { useAdminStatisticsQuery } from '@/query/admin'
import { usePostListQuery } from '@/query/post'
import { queryKeys } from '@/query/query-keys'
import { useSystemConfigQuery, useUpdateClaimValidityDaysMutation, useUpdateFeedbackTypesMutation, useUpdateItemTypesMutation, useUpdatePublishLimitMutation } from '@/query/system'
import { formatDateTime } from '@/utils/admin-mock'

const { RangePicker } = DatePicker
const { Text, Title } = Typography

type GlobalTab = 'overview' | 'params' | 'permission'

export default function GlobalManagementPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<GlobalTab>('overview')

  const [selectedType, setSelectedType] = useState<string>()
  const [selectedCampus, setSelectedCampus] = useState<'朝晖' | '屏峰' | '莫干山'>()
  const [selectedRange, setSelectedRange] = useState<[string, string]>()

  const [appliedType, setAppliedType] = useState<string>()
  const [appliedCampus, setAppliedCampus] = useState<'朝晖' | '屏峰' | '莫干山'>()
  const [appliedRange, setAppliedRange] = useState<[string, string]>()

  const [newItemType, setNewItemType] = useState('')
  const [newFeedbackType, setNewFeedbackType] = useState('')
  const [claimDays, setClaimDays] = useState<number>()
  const [publishLimit, setPublishLimit] = useState<number>()
  const [guideline, setGuideline] = useState('《失物招领内容规范》：发布信息需真实、完整，不得含违法违规内容。')

  const configQuery = useSystemConfigQuery()
  const statisticsQuery = useAdminStatisticsQuery(activeTab === 'overview')
  const updateFeedbackTypesMutation = useUpdateFeedbackTypesMutation()
  const updateItemTypesMutation = useUpdateItemTypesMutation()
  const updateClaimValidityDaysMutation = useUpdateClaimValidityDaysMutation()
  const updatePublishLimitMutation = useUpdatePublishLimitMutation()

  const overviewQuery = usePostListQuery({
    campus: appliedCampus,
    end_time: appliedRange?.[1],
    item_type: appliedType,
    page: 1,
    page_size: 20,
    start_time: appliedRange?.[0],
  })

  const itemTypeOptions = useMemo(
    () => (configQuery.data?.item_types ?? []).map(item => ({ label: item, value: item })),
    [configQuery.data?.item_types],
  )

  const hasSelectedFilter = Boolean(selectedType || selectedCampus || selectedRange?.[0] || selectedRange?.[1])

  const statusRows = useMemo(
    () => Object.entries(statisticsQuery.data?.status_counts ?? {}).map(([key, value]) => ({ key, status: key, total: value })),
    [statisticsQuery.data?.status_counts],
  )

  const typeRows = useMemo(
    () => Object.entries(statisticsQuery.data?.type_counts ?? {}).map(([key, value]) => ({
      key,
      percentage: statisticsQuery.data?.type_percentage?.[key] ?? '0%',
      total: value,
      type: key,
    })),
    [statisticsQuery.data?.type_counts, statisticsQuery.data?.type_percentage],
  )

  const handleRangeChange: RangePickerProps['onChange'] = (_value, dateStrings) => {
    if (!Array.isArray(dateStrings))
      return

    const [start = '', end = ''] = dateStrings
    if (!start || !end) {
      setSelectedRange(undefined)
      return
    }

    setSelectedRange([`${start}T00:00:00Z`, `${end}T23:59:59Z`])
  }

  const refreshConfig = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.system.config() })
  }

  const config = configQuery.data

  return (
    <Space direction="vertical" size={16} className="w-full">
      <Card>
        <Flex vertical gap={10}>
          <Title level={4} className="!mb-0">全局管理</Title>
          <Text type="secondary">查看统计、维护参数、配置发布权限</Text>
          <Segmented
            value={activeTab}
            options={[
              { label: '查看信息总览', value: 'overview' },
              { label: '修改系统参数', value: 'params' },
              { label: '信息发布权限', value: 'permission' },
            ]}
            block
            onChange={value => setActiveTab(value as GlobalTab)}
          />
        </Flex>
      </Card>

      {activeTab === 'overview' && (
        <Space direction="vertical" size={16} className="w-full">
          <Card>
            <Flex wrap gap={12} className="w-full">
              <Select
                allowClear
                placeholder="物品类型"
                className="w-full min-w-36 md:w-44"
                value={selectedType}
                options={itemTypeOptions}
                onChange={value => setSelectedType(value)}
                onClear={() => setSelectedType(undefined)}
              />

              <Select
                allowClear
                placeholder="校区"
                className="w-full min-w-36 md:w-44"
                value={selectedCampus}
                options={[
                  { label: '朝晖', value: '朝晖' },
                  { label: '屏峰', value: '屏峰' },
                  { label: '莫干山', value: '莫干山' },
                ]}
                onChange={value => setSelectedCampus(value)}
                onClear={() => setSelectedCampus(undefined)}
              />

              <RangePicker className="w-full min-w-52 md:w-72" onChange={handleRangeChange} />

              <Button
                type="primary"
                disabled={!hasSelectedFilter}
                onClick={() => {
                  setAppliedType(selectedType)
                  setAppliedCampus(selectedCampus)
                  setAppliedRange(selectedRange)
                }}
              >
                查看
              </Button>
            </Flex>
          </Card>

          <Card title="后端统计数据" loading={statisticsQuery.isLoading}>
            <Flex wrap gap={16} className="mb-4">
              <Card size="small" className="min-w-40">
                <Statistic title="状态分类数" value={statusRows.length} />
              </Card>
              <Card size="small" className="min-w-40">
                <Statistic title="类型分类数" value={typeRows.length} />
              </Card>
            </Flex>

            <Flex vertical gap={12}>
              <Table
                size="small"
                rowKey="key"
                title={() => '按状态统计'}
                columns={[
                  { title: '状态', dataIndex: 'status', key: 'status' },
                  { title: '数量', dataIndex: 'total', key: 'total' },
                ]}
                dataSource={statusRows}
                pagination={false}
              />

              <Table
                size="small"
                rowKey="key"
                title={() => '按类型统计'}
                columns={[
                  { title: '类型', dataIndex: 'type', key: 'type' },
                  { title: '数量', dataIndex: 'total', key: 'total' },
                  { title: '占比', dataIndex: 'percentage', key: 'percentage' },
                ]}
                dataSource={typeRows}
                pagination={false}
              />
            </Flex>
          </Card>

          <Card title="筛选结果" loading={overviewQuery.isLoading}>
            <Space direction="vertical" size={12} className="w-full">
              {(overviewQuery.data?.list ?? []).map(item => (
                <Button
                  key={item.id}
                  block
                  className="!h-auto !justify-start !rounded-lg !border-sky-100 !px-4 !py-3 !text-left"
                >
                  <Flex justify="space-between" align="center" className="w-full gap-2">
                    <Space wrap>
                      <Tag color="blue">{item.item_type_other || item.item_type}</Tag>
                      <Text>{item.item_name}</Text>
                      <Text type="secondary">
                        {toCampusName(item.campus) ?? item.campus}
                        {' '}
                        ·
                        {' '}
                        {item.location}
                      </Text>
                    </Space>
                    <Text type="secondary">{formatDateTime(item.event_time)}</Text>
                  </Flex>
                </Button>
              ))}
            </Space>
          </Card>
        </Space>
      )}

      {activeTab === 'params' && (
        <Space direction="vertical" size={16} className="w-full">
          <Card title="用户投诉与反馈类型" loading={configQuery.isLoading}>
            <Space direction="vertical" size={12} className="w-full">
              <Flex wrap gap={8}>
                {(config?.feedback_types ?? []).map(type => (
                  <Tag key={type} color="blue">{type}</Tag>
                ))}
              </Flex>

              <Flex gap={8} wrap>
                <Input
                  value={newFeedbackType}
                  maxLength={15}
                  placeholder="新增反馈类型"
                  className="w-48"
                  onChange={event => setNewFeedbackType(event.target.value)}
                />
                <Button
                  icon={<PlusOutlined />}
                  disabled={!newFeedbackType.trim() || !config}
                  onClick={async () => {
                    if (!config)
                      return

                    const next = Array.from(new Set([...config.feedback_types, newFeedbackType.trim()]))
                    await updateFeedbackTypesMutation.mutateAsync({ feedback_types: next })
                    await refreshConfig()
                    message.success('投诉反馈类型已更新')
                    setNewFeedbackType('')
                  }}
                >
                  添加
                </Button>
              </Flex>
            </Space>
          </Card>

          <Card title="物品类型分类" loading={configQuery.isLoading}>
            <Space direction="vertical" size={12} className="w-full">
              <Flex wrap gap={8}>
                {(config?.item_types ?? []).map(type => (
                  <Tag key={type} color="blue">{type}</Tag>
                ))}
              </Flex>

              <Flex gap={8} wrap>
                <Input
                  value={newItemType}
                  maxLength={15}
                  placeholder="新增物品类型"
                  className="w-48"
                  onChange={event => setNewItemType(event.target.value)}
                />
                <Button
                  icon={<PlusOutlined />}
                  disabled={!newItemType.trim() || !config}
                  onClick={async () => {
                    if (!config)
                      return

                    const next = Array.from(new Set([...config.item_types, newItemType.trim()]))
                    await updateItemTypesMutation.mutateAsync({ item_types: next })
                    await refreshConfig()
                    message.success('物品类型已更新')
                    setNewItemType('')
                  }}
                >
                  添加
                </Button>
              </Flex>
            </Space>
          </Card>

          <Card title="认领时效（天）" loading={configQuery.isLoading}>
            <Flex gap={10} wrap align="center">
              <InputNumber
                min={1}
                max={365}
                addonAfter="天"
                defaultValue={config?.claim_validity_days}
                key={config?.claim_validity_days}
                onChange={value => setClaimDays(value ? Math.min(Math.max(value, 1), 365) : undefined)}
                onBlur={async () => {
                  if (!claimDays || claimDays === config?.claim_validity_days)
                    return
                  await updateClaimValidityDaysMutation.mutateAsync({ claim_validity_days: claimDays })
                  await refreshConfig()
                  message.success('认领时效已更新')
                }}
              />
            </Flex>
          </Card>
        </Space>
      )}

      {activeTab === 'permission' && (
        <Space direction="vertical" size={16} className="w-full">
          <Card title="发布频率" loading={configQuery.isLoading}>
            <InputNumber
              min={1}
              max={200}
              addonAfter="条/天"
              defaultValue={config?.publish_limit}
              key={config?.publish_limit}
              onChange={value => setPublishLimit(value ? Math.min(Math.max(value, 1), 200) : undefined)}
              onBlur={async () => {
                if (!publishLimit || publishLimit === config?.publish_limit)
                  return
                await updatePublishLimitMutation.mutateAsync({ publish_limit: publishLimit })
                await refreshConfig()
                message.success('发布频率已更新')
              }}
            />
          </Card>

          <Card title="内容规范">
            <Space direction="vertical" size={10} className="w-full">
              <Input.TextArea
                rows={8}
                maxLength={5000}
                value={guideline}
                onChange={event => setGuideline(event.target.value)}
              />
              <Button onClick={() => message.success('已保存（当前为前端配置，后续可接公告/配置接口）')}>保存</Button>
            </Space>
          </Card>
        </Space>
      )}
    </Space>
  )
}

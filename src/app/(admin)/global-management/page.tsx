'use client'

import { PlusOutlined } from '@ant-design/icons'
import { useQueryClient } from '@tanstack/react-query'
import { App, Button, Card, Flex, Input, InputNumber, Segmented, Space, Statistic, Table, Tag } from 'antd'
import { useMemo, useState } from 'react'
import { useAdminStatisticsQuery } from '@/query/admin'
import { queryKeys } from '@/query/query-keys'
import { useSystemConfigQuery, useUpdateClaimValidityDaysMutation, useUpdateFeedbackTypesMutation, useUpdateItemTypesMutation, useUpdatePublishLimitMutation } from '@/query/system'

type GlobalTab = 'overview' | 'params'

export default function GlobalManagementPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<GlobalTab>('overview')

  const [newItemType, setNewItemType] = useState('')
  const [newFeedbackType, setNewFeedbackType] = useState('')
  const [claimDays, setClaimDays] = useState<number>()
  const [publishLimit, setPublishLimit] = useState<number>()

  const configQuery = useSystemConfigQuery()
  const statisticsQuery = useAdminStatisticsQuery(activeTab === 'overview')
  const updateFeedbackTypesMutation = useUpdateFeedbackTypesMutation()
  const updateItemTypesMutation = useUpdateItemTypesMutation()
  const updateClaimValidityDaysMutation = useUpdateClaimValidityDaysMutation()
  const updatePublishLimitMutation = useUpdatePublishLimitMutation()

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

  const refreshConfig = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.system.config() })
  }

  const config = configQuery.data

  return (
    <Space direction="vertical" size={16} className="w-full">
      <Card>
        <Segmented
          value={activeTab}
          options={[
            { label: '查看信息总览', value: 'overview' },
            { label: '修改系统参数', value: 'params' },
          ]}
          block
          onChange={value => setActiveTab(value as GlobalTab)}
        />
      </Card>

      {activeTab === 'overview' && (
        <Space direction="vertical" size={16} className="w-full">
          <Card loading={statisticsQuery.isLoading}>
            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <Card size="small" className="w-full">
                <Statistic title={<span className="font-semibold text-slate-700">状态分类数</span>} value={statusRows.length} />
              </Card>
              <Card size="small" className="w-full">
                <Statistic title={<span className="font-semibold text-slate-700">类型分类数</span>} value={typeRows.length} />
              </Card>
            </div>

            <Flex vertical gap={12}>
              <Table
                size="small"
                rowKey="key"
                title={() => <span className="text-base font-semibold text-slate-900">按状态统计</span>}
                columns={[
                  { title: <span className="font-semibold">状态</span>, dataIndex: 'status', key: 'status' },
                  { title: <span className="font-semibold">数量</span>, dataIndex: 'total', key: 'total' },
                ]}
                dataSource={statusRows}
                pagination={false}
              />

              <Table
                size="small"
                rowKey="key"
                title={() => <span className="text-base font-semibold text-slate-900">按类型统计</span>}
                columns={[
                  { title: <span className="font-semibold">类型</span>, dataIndex: 'type', key: 'type' },
                  { title: <span className="font-semibold">数量</span>, dataIndex: 'total', key: 'total' },
                  { title: <span className="font-semibold">占比</span>, dataIndex: 'percentage', key: 'percentage' },
                ]}
                dataSource={typeRows}
                pagination={false}
              />
            </Flex>
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
        </Space>
      )}
    </Space>
  )
}

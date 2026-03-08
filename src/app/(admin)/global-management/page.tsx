'use client'

import type { ColumnsType } from 'antd/es/table'
import type { AdminExpiredListItem } from '@/api/modules/admin'
import { PlusOutlined } from '@ant-design/icons'
import { useQueryClient } from '@tanstack/react-query'
import { App, Button, Card, Flex, Input, InputNumber, Popconfirm, Segmented, Space, Statistic, Table, Tag } from 'antd'
import { useMemo, useState } from 'react'
import { resolveErrorMessage } from '@/api/core/errors'
import { toPublishKind } from '@/api/shared/transforms'
import { useAdminExpiredListQuery, useAdminStatisticsQuery, useCleanAdminExpiredDataMutation, useExportAdminSystemDataMutation } from '@/query/admin'
import { queryKeys } from '@/query/query-keys'
import { useSystemConfigQuery, useUpdateClaimValidityDaysMutation, useUpdateFeedbackTypesMutation, useUpdateItemTypesMutation, useUpdatePublishLimitMutation } from '@/query/system'
import { formatDateTime } from '@/utils/admin-mock'

type GlobalTab = 'overview' | 'params' | 'data'
const PROTECTED_TYPE_NAMES = new Set(['其他类型', '其它类型'])

const EXPIRED_STATUS_LABEL_MAP: Record<string, string> = {
  APPROVED: '已通过',
  ARCHIVED: '已归档',
  CANCELLED: '已取消',
  DELETED: '已删除',
  PENDING: '待审核',
  REJECTED: '已驳回',
  SOLVED: '已认领',
}

function toExpiredStatusLabel(value: string) {
  const normalized = value.toUpperCase()
  return EXPIRED_STATUS_LABEL_MAP[normalized] ?? value
}

function toExpiredStatusColor(value: string) {
  const normalized = value.toUpperCase()

  if (normalized === 'SOLVED')
    return 'success'

  if (normalized === 'ARCHIVED')
    return 'default'

  if (normalized === 'APPROVED')
    return 'processing'

  if (normalized === 'CANCELLED' || normalized === 'REJECTED' || normalized === 'DELETED')
    return 'error'

  return 'blue'
}

function resolveExportUrl(url: string) {
  if (typeof window === 'undefined')
    return url

  if (/^https?:\/\//i.test(url))
    return url

  return new URL(url, window.location.origin).toString()
}

function isProtectedTypeName(value: string) {
  return PROTECTED_TYPE_NAMES.has(value.trim())
}

export default function GlobalManagementPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<GlobalTab>('overview')

  const [newItemType, setNewItemType] = useState('')
  const [newFeedbackType, setNewFeedbackType] = useState('')
  const [claimDays, setClaimDays] = useState<number>()
  const [publishLimit, setPublishLimit] = useState<number>()
  const [expiredPage, setExpiredPage] = useState(1)
  const [expiredPageSize, setExpiredPageSize] = useState(10)

  const configQuery = useSystemConfigQuery()
  const statisticsQuery = useAdminStatisticsQuery(activeTab === 'overview')
  const expiredListQuery = useAdminExpiredListQuery(
    { page: expiredPage, page_size: expiredPageSize },
    activeTab === 'data',
  )
  const updateFeedbackTypesMutation = useUpdateFeedbackTypesMutation()
  const updateItemTypesMutation = useUpdateItemTypesMutation()
  const updateClaimValidityDaysMutation = useUpdateClaimValidityDaysMutation()
  const updatePublishLimitMutation = useUpdatePublishLimitMutation()
  const cleanExpiredMutation = useCleanAdminExpiredDataMutation()
  const exportDataMutation = useExportAdminSystemDataMutation()
  const config = configQuery.data

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

  const expiredColumns = useMemo<ColumnsType<AdminExpiredListItem>>(
    () => [
      {
        title: <span className="font-semibold">ID</span>,
        dataIndex: 'id',
        key: 'id',
        width: 96,
      },
      {
        title: <span className="font-semibold">发布类型</span>,
        dataIndex: 'publish_type',
        key: 'publish_type',
        width: 100,
        render: value => (toPublishKind(value as string) === 'lost' ? '失物' : '招领'),
      },
      {
        title: <span className="font-semibold">物品名称</span>,
        dataIndex: 'item_name',
        key: 'item_name',
        width: 140,
        ellipsis: true,
      },
      {
        title: <span className="font-semibold">状态</span>,
        dataIndex: 'status',
        key: 'status',
        width: 110,
        render: value => <Tag color={toExpiredStatusColor(value as string)}>{toExpiredStatusLabel(value as string)}</Tag>,
      },
      {
        title: <span className="font-semibold">地点</span>,
        dataIndex: 'location',
        key: 'location',
        width: 150,
        ellipsis: true,
      },
      {
        title: <span className="font-semibold">更新时间</span>,
        dataIndex: 'updated_at',
        key: 'updated_at',
        width: 170,
        render: value => formatDateTime(value as string),
      },
      {
        title: <span className="font-semibold">说明</span>,
        key: 'remark',
        width: 220,
        ellipsis: true,
        render: (_, row) => row.archive_method || row.cancel_reason || row.reject_reason || '-',
      },
    ],
    [],
  )

  const refreshConfig = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.system.config() })
  }

  const handleUpdateFeedbackTypes = async (nextTypes: string[], successMessage: string) => {
    try {
      await updateFeedbackTypesMutation.mutateAsync({ feedback_types: nextTypes })
      await refreshConfig()
      message.success(successMessage)
    }
    catch (error) {
      message.error(resolveErrorMessage(error, '更新投诉反馈类型失败，请稍后再试'))
    }
  }

  const handleUpdateItemTypes = async (nextTypes: string[], successMessage: string) => {
    try {
      await updateItemTypesMutation.mutateAsync({ item_types: nextTypes })
      await refreshConfig()
      message.success(successMessage)
    }
    catch (error) {
      message.error(resolveErrorMessage(error, '更新物品类型失败，请稍后再试'))
    }
  }

  const handleAddFeedbackType = async () => {
    const value = newFeedbackType.trim()
    if (!config || !value)
      return

    const next = Array.from(new Set([...config.feedback_types, value]))
    await handleUpdateFeedbackTypes(next, '投诉反馈类型已更新')
    setNewFeedbackType('')
  }

  const handleRemoveFeedbackType = async (target: string) => {
    if (!config)
      return
    if (isProtectedTypeName(target)) {
      message.warning('“其他类型/其它类型”为系统保留项，不允许删除')
      return
    }

    const next = config.feedback_types.filter(type => type !== target)
    await handleUpdateFeedbackTypes(next, `已删除“${target}”`)
  }

  const handleAddItemType = async () => {
    const value = newItemType.trim()
    if (!config || !value)
      return

    const next = Array.from(new Set([...config.item_types, value]))
    await handleUpdateItemTypes(next, '物品类型已更新')
    setNewItemType('')
  }

  const handleRemoveItemType = async (target: string) => {
    if (!config)
      return
    if (isProtectedTypeName(target)) {
      message.warning('“其他类型/其它类型”为系统保留项，不允许删除')
      return
    }

    const next = config.item_types.filter(type => type !== target)
    await handleUpdateItemTypes(next, `已删除“${target}”`)
  }

  const refreshExpiredList = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin', 'expired-list'] })
  }

  const handleExportData = async () => {
    try {
      const result = await exportDataMutation.mutateAsync()
      if (!result.url) {
        message.warning('导出链接为空，请稍后重试')
        return
      }

      const exportUrl = resolveExportUrl(result.url)
      window.open(exportUrl, '_blank', 'noopener,noreferrer')
      message.success('导出链接已生成，请在新页面下载')
    }
    catch (error) {
      message.error(resolveErrorMessage(error, '导出失败，请稍后再试'))
    }
  }

  const handleCleanExpiredData = async () => {
    try {
      const result = await cleanExpiredMutation.mutateAsync()
      message.success(`已清除 ${result.deleted_count} 条过期无效数据`)
      setExpiredPage(1)
      await refreshExpiredList()
    }
    catch (error) {
      message.error(resolveErrorMessage(error, '清理失败，请稍后再试'))
    }
  }

  return (
    <Space direction="vertical" size={16} className="w-full">
      <Card>
        <Segmented
          value={activeTab}
          options={[
            { label: '查看信息总览', value: 'overview' },
            { label: '修改系统参数', value: 'params' },
            { label: '数据维护', value: 'data' },
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
                  <Tag
                    key={type}
                    color="blue"
                    closable={!updateFeedbackTypesMutation.isPending && !isProtectedTypeName(type)}
                    onClose={(event) => {
                      event.preventDefault()
                      void handleRemoveFeedbackType(type)
                    }}
                  >
                    {type}
                  </Tag>
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
                  loading={updateFeedbackTypesMutation.isPending}
                  disabled={!newFeedbackType.trim() || !config}
                  onClick={() => {
                    void handleAddFeedbackType()
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
                  <Tag
                    key={type}
                    color="blue"
                    closable={!updateItemTypesMutation.isPending && !isProtectedTypeName(type)}
                    onClose={(event) => {
                      event.preventDefault()
                      void handleRemoveItemType(type)
                    }}
                  >
                    {type}
                  </Tag>
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
                  loading={updateItemTypesMutation.isPending}
                  disabled={!newItemType.trim() || !config}
                  onClick={() => {
                    void handleAddItemType()
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

      {activeTab === 'data' && (
        <Space direction="vertical" size={16} className="w-full">
          <Card title="系统数据导出">
            <Flex vertical gap={10}>
              <Tag color="blue" className="!mr-0 w-fit">
                导出内容为系统统计与历史数据，格式为 Excel
              </Tag>
              <Flex>
                <Button
                  type="primary"
                  loading={exportDataMutation.isPending}
                  onClick={handleExportData}
                >
                  导出系统数据
                </Button>
              </Flex>
            </Flex>
          </Card>

          <Card
            title="过期无效数据"
            extra={(
              <Popconfirm
                title="确认清除所有过期无效数据？"
                okText="确认清除"
                cancelText="取消"
                okButtonProps={{ danger: true, loading: cleanExpiredMutation.isPending }}
                onConfirm={handleCleanExpiredData}
                disabled={cleanExpiredMutation.isPending || (expiredListQuery.data?.total ?? 0) === 0}
              >
                <Button
                  danger
                  loading={cleanExpiredMutation.isPending}
                  disabled={cleanExpiredMutation.isPending || (expiredListQuery.data?.total ?? 0) === 0}
                >
                  清除过期数据
                </Button>
              </Popconfirm>
            )}
          >
            <Table
              rowKey="id"
              size="small"
              loading={expiredListQuery.isLoading}
              dataSource={expiredListQuery.data?.list ?? []}
              columns={expiredColumns}
              scroll={{ x: 1000 }}
              pagination={{
                current: expiredListQuery.data?.page ?? expiredPage,
                pageSize: expiredListQuery.data?.page_size ?? expiredPageSize,
                total: expiredListQuery.data?.total ?? 0,
                showSizeChanger: true,
                pageSizeOptions: [10, 20, 50],
                onChange: (page, pageSize) => {
                  setExpiredPage(page)
                  setExpiredPageSize(pageSize)
                },
              }}
              locale={{ emptyText: '暂无过期无效数据' }}
            />
          </Card>
        </Space>
      )}
    </Space>
  )
}

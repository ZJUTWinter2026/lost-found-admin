'use client'

import type { ColumnsType } from 'antd/es/table'
import { useQueryClient } from '@tanstack/react-query'
import { App, Button, Card, Flex, Form, Input, Modal, Radio, Segmented, Select, Space, Table, Tag, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { normalizeDateTime, toAccountRoleLabel, toDisableDurationParam } from '@/api/shared/transforms'
import {
  useAccountListQuery,
  useCreateAccountMutation,
  useDisableAccountMutation,
  useEnableAccountMutation,
  useUpdateAccountMutation,
} from '@/query/account'
import { queryKeys } from '@/query/query-keys'
import { formatDateTime } from '@/utils/admin-mock'

const { Text } = Typography

type MainTab = 'manage' | 'create'
type DisableDuration = '7d' | '1m' | '6m' | '1y'
type AccountUserType = 'STUDENT' | 'ADMIN' | 'SYSTEM_ADMIN'

interface AccountRow {
  disabledUntil: string | null
  id: number
  name: string
  username: number
  userType: string
}

interface DisableModalState {
  account: AccountRow | null
  duration: DisableDuration | null
  open: boolean
}

interface RestoreModalState {
  account: AccountRow | null
  open: boolean
}

interface CreateAccountValues {
  idCard: string
  name: string
  password: string
  userType: AccountUserType
  userNo: string
}

const ID_CARD_PATTERN = /^\d{17}[\dX]$/i
const ONLY_NUMBER_PATTERN = /^\d+$/
const DISABLE_DURATION_OPTIONS: { label: string, value: DisableDuration }[] = [
  { label: '7天', value: '7d' },
  { label: '1个月', value: '1m' },
  { label: '半年', value: '6m' },
  { label: '1年', value: '1y' },
]

export default function AccountPermissionPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<MainTab>('manage')

  const [searchKeyword, setSearchKeyword] = useState('')
  const [queryUid, setQueryUid] = useState<number | undefined>()
  const [nameFilter, setNameFilter] = useState('')

  const [disableState, setDisableState] = useState<DisableModalState>({
    open: false,
    account: null,
    duration: null,
  })
  const [restoreState, setRestoreState] = useState<RestoreModalState>({
    open: false,
    account: null,
  })
  const [createForm] = Form.useForm<CreateAccountValues>()

  const listQuery = useAccountListQuery(queryUid)
  const createMutation = useCreateAccountMutation()
  const disableMutation = useDisableAccountMutation()
  const enableMutation = useEnableAccountMutation()
  const updateMutation = useUpdateAccountMutation()

  const isWorking = createMutation.isPending
    || disableMutation.isPending
    || enableMutation.isPending
    || updateMutation.isPending

  const accountRows = useMemo<AccountRow[]>(
    () => (listQuery.data?.list ?? []).map(item => ({
      disabledUntil: normalizeDateTime(item.disabled_until),
      id: item.id,
      name: item.name,
      username: item.username,
      userType: item.user_type,
    })),
    [listQuery.data?.list],
  )

  const displayedAccounts = useMemo(
    () => accountRows.filter((item) => {
      if (!nameFilter.trim())
        return true

      return item.name.includes(nameFilter.trim())
    }),
    [accountRows, nameFilter],
  )

  const columns: ColumnsType<AccountRow> = [
    {
      title: '工号/学号',
      dataIndex: 'username',
      key: 'username',
      width: 120,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '身份',
      dataIndex: 'userType',
      key: 'userType',
      width: 180,
      render: value => toAccountRoleLabel(value as string),
    },
    {
      title: '状态',
      key: 'status',
      width: 210,
      render: (_, record) => {
        if (!record.disabledUntil)
          return <Tag color="success">正常</Tag>

        return (
          <Tag color="warning">
            禁用至
            {formatDateTime(record.disabledUntil)}
          </Tag>
        )
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 360,
      render: (_, record) => (
        <Flex wrap gap={8}>
          <Button
            size="small"
            disabled={Boolean(record.disabledUntil) || isWorking}
            onClick={() => {
              setDisableState({
                open: true,
                account: record,
                duration: null,
              })
            }}
          >
            禁用
          </Button>

          <Button
            size="small"
            disabled={!record.disabledUntil || isWorking}
            onClick={() => {
              setRestoreState({
                open: true,
                account: record,
              })
            }}
          >
            恢复
          </Button>

          <Button
            size="small"
            disabled={isWorking}
            onClick={async () => {
              await updateMutation.mutateAsync({
                id: record.id,
                reset_password: true,
              })
              message.success('密码已重置')
            }}
          >
            重置密码
          </Button>
        </Flex>
      ),
    },
  ]

  const reloadList = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.account.list({ username: queryUid }) })
    await queryClient.invalidateQueries({ queryKey: ['account', 'list'] })
  }

  const handleQuery = () => {
    const trimmed = searchKeyword.trim()

    if (!trimmed) {
      setQueryUid(undefined)
      setNameFilter('')
      return
    }

    if (ONLY_NUMBER_PATTERN.test(trimmed)) {
      setQueryUid(Number.parseInt(trimmed, 10))
      setNameFilter('')
      return
    }

    setQueryUid(undefined)
    setNameFilter(trimmed)
  }

  return (
    <Space direction="vertical" size={16} className="w-full">
      <Card>
        <Flex vertical gap={10}>
          <Typography.Title level={4} className="!mb-0">
            账号与权限管理
          </Typography.Title>
          <Typography.Text type="secondary">管理账号、禁用恢复、发送系统通知</Typography.Text>
          <Segmented
            value={activeTab}
            options={[
              { label: '管理与通知', value: 'manage' },
              { label: '新增账号', value: 'create' },
            ]}
            block
            onChange={value => setActiveTab(value as MainTab)}
          />
        </Flex>
      </Card>

      {activeTab === 'manage' && (
        <Space direction="vertical" size={16} className="w-full">
          <Card>
            <Flex wrap gap={10} align="center">
              <Input
                value={searchKeyword}
                placeholder="按学号/工号或姓名搜索"
                className="w-full min-w-56 md:w-96"
                onChange={event => setSearchKeyword(event.target.value)}
              />
              <Button type="primary" onClick={handleQuery}>查询</Button>
              <Button
                onClick={() => {
                  setQueryUid(undefined)
                  setNameFilter('')
                  setSearchKeyword('')
                }}
              >
                清空查询
              </Button>
            </Flex>
          </Card>

          <Card title="账号列表">
            <Table
              rowKey="id"
              loading={listQuery.isLoading}
              dataSource={displayedAccounts}
              columns={columns}
              scroll={{ x: 1200 }}
              pagination={{ pageSize: 8 }}
              locale={{ emptyText: '暂无账号数据' }}
            />
          </Card>
        </Space>
      )}

      {activeTab === 'create' && (
        <Card>
          <Form<CreateAccountValues>
            form={createForm}
            layout="vertical"
            requiredMark={false}
            initialValues={{
              userType: 'STUDENT',
            }}
            onValuesChange={(changedValues) => {
              if (changedValues.idCard && ONLY_NUMBER_PATTERN.test(changedValues.idCard)) {
                const autoPassword = changedValues.idCard.slice(-6)
                if (autoPassword.length === 6)
                  createForm.setFieldValue('password', autoPassword)
              }
            }}
            onFinish={async (values) => {
              const uid = Number.parseInt(values.userNo, 10)
              if (!Number.isInteger(uid)) {
                message.warning('学号/工号格式不正确')
                return
              }

              await createMutation.mutateAsync({
                id_card: values.idCard,
                name: values.name,
                password: values.password,
                username: uid,
                user_type: values.userType,
              })

              message.success('创建成功')
              createForm.resetFields()
              createForm.setFieldValue('userType', 'STUDENT')
              await reloadList()
            }}
          >
            <Form.Item
              label="姓名"
              name="name"
              rules={[
                { required: true, message: '请输入姓名' },
                { max: 10, message: '姓名最多 10 字' },
              ]}
            >
              <Input placeholder="请输入姓名" />
            </Form.Item>

            <Form.Item
              label="学号/工号"
              name="userNo"
              rules={[
                { required: true, message: '请输入学号/工号' },
                {
                  validator(_, value) {
                    if (!value || ONLY_NUMBER_PATTERN.test(value))
                      return Promise.resolve()
                    return Promise.reject(new Error('学号/工号仅支持数字'))
                  },
                },
              ]}
            >
              <Input placeholder="仅数字" />
            </Form.Item>

            <Form.Item
              label="身份证号"
              name="idCard"
              rules={[
                { required: true, message: '请输入身份证号' },
                { pattern: ID_CARD_PATTERN, message: '请输入合法身份证号' },
              ]}
            >
              <Input placeholder="18 位身份证号" />
            </Form.Item>

            <Form.Item
              label="身份"
              name="userType"
              rules={[{ required: true, message: '请选择身份' }]}
            >
              <Select
                options={[
                  { label: '学生', value: 'STUDENT' },
                  { label: '失物招领管理员', value: 'ADMIN' },
                  { label: '系统管理员', value: 'SYSTEM_ADMIN' },
                ]}
              />
            </Form.Item>

            <Form.Item
              label="密码"
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少 6 位' },
                { max: 18, message: '密码最多 18 位' },
              ]}
            >
              <Input placeholder="默认可用身份证后六位" />
            </Form.Item>

            <Button type="primary" htmlType="submit" loading={createMutation.isPending}>确认</Button>
          </Form>
        </Card>
      )}

      <Modal
        title={disableState.account ? `禁用账号：${disableState.account.name}` : '禁用账号'}
        open={disableState.open}
        okText="确认"
        cancelText="返回"
        okButtonProps={{ disabled: !disableState.duration, loading: disableMutation.isPending }}
        onCancel={() => {
          if (disableMutation.isPending)
            return

          setDisableState({ open: false, account: null, duration: null })
        }}
        onOk={async () => {
          if (!disableState.account || !disableState.duration)
            return

          await disableMutation.mutateAsync({
            duration: toDisableDurationParam(disableState.duration),
            id: disableState.account.id,
          })
          message.success('账号已禁用')
          setDisableState({ open: false, account: null, duration: null })
          await reloadList()
        }}
      >
        <Radio.Group
          options={DISABLE_DURATION_OPTIONS}
          value={disableState.duration}
          onChange={event => setDisableState(prev => ({ ...prev, duration: event.target.value as DisableDuration }))}
        />
      </Modal>

      <Modal
        title={restoreState.account ? `恢复账号：${restoreState.account.name}` : '恢复账号'}
        open={restoreState.open}
        okText="确认"
        cancelText="返回"
        okButtonProps={{ loading: enableMutation.isPending }}
        onCancel={() => {
          if (enableMutation.isPending)
            return

          setRestoreState({ open: false, account: null })
        }}
        onOk={async () => {
          if (!restoreState.account)
            return

          await enableMutation.mutateAsync({ id: restoreState.account.id })
          message.success('账号已恢复')
          setRestoreState({ open: false, account: null })
          await reloadList()
        }}
      >
        <Text>确认恢复该账号？</Text>
      </Modal>


    </Space>
  )
}

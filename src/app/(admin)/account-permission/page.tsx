'use client'

import type { ColumnsType } from 'antd/es/table'
import { useQueryClient } from '@tanstack/react-query'
import { App, Button, Card, Flex, Form, Input, Modal, Radio, Segmented, Select, Space, Table, Tag, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { resolveErrorMessage } from '@/api/core/errors'
import { normalizeDateTime, toAccountRoleLabel, toDisableDurationParam } from '@/api/shared/transforms'
import {
  useAccountListQuery,
  useCreateAccountMutation,
  useDisableAccountMutation,
  useEnableAccountMutation,
  useUpdateAccountMutation,
} from '@/query/account'
import { queryKeys } from '@/query/query-keys'
import { formatDateTime, getBeijingTimestamp } from '@/utils/admin-mock'

const { Text } = Typography

type MainTab = 'manage' | 'create'
type DisableDuration = '7d' | '1m' | '6m' | '1y'
type AccountUserType = 'STUDENT' | 'ADMIN' | 'SYSTEM_ADMIN'
type CampusCode = 'ZHAO_HUI' | 'PING_FENG' | 'MO_GAN_SHAN'

interface AccountRow {
  disabledUntil: string | null
  id: number
  name: string
  username: string | number
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
  campus?: CampusCode
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
const CAMPUS_OPTIONS: { label: string, value: CampusCode }[] = [
  { label: '朝晖', value: 'ZHAO_HUI' },
  { label: '屏峰', value: 'PING_FENG' },
  { label: '莫干山', value: 'MO_GAN_SHAN' },
]

function isAccountCurrentlyDisabled(disabledUntil: string | null): disabledUntil is string {
  if (!disabledUntil)
    return false

  const timestamp = getBeijingTimestamp(disabledUntil)
  if (!timestamp)
    return false

  return timestamp > Date.now()
}

export default function AccountPermissionPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<MainTab>('manage')

  const [searchKeyword, setSearchKeyword] = useState('')
  const [queryUid, setQueryUid] = useState<string | undefined>()
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
  const selectedUserType = Form.useWatch('userType', createForm)

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
      width: 200,
      render: (_, record) => {
        const disabledUntil = record.disabledUntil
        const isDisabled = isAccountCurrentlyDisabled(disabledUntil)

        if (!isDisabled)
          return <Tag color="success">正常</Tag>

        return (
          <Tag color="warning">
            禁用至
            {formatDateTime(disabledUntil)}
          </Tag>
        )
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 250,
      render: (_, record) => {
        const isDisabled = isAccountCurrentlyDisabled(record.disabledUntil)

        return (
          <Space size={6} wrap>
            <Button
              size="small"
              disabled={isDisabled || isWorking}
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
              disabled={!isDisabled || isWorking}
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
                try {
                  await updateMutation.mutateAsync({
                    id: record.id,
                    reset_password: true,
                  })
                  message.success('密码已重置')
                }
                catch (error) {
                  message.error(resolveErrorMessage(error, '密码重置失败，请稍后再试'))
                }
              }}
            >
              重置密码
            </Button>
          </Space>
        )
      },
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
      setQueryUid(trimmed)
      setNameFilter('')
      return
    }

    setQueryUid(undefined)
    setNameFilter(trimmed)
  }

  return (
    <Space direction="vertical" size={16} className="w-full">
      <Card>
        <Segmented
          value={activeTab}
          options={[
            { label: '管理与通知', value: 'manage' },
            { label: '新增账号', value: 'create' },
          ]}
          block
          onChange={value => setActiveTab(value as MainTab)}
        />
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
              tableLayout="fixed"
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

              if (changedValues.userType && changedValues.userType !== 'ADMIN')
                createForm.setFieldValue('campus', undefined)
            }}
            onFinish={async (values) => {
              const username = values.userNo.trim()
              if (!ONLY_NUMBER_PATTERN.test(username)) {
                message.warning('学号/工号格式不正确')
                return
              }

              try {
                await createMutation.mutateAsync({
                  id_card: values.idCard,
                  name: values.name,
                  password: values.password,
                  username,
                  user_type: values.userType,
                  ...(values.userType === 'ADMIN' && values.campus ? { campus: values.campus } : {}),
                })

                message.success('创建成功')
                createForm.resetFields()
                createForm.setFieldValue('userType', 'STUDENT')
                await reloadList()
              }
              catch (error) {
                message.error(resolveErrorMessage(error, '创建账号失败，请稍后再试'))
              }
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

            {selectedUserType === 'ADMIN' && (
              <Form.Item
                label="所属校区（仅失物招领管理员）"
                name="campus"
              >
                <Select
                  allowClear
                  placeholder="请选择所属校区（可选）"
                  options={CAMPUS_OPTIONS}
                />
              </Form.Item>
            )}

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

          try {
            await disableMutation.mutateAsync({
              duration: toDisableDurationParam(disableState.duration),
              id: disableState.account.id,
            })
            message.success('账号已禁用')
            setDisableState({ open: false, account: null, duration: null })
            await reloadList()
          }
          catch (error) {
            message.error(resolveErrorMessage(error, '禁用账号失败，请稍后再试'))
          }
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

          try {
            await enableMutation.mutateAsync({ id: restoreState.account.id })
            message.success('账号已恢复')
            setRestoreState({ open: false, account: null })
            await reloadList()
          }
          catch (error) {
            message.error(resolveErrorMessage(error, '恢复账号失败，请稍后再试'))
          }
        }}
      >
        <Text>确认恢复该账号？</Text>
      </Modal>
    </Space>
  )
}

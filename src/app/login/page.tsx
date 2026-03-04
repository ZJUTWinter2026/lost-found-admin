'use client'

import { App, Button, Card, Form, Input, Modal, Space, Typography } from 'antd'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { resolveErrorMessage } from '@/api/core/errors'
import { BrandLogo } from '@/components/brand-logo'
import { getDefaultRouteByRole } from '@/constants/admin-access'
import { useForgotPasswordMutation, useLoginMutation } from '@/query/auth'
import { useAuthStore } from '@/stores/use-auth-store'

const { Text } = Typography
const ID_CARD_PATTERN = /^\d{17}[\dX]$/i

interface LoginFormValues {
  employeeNo: string
  password: string
}

interface ForgotPasswordFormValues {
  employeeNo: string
  idCard: string
}

export default function LoginPage() {
  const router = useRouter()
  const { message } = App.useApp()
  const login = useAuthStore(state => state.login)
  const isLoggedIn = useAuthStore(state => state.isLoggedIn)
  const role = useAuthStore(state => state.role)
  const [forgotPasswordForm] = Form.useForm<ForgotPasswordFormValues>()
  const [isForgotOpen, setIsForgotOpen] = useState(false)
  const loginMutation = useLoginMutation()
  const forgotPasswordMutation = useForgotPasswordMutation()

  useEffect(() => {
    if (isLoggedIn && role) {
      router.replace(getDefaultRouteByRole(role))
    }
  }, [isLoggedIn, role, router])

  const openForgotModal = () => {
    setIsForgotOpen(true)
    forgotPasswordForm.resetFields()
  }

  const closeForgotModal = () => {
    setIsForgotOpen(false)
    forgotPasswordForm.resetFields()
  }

  const handleLogin = async (values: LoginFormValues) => {
    try {
      const result = await loginMutation.mutateAsync({
        employeeNo: values.employeeNo.trim(),
        password: values.password,
      })

      login({
        employeeNo: result.employeeNo,
        role: result.role,
        token: result.token,
        userId: result.userId,
      })
      message.success('登录成功')
      if (result.needUpdatePassword) {
        message.info('该账号需要先修改密码，建议尽快完成密码更新。')
      }
      router.push(getDefaultRouteByRole(result.role))
    }
    catch (error) {
      message.error(resolveErrorMessage(error, '登录失败，请稍后再试'))
    }
  }

  const handleForgotConfirm = async (values: ForgotPasswordFormValues) => {
    try {
      const result = await forgotPasswordMutation.mutateAsync({
        employeeNo: values.employeeNo.trim(),
        idCard: values.idCard.trim().toUpperCase(),
      })
      if (result.success) {
        message.success('密码已重置为身份证后六位，请使用新密码登录')
      }
      else {
        message.warning('密码重置未成功，请稍后再试')
      }
      setIsForgotOpen(false)
      forgotPasswordForm.resetFields()
    }
    catch (error) {
      message.error(resolveErrorMessage(error, '忘记密码处理失败，请稍后再试'))
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-10">
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-sky-300/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 -bottom-28 h-80 w-80 rounded-full bg-emerald-300/30 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgb(255_255_255_/_0.45)_0%,transparent_58%)]" />

      <Card
        className="relative w-full max-w-md"
        style={{
          borderRadius: 18,
          border: '1px solid rgb(255 255 255 / 0.65)',
          background: 'rgb(255 255 255 / 0.78)',
          boxShadow: '0 24px 60px -28px rgba(15, 23, 42, 0.38)',
          backdropFilter: 'blur(6px)',
        }}
        styles={{
          body: {
            padding: 32,
          },
        }}
      >
        <div className="mb-7 flex justify-center">
          <BrandLogo showEnglishName />
        </div>

        <Form
          layout="vertical"
          requiredMark={false}
          size="large"
          onFinish={handleLogin}
        >
          <Form.Item
            className="!mb-4"
            label="工号"
            name="employeeNo"
            rules={[{ required: true, message: '请输入工号' }]}
          >
            <Input placeholder="请输入工号" allowClear />
          </Form.Item>

          <Form.Item
            className="!mb-4"
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>

          <Form.Item className="!mb-3">
            <Button type="primary" htmlType="submit" block loading={loginMutation.isPending}>
              登录
            </Button>
          </Form.Item>
        </Form>

        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={openForgotModal}
            className="cursor-pointer bg-transparent text-sm text-slate-500 transition hover:text-slate-900"
          >
            忘记密码
          </button>
        </div>
      </Card>

      <Modal
        title="忘记密码"
        open={isForgotOpen}
        onCancel={closeForgotModal}
        onOk={() => forgotPasswordForm.submit()}
        okText="确认"
        cancelText="取消"
        confirmLoading={forgotPasswordMutation.isPending}
        destroyOnHidden
      >
        <Space direction="vertical" size={2} className="mb-4 w-full">
          <Text type="secondary">请输入工号/学号与身份证号进行验证</Text>
          <Text type="secondary">验证成功后，密码将重置为身份证后六位</Text>
        </Space>

        <Form
          form={forgotPasswordForm}
          layout="vertical"
          requiredMark={false}
          onFinish={handleForgotConfirm}
          autoComplete="off"
        >
          <Form.Item
            className="!mb-3"
            label="工号/学号"
            name="employeeNo"
            rules={[{ required: true, message: '请输入工号/学号' }]}
          >
            <Input placeholder="请输入工号/学号" />
          </Form.Item>

          <Form.Item
            className="!mb-3"
            label="身份证号"
            name="idCard"
            rules={[
              { required: true, message: '请输入身份证号' },
              { pattern: ID_CARD_PATTERN, message: '请输入合法身份证号' },
            ]}
          >
            <Input placeholder="请输入 18 位身份证号" maxLength={18} />
          </Form.Item>
        </Form>
      </Modal>
    </main>
  )
}

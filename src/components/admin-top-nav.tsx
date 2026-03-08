'use client'

import type { MenuProps } from 'antd'
import { LogoutOutlined } from '@ant-design/icons'
import { useQueryClient } from '@tanstack/react-query'
import { App, Button, Input, Menu, Modal, Space, Tag } from 'antd'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { resolveErrorMessage } from '@/api/core/errors'
import { toCampusParam } from '@/api/shared/transforms'
import { BrandLogo } from '@/components/brand-logo'
import { getAdminNavByRole } from '@/constants/admin-access'
import { usePublishAnnouncementMutation } from '@/query/announcement'
import { queryKeys } from '@/query/query-keys'
import { useAuthStore } from '@/stores/use-auth-store'

const { TextArea } = Input

export function AdminTopNav() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const pathname = usePathname()
  const router = useRouter()
  const role = useAuthStore(state => state.role)
  const campus = useAuthStore(state => state.campus)
  const logout = useAuthStore(state => state.logout)
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false)
  const [announcementTitle, setAnnouncementTitle] = useState('')
  const [announcementContent, setAnnouncementContent] = useState('')
  const publishAnnouncementMutation = usePublishAnnouncementMutation()

  if (!role)
    return null

  const navRoutes = getAdminNavByRole(role)
  const selectedKey = navRoutes.find(item => pathname.startsWith(item.key))?.key ?? navRoutes[0]?.key ?? ''

  const items: MenuProps['items'] = navRoutes.map(item => ({
    key: item.key,
    label: <Link href={item.key}>{item.label}</Link>,
  }))

  const isLostFoundAdmin = role === 'lost_found_admin'
  const campusCode = toCampusParam(campus ?? undefined)

  const resetAnnouncementForm = () => {
    setAnnouncementTitle('')
    setAnnouncementContent('')
  }

  const closeAnnouncementModal = () => {
    if (publishAnnouncementMutation.isPending)
      return

    setIsAnnouncementModalOpen(false)
    resetAnnouncementForm()
  }

  const handlePublishRegionalAnnouncement = async () => {
    const title = announcementTitle.trim()
    const content = announcementContent.trim()

    if (!campusCode || !campus) {
      message.warning('当前账号未配置管辖校区，无法发布区域公告')
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
      await publishAnnouncementMutation.mutateAsync({
        campus: campusCode,
        content,
        title,
        type: 'REGION',
      })

      message.success('区域公告已提交，等待审核')
      closeAnnouncementModal()
      await queryClient.invalidateQueries({ queryKey: queryKeys.announcement.reviewList() })
    }
    catch (error) {
      message.error(resolveErrorMessage(error, '发布区域公告失败，请稍后再试'))
    }
  }

  const handleLogout = () => {
    Modal.confirm({
      title: '确认退出登录？',
      content: '退出后将返回登录页',
      okText: '退出登录',
      cancelText: '取消',
      onOk: () => {
        logout()
        router.push('/login')
      },
    })
  }

  return (
    <>
      <header className="z-30 border-b border-sky-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 md:grid md:h-16 md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-3 md:px-6 md:py-0">
          <div className="justify-self-start">
            <BrandLogo compact />
          </div>

          <div className="order-3 overflow-x-auto md:order-none md:overflow-visible">
            <Menu
              mode="horizontal"
              selectedKeys={[selectedKey]}
              items={items}
              className="w-max min-w-full justify-start border-none bg-transparent md:min-w-[620px] md:justify-center"
            />
          </div>

          <div className="justify-self-end self-end md:self-auto">
            <Space size={8} wrap className="justify-end">
              {isLostFoundAdmin && (
                <Button onClick={() => setIsAnnouncementModalOpen(true)}>
                  发布区域公告
                </Button>
              )}

              <Button
                type="text"
                className="!font-medium"
                icon={<LogoutOutlined />}
                onClick={handleLogout}
              >
                退出登录
              </Button>
            </Space>
          </div>
        </div>
      </header>

      <Modal
        title="发布区域公告"
        open={isAnnouncementModalOpen}
        onCancel={closeAnnouncementModal}
        onOk={() => {
          void handlePublishRegionalAnnouncement()
        }}
        okText="发布"
        cancelText="取消"
        confirmLoading={publishAnnouncementMutation.isPending}
        okButtonProps={{
          disabled: !campusCode || !announcementTitle.trim() || !announcementContent.trim(),
        }}
        destroyOnHidden
      >
        <Space direction="vertical" size={10} className="w-full">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">管辖校区：</span>
            <Tag color="blue">{campus ?? '-'}</Tag>
          </div>

          <Input
            maxLength={100}
            value={announcementTitle}
            placeholder="请输入公告标题（限100字）"
            onChange={event => setAnnouncementTitle(event.target.value)}
          />

          <TextArea
            rows={6}
            maxLength={5000}
            value={announcementContent}
            placeholder="请输入公告内容（限5000字）"
            onChange={event => setAnnouncementContent(event.target.value)}
          />

          <div className="pb-1 text-right text-xs text-slate-400">
            {announcementContent.length}
            {' / 5000'}
          </div>
        </Space>
      </Modal>
    </>
  )
}

'use client'

import type { MenuProps } from 'antd'
import { LogoutOutlined } from '@ant-design/icons'
import { Button, Menu, Modal, Typography } from 'antd'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const NAV_ROUTES = [
  { key: '/review-publish', label: '审核发布信息' },
  { key: '/item-status', label: '管理物品状态' },
  { key: '/info-maintenance', label: '信息维护与查询' },
] as const

export function AdminTopNav() {
  const pathname = usePathname()
  const router = useRouter()

  const selectedKey = NAV_ROUTES.find(item => pathname.startsWith(item.key))?.key ?? '/review-publish'
  const items: MenuProps['items'] = NAV_ROUTES.map(item => ({
    key: item.key,
    label: (
      <Link href={item.key}>
        {item.label}
      </Link>
    ),
  }))

  const handleLogout = () => {
    Modal.confirm({
      title: '确认退出登录？',
      content: '退出后将返回登录页',
      okText: '退出登录',
      cancelText: '取消',
      onOk: () => router.push('/login'),
    })
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/88 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-3 md:grid md:h-16 md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-3 md:px-6 md:py-0">
        <Link href="/review-publish" className="justify-self-start">
          <Typography.Title level={4} className="!mb-0 !text-slate-900">
            失物招领管理平台
          </Typography.Title>
        </Link>

        <div className="order-3 overflow-x-auto md:order-none md:overflow-visible">
          <Menu
            mode="horizontal"
            selectedKeys={[selectedKey]}
            items={items}
            className="w-max min-w-full justify-start border-none bg-transparent md:min-w-[520px] md:justify-center"
          />
        </div>

        <div className="justify-self-end self-end md:self-auto">
          <Button
            type="text"
            className="!font-medium"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
          >
            退出登录
          </Button>
        </div>
      </div>
    </header>
  )
}

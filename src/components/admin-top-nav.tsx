'use client'

import type { MenuProps } from 'antd'
import { LogoutOutlined } from '@ant-design/icons'
import { Button, Menu, Modal } from 'antd'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BrandLogo } from '@/components/brand-logo'
import { getAdminNavByRole } from '@/constants/admin-access'
import { useAuthStore } from '@/stores/use-auth-store'

export function AdminTopNav() {
  const pathname = usePathname()
  const router = useRouter()
  const role = useAuthStore(state => state.role)
  const logout = useAuthStore(state => state.logout)

  if (!role)
    return null

  const navRoutes = getAdminNavByRole(role)
  const selectedKey = navRoutes.find(item => pathname.startsWith(item.key))?.key ?? navRoutes[0]?.key ?? ''

  const items: MenuProps['items'] = navRoutes.map(item => ({
    key: item.key,
    label: <Link href={item.key}>{item.label}</Link>,
  }))

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

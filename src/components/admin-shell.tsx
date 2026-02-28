'use client'

import type { ReactNode } from 'react'
import { Spin } from 'antd'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo } from 'react'
import { getDefaultRouteByRole, hasAdminRouteAccess } from '@/constants/admin-access'
import { useAuthStore } from '@/stores/use-auth-store'
import { AdminTopNav } from './admin-top-nav'

interface AdminShellProps {
  children: ReactNode
}

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isLoggedIn = useAuthStore(state => state.isLoggedIn)
  const role = useAuthStore(state => state.role)

  const canViewCurrentRoute = useMemo(() => {
    if (!role)
      return false
    return hasAdminRouteAccess(role, pathname)
  }, [pathname, role])

  useEffect(() => {
    if (!isLoggedIn || !role) {
      router.replace('/login')
      return
    }

    if (!canViewCurrentRoute) {
      router.replace(getDefaultRouteByRole(role))
    }
  }, [canViewCurrentRoute, isLoggedIn, role, router])

  if (!isLoggedIn || !role || !canViewCurrentRoute) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div
      className="flex min-h-screen flex-col overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #f8fbff 0%, #f0f7ff 100%)',
        height: '100dvh',
      }}
    >
      <AdminTopNav />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-7xl px-4 py-4 md:px-6 md:py-6">
          {children}
        </div>
      </main>
    </div>
  )
}

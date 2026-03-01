import type { Metadata } from 'next'
import {
  BRAND_DESCRIPTION,
  BRAND_FAVICON_PATH,
  BRAND_LOGO_PATH,
  BRAND_NAME,
} from '@/constants/brand'
import { AppProvider } from '@/providers/app-provider'
import 'antd/dist/reset.css'
import './globals.css'

export const metadata: Metadata = {
  title: BRAND_NAME,
  description: BRAND_DESCRIPTION,
  icons: {
    icon: [
      { url: BRAND_FAVICON_PATH },
      { type: 'image/svg+xml', url: BRAND_LOGO_PATH },
    ],
    shortcut: BRAND_FAVICON_PATH,
    apple: BRAND_FAVICON_PATH,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  )
}

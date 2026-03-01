import { Avatar, Flex, Typography } from 'antd'
import { BRAND_ENGLISH_NAME, BRAND_LOGO_PATH, BRAND_NAME } from '@/constants/brand'

interface BrandLogoProps {
  compact?: boolean
  showEnglishName?: boolean
}

export function BrandLogo({ compact = false, showEnglishName = false }: BrandLogoProps) {
  const iconSize = compact ? 34 : 44
  const titleLevel = compact ? 5 : 3

  return (
    <Flex align="center" gap={compact ? 10 : 12}>
      <Avatar
        shape="square"
        size={iconSize}
        src={BRAND_LOGO_PATH}
        style={{ borderRadius: 10 }}
      />
      <Flex vertical gap={0}>
        {showEnglishName
          ? (
              <Typography.Text className="text-xs tracking-[0.24em] text-slate-500">
                {BRAND_ENGLISH_NAME}
              </Typography.Text>
            )
          : null}
        <Typography.Title level={titleLevel} className="!m-0 !text-slate-900">
          {BRAND_NAME}
        </Typography.Title>
      </Flex>
    </Flex>
  )
}

import type { AxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/use-auth-store'
import { RequestError } from './errors'
import { httpClient } from './http-client'
import { isApiEnvelope } from './types'

const SUCCESS_CODES = new Set([0, 200])
const UNAUTHORIZED_CODE = 20000
const DISABLED_ACCOUNT_CODE = 30017
const REDIRECT_LOGIN_CODES = new Set([UNAUTHORIZED_CODE, DISABLED_ACCOUNT_CODE])

export async function request<T>(config: AxiosRequestConfig) {
  const response = await httpClient.request<T>(config)
  const payload = response.data

  if (isApiEnvelope<T>(payload)) {
    if (!SUCCESS_CODES.has(payload.code)) {
      if (REDIRECT_LOGIN_CODES.has(payload.code)) {
        const { isLoggedIn, logout } = useAuthStore.getState()
        if (isLoggedIn)
          logout()

        if (typeof window !== 'undefined' && window.location.pathname !== '/login')
          window.location.replace('/login')
      }

      throw new RequestError(payload.message || '请求失败', { code: payload.code, status: response.status })
    }

    return payload.data
  }

  return payload
}

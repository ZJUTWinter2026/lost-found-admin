import type {
  AccountListRequest,
  AccountListResponse,
  CreateAccountRequest,
  CreateAccountResponse,
  DisableAccountRequest,
  EnableAccountRequest,
  UpdateAccountRequest,
} from './types'
import { request } from '@/api/core/request'

export function getAccountList(params: AccountListRequest = {}) {
  return request<AccountListResponse>({
    method: 'GET',
    params,
    url: '/account/list',
  })
}

export function createAccount(payload: CreateAccountRequest) {
  return request<CreateAccountResponse>({
    data: payload,
    method: 'POST',
    url: '/account/create',
  })
}

export function disableAccount(payload: DisableAccountRequest) {
  return request<Record<string, never>>({
    data: payload,
    method: 'POST',
    url: '/account/disable',
  })
}

export function enableAccount(payload: EnableAccountRequest) {
  return request<Record<string, never>>({
    data: payload,
    method: 'POST',
    url: '/account/enable',
  })
}

export function updateAccount(payload: UpdateAccountRequest) {
  return request<Record<string, never>>({
    data: payload,
    method: 'POST',
    url: '/account/update',
  })
}



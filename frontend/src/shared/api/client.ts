import axios, { type AxiosInstance } from 'axios'
import { storageGet, storageRemove } from '@shared/lib/storage'

export const API_BASE_URL: string =
  (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL || 'http://localhost:8080'

export const TOKEN_KEY = 'judge_token'

export const http: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
})

http.interceptors.request.use(config => {
  const token = storageGet<string>(TOKEN_KEY)
  if (token) {
    config.headers = config.headers ?? {}
    ;(config.headers as Record<string, string>).Authorization = `Bearer ${token}`
  }
  return config
})

let onUnauthorized: (() => void) | null = null
export function setUnauthorizedHandler(h: () => void) {
  onUnauthorized = h
}

http.interceptors.response.use(
  r => r,
  err => {
    if (err?.response?.status === 401) {
      storageRemove(TOKEN_KEY)
      onUnauthorized?.()
    }
    return Promise.reject(err)
  }
)

export function apiErrorMessage(err: unknown, fallback = 'Сетевая ошибка'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string } | undefined
    if (data?.error) return data.error
    if (err.message) return err.message
  }
  return fallback
}

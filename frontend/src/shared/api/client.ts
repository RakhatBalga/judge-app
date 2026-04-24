import axios, { type AxiosInstance } from 'axios'
import { storageGet, storageRemove } from '@shared/lib/storage'

function resolveApiBaseUrl(): string {
  const fromEnv = (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL
  if (fromEnv) return fromEnv

  // Автоматически: тот же хост, что и у страницы, но на порту бэка (8080).
  // Это позволяет открывать приложение с телефона по LAN-IP без .env файла.
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const { protocol, hostname } = window.location
    return `${protocol}//${hostname}:8080`
  }

  return 'http://localhost:8080'
}

export const API_BASE_URL: string = resolveApiBaseUrl()

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

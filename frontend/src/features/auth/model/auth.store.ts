import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { storageGet, storageSet, storageRemove } from '@shared/lib/storage'
import {
  loginRequest,
  meRequest,
  apiErrorMessage,
  TOKEN_KEY,
  type AuthUser,
} from '@shared/api'

const USER_KEY = 'judge_user'

function decodeTokenExp(token: string): number | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    const payload = JSON.parse(json) as { exp?: number }
    return typeof payload.exp === 'number' ? payload.exp : null
  } catch {
    return null
  }
}

function isTokenExpired(token: string): boolean {
  const exp = decodeTokenExp(token)
  if (!exp) return false
  return Date.now() / 1000 > exp
}

function loadToken(): string | null {
  const t = storageGet<string>(TOKEN_KEY)
  if (!t || isTokenExpired(t)) {
    storageRemove(TOKEN_KEY)
    storageRemove(USER_KEY)
    return null
  }
  return t
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(loadToken())
  const user = ref<AuthUser | null>(token.value ? storageGet<AuthUser>(USER_KEY) : null)
  const loading = ref(false)

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isJudge = computed(() => user.value?.role === 'judge')

  async function login(username: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
    loading.value = true
    try {
      const res = await loginRequest(username, password)
      token.value = res.token
      user.value = res.user
      storageSet(TOKEN_KEY, res.token)
      storageSet(USER_KEY, res.user)
      await resetSessionScopedStores()
      return { ok: true }
    } catch (err) {
      return { ok: false, error: apiErrorMessage(err, 'Не удалось войти') }
    } finally {
      loading.value = false
    }
  }

  async function refreshMe(): Promise<void> {
    if (!token.value) return
    try {
      const u = await meRequest()
      user.value = u
      storageSet(USER_KEY, u)
    } catch {
      // handled by 401 interceptor
    }
  }

  function logout(): void {
    token.value = null
    user.value = null
    storageRemove(TOKEN_KEY)
    storageRemove(USER_KEY)
    void resetSessionScopedStores()
  }

  // Lazy import to avoid a circular dependency between auth and teams stores at module load time.
  async function resetSessionScopedStores(): Promise<void> {
    try {
      const { useTeamsStore } = await import('@entities/team')
      useTeamsStore().reset()
    } catch {
      // no-op: reset is a best-effort cache invalidation
    }
  }

  return { token, user, loading, isAuthenticated, isAdmin, isJudge, login, logout, refreshMe }
})

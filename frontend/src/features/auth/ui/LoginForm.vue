<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../model/auth.store'
import { AppButton, AppInput } from '@shared/ui'
import { useI18n } from '@shared/i18n/useI18n'

const emit = defineEmits<{ success: [] }>()

const auth = useAuthStore()
const { t } = useI18n()
const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const showPassword = ref(false)

async function submit() {
  error.value = ''
  username.value = username.value.trim()
  password.value = password.value.trim()
  if (!username.value || !password.value) {
    error.value = t('auth.enterCredentials')
    return
  }
  loading.value = true
  const res = await auth.login(username.value, password.value)
  loading.value = false
  if (res.ok) {
    emit('success')
  } else {
    error.value = res.error || t('auth.invalidCredentials')
    password.value = ''
  }
}
</script>

<template>
  <form @submit.prevent="submit" class="space-y-4">
    <div>
      <label class="block text-sm font-medium text-slate-700 mb-1.5">{{ t('auth.username') }}</label>
      <AppInput
        v-model="username"
        placeholder="judge1"
        autocomplete="username"
        autocapitalize="none"
      >
        <template #icon>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </template>
      </AppInput>
    </div>

    <div>
      <label class="block text-sm font-medium text-slate-700 mb-1.5">{{ t('auth.password') }}</label>
      <AppInput
        v-model="password"
        :type="showPassword ? 'text' : 'password'"
        placeholder="••••••••"
        autocomplete="current-password"
      >
        <template #icon>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </template>
        <template #suffix>
          <button type="button" @click="showPassword = !showPassword" class="text-slate-400 hover:text-slate-600 transition">
            <svg v-if="!showPassword" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          </button>
        </template>
      </AppInput>
    </div>

    <Transition name="fade">
      <div v-if="error" class="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
        <svg class="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <span class="text-sm">{{ error }}</span>
      </div>
    </Transition>

    <AppButton type="submit" :loading="loading" :full-width="true">
      {{ loading ? t('auth.loggingIn') : t('auth.loginButton') }}
    </AppButton>

    <p class="text-center text-xs text-slate-400">
      {{ t('auth.credentialsHint') }}
    </p>
  </form>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.fade-enter-from { opacity: 0; transform: translateY(-4px); }
.fade-leave-to { opacity: 0; }
</style>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { LoginForm, useAuthStore } from '@features/auth'
import { useI18n } from '@shared/i18n/useI18n'

const router = useRouter()
const auth = useAuthStore()
const { t } = useI18n()

function onSuccess() {
  if (auth.isAdmin) router.push({ name: 'admin-protocol' })
  else router.push({ name: 'teams' })
}
</script>

<template>
  <div class="min-h-screen bg-linear-to-br from-slate-800 via-slate-900 to-slate-950 flex flex-col items-center justify-center px-4">
    <div class="w-full max-w-sm">
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-4 border border-white/10">
          <svg class="w-8 h-8 text-[#28ca9e]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-white tracking-tight">{{ t('app.title') }}</h1>
        <p class="text-slate-400 text-sm mt-1">{{ t('app.description') }}</p>
      </div>

      <div class="bg-white rounded-2xl shadow-2xl p-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-5">{{ t('auth.loginTitle') }}</h2>
        <LoginForm @success="onSuccess" />
      </div>
    </div>
  </div>
</template>

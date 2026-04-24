<script setup lang="ts">
import { useRouter } from 'vue-router'
import { LoginForm, useAuthStore } from '@features/auth'
import { useI18n } from '@shared/i18n/useI18n'
import logoImg from '@shared/assets/logo.png'

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
        <div class="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl mb-4 shadow-lg shadow-black/20 p-3">
          <img :src="logoImg" :alt="t('app.title')" class="w-full h-full object-contain" />
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

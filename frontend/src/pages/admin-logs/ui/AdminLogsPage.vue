<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { fetchLogs, apiErrorMessage, type AuditLog } from '@shared/api'
import { ProfileMenu } from '@shared/ui'
import { useI18n } from '@shared/i18n/useI18n'
import logoImg from '@shared/assets/logo.png'

const { t } = useI18n()

const logs = ref<AuditLog[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const filterJudge = ref<string>('')
const filterTeam = ref<string>('')

async function load() {
  loading.value = true
  error.value = null
  try {
    logs.value = await fetchLogs(1000)
  } catch (e) {
    error.value = apiErrorMessage(e, 'Не удалось загрузить логи')
  } finally {
    loading.value = false
  }
}

const judgeOptions = computed(() => {
  const map = new Map<number, string>()
  logs.value.forEach(l => map.set(l.userId, l.fullName))
  return [...map.entries()].map(([id, name]) => ({ id: String(id), name }))
})

const filtered = computed(() => {
  return logs.value.filter(l => {
    if (filterJudge.value && String(l.userId) !== filterJudge.value) return false
    if (filterTeam.value && !l.teamName.toLowerCase().includes(filterTeam.value.toLowerCase())) return false
    return true
  })
})

const criterionLabel: Record<string, string> = {
  c1: 'Оригинальность',
  c2: 'Реализация',
  c3: 'Презентация',
  c4: 'Командная работа',
  c5: 'Практическая ценность',
}

function fmtTime(s: string): string {
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  return d.toLocaleString()
}

function fmtHHmm(s: string): string {
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

onMounted(load)
</script>

<template>
  <div class="min-h-screen bg-[#F8FAFB]">
    <header class="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
      <div class="max-w-5xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <img :src="logoImg" alt="Logo" class="w-8 h-8 rounded-lg object-contain" />
          <div>
            <h1 class="text-lg font-bold text-slate-800 tracking-tight">{{ t('logs.title') }}</h1>
            <p class="text-xs text-slate-400">{{ t('logs.subtitle') }}</p>
          </div>
        </div>
        <ProfileMenu />
      </div>
    </header>

    <main class="max-w-5xl mx-auto p-6">
      <div class="bg-white rounded-2xl shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div class="flex flex-col">
          <label class="text-xs font-medium text-slate-500 mb-1">{{ t('logs.filterJudge') }}</label>
          <select v-model="filterJudge" class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <option value="">{{ t('logs.allJudges') }}</option>
            <option v-for="j in judgeOptions" :key="j.id" :value="j.id">{{ j.name }}</option>
          </select>
        </div>
        <div class="flex flex-col flex-1 min-w-[180px]">
          <label class="text-xs font-medium text-slate-500 mb-1">{{ t('logs.filterTeam') }}</label>
          <input
            v-model="filterTeam"
            type="text"
            :placeholder="t('logs.filterTeamPlaceholder')"
            class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          />
        </div>
        <button
          @click="load"
          class="ml-auto rounded-lg bg-slate-100 hover:bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition"
        >
          {{ t('logs.refresh') }}
        </button>
      </div>

      <div v-if="loading" class="text-center py-20 text-slate-400 text-sm">{{ t('common.loading') }}</div>
      <div v-else-if="error" class="text-center py-20 text-red-500 text-sm">{{ error }}</div>

      <div v-else class="bg-white rounded-2xl shadow-sm divide-y divide-slate-100">
        <div v-if="filtered.length === 0" class="py-12 text-center text-slate-400 text-sm">
          {{ t('logs.noLogs') }}
        </div>

        <div
          v-for="log in filtered"
          :key="log.id"
          class="px-5 py-3 flex items-start gap-3 hover:bg-slate-50/50 transition"
        >
          <div class="text-xs text-slate-400 font-mono min-w-[70px] pt-0.5">
            {{ fmtHHmm(log.timestamp) }}
            <div class="text-[10px] text-slate-300">{{ fmtTime(log.timestamp).split(',')[0] }}</div>
          </div>

          <div class="w-2 h-2 rounded-full mt-2 shrink-0" :class="log.oldValue === null ? 'bg-emerald-400' : 'bg-sky-400'" />

          <div class="flex-1 text-sm leading-relaxed">
            <span class="text-slate-500">
              <span class="font-semibold text-slate-800">{{ log.fullName }}</span>
              {{ log.oldValue === null ? t('logs.actionSet') : t('logs.actionChanged') }}
              <span class="font-semibold text-slate-700">{{ criterionLabel[log.field] || log.field }}</span>
              {{ t('logs.forProject') }}
              <span class="font-semibold text-slate-800">{{ log.teamName }}</span>
            </span>
            <span class="ml-1 inline-flex items-center gap-1 text-xs font-mono">
              <span v-if="log.oldValue !== null" class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 line-through">
                {{ log.oldValue }}
              </span>
              <span v-if="log.oldValue !== null" class="text-slate-300">→</span>
              <span class="px-1.5 py-0.5 rounded bg-[#28ca9e]/10 text-[#1a8c6d] font-semibold">
                {{ log.newValue }}
              </span>
            </span>
          </div>

          <div class="text-[10px] text-slate-300 font-mono">#{{ log.id }}</div>
        </div>
      </div>
    </main>
  </div>
</template>

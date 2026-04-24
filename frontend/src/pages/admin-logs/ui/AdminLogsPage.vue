<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { fetchLogs, apiErrorMessage, type AuditLog, type ProtocolJudge } from '@shared/api'
import { exportAuditLogsToXlsx } from '@features/export-protocol'
import { ProfileMenu, TeamBilingualName } from '@shared/ui'
import { useI18n } from '@shared/i18n/useI18n'
import logoImg from '@shared/assets/logo.png'

const { t } = useI18n()

const logs = ref<AuditLog[]>([])
const judgesList = ref<ProtocolJudge[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const filterJudge = ref<string>('')
const filterTeam = ref<string>('')
const exporting = ref(false)

async function load() {
  loading.value = true
  error.value = null
  try {
    const params: { limit: number; userId?: number } = { limit: 5000 }
    if (filterJudge.value) {
      const id = Number(filterJudge.value)
      if (Number.isFinite(id) && id > 0) params.userId = id
    }
    const { logs: rows, judges } = await fetchLogs(params)
    logs.value = rows
    judgesList.value = judges
  } catch (e) {
    error.value = apiErrorMessage(e, 'Не удалось загрузить логи')
  } finally {
    loading.value = false
  }
}

const judgeOptions = computed(() => {
  return judgesList.value.map(j => ({ id: String(j.id), name: j.fullName }))
})

const filtered = computed(() => {
  if (!filterTeam.value.trim()) return logs.value
  const q = filterTeam.value.toLowerCase()
  return logs.value.filter(l => l.teamName.toLowerCase().includes(q))
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

async function doExport() {
  exporting.value = true
  try {
    await exportAuditLogsToXlsx(filtered.value, criterionLabel, {
      id: t('logs.colId'),
      timestamp: t('logs.colTimestamp'),
      judge: t('logs.colJudge'),
      username: t('logs.colUsername'),
      project: t('logs.colProject'),
      criterion: t('logs.colCriterion'),
      oldValue: t('logs.colOld'),
      newValue: t('logs.colNew'),
    })
  } finally {
    exporting.value = false
  }
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
          <select
            v-model="filterJudge"
            class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm min-w-[200px]"
            @change="load"
          >
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
        <div class="flex gap-2 ml-auto flex-wrap">
          <button
            type="button"
            @click="doExport"
            :disabled="exporting || filtered.length === 0"
            class="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 px-4 py-2 text-sm font-medium text-slate-700 transition"
          >
            {{ exporting ? t('logs.exporting') : t('logs.exportExcel') }}
          </button>
          <button
            type="button"
            @click="load"
            class="rounded-lg bg-slate-100 hover:bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition"
          >
            {{ t('logs.refresh') }}
          </button>
        </div>
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
          <div class="text-xs text-slate-400 font-mono min-w-[70px] pt-0.5 shrink-0">
            {{ fmtHHmm(log.timestamp) }}
            <div class="text-[10px] text-slate-300">{{ fmtTime(log.timestamp).split(',')[0] }}</div>
          </div>

          <div class="w-2 h-2 rounded-full mt-2 shrink-0" :class="log.oldValue === null ? 'bg-emerald-400' : 'bg-sky-400'" />

          <div class="flex-1 min-w-0 text-sm leading-relaxed">
            <span class="text-slate-500 wrap-anywhere">
              <span class="font-semibold text-slate-800">{{ log.fullName }}</span>
              {{ log.oldValue === null ? t('logs.actionSet') : t('logs.actionChanged') }}
              <span class="font-semibold text-slate-700">{{ criterionLabel[log.field] || log.field }}</span>
              {{ t('logs.forProject') }}
              <span class="inline-block min-w-0 max-w-full text-slate-800" :title="log.teamName">
                <TeamBilingualName :name="log.teamName" variant="inline" />
              </span>
            </span>
            <span class="ml-1 inline-flex items-center gap-1 text-xs font-mono flex-wrap">
              <span v-if="log.oldValue !== null" class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 line-through">
                {{ log.oldValue }}
              </span>
              <span v-if="log.oldValue !== null" class="text-slate-300">→</span>
              <span class="px-1.5 py-0.5 rounded bg-[#28ca9e]/10 text-[#1a8c6d] font-semibold">
                {{ log.newValue }}
              </span>
            </span>
          </div>

          <div class="text-[10px] text-slate-300 font-mono shrink-0">#{{ log.id }}</div>
        </div>
      </div>
    </main>
  </div>
</template>

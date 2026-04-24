<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { fetchLogs, apiErrorMessage, type AuditLog, type ProtocolJudge } from '@shared/api'
import { exportAuditLogsToXlsx } from '@features/export-protocol'
import { ProfileMenu } from '@shared/ui'
import { useI18n } from '@shared/i18n/useI18n'
import { getTeamBilingualLines } from '@shared/utils/team-bilingual-name'
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

/** Одна строка в ленте: каз / рус через «·», как в настройке двуязычия. */
function teamNameOneLine(raw: string): string {
  const { kk, ru } = getTeamBilingualLines(raw)
  if (!ru || ru === kk) return kk
  return `${kk} · ${ru}`
}

function logLineTooltip(log: AuditLog): string {
  const c = criterionLabel[log.field] || log.field
  const act = log.oldValue === null ? t('logs.actionSet') : t('logs.actionChanged')
  return `${log.fullName} — ${act} ${c} — ${log.teamName.replace(/\n+/g, ' ').trim()}`
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
    <header class="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 sticky top-0 z-10">
      <div class="max-w-6xl mx-auto flex items-center justify-between">
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

    <main class="max-w-6xl mx-auto p-4 sm:p-6">
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
          class="log-row px-3 sm:px-4 py-1.5 sm:py-2 flex w-full min-w-0 items-center gap-2 sm:gap-3 hover:bg-slate-50/50 transition"
        >
          <div
            class="text-[10px] text-slate-400 font-mono w-[2.9rem] sm:w-12 shrink-0 text-right leading-none tabular-nums"
          >
            {{ fmtHHmm(log.timestamp) }}
            <div class="text-[8px] text-slate-300/90 font-normal mt-0.5">
              {{ fmtTime(log.timestamp).split(',')[0] }}
            </div>
          </div>

          <div
            class="w-1.5 h-1.5 rounded-full shrink-0"
            :class="log.oldValue === null ? 'bg-emerald-400' : 'bg-sky-400'"
            aria-hidden="true"
          />

          <!-- Одна линия: судья — действие — критерий · команда (длинное с ellipsis, полный текст в title) -->
          <p
            class="m-0 min-w-0 flex-1 text-[11px] leading-snug text-slate-800 overflow-hidden text-ellipsis whitespace-nowrap"
            :title="logLineTooltip(log)"
          >
            <span class="font-semibold text-slate-900">{{ log.fullName }}</span>
            <span class="text-slate-300 mx-1" aria-hidden="true">·</span>
            <span class="text-slate-500">
              {{ log.oldValue === null ? t('logs.actionSet') : t('logs.actionChanged') }}
            </span>
            <span class="font-semibold text-slate-800">
              {{ criterionLabel[log.field] || log.field }}
            </span>
            <span class="text-slate-300 mx-1" aria-hidden="true">·</span>
            <span class="font-medium text-slate-800">{{ teamNameOneLine(log.teamName) }}</span>
          </p>

          <div
            class="shrink-0 self-center text-right font-mono text-[10px] w-14 sm:w-16"
          >
            <div class="inline-flex items-center justify-end gap-0.5 flex-nowrap">
              <span
                v-if="log.oldValue !== null"
                class="px-1 py-px rounded bg-slate-100 text-slate-600 line-through"
              >
                {{ log.oldValue }}
              </span>
              <span v-if="log.oldValue !== null" class="text-slate-300">→</span>
              <span class="px-1 py-px rounded bg-[#28ca9e]/10 text-[#1a8c6d] font-semibold">
                {{ log.newValue }}
              </span>
            </div>
            <div class="text-[8px] text-slate-300 mt-0.5">#{{ log.id }}</div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

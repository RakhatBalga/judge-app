<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  fetchProtocol, fetchJudgeScores, apiErrorMessage,
  type ProtocolResponse, type JudgeScoresEntry,
} from '@shared/api'
import { exportProtocolToXlsx } from '@features/export-protocol'
import { ProfileMenu, AppButton } from '@shared/ui'
import { useI18n } from '@shared/i18n/useI18n'
import { CRITERIA_KEYS } from '@shared/config/scoring'
import logoImg from '@shared/assets/logo.png'

const { t } = useI18n()

const criteriaList = computed(() =>
  CRITERIA_KEYS.map((key) => ({
    key,
    label: t(`scoring.criteria.${key}.desc`),
  })),
)

const protocolData = ref<ProtocolResponse | null>(null)
const judgeScoresData = ref<JudgeScoresEntry[] | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const exporting = ref(false)

const selectedJudgeId = ref<number | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    const [proto, judges] = await Promise.all([fetchProtocol(), fetchJudgeScores()])
    protocolData.value = proto
    judgeScoresData.value = judges
  } catch (e) {
    error.value = apiErrorMessage(e, 'Не удалось загрузить протокол')
  } finally {
    loading.value = false
  }
}

async function doExport() {
  if (!protocolData.value || !judgeScoresData.value) return
  exporting.value = true
  try {
    await exportProtocolToXlsx(protocolData.value, judgeScoresData.value, {
      title: t('protocol.exportTitle'),
      subtitle: `${t('protocol.exportDate')}: ${new Date().toLocaleString()} · ${t('protocol.exportJudgesInDb')}: ${protocolData.value.totalJudges}`,
      criteriaLabels: criteriaList.value.map(c => c.label) as [string, string, string, string, string],
      awardLabels: {
        header: t('protocol.award'),
        grandPrix: t('protocol.awards.grandPrix'),
        first: t('protocol.awards.first'),
        second: t('protocol.awards.second'),
        third: t('protocol.awards.third'),
      },
    })
  } finally {
    exporting.value = false
  }
}

function fmtInt(v: number): string {
  return String(v)
}

function fmtPlace(v: number | null): string {
  if (v === null) return '—'
  // Integer places rendered as integers, halves as "X,5"
  if (Number.isInteger(v)) return String(v)
  return v.toFixed(1).replace('.', ',')
}

function shortName(fullName: string): string {
  // "Иванов Иван Иванович" -> "Иванов И. И."
  const parts = fullName.replace(/^Судья\s+/i, '').trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  const [surname, ...rest] = parts
  const initials = rest.map(p => `${p.charAt(0).toUpperCase()}.`).join(' ')
  return `${surname} ${initials}`.trim()
}

const isJudgeView = computed(() => selectedJudgeId.value !== null)

const selectedJudgeEntry = computed(() => {
  if (!selectedJudgeId.value || !judgeScoresData.value) return null
  return judgeScoresData.value.find(e => e.judge.id === selectedJudgeId.value) ?? null
})

type AwardKey = 'grandPrix' | 'first' | 'second' | 'third'

interface SummaryRow {
  teamId: number
  teamName: string
  status: 'active' | 'absent'
  byJudge: Record<number, number>
  grandTotal: number
  scoredByCount: number
  place: number | null
  award: AwardKey | null
}

function awardForPlace(place: number | null): AwardKey | null {
  if (place === null || !Number.isInteger(place)) return null
  switch (place) {
    case 1: return 'grandPrix'
    case 2: return 'first'
    case 3: return 'second'
    case 4: return 'third'
    default: return null
  }
}

const AWARD_BADGE_CLASS: Record<AwardKey, string> = {
  grandPrix: 'bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-sm',
  first: 'bg-amber-100 text-amber-800 border border-amber-300',
  second: 'bg-slate-200 text-slate-700 border border-slate-300',
  third: 'bg-orange-100 text-orange-800 border border-orange-300',
}

const summaryRows = computed<SummaryRow[]>(() => {
  if (!protocolData.value || !judgeScoresData.value) return []
  const rows: SummaryRow[] = protocolData.value.rows.map(r => ({
    teamId: r.teamId,
    teamName: r.teamName,
    status: r.status,
    byJudge: {},
    grandTotal: 0,
    scoredByCount: 0,
    place: null,
    award: null,
  }))
  const byId = new Map(rows.map(r => [r.teamId, r]))
  for (const entry of judgeScoresData.value) {
    for (const s of entry.scores) {
      const row = byId.get(s.teamId)
      if (!row) continue
      row.byJudge[entry.judge.id] = s.total
      row.grandTotal += s.total
      if (s.total > 0) row.scoredByCount += 1
    }
  }

  // Compute places among teams with grandTotal > 0 and status === 'active'.
  // Ties get averaged rank (competition-style halves, e.g. 13 & 14 -> 13,5).
  const rankable = rows.filter(r => r.status !== 'absent' && r.grandTotal > 0)
  rankable.sort((a, b) => b.grandTotal - a.grandTotal)
  let i = 0
  while (i < rankable.length) {
    let j = i
    while (j + 1 < rankable.length && rankable[j + 1].grandTotal === rankable[i].grandTotal) {
      j += 1
    }
    // Positions are i+1 .. j+1, averaged for ties.
    const avg = (i + 1 + j + 1) / 2
    for (let k = i; k <= j; k++) {
      rankable[k].place = avg
    }
    i = j + 1
  }

  // Assign award labels for the top 4 integer places:
  // place 1 -> Grand Prix, 2 -> 1st, 3 -> 2nd, 4 -> 3rd.
  // Ties producing fractional places (e.g. 1.5) are skipped for now.
  for (const r of rows) {
    r.award = awardForPlace(r.place)
  }

  return rows
})

const sortedSummaryRows = computed<SummaryRow[]>(() => {
  return [...summaryRows.value].sort((a, b) => {
    // Keep original team order (by id) to mirror Excel "Итог".
    return a.teamId - b.teamId
  })
})

const sortedJudgeRows = computed(() => {
  if (!selectedJudgeEntry.value) return []
  return [...selectedJudgeEntry.value.scores].sort((a, b) => {
    if (a.total !== b.total) return b.total - a.total
    return a.teamId - b.teamId
  })
})

function selectJudge(judgeId: number) {
  selectedJudgeId.value = selectedJudgeId.value === judgeId ? null : judgeId
}

function selectAll() {
  selectedJudgeId.value = null
}

const viewTitle = computed(() => {
  if (!isJudgeView.value || !selectedJudgeEntry.value) return t('protocol.subtitleSummary')
  return `${t('protocol.judgeScoresOf')} ${selectedJudgeEntry.value.judge.fullName}`
})

onMounted(load)
</script>

<template>
  <div class="min-h-screen bg-[#F8FAFB]">
    <header class="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
      <div class="max-w-[1400px] mx-auto flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <img :src="logoImg" alt="Logo" class="w-8 h-8 rounded-lg object-contain" />
          <div>
            <h1 class="text-lg font-bold text-slate-800 tracking-tight">{{ t('protocol.title') }}</h1>
            <p class="text-xs text-slate-400">{{ viewTitle }}</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <AppButton :disabled="!protocolData || exporting" @click="doExport">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {{ exporting ? t('protocol.exporting') : t('protocol.exportButton') }}
          </AppButton>
          <ProfileMenu />
        </div>
      </div>
    </header>

    <main class="max-w-[1400px] mx-auto p-6">
      <div v-if="loading" class="text-center py-20 text-slate-400 text-sm">{{ t('common.loading') }}</div>

      <div v-else-if="error" class="text-center py-20 text-red-500 text-sm">
        {{ error }}
        <button @click="load" class="block mx-auto mt-3 text-xs font-medium text-[#28ca9e] hover:underline">
          {{ t('common.retry') }}
        </button>
      </div>

      <div v-else-if="protocolData" class="bg-white rounded-2xl shadow-sm overflow-hidden">
        <!-- Stats bar -->
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p class="text-xs text-slate-400">{{ t('protocol.teamsCount') }}</p>
            <p class="text-lg font-bold text-slate-800">{{ protocolData.rows.length }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400">{{ t('protocol.judgesInDb') }}</p>
            <p class="text-lg font-bold text-slate-800">{{ protocolData.totalJudges }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400">{{ t('protocol.teamsRated') }}</p>
            <p class="text-lg font-bold text-slate-800">
              {{ protocolData.rows.filter(r => r.judgesVoted > 0).length }} / {{ protocolData.rows.length }}
            </p>
          </div>
          <div class="flex items-center gap-2 text-xs text-slate-500">
            <span class="inline-block w-3 h-3 rounded bg-[#FFF4B8] border border-amber-200" />
            {{ t('protocol.absentLegend') }}
          </div>
        </div>

        <!-- Sheet-like tabs (judges + summary) -->
        <div v-if="protocolData.judges.length" class="px-6 py-3 border-b border-slate-100 flex flex-wrap gap-2 items-center">
          <span class="text-xs font-semibold text-slate-500 mr-1">{{ t('protocol.viewAs') }}:</span>
          <button
            v-for="j in protocolData.judges"
            :key="j.id"
            @click="selectJudge(j.id)"
            :class="[
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition border',
              selectedJudgeId === j.id
                ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
            ]"
          >
            {{ shortName(j.fullName) }}
          </button>
          <button
            @click="selectAll"
            :class="[
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition border',
              !isJudgeView
                ? 'bg-[#28ca9e] text-white border-[#28ca9e] shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
            ]"
          >
            {{ t('protocol.viewSummary') }}
          </button>
        </div>

        <!-- SUMMARY (Итог) — judges as columns -->
        <div v-if="!isJudgeView" class="overflow-x-auto">
          <table class="w-full text-sm border-collapse">
            <thead class="bg-slate-50 text-slate-600 sticky top-0">
              <tr>
                <th class="px-3 py-2 text-left font-semibold border border-slate-200 w-12">№</th>
                <th class="px-3 py-2 text-left font-semibold border border-slate-200 min-w-[220px]">
                  {{ t('protocol.team') }}
                </th>
                <th
                  v-for="j in protocolData.judges"
                  :key="j.id"
                  @click="selectJudge(j.id)"
                  class="px-3 py-2 text-center font-semibold border border-slate-200 cursor-pointer hover:bg-slate-100 transition whitespace-nowrap"
                  :title="j.fullName"
                >
                  {{ shortName(j.fullName) }}
                </th>
                <th class="px-3 py-2 text-center font-semibold border border-slate-200 bg-[#28ca9e]/10 text-[#1a8c6d]">
                  {{ t('protocol.total') }}
                </th>
                <th class="px-3 py-2 text-center font-semibold border border-slate-200 bg-amber-50 text-amber-800">
                  {{ t('protocol.place') }}
                </th>
                <th class="px-3 py-2 text-center font-semibold border border-slate-200 bg-amber-100/70 text-amber-900">
                  {{ t('protocol.award') }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, i) in sortedSummaryRows"
                :key="row.teamId"
                :class="row.status === 'absent' ? 'bg-[#FFF4B8]/60' : (i % 2 === 1 ? 'bg-slate-50/40' : '')"
              >
                <td class="px-3 py-2 text-slate-400 font-mono text-xs border border-slate-200">{{ i + 1 }}</td>
                <td class="px-3 py-2 font-semibold text-slate-800 border border-slate-200">
                  <span class="inline-flex items-center gap-2">
                    {{ row.teamName }}
                    <span v-if="row.status === 'absent'" class="text-[10px] font-semibold text-amber-700 bg-amber-200/60 rounded-full px-1.5 py-0.5">
                      {{ t('teams.absent') }}
                    </span>
                  </span>
                </td>
                <td
                  v-for="j in protocolData.judges"
                  :key="j.id"
                  class="px-3 py-2 text-center border border-slate-200 tabular-nums"
                  :class="(row.byJudge[j.id] ?? 0) === 0 ? 'text-slate-300' : 'text-slate-700'"
                >
                  {{ fmtInt(row.byJudge[j.id] ?? 0) }}
                </td>
                <td
                  class="px-3 py-2 text-center border border-slate-200 font-bold tabular-nums"
                  :class="row.grandTotal === 0 ? 'text-slate-300' : 'text-[#1a8c6d]'"
                >
                  {{ fmtInt(row.grandTotal) }}
                </td>
                <td class="px-3 py-2 text-center border border-slate-200 tabular-nums">
                  <span
                    v-if="row.place === null"
                    class="text-[10px] font-semibold text-amber-700 bg-amber-100 rounded-full px-2 py-0.5"
                  >
                    {{ t('protocol.notParticipating') }}
                  </span>
                  <span v-else class="font-bold text-amber-800">{{ fmtPlace(row.place) }}</span>
                </td>
                <td class="px-3 py-2 text-center border border-slate-200 whitespace-nowrap">
                  <span
                    v-if="row.award"
                    :class="['inline-block text-[11px] font-bold rounded-full px-2.5 py-1', AWARD_BADGE_CLASS[row.award]]"
                  >
                    {{ t(`protocol.awards.${row.award}`) }}
                  </span>
                  <span v-else class="text-slate-300">—</span>
                </td>
              </tr>
              <tr v-if="sortedSummaryRows.length === 0">
                <td :colspan="protocolData.judges.length + 5" class="px-6 py-10 text-center text-slate-400">
                  {{ t('protocol.noData') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PER-JUDGE DETAIL (criteria C1..C5) -->
        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm border-collapse">
            <thead class="bg-slate-50 text-slate-600 sticky top-0">
              <tr>
                <th rowspan="2" class="px-3 py-2 text-left font-semibold border border-slate-200 w-12">#</th>
                <th rowspan="2" class="px-3 py-2 text-left font-semibold border border-slate-200 min-w-[220px]">
                  {{ t('protocol.team') }}
                </th>
                <th colspan="5" class="px-3 py-2 text-center font-semibold border border-slate-200 bg-slate-700/5 text-slate-700">
                  {{ t('protocol.criteria') }}
                </th>
                <th rowspan="2" class="px-3 py-2 text-center font-semibold border border-slate-200">{{ t('protocol.total') }}</th>
                <th rowspan="2" class="px-3 py-2 text-center font-semibold border border-slate-200">{{ t('protocol.status') }}</th>
              </tr>
              <tr>
                <th
                  v-for="c in criteriaList"
                  :key="c.key"
                  class="px-2 py-2 text-center font-semibold border border-slate-200 text-[11px] leading-tight whitespace-normal align-middle min-w-[80px]"
                >
                  {{ c.label }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, i) in sortedJudgeRows"
                :key="row.teamId"
                :class="row.status === 'absent' ? 'bg-[#FFF4B8]/60' : (i % 2 === 1 ? 'bg-slate-50/40' : '')"
              >
                <td class="px-3 py-2 text-slate-400 font-mono text-xs border border-slate-200">{{ i + 1 }}</td>
                <td class="px-3 py-2 font-semibold text-slate-800 border border-slate-200">
                  <span class="inline-flex items-center gap-2">
                    {{ row.teamName }}
                    <span v-if="row.status === 'absent'" class="text-[10px] font-semibold text-amber-700 bg-amber-200/60 rounded-full px-1.5 py-0.5">
                      {{ t('teams.absent') }}
                    </span>
                  </span>
                </td>
                <td class="px-3 py-2 text-center border border-slate-200 tabular-nums"
                  :class="row.total === 0 ? 'text-slate-300' : ''"
                >{{ row.total === 0 ? '—' : fmtInt(row.c1) }}</td>
                <td class="px-3 py-2 text-center border border-slate-200 tabular-nums"
                  :class="row.total === 0 ? 'text-slate-300' : ''"
                >{{ row.total === 0 ? '—' : fmtInt(row.c2) }}</td>
                <td class="px-3 py-2 text-center border border-slate-200 tabular-nums"
                  :class="row.total === 0 ? 'text-slate-300' : ''"
                >{{ row.total === 0 ? '—' : fmtInt(row.c3) }}</td>
                <td class="px-3 py-2 text-center border border-slate-200 tabular-nums"
                  :class="row.total === 0 ? 'text-slate-300' : ''"
                >{{ row.total === 0 ? '—' : fmtInt(row.c4) }}</td>
                <td class="px-3 py-2 text-center border border-slate-200 tabular-nums"
                  :class="row.total === 0 ? 'text-slate-300' : ''"
                >{{ row.total === 0 ? '—' : fmtInt(row.c5) }}</td>
                <td class="px-3 py-2 text-center border border-slate-200 font-bold tabular-nums"
                  :class="row.total === 0 ? 'text-slate-300' : 'text-slate-800'"
                >{{ row.total === 0 ? '—' : fmtInt(row.total) }}</td>
                <td class="px-3 py-2 text-center text-xs border border-slate-200">
                  <span
                    :class="row.status === 'absent'
                      ? 'text-amber-700 bg-amber-100 rounded-full px-2 py-0.5 font-medium'
                      : 'text-slate-500'"
                  >
                    {{ row.status === 'absent' ? t('teams.absent') : t('teams.active') }}
                  </span>
                </td>
              </tr>
              <tr v-if="sortedJudgeRows.length === 0">
                <td colspan="9" class="px-6 py-10 text-center text-slate-400">{{ t('protocol.noData') }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Jury list (clickable) -->
        <div v-if="protocolData.judges.length" class="px-6 py-6 border-t border-slate-100">
          <h2 class="text-sm font-bold text-slate-700 mb-3">{{ t('protocol.juryList') }}</h2>
          <ul class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-slate-700">
            <li
              v-for="(j, i) in protocolData.judges"
              :key="j.id"
              @click="selectJudge(j.id)"
              :class="[
                'flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition',
                selectedJudgeId === j.id
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-50 hover:bg-slate-100',
              ]"
            >
              <span
                class="text-xs font-mono w-5"
                :class="selectedJudgeId === j.id ? 'text-slate-300' : 'text-slate-400'"
              >{{ i + 1 }}.</span>
              <span class="font-medium">{{ j.fullName }}</span>
              <span class="ml-auto text-xs" :class="selectedJudgeId === j.id ? 'text-slate-300' : 'text-slate-400'">
                @{{ j.username }}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </main>
  </div>
</template>

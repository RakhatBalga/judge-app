<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@features/auth'
import { ScoreForm } from '@features/score-team'
import { useTeamsStore } from '@entities/team'
import { StatusBadge } from '@shared/ui'
import { useI18n } from '@shared/i18n/useI18n'

const props = defineProps<{ teamId: number }>()
const router = useRouter()
const auth = useAuthStore()
const teamsStore = useTeamsStore()
const { t } = useI18n()

onMounted(() => {
  void teamsStore.load()
})

const team = computed(() => teamsStore.getTeam(props.teamId))
const teamIndex = computed(() => teamsStore.teams.findIndex(t => t.id === props.teamId))
const isScored = computed(() => teamsStore.hasMyScore(props.teamId))

function goPrev() {
  const prev = teamsStore.teams[teamIndex.value - 1]
  if (prev) router.push({ name: 'score', params: { teamId: prev.id } })
}

function goNext() {
  const next = teamsStore.teams[teamIndex.value + 1]
  if (next) router.push({ name: 'score', params: { teamId: next.id } })
}
</script>

<template>
  <div class="min-h-screen bg-[#F8FAFB] flex flex-col max-w-2xl mx-auto">
    <header class="bg-white border-b border-slate-200 px-4 pb-4 sticky top-0 z-10 pt-4">
      <div class="flex items-center gap-3">
        <button
          @click="router.push({ name: 'teams' })"
          class="p-2 -ml-2 rounded-xl hover:bg-slate-100 active:bg-slate-200 transition text-slate-500"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-400 font-mono shrink-0">#{{ teamId }}</span>
            <h1 class="text-base font-bold text-slate-800 truncate">{{ team?.name || '…' }}</h1>
          </div>
          <p class="text-xs text-slate-400">{{ auth.user?.fullName || t('scoring.judge') }}</p>
        </div>

        <StatusBadge :scored="isScored" />
      </div>

      <div class="flex items-center justify-between mt-3 text-xs text-slate-500">
        <button
          @click="goPrev"
          :disabled="teamIndex <= 0"
          class="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {{ t('scoring.previous') }}
        </button>
        <span class="text-slate-400">{{ teamIndex + 1 }} / {{ teamsStore.teams.length }}</span>
        <button
          @click="goNext"
          :disabled="teamIndex >= teamsStore.teams.length - 1"
          class="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          {{ t('scoring.next') }}
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </header>

    <main class="flex-1 px-4 py-4 pb-6">
      <ScoreForm v-if="team" :team-id="teamId" :judge-id="auth.user?.id" />
      <div v-else class="flex items-center justify-center py-20 text-slate-400 text-sm">
        {{ t('common.loading') }}
      </div>
    </main>
  </div>
</template>

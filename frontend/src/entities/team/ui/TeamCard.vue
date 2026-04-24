<script setup lang="ts">
import type { ApiTeam } from '@shared/api'
import { getScoreColor } from '@shared/utils/score-colors'
import { TeamBilingualName } from '@shared/ui'
import { useI18n } from '@shared/i18n/useI18n'

defineProps<{
  team: ApiTeam
  rank: number
}>()

defineEmits<{ select: [id: number] }>()

const { t } = useI18n()
</script>

<template>
  <button
    @click="$emit('select', team.id)"
    class="w-full flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-sm hover:shadow-md active:scale-[0.99] transition text-left"
    :class="team.status === 'absent' ? 'ring-1 ring-amber-200 bg-amber-50/40' : ''"
  >
    <span class="text-sm text-slate-400 font-mono w-7 shrink-0 text-right">#{{ rank }}</span>

    <span class="flex-1 min-w-0 font-semibold text-slate-800 text-sm leading-snug flex items-start gap-2 flex-wrap">
      <TeamBilingualName :name="team.name" variant="card" />
      <span
        v-if="team.status === 'absent'"
        class="shrink-0 text-[10px] font-semibold text-amber-700 bg-amber-100 rounded-full px-2 py-0.5"
      >
        {{ t('teams.absent') }}
      </span>
    </span>

    <div v-if="team.myScore" class="flex items-center gap-2 shrink-0">
      <span class="text-xs font-medium" :class="getScoreColor(team.myScore.total).textClass">
        {{ team.myScore.total }} б.
      </span>
      <span
        class="w-5 h-5 rounded-full flex items-center justify-center text-white"
        :class="getScoreColor(team.myScore.total).iconBgClass"
      >
        <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
    </div>
    <div v-else class="flex items-center gap-2 shrink-0">
      <span class="text-xs text-slate-400">{{ t('teams.evaluate') }}</span>
      <span class="w-5 h-5 rounded-full border-2 border-slate-200" />
    </div>

    <svg class="w-4 h-4 text-slate-300 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  </button>
</template>

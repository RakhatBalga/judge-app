<script setup lang="ts">
import { computed } from 'vue'
import { getTeamBilingualLines } from '@shared/utils/team-bilingual-name'

const props = withDefaults(
  defineProps<{
    name: string
    /** Карточка списка / лог */
    variant?: 'card' | 'title' | 'table' | 'inline'
  }>(),
  { variant: 'card' },
)

const lines = computed(() => getTeamBilingualLines(props.name))

const kkClass = computed(() => {
  switch (props.variant) {
    case 'title':
      return 'block wrap-anywhere break-words text-base font-bold text-slate-800 leading-snug'
    case 'table':
      return 'block wrap-anywhere break-words font-semibold text-slate-800 leading-snug'
    case 'inline':
      return 'block wrap-anywhere break-words font-semibold text-slate-800 leading-snug'
    default:
      return 'block wrap-anywhere break-words text-sm font-semibold text-slate-800 leading-snug'
  }
})

const ruClass = computed(() => {
  switch (props.variant) {
    case 'title':
      return 'block wrap-anywhere break-words text-sm font-normal text-slate-600 leading-snug mt-1'
    case 'table':
      return 'block wrap-anywhere break-words text-sm font-normal text-slate-600 leading-snug mt-0.5'
    case 'inline':
      return 'block wrap-anywhere break-words text-sm font-normal text-slate-700 leading-snug mt-0.5'
    default:
      return 'block wrap-anywhere break-words text-sm font-normal text-slate-600 leading-snug mt-0.5'
  }
})
</script>

<template>
  <span class="inline-block w-full min-w-0 text-left">
    <span :class="kkClass">{{ lines.kk }}</span>
    <span v-if="lines.ru" :class="ruClass">{{ lines.ru }}</span>
  </span>
</template>

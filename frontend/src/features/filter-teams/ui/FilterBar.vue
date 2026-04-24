<script setup lang="ts">
import type { FilterMode } from '../model/use-filter'
import { useI18n } from '@shared/i18n/useI18n'

const props = defineProps<{
  modelValue: string
  filterMode: FilterMode
  totalCount: number
  scoredCount: number
}>()

const emit = defineEmits<{
  'update:modelValue': [v: string]
  'update:filterMode': [v: FilterMode]
}>()

const { t } = useI18n()

const tabs: { key: FilterMode; labelKey: string; count: (p: typeof props) => number }[] = [
  { key: 'all',      labelKey: 'teams.filterAll', count: p => p.totalCount },
  { key: 'unscored', labelKey: 'teams.filterUnscored', count: p => p.totalCount - p.scoredCount },
  { key: 'scored',   labelKey: 'teams.filterScored', count: p => p.scoredCount },
]
</script>

<template>
  <div>
    <!-- Search -->
    <div class="relative">
      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </span>
      <input
        :value="modelValue"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        type="text"
        :placeholder="t('teams.searchPlaceholder')"
        class="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-mint-500 focus:border-transparent transition"
      />
      <button
        v-if="modelValue"
        @click="emit('update:modelValue', '')"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 mt-3">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="emit('update:filterMode', tab.key)"
        :class="[
          'flex-1 py-2 rounded-lg text-xs font-medium transition',
          filterMode === tab.key
            ? 'bg-[#28ca9e]/10 text-[#28ca9e]'
            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50',
        ]"
      >
        {{ t(tab.labelKey) }}
        <span
          :class="[
            'ml-1 rounded-full px-1.5 py-0.5 text-[10px]',
            filterMode === tab.key ? 'bg-[#28ca9e]/15 text-[#28ca9e]' : 'bg-slate-100 text-slate-400',
          ]"
        >
          {{ tab.count(props) }}
        </span>
      </button>
    </div>
  </div>
</template>

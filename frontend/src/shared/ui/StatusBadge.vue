<script setup lang="ts">
import { useI18n } from '@shared/i18n/useI18n'

defineProps<{ scored: boolean }>()

const { t } = useI18n()
</script>

<template>
  <span
    v-if="scored"
    class="inline-flex items-center gap-1 text-xs font-medium text-[#28ca9e] bg-[#28ca9e]/10 px-2.5 py-1 rounded-full"
  >
    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
    </svg>
    {{ t('teams.filterScored') }}
  </span>
  <span
    v-else
    class="inline-flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full"
  >
    <span class="w-1.5 h-1.5 rounded-full border border-slate-300" />
    {{ t('teams.filterUnscored') }}
  </span>
</template>

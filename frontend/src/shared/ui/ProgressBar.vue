<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  value: number
  max: number
  color?: 'blue' | 'white' | 'green' | 'mint' | 'auto' | 'red' | 'orange' | 'yellow' | 'lime' | 'gray'
  height?: 'sm' | 'md'
}>()

const pct = computed(() => Math.min(100, (props.value / props.max) * 100))
</script>

<template>
  <div
    :class="[
      'rounded-full overflow-hidden',
      height === 'md' ? 'h-2' : 'h-1',
      color === 'mint' ? 'bg-mint-100' :
      color === 'red' ? 'bg-red-100' :
      color === 'orange' ? 'bg-orange-100' :
      color === 'yellow' ? 'bg-yellow-100' :
      color === 'lime' ? 'bg-lime-100' :
      color === 'green' ? 'bg-green-100' :
      color === 'gray' ? 'bg-slate-100' :
      color === 'white' ? 'bg-white/20' :
      'bg-current/20',
    ]"
  >
    <div
      class="h-full rounded-full transition-all duration-500"
      :class="[
        color === 'white' ? 'bg-white' :
        color === 'green' ? 'bg-green-500' :
        color === 'mint' ? 'bg-[#28ca9e] progress-glow' :
        color === 'red' ? 'bg-red-500' :
        color === 'orange' ? 'bg-orange-500' :
        color === 'yellow' ? 'bg-yellow-500' :
        color === 'lime' ? 'bg-lime-500' :
        color === 'gray' ? 'bg-slate-200' :
        color === 'auto'
          ? (value / max >= 0.8 ? 'bg-green-500' : value / max >= 0.5 ? 'bg-blue-500' : 'bg-orange-400')
          : 'bg-blue-500',
      ]"
      :style="{ width: `${pct}%` }"
    />
  </div>
</template>

<style scoped>
.progress-glow {
  box-shadow: 0 0 8px rgba(40, 202, 158, 0.5), 0 0 2px rgba(40, 202, 158, 0.3);
}
</style>

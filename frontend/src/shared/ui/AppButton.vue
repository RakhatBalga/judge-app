<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
}>()
</script>

<template>
  <button
    :disabled="disabled || loading"
    :class="[
      'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition duration-150 select-none',
      'disabled:opacity-60 disabled:cursor-not-allowed',
      fullWidth && 'w-full',
      size === 'sm'  ? 'px-3 py-1.5 text-xs' :
      size === 'lg'  ? 'px-5 py-4 text-base' :
                       'px-4 py-3 text-sm',
      variant === 'ghost'  ? 'text-slate-600 hover:bg-slate-100 active:bg-slate-200' :
      variant === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-200' :
                             'bg-[#28ca9e] hover:bg-mint-600 active:bg-mint-700 text-white shadow-md shadow-mint-200',
    ]"
  >
    <svg v-if="loading" class="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
    <slot />
  </button>
</template>

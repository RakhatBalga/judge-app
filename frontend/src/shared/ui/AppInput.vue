<script setup lang="ts">
defineProps<{
  modelValue: string
  type?: string
  placeholder?: string
  error?: boolean
  icon?: boolean
  autocomplete?: string
  autocapitalize?: string
}>()
defineEmits<{ 'update:modelValue': [v: string] }>()
</script>

<template>
  <div class="relative">
    <span v-if="$slots.icon" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
      <slot name="icon" />
    </span>
    <input
      :value="modelValue"
      :type="type ?? 'text'"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :autocapitalize="autocapitalize"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      :class="[
        'w-full py-3 rounded-xl border text-sm transition focus:outline-none focus:ring-2',
        $slots.icon ? 'pl-9' : 'pl-4',
        $slots.suffix ? 'pr-10' : 'pr-4',
        error
          ? 'border-red-300 bg-red-50 text-red-700 focus:ring-red-300'
          : 'border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-mint-500 focus:border-transparent',
      ]"
    />
    <span v-if="$slots.suffix" class="absolute right-3 top-1/2 -translate-y-1/2">
      <slot name="suffix" />
    </span>
  </div>
</template>

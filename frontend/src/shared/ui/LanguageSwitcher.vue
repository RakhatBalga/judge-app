<script setup lang="ts">
import { useI18n } from '@shared/i18n/useI18n'

const { locale, setLocale, availableLocales } = useI18n()

const localeNames: Record<string, string> = {
  en: 'English',
  ru: 'Русский',
  kk: 'Қазақша',
}
</script>

<template>
  <div class="flex gap-1 items-center">
    <button
      v-for="lang in availableLocales"
      :key="lang"
      @click="setLocale(lang)"
      :class="[
        'px-2 py-1 text-xs rounded transition',
        locale === lang
          ? 'bg-mint-500 text-white'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
      ]"
    >
      {{ localeNames[lang] }}
    </button>
  </div>
</template>

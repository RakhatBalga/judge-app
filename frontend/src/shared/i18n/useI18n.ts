import { useI18n as vueUseI18n } from 'vue-i18n'
import { computed } from 'vue'
import type { MessageSchema } from './index'

export function useI18n() {
  const i18n = vueUseI18n<{ message: MessageSchema }>()

  const setLocale = (locale: string) => {
    i18n.locale.value = locale as any
    localStorage.setItem('locale', locale)
  }

  const currentLocale = computed(() => i18n.locale.value)
  const availableLocales = computed(() => ['en', 'ru', 'kk'])

  return {
    t: i18n.t,
    locale: currentLocale,
    setLocale,
    availableLocales,
  }
}

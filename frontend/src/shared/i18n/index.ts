import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import ru from './locales/ru.json'
import kk from './locales/kk.json'

export type MessageSchema = typeof ru

const i18n = createI18n<{ message: MessageSchema }, 'en' | 'ru' | 'kk'>({
  legacy: false,
  locale: localStorage.getItem('locale') || 'kk',
  fallbackLocale: 'en',
  messages: {
    en,
    ru,
    kk,
  },
})

export default i18n

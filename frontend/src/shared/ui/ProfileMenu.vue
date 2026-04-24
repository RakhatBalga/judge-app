<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@features/auth'
import { useI18n } from '@shared/i18n/useI18n'
import judgeImg from '@shared/assets/judge.jpeg'

const router = useRouter()
const auth = useAuthStore()
const { t, locale, setLocale, availableLocales } = useI18n()

const isMenuOpen = ref(false)

const localeNames: Record<string, string> = {
  en: 'English',
  ru: 'Русский',
  kk: 'Қазақша',
}

// Коды языков вместо флагов (можно заменить на флаги, если нужно)
const localeCodes: Record<string, string> = {
  en: 'EN',
  ru: 'RU',
  kk: 'KK',
}

function handleLanguageChange(lang: string) {
  setLocale(lang)
  isMenuOpen.value = false
}

function handleLogout() {
  auth.logout()
  router.push({ name: 'login' })
  isMenuOpen.value = false
}

function goTo(name: string) {
  router.push({ name })
  isMenuOpen.value = false
}
</script>

<template>
  <div class="relative">
    <!-- Profile badge button -->
    <button
      @click="isMenuOpen = !isMenuOpen"
      class="flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100 rounded-full pl-3 pr-1 py-1 transition"
    >
      <span class="text-xs font-bold text-slate-600 max-w-[140px] truncate">
        {{ auth.user?.fullName || `${t('scoring.judge')} ${auth.user?.id ?? ''}` }}
      </span>
      <img :src="judgeImg" alt="Judge" class="w-11 h-11 rounded-full border-2 border-white object-cover shadow-md" />
    </button>

    <!-- Dropdown menu -->
    <Transition name="menu">
      <div
        v-if="isMenuOpen"
        class="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-slate-200 z-50 min-w-max"
      >
        <!-- Languages section -->
        <div class="px-3 py-2 border-b border-slate-200">
          <p class="text-xs font-semibold text-slate-500 px-2 mb-1.5">{{ t('common.language') || 'Language' }}</p>
          <div class="space-y-1">
            <button
              v-for="lang in availableLocales"
              :key="lang"
              @click="handleLanguageChange(lang)"
              :class="[
                'w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center gap-2',
                locale === lang
                  ? 'bg-mint-500/10 text-mint-600 font-medium'
                  : 'text-slate-700 hover:bg-slate-50',
              ]"
            >
              <span class="w-8 text-center font-semibold text-xs uppercase">{{ localeCodes[lang] }}</span>
              <span>{{ localeNames[lang] }}</span>
              <svg v-if="locale === lang" class="w-4 h-4 ml-auto" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Navigation links -->
        <div v-if="auth.isAuthenticated" class="px-3 py-2 border-b border-slate-200 space-y-1">
          <button
            @click="goTo('teams')"
            class="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zm0 6h14M9 3v18" />
            </svg>
            {{ t('navigation.teams') }}
          </button>

          <template v-if="auth.isAdmin">
            <button
              @click="goTo('admin-protocol')"
              class="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 17v-6h13M9 11V5h13M3 7h3m-3 6h3m-3 6h3" />
              </svg>
              {{ t('navigation.protocol') }}
            </button>
            <button
              @click="goTo('admin-logs')"
              class="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ t('navigation.logs') }}
            </button>
          </template>
        </div>

        <!-- Logout button -->
        <button
          @click="handleLogout"
          class="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-xl transition flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {{ t('auth.logout') }}
        </button>
      </div>
    </Transition>

    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="isMenuOpen"
        @click="isMenuOpen = false"
        class="fixed inset-0 z-40"
      />
    </Transition>
  </div>
</template>

<style scoped>
.menu-enter-active, .menu-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.menu-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}
.menu-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>

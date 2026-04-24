<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@features/auth'
import { useFilterTeams, FilterBar } from '@features/filter-teams'
import { TeamCard, useTeamsStore } from '@entities/team'
import { ProgressBar, ProfileMenu } from '@shared/ui'
import { useI18n } from '@shared/i18n/useI18n'
import logoImg from '@shared/assets/logo.png'

const router = useRouter()
const auth = useAuthStore()
const teamsStore = useTeamsStore()
const { t } = useI18n()

const { search, filterMode, filteredTeams, scoredCount, totalCount } = useFilterTeams()

onMounted(() => {
  if (auth.isAdmin) {
    void router.replace({ name: 'admin-protocol' })
    return
  }
  void teamsStore.load()
})
</script>

<template>
  <div class="min-h-screen bg-[#F8FAFB] flex flex-col max-w-2xl mx-auto">
    <header class="bg-white border-b border-slate-200 px-4 pb-4 sticky top-0 z-10 pt-safe">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2.5">
          <img :src="logoImg" alt="Logo" class="w-8 h-8 rounded-lg object-contain" />
          <h1 class="text-lg font-bold text-slate-800 tracking-tight">{{ t('app.title') }}</h1>
        </div>
        <ProfileMenu />
      </div>

      <ProgressBar :value="scoredCount" :max="totalCount || 1" color="mint" height="sm" />
      <p class="text-slate-400 text-xs text-right mt-1.5">
        {{ scoredCount }} / {{ totalCount }} {{ t('teams.progressLabel') }}
      </p>

      <div class="mt-3">
        <FilterBar
          v-model="search"
          v-model:filter-mode="filterMode"
          :total-count="totalCount"
          :scored-count="scoredCount"
        />
      </div>
    </header>

    <main class="flex-1 px-4 py-3 pb-safe">
      <div v-if="teamsStore.loading && totalCount === 0" class="flex items-center justify-center py-20 text-slate-400">
        <svg class="w-5 h-5 animate-spin mr-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span class="text-sm">{{ t('common.loading') }}</span>
      </div>

      <div v-else-if="teamsStore.error" class="flex flex-col items-center py-20 text-red-500">
        <p class="text-sm">{{ teamsStore.error }}</p>
        <button
          @click="teamsStore.load(true)"
          class="mt-3 text-xs font-medium text-[#28ca9e] hover:underline"
        >
          {{ t('common.retry') }}
        </button>
      </div>

      <TransitionGroup v-else name="list" tag="div" class="space-y-2.5">
        <TeamCard
          v-for="(team, index) in filteredTeams"
          :key="team.id"
          :team="team"
          :rank="index + 1"
          @select="id => router.push({ name: 'score', params: { teamId: id } })"
        />
      </TransitionGroup>

      <div v-if="!teamsStore.loading && filteredTeams.length === 0" class="flex flex-col items-center justify-center py-20 text-slate-300">
        <svg class="w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-sm font-medium text-slate-400">{{ t('teams.noTeams') }}</p>
        <p class="text-xs mt-1 text-slate-300">{{ t('teams.tryChangingQuery') }}</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.list-enter-active, .list-leave-active { transition: opacity 0.2s, transform 0.2s; }
.list-enter-from { opacity: 0; transform: translateY(8px); }
.list-leave-to { opacity: 0; }
.list-move { transition: transform 0.2s; }
</style>

import { ref, computed } from 'vue'
import { useTeamsStore } from '@entities/team'
import type { ApiTeam } from '@shared/api'

export type FilterMode = 'all' | 'scored' | 'unscored'

export function useFilterTeams() {
  const teamsStore = useTeamsStore()
  const search = ref('')
  const filterMode = ref<FilterMode>('all')

  const scoredCount = computed(() => teamsStore.scoredCount)
  const totalCount = computed(() => teamsStore.count)

  const filteredTeams = computed<ApiTeam[]>(() => {
    const q = search.value.toLowerCase().trim()
    const filtered = teamsStore.teams.filter(t => {
      if (q && !t.name.toLowerCase().includes(q)) return false
      if (filterMode.value === 'all') return true
      const has = !!t.myScore
      return filterMode.value === 'scored' ? has : !has
    })

    // Список всегда в порядке id (как в протоколе), без сортировки по баллам.
    return [...filtered].sort((a, b) => a.id - b.id)
  })

  return { search, filterMode, filteredTeams, scoredCount, totalCount }
}

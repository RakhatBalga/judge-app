import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchTeams, upsertScoreRequest, apiErrorMessage, type ApiTeam, type ApiMyScore } from '@shared/api'

export const useTeamsStore = defineStore('teams', () => {
  const teams = ref<ApiTeam[]>([])
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref<string | null>(null)

  const count = computed(() => teams.value.length)
  const scoredCount = computed(() => teams.value.filter(t => !!t.myScore).length)

  async function load(force = false): Promise<void> {
    if (loading.value) return
    if (loaded.value && !force) return
    loading.value = true
    error.value = null
    try {
      teams.value = await fetchTeams()
      loaded.value = true
    } catch (e) {
      error.value = apiErrorMessage(e, 'Не удалось загрузить команды')
    } finally {
      loading.value = false
    }
  }

  function reset(): void {
    teams.value = []
    loaded.value = false
    error.value = null
  }

  function getTeam(teamId: number): ApiTeam | undefined {
    return teams.value.find(t => t.id === teamId)
  }

  function getMyScore(teamId: number): ApiMyScore | undefined {
    return getTeam(teamId)?.myScore
  }

  function hasMyScore(teamId: number): boolean {
    return !!getMyScore(teamId)
  }

  async function saveScore(req: {
    teamId: number
    c1: number; c2: number; c3: number; c4: number; c5: number
  }): Promise<{ ok: true; score: ApiMyScore } | { ok: false; error: string }> {
    try {
      const score = await upsertScoreRequest(req)
      const idx = teams.value.findIndex(t => t.id === req.teamId)
      if (idx !== -1) {
        teams.value[idx] = { ...teams.value[idx], myScore: score }
      }
      return { ok: true, score }
    } catch (e) {
      return { ok: false, error: apiErrorMessage(e, 'Не удалось сохранить оценку') }
    }
  }

  return {
    teams, loading, loaded, error,
    count, scoredCount,
    load, reset, getTeam, getMyScore, hasMyScore, saveScore,
  }
})

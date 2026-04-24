import { ref, computed, watch, type Ref } from 'vue'
import { useTeamsStore } from '@entities/team'
import { MAX_SCORE_PER_CRITERIA, MAX_TOTAL_SCORE } from '@shared/config/scoring'

export type CriteriaKey = 'c1' | 'c2' | 'c3' | 'c4' | 'c5'
export const CRITERIA_KEYS: CriteriaKey[] = ['c1', 'c2', 'c3', 'c4', 'c5']

export type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

const AUTO_SAVE_DEBOUNCE_MS = 1000

function emptyValues(): Record<CriteriaKey, string> {
  return { c1: '', c2: '', c3: '', c4: '', c5: '' }
}

export function useScoreForm(teamId: Ref<number>, judgeId: Ref<number | undefined>) {
  const teamsStore = useTeamsStore()
  const values = ref<Record<CriteriaKey, string>>(emptyValues())
  const saveStatus = ref<SaveStatus>('idle')
  const saveError = ref<string | null>(null)

  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  function clearDebounce() {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
  }

  function syncFromStore(): void {
    const existing = teamsStore.getMyScore(teamId.value)
    values.value = existing
      ? {
          c1: String(existing.c1), c2: String(existing.c2), c3: String(existing.c3),
          c4: String(existing.c4), c5: String(existing.c5),
        }
      : emptyValues()
    saveStatus.value = existing ? 'saved' : 'idle'
    saveError.value = null
  }

  watch([teamId, judgeId], () => {
    clearDebounce()
    syncFromStore()
  }, { immediate: true })

  const isAlreadyScored = computed(() => teamsStore.hasMyScore(teamId.value))

  function numVal(k: CriteriaKey): number {
    const v = values.value[k]
    return v === '' ? NaN : Number(v)
  }

  function fieldError(k: CriteriaKey): string | null {
    const v = values.value[k]
    if (v === '') return null
    const n = Number(v)
    if (isNaN(n) || !Number.isInteger(n)) return 'Целое число'
    if (n < 0) return 'Минимум 0'
    if (n > MAX_SCORE_PER_CRITERIA) return `Максимум ${MAX_SCORE_PER_CRITERIA}`
    return null
  }

  function clamp(k: CriteriaKey): void {
    const v = values.value[k]
    if (v === '') return
    const n = Number(v)
    if (!isNaN(n)) {
      if (n > MAX_SCORE_PER_CRITERIA) values.value[k] = String(MAX_SCORE_PER_CRITERIA)
      if (n < 0) values.value[k] = '0'
    }
  }

  function setQuickValue(k: CriteriaKey, n: number): void {
    const clamped = Math.max(0, Math.min(MAX_SCORE_PER_CRITERIA, n))
    values.value[k] = String(clamped)
    scheduleAutoSave()
  }

  function increment(k: CriteriaKey): void {
    const cur = values.value[k]
    values.value[k] = String(Math.min(MAX_SCORE_PER_CRITERIA, cur === '' ? 1 : Number(cur) + 1))
    scheduleAutoSave()
  }

  function decrement(k: CriteriaKey): void {
    const cur = values.value[k]
    values.value[k] = String(Math.max(0, cur === '' ? 0 : Number(cur) - 1))
    scheduleAutoSave()
  }

  const total = computed<number | null>(() => {
    const nums = CRITERIA_KEYS.map(numVal)
    if (nums.some(isNaN)) return null
    return nums.reduce((a, b) => a + b, 0)
  })

  const hasErrors = computed(() => CRITERIA_KEYS.some(k => fieldError(k) !== null))
  const allFilled = computed(() => CRITERIA_KEYS.every(k => values.value[k] !== ''))
  const canSubmit = computed(() => allFilled.value && !hasErrors.value)

  async function submit(): Promise<void> {
    clearDebounce()
    if (!canSubmit.value || !judgeId.value || total.value === null) return
    saveStatus.value = 'saving'
    saveError.value = null
    const res = await teamsStore.saveScore({
      teamId: teamId.value,
      c1: Number(values.value.c1),
      c2: Number(values.value.c2),
      c3: Number(values.value.c3),
      c4: Number(values.value.c4),
      c5: Number(values.value.c5),
    })
    if (res.ok) {
      saveStatus.value = 'saved'
    } else {
      saveStatus.value = 'error'
      saveError.value = res.error
    }
  }

  function scheduleAutoSave(): void {
    if (!canSubmit.value) {
      saveStatus.value = hasErrors.value ? 'error' : 'idle'
      return
    }
    saveStatus.value = 'pending'
    clearDebounce()
    debounceTimer = setTimeout(() => {
      void submit()
    }, AUTO_SAVE_DEBOUNCE_MS)
  }

  function flushAutoSave(): void {
    if (debounceTimer) {
      clearDebounce()
      void submit()
    }
  }

  function onInput(k: CriteriaKey): void {
    if (fieldError(k)) {
      saveStatus.value = 'error'
      return
    }
    scheduleAutoSave()
  }

  function onBlur(k: CriteriaKey): void {
    clamp(k)
    flushAutoSave()
  }

  return {
    values, saveStatus, saveError, isAlreadyScored,
    total, hasErrors, allFilled, canSubmit,
    fieldError, clamp, increment, decrement,
    setQuickValue, submit, onInput, onBlur, flushAutoSave,
    MAX_SCORE_PER_CRITERIA, MAX_TOTAL_SCORE, CRITERIA_KEYS,
  }
}

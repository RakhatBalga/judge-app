export const MAX_SCORE_PER_CRITERIA = 20
export const CRITERIA_COUNT = 5
export const MAX_TOTAL_SCORE = MAX_SCORE_PER_CRITERIA * CRITERIA_COUNT

export type CriteriaKey = 'c1' | 'c2' | 'c3' | 'c4' | 'c5'
export const CRITERIA_KEYS: CriteriaKey[] = ['c1', 'c2', 'c3', 'c4', 'c5']

export const CRITERIA_LABELS: Record<CriteriaKey, { label: string; description: string }> = {
  c1: { label: 'Критерий 1', description: 'Актуальность' },
  c2: { label: 'Критерий 2', description: 'Презентабельность' },
  c3: { label: 'Критерий 3', description: 'Инновационность' },
  c4: { label: 'Критерий 4', description: 'Практическая значимость' },
  c5: { label: 'Критерий 5', description: 'Креативность' },
}

export type ScoreColor = 'red' | 'orange' | 'yellow' | 'lime' | 'green' | 'gray'

export function getScoreColor(score: number | string | null, max: number = 100): { color: ScoreColor; bgClass: string; textClass: string; borderClass: string; ringClass: string; iconBgClass: string } {
  if (score === null || score === '') {
    return { color: 'gray', bgClass: 'bg-slate-50', textClass: 'text-slate-600', borderClass: 'border-slate-200', ringClass: 'focus:ring-slate-300', iconBgClass: 'bg-slate-300' }
  }

  const numScore = Number(score)
  const percentage = (numScore / max) * 100

  if (percentage >= 85) {
    return { color: 'green', bgClass: 'bg-green-50', textClass: 'text-green-600', borderClass: 'border-green-300', ringClass: 'focus:ring-green-300', iconBgClass: 'bg-green-500' }
  }
  if (percentage >= 75) {
    return { color: 'lime', bgClass: 'bg-lime-50', textClass: 'text-lime-500', borderClass: 'border-lime-300', ringClass: 'focus:ring-lime-300', iconBgClass: 'bg-lime-500' }
  }
  if (percentage >= 60) {
    return { color: 'yellow', bgClass: 'bg-yellow-50', textClass: 'text-yellow-500', borderClass: 'border-yellow-300', ringClass: 'focus:ring-yellow-300', iconBgClass: 'bg-yellow-500' }
  }
  if (percentage >= 50) {
    return { color: 'orange', bgClass: 'bg-orange-50', textClass: 'text-orange-500', borderClass: 'border-orange-300', ringClass: 'focus:ring-orange-300', iconBgClass: 'bg-orange-500' }
  }

  return { color: 'red', bgClass: 'bg-red-50', textClass: 'text-red-500', borderClass: 'border-red-300', ringClass: 'focus:ring-red-300', iconBgClass: 'bg-red-500' }
}

export function getProgressBarColor(score: number | string | null, max: number = 100): 'red' | 'orange' | 'yellow' | 'lime' | 'green' | 'gray' {
  if (score === null || score === '' || Number(score) === 0) return 'gray'

  const percentage = (Number(score) / max) * 100

  if (percentage >= 85) return 'green'
  if (percentage >= 75) return 'lime'
  if (percentage >= 60) return 'yellow'
  if (percentage >= 50) return 'orange'

  return 'red'
}

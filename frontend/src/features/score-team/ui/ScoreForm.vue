<script setup lang="ts">
import { computed, toRef, ref } from 'vue'
import { useScoreForm, type CriteriaKey, CRITERIA_KEYS } from '../model/use-score-form'
import { AppButton, ProgressBar } from '@shared/ui'
import { getScoreColor, getProgressBarColor } from '@shared/utils/score-colors'
import { useI18n } from '@shared/i18n/useI18n'

const props = defineProps<{ teamId: number; judgeId: number | undefined }>()

const { t } = useI18n()

const {
  values, saveStatus, saveError, isAlreadyScored,
  total, hasErrors, allFilled, canSubmit,
  fieldError, increment, decrement,
  setQuickValue, submit, onInput, onBlur,
  MAX_SCORE_PER_CRITERIA, MAX_TOTAL_SCORE,
} = useScoreForm(toRef(props, 'teamId'), toRef(props, 'judgeId'))

const criteriaList = computed(() =>
  CRITERIA_KEYS.map((key, i) => ({
    key,
    index: i + 1,
    label: t(`scoring.criteria.${key}.label`),
    description: t(`scoring.criteria.${key}.desc`),
  }))
)

const scoreColorClass = computed(() => getScoreColor(total.value).textClass)
const progressBarColor = computed(() => getProgressBarColor(total.value, MAX_TOTAL_SCORE))

const QUICK_VALUES = [5, 10, 15, 20]

const inputRefs = ref<Record<string, HTMLInputElement | null>>({})
function setInputRef(key: CriteriaKey, el: Element | null | { $el?: Element }): void {
  const node = el instanceof HTMLInputElement ? el : null
  inputRefs.value[key] = node
}

function focusCriterion(k: CriteriaKey): void {
  const el = inputRefs.value[k]
  if (el) {
    el.focus()
    el.select()
  }
}

function moveFocus(currentKey: CriteriaKey, delta: number): void {
  const idx = CRITERIA_KEYS.indexOf(currentKey)
  const nextIdx = idx + delta
  if (nextIdx < 0 || nextIdx >= CRITERIA_KEYS.length) return
  focusCriterion(CRITERIA_KEYS[nextIdx])
}

function onKeydown(evt: KeyboardEvent, k: CriteriaKey): void {
  if (evt.key === 'ArrowUp') {
    evt.preventDefault()
    if (evt.shiftKey) moveFocus(k, -1)
    else increment(k)
  } else if (evt.key === 'ArrowDown') {
    evt.preventDefault()
    if (evt.shiftKey) moveFocus(k, 1)
    else decrement(k)
  } else if (evt.key === 'ArrowRight' && evt.shiftKey) {
    evt.preventDefault()
    moveFocus(k, 1)
  } else if (evt.key === 'ArrowLeft' && evt.shiftKey) {
    evt.preventDefault()
    moveFocus(k, -1)
  } else if (evt.key === 'Enter') {
    evt.preventDefault()
    moveFocus(k, 1)
  }
}

const statusMessage = computed(() => {
  switch (saveStatus.value) {
    case 'pending': return t('scoring.autoSavePending')
    case 'saving':  return t('scoring.autoSaving')
    case 'saved':   return t('scoring.scoreSaved')
    case 'error':   return saveError.value || t('scoring.saveError')
    default:        return ''
  }
})

const statusColorClass = computed(() => {
  switch (saveStatus.value) {
    case 'pending': return 'text-slate-400 bg-slate-50'
    case 'saving':  return 'text-sky-600 bg-sky-50'
    case 'saved':   return 'text-[#28ca9e] bg-[#28ca9e]/10'
    case 'error':   return 'text-red-600 bg-red-50'
    default:        return ''
  }
})
</script>

<template>
  <div class="space-y-3">
    <div
      v-for="c in criteriaList"
      :key="c.key"
      class="bg-white rounded-2xl shadow-sm p-4"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-0.5">
            <span class="flex items-center justify-center w-5 h-5 rounded-full bg-[#28ca9e]/10 text-[#28ca9e] text-xs font-bold shrink-0">
              {{ c.index }}
            </span>
            <span class="text-sm font-semibold text-slate-800">{{ c.label }}</span>
          </div>
          <p class="text-xs text-slate-400 ml-7 leading-snug">{{ c.description }}</p>
        </div>

        <div class="shrink-0 flex flex-col items-end gap-1">
          <div class="flex items-center gap-1.5">
            <button
              type="button"
              tabindex="-1"
              @click="decrement(c.key)"
              aria-label="−1"
              class="w-10 h-10 sm:w-8 sm:h-8 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 flex items-center justify-center text-slate-500 transition"
            >
              <svg class="w-4 h-4 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M20 12H4" />
              </svg>
            </button>

            <input
              :ref="el => setInputRef(c.key, el as Element | null)"
              v-model="values[c.key]"
              @input="onInput(c.key)"
              @blur="onBlur(c.key)"
              @keydown="evt => onKeydown(evt, c.key)"
              type="number"
              inputmode="numeric"
              pattern="[0-9]*"
              enterkeyhint="next"
              min="0"
              :max="MAX_SCORE_PER_CRITERIA"
              placeholder="—"
              :data-criterion="c.key"
              :class="[
                'w-16 sm:w-14 text-center py-2 sm:py-1.5 rounded-lg border text-base sm:text-sm font-semibold transition focus:outline-none focus:ring-2',
                fieldError(c.key)
                  ? 'border-red-300 bg-red-50 text-red-700 focus:ring-red-300'
                  : values[c.key] !== ''
                    ? `${getScoreColor(values[c.key], MAX_SCORE_PER_CRITERIA).borderClass} ${getScoreColor(values[c.key], MAX_SCORE_PER_CRITERIA).bgClass} ${getScoreColor(values[c.key], MAX_SCORE_PER_CRITERIA).textClass} ${getScoreColor(values[c.key], MAX_SCORE_PER_CRITERIA).ringClass}`
                    : 'border-slate-200 bg-slate-50 text-slate-600 focus:ring-slate-300',
              ]"
            />

            <button
              type="button"
              tabindex="-1"
              @click="increment(c.key)"
              aria-label="+1"
              class="w-10 h-10 sm:w-8 sm:h-8 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 flex items-center justify-center text-slate-500 transition"
            >
              <svg class="w-4 h-4 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          <p v-if="fieldError(c.key)" class="text-red-500 text-[10px]">{{ fieldError(c.key) }}</p>
          <p v-else class="text-slate-300 text-[10px]">{{ `0 – ${MAX_SCORE_PER_CRITERIA}` }}</p>
        </div>
      </div>

      <div class="mt-3 flex flex-wrap gap-1.5">
        <button
          v-for="q in QUICK_VALUES"
          :key="q"
          type="button"
          tabindex="-1"
          @click="setQuickValue(c.key, q)"
          :class="[
            'min-w-[44px] sm:min-w-0 px-3 sm:px-2.5 py-1.5 sm:py-1 rounded-lg text-sm sm:text-xs font-semibold transition border',
            Number(values[c.key]) === q
              ? 'bg-[#28ca9e] text-white border-[#28ca9e]'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100',
          ]"
        >
          {{ q }}
        </button>
      </div>

      <div class="mt-3">
        <ProgressBar
          :value="values[c.key] !== '' && !fieldError(c.key) ? Number(values[c.key]) : 0"
          :max="MAX_SCORE_PER_CRITERIA"
          :color="getProgressBarColor(values[c.key], MAX_SCORE_PER_CRITERIA)"
          height="sm"
        />
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-sm p-4">
      <div class="flex items-center justify-between mb-4">
        <span class="text-sm font-semibold text-slate-700">{{ t('scoring.totalScore') }}</span>
        <div class="flex items-baseline gap-1">
          <span class="text-3xl font-bold transition-colors duration-300" :class="scoreColorClass">
            {{ total !== null ? total : '—' }}
          </span>
          <span class="text-sm text-slate-400">/ {{ MAX_TOTAL_SCORE }}</span>
        </div>
      </div>

      <ProgressBar :value="total ?? 0" :max="MAX_TOTAL_SCORE" :color="progressBarColor" class="mb-4" />

      <Transition name="fade">
        <div
          v-if="statusMessage"
          class="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-3 text-sm"
          :class="statusColorClass"
        >
          <svg v-if="saveStatus === 'saved'" class="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <svg v-else-if="saveStatus === 'saving'" class="w-4 h-4 shrink-0 animate-spin" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <svg v-else-if="saveStatus === 'error'" class="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          <svg v-else class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" />
          </svg>
          <span>{{ statusMessage }}</span>
        </div>
      </Transition>

      <AppButton :disabled="!canSubmit" :full-width="true" @click="submit">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        {{ isAlreadyScored ? t('scoring.updateScore') : t('scoring.saveScore') }}
      </AppButton>

      <p v-if="!allFilled && !hasErrors" class="text-center text-xs text-slate-400 mt-2">
        {{ t('scoring.fillAllCriteria') }}
      </p>
      <p v-if="hasErrors" class="text-center text-xs text-red-400 mt-2">
        {{ t('scoring.fixErrors') }}
      </p>
      <p class="hidden sm:block text-center text-[11px] text-slate-300 mt-2">{{ t('scoring.keyboardHint') }}</p>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s, transform 0.3s; }
.fade-enter-from { opacity: 0; transform: scale(0.97); }
.fade-leave-to { opacity: 0; }
</style>

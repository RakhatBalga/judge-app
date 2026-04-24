/** Letters typical of Kazakh Cyrillic (not used in standard Russian orthography). */
const KZ_LETTER = /[әғқңөұүһіӘҒҚҢӨҰҮҺІ]/

function collapseBlock(s: string): string {
  return s
    .replace(/\s*\n\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function kazakhScore(s: string): number {
  let sc = 0
  const kzMatches = s.match(/[әғқңөұүһіӘҒҚҢӨҰҮҺІ]/g)
  if (kzMatches) sc += kzMatches.length * 2
  if (/қазақ|Қазақ/.test(s)) sc += 5
  const ruHints = (
    s.match(
      /\b(модель|для|устройство|система|приложение|разработка|автоматическ|электрон|инновацион|выращиван|песочн|спортивн)\b/gi,
    ) ?? []
  ).length
  sc -= ruHints * 2
  return sc
}

/** Splits stored project title into Kazakh (first line) and Russian (second) when both exist. */
export function getTeamBilingualLines(raw: string): { kk: string; ru?: string } {
  if (!raw?.trim()) return { kk: '' }

  const chunks = raw
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n+/)
    .map(collapseBlock)
    .filter(c => c.length > 0)

  if (chunks.length === 1) return { kk: chunks[0] }

  const a = chunks[0]
  const b = chunks.length === 2 ? chunks[1] : chunks.slice(1).join(' ')

  const sa = kazakhScore(a)
  const sb = kazakhScore(b)

  if (sa > sb) return { kk: a, ru: b }
  if (sb > sa) return { kk: b, ru: a }

  const aHas = KZ_LETTER.test(a)
  const bHas = KZ_LETTER.test(b)
  if (aHas && !bHas) return { kk: a, ru: b }
  if (bHas && !aHas) return { kk: b, ru: a }

  return { kk: a, ru: b }
}

/** Для Excel: казахская строка, с новой строки русская. */
export function formatTeamForSpreadsheet(raw: string): string {
  const { kk, ru } = getTeamBilingualLines(raw)
  return ru ? `${kk}\n${ru}` : kk
}

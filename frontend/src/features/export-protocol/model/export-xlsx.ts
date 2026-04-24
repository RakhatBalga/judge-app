import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import type { ProtocolResponse, JudgeScoresEntry, JudgeScoreRow } from '@shared/api'
import { formatTeamForSpreadsheet } from '@shared/utils/team-bilingual-name'

export type AwardKey = 'grandPrix' | 'first' | 'second' | 'third'

export interface AwardLabels {
  header: string
  grandPrix: string
  first: string
  second: string
  third: string
}

export interface ExportOptions {
  title?: string
  subtitle?: string
  fileName?: string
  criteriaLabels?: [string, string, string, string, string]
  awardLabels?: AwardLabels
}

const DEFAULT_CRITERIA_LABELS: [string, string, string, string, string] = [
  'Актуальность',
  'Презентабельность',
  'Инновационность',
  'Практическая значимость',
  'Креативность',
]

const DEFAULT_AWARD_LABELS: AwardLabels = {
  header: 'Награда',
  grandPrix: 'Гран-при',
  first: '1 место',
  second: '2 место',
  third: '3 место',
}

const AWARD_FILLS: Record<AwardKey, { argb: string }> = {
  grandPrix: { argb: 'FFFFD700' }, // gold
  first:     { argb: 'FFFFE9A8' }, // amber light
  second:    { argb: 'FFE5E7EB' }, // silver
  third:     { argb: 'FFFCD9B6' }, // bronze
}

const AWARD_FONT: Record<AwardKey, { argb: string }> = {
  grandPrix: { argb: 'FF7C4A03' },
  first:     { argb: 'FF92400E' },
  second:    { argb: 'FF334155' },
  third:     { argb: 'FF9A3412' },
}

function awardForPlace(place: number | null): AwardKey | null {
  if (place === null || !Number.isInteger(place)) return null
  switch (place) {
    case 1: return 'grandPrix'
    case 2: return 'first'
    case 3: return 'second'
    case 4: return 'third'
    default: return null
  }
}

const PAGE_SETUP: Partial<ExcelJS.PageSetup> = {
  paperSize: 9,
  orientation: 'landscape',
  fitToPage: true,
  fitToWidth: 1,
  fitToHeight: 0,
  margins: { left: 0.4, right: 0.4, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 },
}

const HEADER_GREEN = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF28CA9E' } }
const HEADER_BLUE = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF334155' } }
const HEADER_AMBER = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFF59E0B' } }
const ABSENT_FILL = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFFFF4B8' } }
const THIN_BORDER = {
  top: { style: 'thin' as const }, left: { style: 'thin' as const },
  bottom: { style: 'thin' as const }, right: { style: 'thin' as const },
}
const COL_WIDTHS_JUDGE = [
  { width: 5 }, { width: 42 },
  { width: 16 }, { width: 16 }, { width: 16 }, { width: 22 }, { width: 16 },
  { width: 14 }, { width: 16 },
]

function shortName(fullName: string): string {
  const parts = fullName.replace(/^Судья\s+/i, '').trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  const [surname, ...rest] = parts
  const initials = rest.map(p => `${p.charAt(0).toUpperCase()}.`).join(' ')
  return `${surname} ${initials}`.trim()
}

function fmtPlace(v: number | null): string | number {
  if (v === null) return '—'
  if (Number.isInteger(v)) return v
  return v.toFixed(1).replace('.', ',')
}

interface SummaryRow {
  teamId: number
  teamName: string
  status: 'active' | 'absent'
  byJudge: Record<number, number>
  grandTotal: number
  place: number | null
  award: AwardKey | null
}

function buildSummaryRows(data: ProtocolResponse, judgeScores: JudgeScoresEntry[]): SummaryRow[] {
  const rows: SummaryRow[] = data.rows.map(r => ({
    teamId: r.teamId,
    teamName: r.teamName,
    status: r.status,
    byJudge: {},
    grandTotal: 0,
    place: null,
    award: null,
  }))
  const byId = new Map(rows.map(r => [r.teamId, r]))
  for (const entry of judgeScores) {
    for (const s of entry.scores) {
      const row = byId.get(s.teamId)
      if (!row) continue
      row.byJudge[entry.judge.id] = s.total
      row.grandTotal += s.total
    }
  }
  const rankable = rows.filter(r => r.status !== 'absent' && r.grandTotal > 0)
  rankable.sort((a, b) => b.grandTotal - a.grandTotal)
  let i = 0
  while (i < rankable.length) {
    let j = i
    while (j + 1 < rankable.length && rankable[j + 1].grandTotal === rankable[i].grandTotal) {
      j += 1
    }
    const avg = (i + 1 + j + 1) / 2
    for (let k = i; k <= j; k++) {
      rankable[k].place = avg
    }
    i = j + 1
  }
  for (const r of rows) {
    r.award = awardForPlace(r.place)
  }
  return rows
}

function applyHeaderStyle(ws: ExcelJS.Worksheet, row1: number, row2: number, cols: number, fill: typeof HEADER_GREEN) {
  const style = {
    font: { bold: true, color: { argb: 'FFFFFFFF' } },
    fill,
    alignment: { horizontal: 'center' as const, vertical: 'middle' as const, wrapText: true },
    border: THIN_BORDER,
  }
  for (let r = row1; r <= row2; r++) {
    const row = ws.getRow(r)
    row.height = 28
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if (colNumber >= 1 && colNumber <= cols) {
        cell.font = { ...style.font }
        cell.fill = { ...style.fill }
        cell.alignment = { ...style.alignment }
        cell.border = { ...style.border }
      }
    })
  }
}

function buildSummarySheet(wb: ExcelJS.Workbook, data: ProtocolResponse, judgeScores: JudgeScoresEntry[], opts: ExportOptions) {
  const ws = wb.addWorksheet('Итог', { pageSetup: PAGE_SETUP })
  const judges = data.judges
  const summary = buildSummaryRows(data, judgeScores)
  const awardLabels = opts.awardLabels ?? DEFAULT_AWARD_LABELS

  // Columns: №, Команда, <judge1..N>, ИТОГО, МЕСТО, НАГРАДА
  const totalCols = 2 + judges.length + 3

  const title = opts.title ?? 'Итоговый протокол судейства'
  const subtitle = opts.subtitle ?? `Дата: ${new Date().toLocaleString('ru-RU')} · Судей в базе: ${data.totalJudges}`

  ws.mergeCells(1, 1, 1, totalCols)
  const titleCell = ws.getCell(1, 1)
  titleCell.value = title
  titleCell.font = { size: 16, bold: true }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }

  ws.mergeCells(2, 1, 2, totalCols)
  const subCell = ws.getCell(2, 1)
  subCell.value = subtitle
  subCell.font = { size: 10, italic: true, color: { argb: 'FF666666' } }
  subCell.alignment = { horizontal: 'center', vertical: 'middle' }

  const HEADER_ROW = 4
  const headerVals: (string | number)[] = ['№', 'Наименование проекта']
  for (const j of judges) headerVals.push(shortName(j.fullName))
  headerVals.push('ИТОГО', 'МЕСТО', awardLabels.header)
  ws.getRow(HEADER_ROW).values = headerVals

  // Style judge headers with green fill, ИТОГО green, МЕСТО + НАГРАДА amber
  const hrow = ws.getRow(HEADER_ROW)
  hrow.height = 32
  hrow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    cell.border = THIN_BORDER
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    if (colNumber === totalCols || colNumber === totalCols - 1) cell.fill = HEADER_AMBER
    else cell.fill = HEADER_GREEN
  })

  const placeCol = totalCols - 1
  const awardCol = totalCols

  const startRow = HEADER_ROW + 1
  summary.forEach((r, i) => {
    const row = ws.getRow(startRow + i)
    const awardText = r.award ? awardLabels[r.award] : ''
    const displayName = formatTeamForSpreadsheet(r.teamName)
    const values: (string | number)[] = [i + 1, displayName]
    for (const j of judges) values.push(r.byJudge[j.id] ?? 0)
    values.push(r.grandTotal)
    values.push(fmtPlace(r.place) as string | number)
    values.push(awardText)
    row.values = values
    // Give wrapped project names enough vertical room (≈ 2 lines at col width 34).
    const nameLen = displayName.length
    if (displayName.includes('\n')) row.height = Math.min(72, 36 + Math.ceil(nameLen / 40) * 12)
    else if (nameLen > 34) row.height = Math.min(60, 18 + Math.ceil(nameLen / 34) * 14)
    const isAbsent = r.status === 'absent'
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = THIN_BORDER
      cell.alignment = colNumber === 2
        ? { horizontal: 'left', vertical: 'middle', wrapText: true }
        : { horizontal: 'center', vertical: 'middle' }
      if (isAbsent) cell.fill = ABSENT_FILL
    })
    row.getCell(2).font = { bold: true }
    row.getCell(2 + judges.length + 1).font = { bold: true } // ИТОГО
    row.getCell(placeCol).font = { bold: true, color: { argb: 'FF92400E' } } // МЕСТО amber

    // Absent / non-participating teams: mark place column, leave award empty
    if (isAbsent || r.grandTotal === 0) {
      row.getCell(placeCol).value = 'не участ'
      row.getCell(placeCol).font = { italic: true, color: { argb: 'FF92400E' } }
      row.getCell(awardCol).value = ''
    }

    // Award cell styling (only for top-4 integer places)
    if (r.award) {
      const fill = AWARD_FILLS[r.award]
      const fontColor = AWARD_FONT[r.award]
      row.getCell(awardCol).fill = { type: 'pattern', pattern: 'solid', fgColor: fill }
      row.getCell(awardCol).font = {
        bold: true,
        color: fontColor,
        size: r.award === 'grandPrix' ? 12 : 11,
      }
    }
  })

  // Column widths
  const widths: Partial<ExcelJS.Column>[] = [{ width: 5 }, { width: 34 }]
  for (let i = 0; i < judges.length; i++) widths.push({ width: 14 })
  widths.push({ width: 12 })
  widths.push({ width: 12 })
  widths.push({ width: 16 })
  ws.columns = widths

  // Microsoft Excel: автофильтр по шапке — в заголовке колонок появляются «▼»;
  // в Excel — «Сортировка и фильтр» → по убыванию для «ИТОГО» и т.д. (как в приложении, но порядок меняет пользователь)
  if (summary.length > 0) {
    const lastDataRow = HEADER_ROW + summary.length
    ws.autoFilter = {
      from: { row: HEADER_ROW, column: 1 },
      to: { row: lastDataRow, column: totalCols },
    }
  }

  // Signatures
  const signStart = startRow + summary.length + 3
  ws.mergeCells(signStart, 1, signStart, totalCols)
  const signTitle = ws.getCell(signStart, 1)
  signTitle.value = 'Подписи членов жюри:'
  signTitle.font = { bold: true, size: 11 }
  signTitle.alignment = { horizontal: 'left', vertical: 'middle' }

  judges.forEach((j, i) => {
    const row = signStart + 2 + i
    ws.getCell(row, 2).value = `${i + 1}.`
    ws.getCell(row, 2).alignment = { horizontal: 'right' }
    ws.mergeCells(row, 3, row, Math.max(3, Math.floor(totalCols / 2)))
    const name = ws.getCell(row, 3)
    name.value = j.fullName
    name.alignment = { horizontal: 'left', vertical: 'middle' }
    name.font = { size: 11 }
    const sigStartCol = Math.max(4, Math.floor(totalCols / 2) + 1)
    ws.mergeCells(row, sigStartCol, row, totalCols - 1)
    const sig = ws.getCell(row, sigStartCol)
    sig.value = ''
    sig.border = { bottom: { style: 'thin' } }
    ws.getCell(row, totalCols).value = '(подпись)'
    ws.getCell(row, totalCols).font = { italic: true, size: 9, color: { argb: 'FF888888' } }
    ws.getCell(row, totalCols).alignment = { horizontal: 'center' }
  })

  ws.pageSetup.printTitlesRow = `${HEADER_ROW}:${HEADER_ROW}`
  ws.views = [{ state: 'frozen', ySplit: HEADER_ROW, xSplit: 2 }]
}

function buildJudgeSheet(
  wb: ExcelJS.Workbook,
  entry: JudgeScoresEntry,
  criteriaLabels: [string, string, string, string, string],
) {
  const label = shortName(entry.judge.fullName).slice(0, 31)
  const ws = wb.addWorksheet(label, { pageSetup: PAGE_SETUP })

  ws.mergeCells('A1:I1')
  const titleCell = ws.getCell('A1')
  titleCell.value = `Оценки: ${entry.judge.fullName}`
  titleCell.font = { size: 14, bold: true }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }

  ws.mergeCells('A2:I2')
  const subCell = ws.getCell('A2')
  subCell.value = `@${entry.judge.username} · ${new Date().toLocaleString('ru-RU')}`
  subCell.font = { size: 10, italic: true, color: { argb: 'FF666666' } }
  subCell.alignment = { horizontal: 'center', vertical: 'middle' }

  const H1 = 4, H2 = 5

  ws.getRow(H1).values = ['№', 'Наименование проекта', 'Критерии', null, null, null, null, 'Итого', 'Статус']
  ws.mergeCells(H1, 3, H1, 7)
  ws.mergeCells(H1, 1, H2, 1)
  ws.mergeCells(H1, 2, H2, 2)
  ws.mergeCells(H1, 8, H2, 8)
  ws.mergeCells(H1, 9, H2, 9)
  ws.getRow(H2).values = [null, null, ...criteriaLabels, null, null]
  ws.getRow(H2).height = 44
  applyHeaderStyle(ws, H1, H2, 9, HEADER_BLUE)

  const startRow = H2 + 1
  entry.scores.forEach((r: JudgeScoreRow, i: number) => {
    const row = ws.getRow(startRow + i)
    const hasScore = r.total > 0
    const displayName = formatTeamForSpreadsheet(r.teamName)
    row.values = [
      i + 1, displayName,
      hasScore ? r.c1 : '—',
      hasScore ? r.c2 : '—',
      hasScore ? r.c3 : '—',
      hasScore ? r.c4 : '—',
      hasScore ? r.c5 : '—',
      hasScore ? r.total : 0,
      r.status === 'absent' ? 'Не участвует' : 'Участвует',
    ]
    const nameLen = displayName.length
    if (displayName.includes('\n')) row.height = Math.min(72, 36 + Math.ceil(nameLen / 42) * 12)
    else if (nameLen > 42) row.height = Math.min(60, 18 + Math.ceil(nameLen / 42) * 14)
    const isAbsent = r.status === 'absent'
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = THIN_BORDER
      cell.alignment = colNumber === 2
        ? { horizontal: 'left', vertical: 'middle', wrapText: true }
        : { horizontal: 'center', vertical: 'middle' }
      if (isAbsent) cell.fill = ABSENT_FILL
    })
    row.getCell(2).font = { bold: true }
    if (hasScore) {
      row.getCell(8).font = { bold: true }
    }
  })

  ws.columns = COL_WIDTHS_JUDGE
  ws.pageSetup.printTitlesRow = `${H1}:${H2}`
}

export async function exportProtocolToXlsx(
  data: ProtocolResponse,
  judgeScores: JudgeScoresEntry[],
  opts: ExportOptions = {},
): Promise<void> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Artisan Judge'
  wb.created = new Date()

  const criteriaLabels = opts.criteriaLabels ?? DEFAULT_CRITERIA_LABELS

  // Per-judge sheets first (matches screenshot tab order: judges then Итог at the end)
  for (const entry of judgeScores) {
    buildJudgeSheet(wb, entry, criteriaLabels)
  }
  buildSummarySheet(wb, data, judgeScores, opts)

  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const fileName = opts.fileName ?? `protocol-${new Date().toISOString().slice(0, 10)}.xlsx`
  saveAs(blob, fileName)
}

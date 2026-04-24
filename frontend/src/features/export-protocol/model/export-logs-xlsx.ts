import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import type { AuditLog } from '@shared/api'
import { formatTeamForSpreadsheet } from '@shared/utils/team-bilingual-name'

export interface ExportLogsColumnLabels {
  id: string
  timestamp: string
  judge: string
  username: string
  project: string
  criterion: string
  oldValue: string
  newValue: string
}

export async function exportAuditLogsToXlsx(
  logs: AuditLog[],
  criterionLabel: Record<string, string>,
  cols: ExportLogsColumnLabels,
  fileName?: string,
): Promise<void> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Artisan Judge'
  wb.created = new Date()

  const ws = wb.addWorksheet('Журнал', {
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  })

  const headerFill = {
    type: 'pattern' as const,
    pattern: 'solid' as const,
    fgColor: { argb: 'FF28CA9E' },
  }
  const thin = {
    top: { style: 'thin' as const },
    left: { style: 'thin' as const },
    bottom: { style: 'thin' as const },
    right: { style: 'thin' as const },
  }

  const headers = [cols.id, cols.timestamp, cols.judge, cols.username, cols.project, cols.criterion, cols.oldValue, cols.newValue]
  const h = ws.addRow(headers)
  h.height = 26
  h.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = headerFill
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    cell.border = thin
  })

  for (const log of logs) {
    const crit = criterionLabel[log.field] || log.field
    const row = ws.addRow([
      log.id,
      log.timestamp,
      log.fullName,
      log.username,
      formatTeamForSpreadsheet(log.teamName),
      crit,
      log.oldValue === null ? '—' : log.oldValue,
      log.newValue,
    ])
    row.eachCell((cell, col) => {
      cell.border = thin
      if (col === 5) {
        cell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true }
      } else {
        cell.alignment = { horizontal: col === 1 || col === 8 ? 'center' : 'left', vertical: 'top', wrapText: true }
      }
    })
  }

  ws.columns = [
    { width: 8 },
    { width: 22 },
    { width: 28 },
    { width: 14 },
    { width: 48 },
    { width: 22 },
    { width: 10 },
    { width: 10 },
  ]

  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const name = fileName ?? `audit-log-${new Date().toISOString().slice(0, 10)}.xlsx`
  saveAs(blob, name)
}

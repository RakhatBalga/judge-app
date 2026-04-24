import { http } from './client'

export interface ProtocolRow {
  teamId: number
  teamName: string
  status: 'active' | 'absent'
  avgC1: number | null
  avgC2: number | null
  avgC3: number | null
  avgC4: number | null
  avgC5: number | null
  avgTotal: number | null
  judgesVoted: number
}

export interface ProtocolJudge {
  id: number
  username: string
  fullName: string
}

export interface ProtocolResponse {
  rows: ProtocolRow[]
  judges: ProtocolJudge[]
  totalJudges: number
}

export interface AuditLog {
  id: number
  timestamp: string
  userId: number
  username: string
  fullName: string
  teamId: number
  teamName: string
  field: string
  oldValue: number | null
  newValue: number
}

export async function fetchProtocol(): Promise<ProtocolResponse> {
  const { data } = await http.get<ProtocolResponse>('/analytics/protocol')
  return data
}

export interface JudgeScoreRow {
  teamId: number
  teamName: string
  status: 'active' | 'absent'
  c1: number
  c2: number
  c3: number
  c4: number
  c5: number
  total: number
}

export interface JudgeScoresEntry {
  judge: ProtocolJudge
  scores: JudgeScoreRow[]
}

export async function fetchJudgeScores(): Promise<JudgeScoresEntry[]> {
  const { data } = await http.get<{ judges: JudgeScoresEntry[] }>('/analytics/judge-scores')
  return data.judges
}

export async function fetchLogs(limit = 500): Promise<AuditLog[]> {
  const { data } = await http.get<{ logs: AuditLog[] }>('/analytics/logs', { params: { limit } })
  return data.logs
}

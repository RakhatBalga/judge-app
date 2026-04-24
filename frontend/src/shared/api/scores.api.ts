import { http } from './client'
import type { ApiMyScore } from './teams.api'

export interface UpsertScoreRequest {
  teamId: number
  c1: number
  c2: number
  c3: number
  c4: number
  c5: number
}

export async function upsertScoreRequest(req: UpsertScoreRequest): Promise<ApiMyScore> {
  const { data } = await http.post<{ ok: boolean; score: ApiMyScore }>('/scores', req)
  return data.score
}

import { http } from './client'

export interface ApiMyScore {
  c1: number
  c2: number
  c3: number
  c4: number
  c5: number
  total: number
  updatedAt: string
}

export interface ApiTeam {
  id: number
  name: string
  description: string
  status: 'active' | 'absent'
  myScore?: ApiMyScore
}

export async function fetchTeams(): Promise<ApiTeam[]> {
  const { data } = await http.get<{ teams: ApiTeam[] }>('/teams')
  return data.teams
}

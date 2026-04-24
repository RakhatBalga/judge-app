export interface Team {
  id: number
  name: string
  description?: string
  status?: 'active' | 'absent'
}

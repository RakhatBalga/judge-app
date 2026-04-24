import { http } from './client'

export type UserRole = 'admin' | 'judge'

export interface AuthUser {
  id: number
  username: string
  fullName: string
  role: UserRole
}

export interface LoginResponse {
  token: string
  user: AuthUser
}

export async function loginRequest(username: string, password: string): Promise<LoginResponse> {
  const { data } = await http.post<LoginResponse>('/auth/login', { username, password })
  return data
}

export async function meRequest(): Promise<AuthUser> {
  const { data } = await http.get<AuthUser>('/auth/me')
  return data
}

export function encodeJwt(payload: object): string {
  return `mock.${encodeURIComponent(JSON.stringify(payload))}.sig`
}

export function decodeJwt<T>(token: string): T | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    return JSON.parse(decodeURIComponent(parts[1])) as T
  } catch {
    return null
  }
}

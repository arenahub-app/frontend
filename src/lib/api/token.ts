let accessToken: string | null = null

export const setToken = (token: string | null) => {
  accessToken = token
}

export const getToken = () => accessToken

export function getCurrentUserId(): string | null {
  const token = getToken()
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.sub ?? null
  } catch {
    return null
  }
}

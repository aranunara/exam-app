const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : '/api/v1'

type RequestOptions = {
  method?: string
  body?: unknown
  params?: Record<string, string>
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, params } = options
  const url = new URL(`${API_BASE}${path}`, window.location.origin)

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  const token = await getAuthToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error((error as { error: string }).error || `HTTP ${response.status}`)
  }

  return response.json() as Promise<T>
}

let tokenGetter: (() => Promise<string | null>) | null = null

export function setAuthTokenGetter(getter: () => Promise<string | null>) {
  tokenGetter = getter
}

async function getAuthToken(): Promise<string | null> {
  if (tokenGetter) {
    return tokenGetter()
  }
  return null
}

export const api = {
  get: <T>(path: string, params?: Record<string, string>) =>
    request<T>(path, { params }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

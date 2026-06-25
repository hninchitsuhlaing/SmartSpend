const BASE_URL = '/api'

function getToken() {
  return localStorage.getItem('access_token')
}

async function request(method, path, body = null, opts = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const config = { method, headers, ...opts }
  if (body) config.body = JSON.stringify(body)

  const res = await fetch(`${BASE_URL}${path}`, config)

  if (res.status === 401) {
    // Try refresh
    const refreshToken = localStorage.getItem('refresh_token')
    if (refreshToken) {
      const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`,
        },
      })
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json()
        localStorage.setItem('access_token', refreshData.data.access_token)
        // Retry original request
        config.headers['Authorization'] = `Bearer ${refreshData.data.access_token}`
        const retryRes = await fetch(`${BASE_URL}${path}`, config)
        return retryRes.json()
      } else {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
        return
      }
    }
  }

  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Request failed')
  return data
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  delete: (path) => request('DELETE', path),
}

export default api

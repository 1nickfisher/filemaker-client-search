export type Backend = 'csv' | 'mongo'

function envDefaultBackend(): Backend {
  const env = (process.env.NEXT_PUBLIC_USE_MONGO || '').toLowerCase()
  return env === '1' || env === 'true' ? 'mongo' : 'csv'
}

export function getSelectedBackend(): Backend {
  if (typeof window === 'undefined') return envDefaultBackend()
  const stored = window.localStorage.getItem('fm_backend')
  if (stored === 'mongo' || stored === 'csv') return stored
  return envDefaultBackend()
}

export function setSelectedBackend(backend: Backend) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem('fm_backend', backend)
}


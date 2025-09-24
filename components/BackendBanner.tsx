import { useEffect, useState } from 'react'
import { getSelectedBackend, setSelectedBackend, type Backend } from '@/utils/frontendBackend'

type Props = {
  onChange?: (backend: Backend) => void
}

export default function BackendBanner({ onChange }: Props) {
  const [backend, setBackend] = useState<Backend>('csv')

  useEffect(() => {
    const b = getSelectedBackend()
    setBackend(b)
  }, [])

  const toggle = () => {
    const next: Backend = backend === 'csv' ? 'mongo' : 'csv'
    setSelectedBackend(next)
    setBackend(next)
    onChange?.(next)
  }

  const label = backend === 'mongo' ? 'MongoDB' : 'CSV'
  const bg = backend === 'mongo' ? '#E6FFFA' : '#FFFBE6'
  const fg = backend === 'mongo' ? '#0F766E' : '#92400E'

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 12px',
      borderRadius: 8,
      border: '1px solid #e5e7eb',
      background: '#fff',
      marginBottom: 16
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontWeight: 600 }}>Backend:</span>
        <span style={{
          padding: '2px 8px',
          borderRadius: 999,
          background: bg,
          color: fg,
          border: `1px solid ${backend === 'mongo' ? '#99F6E4' : '#FDE68A'}`,
          fontSize: 12,
        }}>{label}</span>
      </div>
      <button onClick={toggle} style={{
        padding: '6px 10px',
        borderRadius: 6,
        border: '1px solid #e5e7eb',
        background: '#f9fafb',
        cursor: 'pointer'
      }}>
        Switch to {backend === 'mongo' ? 'CSV' : 'MongoDB'}
      </button>
    </div>
  )
}


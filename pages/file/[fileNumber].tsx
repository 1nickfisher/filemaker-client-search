import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import Head from 'next/head'
import styles from '@/styles/FileDetails.module.css'

interface SearchResult {
  fileNumber: string
  type: 'client' | 'provider' | 'session'
  name?: string
  details: Record<string, any>
}

export default function FileDetails() {
  const router = useRouter()
  const { fileNumber } = router.query
  const [data, setData] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!fileNumber) return

    const fetchFileData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const endpoint = '/api/search'
        const backend = getSelectedBackend()
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Backend': backend,
          },
          body: JSON.stringify({ query: fileNumber }),
        })

        if (!response.ok) {
          throw new Error('Failed to fetch file data')
        }

        const result = await response.json()

        // Filter results to only include those with matching file number
        const filteredResults = result.results.filter(
          (r: SearchResult) => r.fileNumber === fileNumber
        )

        setData(filteredResults)
      } catch (err) {
        console.error('Error fetching file details:', err)
        setError('Failed to load file details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchFileData()
  }, [fileNumber])

  if (isLoading) {
    return (
      <div className={styles.container}>
        <p>Loading file details...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <p className={styles.error}>{error}</p>
        <button onClick={() => router.back()}>Go Back</button>
      </div>
    )
  }

  // Organize data by type
  const clientData = data.filter(d => d.type === 'client')
  const providerData = data.filter(d => d.type === 'provider')
  const sessionData = data.filter(d => d.type === 'session')

  // Get client name for display
  const clientInfo = clientData[0]
  let displayName = 'Unknown Client'

  if (clientInfo) {
    if (clientInfo.name) {
      displayName = clientInfo.name
    } else if (clientInfo.details?.['File Name']) {
      displayName = clientInfo.details['File Name']
    }
  }

  return (
    <>
      <Head>
        <title>File #{fileNumber} - {displayName}</title>
        <meta name="description" content={`Details for file ${fileNumber}`} />
      </Head>

      <div className={styles.container}>
        <div style={{ marginBottom: 12 }}>
          <BackendBanner />
        </div>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => router.back()}>
            ← Back to Search
          </button>
          <h1>File #{fileNumber}</h1>
          <h2>{displayName}</h2>
        </div>

        {/* Client Information Section */}
        {clientData.length > 0 && (
          <div className={styles.section}>
            <h3>Client Information</h3>
            {clientData.map((client, idx) => (
              <div key={idx} className={styles.infoCard}>
                {Object.entries(client.details).map(([key, value]) => {
                  // Skip internal fields and empty values
                  if (key.startsWith('_') || !value || value === '') return null

                  // Handle arrays (like clientNames)
                  if (Array.isArray(value)) {
                    return (
                      <div key={key} className={styles.field}>
                        <strong>{key}:</strong>
                        <ul>
                          {value.map((item, i) => (
                            <li key={i}>{String(item)}</li>
                          ))}
                        </ul>
                      </div>
                    )
                  }

                  return (
                    <div key={key} className={styles.field}>
                      <strong>{key}:</strong> {String(value)}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}

        {/* Provider Information Section */}
        {providerData.length > 0 && (
          <div className={styles.section}>
            <h3>Provider Information</h3>
            {providerData.map((provider, idx) => (
              <div key={idx} className={styles.infoCard}>
                {provider.name && (
                  <div className={styles.providerName}>{provider.name}</div>
                )}
                {Object.entries(provider.details).map(([key, value]) => {
                  if (!value || value === '') return null

                  return (
                    <div key={key} className={styles.field}>
                      <strong>{key}:</strong> {String(value)}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}

        {/* Session History Section */}
        {sessionData.length > 0 && (
          <div className={styles.section}>
            <h3>Session History ({sessionData.length} sessions)</h3>
            <div className={styles.sessionList}>
              {sessionData.map((session, idx) => (
                <div key={idx} className={styles.sessionCard}>
                  {Object.entries(session.details).map(([key, value]) => {
                    if (!value || value === '') return null

                    return (
                      <div key={key} className={styles.field}>
                        <strong>{key}:</strong> {String(value)}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Data Message */}
        {data.length === 0 && !isLoading && (
          <div className={styles.noData}>
            <p>No data found for file #{fileNumber}</p>
          </div>
        )}
      </div>
    </>
  )
}
import BackendBanner from '@/components/BackendBanner'
import { getSelectedBackend } from '@/utils/frontendBackend'

import React from 'react'
import styles from '@/styles/SearchResults.module.css'

// Define types for the search results
interface ClientDetails {
  dob?: string
  address?: string
  phone?: string
  [key: string]: any
}

interface SessionDetails {
  date?: string
  provider?: string
  notes?: string
  status?: string
  [key: string]: any
}

interface ProviderDetails {
  specialty?: string
  location?: string
  [key: string]: any
}

type Details = ClientDetails | SessionDetails | ProviderDetails

interface SearchResult {
  fileNumber: string
  type: 'client' | 'provider' | 'session'
  name?: string
  details: Details
}

interface SearchResultsProps {
  results: SearchResult[]
}

const SearchResults: React.FC<SearchResultsProps> = ({ results }) => {
  if (!results || results.length === 0) {
    return <div className={styles.noResults}>No results found</div>
  }

  // Group results by file number
  const groupedResults = results.reduce<Record<string, SearchResult[]>>((acc, result) => {
    if (!acc[result.fileNumber]) {
      acc[result.fileNumber] = []
    }
    acc[result.fileNumber].push(result)
    return acc
  }, {})

  return (
    <div className={styles.resultsContainer}>
      {Object.entries(groupedResults).map(([fileNumber, fileResults]) => (
        <div key={fileNumber} className={styles.fileGroup}>
          <h2 className={styles.fileNumber}>File Number: {fileNumber}</h2>
          
          {/* Display client information first if available */}
          {fileResults.filter(r => r.type === 'client').map((client, idx) => (
            <div key={idx} className={styles.clientInfo}>
              <h3>{client.name || 'Client'}</h3>
              <div className={styles.detailsGrid}>
                {Object.entries(client.details).map(([key, value]) => (
                  <div key={key} className={styles.detailItem}>
                    <span className={styles.detailLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}:</span>
                    <span className={styles.detailValue}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {/* Display provider information if available */}
          {fileResults.filter(r => r.type === 'provider').map((provider, idx) => (
            <div key={idx} className={styles.providerInfo}>
              <h3>{provider.name || 'Provider'}</h3>
              <div className={styles.detailsGrid}>
                {Object.entries(provider.details).map(([key, value]) => (
                  <div key={key} className={styles.detailItem}>
                    <span className={styles.detailLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}:</span>
                    <span className={styles.detailValue}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {/* Display session information */}
          {fileResults.filter(r => r.type === 'session').length > 0 && (
            <div className={styles.sessionsInfo}>
              <h3>Session History</h3>
              <div className={styles.sessions}>
                {fileResults.filter(r => r.type === 'session').map((session, idx) => (
                  <div key={idx} className={styles.sessionItem}>
                    <div className={styles.sessionHeader}>
                      <span className={styles.sessionDate}>{session.details.date || 'N/A'}</span>
                      <span className={styles.sessionStatus}>{session.details.status || 'N/A'}</span>
                    </div>
                    <div className={styles.sessionDetails}>
                      {Object.entries(session.details).map(([key, value]) => {
                        if (key !== 'date' && key !== 'status') {
                          return (
                            <div key={key} className={styles.detailItem}>
                              <span className={styles.detailLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}:</span>
                              <span className={styles.detailValue}>{value}</span>
                            </div>
                          )
                        }
                        return null
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default SearchResults
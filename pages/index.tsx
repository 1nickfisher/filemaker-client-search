import Head from 'next/head'
import { useState } from 'react'
import styles from '@/styles/Home.module.css'
import SearchResults from '@/components/SearchResults'

interface SearchResult {
  fileNumber: string
  type: 'client' | 'provider' | 'session'
  name?: string
  details: Record<string, any>
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!searchQuery.trim()) return
    
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
      })
      
      const data = await response.json()
      
      if (data.error) {
        console.error('Search error:', data.error)
        setSearchResults([])
      } else {
        setSearchResults(data.results)
      }
    } catch (error) {
      console.error('Error searching:', error)
      setSearchResults([])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Client Search Application</title>
        <meta name="description" content="Search client, provider, and session history information" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>Client Database Search</h1>
          <p className={styles.description}>
            Search for clients, providers, and session history information
          </p>
        </div>
        
        <div className={styles.searchContainer}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, file number, or provider..."
              className={styles.searchInput}
            />
            <button type="submit" className={styles.searchButton} disabled={isLoading}>
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>
        
        <div className={styles.resultsContainer}>
          {isLoading ? (
            <p>Loading results...</p>
          ) : searchResults.length > 0 ? (
            <SearchResults results={searchResults} />
          ) : searchQuery && !isLoading ? (
            <p>No results found. Try a different search term.</p>
          ) : null}
        </div>
      </main>
    </>
  )
}
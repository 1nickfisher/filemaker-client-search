import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import FileDetails from '@/components/FileDetails'
import styles from '@/styles/FileDetailsPage.module.css'

// Type definitions to match our components
interface SearchResult {
  fileNumber: string
  type: 'client' | 'provider' | 'session'
  name?: string
  details: Record<string, any>
}

export default function FileDetailsPage() {
  const router = useRouter()
  const { fileNumber } = router.query
  
  const [loading, setLoading] = useState(true)
  const [fileData, setFileData] = useState<SearchResult[]>([])
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    // Only fetch when we have a fileNumber
    if (fileNumber) {
      fetchFileData(fileNumber as string)
    }
  }, [fileNumber])
  
  const fetchFileData = async (fileNum: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileNumber: fileNum }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setFileData(data.results)
      } else {
        setError(data.error || 'An error occurred while fetching file data')
      }
    } catch (err) {
      console.error('Error fetching file data:', err)
      setError('Failed to fetch file data. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <>
      <Head>
        <title>{fileNumber ? `File #${fileNumber}` : 'File Details'} | Client Search</title>
        <meta name="description" content="View detailed file information" />
      </Head>
      
      <div className={styles.container}>
        <div className={styles.header}>
          <Link href="/" className={styles.backLink}>
            &larr; Back to Search
          </Link>
        </div>
        
        {loading ? (
          <div className={styles.loading}>Loading file details...</div>
        ) : error ? (
          <div className={styles.error}>
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={() => router.push('/')} className={styles.returnButton}>
              Return to Search
            </button>
          </div>
        ) : fileData.length > 0 ? (
          <FileDetails fileData={fileData} />
        ) : (
          <div className={styles.notFound}>
            <h2>File Not Found</h2>
            <p>The requested file could not be found.</p>
            <button onClick={() => router.push('/')} className={styles.returnButton}>
              Return to Search
            </button>
          </div>
        )}
      </div>
    </>
  )
}
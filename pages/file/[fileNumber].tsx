import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import FileDetails from '@/components/FileDetails';
import styles from '@/styles/FileDetailsPage.module.css';

interface FileData {
  client: Record<string, any>;
  providers: Record<string, any>[];
  sessions: Record<string, any>[];
}

const FileDetailsPage: React.FC = () => {
  const router = useRouter();
  const { fileNumber } = router.query;
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [fileData, setFileData] = useState<FileData | null>(null);
  
  useEffect(() => {
    if (!fileNumber) return;
    
    const fetchFileData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/file', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fileNumber }),
        });
        
        if (!response.ok) {
          throw new Error(`Error fetching file data: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        
        setFileData(data);
      } catch (err) {
        console.error('Error fetching file data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFileData();
  }, [fileNumber]);
  
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <p>Loading file data...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Error Loading File</h2>
          <p>{error}</p>
          <Link href="/" className={styles.returnButton}>
            Return to Search
          </Link>
        </div>
      </div>
    );
  }
  
  if (!fileData) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h2>File Not Found</h2>
          <p>The requested file could not be found.</p>
          <Link href="/" className={styles.returnButton}>
            Return to Search
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <Link href="/" className={styles.backLink}>
        &larr; Back to Search
      </Link>
      <FileDetails fileNumber={fileNumber as string} fileData={fileData} />
    </div>
  );
};

export default FileDetailsPage;
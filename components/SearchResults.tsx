import React from 'react';
import { useRouter } from 'next/router';
import styles from '@/styles/SearchResults.module.css';

interface SearchResult {
  fileNumber: string;
  type: 'client' | 'provider' | 'session';
  name?: string;
  details: Record<string, any>;
}

interface SearchResultsProps {
  results: SearchResult[];
}

const SearchResults: React.FC<SearchResultsProps> = ({ results }) => {
  const router = useRouter();
  
  if (!results || results.length === 0) {
    return <div className={styles.noResults}>No results found.</div>;
  }

  // Group results by file number
  const fileGroups: Record<string, SearchResult[]> = {};
  
  results.forEach(result => {
    if (!fileGroups[result.fileNumber]) {
      fileGroups[result.fileNumber] = [];
    }
    fileGroups[result.fileNumber].push(result);
  });

  // Function to get all client results for a file
  const getClientResults = (fileResults: SearchResult[]) => {
    return fileResults.filter(result => result.type === 'client');
  };

  // Function to get all provider results for a file
  const getProviderResults = (fileResults: SearchResult[]) => {
    return fileResults.filter(result => result.type === 'provider');
  };

  // Function to get all session results for a file
  const getSessionResults = (fileResults: SearchResult[]) => {
    return fileResults.filter(result => result.type === 'session');
  };

  // Function to navigate to the file details page
  const handleFileClick = (fileNumber: string) => {
    router.push(`/file/${fileNumber}`);
  };

  // Extract clients, providers, and important dates for each file
  const fileCards = Object.entries(fileGroups).map(([fileNumber, fileResults]) => {
    const clientResults = getClientResults(fileResults);
    const providerResults = getProviderResults(fileResults);
    const sessionResults = getSessionResults(fileResults);
    
    // Get client names
    let clientNames: string[] = [];
    const clientResult = clientResults[0]; // Get the first client result
    
    if (clientResult?.details?.clientNames) {
      // If we have client names from the CSV data, use those
      clientNames = clientResult.details.clientNames;
    } else if (clientResult?.name) {
      // Fallback to the name property if available
      clientNames = [clientResult.name];
    }
    
    // Get provider names
    const providerNames = providerResults
      .map(provider => provider.name)
      .filter(Boolean) as string[];
    
    // Find intake date and latest session date
    let intakeDate = 'N/A';
    if (providerResults.length > 0) {
      const dates = providerResults
        .map(p => p.details?.intakeDate)
        .filter(Boolean);
      
      if (dates.length > 0) {
        const earliestDate = new Date(Math.min(...dates.map(d => new Date(d).getTime())));
        intakeDate = earliestDate.toLocaleDateString();
      }
    }
    
    let latestSessionDate = 'N/A';
    if (sessionResults.length > 0) {
      const dates = sessionResults
        .map(s => s.details?.date)
        .filter(Boolean);
      
      if (dates.length > 0) {
        const latestDate = new Date(Math.max(...dates.map(d => new Date(d).getTime())));
        latestSessionDate = latestDate.toLocaleDateString();
      }
    }
    
    return (
      <div 
        key={fileNumber} 
        className={styles.fileCard}
        onClick={() => handleFileClick(fileNumber)}
      >
        <div className={styles.fileCardHeader}>
          <div className={styles.fileNumber}>#{fileNumber}</div>
          <div className={styles.fileName}>{
            clientNames.length > 0 
              ? clientNames[0] 
              : 'Unnamed File'
          }</div>
        </div>
        
        <div className={styles.fileCardContent}>
          <div className={styles.clientSection}>
            <div className={styles.sectionLabel}>Client Names:</div>
            <div className={styles.sectionContent}>
              {clientNames.length > 0 ? (
                <ul>
                  {clientNames.map((name, idx) => (
                    <li key={idx}>{name}</li>
                  ))}
                </ul>
              ) : (
                <span className={styles.notAvailable}>Not available</span>
              )}
            </div>
          </div>
          
          <div className={styles.providersSection}>
            <div className={styles.sectionLabel}>Providers:</div>
            <div className={styles.sectionContent}>
              {providerNames.length > 0 ? (
                <ul>
                  {providerNames.map((name, idx) => (
                    <li key={idx}>{name}</li>
                  ))}
                </ul>
              ) : (
                <span className={styles.notAvailable}>Not available</span>
              )}
            </div>
          </div>
          
          <div className={styles.datesSection}>
            <div className={styles.sectionLabel}>Dates:</div>
            <div className={styles.sectionContent}>
              <div><strong>Intake:</strong> {intakeDate}</div>
              <div><strong>Latest Session:</strong> {latestSessionDate}</div>
            </div>
          </div>
        </div>
        
        <div className={styles.fileCardFooter}>
          <div className={styles.sessionCount}>
            {sessionResults.length} {sessionResults.length === 1 ? 'session' : 'sessions'}
          </div>
          <div className={styles.viewDetails}>View Details →</div>
        </div>
      </div>
    );
  });

  return (
    <div className={styles.resultsContainer}>
      {fileCards}
    </div>
  );
};

export default SearchResults;
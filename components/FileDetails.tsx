import React, { useState } from 'react';
import styles from '@/styles/FileDetails.module.css';

// Type definitions
interface ClientDetails {
  clientNames?: string[];
  name?: string;
  [key: string]: any;
}

interface SessionDetails {
  date?: string;
  supervisionGroup?: string;
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  fee?: string;
  notes?: string;
  [key: string]: any;
}

interface ProviderDetails {
  name?: string;
  therapyType?: string;
  intakeDate?: string;
  endDate?: string;
  location?: string;
  status?: string;
  locationDetail?: string;
  [key: string]: any;
}

export interface SearchResult {
  fileNumber: string;
  type: 'client' | 'provider' | 'session';
  name?: string;
  details: Record<string, any>;
}

interface FileDetailsProps {
  fileNumber: string;
  fileData: {
    client?: ClientDetails;
    providers?: ProviderDetails[];
    sessions?: SessionDetails[];
  };
}

const FileDetails: React.FC<FileDetailsProps> = ({ fileNumber, fileData }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'intake' | 'session'>('overview');
  
  // Handle null or undefined fileData
  if (!fileData) {
    return <div className={styles.fileDetailsContainer}>
      <h2>No data available for file #{fileNumber}</h2>
    </div>;
  }
  
  const { client, providers, sessions } = fileData;

  // Get the formatted client names
  const clientNames = client?.clientNames || [];
  
  // Get the most recent session date
  const sortedSessions = [...(sessions || [])].sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  
  const latestSession = sortedSessions.length > 0 ? sortedSessions[0] : null;
  const latestSessionDate = latestSession?.date ? new Date(latestSession.date).toLocaleDateString() : 'N/A';
  
  // Find the earliest intake date from providers
  let earliestIntakeDate = 'N/A';
  if (providers && providers.length > 0) {
    const intakeDates = providers
      .map(p => p.intakeDate)
      .filter(Boolean)
      .map(date => new Date(date as string));
    
    if (intakeDates.length > 0) {
      const earliest = new Date(Math.min(...intakeDates.map(d => d.getTime())));
      earliestIntakeDate = earliest.toLocaleDateString();
    }
  }
  
  // Group sessions by supervision group
  const sessionsByGroup: Record<string, SessionDetails[]> = {};
  
  if (sessions) {
    sessions.forEach(session => {
      const group = session.supervisionGroup || 'Unassigned';
      if (!sessionsByGroup[group]) {
        sessionsByGroup[group] = [];
      }
      sessionsByGroup[group].push(session);
    });
  }

  return (
    <div className={styles.fileDetailsContainer}>
      <div className={styles.fileHeader}>
        <h1>File #{fileNumber}</h1>
        {clientNames.length > 0 && (
          <h2>{clientNames.join(', ')}</h2>
        )}
      </div>
      
      <div className={styles.tabs}>
        <button
          className={`${styles.tabButton} ${activeTab === 'overview' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'intake' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('intake')}
        >
          Intake Information
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'session' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('session')}
        >
          Session History
        </button>
      </div>
      
      <div className={styles.tabContent}>
        {activeTab === 'overview' && (
          <div className={styles.overviewTab}>
            <div className={styles.overviewSection}>
              <div className={styles.clientSection}>
                <h3>Client Information</h3>
                {clientNames.length > 0 ? (
                  <ul>
                    {clientNames.map((name, index) => (
                      <li key={index}>{name}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No client information available</p>
                )}
              </div>
              
              <div className={styles.datesSection}>
                <h3>Important Dates</h3>
                <p><strong>Intake Date:</strong> {earliestIntakeDate}</p>
                <p><strong>Latest Session:</strong> {latestSessionDate}</p>
              </div>
              
              <div className={styles.providersSection}>
                <h3>Providers</h3>
                {providers && providers.length > 0 ? (
                  <ul>
                    {providers.map((provider, index) => (
                      <li key={index}>
                        {provider.name} 
                        {provider.therapyType && ` - ${provider.therapyType}`}
                        {provider.status && ` (${provider.status})`}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No provider information available</p>
                )}
              </div>
            </div>
            
            <div className={styles.supervisorsSection}>
              <h3>Supervision Groups</h3>
              {Object.keys(sessionsByGroup).length > 0 ? (
                <ul>
                  {Object.keys(sessionsByGroup).map(group => (
                    <li key={group}>
                      <strong>{group}</strong> - {sessionsByGroup[group].length} sessions
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No supervision group information available</p>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'intake' && (
          <div className={styles.intakeTab}>
            {client ? (
              <div>
                <h3>Client Intake Details</h3>
                {Object.entries(client)
                  .filter(([key]) => !['clientNames', 'type', 'fileNumber', 'name'].includes(key))
                  .map(([key, value]) => (
                    <div key={key} className={styles.detailItem}>
                      <strong>{key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}:</strong>
                      <span>{value || 'N/A'}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <p>No intake information available</p>
            )}
          </div>
        )}
        
        {activeTab === 'session' && (
          <div className={styles.sessionTab}>
            <h3>Session History</h3>
            {sessions && sessions.length > 0 ? (
              <div className={styles.sessionsContainer}>
                <table className={styles.sessionsTable}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Supervision Group</th>
                      <th>Status</th>
                      <th>Payment</th>
                      <th>Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedSessions.map((session, index) => (
                      <tr key={index}>
                        <td>{session.date ? new Date(session.date).toLocaleDateString() : 'N/A'}</td>
                        <td>{session.supervisionGroup || 'N/A'}</td>
                        <td>{session.status || 'N/A'}</td>
                        <td>{session.paymentStatus || 'N/A'}</td>
                        <td>{session.fee || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No session history available</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileDetails;
import React, { useState } from 'react'
import styles from '@/styles/FileDetails.module.css'

// Type definitions
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
  supervisionGroup?: string
  [key: string]: any
}

interface ProviderDetails {
  specialty?: string
  location?: string
  therapyType?: string
  locationDetail?: string
  intakeDate?: string
  endDate?: string
  [key: string]: any
}

type Details = ClientDetails | SessionDetails | ProviderDetails

interface SearchResult {
  fileNumber: string
  type: 'client' | 'provider' | 'session'
  name?: string
  details: Details
}

interface FileDetailsProps {
  fileData: SearchResult[]
}

const FileDetails: React.FC<FileDetailsProps> = ({ fileData }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'intake' | 'sessions'>('overview')
  
  if (!fileData || fileData.length === 0) {
    return <div className={styles.noData}>No file data available</div>
  }
  
  // Get file number
  const fileNumber = fileData[0].fileNumber
  
  // Group results by type
  const clientData = fileData.filter(item => item.type === 'client')
  const providerData = fileData.filter(item => item.type === 'provider')
  const sessionData = fileData.filter(item => item.type === 'session')
  
  // Get client names
  const clientNames = clientData.map(client => client.name).filter(Boolean) as string[]
  
  // Get provider names
  const providerNames = providerData.map(provider => provider.name).filter(Boolean) as string[]
  
  // Get dates
  const intakeDates = providerData
    .map(provider => provider.details.intakeDate)
    .filter(Boolean) as string[]
  
  const sessionDates = sessionData
    .map(session => session.details.date)
    .filter(Boolean) as string[]
    .map(date => new Date(date))
    .sort((a, b) => b.getTime() - a.getTime())  // Sort in descending order
  
  const latestDate = sessionDates.length > 0 
    ? sessionDates[0].toLocaleDateString() 
    : 'N/A'
  
  const intakeDate = intakeDates.length > 0 ? intakeDates[0] : 'N/A'
  
  // Get therapy types
  const therapyTypes = new Set(
    providerData
      .map(provider => provider.details.therapyType)
      .filter(Boolean) as string[]
  )
  
  // Get locations
  const locations = new Set(
    providerData
      .map(provider => provider.details.location)
      .filter(Boolean) as string[]
  )
  
  // Get location details
  const locationDetails = new Set(
    providerData
      .map(provider => provider.details.locationDetail)
      .filter(Boolean) as string[]
  )
  
  // Get supervision groups
  const supervisionGroups = new Set(
    sessionData
      .map(session => session.details.supervisionGroup)
      .filter(Boolean) as string[]
  )
  
  return (
    <div className={styles.fileDetailsContainer}>
      <div className={styles.fileHeader}>
        <h1 className={styles.fileTitle}>File #{fileNumber}</h1>
        {clientNames.length > 0 && (
          <div className={styles.clientNames}>
            {clientNames.join(', ')}
          </div>
        )}
      </div>
      
      <div className={styles.tabsContainer}>
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
            className={`${styles.tabButton} ${activeTab === 'sessions' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('sessions')}
          >
            Session History
          </button>
        </div>
      </div>
      
      <div className={styles.tabContent}>
        {activeTab === 'overview' && (
          <div className={styles.overviewTab}>
            <div className={styles.overviewGrid}>
              <div className={styles.overviewCard}>
                <h3 className={styles.cardTitle}>File Information</h3>
                <div className={styles.cardContent}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>File Number:</span>
                    <span className={styles.infoValue}>{fileNumber}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>File Type:</span>
                    <span className={styles.infoValue}>
                      {clientNames.length > 1 ? 'Family/Couple File' : 'Individual File'}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Intake Date:</span>
                    <span className={styles.infoValue}>{intakeDate}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Latest Activity:</span>
                    <span className={styles.infoValue}>{latestDate}</span>
                  </div>
                </div>
              </div>
              
              <div className={styles.overviewCard}>
                <h3 className={styles.cardTitle}>Therapy Information</h3>
                <div className={styles.cardContent}>
                  {therapyTypes.size > 0 && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Therapy Type:</span>
                      <span className={styles.infoValue}>
                        {Array.from(therapyTypes).join(', ')}
                      </span>
                    </div>
                  )}
                  {locations.size > 0 && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Location:</span>
                      <span className={styles.infoValue}>
                        {Array.from(locations).join(', ')}
                      </span>
                    </div>
                  )}
                  {locationDetails.size > 0 && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Location Details:</span>
                      <span className={styles.infoValue}>
                        {Array.from(locationDetails).join(', ')}
                      </span>
                    </div>
                  )}
                  {supervisionGroups.size > 0 && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Supervision Groups:</span>
                      <div className={styles.tagsList}>
                        {Array.from(supervisionGroups).map((group, index) => (
                          <span key={index} className={styles.tagItem}>{group}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className={styles.overviewCard}>
                <h3 className={styles.cardTitle}>Providers</h3>
                <div className={styles.cardContent}>
                  {providerNames.length > 0 ? (
                    <ul className={styles.providersList}>
                      {providerNames.map((name, index) => (
                        <li key={index} className={styles.providerItem}>{name}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.noData}>No provider information available</p>
                  )}
                </div>
              </div>
              
              <div className={styles.overviewCard}>
                <h3 className={styles.cardTitle}>Clients</h3>
                <div className={styles.cardContent}>
                  {clientNames.length > 0 ? (
                    <ul className={styles.clientsList}>
                      {clientNames.map((name, index) => (
                        <li key={index} className={styles.clientItem}>{name}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.noData}>No client information available</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'intake' && (
          <div className={styles.intakeTab}>
            {clientData.length > 0 ? (
              <div className={styles.intakeDetails}>
                {clientData.map((client, index) => (
                  <div key={index} className={styles.intakeSection}>
                    {client.name && (
                      <h3 className={styles.intakeName}>{client.name}</h3>
                    )}
                    <div className={styles.intakeGrid}>
                      {Object.entries(client.details).map(([key, value]) => {
                        // Skip name fields as we display them separately
                        if (key.toLowerCase().includes('name') && client.name) return null;
                        
                        return (
                          <div key={key} className={styles.intakeItem}>
                            <span className={styles.intakeLabel}>
                              {key.charAt(0).toUpperCase() + key.slice(1)}:
                            </span>
                            <span className={styles.intakeValue}>{value}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.noData}>No intake information available</p>
            )}
          </div>
        )}
        
        {activeTab === 'sessions' && (
          <div className={styles.sessionsTab}>
            {sessionData.length > 0 ? (
              <div className={styles.sessionsTimeline}>
                {sessionData
                  .sort((a, b) => {
                    const dateA = a.details.date ? new Date(a.details.date.toString()) : new Date(0);
                    const dateB = b.details.date ? new Date(b.details.date.toString()) : new Date(0);
                    return dateB.getTime() - dateA.getTime(); // Sort descending
                  })
                  .map((session, index) => (
                    <div key={index} className={styles.sessionCard}>
                      <div className={styles.sessionHeader}>
                        <div className={styles.sessionDate}>
                          {session.details.date || 'No date'}
                        </div>
                        <div className={styles.sessionStatus}>
                          {session.details.status || 'N/A'}
                        </div>
                      </div>
                      
                      {session.details.supervisionGroup && (
                        <div className={styles.sessionGroup}>
                          <span className={styles.groupLabel}>Supervision Group:</span>
                          <span className={styles.groupValue}>{session.details.supervisionGroup}</span>
                        </div>
                      )}
                      
                      <div className={styles.sessionDetails}>
                        {Object.entries(session.details).map(([key, value]) => {
                          // Skip fields we display separately
                          if (['date', 'status', 'supervisionGroup'].includes(key)) return null;
                          
                          return (
                            <div key={key} className={styles.sessionDetailItem}>
                              <span className={styles.detailLabel}>
                                {key.charAt(0).toUpperCase() + key.slice(1)}:
                              </span>
                              <span className={styles.detailValue}>{value}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className={styles.noData}>No session history available</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default FileDetails
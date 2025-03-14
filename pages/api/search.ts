import type { NextApiRequest, NextApiResponse } from 'next'
import * as csvUtils from '@/utils/csvUtils'

interface SearchResult {
  fileNumber: string
  type: 'client' | 'provider' | 'session'
  name?: string
  details: Record<string, any>
}

type Data = {
  results: SearchResult[]
}

// For development/testing only. In production, we'd load the data from a database
let clientDataCache: csvUtils.ClientRecord[] | null = null
let intakeDataCache: csvUtils.IntakeRecord[] | null = null
let counselorDataCache: csvUtils.CounselorAssignmentRecord[] | null = null
let sessionDataCache: csvUtils.SessionHistoryRecord[] | null = null

async function loadDataIfNeeded() {
  try {
    if (!clientDataCache) {
      clientDataCache = await csvUtils.loadClientData()
      console.log(`Loaded ${clientDataCache.length} client records`)
    }
    
    if (!intakeDataCache) {
      intakeDataCache = await csvUtils.loadIntakeData()
      console.log(`Loaded ${intakeDataCache.length} intake records`)
    }
    
    if (!counselorDataCache) {
      counselorDataCache = await csvUtils.loadCounselorData()
      console.log(`Loaded ${counselorDataCache.length} counselor assignment records`)
    }
    
    if (!sessionDataCache) {
      sessionDataCache = await csvUtils.loadSessionData()
      console.log(`Loaded ${sessionDataCache.length} session history records`)
    }
  } catch (error) {
    console.error('Error loading data:', error)
    throw new Error('Failed to load data')
  }
}

function formatClientName(client: csvUtils.ClientRecord, index: number): string | undefined {
  const firstName = client[`Client${index} First Name`]
  const lastName = client[`Client${index} Last Name`]
  
  if (firstName || lastName) {
    return [firstName, lastName].filter(Boolean).join(' ')
  }
  
  return undefined
}

function getClientNames(client: csvUtils.ClientRecord): string[] {
  const names: string[] = []
  
  for (let i = 1; i <= 4; i++) {
    const name = formatClientName(client, i)
    if (name) {
      names.push(name)
    }
  }
  
  return names
}

function formatProviderName(provider: csvUtils.CounselorAssignmentRecord): string | undefined {
  const firstName = provider['Counselor First Name']
  const lastName = provider['Counselor Last Name']
  
  if (firstName || lastName) {
    return [firstName, lastName].filter(Boolean).join(' ')
  }
  
  return undefined
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { query } = req.body

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query parameter is required' })
    }

    // Load data if not already loaded
    await loadDataIfNeeded()
    
    // Perform search
    const results: SearchResult[] = []
    
    // Ensure all data was loaded
    if (!clientDataCache || !intakeDataCache || !counselorDataCache || !sessionDataCache) {
      throw new Error('Data failed to load')
    }
    
    // Search in client data
    const clientSearchFields = [
      'FILE_NUMBER', 
      'Client1 First Name', 'Client1 Last Name',
      'Client2 First Name', 'Client2 Last Name',
      'Client3 First Name', 'Client3 Last Name',
      'Client4 First Name', 'Client4 Last Name'
    ]
    
    const matchedClients = csvUtils.searchRecords(clientDataCache, query, clientSearchFields)
    
    // Search in intake data - only search by file number initially
    const intakeSearchFields = ['FILE NUMBER']
    const matchedIntakes = csvUtils.searchRecords(intakeDataCache, query, intakeSearchFields)
    
    // Search in counselor data
    const counselorSearchFields = [
      'FILE NUMBER', 
      'Counselor First Name', 
      'Counselor Last Name'
    ]
    
    const matchedCounselors = csvUtils.searchRecords(counselorDataCache, query, counselorSearchFields)
    
    // Search in session data - only search by file number initially
    const sessionSearchFields = ['File Number']
    const matchedSessions = csvUtils.searchRecords(sessionDataCache, query, sessionSearchFields)
    
    // Combine file numbers from all searches
    const fileNumbers = new Set<string>()
    
    matchedClients.forEach(client => fileNumbers.add(client.FILE_NUMBER))
    matchedIntakes.forEach(intake => fileNumbers.add(intake['FILE NUMBER']))
    matchedCounselors.forEach(counselor => fileNumbers.add(counselor['FILE NUMBER']))
    matchedSessions.forEach(session => fileNumbers.add(session['File Number']))
    
    // For each matched file number, gather all relevant information
    for (const fileNumber of fileNumbers) {
      // Find client info
      const clientInfo = clientDataCache.find(client => client.FILE_NUMBER === fileNumber)
      
      if (clientInfo) {
        const clientNames = getClientNames(clientInfo)
        
        results.push({
          fileNumber,
          type: 'client',
          name: clientNames.join(', '),
          details: {
            ...clientInfo
          }
        })
      }
      
      // Find intake info
      const intakeInfo = intakeDataCache.find(intake => intake['FILE NUMBER'] === fileNumber)
      
      if (intakeInfo) {
        // If we already have a client result, add intake details to it
        const existingClient = results.find(r => r.fileNumber === fileNumber && r.type === 'client')
        
        if (existingClient) {
          existingClient.details = {
            ...existingClient.details,
            ...intakeInfo
          }
        } else {
          // Otherwise create a new client result
          results.push({
            fileNumber,
            type: 'client',
            details: intakeInfo
          })
        }
      }
      
      // Find provider/counselor info
      const counselorInfo = counselorDataCache.filter(counselor => counselor['FILE NUMBER'] === fileNumber)
      
      for (const counselor of counselorInfo) {
        const providerName = formatProviderName(counselor)
        
        results.push({
          fileNumber,
          type: 'provider',
          name: providerName,
          details: {
            therapyType: counselor['THERAPY TYPE'],
            intakeDate: counselor['INTAKE DATE'],
            endDate: counselor['END DATE'],
            location: counselor['LOCATION'],
            status: counselor['STATUS'],
            locationDetail: counselor['LOCATION DETAIL']
          }
        })
      }
      
      // Find session history
      const sessionInfo = sessionDataCache.filter(session => session['File Number'] === fileNumber)
      
      for (const session of sessionInfo) {
        results.push({
          fileNumber,
          type: 'session',
          details: {
            date: session['Session Date'],
            supervisionGroup: session['Supervision Group'],
            status: session['Session Status'],
            paymentStatus: session['Session Payment Status'],
            paymentMethod: session['Payment Method'],
            fee: session['Session Fee'],
            notes: session['Session Note']
          }
        })
      }
    }
    
    res.status(200).json({ results })
  } catch (error) {
    console.error('Search error:', error)
    res.status(500).json({ error: 'Error processing search' })
  }
}
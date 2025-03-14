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

// Helper function to extract client names from the File+Client Name.csv data
function getClientNamesFromFileData(fileNumber: string): string[] {
  if (!clientDataCache) return []
  
  const clientRecord = clientDataCache.find(record => record.FILE_NUMBER === fileNumber)
  if (!clientRecord) return []
  
  const names: string[] = []
  
  // Check each client field pair (up to 4 clients per record)
  for (let i = 1; i <= 4; i++) {
    const firstName = clientRecord[`Client${i} First Name`]
    const lastName = clientRecord[`Client${i} Last Name`]
    
    if (firstName || lastName) {
      const fullName = [firstName, lastName].filter(Boolean).join(' ')
      if (fullName.trim()) {
        names.push(fullName)
      }
    }
  }
  
  return names
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { fileNumber } = req.body

    if (!fileNumber || typeof fileNumber !== 'string') {
      return res.status(400).json({ error: 'File number parameter is required' })
    }

    // Load data if not already loaded
    await loadDataIfNeeded()
    
    // Ensure all data was loaded
    if (!clientDataCache || !intakeDataCache || !counselorDataCache || !sessionDataCache) {
      throw new Error('Data failed to load')
    }
    
    const results: SearchResult[] = []
    
    // Get the client names from the File+Client Name.csv
    const clientNames = getClientNamesFromFileData(fileNumber)
    
    // Find the client record in File+Client Name.csv
    const clientRecord = clientDataCache.find(record => record.FILE_NUMBER === fileNumber)
    
    if (clientRecord) {
      results.push({
        fileNumber,
        type: 'client',
        name: clientNames.join(', '), // Join all client names
        details: {
          ...clientRecord,
          clientNames: clientNames // Include names as an array for easier processing
        }
      })
    }
    
    // Find intake info
    const intakeInfo = intakeDataCache.find(intake => intake['FILE NUMBER'] === fileNumber)
    
    if (intakeInfo) {
      if (results.find(r => r.fileNumber === fileNumber && r.type === 'client')) {
        // Add to existing client record
        const existingClient = results.find(r => r.fileNumber === fileNumber && r.type === 'client')!
        existingClient.details = {
          ...existingClient.details,
          ...intakeInfo
        }
      } else {
        // Create a new client record
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
      // Format provider name
      let providerName = ''
      if (counselor['Counselor First Name'] || counselor['Counselor Last Name']) {
        providerName = [counselor['Counselor First Name'], counselor['Counselor Last Name']]
          .filter(Boolean)
          .join(' ')
      }
      
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
    
    if (results.length === 0) {
      return res.status(404).json({ error: `File number ${fileNumber} not found` })
    }
    
    res.status(200).json({ results })
  } catch (error) {
    console.error('File lookup error:', error)
    res.status(500).json({ error: 'Error processing file lookup' })
  }
}
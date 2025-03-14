import type { NextApiRequest, NextApiResponse } from 'next'
import * as csvUtils from '@/utils/csvUtils'

interface FileData {
  client: Record<string, any>;
  providers: Record<string, any>[];
  sessions: Record<string, any>[];
}

// For development/testing only. In production, we'd load the data from a database
let clientDataCache: csvUtils.ClientRecord[] | null = null;
let intakeDataCache: csvUtils.IntakeRecord[] | null = null;
let counselorDataCache: csvUtils.CounselorAssignmentRecord[] | null = null;
let sessionDataCache: csvUtils.SessionHistoryRecord[] | null = null;

async function loadDataIfNeeded() {
  try {
    if (!clientDataCache) {
      clientDataCache = await csvUtils.loadClientData();
      console.log(`Loaded ${clientDataCache.length} client records`);
    }
    
    if (!intakeDataCache) {
      intakeDataCache = await csvUtils.loadIntakeData();
      console.log(`Loaded ${intakeDataCache.length} intake records`);
    }
    
    if (!counselorDataCache) {
      counselorDataCache = await csvUtils.loadCounselorData();
      console.log(`Loaded ${counselorDataCache.length} counselor assignment records`);
    }
    
    if (!sessionDataCache) {
      sessionDataCache = await csvUtils.loadSessionData();
      console.log(`Loaded ${sessionDataCache.length} session history records`);
    }
  } catch (error) {
    console.error('Error loading data:', error);
    throw new Error('Failed to load data');
  }
}

// Helper function to get client names from file number
function getClientNamesFromFileData(fileNumber: string): string[] {
  if (!clientDataCache) return [];
  
  const clientRecord = clientDataCache.find(record => record.FILE_NUMBER === fileNumber);
  if (!clientRecord) return [];
  
  return csvUtils.getClientNames(clientRecord);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FileData | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileNumber } = req.body;

    if (!fileNumber || typeof fileNumber !== 'string') {
      return res.status(400).json({ error: 'File number parameter is required' });
    }

    // Load data if not already loaded
    await loadDataIfNeeded();
    
    // Ensure all data was loaded
    if (!clientDataCache || !intakeDataCache || !counselorDataCache || !sessionDataCache) {
      throw new Error('Data failed to load');
    }
    
    // Find client data
    const clientRecord = clientDataCache.find(client => client.FILE_NUMBER === fileNumber);
    const intakeRecord = intakeDataCache.find(intake => intake['FILE NUMBER'] === fileNumber);
    
    // Combine client and intake data
    const clientData = {
      ...(clientRecord || {}),
      ...(intakeRecord || {}),
      // Add client names as an array for easy access
      clientNames: getClientNamesFromFileData(fileNumber)
    };
    
    // Find provider/counselor info
    const providerRecords = counselorDataCache
      .filter(counselor => counselor['FILE NUMBER'] === fileNumber)
      .map(counselor => {
        // Format provider name
        let name = '';
        if (counselor['Counselor First Name'] || counselor['Counselor Last Name']) {
          name = [counselor['Counselor First Name'], counselor['Counselor Last Name']]
            .filter(Boolean)
            .join(' ');
        }
        
        return {
          name,
          therapyType: counselor['THERAPY TYPE'],
          intakeDate: counselor['INTAKE DATE'],
          endDate: counselor['END DATE'],
          location: counselor['LOCATION'],
          status: counselor['STATUS'],
          locationDetail: counselor['LOCATION DETAIL'],
          originalData: counselor  // Keep the original data for reference if needed
        };
      });
    
    // Find session history
    const sessionRecords = sessionDataCache
      .filter(session => session['File Number'] === fileNumber)
      .map(session => ({
        date: session['Session Date'],
        supervisionGroup: session['Supervision Group'],
        status: session['Session Status'],
        paymentStatus: session['Session Payment Status'],
        paymentMethod: session['Payment Method'],
        fee: session['Session Fee'],
        notes: session['Session Note'],
        originalData: session  // Keep the original data for reference if needed
      }));
    
    // Return the combined data
    res.status(200).json({
      client: clientData,
      providers: providerRecords,
      sessions: sessionRecords
    });
  } catch (error) {
    console.error('Error fetching file data:', error);
    res.status(500).json({ error: 'Error processing request' });
  }
}
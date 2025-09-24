import type { NextApiRequest, NextApiResponse } from 'next'
import * as csvUtils from '@/utils/csvUtils'
import fs from 'fs'
import path from 'path'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const csvFiles: Array<{path: string, name: string}> = [];
    
    // Check for CSV files in data directory
    const dataDir = path.join(process.cwd(), 'data');
    try {
      if (fs.existsSync(dataDir)) {
        const files = fs.readdirSync(dataDir);
        const dataCsvFiles = files.filter(file => file.endsWith('.csv'));
        csvFiles.push(...dataCsvFiles.map(file => ({ 
          path: path.join(dataDir, file), 
          name: file 
        })));
      }
    } catch (error) {
      console.error('Error reading data directory:', error);
    }
    
    // Try to load a sample of client data
    let clientSample: csvUtils.ClientRecord[] = [];
    try {
      const clientData = await csvUtils.loadClientData();
      clientSample = clientData.slice(0, 5);
    } catch (error) {
      console.error('Error loading client data:', error);
    }
    
    res.status(200).json({
      currentDir: process.cwd(),
      dataDir,
      csvFiles,
      clientSample
    });
  } catch (error) {
    console.error('Error in log endpoint:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

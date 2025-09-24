import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse'

// Define interfaces for CSV data
export interface ClientRecord {
  'FILE NUMBER': string
  'File Name'?: string
  'Client1 First Name'?: string
  'Client1 Last Name'?: string
  'Client2 First Name'?: string
  'Client2 Last Name'?: string
  'Client3 First Name'?: string
  'Client3 Last Name'?: string
  'Client4 First Name'?: string
  'Client4 Last Name'?: string
  'LOCATION DETAIL'?: string
  [key: string]: any
}

export interface IntakeRecord {
  'FILE NUMBER': string
  DOB?: string
  'EMERGENCY CONTACT NAME'?: string
  'EMERGENCY CONTACT NUMBER'?: string
  CITY?: string
  STATE?: string
  'STREET ADDRESS'?: string
  ZIP?: string
  PHONE?: string
  [key: string]: any
}

export interface CounselorAssignmentRecord {
  'FILE NUMBER': string
  'Counselor First Name'?: string
  'Counselor Last Name'?: string
  'THERAPY TYPE'?: string
  'INTAKE DATE'?: string
  'END DATE'?: string
  'LOCATION'?: string
  'STATUS'?: string
  'LOCATION DETAIL'?: string
  [key: string]: any
}

export interface SessionHistoryRecord {
  'File Number': string
  'Session Date'?: string
  'Supervision Group'?: string
  'Session Status'?: string
  'Session Payment Status'?: string
  'Payment Method'?: string
  'Session Fee'?: string
  'Session Note'?: string
  [key: string]: any
}

// Path configurations - standardized to only use the data directory
const DATA_DIR = path.join(process.cwd(), 'data')

const CLIENT_FILE_PATH = path.join(DATA_DIR, 'File+Client Name.csv')
const INTAKE_FILE_PATH = path.join(DATA_DIR, 'Intake Form.csv')
const COUNSELOR_FILE_PATH = path.join(DATA_DIR, 'Client+Counselor Assignment.csv')
const SESSION_FILE_PATH = path.join(DATA_DIR, 'Session History.csv')

// Helper function to load CSV data
function loadCSV<T>(filePath: string): Promise<T[]> {
  console.log(`Loading CSV file from: ${filePath}`);
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      console.error(`CSV file does not exist at path: ${filePath}`);
      reject(new Error(`File does not exist: ${filePath}`));
      return;
    }

    const results: T[] = [];
    fs.createReadStream(filePath)
      .pipe(parse({
        delimiter: ',',
        columns: true,
        skip_empty_lines: true,
        trim: true
      }))
      .on('data', (data: any) => {
        // Normalize file number fields to ensure consistent format
        const normalizedData = { ...data };
        
        // Handle different file number field names in different CSVs
        if ('FILE NUMBER' in normalizedData) {
          normalizedData['FILE NUMBER'] = String(normalizedData['FILE NUMBER']).trim();
        }
        if ('File Number' in normalizedData) {
          normalizedData['File Number'] = String(normalizedData['File Number']).trim();
        }
        
        results.push(normalizedData as T);
      })
      .on('error', (error: Error) => {
        console.error(`Error parsing CSV file ${filePath}:`, error);
        reject(error);
      })
      .on('end', () => {
        console.log(`Successfully loaded ${results.length} records from ${filePath}`);
        resolve(results);
      });
  });
}

// Data loading functions - simplified to use the standardized paths
export async function loadClientData(): Promise<ClientRecord[]> {
  try {
    const data = await loadCSV<ClientRecord>(CLIENT_FILE_PATH);
    
    // Debug: Log a few records to check structure
    if (data.length > 0) {
      console.log('First client record example:', JSON.stringify(data[0]));
      console.log('Available fields in client record:', Object.keys(data[0]));
    }
    
    return data;
  } catch (error) {
    console.error('Error loading client data:', error);
    throw new Error('Failed to load client data');
  }
}

export async function loadIntakeData(): Promise<IntakeRecord[]> {
  try {
    return await loadCSV<IntakeRecord>(INTAKE_FILE_PATH);
  } catch (error) {
    console.error('Error loading intake data:', error);
    throw new Error('Failed to load intake data');
  }
}

export async function loadCounselorData(): Promise<CounselorAssignmentRecord[]> {
  try {
    return await loadCSV<CounselorAssignmentRecord>(COUNSELOR_FILE_PATH);
  } catch (error) {
    console.error('Error loading counselor data:', error);
    throw new Error('Failed to load counselor data');
  }
}

export async function loadSessionData(): Promise<SessionHistoryRecord[]> {
  try {
    return await loadCSV<SessionHistoryRecord>(SESSION_FILE_PATH);
  } catch (error) {
    console.error('Error loading session data:', error);
    throw new Error('Failed to load session data');
  }
}

// Search utility function
export function normalizeString(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, ' ')
}

export function searchRecords<T extends Record<string, any>>(
  records: T[],
  query: string,
  fields: (keyof T)[]
): T[] {
  const normalizedQuery = query.toLowerCase().trim();
  console.log(`Searching for normalized query: "${normalizedQuery}" across ${fields.length} fields`);
  
  return records.filter(record => {
    // Case-insensitive field lookup (since CSV headers might not match exactly)
    const hasMatch = fields.some(fieldName => {
      // Try exact match
      let value = record[fieldName];
      
      // If no value found with the exact field name, try case-insensitive match
      if (value === undefined || value === null) {
        const key = Object.keys(record).find(k => k.toLowerCase() === String(fieldName).toLowerCase());
        if (key) {
          value = record[key];
        }
      }
      
      if (value === undefined || value === null) return false;
      
      const stringValue = String(value).toLowerCase().trim();
      const matches = stringValue.includes(normalizedQuery);
      
      if (matches) {
        console.log(`Found match in field "${String(fieldName)}": "${stringValue}" contains "${normalizedQuery}"`);
      }
      
      return matches;
    });
    
    return hasMatch;
  });
}

// Helper function to extract client names from a client record
export function getClientNames(record: ClientRecord): string[] {
  const names: string[] = [];
  
  // Special debugging for file 125477
  const isTargetFile = record['FILE NUMBER'] === '125477';
  if (isTargetFile) {
    console.log('CSVUTILS: Extracting client names for file 125477:', JSON.stringify(record));
    console.log('CSVUTILS: Record keys:', Object.keys(record));
  } else {
    console.log('Extracting client names from record:', JSON.stringify(record));
  }
  
  // Case-insensitive lookup helper function
  const getField = (obj: Record<string, any>, fieldName: string): any => {
    // First try exact match
    if (obj[fieldName] !== undefined) return obj[fieldName];
    
    // Then try case-insensitive match
    const key = Object.keys(obj).find(k => k.toLowerCase() === fieldName.toLowerCase());
    return key ? obj[key] : undefined;
  };
  
  // Check if "File Name" contains a client name (some CSVs might use this)
  const fileName = getField(record, 'File Name');
  if (isTargetFile) {
    console.log(`CSVUTILS: File Name field value for 125477: "${fileName}"`);
  }
  
  if (fileName && typeof fileName === 'string' && fileName.trim() !== '') {
    names.push(fileName.trim());
    if (isTargetFile) {
      console.log(`CSVUTILS: Added name from File Name field: "${fileName.trim()}"`);
    }
  }
  
  // Check each client field pair (up to 4 clients per record)
  for (let i = 1; i <= 4; i++) {
    const firstName = getField(record, `Client${i} First Name`);
    const lastName = getField(record, `Client${i} Last Name`);
    
    if (isTargetFile) {
      console.log(`CSVUTILS: Checking Client${i} for 125477:`, { firstName, lastName });
    } else {
      console.log(`Checking Client${i}:`, { firstName, lastName });
    }
    
    if (firstName || lastName) {
      const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
      if (fullName) {
        names.push(fullName);
        if (isTargetFile) {
          console.log(`CSVUTILS: Added name from Client${i}: "${fullName}"`);
        }
      }
    }
  }
  
  if (isTargetFile) {
    console.log('CSVUTILS: Final extracted client names for 125477:', names);
  } else {
    console.log('Extracted client names:', names);
  }
  
  return names;
}

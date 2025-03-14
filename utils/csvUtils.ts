import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';

// Define interfaces for CSV data
export interface ClientRecord {
  FILE_NUMBER: string;
  'Client1 First Name'?: string;
  'Client1 Last Name'?: string;
  'Client2 First Name'?: string;
  'Client2 Last Name'?: string;
  'Client3 First Name'?: string;
  'Client3 Last Name'?: string;
  'Client4 First Name'?: string;
  'Client4 Last Name'?: string;
  [key: string]: any;
}

export interface IntakeRecord {
  'FILE NUMBER': string;
  [key: string]: any;
}

export interface CounselorAssignmentRecord {
  'FILE NUMBER': string;
  'Counselor First Name'?: string;
  'Counselor Last Name'?: string;
  'THERAPY TYPE'?: string;
  'INTAKE DATE'?: string;
  'END DATE'?: string;
  'LOCATION'?: string;
  'STATUS'?: string;
  'LOCATION DETAIL'?: string;
  [key: string]: any;
}

export interface SessionHistoryRecord {
  'File Number': string;
  'Session Date'?: string;
  'Supervision Group'?: string;
  'Session Status'?: string;
  'Session Payment Status'?: string;
  'Payment Method'?: string;
  'Session Fee'?: string;
  'Session Note'?: string;
  [key: string]: any;
}

// Helper function to load CSV data
function loadCSV<T>(filePath: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const results: T[] = [];
    fs.createReadStream(filePath)
      .pipe(parse({
        delimiter: ',',
        columns: true,
        skip_empty_lines: true,
        trim: true
      }))
      .on('data', (data: T) => {
        results.push(data);
      })
      .on('error', (error) => {
        reject(error);
      })
      .on('end', () => {
        resolve(results);
      });
  });
}

export async function loadClientData(): Promise<ClientRecord[]> {
  try {
    const filePath = path.join(process.cwd(), 'File+Client Name.csv');
    const data = await loadCSV<ClientRecord>(filePath);
    return data;
  } catch (error) {
    console.error('Error loading client data:', error);
    throw new Error('Failed to load client data');
  }
}

export async function loadIntakeData(): Promise<IntakeRecord[]> {
  try {
    const filePath = path.join(process.cwd(), 'Intake Form.csv');
    const data = await loadCSV<IntakeRecord>(filePath);
    return data;
  } catch (error) {
    console.error('Error loading intake data:', error);
    throw new Error('Failed to load intake data');
  }
}

export async function loadCounselorData(): Promise<CounselorAssignmentRecord[]> {
  try {
    const filePath = path.join(process.cwd(), 'Client+Counselor Assignment.csv');
    const data = await loadCSV<CounselorAssignmentRecord>(filePath);
    return data;
  } catch (error) {
    console.error('Error loading counselor data:', error);
    throw new Error('Failed to load counselor data');
  }
}

export async function loadSessionData(): Promise<SessionHistoryRecord[]> {
  try {
    const filePath = path.join(process.cwd(), 'Session History.csv');
    const data = await loadCSV<SessionHistoryRecord>(filePath);
    return data;
  } catch (error) {
    console.error('Error loading session data:', error);
    throw new Error('Failed to load session data');
  }
}

// Helper function to search records for a query
export function searchRecords<T extends Record<string, any>>(
  records: T[],
  query: string,
  fields: (keyof T)[]
): T[] {
  const normalizedQuery = query.toLowerCase().trim();
  
  return records.filter(record => {
    return fields.some(field => {
      const value = record[field];
      if (value === undefined || value === null) return false;
      
      return String(value).toLowerCase().includes(normalizedQuery);
    });
  });
}

// Helper function to extract client names from a client record
export function getClientNames(record: ClientRecord): string[] {
  const names: string[] = [];
  
  for (let i = 1; i <= 4; i++) {
    const firstName = record[`Client${i} First Name`] as string | undefined;
    const lastName = record[`Client${i} Last Name`] as string | undefined;
    
    if (firstName || lastName) {
      const fullName = [firstName, lastName].filter(Boolean).join(' ');
      if (fullName.trim()) {
        names.push(fullName);
      }
    }
  }
  
  return names;
}
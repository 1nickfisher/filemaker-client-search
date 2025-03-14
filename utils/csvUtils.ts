import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'

// Types for our data sources
export interface ClientRecord {
  FILE_NUMBER: string
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
  'THERAPY TYPE'?: string
  'Counselor First Name'?: string
  'Counselor Last Name'?: string
  'INTAKE DATE'?: string
  'END DATE'?: string
  LOCATION?: string
  STATUS?: string
  'LOCATION DETAIL'?: string
  [key: string]: any
}

export interface SessionHistoryRecord {
  'File Number': string
  'Supervision Group'?: string
  'Session Date'?: string
  'Session Payment Status'?: string
  'Session Status'?: string
  'Session Note'?: string
  'Payment Method'?: string
  'Session Fee'?: string
  [key: string]: any
}

// Path configurations - in production these would be in environment variables
const DATA_DIR = path.join(process.cwd(), 'data')

const CLIENT_FILE_PATH = path.join(DATA_DIR, 'File+Client Name.csv')
const INTAKE_FILE_PATH = path.join(DATA_DIR, 'Intake Form.csv')
const COUNSELOR_FILE_PATH = path.join(DATA_DIR, 'Client+Counselor Assignment.csv')
const SESSION_FILE_PATH = path.join(DATA_DIR, 'Session History.csv')

// CSV Parsing functions
export async function parseCSV<T>(filePath: string): Promise<T[]> {
  try {
    const fileContent = await fs.promises.readFile(filePath, 'utf8')
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    }) as T[]
    
    return records
  } catch (error) {
    console.error(`Error parsing CSV file ${filePath}:`, error)
    return []
  }
}

// Data loading functions
export async function loadClientData(): Promise<ClientRecord[]> {
  return parseCSV<ClientRecord>(CLIENT_FILE_PATH)
}

export async function loadIntakeData(): Promise<IntakeRecord[]> {
  return parseCSV<IntakeRecord>(INTAKE_FILE_PATH)
}

export async function loadCounselorData(): Promise<CounselorAssignmentRecord[]> {
  return parseCSV<CounselorAssignmentRecord>(COUNSELOR_FILE_PATH)
}

export async function loadSessionData(): Promise<SessionHistoryRecord[]> {
  return parseCSV<SessionHistoryRecord>(SESSION_FILE_PATH)
}

// Search utility function
export function normalizeString(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, ' ')
}

export function searchRecords<T extends { [key: string]: any }>(
  records: T[],
  query: string,
  fields: string[] = []
): T[] {
  const normalizedQuery = normalizeString(query)
  
  return records.filter(record => {
    // If fields are specified, only search in those fields
    if (fields.length > 0) {
      return fields.some(field => {
        const value = record[field]
        return value && normalizeString(String(value)).includes(normalizedQuery)
      })
    }
    
    // Otherwise search in all fields
    return Object.values(record).some(value => 
      value && normalizeString(String(value)).includes(normalizedQuery)
    )
  })
}
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import { MongoClient, Collection } from 'mongodb';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/filemaker';
const DB_NAME = process.env.DB_NAME || 'filemaker';

const DATA_DIR = path.join(process.cwd(), 'data');
const CLIENT_FILE_PATH = path.join(DATA_DIR, 'File+Client Name.csv');
const INTAKE_FILE_PATH = path.join(DATA_DIR, 'Intake Form.csv');
const COUNSELOR_FILE_PATH = path.join(DATA_DIR, 'Client+Counselor Assignment.csv');
const SESSION_FILE_PATH = path.join(DATA_DIR, 'Session History.csv');

const FIELD_NAME_MAP: Record<string, string[]> = {
  file_number: ['FILE_NUMBER', 'FILE NUMBER', 'File Number', 'FILENUMBER', 'FileNumber'],
  file_name: ['File Name', 'FILE NAME', 'FILENAME', 'FileName'],
  client1_first_name: ['Client1 First Name', 'CLIENT1 FIRST NAME', 'Client1FirstName'],
  client1_last_name: ['Client1 Last Name', 'CLIENT1 LAST NAME', 'Client1LastName'],
  client2_first_name: ['Client2 First Name', 'CLIENT2 FIRST NAME', 'Client2FirstName'],
  client2_last_name: ['Client2 Last Name', 'CLIENT2 LAST NAME', 'Client2LastName'],
  client3_first_name: ['Client3 First Name', 'CLIENT3 FIRST NAME', 'Client3FirstName'],
  client3_last_name: ['Client3 Last Name', 'CLIENT3 LAST NAME', 'Client3LastName'],
  client4_first_name: ['Client4 First Name', 'CLIENT4 FIRST NAME', 'Client4FirstName'],
  client4_last_name: ['Client4 Last Name', 'CLIENT4 LAST NAME', 'Client4LastName'],
  counselor_first_name: ['Counselor First Name', 'COUNSELOR FIRST NAME', 'CounselorFirstName'],
  counselor_last_name: ['Counselor Last Name', 'COUNSELOR LAST NAME', 'CounselorLastName'],
  location: ['LOCATION', 'Location'],
  location_detail: ['LOCATION DETAIL', 'Location Detail'],
  therapy_type: ['THERAPY TYPE', 'Therapy Type'],
  intake_date: ['INTAKE DATE', 'Intake Date'],
  end_date: ['END DATE', 'End Date'],
  session_date: ['Session Date', 'SESSION DATE'],
  status: ['STATUS', 'Status'],
  session_status: ['Session Status', 'SESSION STATUS'],
  session_payment_status: ['Session Payment Status', 'SESSION PAYMENT STATUS'],
  emergency_contact_name: ['EMERGENCY CONTACT NAME', 'Emergency Contact Name'],
  emergency_contact_number: ['EMERGENCY CONTACT NUMBER', 'Emergency Contact Number'],
  city: ['CITY', 'City'],
  state: ['STATE', 'State'],
  street_address: ['STREET ADDRESS', 'Street Address'],
  zip: ['ZIP', 'Zip'],
  phone: ['PHONE', 'Phone'],
  dob: ['DOB', 'Dob', 'Date of Birth', 'DATE OF BIRTH'],
  supervision_group: ['Supervision Group', 'SUPERVISION GROUP'],
  payment_method: ['Payment Method', 'PAYMENT METHOD'],
  session_fee: ['Session Fee', 'SESSION FEE'],
  session_note: ['Session Note', 'SESSION NOTE'],
};

function normalizeFieldName(fieldName: string): string {
  if (!fieldName) return '';
  const lowerField = fieldName.toLowerCase();
  for (const [normalizedName, variations] of Object.entries(FIELD_NAME_MAP)) {
    if (variations.some(v => v.toLowerCase() === lowerField)) return normalizedName;
  }
  const normalized = fieldName
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
  // Return original field name lowercased if normalization results in empty string
  return normalized || fieldName.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

function normalizeValue(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value.trim();
  return value;
}

function normalizeFileNumber(fileNumber: unknown): string {
  if (fileNumber === null || fileNumber === undefined) return '';
  return String(fileNumber).trim();
}

async function loadCSV(filePath: string): Promise<any[]> {
  console.log(`Loading CSV file from: ${filePath}`);
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      reject(new Error(`File does not exist: ${filePath}`));
      return;
    }
    const results: any[] = [];
    fs.createReadStream(filePath)
      .pipe(parse({ delimiter: ',', columns: true, skip_empty_lines: true, trim: true }))
      .on('data', (data: any) => {
        const normalizedData: Record<string, any> = {};
        for (const [key, value] of Object.entries(data)) {
          const normalizedKey = normalizeFieldName(key);
          // Skip empty field names to avoid MongoDB errors
          if (!normalizedKey || normalizedKey === '') continue;
          const normalizedValue = normalizeValue(value);
          normalizedData[normalizedKey] = normalizedValue;
        }
        let fileNumber = '';
        for (const field of FIELD_NAME_MAP['file_number']) {
          if (data[field] !== undefined && data[field] !== null) {
            fileNumber = normalizeFileNumber(data[field]);
            break;
          }
        }
        if (fileNumber) normalizedData['file_number'] = fileNumber;
        results.push(normalizedData);
      })
      .on('error', (error: Error) => reject(error))
      .on('end', () => resolve(results));
  });
}

type SessionImportOptions = {
  skipSessions?: boolean;
  sessionsLimit?: number;
  since?: string; // YYYY-MM-DD
  batchSize?: number;
  dryRun?: boolean;
}

function parseArgs(argv: string[]): SessionImportOptions {
  const opts: SessionImportOptions = {};
  for (const arg of argv.slice(2)) {
    if (arg === '--skip-sessions') opts.skipSessions = true;
    else if (arg.startsWith('--sessions-limit=')) opts.sessionsLimit = parseInt(arg.split('=')[1] || '0', 10) || undefined;
    else if (arg.startsWith('--since=')) opts.since = arg.split('=')[1];
    else if (arg.startsWith('--batch-size=')) opts.batchSize = parseInt(arg.split('=')[1] || '0', 10) || undefined;
    else if (arg === '--dry-run') opts.dryRun = true;
  }
  return opts;
}

function toDateOrNull(s: unknown): Date | null {
  if (!s || typeof s !== 'string') return null;
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d;
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(s);
  if (m) {
    const d2 = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    if (!Number.isNaN(d2.getTime())) return d2;
  }
  return null;
}

function hashSessionKey(parts: Array<unknown>): string {
  const input = parts.map((p) => (p === undefined || p === null ? '' : String(p))).join('|');
  return crypto.createHash('sha1').update(input).digest('hex');
}

async function importSessionsStream(
  collection: Collection,
  filePath: string,
  options: SessionImportOptions
): Promise<{ insertedOrUpdated: number; totalRead: number }> {
  const batchSize = options.batchSize ?? 2000;
  const sinceDate = options.since ? toDateOrNull(options.since) : null;
  let totalRead = 0;
  let insertedOrUpdated = 0;
  let ops: any[] = [];
  let importedCount = 0;

  if (!fs.existsSync(filePath)) {
    throw new Error(`Session CSV not found at ${filePath}`);
  }

  console.log(`Streaming sessions from ${filePath} with batch size ${batchSize}${options.sessionsLimit ? `, limit ${options.sessionsLimit}` : ''}${sinceDate ? `, since ${sinceDate.toISOString().slice(0,10)}` : ''}`);

  await new Promise<void>((resolve, reject) => {
    const stream = fs.createReadStream(filePath)
      .pipe(parse({ delimiter: ',', columns: true, skip_empty_lines: true, trim: true }));

    stream.on('data', (raw: any) => {
      totalRead++;
      const normalized: Record<string, any> = {};
      for (const [key, value] of Object.entries(raw)) {
        const k = normalizeFieldName(key);
        if (!k) continue;
        const v = normalizeValue(value);
        normalized[k] = v;
      }

      const fileNumber = normalized['file_number'];
      if (!fileNumber) return;

      if (sinceDate) {
        const d = toDateOrNull(normalized['session_date']);
        if (!d || d < sinceDate) return;
      }

      const sid = hashSessionKey([
        normalized['file_number'],
        normalized['session_date'],
        normalized['session_status'],
        normalized['session_payment_status'],
        normalized['supervision_group'],
        normalized['payment_method'],
        normalized['session_fee'],
        (normalized['session_note'] || '').slice(0, 64),
      ]);

      const doc = { ...normalized, session_id: sid };
      const op = {
        updateOne: {
          filter: { session_id: sid },
          update: { $set: doc },
          upsert: true,
        },
      } as const;

      ops.push(op);
      importedCount++;

      const shouldFlush = ops.length >= batchSize;
      const overLimit = options.sessionsLimit && importedCount >= options.sessionsLimit;
      if (shouldFlush || overLimit) {
        (stream as any).pause?.();
        const current = ops;
        ops = [];
        const doWrite = async () => {
          if (!options.dryRun) {
            const result = await collection.bulkWrite(current, { ordered: false });
            insertedOrUpdated += (result.upsertedCount || 0) + (result.modifiedCount || 0);
          }
        };
        doWrite()
          .then(() => {
            console.log(`Sessions progress: read=${totalRead} imported=${importedCount} written≈${insertedOrUpdated}`);
            if (!overLimit) (stream as any).resume?.();
            else stream.emit('end');
          })
          .catch(reject);
      }
    });

    stream.on('error', reject);
    stream.on('end', async () => {
      try {
        if (ops.length && !options.dryRun) {
          const result = await collection.bulkWrite(ops, { ordered: false });
          insertedOrUpdated += (result.upsertedCount || 0) + (result.modifiedCount || 0);
        }
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  });

  return { insertedOrUpdated, totalRead };
}

async function migrateToMongoDB() {
  let client: MongoClient | null = null;
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);

    const clientsCollection = db.collection('clients');
    const intakeCollection = db.collection('intakes');
    const counselorsCollection = db.collection('counselors');
    const sessionsCollection = db.collection('sessions');

    // Primary indexes first; defer session index and text index until after import for speed
    await clientsCollection.createIndex({ file_number: 1 }, { unique: true });
    await intakeCollection.createIndex({ file_number: 1 }, { unique: true });
    await counselorsCollection.createIndex({ file_number: 1 });

    const clientData = await loadCSV(CLIENT_FILE_PATH);
    if (clientData.length > 0) {
      const ops = clientData
        .map((doc) => (doc.file_number ? {
          updateOne: {
            filter: { file_number: doc.file_number },
            update: { $set: doc },
            upsert: true,
          },
        } : null))
        .filter(Boolean) as any[];
      if (ops.length) await clientsCollection.bulkWrite(ops);
    }

    const intakeData = await loadCSV(INTAKE_FILE_PATH);
    if (intakeData.length > 0) {
      const ops = intakeData
        .map((doc) => (doc.file_number ? {
          updateOne: {
            filter: { file_number: doc.file_number },
            update: { $set: doc },
            upsert: true,
          },
        } : null))
        .filter(Boolean) as any[];
      if (ops.length) await intakeCollection.bulkWrite(ops);
    }

    const counselorData = await loadCSV(COUNSELOR_FILE_PATH);
    if (counselorData.length > 0) {
      const ops = counselorData
        .map((doc) => (doc.file_number ? {
          updateOne: {
            filter: {
              file_number: doc.file_number,
              counselor_first_name: doc.counselor_first_name,
              counselor_last_name: doc.counselor_last_name,
            },
            update: { $set: doc },
            upsert: true,
          },
        } : null))
        .filter(Boolean) as any[];
      if (ops.length) await counselorsCollection.bulkWrite(ops);
    }

    // Stream and batch sessions for performance; support CLI flags
    const options = parseArgs(process.argv);
    if (!options.skipSessions) {
      const { insertedOrUpdated, totalRead } = await importSessionsStream(sessionsCollection, SESSION_FILE_PATH, options);
      console.log(`Sessions imported: read=${totalRead}, written≈${insertedOrUpdated}`);
    } else {
      console.log('Skipping sessions (flag --skip-sessions)');
    }

    // Post-import indexes
    await sessionsCollection.createIndex({ file_number: 1 });
    await clientsCollection.createIndex({
      file_name: 'text',
      client1_first_name: 'text',
      client1_last_name: 'text',
      client2_first_name: 'text',
      client2_last_name: 'text',
      client3_first_name: 'text',
      client3_last_name: 'text',
      client4_first_name: 'text',
      client4_last_name: 'text',
    });

    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    if (client) await client.close();
  }
}

migrateToMongoDB().catch(console.error);

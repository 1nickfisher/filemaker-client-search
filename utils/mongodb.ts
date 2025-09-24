import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

if (!process.env.DB_NAME) {
  throw new Error('Please define the DB_NAME environment variable inside .env.local');
}

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.DB_NAME as string;

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global to preserve connection across HMR reloads
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globalWithMongo = global as any;
  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export default clientPromise;

export async function getMongoClient() {
  return await clientPromise;
}

export async function getMongoDb() {
  const client = await clientPromise;
  return client.db(dbName);
}

export function normalizeFileNumber(fileNumber: unknown): string {
  if (fileNumber === null || fileNumber === undefined) return '';
  return String(fileNumber).trim();
}

export function getClientNames(client: Record<string, unknown>): string[] {
  const names: string[] = [];
  const fileName = client['file_name'];
  if (typeof fileName === 'string' && fileName.trim() !== '') {
    names.push(fileName.trim());
  }
  for (let i = 1; i <= 4; i++) {
    const firstName = client[`client${i}_first_name`];
    const lastName = client[`client${i}_last_name`];
    const full = [firstName, lastName].filter(Boolean).join(' ').trim();
    if (full) names.push(full);
  }
  return names;
}


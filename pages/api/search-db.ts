import type { NextApiRequest, NextApiResponse } from 'next'
import { getMongoDb, normalizeFileNumber, getClientNames } from '@/utils/mongodb';

interface SearchResult {
  fileNumber: string
  type: 'client' | 'provider' | 'session'
  name?: string
  details: Record<string, any>
}

type Data = {
  results: SearchResult[]
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

    const db = await getMongoDb();
    const normalizedQuery = query.toLowerCase().trim();

    const results: SearchResult[] = [];
    const fileNumbers = new Set<string>();

    if (/^\d+$/.test(normalizedQuery)) {
      const fileNumber = normalizeFileNumber(normalizedQuery);
      fileNumbers.add(fileNumber);
    } else {
      const clientMatches = await db.collection('clients').find({
        $or: [
          { file_name: { $regex: normalizedQuery, $options: 'i' } },
          { client1_first_name: { $regex: normalizedQuery, $options: 'i' } },
          { client1_last_name: { $regex: normalizedQuery, $options: 'i' } },
          { client2_first_name: { $regex: normalizedQuery, $options: 'i' } },
          { client2_last_name: { $regex: normalizedQuery, $options: 'i' } },
          { client3_first_name: { $regex: normalizedQuery, $options: 'i' } },
          { client3_last_name: { $regex: normalizedQuery, $options: 'i' } },
          { client4_first_name: { $regex: normalizedQuery, $options: 'i' } },
          { client4_last_name: { $regex: normalizedQuery, $options: 'i' } }
        ]
      }).toArray();

      clientMatches.forEach(client => {
        if (client.file_number) {
          fileNumbers.add(client.file_number);
        }
      });

      const counselorMatches = await db.collection('counselors').find({
        $or: [
          { counselor_first_name: { $regex: normalizedQuery, $options: 'i' } },
          { counselor_last_name: { $regex: normalizedQuery, $options: 'i' } }
        ]
      }).toArray();

      counselorMatches.forEach(counselor => {
        if (counselor.file_number) {
          fileNumbers.add(counselor.file_number);
        }
      });
    }

    for (const fileNumber of Array.from(fileNumbers)) {
      if (!fileNumber) continue;

      const clientInfo = await db.collection('clients').findOne({ file_number: fileNumber });

      if (clientInfo) {
        const clientNames = getClientNames(clientInfo);
        const clientNamesString = clientNames.join(', ');
        results.push({
          fileNumber,
          type: 'client',
          name: clientNamesString || `File #${fileNumber}`,
          details: {
            ...clientInfo,
            clientNames
          }
        });
      } else {
        results.push({
          fileNumber,
          type: 'client',
          name: `File #${fileNumber}`,
          details: {
            file_number: fileNumber,
            _note: 'Limited information available'
          }
        });
      }

      const intakeInfo = await db.collection('intakes').findOne({ file_number: fileNumber });
      if (intakeInfo) {
        const existingClient = results.find(r => r.fileNumber === fileNumber && r.type === 'client');
        if (existingClient) {
          existingClient.details = {
            ...existingClient.details,
            ...intakeInfo
          };
        }
      }

      const counselorRecords = await db.collection('counselors')
        .find({ file_number: fileNumber })
        .toArray();

      for (const counselor of counselorRecords) {
        const firstName = counselor.counselor_first_name || '';
        const lastName = counselor.counselor_last_name || '';
        const providerName = [firstName, lastName].filter(Boolean).join(' ');
        results.push({
          fileNumber,
          type: 'provider',
          name: providerName || undefined,
          details: {
            therapy_type: counselor.therapy_type,
            intake_date: counselor.intake_date,
            end_date: counselor.end_date,
            location: counselor.location,
            status: counselor.status,
            location_detail: counselor.location_detail
          }
        });
      }

      const sessionRecords = await db.collection('sessions')
        .find({ file_number: fileNumber })
        .sort({ session_date: -1 })
        .limit(10)
        .toArray();

      for (const session of sessionRecords) {
        results.push({
          fileNumber,
          type: 'session',
          details: {
            date: session.session_date,
            supervision_group: session.supervision_group,
            status: session.session_status,
            payment_status: session.session_payment_status,
            payment_method: session.payment_method,
            fee: session.session_fee,
            notes: session.session_note
          }
        });
      }
    }

    return res.status(200).json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ error: 'Error processing search' });
  }
}


import { loadClientData, loadCounselorData, loadIntakeData, loadSessionData } from '../utils/csvUtils';

function normalize(fn: unknown): string {
  if (fn === null || fn === undefined) return '';
  return String(fn).trim();
}

async function main() {
  const clients = await loadClientData();
  const intakes = await loadIntakeData();
  const counselors = await loadCounselorData();
  const sessions = await loadSessionData();

  const clientFiles = new Set(clients.map((r) => normalize((r as any)['FILE NUMBER'] || (r as any)['FILE_NUMBER'] || (r as any)['File Number'])));
  const intakeFiles = new Set(intakes.map((r) => normalize((r as any)['FILE NUMBER'])));
  const counselorFiles = new Set(counselors.map((r) => normalize((r as any)['FILE NUMBER'])));
  const sessionFiles = new Set(sessions.map((r) => normalize((r as any)['File Number'])));

  const orphansFromCounselor = [...counselorFiles].filter((f) => f && !clientFiles.has(f));
  const orphansFromSessions = [...sessionFiles].filter((f) => f && !clientFiles.has(f));
  const orphansFromIntakes = [...intakeFiles].filter((f) => f && !clientFiles.has(f));

  const missingIntakes = [...clientFiles].filter((f) => f && !intakeFiles.has(f));
  const missingCounselors = [...clientFiles].filter((f) => f && !counselorFiles.has(f));
  const missingSessions = [...clientFiles].filter((f) => f && !sessionFiles.has(f));

  // Collect sample names for a few orphans
  const clientIndex = new Map<string, any>();
  for (const rec of clients) {
    const f = normalize((rec as any)['FILE NUMBER'] || (rec as any)['FILE_NUMBER'] || (rec as any)['File Number']);
    if (f) clientIndex.set(f, rec);
  }

  console.log('=== Data Validation Summary ===');
  console.log(`Client files: ${clientFiles.size}`);
  console.log(`Intake files: ${intakeFiles.size}`);
  console.log(`Counselor files: ${counselorFiles.size}`);
  console.log(`Session files: ${sessionFiles.size}`);

  console.log('\n-- Orphans (exist in dataset but missing client file) --');
  console.log(`From counselors: ${orphansFromCounselor.length}`);
  console.log(`Examples: ${orphansFromCounselor.slice(0, 10).join(', ')}`);
  console.log(`From sessions:   ${orphansFromSessions.length}`);
  console.log(`Examples: ${orphansFromSessions.slice(0, 10).join(', ')}`);
  console.log(`From intakes:    ${orphansFromIntakes.length}`);
  console.log(`Examples: ${orphansFromIntakes.slice(0, 10).join(', ')}`);

  console.log('\n-- Missing datasets for known client files --');
  console.log(`Clients without intakes: ${missingIntakes.length}`);
  console.log(`Clients without counselors: ${missingCounselors.length}`);
  console.log(`Clients without sessions: ${missingSessions.length}`);

  // Spot-check a few client names for missing records
  const showName = (rec: any) => {
    const c1 = [rec['Client1 First Name'], rec['Client1 Last Name']].filter(Boolean).join(' ');
    return rec['File Name'] || c1 || '(no name)';
  };

  console.log('\n-- Sample clients missing sessions --');
  for (const f of missingSessions.slice(0, 10)) {
    const rec = clientIndex.get(f);
    console.log(`${f} — ${rec ? showName(rec) : '(no client record)'}`);
  }
}

main().catch((e) => {
  console.error('Validation failed:', e);
  process.exit(1);
});


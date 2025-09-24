# Filemaker Client Search

A web application for searching and viewing client records from Filemaker CSV exports. This application allows counselors and administrators to search through client records, view client details, provider assignments, and session history.

## Project Overview

This application is built to solve the challenge of searching through Filemaker exported data without needing access to the Filemaker application itself. It provides a user-friendly interface for:

- Searching clients by name or file number
- Viewing client details including contact information
- Seeing provider assignments and therapy types
- Accessing session history and supervision groups

## Technology Stack

- **Framework**: Next.js (React)
- **Language**: TypeScript
- **Styling**: CSS Modules
- **Data Storage**: CSV files (loaded into memory) or MongoDB (optional)

## Data Sources

The application uses four CSV files stored in the `/data` directory:

1. **File+Client Name.csv** - Contains client names associated with file numbers
   - Key fields: `FILE_NUMBER`, `File Name`, `Client1 First Name`, `Client1 Last Name`, etc.
   - Size: ~1.5MB, ~32,000 records

2. **Intake Form.csv** - Contains intake information for clients
   - Key fields: `FILE NUMBER`, `DOB`, `EMERGENCY CONTACT NAME`, `PHONE`, etc.
   - Size: ~250KB

3. **Client+Counselor Assignment.csv** - Maps clients to counselors/providers
   - Key fields: `FILE NUMBER`, `Counselor First Name`, `Counselor Last Name`, `THERAPY TYPE`, `INTAKE DATE`, etc.
   - Size: ~2MB

4. **Session History.csv** - Contains session records
   - Key fields: `File Number`, `Session Date`, `Supervision Group`, `Session Status`, etc.
   - Size: ~6MB

## Project Structure

### API Endpoints

- **/api/search** - POST endpoint for searching client records
  - Input: `{ query: string }`
  - Output: Array of search results grouped by file number

- **/api/file** - POST endpoint for retrieving detailed file information
  - Input: `{ fileNumber: string }`
  - Output: Client details, providers, and session history for the specified file number

- **/api/log** - GET endpoint for debugging data loading (development only)

### Key Components

- **SearchResults** - Displays search results in card format with client names, providers, and key dates
- **FileDetails** - Detailed view with tabs for Overview, Intake Information, and Session History
- **SearchForm** - Input form for search queries

### Utility Functions

- **csvUtils.ts** - Contains functions for loading and parsing CSV data, with interfaces defining the data structure

## Installation and Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Place the four CSV files in the `/data` directory (or run `npm run import-data` to copy CSVs from the repo root):
   - File+Client Name.csv
   - Intake Form.csv
   - Client+Counselor Assignment.csv
   - Session History.csv
4. Run the development server:
   ```
   npm run dev
   ```
5. Access the application at http://localhost:3000

## Usage

1. Enter a search query (client name, file number, etc.) in the search field
2. View the list of matching client files displayed as cards
3. Click on any file card to view detailed information
4. Use the tabs to navigate between overview, intake details, and session history

## Backend Selection

- UI shows a small banner indicating the active backend (CSV or MongoDB) and lets you switch for your session.
- By default, the backend is controlled by env: set `NEXT_PUBLIC_USE_MONGO=true` to default to MongoDB.
- All client requests go to a unified endpoint `/api/search`:
  - The UI sends a header `X-Backend: csv|mongo` based on the banner selection.
  - Server falls back to env (`USE_MONGO` or `NEXT_PUBLIC_USE_MONGO`) if the header is not present.

## MongoDB (Optional)

- Create `filemaker-client-search/.env.local` with:
  - `MONGODB_URI=...`
  - `DB_NAME=filemaker`
  - Optional defaults: `NEXT_PUBLIC_USE_MONGO=true` or `USE_MONGO=true`
- Migrate CSV data: `npm run migrate-to-mongo`

### Migration performance flags

You can control session import behavior to speed up initial loads:

- Limit imported sessions: `npm run migrate-to-mongo -- --sessions-limit=10000`
- Import recent sessions only: `npm run migrate-to-mongo -- --since=2022-01-01`
- Change batch size (default 2000): `npm run migrate-to-mongo -- --batch-size=5000`
- Skip sessions entirely (clients/intakes/counselors only): `npm run migrate-to-mongo -- --skip-sessions`
- Dry run (parse only, no writes): `npm run migrate-to-mongo -- --dry-run`

These flags can be combined. Examples:

- Recent sessions with higher throughput: `npm run migrate-to-mongo -- --since=2023-01-01 --batch-size=5000`
- Quick smoke test: `npm run migrate-to-mongo -- --sessions-limit=1000`

## Performance Considerations

- The application loads all CSV data into memory when the first search is performed
- For large datasets, consider implementing server-side pagination
- In a production environment, prefer the MongoDB-backed endpoint for scale

## Data Privacy

- This application is designed for internal use only
- Ensure proper access controls are in place
- No client data is stored in the repository; users must supply their own CSV files

## Future Enhancements

- Add authentication and authorization
- Implement data filtering and advanced search
- Add reporting capabilities
- Create a data import/export utility
- Add session entry functionality

## Troubleshooting

- If CSV files are not loading, check that they are properly placed in the `/data` directory
- CSV column names must match the expected format (see interfaces in `csvUtils.ts`)
- Large CSV files may cause memory issues in development mode

## License

This project is proprietary and intended for internal use only.

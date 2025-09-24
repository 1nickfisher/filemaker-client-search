# Development Guide

This document provides guidelines for developers working on the Filemaker Client Search application.

## Project Structure

```
filemaker-client-search/
├── components/            # React components
│   ├── FileDetails.tsx    # Component for displaying detailed file information
│   ├── SearchForm.tsx     # Search input component
│   └── SearchResults.tsx  # Component for displaying search results
├── data/                  # Data directory for CSV files
│   ├── Client+Counselor Assignment.csv
│   ├── File+Client Name.csv
│   ├── Intake Form.csv
│   └── Session History.csv
├── docs/                  # Documentation
│   ├── DATA_STRUCTURE.md  # Data structure documentation
│   └── DEVELOPMENT.md     # This file
├── pages/                 # Next.js pages
│   ├── api/               # API routes
│   │   ├── file.ts        # Endpoint for file details
│   │   ├── log.ts         # Debug endpoint
│   │   └── search.ts      # Search endpoint
│   ├── file/              # File details pages
│   │   └── [fileNumber].tsx  # Dynamic route for file details
│   └── index.tsx          # Homepage with search functionality
├── public/                # Static assets
├── styles/                # CSS modules
│   ├── FileDetails.module.css
│   ├── FileDetailsPage.module.css
│   ├── Home.module.css
│   └── SearchResults.module.css
├── utils/                 # Utility functions
│   └── csvUtils.ts        # CSV parsing and data handling utilities
└── package.json           # Project dependencies and scripts
```

## Component Architecture

### Main Components

1. **SearchForm**
   - Handles user input for search queries
   - Submits search requests to the API

2. **SearchResults**
   - Displays search results grouped by file number
   - Renders file cards with client names, providers, and key dates
   - Handles navigation to file details page

3. **FileDetails**
   - Displays detailed file information
   - Uses tabs to organize information (Overview, Intake, Sessions)
   - Renders client information, provider details, and session history

### Data Flow

```
User Input → SearchForm → API (/api/search) → SearchResults → (click) → FileDetails
                                  ↓
                            CSV Data Files
```

## API Architecture

### Endpoints

1. **/api/search**
   - **Method:** POST
   - **Purpose:** Search across all data sources
   - **Input:** `{ query: string }`
   - **Process:**
     1. Load data if not already loaded
     2. Search across all data sources
     3. Combine and format results
   - **Output:** `{ results: SearchResult[] }`

2. **/api/file**
   - **Method:** POST
   - **Purpose:** Get detailed information for a specific file
   - **Input:** `{ fileNumber: string }`
   - **Process:**
     1. Find all related records for the file number
     2. Combine client, provider, and session information
   - **Output:** `{ client: {...}, providers: [...], sessions: [...] }`

3. **/api/log** (Development only)
   - **Method:** GET
   - **Purpose:** Debug data loading and CSV file access
   - **Output:** Information about loaded files and sample data

## State Management

- The application uses React's useState and useEffect hooks for local state management
- Server-side state (CSV data) is cached in memory using module-level variables in API routes
- No global state management solution is currently used (Redux, Context API, etc.)

## CSS Architecture

- The application uses CSS Modules for component-specific styling
- Each component has its own CSS module file (e.g., SearchResults.module.css)
- Media queries are used for responsive design

## Code Style and Standards

- TypeScript is used throughout the application for type safety
- Interfaces are defined for all data structures
- Async/await is used for asynchronous operations
- Functions are kept small and focused on a single responsibility

## Development Workflow

1. **Setup**
   - Clone the repository
   - Install dependencies with `npm install`
   - Place CSV files in the `/data` directory

2. **Development**
   - Run the development server with `npm run dev`
   - Access the application at http://localhost:3000

3. **Testing**
   - Manual testing is currently used
   - Test search functionality with various queries
   - Verify file details display correctly

## Performance Considerations

- The application loads all CSV data into memory on first API request
- Large CSV files may impact memory usage
- Consider implementing pagination or virtualization for large result sets

## Future Development Areas

1. **Authentication and Authorization**
   - Add user login system
   - Implement role-based access control

2. **Database Migration**
   - Move from CSV files to a proper database
   - Implement data migration scripts

3. **Advanced Search**
   - Add filters and advanced search options
   - Implement search result sorting

4. **UI Enhancements**
   - Improve mobile responsiveness
   - Add dark mode support
   - Enhance accessibility

5. **Testing**
   - Add unit tests for utilities and components
   - Add integration tests for API endpoints 
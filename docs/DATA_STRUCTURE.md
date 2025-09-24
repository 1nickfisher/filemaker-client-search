# Data Structure Documentation

This document outlines the data structure of the CSV files used in the Filemaker Client Search application.

## CSV Files

The application relies on four primary CSV files that should be placed in the `/data` directory:

### 1. File+Client Name.csv

This file maps file numbers to client names, with support for up to 4 clients per file (for family/couples therapy).

#### Key Fields:
- `FILE_NUMBER` - Unique identifier for the file
- `File Name` - Optional display name for the file 
- `Client1 First Name` - First name of primary client
- `Client1 Last Name` - Last name of primary client
- `Client2 First Name` - First name of secondary client (if applicable)
- `Client2 Last Name` - Last name of secondary client (if applicable)
- `Client3 First Name` - First name of third client (if applicable)
- `Client3 Last Name` - Last name of third client (if applicable)
- `Client4 First Name` - First name of fourth client (if applicable)
- `Client4 Last Name` - Last name of fourth client (if applicable)
- `LOCATION DETAIL` - Additional location information

### 2. Intake Form.csv

This file contains detailed information collected during client intake.

#### Key Fields:
- `FILE NUMBER` - Unique identifier matching the file number from File+Client Name.csv
- `DOB` - Date of birth
- `EMERGENCY CONTACT NAME` - Name of emergency contact
- `EMERGENCY CONTACT NUMBER` - Phone number for emergency contact
- `STREET ADDRESS` - Client's street address
- `CITY` - Client's city
- `STATE` - Client's state
- `ZIP` - Client's zip code
- `PHONE` - Client's phone number

### 3. Client+Counselor Assignment.csv

This file maps clients to counselors/providers and contains therapy details.

#### Key Fields:
- `FILE NUMBER` - Unique identifier matching the file number
- `Counselor First Name` - Provider's first name
- `Counselor Last Name` - Provider's last name
- `THERAPY TYPE` - Type of therapy provided (e.g., Individual, Couples, Family)
- `INTAKE DATE` - Date when therapy began
- `END DATE` - Date when therapy ended (if applicable)
- `LOCATION` - Location where therapy is provided
- `STATUS` or `STATUS ON 3/2/20` - Current status of therapy (header name varies by export)
- `LOCATION DETAIL` - Specific details about therapy location

### 4. Session History.csv

This file contains records of individual therapy sessions.

#### Key Fields:
- `File Number` - Unique identifier matching the file number
- `Session Date` - Date when the session occurred
- `Supervision Group` - Group under which therapy was supervised
- `Session Status` - Status of the session (Attended, No-show, etc.)
- `Session Payment Status` - Payment status for the session
- `Payment Method` - Method of payment used
- `Session Fee` - Fee charged for the session
- `Session Note` - Additional notes about the session

## Data Relationships

The relationships between the CSV files are as follows:

```
File+Client Name.csv
       |
       | (FILE_NUMBER)
       |
       +-------------------+------------------+
       |                   |                  |
Intake Form.csv    Client+Counselor    Session History.csv
                   Assignment.csv
```

All files are linked by the file number, which serves as the primary key across the system.

## Data Loading Process

1. Data is loaded from CSV files in the `/data` directory
2. Files are parsed using the csv-parse library
3. Records are kept in memory for fast searching
4. Each record type has a TypeScript interface that defines its structure

## Search Implementation

The search functionality:
1. Takes a query string
2. Searches across relevant fields in all four datasets
3. Groups results by file number
4. Combines data from all sources for each matched file

## Data Caching

For performance reasons, data is loaded once and cached in memory:
- `clientDataCache` - Stores records from File+Client Name.csv
- `intakeDataCache` - Stores records from Intake Form.csv
- `counselorDataCache` - Stores records from Client+Counselor Assignment.csv
- `sessionDataCache` - Stores records from Session History.csv

In a production environment, this approach should be replaced with a proper database system. 

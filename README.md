# Filemaker Client Search

A web application for searching client, provider, and session history information from CSV data.

## Overview

This application provides a user-friendly interface to search through client databases, allowing users to find information by name, file number, or other identifiers. It imports data from CSV files and provides comprehensive search functionality across all records.

## Features

- Search by client name (first, last, or full name)
- Search by file number
- View detailed client profiles
- View session history
- Responsive design for all devices

## Technology Stack

- Next.js (React framework)
- TypeScript
- Vercel Postgres (database)
- Prisma (ORM)
- TailwindCSS (styling)

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Set up environment variables (see `.env.example`)
4. Run the development server with `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

The application is configured for easy deployment on Vercel.

## Data Import

CSV data can be imported using the data import scripts in the `scripts` directory. See the documentation for detailed instructions.
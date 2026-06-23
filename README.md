# Asset Governance Analytics & Deduplication Dashboard

A full-stack dashboard for analyzing and deduplicating asset data across multiple SQL Server tables.

## Tech Stack

- **Backend**: Node.js, Express.js, mssql
- **Database**: Microsoft SQL Server (AssetsDB)
- **Frontend**: React.js, Tailwind CSS, Recharts, Lucide-react

## Project Structure

```
asset-governance-dashboard/
├── backend/
│   ├── server.js          # Express API server
│   ├── .env.example       # Environment variable template
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page-level views
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API service layer
│   │   └── App.js         # Main application
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```

## Setup

### Prerequisites

- Node.js 16+
- Microsoft SQL Server with `AssetsDB` database
- The database should contain:
  - `Asset_Valuations`
  - `Assets_col_unit`
  - `interactiveMapData`
  - `Governorates_Lookup`
  - `Authorities_Lookup`

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your SQL Server connection details
npm install
npm start
```

The API server runs on `http://localhost:5000`.

### Frontend

```bash
cd frontend
npm install
npm start
```

The React app runs on `http://localhost:3000` and proxies API requests to the backend.

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/health` | Database connection health check |
| `GET /api/lookups/governorates` | List all governorates |
| `GET /api/lookups/authorities` | List all authorities |
| `GET /api/analytics/counts` | Aggregated counts by governorate & authority |
| `GET /api/assets/duplicates` | Records found in multiple tables |
| `GET /api/assets/unique` | Records found in only one table |

All data endpoints support `?gov_serial=&authority_serial=` query parameters for filtering.

## Views

1. **Executive Summary** - KPI cards, bar chart (by governorate), pie chart (by authority), summary table
2. **Deduplication Engine** - Duplicate records and unique records with search and pagination

## Color Coding

- **Blue** (`#3b82f6`) - Assets_col_unit (Units)
- **Green** (`#10b981`) - Asset_Valuations (Valuations)
- **Orange** (`#f97316`) - interactiveMapData (Map Data)

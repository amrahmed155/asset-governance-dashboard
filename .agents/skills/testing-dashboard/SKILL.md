---
name: testing-asset-governance-dashboard
description: Test the Asset Governance Dashboard frontend end-to-end. Use when verifying UI components, navigation, filters, search, and data display after code changes.
---

# Testing the Asset Governance Dashboard

## Overview
This dashboard is a React + Tailwind CSS frontend with an Express/MSSQL backend. Since SQL Server may not be available in test environments, use a mock API server to test frontend rendering and interactions.

## Devin Secrets Needed
None required for frontend testing with mock server. If testing against real SQL Server, you would need `MSSQL_CONNECTION_STRING`.

## Environment Setup

### 1. Start Mock API Server
The backend requires SQL Server which may not be available. Create or use the existing `mock-server.js` at the repo root:

```bash
# Install mock server dependencies at repo root
cd /home/ubuntu/repos/asset-governance-dashboard
npm init -y && npm install express cors

# Start mock server on port 5000
node mock-server.js &
```

The mock server should serve these endpoints matching the real API contract:
- `GET /api/health` - Health check
- `GET /api/analytics/counts?gov=&auth=` - KPI + chart data (supports gov/auth query params)
- `GET /api/assets/duplicates` - Duplicate records array
- `GET /api/assets/unique` - Unique records array
- `GET /api/lookups/governorates` - Governorate options for filter dropdown
- `GET /api/lookups/authorities` - Authority options for filter dropdown
- `GET /api/lookups/asset-types` - Asset type options for filter dropdown
- `GET /api/lookups/asset-sub-types?asset_type=X` - Sub-type options (cascading, filtered by asset_type)
- `GET /api/analytics/dynamic?dimension=governorate|authority|asset_type|asset_sub_type` - Dynamic chart data by dimension

### 2. Start Frontend Dev Server
```bash
cd /home/ubuntu/repos/asset-governance-dashboard/frontend
# Ensure REACT_APP_API_URL points to mock server
# The frontend proxy or env should target http://localhost:5000
npm start &
```

Frontend runs on port 3000. If port is occupied, kill the process first with `fuser -k 3000/tcp`.

### 3. Port Conflicts
If ports 3000 or 5000 are occupied:
```bash
fuser -k 3000/tcp
fuser -k 5000/tcp
```

## Key Testing Areas

### Executive Summary Page (default view)
- **KPI Cards**: 3 cards with Arabic labels: بيانات الامانة الفنية (blue), بيانات الاتصالات (green), بيانات خريطة تفاعلية (orange)
- **Bar Chart**: "Asset Distribution by Governorate" with grouped bars; legend uses Arabic source names
- **Pie Chart**: "Asset Distribution by Authority (Top 10)" as donut chart with percentage labels
- **Authority Summary Table**: Sortable columns with Arabic headers (Authority, بيانات الامانة الفنية, بيانات الاتصالات, بيانات خريطة تفاعلية)

### Deduplication Engine Page
- **Tab Switcher**: "Duplicates (N)" and "Unique (N)" tabs with dynamic counts
- **Duplicate Table**: 8 columns: Description, Governorate, Authority, Asset Type, Sub Type, Occurrences, **Certainty**, Found In (color-coded Arabic badges separated by '+')
- **Certainty Column**: Color-coded progress bar + percentage text. Red (>=90%), Orange (>=75%), Yellow (>=50%), Gray (<50%). Mock data has values: 100, 75, 85, 75, 90.
- **Unique Table**: 6 columns: Source (Arabic badge), Description, Asset Type, Sub Type, Governorate, Authority
- **Search**: Each table has a search input that filters rows across all columns (including Asset Type) and updates the count label

### Sidebar Navigation
- Collapsible via chevron button at bottom
- Collapsed state: icons only (~64px width), expanded: full labels (~240px)
- Collapsed state persists across page navigation (state managed in App.js)

### Filter Bar
- Governorate and Authority dropdowns populated from /api/lookups endpoints
- **Asset_Type dropdown**: Populated from `/api/lookups/asset-types`. Mock data has 7 types (Commercial, Educational, Heritage, Industrial, Infrastructure, Medical, Residential).
- **Asset_Sub_Type dropdown**: Cascading — when an Asset_Type is selected, sub-types reload from `/api/lookups/asset-sub-types?asset_type=X`. Selecting "Commercial" should show 3 sub-types (Office, Retail, Warehouse). Clearing Asset_Type restores all 17 sub-types.
- **Authority dropdown uses `AuthorityCode` as key/value** (not `auth_ID`) — verify this in the DOM option values
- Red "Reset" button appears only when a filter is selected
- Reset clears all 4 dropdowns (Governorate, Authority, Asset Type, Sub Type) and removes the Reset button
- KPI card totals are derived from governorate data, so they may not change when only authority filter is applied (this is expected behavior with the current mock server)

### Dynamic Analysis Chart (Executive Summary, below Authority Summary table)
- Renders a grouped bar chart with 4 dimension selector buttons: Governorate, Authority, Asset Type, Asset Sub Type
- Default dimension is Governorate (shows 5 governorates)
- Clicking a dimension button reloads chart data from `/api/analytics/dynamic?dimension=X`
- Each dimension shows 3 bar series (Arabic labels: بيانات الاتصالات, بيانات الامانة الفنية, بيانات خريطة تفاعلية)
- Active button has a distinct highlight style; scroll down to see the chart section

## Color Coding Convention
- **Units / Assets_col_unit**: Blue (`blue-500`, `blue-100`)
- **Valuations / Asset_Valuations**: Green (`emerald-500`, `emerald-100`)
- **Map Data / interactiveMapData**: Orange (`orange-500`, `orange-100`)

These colors appear in KPI card icons, bar chart bars, pie chart legend, and source badges in tables.

## Testing Tips
- The mock server returns deterministic data, so exact values can be asserted (e.g., KPIs = 855/430/380 for all data, 320/150/95 for Cairo filter)
- Search filters are case-insensitive and match across multiple columns (Description, Governorate, Authority, Asset Type for duplicates; Source, Description, Asset Type, Sub Type, Governorate for unique)
- Table sorting in Authority Summary uses numeric comparison for count columns and string comparison for Authority column
- Filter dropdowns use native HTML `<select>` elements - click to open, then click option to select
- The frontend uses React state management, so navigation between views preserves component state (sidebar collapsed, etc.)
- Mock server duplicate data uses `+` as separator in FoundIn field (e.g., `بيانات الاتصالات + بيانات الامانة الفنية`); the frontend splits on `+` to render individual badges
- The mock server authorities array uses `AuthorityCode` (not `auth_ID`) to match the real database schema

## Common Issues
- **Port conflicts**: React dev server might prompt if port 3000 is taken. Kill existing processes first.
- **Mock server missing deps**: If `mock-server.js` fails, ensure `express` and `cors` are installed at root level.
- **CORS**: Mock server must include CORS headers. The mock-server.js uses `cors()` middleware.
- **API URL mismatch**: Frontend expects API at the URL configured in `frontend/src/services/api.js`. Check `REACT_APP_API_URL` or the hardcoded base URL.
- **Arabic text rendering**: Ensure the browser supports RTL text. Arabic badge labels should render correctly in LTR layout since they are isolated within badge `<span>` elements.
- **Unused imports**: If the frontend build shows warnings about unused imports (e.g., Loader2 from lucide-react), check recently modified component files.

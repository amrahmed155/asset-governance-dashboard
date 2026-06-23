const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sql = require('mssql');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const dbConfig = {
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  database: process.env.DB_DATABASE || 'AssetsDB',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
  },
  requestTimeout: 60000,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool;

async function getPool() {
  if (!pool) {
    pool = await sql.connect(dbConfig);
  }
  return pool;
}

// ─── Health Check ───────────────────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  try {
    const p = await getPool();
    await p.request().query('SELECT 1 AS ok');
    res.json({ status: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'disconnected', error: err.message });
  }
});

// ─── Lookups ────────────────────────────────────────────────────────────────
app.get('/api/lookups/governorates', async (_req, res) => {
  try {
    const p = await getPool();
    const result = await p.request().query(
      `SELECT Gov_ID, Gov_Standard_Name FROM Governorates_Lookup ORDER BY Gov_Standard_Name`
    );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/lookups/authorities', async (_req, res) => {
  try {
    const p = await getPool();
    const result = await p.request().query(
      `SELECT auth_ID, AuthorityName FROM Authorities_Lookup ORDER BY AuthorityName`
    );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Helper: build WHERE clause from filters ───────────────────────────────
function buildFilters(request, govParam, authParam) {
  const clauses = [];
  if (govParam) {
    request.input('gov_serial', sql.Int, parseInt(govParam, 10));
    clauses.push('gov_serial = @gov_serial');
  }
  if (authParam) {
    request.input('authority_serial', sql.Int, parseInt(authParam, 10));
    clauses.push('authority_serial = @authority_serial');
  }
  return clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';
}

// ─── Endpoint A: /api/analytics/counts ──────────────────────────────────────
app.get('/api/analytics/counts', async (req, res) => {
  try {
    const { gov_serial, authority_serial } = req.query;
    const p = await getPool();

    // Governorate breakdown using pre-aggregated subqueries to avoid cartesian product
    const request = p.request();
    if (gov_serial) request.input('gov_serial', sql.Int, parseInt(gov_serial, 10));
    if (authority_serial) request.input('authority_serial', sql.Int, parseInt(authority_serial, 10));

    const vFilterParts = [gov_serial && 'gov_serial = @gov_serial', authority_serial && 'authority_serial = @authority_serial'].filter(Boolean);
    const vWhere = vFilterParts.length ? 'WHERE ' + vFilterParts.join(' AND ') : '';

    const govQuery = `
      SELECT
        g.Gov_Standard_Name AS name,
        ISNULL(v.cnt, 0) AS valuations,
        ISNULL(u.cnt, 0) AS units,
        ISNULL(m.cnt, 0) AS mapData
      FROM Governorates_Lookup g
      LEFT JOIN (
        SELECT gov_serial, COUNT(*) AS cnt
        FROM Asset_Valuations ${vWhere}
        GROUP BY gov_serial
      ) v ON g.Gov_ID = v.gov_serial
      LEFT JOIN (
        SELECT gov_serial, COUNT(*) AS cnt
        FROM Assets_col_unit ${vWhere}
        GROUP BY gov_serial
      ) u ON g.Gov_ID = u.gov_serial
      LEFT JOIN (
        SELECT gov_serial, COUNT(*) AS cnt
        FROM interactiveMapData ${vWhere}
        GROUP BY gov_serial
      ) m ON g.Gov_ID = m.gov_serial
      ${gov_serial ? 'WHERE g.Gov_ID = @gov_serial' : ''}
      ORDER BY g.Gov_Standard_Name
    `;
    const govResult = await request.query(govQuery);

    // Authority breakdown using pre-aggregated subqueries
    const request2 = p.request();
    if (gov_serial) request2.input('gov_serial', sql.Int, parseInt(gov_serial, 10));
    if (authority_serial) request2.input('authority_serial', sql.Int, parseInt(authority_serial, 10));

    const authQuery = `
      SELECT
        a.AuthorityName AS name,
        ISNULL(v.cnt, 0) AS valuations,
        ISNULL(u.cnt, 0) AS units,
        ISNULL(m.cnt, 0) AS mapData
      FROM Authorities_Lookup a
      LEFT JOIN (
        SELECT authority_serial, COUNT(*) AS cnt
        FROM Asset_Valuations ${vWhere}
        GROUP BY authority_serial
      ) v ON a.auth_ID = v.authority_serial
      LEFT JOIN (
        SELECT authority_serial, COUNT(*) AS cnt
        FROM Assets_col_unit ${vWhere}
        GROUP BY authority_serial
      ) u ON a.auth_ID = u.authority_serial
      LEFT JOIN (
        SELECT authority_serial, COUNT(*) AS cnt
        FROM interactiveMapData ${vWhere}
        GROUP BY authority_serial
      ) m ON a.auth_ID = m.authority_serial
      ${authority_serial ? 'WHERE a.auth_ID = @authority_serial' : ''}
      ORDER BY a.AuthorityName
    `;
    const authResult = await request2.query(authQuery);

    // KPI totals
    const request3 = p.request();
    if (gov_serial) request3.input('gov_serial', sql.Int, parseInt(gov_serial, 10));
    if (authority_serial) request3.input('authority_serial', sql.Int, parseInt(authority_serial, 10));

    const kpiQuery = `
      SELECT
        (SELECT COUNT(*) FROM Asset_Valuations ${vWhere}) AS totalValuations,
        (SELECT COUNT(*) FROM Assets_col_unit ${vWhere}) AS totalUnits,
        (SELECT COUNT(*) FROM interactiveMapData ${vWhere}) AS totalMapPoints
    `;
    const kpiResult = await request3.query(kpiQuery);

    res.json({
      kpi: kpiResult.recordset[0],
      byGovernorate: govResult.recordset,
      byAuthority: authResult.recordset,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Endpoint B: /api/assets/duplicates ─────────────────────────────────────
app.get('/api/assets/duplicates', async (req, res) => {
  try {
    const { gov_serial, authority_serial } = req.query;
    const p = await getPool();
    const request = p.request();

    const filters = [];
    if (gov_serial) {
      request.input('gov_serial', sql.Int, parseInt(gov_serial, 10));
      filters.push('gov_serial = @gov_serial');
    }
    if (authority_serial) {
      request.input('authority_serial', sql.Int, parseInt(authority_serial, 10));
      filters.push('authority_serial = @authority_serial');
    }
    const filterClause = filters.length ? 'WHERE ' + filters.join(' AND ') : '';

    const query = `
      WITH CombinedAssets AS (
        SELECT 'Valuations' AS Source, gov_serial, authority_serial,
               Asset_Type AS Type, Asset_Details AS Descr
        FROM Asset_Valuations ${filterClause}
        UNION ALL
        SELECT 'Units' AS Source, gov_serial, authority_serial,
               Display_Asset_Type, Asset_Description
        FROM Assets_col_unit ${filterClause}
        UNION ALL
        SELECT 'Map' AS Source, gov_serial, authority_serial,
               Classification, Landmark_Name
        FROM interactiveMapData ${filterClause}
      )
      SELECT
        ca.Descr,
        g.Gov_Standard_Name AS Governorate,
        a.AuthorityName AS Authority,
        ca.gov_serial,
        ca.authority_serial,
        COUNT(*) AS Occurrences,
        STRING_AGG(ca.Source, ', ') AS Sources
      FROM CombinedAssets ca
      LEFT JOIN Governorates_Lookup g ON ca.gov_serial = g.Gov_ID
      LEFT JOIN Authorities_Lookup a ON ca.authority_serial = a.auth_ID
      GROUP BY ca.Descr, ca.gov_serial, ca.authority_serial,
               g.Gov_Standard_Name, a.AuthorityName
      HAVING COUNT(DISTINCT ca.Source) > 1
      ORDER BY Occurrences DESC
    `;
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Endpoint C: /api/assets/unique ─────────────────────────────────────────
app.get('/api/assets/unique', async (req, res) => {
  try {
    const { gov_serial, authority_serial } = req.query;
    const p = await getPool();
    const request = p.request();

    const filters = [];
    if (gov_serial) {
      request.input('gov_serial', sql.Int, parseInt(gov_serial, 10));
      filters.push('gov_serial = @gov_serial');
    }
    if (authority_serial) {
      request.input('authority_serial', sql.Int, parseInt(authority_serial, 10));
      filters.push('authority_serial = @authority_serial');
    }
    const filterClause = filters.length ? 'WHERE ' + filters.join(' AND ') : '';

    const query = `
      WITH CombinedAssets AS (
        SELECT 'Valuations' AS Source, gov_serial, authority_serial,
               Asset_Type AS Type, Asset_Details AS Descr
        FROM Asset_Valuations ${filterClause}
        UNION ALL
        SELECT 'Units' AS Source, gov_serial, authority_serial,
               Display_Asset_Type, Asset_Description
        FROM Assets_col_unit ${filterClause}
        UNION ALL
        SELECT 'Map' AS Source, gov_serial, authority_serial,
               Classification, Landmark_Name
        FROM interactiveMapData ${filterClause}
      ),
      Grouped AS (
        SELECT
          Descr, gov_serial, authority_serial,
          COUNT(DISTINCT Source) AS SourceCount,
          MIN(Source) AS Source,
          MIN(Type) AS Type
        FROM CombinedAssets
        GROUP BY Descr, gov_serial, authority_serial
        HAVING COUNT(DISTINCT Source) = 1
      )
      SELECT
        gr.Source,
        gr.Descr,
        gr.Type,
        g.Gov_Standard_Name AS Governorate,
        a.AuthorityName AS Authority,
        gr.gov_serial,
        gr.authority_serial
      FROM Grouped gr
      LEFT JOIN Governorates_Lookup g ON gr.gov_serial = g.Gov_ID
      LEFT JOIN Authorities_Lookup a ON gr.authority_serial = a.auth_ID
      ORDER BY gr.Source, gr.Descr
    `;
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Start server ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

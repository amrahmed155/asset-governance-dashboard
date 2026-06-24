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
  connectionTimeout: 120000,
  requestTimeout: 120000,
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
      `SELECT AuthorityCode, AuthorityName FROM Authorities_Lookup ORDER BY AuthorityName`
    );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/lookups/asset-types', async (_req, res) => {
  try {
    const p = await getPool();
    const result = await p.request().query(
      `SELECT DISTINCT Asset_Type FROM AssetLookup WHERE Asset_Type IS NOT NULL ORDER BY Asset_Type`
    );
    res.json(result.recordset.map(r => r.Asset_Type));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/lookups/asset-sub-types', async (req, res) => {
  try {
    const { asset_type } = req.query;
    const p = await getPool();
    const request = p.request();
    let query = `SELECT DISTINCT Asset_Sub_Type FROM AssetLookup WHERE Asset_Sub_Type IS NOT NULL`;
    if (asset_type) {
      request.input('asset_type', sql.NVarChar, asset_type);
      query += ` AND Asset_Type = @asset_type`;
    }
    query += ` ORDER BY Asset_Sub_Type`;
    const result = await request.query(query);
    res.json(result.recordset.map(r => r.Asset_Sub_Type));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Endpoint D: /api/analytics/dynamic ─────────────────────────────────────
app.get('/api/analytics/dynamic', async (req, res) => {
  try {
    const { dimension } = req.query;
    const validDimensions = ['governorate', 'authority', 'asset_type', 'asset_sub_type'];
    if (!dimension || !validDimensions.includes(dimension)) {
      return res.status(400).json({ error: `dimension must be one of: ${validDimensions.join(', ')}` });
    }

    const p = await getPool();
    const request = p.request();

    const dimConfig = {
      governorate: {
        selectExpr: 'g.Gov_Standard_Name',
        joinV: 'JOIN Governorates_Lookup g ON v.gov_serial = g.Gov_ID',
        joinU: 'JOIN Governorates_Lookup g ON u.gov_serial = g.Gov_ID',
        joinM: 'JOIN Governorates_Lookup g ON m.gov_serial = g.Gov_ID',
      },
      authority: {
        selectExpr: 'al.AuthorityName',
        joinV: 'JOIN Authorities_Lookup al ON v.authority_serial = al.AuthorityCode',
        joinU: 'JOIN Authorities_Lookup al ON u.authority_serial = al.AuthorityCode',
        joinM: 'JOIN Authorities_Lookup al ON m.authority_serial = al.AuthorityCode',
      },
      asset_type: {
        selectExpr: 'lk.Asset_Type',
        joinV: 'JOIN AssetLookup lk ON v.AssetTypeID = lk.AssetTypeID',
        joinU: 'JOIN AssetLookup lk ON u.AssetTypeID = lk.AssetTypeID',
        joinM: 'JOIN AssetLookup lk ON m.AssetTypeID = lk.AssetTypeID',
      },
      asset_sub_type: {
        selectExpr: 'lk.Asset_Sub_Type',
        joinV: 'JOIN AssetLookup lk ON v.AssetTypeID = lk.AssetTypeID',
        joinU: 'JOIN AssetLookup lk ON u.AssetTypeID = lk.AssetTypeID',
        joinM: 'JOIN AssetLookup lk ON m.AssetTypeID = lk.AssetTypeID',
      },
    };
    const cfg = dimConfig[dimension];
    const query = `
      SELECT dim AS name,
             ISNULL(SUM(valuations), 0) AS valuations,
             ISNULL(SUM(units), 0) AS units,
             ISNULL(SUM(mapData), 0) AS mapData
      FROM (
        SELECT ${cfg.selectExpr} AS dim, 1 AS valuations, 0 AS units, 0 AS mapData
        FROM Asset_Valuations v ${cfg.joinV}
        UNION ALL
        SELECT ${cfg.selectExpr} AS dim, 0, 1, 0
        FROM Assets_col_unit u ${cfg.joinU}
        UNION ALL
        SELECT ${cfg.selectExpr} AS dim, 0, 0, 1
        FROM interactiveMapData m ${cfg.joinM}
      ) combined
      WHERE dim IS NOT NULL
      GROUP BY dim
      ORDER BY (ISNULL(SUM(valuations), 0) + ISNULL(SUM(units), 0) + ISNULL(SUM(mapData), 0)) DESC
    `;
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Endpoint A: /api/analytics/counts ──────────────────────────────────────
app.get('/api/analytics/counts', async (req, res) => {
  try {
    const { gov_serial, authority_serial, asset_type, asset_sub_type } = req.query;
    const p = await getPool();

    const request = p.request();
    if (gov_serial) request.input('gov_serial', sql.Int, parseInt(gov_serial, 10));
    if (authority_serial) request.input('authority_serial', sql.Int, parseInt(authority_serial, 10));
    if (asset_type) request.input('asset_type', sql.NVarChar, asset_type);
    if (asset_sub_type) request.input('asset_sub_type', sql.NVarChar, asset_sub_type);

    const vFilterParts = [
      gov_serial && 'gov_serial = @gov_serial',
      authority_serial && 'authority_serial = @authority_serial',
      asset_type && 'AssetTypeID IN (SELECT AssetTypeID FROM AssetLookup WHERE Asset_Type = @asset_type)',
      asset_sub_type && 'AssetTypeID IN (SELECT AssetTypeID FROM AssetLookup WHERE Asset_Sub_Type = @asset_sub_type)',
    ].filter(Boolean);
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
      ) v ON a.AuthorityCode = v.authority_serial
      LEFT JOIN (
        SELECT authority_serial, COUNT(*) AS cnt
        FROM Assets_col_unit ${vWhere}
        GROUP BY authority_serial
      ) u ON a.AuthorityCode = u.authority_serial
      LEFT JOIN (
        SELECT authority_serial, COUNT(*) AS cnt
        FROM interactiveMapData ${vWhere}
        GROUP BY authority_serial
      ) m ON a.AuthorityCode = m.authority_serial
      ${authority_serial ? 'WHERE a.AuthorityCode = @authority_serial' : ''}
      ORDER BY a.AuthorityName
    `;
    const authResult = await request2.query(authQuery);

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
    const { gov_serial, authority_serial, asset_type, asset_sub_type } = req.query;
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
    if (asset_type) {
      request.input('asset_type', sql.NVarChar, asset_type);
      filters.push('AssetTypeID IN (SELECT AssetTypeID FROM AssetLookup WHERE Asset_Type = @asset_type)');
    }
    if (asset_sub_type) {
      request.input('asset_sub_type', sql.NVarChar, asset_sub_type);
      filters.push('AssetTypeID IN (SELECT AssetTypeID FROM AssetLookup WHERE Asset_Sub_Type = @asset_sub_type)');
    }
    const filterClause = filters.length ? 'WHERE ' + filters.join(' AND ') : '';

    const query = `
      WITH CombinedAssets AS (
        SELECT N'\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0627\u062a\u0635\u0627\u0644\u0627\u062a' AS Source, gov_serial, authority_serial,
               AssetTypeID, CHECKSUM(Asset_Details) AS DescHash,
               CAST(LEFT(ISNULL(Asset_Details, N''), 200) AS NVARCHAR(200)) AS Description
        FROM Asset_Valuations ${filterClause}
        UNION ALL
        SELECT N'\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0627\u0645\u0627\u0646\u0629 \u0627\u0644\u0641\u0646\u064a\u0629', gov_serial, authority_serial,
               AssetTypeID, CHECKSUM(Asset_Description),
               CAST(LEFT(ISNULL(Asset_Description, N''), 200) AS NVARCHAR(200))
        FROM Assets_col_unit ${filterClause}
        UNION ALL
        SELECT N'\u0628\u064a\u0627\u0646\u0627\u062a \u062e\u0631\u064a\u0637\u0629 \u062a\u0641\u0627\u0639\u0644\u064a\u0629', gov_serial, authority_serial,
               AssetTypeID, CHECKSUM(Landmark_Name),
               CAST(LEFT(ISNULL(Landmark_Name, N''), 200) AS NVARCHAR(200))
        FROM interactiveMapData ${filterClause}
      ),
      Grouped AS (
        SELECT
          DescHash, gov_serial, authority_serial, AssetTypeID,
          MIN(Description) AS Description,
          COUNT(*) AS Occurrences,
          COUNT(DISTINCT Source) AS SourceCount,
          STRING_AGG(CAST(Source AS NVARCHAR(MAX)), N' + ') AS FoundIn
        FROM CombinedAssets
        GROUP BY DescHash, gov_serial, authority_serial, AssetTypeID
        HAVING COUNT(DISTINCT Source) > 1
      )
      SELECT TOP 500
        gr.Description,
        g.Gov_Standard_Name AS Governorate,
        al.AuthorityName AS Authority,
        lk.Asset_Type,
        lk.Asset_Sub_Type,
        gr.Occurrences,
        gr.FoundIn,
        CASE
          WHEN gr.SourceCount = 3 THEN 100
          WHEN gr.SourceCount = 2 THEN
            CASE WHEN gr.Occurrences >= 4 THEN 90
                 WHEN gr.Occurrences >= 3 THEN 85
                 ELSE 75
            END
          ELSE 50
        END AS Certainty
      FROM Grouped gr
      JOIN Governorates_Lookup g ON gr.gov_serial = g.Gov_ID
      JOIN Authorities_Lookup al ON gr.authority_serial = al.AuthorityCode
      JOIN AssetLookup lk ON gr.AssetTypeID = lk.AssetTypeID
      ORDER BY Certainty DESC, gr.Occurrences DESC
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
    const { gov_serial, authority_serial, asset_type, asset_sub_type } = req.query;
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
    if (asset_type) {
      request.input('asset_type', sql.NVarChar, asset_type);
      filters.push('AssetTypeID IN (SELECT AssetTypeID FROM AssetLookup WHERE Asset_Type = @asset_type)');
    }
    if (asset_sub_type) {
      request.input('asset_sub_type', sql.NVarChar, asset_sub_type);
      filters.push('AssetTypeID IN (SELECT AssetTypeID FROM AssetLookup WHERE Asset_Sub_Type = @asset_sub_type)');
    }
    const filterClause = filters.length ? 'WHERE ' + filters.join(' AND ') : '';

    const query = `
      WITH CombinedAssets AS (
        SELECT N'\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0627\u062a\u0635\u0627\u0644\u0627\u062a' AS Source, gov_serial, authority_serial,
               AssetTypeID, CHECKSUM(Asset_Details) AS DescHash,
               CAST(LEFT(ISNULL(Asset_Details, N''), 200) AS NVARCHAR(200)) AS Description
        FROM Asset_Valuations ${filterClause}
        UNION ALL
        SELECT N'\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0627\u0645\u0627\u0646\u0629 \u0627\u0644\u0641\u0646\u064a\u0629', gov_serial, authority_serial,
               AssetTypeID, CHECKSUM(Asset_Description),
               CAST(LEFT(ISNULL(Asset_Description, N''), 200) AS NVARCHAR(200))
        FROM Assets_col_unit ${filterClause}
        UNION ALL
        SELECT N'\u0628\u064a\u0627\u0646\u0627\u062a \u062e\u0631\u064a\u0637\u0629 \u062a\u0641\u0627\u0639\u0644\u064a\u0629', gov_serial, authority_serial,
               AssetTypeID, CHECKSUM(Landmark_Name),
               CAST(LEFT(ISNULL(Landmark_Name, N''), 200) AS NVARCHAR(200))
        FROM interactiveMapData ${filterClause}
      ),
      Grouped AS (
        SELECT
          DescHash, gov_serial, authority_serial, AssetTypeID,
          MIN(Description) AS Description,
          COUNT(DISTINCT Source) AS SourceCount,
          MIN(Source) AS Source
        FROM CombinedAssets
        GROUP BY DescHash, gov_serial, authority_serial, AssetTypeID
        HAVING COUNT(DISTINCT Source) = 1
      )
      SELECT TOP 500
        gr.Source,
        gr.Description,
        g.Gov_Standard_Name AS Governorate,
        al.AuthorityName AS Authority,
        lk.Asset_Type,
        lk.Asset_Sub_Type
      FROM Grouped gr
      JOIN Governorates_Lookup g ON gr.gov_serial = g.Gov_ID
      JOIN Authorities_Lookup al ON gr.authority_serial = al.AuthorityCode
      JOIN AssetLookup lk ON gr.AssetTypeID = lk.AssetTypeID
      ORDER BY gr.Source, gr.Description
    `;
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Endpoint E: /api/analytics/asset-summary ───────────────────────────────
app.get('/api/analytics/asset-summary', async (req, res) => {
  try {
    const { gov_serial, authority_serial, asset_type, asset_sub_type } = req.query;
    const p = await getPool();
    const request = p.request();

    const filters = [];
    if (gov_serial) {
      request.input('gov_serial', sql.Int, parseInt(gov_serial, 10));
      filters.push('combined.gov_serial = @gov_serial');
    }
    if (authority_serial) {
      request.input('authority_serial', sql.Int, parseInt(authority_serial, 10));
      filters.push('combined.authority_serial = @authority_serial');
    }
    if (asset_type) {
      request.input('asset_type', sql.NVarChar, asset_type);
      filters.push('lk.Asset_Type = @asset_type');
    }
    if (asset_sub_type) {
      request.input('asset_sub_type', sql.NVarChar, asset_sub_type);
      filters.push('lk.Asset_Sub_Type = @asset_sub_type');
    }
    const havingClause = filters.length ? 'WHERE ' + filters.join(' AND ') : '';

    const query = `
      SELECT
        lk.Asset_Type,
        lk.Asset_Sub_Type,
        g.Gov_Standard_Name AS Governorate,
        al.AuthorityName AS Authority,
        ISNULL(SUM(CASE WHEN combined.src = 'v' THEN combined.cnt ELSE 0 END), 0) AS valuations,
        ISNULL(SUM(CASE WHEN combined.src = 'u' THEN combined.cnt ELSE 0 END), 0) AS units,
        ISNULL(SUM(CASE WHEN combined.src = 'm' THEN combined.cnt ELSE 0 END), 0) AS mapData
      FROM (
        SELECT 'v' AS src, AssetTypeID, gov_serial, authority_serial, COUNT(*) AS cnt
        FROM Asset_Valuations WHERE AssetTypeID IS NOT NULL GROUP BY AssetTypeID, gov_serial, authority_serial
        UNION ALL
        SELECT 'u', AssetTypeID, gov_serial, authority_serial, COUNT(*)
        FROM Assets_col_unit WHERE AssetTypeID IS NOT NULL GROUP BY AssetTypeID, gov_serial, authority_serial
        UNION ALL
        SELECT 'm', AssetTypeID, gov_serial, authority_serial, COUNT(*)
        FROM interactiveMapData WHERE AssetTypeID IS NOT NULL GROUP BY AssetTypeID, gov_serial, authority_serial
      ) combined
      JOIN AssetLookup lk ON combined.AssetTypeID = lk.AssetTypeID
      JOIN Governorates_Lookup g ON combined.gov_serial = g.Gov_ID
      JOIN Authorities_Lookup al ON combined.authority_serial = al.AuthorityCode
      ${havingClause}
      GROUP BY lk.Asset_Type, lk.Asset_Sub_Type, g.Gov_Standard_Name, al.AuthorityName
      ORDER BY
        (ISNULL(SUM(CASE WHEN combined.src = 'v' THEN combined.cnt ELSE 0 END), 0)
        + ISNULL(SUM(CASE WHEN combined.src = 'u' THEN combined.cnt ELSE 0 END), 0)
        + ISNULL(SUM(CASE WHEN combined.src = 'm' THEN combined.cnt ELSE 0 END), 0)) DESC
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

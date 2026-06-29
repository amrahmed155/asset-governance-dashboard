const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());

const governorates = [
  { Gov_ID: 1, Gov_Standard_Name: 'Cairo' },
  { Gov_ID: 2, Gov_Standard_Name: 'Giza' },
  { Gov_ID: 3, Gov_Standard_Name: 'Alexandria' },
  { Gov_ID: 4, Gov_Standard_Name: 'Luxor' },
  { Gov_ID: 5, Gov_Standard_Name: 'Aswan' },
];

const authorities = [
  { AuthorityCode: 1, AuthorityName: 'Ministry of Finance' },
  { AuthorityCode: 2, AuthorityName: 'Ministry of Housing' },
  { AuthorityCode: 3, AuthorityName: 'Ministry of Education' },
  { AuthorityCode: 4, AuthorityName: 'Ministry of Health' },
  { AuthorityCode: 5, AuthorityName: 'Ministry of Transport' },
];

const assetTypes = ['Commercial', 'Educational', 'Heritage', 'Industrial', 'Infrastructure', 'Medical', 'Residential'];

const assetSubTypeMap = {
  Commercial: ['Office', 'Retail', 'Warehouse'],
  Educational: ['School', 'University'],
  Heritage: ['Museum', 'Temple', 'Monument'],
  Industrial: ['Factory', 'Warehouse', 'Plant'],
  Infrastructure: ['Bridge', 'Road', 'Water'],
  Medical: ['Hospital', 'Clinic'],
  Residential: ['Apartment', 'Villa'],
};

app.get('/api/health', (_req, res) => res.json({ status: 'connected' }));

app.get('/api/lookups/governorates', (_req, res) => res.json(governorates));
app.get('/api/lookups/authorities', (_req, res) => res.json(authorities));

app.get('/api/lookups/asset-types', (_req, res) => res.json(assetTypes));

app.get('/api/lookups/asset-sub-types', (req, res) => {
  const { asset_type } = req.query;
  if (asset_type && assetSubTypeMap[asset_type]) {
    return res.json(assetSubTypeMap[asset_type]);
  }
  const all = [...new Set(Object.values(assetSubTypeMap).flat())].sort();
  res.json(all);
});

app.get('/api/analytics/counts', (req, res) => {
  const { gov_serial, authority_serial } = req.query;
  let byGov = [
    { name: 'Cairo', valuations: 150, units: 320, mapData: 95 },
    { name: 'Giza', valuations: 85, units: 210, mapData: 60 },
    { name: 'Alexandria', valuations: 120, units: 180, mapData: 75 },
    { name: 'Luxor', valuations: 45, units: 90, mapData: 110 },
    { name: 'Aswan', valuations: 30, units: 55, mapData: 40 },
  ];
  let byAuth = [
    { name: 'Ministry of Finance', valuations: 95, units: 200, mapData: 80 },
    { name: 'Ministry of Housing', valuations: 120, units: 280, mapData: 60 },
    { name: 'Ministry of Education', valuations: 75, units: 150, mapData: 45 },
    { name: 'Ministry of Health', valuations: 80, units: 130, mapData: 90 },
    { name: 'Ministry of Transport', valuations: 60, units: 95, mapData: 105 },
  ];

  if (gov_serial) {
    const idx = parseInt(gov_serial, 10) - 1;
    byGov = idx >= 0 && idx < byGov.length ? [byGov[idx]] : [];
  }
  if (authority_serial) {
    const idx = parseInt(authority_serial, 10) - 1;
    byAuth = idx >= 0 && idx < byAuth.length ? [byAuth[idx]] : [];
  }

  const totalValuations = byGov.reduce((s, g) => s + g.valuations, 0);
  const totalUnits = byGov.reduce((s, g) => s + g.units, 0);
  const totalMapPoints = byGov.reduce((s, g) => s + g.mapData, 0);

  res.json({
    kpi: { totalValuations, totalUnits, totalMapPoints },
    byGovernorate: byGov,
    byAuthority: byAuth,
  });
});

app.get('/api/assets/duplicates', (_req, res) => {
  res.json([
    { Description: 'Government Office Building A', Governorate: 'Cairo', Authority: 'Ministry of Finance', Asset_Type: 'Commercial', Asset_Sub_Type: 'Office', Occurrences: 3, Certainty: 100, FoundIn: '\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0627\u062a\u0635\u0627\u0644\u0627\u062a + \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0627\u0645\u0627\u0646\u0629 \u0627\u0644\u0641\u0646\u064a\u0629 + \u0628\u064a\u0627\u0646\u0627\u062a \u062e\u0631\u064a\u0637\u0629 \u062a\u0641\u0627\u0639\u0644\u064a\u0629' },
    { Description: 'Public School Complex #12', Governorate: 'Giza', Authority: 'Ministry of Education', Asset_Type: 'Educational', Asset_Sub_Type: 'School', Occurrences: 2, Certainty: 75, FoundIn: '\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0627\u0645\u0627\u0646\u0629 \u0627\u0644\u0641\u0646\u064a\u0629 + \u0628\u064a\u0627\u0646\u0627\u062a \u062e\u0631\u064a\u0637\u0629 \u062a\u0641\u0627\u0639\u0644\u064a\u0629' },
    { Description: 'District Hospital - West Wing', Governorate: 'Alexandria', Authority: 'Ministry of Health', Asset_Type: 'Medical', Asset_Sub_Type: 'Hospital', Occurrences: 3, Certainty: 85, FoundIn: '\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0627\u062a\u0635\u0627\u0644\u0627\u062a + \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0627\u0645\u0627\u0646\u0629 \u0627\u0644\u0641\u0646\u064a\u0629' },
    { Description: 'National Museum Annex', Governorate: 'Luxor', Authority: 'Ministry of Finance', Asset_Type: 'Heritage', Asset_Sub_Type: 'Museum', Occurrences: 2, Certainty: 75, FoundIn: '\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0627\u062a\u0635\u0627\u0644\u0627\u062a + \u0628\u064a\u0627\u0646\u0627\u062a \u062e\u0631\u064a\u0637\u0629 \u062a\u0641\u0627\u0639\u0644\u064a\u0629' },
    { Description: 'Highway Bridge #45', Governorate: 'Cairo', Authority: 'Ministry of Transport', Asset_Type: 'Infrastructure', Asset_Sub_Type: 'Bridge', Occurrences: 4, Certainty: 90, FoundIn: '\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0627\u0645\u0627\u0646\u0629 \u0627\u0644\u0641\u0646\u064a\u0629 + \u0628\u064a\u0627\u0646\u0627\u062a \u062e\u0631\u064a\u0637\u0629 \u062a\u0641\u0627\u0639\u0644\u064a\u0629' },
  ]);
});

app.get('/api/assets/unique', (_req, res) => {
  res.json([
    { Source: '\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0627\u062a\u0635\u0627\u0644\u0627\u062a', Description: 'Central Bank Branch Office', Asset_Type: 'Commercial', Asset_Sub_Type: 'Office', Governorate: 'Cairo', Authority: 'Ministry of Finance' },
    { Source: '\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0627\u0645\u0627\u0646\u0629 \u0627\u0644\u0641\u0646\u064a\u0629', Description: 'Residential Block 7A', Asset_Type: 'Residential', Asset_Sub_Type: 'Apartment', Governorate: 'Giza', Authority: 'Ministry of Housing' },
    { Source: '\u0628\u064a\u0627\u0646\u0627\u062a \u062e\u0631\u064a\u0637\u0629 \u062a\u0641\u0627\u0639\u0644\u064a\u0629', Description: 'Heritage Site - Temple of Karnak', Asset_Type: 'Heritage', Asset_Sub_Type: 'Temple', Governorate: 'Luxor', Authority: 'Ministry of Finance' },
    { Source: '\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0627\u062a\u0635\u0627\u0644\u0627\u062a', Description: 'Industrial Zone Warehouse', Asset_Type: 'Industrial', Asset_Sub_Type: 'Warehouse', Governorate: 'Alexandria', Authority: 'Ministry of Transport' },
    { Source: '\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0627\u0645\u0627\u0646\u0629 \u0627\u0644\u0641\u0646\u064a\u0629', Description: 'Primary Care Clinic - Rural', Asset_Type: 'Medical', Asset_Sub_Type: 'Clinic', Governorate: 'Aswan', Authority: 'Ministry of Health' },
    { Source: '\u0628\u064a\u0627\u0646\u0627\u062a \u062e\u0631\u064a\u0637\u0629 \u062a\u0641\u0627\u0639\u0644\u064a\u0629', Description: 'Water Treatment Plant #3', Asset_Type: 'Infrastructure', Asset_Sub_Type: 'Water', Governorate: 'Cairo', Authority: 'Ministry of Housing' },
  ]);
});

app.get('/api/analytics/asset-summary', (req, res) => {
  const summaryData = [
    { Asset_Type: 'Commercial', Asset_Sub_Type: 'Office', Governorate: 'Cairo', Authority: 'Ministry of Finance', valuations: 45, units: 80, mapData: 25 },
    { Asset_Type: 'Commercial', Asset_Sub_Type: 'Retail', Governorate: 'Cairo', Authority: 'Ministry of Housing', valuations: 30, units: 60, mapData: 20 },
    { Asset_Type: 'Commercial', Asset_Sub_Type: 'Warehouse', Governorate: 'Giza', Authority: 'Ministry of Transport', valuations: 15, units: 35, mapData: 10 },
    { Asset_Type: 'Residential', Asset_Sub_Type: 'Apartment', Governorate: 'Cairo', Authority: 'Ministry of Housing', valuations: 60, units: 130, mapData: 25 },
    { Asset_Type: 'Residential', Asset_Sub_Type: 'Villa', Governorate: 'Giza', Authority: 'Ministry of Housing', valuations: 20, units: 45, mapData: 10 },
    { Asset_Type: 'Infrastructure', Asset_Sub_Type: 'Bridge', Governorate: 'Cairo', Authority: 'Ministry of Transport', valuations: 35, units: 70, mapData: 65 },
    { Asset_Type: 'Infrastructure', Asset_Sub_Type: 'Road', Governorate: 'Alexandria', Authority: 'Ministry of Transport', valuations: 25, units: 50, mapData: 30 },
    { Asset_Type: 'Infrastructure', Asset_Sub_Type: 'Water', Governorate: 'Aswan', Authority: 'Ministry of Housing', valuations: 20, units: 40, mapData: 25 },
    { Asset_Type: 'Medical', Asset_Sub_Type: 'Hospital', Governorate: 'Alexandria', Authority: 'Ministry of Health', valuations: 45, units: 90, mapData: 55 },
    { Asset_Type: 'Medical', Asset_Sub_Type: 'Clinic', Governorate: 'Luxor', Authority: 'Ministry of Health', valuations: 15, units: 30, mapData: 15 },
    { Asset_Type: 'Educational', Asset_Sub_Type: 'School', Governorate: 'Giza', Authority: 'Ministry of Education', valuations: 40, units: 60, mapData: 30 },
    { Asset_Type: 'Educational', Asset_Sub_Type: 'University', Governorate: 'Cairo', Authority: 'Ministry of Education', valuations: 10, units: 20, mapData: 10 },
    { Asset_Type: 'Heritage', Asset_Sub_Type: 'Museum', Governorate: 'Cairo', Authority: 'Ministry of Finance', valuations: 15, units: 20, mapData: 18 },
    { Asset_Type: 'Heritage', Asset_Sub_Type: 'Temple', Governorate: 'Luxor', Authority: 'Ministry of Finance', valuations: 10, units: 15, mapData: 12 },
    { Asset_Type: 'Industrial', Asset_Sub_Type: 'Factory', Governorate: 'Alexandria', Authority: 'Ministry of Transport', valuations: 5, units: 10, mapData: 3 },
    { Asset_Type: 'Industrial', Asset_Sub_Type: 'Plant', Governorate: 'Aswan', Authority: 'Ministry of Housing', valuations: 5, units: 10, mapData: 2 },
  ];
  let result = summaryData;
  const { gov_serial, authority_serial, asset_type, asset_sub_type } = req.query;
  if (asset_type) result = result.filter(r => r.Asset_Type === asset_type);
  if (asset_sub_type) result = result.filter(r => r.Asset_Sub_Type === asset_sub_type);
  if (gov_serial) {
    const gov = governorates.find(g => g.Gov_ID === parseInt(gov_serial, 10));
    if (gov) result = result.filter(r => r.Governorate === gov.Gov_Standard_Name);
  }
  if (authority_serial) {
    const auth = authorities.find(a => a.AuthorityCode === parseInt(authority_serial, 10));
    if (auth) result = result.filter(r => r.Authority === auth.AuthorityName);
  }
  res.json(result);
});

app.get('/api/analytics/dynamic', (req, res) => {
  const { dimension } = req.query;
  const dynamicData = {
    governorate: [
      { name: 'Cairo', valuations: 150, units: 320, mapData: 95 },
      { name: 'Giza', valuations: 85, units: 210, mapData: 60 },
      { name: 'Alexandria', valuations: 120, units: 180, mapData: 75 },
      { name: 'Luxor', valuations: 45, units: 90, mapData: 110 },
      { name: 'Aswan', valuations: 30, units: 55, mapData: 40 },
    ],
    authority: [
      { name: 'Ministry of Finance', valuations: 95, units: 200, mapData: 80 },
      { name: 'Ministry of Housing', valuations: 120, units: 280, mapData: 60 },
      { name: 'Ministry of Education', valuations: 75, units: 150, mapData: 45 },
      { name: 'Ministry of Health', valuations: 80, units: 130, mapData: 90 },
      { name: 'Ministry of Transport', valuations: 60, units: 95, mapData: 105 },
    ],
    asset_type: [
      { name: 'Commercial', valuations: 120, units: 250, mapData: 80 },
      { name: 'Residential', valuations: 90, units: 200, mapData: 45 },
      { name: 'Infrastructure', valuations: 75, units: 150, mapData: 110 },
      { name: 'Medical', valuations: 60, units: 120, mapData: 70 },
      { name: 'Educational', valuations: 50, units: 80, mapData: 40 },
      { name: 'Heritage', valuations: 25, units: 35, mapData: 30 },
      { name: 'Industrial', valuations: 10, units: 20, mapData: 5 },
    ],
    asset_sub_type: [
      { name: 'Office', valuations: 80, units: 150, mapData: 50 },
      { name: 'Hospital', valuations: 45, units: 90, mapData: 55 },
      { name: 'School', valuations: 40, units: 60, mapData: 30 },
      { name: 'Bridge', valuations: 35, units: 70, mapData: 65 },
      { name: 'Apartment', valuations: 60, units: 130, mapData: 25 },
      { name: 'Warehouse', valuations: 30, units: 50, mapData: 20 },
      { name: 'Museum', valuations: 15, units: 20, mapData: 18 },
      { name: 'Temple', valuations: 10, units: 15, mapData: 12 },
      { name: 'Clinic', valuations: 15, units: 30, mapData: 15 },
      { name: 'Water', valuations: 20, units: 40, mapData: 25 },
    ],
  };
  res.json(dynamicData[dimension] || []);
});

app.listen(5000, () => console.log('Mock API server running on port 5000'));

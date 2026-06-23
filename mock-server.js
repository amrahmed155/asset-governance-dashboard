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
  { auth_ID: 1, AuthorityName: 'Ministry of Finance' },
  { auth_ID: 2, AuthorityName: 'Ministry of Housing' },
  { auth_ID: 3, AuthorityName: 'Ministry of Education' },
  { auth_ID: 4, AuthorityName: 'Ministry of Health' },
  { auth_ID: 5, AuthorityName: 'Ministry of Transport' },
];

app.get('/api/health', (_req, res) => res.json({ status: 'connected' }));

app.get('/api/lookups/governorates', (_req, res) => res.json(governorates));
app.get('/api/lookups/authorities', (_req, res) => res.json(authorities));

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
    { Descr: 'Government Office Building A', Governorate: 'Cairo', Authority: 'Ministry of Finance', Occurrences: 3, Sources: 'Valuations, Units, Map' },
    { Descr: 'Public School Complex #12', Governorate: 'Giza', Authority: 'Ministry of Education', Occurrences: 2, Sources: 'Units, Map' },
    { Descr: 'District Hospital - West Wing', Governorate: 'Alexandria', Authority: 'Ministry of Health', Occurrences: 2, Sources: 'Valuations, Units' },
    { Descr: 'National Museum Annex', Governorate: 'Luxor', Authority: 'Ministry of Finance', Occurrences: 2, Sources: 'Valuations, Map' },
    { Descr: 'Highway Bridge #45', Governorate: 'Cairo', Authority: 'Ministry of Transport', Occurrences: 2, Sources: 'Units, Map' },
  ]);
});

app.get('/api/assets/unique', (_req, res) => {
  res.json([
    { Source: 'Valuations', Descr: 'Central Bank Branch Office', Type: 'Commercial', Governorate: 'Cairo', Authority: 'Ministry of Finance' },
    { Source: 'Units', Descr: 'Residential Block 7A', Type: 'Residential', Governorate: 'Giza', Authority: 'Ministry of Housing' },
    { Source: 'Map', Descr: 'Heritage Site - Temple of Karnak', Type: 'Heritage', Governorate: 'Luxor', Authority: 'Ministry of Finance' },
    { Source: 'Valuations', Descr: 'Industrial Zone Warehouse', Type: 'Industrial', Governorate: 'Alexandria', Authority: 'Ministry of Transport' },
    { Source: 'Units', Descr: 'Primary Care Clinic - Rural', Type: 'Medical', Governorate: 'Aswan', Authority: 'Ministry of Health' },
    { Source: 'Map', Descr: 'Water Treatment Plant #3', Type: 'Infrastructure', Governorate: 'Cairo', Authority: 'Ministry of Housing' },
  ]);
});

app.listen(5000, () => console.log('Mock API server running on port 5000'));

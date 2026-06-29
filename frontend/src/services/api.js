import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
});

export const fetchAnalyticsCounts = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.gov_serial) params.append('gov_serial', filters.gov_serial);
  if (filters.authority_serial) params.append('authority_serial', filters.authority_serial);
  if (filters.asset_type) params.append('asset_type', filters.asset_type);
  if (filters.asset_sub_type) params.append('asset_sub_type', filters.asset_sub_type);
  const { data } = await api.get(`/analytics/counts?${params}`);
  return data;
};

export const fetchDuplicates = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.gov_serial) params.append('gov_serial', filters.gov_serial);
  if (filters.authority_serial) params.append('authority_serial', filters.authority_serial);
  if (filters.asset_type) params.append('asset_type', filters.asset_type);
  if (filters.asset_sub_type) params.append('asset_sub_type', filters.asset_sub_type);
  const { data } = await api.get(`/assets/duplicates?${params}`);
  return data;
};

export const fetchUnique = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.gov_serial) params.append('gov_serial', filters.gov_serial);
  if (filters.authority_serial) params.append('authority_serial', filters.authority_serial);
  if (filters.asset_type) params.append('asset_type', filters.asset_type);
  if (filters.asset_sub_type) params.append('asset_sub_type', filters.asset_sub_type);
  const { data } = await api.get(`/assets/unique?${params}`);
  return data;
};

export const fetchGovernorates = async () => {
  const { data } = await api.get('/lookups/governorates');
  return data;
};

export const fetchAuthorities = async () => {
  const { data } = await api.get('/lookups/authorities');
  return data;
};

export const fetchAssetTypes = async () => {
  const { data } = await api.get('/lookups/asset-types');
  return data;
};

export const fetchAssetSubTypes = async (assetType) => {
  const params = new URLSearchParams();
  if (assetType) params.append('asset_type', assetType);
  const { data } = await api.get(`/lookups/asset-sub-types?${params}`);
  return data;
};

export const fetchDynamicChart = async (dimension) => {
  const { data } = await api.get(`/analytics/dynamic?dimension=${dimension}`);
  return data;
};

export const fetchAssetSummary = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.gov_serial) params.append('gov_serial', filters.gov_serial);
  if (filters.authority_serial) params.append('authority_serial', filters.authority_serial);
  if (filters.asset_type) params.append('asset_type', filters.asset_type);
  if (filters.asset_sub_type) params.append('asset_sub_type', filters.asset_sub_type);
  const { data } = await api.get(`/analytics/asset-summary?${params}`);
  return data;
};

export const fetchHealth = async () => {
  const { data } = await api.get('/health');
  return data;
};

export default api;

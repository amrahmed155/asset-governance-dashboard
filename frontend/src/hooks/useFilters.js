import { useState, useEffect, useCallback } from 'react';
import { fetchGovernorates, fetchAuthorities, fetchAssetTypes, fetchAssetSubTypes } from '../services/api';

export default function useFilters() {
  const [governorates, setGovernorates] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [assetTypes, setAssetTypes] = useState([]);
  const [assetSubTypes, setAssetSubTypes] = useState([]);
  const [selectedGov, setSelectedGov] = useState('');
  const [selectedAuth, setSelectedAuth] = useState('');
  const [selectedAssetType, setSelectedAssetType] = useState('');
  const [selectedAssetSubType, setSelectedAssetSubType] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLookups() {
      try {
        const [govs, auths, types] = await Promise.all([
          fetchGovernorates(),
          fetchAuthorities(),
          fetchAssetTypes(),
        ]);
        setGovernorates(govs);
        setAuthorities(auths);
        setAssetTypes(types);
      } catch {
        // Lookups may fail if DB is not connected – use empty arrays
      } finally {
        setLoading(false);
      }
    }
    loadLookups();
  }, []);

  useEffect(() => {
    async function loadSubTypes() {
      try {
        const subTypes = await fetchAssetSubTypes(selectedAssetType || undefined);
        setAssetSubTypes(subTypes);
      } catch {
        setAssetSubTypes([]);
      }
    }
    loadSubTypes();
  }, [selectedAssetType]);

  const handleAssetTypeChange = useCallback((value) => {
    setSelectedAssetType(value);
    setSelectedAssetSubType('');
  }, []);

  const filters = {};
  if (selectedGov) filters.gov_serial = selectedGov;
  if (selectedAuth) filters.authority_serial = selectedAuth;
  if (selectedAssetType) filters.asset_type = selectedAssetType;
  if (selectedAssetSubType) filters.asset_sub_type = selectedAssetSubType;

  const resetFilters = useCallback(() => {
    setSelectedGov('');
    setSelectedAuth('');
    setSelectedAssetType('');
    setSelectedAssetSubType('');
  }, []);

  return {
    governorates,
    authorities,
    assetTypes,
    assetSubTypes,
    selectedGov,
    selectedAuth,
    selectedAssetType,
    selectedAssetSubType,
    setSelectedGov,
    setSelectedAuth,
    setSelectedAssetType: handleAssetTypeChange,
    setSelectedAssetSubType,
    resetFilters,
    filters,
    loading,
  };
}

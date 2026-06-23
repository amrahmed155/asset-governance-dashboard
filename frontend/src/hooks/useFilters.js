import { useState, useEffect, useCallback } from 'react';
import { fetchGovernorates, fetchAuthorities } from '../services/api';

export default function useFilters() {
  const [governorates, setGovernorates] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [selectedGov, setSelectedGov] = useState('');
  const [selectedAuth, setSelectedAuth] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLookups() {
      try {
        const [govs, auths] = await Promise.all([
          fetchGovernorates(),
          fetchAuthorities(),
        ]);
        setGovernorates(govs);
        setAuthorities(auths);
      } catch {
        // Lookups may fail if DB is not connected – use empty arrays
      } finally {
        setLoading(false);
      }
    }
    loadLookups();
  }, []);

  const filters = {};
  if (selectedGov) filters.gov_serial = selectedGov;
  if (selectedAuth) filters.authority_serial = selectedAuth;

  const resetFilters = useCallback(() => {
    setSelectedGov('');
    setSelectedAuth('');
  }, []);

  return {
    governorates,
    authorities,
    selectedGov,
    selectedAuth,
    setSelectedGov,
    setSelectedAuth,
    resetFilters,
    filters,
    loading,
  };
}

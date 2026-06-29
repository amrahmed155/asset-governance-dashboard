import React, { useEffect, useState } from 'react';
import { fetchAnalyticsCounts, fetchAssetSummary } from '../services/api';
import KPICards from '../components/KPICards';
import GovernorateChart from '../components/GovernorateChart';
import AuthorityPieChart from '../components/AuthorityPieChart';
import SummaryTable from '../components/SummaryTable';
import AssetSummaryTable from '../components/AssetSummaryTable';
import DynamicChart from '../components/DynamicChart';
import { Loader2 } from 'lucide-react';

export default function ExecutiveSummary({ filters }) {
  const [data, setData] = useState(null);
  const [assetSummary, setAssetSummary] = useState([]);
  const [assetSummaryLoading, setAssetSummaryLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setAssetSummaryLoading(true);
      setError(null);
      try {
        const [result, summary] = await Promise.all([
          fetchAnalyticsCounts(filters),
          fetchAssetSummary(filters),
        ]);
        if (!cancelled) {
          setData(result);
          setAssetSummary(summary);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setAssetSummaryLoading(false);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [filters]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
        <p className="font-semibold">Failed to load analytics</p>
        <p className="text-sm mt-1">{error}</p>
        <p className="text-xs mt-2 text-red-400">Make sure the backend server is running and the database is connected.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <KPICards kpi={data?.kpi} />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <GovernorateChart data={data?.byGovernorate} />
        <AuthorityPieChart data={data?.byAuthority} />
      </div>
      <SummaryTable data={data?.byAuthority} />
      <AssetSummaryTable data={assetSummary} loading={assetSummaryLoading} />
      <DynamicChart />
    </div>
  );
}

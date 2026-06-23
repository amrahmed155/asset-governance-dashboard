import React, { useEffect, useState } from 'react';
import { fetchDuplicates, fetchUnique } from '../services/api';
import DuplicateTable from '../components/DuplicateTable';
import UniqueTable from '../components/UniqueTable';


export default function DeduplicationEngine({ filters }) {
  const [duplicates, setDuplicates] = useState([]);
  const [unique, setUnique] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('duplicates');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [dups, uniq] = await Promise.all([
          fetchDuplicates(filters),
          fetchUnique(filters),
        ]);
        if (!cancelled) {
          setDuplicates(dups);
          setUnique(uniq);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [filters]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
        <p className="font-semibold">Failed to load deduplication data</p>
        <p className="text-sm mt-1">{error}</p>
        <p className="text-xs mt-2 text-red-400">Make sure the backend server is running and the database is connected.</p>
      </div>
    );
  }

  const tabs = [
    { id: 'duplicates', label: `Duplicates (${duplicates.length})` },
    { id: 'unique', label: `Unique (${unique.length})` },
  ];

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'duplicates' ? (
        <DuplicateTable data={duplicates} loading={loading} />
      ) : (
        <UniqueTable data={unique} loading={loading} />
      )}
    </div>
  );
}

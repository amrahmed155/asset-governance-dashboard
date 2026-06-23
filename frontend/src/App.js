import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import FilterBar from './components/FilterBar';
import ExecutiveSummary from './pages/ExecutiveSummary';
import DeduplicationEngine from './pages/DeduplicationEngine';
import useFilters from './hooks/useFilters';

const VIEW_TITLES = {
  summary: 'Executive Summary',
  dedup: 'Deduplication Engine',
};

export default function App() {
  const [activeView, setActiveView] = useState('summary');
  const [collapsed, setCollapsed] = useState(false);
  const {
    governorates,
    authorities,
    selectedGov,
    selectedAuth,
    setSelectedGov,
    setSelectedAuth,
    resetFilters,
    filters,
  } = useFilters();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
      />

      {/* Main content area */}
      <div
        className={`transition-all duration-300 ${
          collapsed ? 'ml-16' : 'ml-60'
        }`}
      >
        {/* Filter bar */}
        <FilterBar
          governorates={governorates}
          authorities={authorities}
          selectedGov={selectedGov}
          selectedAuth={selectedAuth}
          setSelectedGov={setSelectedGov}
          setSelectedAuth={setSelectedAuth}
          resetFilters={resetFilters}
        />

        {/* Page header */}
        <div className="px-6 pt-6 pb-2">
          <h1 className="text-2xl font-bold text-gray-900">
            {VIEW_TITLES[activeView]}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {activeView === 'summary'
              ? 'Overview of asset data across all sources'
              : 'Identify and manage duplicate records across data sources'}
          </p>
        </div>

        {/* Page content */}
        <div className="px-6 pb-8">
          {activeView === 'summary' && <ExecutiveSummary filters={filters} />}
          {activeView === 'dedup' && <DeduplicationEngine filters={filters} />}
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';

export default function FilterBar({
  governorates,
  authorities,
  selectedGov,
  selectedAuth,
  setSelectedGov,
  setSelectedAuth,
  resetFilters,
}) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3 flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
        <Filter className="w-4 h-4" />
        Filters
      </div>

      {/* Governorate */}
      <select
        value={selectedGov}
        onChange={(e) => setSelectedGov(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
      >
        <option value="">All Governorates</option>
        {governorates.map((g) => (
          <option key={g.Gov_ID} value={g.Gov_ID}>
            {g.Gov_Standard_Name}
          </option>
        ))}
      </select>

      {/* Authority */}
      <select
        value={selectedAuth}
        onChange={(e) => setSelectedAuth(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
      >
        <option value="">All Authorities</option>
        {authorities.map((a) => (
          <option key={a.AuthorityCode} value={a.AuthorityCode}>
            {a.AuthorityName}
          </option>
        ))}
      </select>

      {/* Reset */}
      {(selectedGov || selectedAuth) && (
        <button
          onClick={resetFilters}
          className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { Fingerprint, Search } from 'lucide-react';

const SOURCE_BADGE = {
  Valuations: 'bg-emerald-100 text-emerald-700',
  Units: 'bg-blue-100 text-blue-700',
  Map: 'bg-orange-100 text-orange-700',
};

export default function UniqueTable({ data, loading }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const filtered = (data || []).filter((row) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (row.Descr || '').toLowerCase().includes(q) ||
      (row.Governorate || '').toLowerCase().includes(q) ||
      (row.Authority || '').toLowerCase().includes(q) ||
      (row.Source || '').toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Fingerprint className="w-5 h-5 text-indigo-500" />
          <h3 className="text-base font-semibold text-gray-800">
            Unique Records{' '}
            <span className="text-xs font-normal text-gray-400">
              ({filtered.length} found)
            </span>
          </h3>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search unique assets..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-60"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-6 py-3 font-semibold text-gray-600">Source</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Description</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Type</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Governorate</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Authority</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-10 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-10 text-center text-gray-400">
                  No unique records found
                </td>
              </tr>
            ) : (
              paginated.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        SOURCE_BADGE[row.Source] || 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {row.Source}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-800 max-w-xs truncate" title={row.Descr}>
                    {row.Descr || '—'}
                  </td>
                  <td className="px-6 py-3 text-gray-600">{row.Type || '—'}</td>
                  <td className="px-6 py-3 text-gray-600">{row.Governorate || '—'}</td>
                  <td className="px-6 py-3 text-gray-600">{row.Authority || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

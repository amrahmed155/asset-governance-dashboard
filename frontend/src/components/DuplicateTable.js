import React, { useState } from 'react';
import { Copy, Search } from 'lucide-react';

const SOURCE_BADGE = {
  'بيانات الاتصالات': 'bg-emerald-100 text-emerald-700',
  'بيانات الامانة الفنية': 'bg-blue-100 text-blue-700',
  'بيانات خريطة تفاعلية': 'bg-orange-100 text-orange-700',
};

export default function DuplicateTable({ data, loading }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const filtered = (data || []).filter((row) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (row.Description || '').toLowerCase().includes(q) ||
      (row.Governorate || '').toLowerCase().includes(q) ||
      (row.Authority || '').toLowerCase().includes(q) ||
      (row.Asset_Type || '').toLowerCase().includes(q) ||
      (row.FoundIn || '').toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Copy className="w-5 h-5 text-red-500" />
          <h3 className="text-base font-semibold text-gray-800">
            Duplicate Records{' '}
            <span className="text-xs font-normal text-gray-400">
              ({filtered.length} found)
            </span>
          </h3>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search duplicates..."
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
              <th className="px-6 py-3 font-semibold text-gray-600">Description</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Governorate</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Authority</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Asset Type</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Sub Type</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Occurrences</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Certainty</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Found In</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="8" className="px-6 py-10 text-center text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Loading data...
                  </div>
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-10 text-center text-gray-400">
                  No duplicate records found
                </td>
              </tr>
            ) : (
              paginated.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 text-gray-800 max-w-xs truncate" title={row.Description}>
                    {row.Description || '\u2014'}
                  </td>
                  <td className="px-6 py-3 text-gray-600">{row.Governorate || '\u2014'}</td>
                  <td className="px-6 py-3 text-gray-600">{row.Authority || '\u2014'}</td>
                  <td className="px-6 py-3 text-gray-600">{row.Asset_Type || '\u2014'}</td>
                  <td className="px-6 py-3 text-gray-600">{row.Asset_Sub_Type || '\u2014'}</td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      {row.Occurrences}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    {(() => {
                      const pct = row.Certainty || 0;
                      let color = 'bg-gray-200';
                      if (pct >= 90) { color = 'bg-red-500'; }
                      else if (pct >= 75) { color = 'bg-orange-400'; }
                      else if (pct >= 50) { color = 'bg-yellow-400'; }
                      return (
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div className={`${color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className={`text-xs font-semibold ${pct >= 90 ? 'text-red-600' : pct >= 75 ? 'text-orange-600' : 'text-yellow-600'}`}>
                            {pct}%
                          </span>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(row.FoundIn || '').split('+').map((s) => {
                        const src = s.trim();
                        return (
                          <span
                            key={src}
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                              SOURCE_BADGE[src] || 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {src}
                          </span>
                        );
                      })}
                    </div>
                  </td>
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

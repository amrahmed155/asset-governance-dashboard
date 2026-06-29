import React, { useState, useMemo } from 'react';
import { Fingerprint, Search, ArrowUpDown, Download } from 'lucide-react';
import exportToCSV from '../utils/exportCSV';

const SOURCE_BADGE = {
  'بيانات الاتصالات': 'bg-emerald-100 text-emerald-700',
  'بيانات الامانة الفنية': 'bg-blue-100 text-blue-700',
  'بيانات خريطة تفاعلية': 'bg-orange-100 text-orange-700',
};

const columns = [
  { key: 'Source', label: 'Source' },
  { key: 'Description', label: 'Description' },
  { key: 'Asset_Type', label: 'Asset Type' },
  { key: 'Asset_Sub_Type', label: 'Sub Type' },
  { key: 'Governorate', label: 'Governorate' },
  { key: 'Authority', label: 'Authority' },
];

export default function UniqueTable({ data, loading }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState('Source');
  const [sortDir, setSortDir] = useState('asc');
  const [colFilters, setColFilters] = useState({});
  const pageSize = 15;

  const handleSort = (key) => {
    if (sortField === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(key);
      setSortDir('asc');
    }
  };

  const handleColFilter = (key, value) => {
    setColFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const filtered = useMemo(() => {
    return (data || []).filter((row) => {
      if (search) {
        const q = search.toLowerCase();
        const match =
          (row.Description || '').toLowerCase().includes(q) ||
          (row.Governorate || '').toLowerCase().includes(q) ||
          (row.Authority || '').toLowerCase().includes(q) ||
          (row.Asset_Type || '').toLowerCase().includes(q) ||
          (row.Source || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      for (const [key, val] of Object.entries(colFilters)) {
        if (val && !String(row[key] ?? '').toLowerCase().includes(val.toLowerCase())) {
          return false;
        }
      }
      return true;
    });
  }, [data, search, colFilters]);

  const sorted = useMemo(() => {
    if (!sortField) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortField] ?? '';
      const bVal = b[sortField] ?? '';
      return sortDir === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filtered, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  const handleExport = () => {
    exportToCSV(sorted, columns.map((c) => ({ key: c.key, label: c.label })), 'unique-assets.csv');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Fingerprint className="w-5 h-5 text-indigo-500" />
          <h3 className="text-base font-semibold text-gray-800">
            Unique Records{' '}
            <span className="text-xs font-normal text-gray-400">
              ({sorted.length} found)
            </span>
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={sorted.length === 0}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
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
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="px-6 py-3 font-semibold text-gray-600 cursor-pointer hover:text-gray-900 select-none"
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    <ArrowUpDown className={`w-3.5 h-3.5 ${sortField === col.key ? 'text-indigo-500' : 'text-gray-400'}`} />
                  </span>
                </th>
              ))}
            </tr>
            <tr className="bg-gray-50/50">
              {columns.map((col) => (
                <th key={`filter-${col.key}`} className="px-6 py-1">
                  <input
                    type="text"
                    placeholder="Filter..."
                    value={colFilters[col.key] || ''}
                    onChange={(e) => handleColFilter(col.key, e.target.value)}
                    className="w-full px-2 py-1 text-xs font-normal border border-gray-200 rounded focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 outline-none"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-10 text-center text-gray-400">
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
                <td colSpan="6" className="px-6 py-10 text-center text-gray-400">
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
                  <td className="px-6 py-3 text-gray-800 max-w-xs truncate" title={row.Description}>
                    {row.Description || '\u2014'}
                  </td>
                  <td className="px-6 py-3 text-gray-600">{row.Asset_Type || '\u2014'}</td>
                  <td className="px-6 py-3 text-gray-600">{row.Asset_Sub_Type || '\u2014'}</td>
                  <td className="px-6 py-3 text-gray-600">{row.Governorate || '\u2014'}</td>
                  <td className="px-6 py-3 text-gray-600">{row.Authority || '\u2014'}</td>
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

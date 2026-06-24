import React, { useState } from 'react';
import { ArrowUpDown } from 'lucide-react';

export default function SummaryTable({ data }) {
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Authority Summary</h3>
        <p className="text-gray-400 text-sm text-center py-6">No data available</p>
      </div>
    );
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sorted = [...data].sort((a, b) => {
    const aVal = a[sortField] ?? '';
    const bVal = b[sortField] ?? '';
    if (typeof aVal === 'number') return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    return sortDir === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  const columns = [
    { key: 'name', label: 'Authority' },
    { key: 'units', label: 'بيانات الامانة الفنية', color: 'text-blue-600' },
    { key: 'valuations', label: 'بيانات الاتصالات', color: 'text-emerald-600' },
    { key: 'mapData', label: 'بيانات خريطة تفاعلية', color: 'text-orange-600' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-base font-semibold text-gray-800">Authority Summary</h3>
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
                    <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className={`px-6 py-3 ${col.color || 'text-gray-800'}`}>
                    {col.key === 'name'
                      ? row[col.key]
                      : Number(row[col.key] || 0).toLocaleString()}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

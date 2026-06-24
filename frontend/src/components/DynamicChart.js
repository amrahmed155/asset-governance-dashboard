import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { fetchDynamicChart } from '../services/api';
import { BarChart3 } from 'lucide-react';

const COLORS = {
  units: '#3b82f6',
  valuations: '#10b981',
  mapData: '#f97316',
};

const DIMENSION_OPTIONS = [
  { value: 'governorate', label: 'Governorate' },
  { value: 'authority', label: 'Authority' },
  { value: 'asset_type', label: 'Asset Type' },
  { value: 'asset_sub_type', label: 'Asset Sub Type' },
];

export default function DynamicChart() {
  const [dimension, setDimension] = useState('governorate');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const result = await fetchDynamicChart(dimension);
        if (!cancelled) setData(result);
      } catch {
        if (!cancelled) setData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [dimension]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-500" />
          <h3 className="text-base font-semibold text-gray-800">
            Dynamic Analysis
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Group by:</span>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {DIMENSION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDimension(opt.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  dimension === opt.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="animate-spin h-6 w-6 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
        </div>
      ) : data.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-10">No data available</p>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11 }}
              angle={-40}
              textAnchor="end"
              interval={0}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
            <Legend wrapperStyle={{ paddingTop: 16 }} />
            <Bar dataKey="units" name={'\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0627\u0645\u0627\u0646\u0629 \u0627\u0644\u0641\u0646\u064a\u0629'} fill={COLORS.units} radius={[4, 4, 0, 0]} />
            <Bar dataKey="valuations" name={'\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0627\u062a\u0635\u0627\u0644\u0627\u062a'} fill={COLORS.valuations} radius={[4, 4, 0, 0]} />
            <Bar dataKey="mapData" name={'\u0628\u064a\u0627\u0646\u0627\u062a \u062e\u0631\u064a\u0637\u0629 \u062a\u0641\u0627\u0639\u0644\u064a\u0629'} fill={COLORS.mapData} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

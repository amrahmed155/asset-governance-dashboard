import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const PIE_COLORS = [
  '#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ec4899',
  '#06b6d4', '#f59e0b', '#ef4444', '#14b8a6', '#6366f1',
  '#84cc16', '#e11d48', '#0891b2', '#a855f7', '#d97706',
];

export default function AuthorityPieChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Asset Distribution by Authority</h3>
        <p className="text-gray-400 text-sm text-center py-10">No data available</p>
      </div>
    );
  }

  const pieData = data
    .map((d) => ({
      name: d.name,
      value: (d.units || 0) + (d.valuations || 0) + (d.mapData || 0),
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-base font-semibold text-gray-800 mb-4">
        Asset Distribution by Authority <span className="text-xs text-gray-400">(Top 10)</span>
      </h3>
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            outerRadius={120}
            innerRadius={50}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) =>
              `${name.substring(0, 15)}${name.length > 15 ? '...' : ''} (${(percent * 100).toFixed(0)}%)`
            }
            labelLine={{ strokeWidth: 1 }}
          >
            {pieData.map((_, idx) => (
              <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(val) => val.toLocaleString()}
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

import React from 'react';
import { Building2, DollarSign, MapPin } from 'lucide-react';

const CARDS = [
  {
    key: 'totalUnits',
    label: 'Total Units',
    icon: Building2,
    color: 'bg-blue-500',
    lightBg: 'bg-blue-50',
    textColor: 'text-blue-700',
  },
  {
    key: 'totalValuations',
    label: 'Total Valuations',
    icon: DollarSign,
    color: 'bg-emerald-500',
    lightBg: 'bg-emerald-50',
    textColor: 'text-emerald-700',
  },
  {
    key: 'totalMapPoints',
    label: 'Total Map Points',
    icon: MapPin,
    color: 'bg-orange-500',
    lightBg: 'bg-orange-50',
    textColor: 'text-orange-700',
  },
];

export default function KPICards({ kpi }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {CARDS.map(({ key, label, icon: Icon, color, lightBg, textColor }) => (
        <div
          key={key}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
        >
          <div className={`${lightBg} rounded-lg p-3`}>
            <Icon className={`w-6 h-6 ${textColor}`} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">{label}</p>
            <p className="text-2xl font-bold text-gray-900">
              {kpi ? Number(kpi[key] || 0).toLocaleString() : '—'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

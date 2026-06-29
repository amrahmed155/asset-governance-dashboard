import React from 'react';
import {
  Copy,
  LayoutDashboard,
  Database,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'summary', label: 'Executive Summary', icon: LayoutDashboard },
  { id: 'dedup', label: 'Deduplication Engine', icon: Copy },
];

export default function Sidebar({ activeView, onNavigate, collapsed, onToggle }) {
  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-slate-900 text-white flex flex-col transition-all duration-300 z-30 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700">
        <Database className="w-7 h-7 text-indigo-400 flex-shrink-0" />
        {!collapsed && (
          <span className="font-bold text-lg whitespace-nowrap">Asset Gov</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 mt-4 space-y-1 px-2">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = activeView === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              title={label}
              className={`flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center py-3 border-t border-slate-700 text-slate-400 hover:text-white transition-colors"
      >
        {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>
    </aside>
  );
}

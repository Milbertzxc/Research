import React from 'react';
import { Building2, LogOut, Bell, ArrowLeftRight } from 'lucide-react';

const NAV = {
  applicant: [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'locational', label: 'Locational Clearance' },
    { id: 'building', label: 'Building Permit' },
    { id: 'tracking', label: 'Track Applications' },
  ],
  mpdo: [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'review', label: 'Application Review' },
    { id: 'reports', label: 'Evaluation & Inspection' },
  ],
  official: [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'progress', label: 'Progress & Payments' },
    { id: 'issuance', label: 'Permit Issuance' },
  ],
  inspector: [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'report', label: 'Inspection Report' },
  ],
  admin: [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'users', label: 'Users & Roles' },
    { id: 'zones', label: 'GIS / Zones & Settings' },
    { id: 'reports', label: 'Reports & Analytics' },
  ],
};

export default function Layout({ user, page, setPage, onSwitchRole, onLogout, titles, children }) {
  const items = NAV[user.role] ?? [];
  return (
    <div className="min-h-screen flex">
      {/* Sidebar — Deep Navy */}
      <aside className="w-60 shrink-0 bg-[#1A365D] text-white flex flex-col fixed inset-y-0 z-20 max-md:-translate-x-full max-md:transition-transform">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-[#0D9488] flex items-center justify-center">
            <Building2 size={20} />
          </div>
          <div>
            <div className="font-bold text-sm leading-tight">Buenavista</div>
            <div className="text-[11px] text-slate-300">Building Permit System</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto nice-scroll p-3 space-y-1">
          {items.map((it) => (
            <button
              key={it.id}
              onClick={() => setPage(it.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                page === it.id ? 'bg-[#0D9488] text-white' : 'text-slate-200 hover:bg-white/10'
              }`}
            >
              {it.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10 space-y-1">
          <div className="px-3 py-2">
            <div className="text-sm font-semibold truncate">{user.name}</div>
            <div className="text-[11px] text-slate-300 truncate">{user.email}</div>
          </div>
          <button
            onClick={onSwitchRole}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-white/10"
          >
            <ArrowLeftRight size={15} /> Switch Role
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-white/10"
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 ml-60 max-md:ml-0 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-3 sticky top-0 z-10">
          <div className="min-w-0">
            <h1 className="font-bold text-slate-900 truncate">{titles?.[page] ?? 'Dashboard'}</h1>
            <p className="text-xs text-slate-500">Municipality of Buenavista</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button className="relative w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50">
              <Bell size={17} />
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold rounded-full px-1">2</span>
            </button>
            <span className="w-9 h-9 rounded-full bg-[#1A365D] text-white flex items-center justify-center text-xs font-bold">
              {user.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
            </span>
          </div>
        </header>
        <main className="flex-1 p-6 max-md:p-4 min-w-0">{children}</main>
      </div>
    </div>
  );
}

import React from 'react';
import { Building2, User, ClipboardCheck, Stamp, HardHat, ShieldCheck } from 'lucide-react';
import { ROLES } from '../data/mock.js';

const ICONS = { applicant: User, mpdo: ClipboardCheck, official: Stamp, inspector: HardHat, admin: ShieldCheck };

export default function RoleSelect({ onPick }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#1A365D]">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#0D9488] flex items-center justify-center mx-auto mb-4">
            <Building2 size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Municipality of Buenavista</h1>
          <p className="text-slate-300 text-sm mt-1">Web-Based Building Permit Processing System — select your portal</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ROLES.map((r) => {
            const Icon = ICONS[r.id];
            return (
              <button
                key={r.id}
                onClick={() => onPick(r.id)}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 text-left hover:ring-2 hover:ring-[#0D9488] transition"
              >
                <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center mb-3">
                  <Icon size={19} />
                </div>
                <div className="font-semibold text-slate-900 text-sm">{r.label}</div>
                <div className="text-xs text-slate-500 mt-1 leading-relaxed">{r.desc}</div>
              </button>
            );
          })}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-slate-300 text-xs leading-relaxed">
            Prototype build — all portals run on local mock data. Pick any role to explore its dashboard and workflows.
          </div>
        </div>
      </div>
    </div>
  );
}

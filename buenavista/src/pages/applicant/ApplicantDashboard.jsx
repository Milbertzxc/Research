import React from 'react';
import { FileCheck, Building2, Bell, ArrowRight } from 'lucide-react';
import { APPLICATIONS } from '../../data/mock.js';
import { Badge, Btn, Card, CardHeader, StatCard } from '../../components/ui.jsx';

export default function ApplicantDashboard({ setPage }) {
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={FileCheck} label="Locational Clearance" value="Under Review" sub="LC-2026-0101" tone="amber" />
        <StatCard icon={Building2} label="Building Permit" value="Revision" sub="BP-2026-0455" tone="amber" />
        <StatCard icon={Bell} label="Notifications" value="02" sub="1 revision · 1 inspection" tone="indigo" />
        <StatCard icon={FileCheck} label="Approved" value="01" sub="LC-2026-0098 ready" tone="emerald" />
      </div>

      <Card>
        <CardHeader title="Quick Actions" subtitle="Start a new filing or follow up on existing ones" />
        <div className="p-5 grid sm:grid-cols-3 gap-3">
          <Btn onClick={() => setPage('locational')}>Apply for Locational Clearance <ArrowRight size={15} /></Btn>
          <Btn variant="navy" onClick={() => setPage('building')}>Apply for Building Permit <ArrowRight size={15} /></Btn>
          <Btn variant="ghost" onClick={() => setPage('tracking')}>Track My Applications <ArrowRight size={15} /></Btn>
        </div>
      </Card>

      <Card>
        <CardHeader title="My Applications" subtitle="Latest status across clearance and permit filings" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                <th className="px-5 py-3">ID</th><th className="px-3 py-3">Type</th><th className="px-3 py-3">Project</th>
                <th className="px-3 py-3">Barangay</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Progress</th>
              </tr>
            </thead>
            <tbody>
              {APPLICATIONS.map((a) => (
                <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-5 py-3 font-semibold text-slate-800">{a.id}</td>
                  <td className="px-3 py-3">{a.type}</td>
                  <td className="px-3 py-3">{a.project}</td>
                  <td className="px-3 py-3">{a.barangay}</td>
                  <td className="px-3 py-3"><Badge status={a.status} /></td>
                  <td className="px-3 py-3 w-40">
                    <div className="h-2 bg-slate-100 rounded-full"><div className="h-2 rounded-full bg-[#0D9488]" style={{ width: `${a.progress}%` }} /></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

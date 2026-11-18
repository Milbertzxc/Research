import React from 'react';
import { FileCheck, Building2, Bell, ArrowRight, ShieldCheck } from 'lucide-react';
import { useStore } from '../../store/Store.jsx';
import { Badge, Btn, Card, CardHeader, StatCard } from '../../components/ui.jsx';
import { FEE_TOTAL, peso } from '../../data/initialState.js';

export default function ApplicantDashboard({ setPage, user }) {
  const { state } = useStore();
  const mineLC = state.lcApplications.filter((a) => a.applicantEmail === user.email || a.applicant === user.name);
  const mineBP = state.bpApplications.filter((a) => a.applicantEmail === user.email || a.applicant === user.name);
  const latestLC = mineLC[0];
  const latestBP = mineBP[0];
  const approved = [...mineLC, ...mineBP].filter((a) => a.status === 'Approved' || a.status === 'Issued').length;
  const unread = state.notifCount;
  const apps = [...mineLC.map(a=>({ ...a, type:'Locational Clearance' })), ...mineBP.map(a=>({ ...a, type:'Building Permit' }))];

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={FileCheck} label="Locational Clearance" value={latestLC?.status || 'None'} sub={latestLC?.id || 'No filing yet'} tone={latestLC?.status === 'Approved' ? 'emerald' : 'amber'} />
        <StatCard icon={Building2} label="Building Permit" value={latestBP?.status || 'None'} sub={latestBP?.id || 'No filing yet'} tone={latestBP?.status === 'Issued' || latestBP?.status === 'Approved' ? 'emerald' : 'amber'} />
        <StatCard icon={Bell} label="Notifications" value={String(unread).padStart(2, '0')} sub="Updates on your filings" tone="indigo" />
        <StatCard icon={ShieldCheck} label="Approved / Issued" value={String(approved).padStart(2, '0')} sub={`Fees ref ${peso(FEE_TOTAL)}`} tone="emerald" />
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
        <CardHeader title="My Applications" subtitle="Live status across clearance and permit filings" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-slate-500 border-b border-slate-100"><th className="px-5 py-3">ID</th><th className="px-3 py-3">Type</th><th className="px-3 py-3">Project</th><th className="px-3 py-3">Barangay</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Progress</th></tr></thead>
            <tbody>
              {apps.length ? apps.map((a) => (
                <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-5 py-3 font-semibold text-slate-800">{a.id}</td>
                  <td className="px-3 py-3">{a.type}</td>
                  <td className="px-3 py-3">{a.project}</td>
                  <td className="px-3 py-3">{a.barangay}</td>
                  <td className="px-3 py-3"><Badge status={a.status} /></td>
                  <td className="px-3 py-3 w-40"><div className="h-2 bg-slate-100 rounded-full"><div className="h-2 rounded-full bg-[#0D9488]" style={{ width: `${a.progress || 0}%` }} /></div></td>
                </tr>
              )) : <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">No applications yet. Start with a Locational Clearance.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

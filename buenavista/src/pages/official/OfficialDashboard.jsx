import React, { useState } from 'react';
import { ClipboardList, CreditCard, Stamp } from 'lucide-react';
import { OFFICIAL_QUEUE } from '../../data/mock.js';
import { Badge, Card, CardHeader, StatCard, Btn } from '../../components/ui.jsx';

export default function OfficialDashboard({ setPage }) {
  const [filter, setFilter] = useState('All');
  const rows = OFFICIAL_QUEUE.filter((r) => filter === 'All' || r.docStatus === filter || r.inspection === filter);
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-3">
        <StatCard icon={ClipboardList} label="Pending Reviews" value="9" sub="5 architectural" tone="amber" />
        <StatCard icon={CreditCard} label="Payments Recorded" value="₱48.2K" sub="October collections" tone="emerald" />
        <StatCard icon={Stamp} label="Permits Issued" value="21" sub="this month" tone="teal" />
      </div>
      <Card>
        <CardHeader
          title="Applications for Technical Review"
          action={
            <div className="flex gap-2">
              {['All', 'Under Review', 'Revision Required', 'Compliant'].map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${filter === f ? 'bg-[#1A365D] text-white border-[#1A365D]' : 'border-slate-300 text-slate-600'}`}>{f}</button>
              ))}
            </div>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-slate-500 border-b border-slate-100"><th className="px-5 py-3">ID</th><th className="px-3 py-3">Applicant</th><th className="px-3 py-3">Scope</th><th className="px-3 py-3">Division</th><th className="px-3 py-3">Documents</th><th className="px-3 py-3">Inspection</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-5 py-3 font-semibold">{r.id}</td>
                  <td className="px-3 py-3">{r.applicant}</td>
                  <td className="px-3 py-3">{r.scope}</td>
                  <td className="px-3 py-3">{r.division}</td>
                  <td className="px-3 py-3"><Badge status={r.docStatus} /></td>
                  <td className="px-3 py-3"><Badge status={r.inspection} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 flex gap-2">
          <Btn variant="ghost" onClick={() => setPage('progress')}>Open Progress & Payments</Btn>
          <Btn variant="navy" onClick={() => setPage('issuance')}>Go to Issuance</Btn>
        </div>
      </Card>
    </div>
  );
}

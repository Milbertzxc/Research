import React from 'react';
import { Hourglass, CheckCircle2, RefreshCcw, AlertTriangle } from 'lucide-react';
import { MPDO_QUEUE } from '../../data/mock.js';
import { Badge, Card, CardHeader, StatCard, Btn } from '../../components/ui.jsx';

export default function MpdoDashboard({ setPage }) {
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Hourglass} label="Pending Applications" value="12" sub="4 new this week" tone="amber" />
        <StatCard icon={CheckCircle2} label="Approved Clearances" value="38" sub="October" tone="emerald" />
        <StatCard icon={RefreshCcw} label="Revision Requests" value="5" sub="awaiting resubmission" tone="indigo" />
        <StatCard icon={AlertTriangle} label="Zoning Conflicts" value="3" sub="Bay Area easement" tone="rose" />
      </div>
      <Card>
        <CardHeader title="Incoming Queue" subtitle="Oldest pending first" action={<Btn variant="ghost" onClick={() => setPage('review')}>Open Review</Btn>} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-slate-500 border-b border-slate-100"><th className="px-5 py-3">ID</th><th className="px-3 py-3">Applicant</th><th className="px-3 py-3">Project</th><th className="px-3 py-3">Barangay</th><th className="px-3 py-3">Zoning</th><th className="px-3 py-3">Status</th></tr></thead>
            <tbody>
              {MPDO_QUEUE.map((q) => (
                <tr key={q.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-5 py-3 font-semibold">{q.id}</td>
                  <td className="px-3 py-3">{q.applicant}</td>
                  <td className="px-3 py-3">{q.project}</td>
                  <td className="px-3 py-3">{q.barangay}</td>
                  <td className="px-3 py-3"><Badge status={q.zoning} /></td>
                  <td className="px-3 py-3"><Badge status={q.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

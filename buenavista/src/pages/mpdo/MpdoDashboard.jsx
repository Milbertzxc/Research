import React from 'react';
import { Hourglass, CheckCircle2, RefreshCcw, AlertTriangle, MapPin } from 'lucide-react';
import { useStore } from '../../store/Store.jsx';
import { Badge, Card, CardHeader, StatCard, Btn } from '../../components/ui.jsx';
import ZoneMap from '../../components/ZoneMap.jsx';

export default function MpdoDashboard({ setPage }) {
  const { state } = useStore();
  const q = state.lcApplications;
  const pending = q.filter(a => ['Pending','Submitted','Under Review'].includes(a.status)).length;
  const approved = q.filter(a => a.status === 'Approved').length;
  const revisions = q.filter(a => a.status === 'Revision Required').length;
  const conflicts = q.filter(a => a.zoning === 'Non-Compliant' || a.status === 'Zoning Conflict').length;
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Hourglass} label="Pending Applications" value={String(pending)} sub="Awaiting MPDO action" tone="amber" />
        <StatCard icon={CheckCircle2} label="Approved Locational Clearances" value={String(approved)} sub="Issued / approved" tone="emerald" />
        <StatCard icon={RefreshCcw} label="Revision Required" value={String(revisions)} sub="Awaiting resubmission" tone="indigo" />
        <StatCard icon={AlertTriangle} label="Zoning Conflicts" value={String(conflicts)} sub="Flagged for review" tone="rose" />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Incoming Locational Clearance Queue" subtitle="Live queue" action={<Btn variant="ghost" onClick={() => setPage('review')}>Open Review</Btn>} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-slate-500 border-b border-slate-100"><th className="px-5 py-3">ID</th><th className="px-3 py-3">Applicant</th><th className="px-3 py-3">Project</th><th className="px-3 py-3">Zoning</th><th className="px-3 py-3">Status</th></tr></thead>
              <tbody>
                {q.map((a) => (
                  <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer" onClick={() => setPage('review')}>
                    <td className="px-5 py-3 font-semibold">{a.id}</td><td className="px-3 py-3">{a.applicant}</td><td className="px-3 py-3">{a.project}</td><td className="px-3 py-3"><Badge status={a.zoning} /></td><td className="px-3 py-3"><Badge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card>
          <CardHeader title="GIS Interactive Map View" subtitle="Zones and recent application locations" />
          <div className="p-4"><ZoneMap zones={state.zones} onPick={() => setPage('review')} height={260} /><div className="mt-2 text-xs text-slate-500 flex items-center gap-1"><MapPin size={13}/> Click the map or queue to open zoning verification.</div></div>
        </Card>
      </div>
    </div>
  );
}

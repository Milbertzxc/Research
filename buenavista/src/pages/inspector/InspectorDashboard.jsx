import React from 'react';
import { CalendarDays, ClipboardCheck, Hourglass, CheckCircle2 } from 'lucide-react';
import { INSPECTIONS } from '../../data/mock.js';
import { Badge, Btn, Card, CardHeader, StatCard } from '../../components/ui.jsx';

export default function InspectorDashboard({ setPage }) {
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={CalendarDays} label="Today's Inspections" value="2" sub="Oct 14, 2026" tone="teal" />
        <StatCard icon={Hourglass} label="Pending" value="3" sub="awaiting visit" tone="amber" />
        <StatCard icon={CheckCircle2} label="Passed" value="14" sub="this month" tone="emerald" />
        <StatCard icon={ClipboardCheck} label="Failed" value="2" sub="for re-inspection" tone="rose" />
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Assigned Site Inspections"
            action={<Btn variant="ghost" onClick={() => setPage('report')}>Open Report Form</Btn>}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-slate-500 border-b border-slate-100"><th className="px-5 py-3">ID</th><th className="px-3 py-3">Project</th><th className="px-3 py-3">Barangay</th><th className="px-3 py-3">Schedule</th><th className="px-3 py-3">Status</th></tr></thead>
              <tbody>
                {INSPECTIONS.map((i) => (
                  <tr key={i.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-5 py-3 font-semibold">{i.id}</td>
                    <td className="px-3 py-3">{i.project}</td>
                    <td className="px-3 py-3">{i.barangay}</td>
                    <td className="px-3 py-3 text-xs">{i.date} · {i.time}</td>
                    <td className="px-3 py-3"><Badge status={i.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card>
          <CardHeader title="This Week" subtitle="Calendar schedule widget" />
          <div className="p-4 space-y-2 text-sm">
            {['Mon — INSP-301 · Poblacion 2 (9:00 AM)', 'Mon — INSP-302 · Poblacion 1 (1:30 PM)', 'Wed — INSP-305 · Brgy. Coastal (10:00 AM)', 'Fri — Re-inspection · Bay Area (2:00 PM)'].map((s) => (
              <div key={s} className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs font-medium">{s}</div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

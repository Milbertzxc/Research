import React, { useState } from 'react';
import { ClipboardList, CalendarCheck, BadgeCheck, AlertCircle } from 'lucide-react';
import { useStore } from '../../store/Store.jsx';
import { Badge, Btn, Card, CardHeader, Field, Modal, StatCard, inputCls } from '../../components/ui.jsx';

export default function OfficialDashboard({ setPage }) {
  const { state, setBPStatus, scheduleInspection } = useStore();
  const q = state.bpApplications;
  const review = q.filter(a => ['Submitted','Under Review'].includes(a.status)).length;
  const revisions = q.filter(a => a.status === 'Revision Required').length;
  const approved = q.filter(a => a.status === 'Approved' || a.status === 'Issued').length;
  const [selected, setSelected] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [sched, setSched] = useState({ date: '2026-10-18', time: '09:00', inspector: 'Pedro Villanueva' });

  const act = (status) => { if (!selected) return; setBPStatus(selected.id, status, 'Engr. Jose Reyes', remarks || undefined); if (status === 'Inspection Scheduled') scheduleInspection({ project: selected.project, ref: selected.id, barangay: selected.barangay, zoneId: state.zones.find(z=>z.name===selected.barangay)?.id, date: sched.date, time: sched.time, inspector: sched.inspector }, 'Engr. Jose Reyes'); setSelected(null); setRemarks(''); };

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={ClipboardList} label="For Review" value={String(review)} sub="Building permits with approved LC" tone="amber" />
        <StatCard icon={AlertCircle} label="Revision Required" value={String(revisions)} sub="Returned to applicant" tone="rose" />
        <StatCard icon={CalendarCheck} label="Inspections" value={String(state.inspections.filter(i=>i.status!=='Completed').length)} sub="Scheduled / pending" tone="indigo" />
        <StatCard icon={BadgeCheck} label="Approved / Issued" value={String(approved)} sub="Ready or issued" tone="emerald" />
      </div>
      <Card>
        <CardHeader title="Application Review Queue" subtitle="Document verification matrices and review actions" action={<Btn variant="ghost" onClick={()=>setPage('progress')}>Progress & Payments</Btn>} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-slate-500 border-b border-slate-100"><th className="px-5 py-3">ID</th><th className="px-3 py-3">Applicant</th><th className="px-3 py-3">Scope</th><th className="px-3 py-3">LC Ref</th><th className="px-3 py-3">Status</th><th className="px-3 py-3 text-right">Actions</th></tr></thead>
            <tbody>
              {q.map(a => (
                <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-5 py-3 font-semibold">{a.id}</td><td className="px-3 py-3">{a.applicant}</td><td className="px-3 py-3 text-xs">{a.scope || a.projectType}</td><td className="px-3 py-3 text-xs">{a.lcRef}</td><td className="px-3 py-3"><Badge status={a.status} /></td>
                  <td className="px-3 py-3 text-right"><Btn variant="ghost" className="px-3 py-1.5 text-xs" onClick={()=>setSelected(a)}>Review</Btn></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={!!selected} title={`Review ${selected?.id || ''}`} onClose={()=>setSelected(null)} footer={<Btn variant="ghost" onClick={()=>setSelected(null)}>Close</Btn>}>
        {selected && (
          <div className="space-y-3 text-sm">
            <div><b>{selected.project}</b> · {selected.applicant} · LC: {selected.lcRef}</div>
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-3 py-2 bg-slate-50 text-xs font-semibold text-slate-600">Document Verification Matrix</div>
              <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto">{(selected.docs||[]).slice(0,6).map(d=><div key={d.name} className="px-3 py-2 flex justify-between"><span>{d.name}</span><Badge status={d.status}/></div>)}</div>
            </div>
            <div className="grid grid-cols-2 gap-2"><Field label="Inspection Date"><input type="date" className={inputCls} value={sched.date} onChange={(e)=>setSched(s=>({ ...s, date:e.target.value }))}/></Field><Field label="Time"><input type="time" className={inputCls} value={sched.time} onChange={(e)=>setSched(s=>({ ...s, time:e.target.value }))}/></Field></div>
            <Field label="Review Remarks"><textarea className={inputCls} rows={3} value={remarks} onChange={(e)=>setRemarks(e.target.value)} placeholder="Technical remarks, conditions, or revision instructions…" /></Field>
            <div className="flex flex-wrap gap-2 pt-1">
              <Btn variant="warn" onClick={()=>act('Revision Required')}>Return for Revision</Btn>
              <Btn variant="navy" onClick={()=>act('Inspection Scheduled')}>Schedule Inspection</Btn>
              <Btn variant="success" onClick={()=>act('Approved')}>Approve</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

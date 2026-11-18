import React, { useState } from 'react';
import { FileCheck2, ShieldCheck } from 'lucide-react';
import { useStore } from '../../store/Store.jsx';
import { Badge, Btn, Card, CardHeader } from '../../components/ui.jsx';

const SPECIFIC = ['Comply with approved plans and specifications.', 'Secure required inspections before concealment of work.', 'Electrical/plumbing works by licensed practitioners only.'];
const COMMON = ['Permit posted at jobsite; valid for one (1) year from issuance.', 'No occupancy without Certificate of Occupancy (NBC).', 'Non-transferable; subject to revocation for violation.'];

export default function Issuance({ actor = 'Building Official' }) {
  const { state, issuePermit, toast } = useStore();
  const [selectedId, setSelectedId] = useState(state.bpApplications.find(a => a.status === 'Approved' && !a.issued)?.id || state.bpApplications[0]?.id || '');
  const app = state.bpApplications.find(a => a.id === selectedId);
  const [confirmed, setConfirmed] = useState({ specific: true, common: true });

  return (
    <div className="space-y-4 max-w-5xl">
      <Card>
        <CardHeader title="Permit Issuance" subtitle="Final permit generation for approved applications (with paid/assessed fees)" />
        <div className="p-4 flex flex-wrap gap-2">
          {state.bpApplications.map(a => (
            <button key={a.id} onClick={()=>setSelectedId(a.id)} className={`px-3 py-2 rounded-lg border text-sm text-left ${selectedId===a.id?'border-[#0D9488] bg-teal-50 font-semibold':'border-slate-200'}`}>
              <div>{a.id}</div><div className="text-xs text-slate-500"><Badge status={a.issued?'Issued':a.status} /></div>
            </button>
          ))}
        </div>
      </Card>
      {app ? (
        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader title={`Application ${app.id}`} subtitle={`${app.project} · ${app.applicant}`} />
            <div className="p-5 text-sm space-y-2">
              <div>LC Reference: <b>{app.lcRef}</b></div>
              <div>Scope: {app.scope || app.projectType}</div>
              <div>Status: <Badge status={app.status} /> {app.issued && <Badge status="Issued" />}</div>
              <div>Payment: <Badge status={app.payment?.status || 'Pending'} /> {app.payment?.or ? `(${app.payment.or})` : ''}</div>
              {app.permitNo && <div className="text-emerald-700 font-semibold flex items-center gap-1"><ShieldCheck size={15}/> Issued Permit No: {app.permitNo}</div>}
              {!app.issued && app.status !== 'Approved' && <div className="text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs">Permit can be issued when status is Approved (and inspections/fees are settled as applicable).</div>}
            </div>
          </Card>
          <Card>
            <CardHeader title="Legal Conditions & Issue Permit" subtitle="Specific and common conditions" action={<Btn variant="success" disabled={app.issued || app.status !== 'Approved' || !confirmed.specific || !confirmed.common} onClick={()=>issuePermit(app.id, actor)}><FileCheck2 size={15}/> Issue Permit</Btn>} />
            <div className="p-5 space-y-4 text-sm">
              <label className="flex items-start gap-2 font-semibold text-slate-700"><input type="checkbox" checked={confirmed.specific} onChange={(e)=>setConfirmed(c=>({ ...c, specific:e.target.checked }))} className="accent-[#0D9488] mt-1"/> Specific Conditions</label>
              <ul className="list-disc ml-6 text-slate-600 space-y-1">{SPECIFIC.map((c,i)=><li key={i}>{c}</li>)}</ul>
              <label className="flex items-start gap-2 font-semibold text-slate-700"><input type="checkbox" checked={confirmed.common} onChange={(e)=>setConfirmed(c=>({ ...c, common:e.target.checked }))} className="accent-[#0D9488] mt-1"/> Common Conditions</label>
              <ul className="list-disc ml-6 text-slate-600 space-y-1">{COMMON.map((c,i)=><li key={i}>{c}</li>)}</ul>
              {app.issued && <div className="text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">Building permit has been issued. Applicant can view/download it in Tracking.</div>}
            </div>
          </Card>
        </div>
      ) : <Card className="p-8 text-center text-slate-500">No application selected.</Card>}
    </div>
  );
}

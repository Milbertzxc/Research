import React, { useState } from 'react';
import { FileText, ClipboardCheck } from 'lucide-react';
import { useStore } from '../../store/Store.jsx';
import { Badge, Btn, Card, CardHeader, Field, inputCls } from '../../components/ui.jsx';

export default function EvalReport({ actor = 'MPDO Personnel' }) {
  const { state, upsertLC, audit, toast, scheduleInspection } = useStore();
  const [selected, setSelected] = useState(state.lcApplications[0]?.id || '');
  const app = state.lcApplications.find(a => a.id === selected);
  const [evalText, setEvalText] = useState('Site evaluation conducted. Land use classification verified against zoning map. No encroachment observed.');
  const [findings, setFindings] = useState('Recommend approval subject to standard building setbacks and fire safety compliance.');
  const [insp, setInsp] = useState({ date: '2026-10-20', time: '09:00', inspector: 'Pedro Villanueva' });
  const [reports, setReports] = useState([]);

  const generate = () => {
    if (!app) return;
    const rep = { id: `EV-${Date.now().toString().slice(-5)}`, ref: app.id, project: app.project, at: new Date().toLocaleString('en-PH'), evalText, findings };
    setReports((r) => [rep, ...r]);
    upsertLC({ ...app, evaluation: rep, updated: 'Today' }, actor, 'Evaluation report generated');
  };
  const setupInspection = () => {
    if (!app) return;
    scheduleInspection({ project: app.project, ref: app.id, barangay: app.barangay, zoneId: app.zoneId, date: insp.date, time: insp.time, inspector: insp.inspector }, actor);
    audit(actor, `Set up site inspection for ${app.id}`);
  };

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Digital Evaluation Report Generation" subtitle="Select application and generate evaluation" action={<Btn onClick={generate}><FileText size={15}/> Generate Report</Btn>} />
          <div className="p-5 space-y-3">
            <Field label="Application"><select className={inputCls} value={selected} onChange={(e)=>setSelected(e.target.value)}>{state.lcApplications.map(a=><option key={a.id} value={a.id}>{a.id} — {a.project} ({a.status})</option>)}</select></Field>
            {app && <div className="text-sm flex gap-2 flex-wrap">Applicant: <b>{app.applicant}</b> <Badge status={app.zoning} /> <Badge status={app.status} /></div>}
            <Field label="Evaluation Summary"><textarea className={inputCls} rows={4} value={evalText} onChange={(e)=>setEvalText(e.target.value)} /></Field>
            <Field label="Recommendations"><textarea className={inputCls} rows={3} value={findings} onChange={(e)=>setFindings(e.target.value)} /></Field>
          </div>
        </Card>
        <Card>
          <CardHeader title="Site Inspection Findings Setup" subtitle="Schedule inspection and prefill findings context" action={<Btn variant="navy" onClick={setupInspection}><ClipboardCheck size={15}/> Schedule Inspection</Btn>} />
          <div className="p-5 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Inspection Date"><input type="date" className={inputCls} value={insp.date} onChange={(e)=>setInsp(i=>({ ...i, date:e.target.value }))} /></Field>
              <Field label="Time"><input type="time" className={inputCls} value={insp.time} onChange={(e)=>setInsp(i=>({ ...i, time:e.target.value }))} /></Field>
            </div>
            <Field label="Assigned Inspector"><select className={inputCls} value={insp.inspector} onChange={(e)=>setInsp(i=>({ ...i, inspector:e.target.value }))}>{state.users.filter(u=>u.role==='Inspector'&&u.status==='Active').map(u=><option key={u.id}>{u.name}</option>)}</select></Field>
            <div className="text-xs text-slate-500">Creates a scheduled inspection record visible to the Inspector module and updates dashboards.</div>
          </div>
        </Card>
      </div>
      <Card>
        <CardHeader title="Generated Evaluation Reports" subtitle={`${reports.length} generated this session`} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm"><thead><tr className="text-left text-xs text-slate-500 border-b border-slate-100"><th className="px-5 py-3">Report</th><th className="px-3 py-3">Reference</th><th className="px-3 py-3">Project</th><th className="px-3 py-3">Generated</th><th className="px-3 py-3">Status</th></tr></thead>
            <tbody>{reports.length ? reports.map(r=><tr key={r.id} className="border-b border-slate-50"><td className="px-5 py-3 font-semibold">{r.id}</td><td className="px-3 py-3">{r.ref}</td><td className="px-3 py-3">{r.project}</td><td className="px-3 py-3 text-xs">{r.at}</td><td className="px-3 py-3"><Badge status="Completed" /></td></tr>) : <tr><td colSpan={5} className="px-5 py-6 text-center text-slate-400">No reports generated yet.</td></tr>}</tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

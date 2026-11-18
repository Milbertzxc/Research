import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/Store.jsx';
import { Badge, Btn, Card, CardHeader, Field, inputCls } from '../../components/ui.jsx';
import ZoneMap from '../../components/ZoneMap.jsx';

const ZONING_CHECKLIST = ['Site Location Verified', 'Land Use Conformity', 'Building Plans Available'];
const FULL_CHECKLIST = ['Setbacks conform to approved plans', 'Structural members as specified', 'Electrical rough-ins secured', 'Sanitation / plumbing lines tested', 'Fire safety provisions installed', 'No encroachment on easement'];

export default function InspectionReport({ actor = 'Inspector', defaultType = 'full' }) {
  const { state, submitInspectionReport, updateInspection } = useStore();
  const [inspId, setInspId] = useState(state.inspections[0]?.id || '');
  const insp = state.inspections.find(i => i.id === inspId) || state.inspections[0];
  const [zone, setZone] = useState(null);
  const [checks, setChecks] = useState({});
  const [findings, setFindings] = useState('');
  const [verdict, setVerdict] = useState('Passed');
  const [type, setType] = useState(defaultType); // full | zoning
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!insp) return;
    setZone(state.zones.find(z => z.id === insp.zoneId) || null);
    setChecks(insp.checklist && Object.keys(insp.checklist).length ? { ...insp.checklist } : {});
    setFindings(insp.findings || ''); setVerdict(insp.verdict || 'Passed'); setMsg('');
  }, [inspId, insp?.id]); // eslint-disable-line

  if (!insp) return <Card className="p-8 text-center text-slate-500">No inspections assigned.</Card>;
  const list = type === 'zoning' ? ZONING_CHECKLIST : [...ZONING_CHECKLIST, ...FULL_CHECKLIST];
  const toggle = (c) => setChecks(s => ({ ...s, [c]: !s[c] }));
  const checkedCount = list.filter(c => checks[c]).length;

  const submit = (label) => {
    submitInspectionReport(insp.id, { checklist: checks, findings, verdict, zoneId: zone?.id, reportType: label }, actor);
    setMsg(`${label} submitted — ${verdict}. ${checkedCount}/${list.length} items checked.`);
  };
  const saveDraft = () => { updateInspection(insp.id, { checklist: checks, findings, verdict, zoneId: zone?.id }, actor, 'Inspection draft saved'); setMsg('Draft saved.'); };

  return (
    <div className="space-y-4 max-w-6xl">
      <Card>
        <CardHeader title="Select Inspection" />
        <div className="p-4"><select className={inputCls} value={inspId} onChange={(e)=>setInspId(e.target.value)}>{state.inspections.map(i=><option key={i.id} value={i.id}>{i.id} — {i.project} ({i.barangay})</option>)}</select></div>
      </Card>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Project Location" subtitle={`${insp.id} · ${insp.project} · ${insp.ref}`} />
            <div className="p-4"><ZoneMap value={zone} onPick={setZone} zones={state.zones} height={220} /></div>
          </Card>
          <Card>
            <CardHeader title="Findings" />
            <div className="p-4 space-y-3">
              <Field label="Report Type"><div className="flex gap-4 text-sm">{[['full','Site Inspection Report'],['zoning','Zoning Report']].map(([v,l])=><label key={v} className="flex items-center gap-2"><input type="radio" checked={type===v} onChange={()=>setType(v)} className="accent-[#0D9488]"/>{l}</label>)}</div></Field>
              <Field label="Findings / Observations"><textarea className={inputCls} rows={4} value={findings} onChange={(e)=>setFindings(e.target.value)} placeholder="Site observations, measurements, deviations…" /></Field>
            </div>
          </Card>
        </div>
        <Card>
          <CardHeader title="Inspection Checklist & Verdict" subtitle={`${checkedCount}/${list.length} checked`} />
          <div className="p-5 space-y-3">
            {list.map((c) => (
              <label key={c} className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={!!checks[c]} onChange={() => toggle(c)} className="accent-[#0D9488]" /> {c}</label>
            ))}
            <div className="pt-2">
              <div className="text-xs font-semibold text-slate-600 mb-2">Result</div>
              <div className="flex flex-wrap gap-4 text-sm font-semibold">
                {['Passed','Failed','Conforming','Non-Conforming'].map((v) => (
                  <label key={v} className="flex items-center gap-2 cursor-pointer"><input type="radio" name="verdict" checked={verdict===v} onChange={()=>setVerdict(v)} className="accent-[#0D9488]" /><span className={v.includes('Pass')||v==='Conforming'?'text-emerald-700':'text-rose-700'}>{v}</span></label>
                ))}
              </div>
            </div>
            <Field label="Inspector Name"><input className={inputCls} defaultValue={insp.inspector || actor} /></Field>
            <div className="flex flex-wrap gap-2">
              <Btn variant="ghost" onClick={saveDraft}>Save Draft</Btn>
              <Btn variant="navy" onClick={()=>submit('Zoning report')}>Submit Zoning Report</Btn>
              <Btn onClick={()=>submit('Inspection report')}>Submit Inspection Report</Btn>
            </div>
            {msg && <div className="text-xs bg-teal-50 border border-teal-200 text-teal-800 rounded-lg px-3 py-2">{msg}</div>}
            <div className="text-xs text-slate-500">Current record: <Badge status={insp.verdict || insp.status} /></div>
          </div>
        </Card>
      </div>
    </div>
  );
}

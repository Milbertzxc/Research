import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../../store/Store.jsx';
import { Badge, Btn, Card, CardHeader, Field, inputCls } from '../../components/ui.jsx';
import ZoneMap from '../../components/ZoneMap.jsx';

export default function ZoningReview({ actor = 'MPDO Personnel' }) {
  const { state, setLCStatus, upsertLC, toast } = useStore();
  const queue = state.lcApplications;
  const [appId, setAppId] = useState(queue[0]?.id || '');
  const app = queue.find((q) => q.id === appId) || queue[0];
  const [checks, setChecks] = useState({});
  const [zone, setZone] = useState(null);
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    if (!app) return;
    const base = {}; (app.docs || []).forEach(d => { base[d.name] = d.status === 'Uploaded' ? 'Compliant' : 'Non-Compliant'; });
    setChecks(base); setZone(state.zones.find(z => z.id === app.zoneId) || null); setRemarks(app.remarks || '');
  }, [appId, app?.id]); // eslint-disable-line

  if (!app) return <Card className="p-8 text-center text-slate-500">No locational clearance applications in the queue.</Card>;

  const compliance = zone ? (app.landUse === zone.use || zone.use.includes(app.landUse) || ['Poblacion 1','Poblacion 2'].includes(zone.name)) ? 'Compliant' : 'Potential Conflict' : 'Unverified';
  const toggle = (d) => setChecks((s) => ({ ...s, [d]: s[d] === 'Compliant' ? 'Non-Compliant' : 'Compliant' }));
  const applyDecision = (status, msg) => {
    upsertLC({ ...app, zoning: compliance === 'Potential Conflict' ? 'Non-Compliant' : 'Compliant', zoneId: zone?.id || app.zoneId, lat: zone?.lat ?? app.lat, lng: zone?.lng ?? app.lng, barangay: zone?.name || app.barangay, remarks: remarks || msg }, actor, `LC review updated`);
    setLCStatus(app.id, status, actor, remarks || msg);
    toast(msg);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="space-y-4">
        <Card>
          <CardHeader title="Locational Clearance Review" subtitle="Select application and verify requirements" />
          <div className="p-4">
            <select className={inputCls} value={appId} onChange={(e) => setAppId(e.target.value)}>{queue.map(q => <option key={q.id} value={q.id}>{q.id} — {q.applicant}</option>)}</select>
            <div className="mt-3 text-sm space-y-1">
              <div><span className="text-slate-500">Applicant:</span> <b>{app.applicant}</b></div>
              <div><span className="text-slate-500">Project:</span> {app.project} · {app.classification}</div>
              <div><span className="text-slate-500">Land Use:</span> {app.landUse} · <span className="text-slate-500">Barangay:</span> {app.barangay}</div>
              <div className="flex gap-2 pt-1 flex-wrap"><Badge status={app.zoning} /><Badge status={app.status} /><Badge status={compliance === 'Compliant' ? 'Compliant' : compliance === 'Potential Conflict' ? 'Non-Compliant' : 'Pending'}>{`GIS: ${compliance}`}</Badge></div>
            </div>
          </div>
        </Card>
        <Card>
          <CardHeader title="Requirements Checklist" subtitle="Click a badge to toggle Compliant / Non-Compliant" />
          <div className="p-4 space-y-2 max-h-72 overflow-y-auto nice-scroll">
            {Object.entries(checks).map(([d, v]) => (
              <div key={d} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm gap-2">
                <span className="min-w-0 truncate">{d}</span>
                <button onClick={() => toggle(d)}><Badge status={v} /></button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader title="GIS — Zoning Verification & Coordinate Mapping" subtitle="Confirm pinned location against zone use; compliance flags" />
          <div className="p-4">
            <ZoneMap value={zone} onPick={setZone} zones={state.zones} height={240} />
            <div className="grid grid-cols-2 gap-3 mt-3">
              <Field label="Latitude"><input className={inputCls} readOnly value={zone ? Number(zone.lat).toFixed(6) : (app.lat?.toFixed?.(6) || '')} /></Field>
              <Field label="Longitude"><input className={inputCls} readOnly value={zone ? Number(zone.lng).toFixed(6) : (app.lng?.toFixed?.(6) || '')} /></Field>
            </div>
            {compliance === 'Potential Conflict' && <div className="mt-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">Compliance flag: proposed land use ({app.landUse}) may conflict with {zone?.name} ({zone?.use}).</div>}
          </div>
        </Card>
        <Card>
          <CardHeader title="Review Decision & Remarks" />
          <div className="p-4 space-y-3">
            <Field label="Remarks / Revision Instructions"><textarea className={inputCls} rows={3} value={remarks} onChange={(e)=>setRemarks(e.target.value)} placeholder="Enter findings, required corrections, or approval notes…" /></Field>
            <div className="grid sm:grid-cols-3 gap-2">
              <Btn variant="warn" onClick={() => applyDecision('Revision Required', 'Returned for revision — applicant notified.')}>Return for Revision</Btn>
              <Btn variant="danger" onClick={() => applyDecision('Zoning Conflict', remarks || 'Zoning conflict flagged — see remarks.')}>Flag Zoning Conflict</Btn>
              <Btn variant="success" onClick={() => applyDecision('Approved', remarks || 'Locational Clearance APPROVED — certificate generated.')}>Approve Locational Clearance</Btn>
            </div>
            <div className="text-xs text-slate-500">Current status: <Badge status={app.status} /></div>
          </div>
        </Card>
      </div>
    </div>
  );
}

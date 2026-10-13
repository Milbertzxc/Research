import React, { useState } from 'react';
import { MPDO_QUEUE, LOCATIONAL_DOCS } from '../../data/mock.js';
import { Badge, Btn, Card, CardHeader, inputCls } from '../../components/ui.jsx';
import ZoneMap from '../../components/ZoneMap.jsx';
import { ZONES } from '../../data/mock.js';

export default function ZoningReview() {
  const [appId, setAppId] = useState(MPDO_QUEUE[0].id);
  const [checks, setChecks] = useState(Object.fromEntries(LOCATIONAL_DOCS.slice(0, 6).map((d) => [d, 'Compliant'])));
  const [zone, setZone] = useState(ZONES[1]);
  const [decision, setDecision] = useState('');
  const app = MPDO_QUEUE.find((q) => q.id === appId);
  const flip = (d) => setChecks((s) => ({ ...s, [d]: s[d] === 'Compliant' ? 'Non-Compliant' : 'Compliant' }));

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="space-y-4">
        <Card>
          <CardHeader title="Select Application" />
          <div className="p-4">
            <select className={inputCls} value={appId} onChange={(e) => setAppId(e.target.value)}>
              {MPDO_QUEUE.map((q) => <option key={q.id} value={q.id}>{q.id} — {q.applicant}</option>)}
            </select>
            <div className="mt-3 text-sm space-y-1">
              <div><span className="text-slate-500">Applicant:</span> <b>{app.applicant}</b></div>
              <div><span className="text-slate-500">Project:</span> {app.project} · {app.barangay}</div>
              <div className="flex gap-2 pt-1"><Badge status={app.zoning} /><Badge status={app.status} /></div>
            </div>
          </div>
        </Card>
        <Card>
          <CardHeader title="Checklist Verification" subtitle="Click a badge to toggle Compliant / Non-Compliant" />
          <div className="p-4 space-y-2">
            {Object.entries(checks).map(([d, v]) => (
              <div key={d} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
                <span>{d}</span>
                <button onClick={() => flip(d)}><Badge status={v} /></button>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div className="space-y-4">
        <Card>
          <CardHeader title="GIS — Zoning Verification" subtitle="Confirm pinned location against zone use" />
          <div className="p-4"><ZoneMap value={zone} onPick={setZone} height={240} /></div>
        </Card>
        <Card>
          <CardHeader title="Review Decision" />
          <div className="p-4 grid sm:grid-cols-3 gap-2">
            <Btn variant="ghost" onClick={() => setDecision('Returned for revision — applicant notified.')}>Return for Revision</Btn>
            <Btn variant="danger" onClick={() => setDecision('Zoning conflict flagged — Bay Area easement overlay.')}>Flag Zoning Conflict</Btn>
            <Btn onClick={() => setDecision('Locational Clearance APPROVED — certificate generated.')}>Approve Clearance</Btn>
          </div>
          {decision && <div className="mx-4 mb-4 text-xs bg-teal-50 border border-teal-200 text-teal-800 rounded-lg px-3 py-2">{decision}</div>}
        </Card>
      </div>
    </div>
  );
}

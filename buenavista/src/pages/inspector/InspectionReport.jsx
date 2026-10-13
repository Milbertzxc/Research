import React, { useState } from 'react';
import { Btn, Card, CardHeader, Field, inputCls } from '../../components/ui.jsx';
import ZoneMap from '../../components/ZoneMap.jsx';
import { ZONES } from '../../data/mock.js';

const CHECKLIST = ['Setbacks conform to approved plans', 'Structural members as specified', 'Electrical rough-ins secured', 'Sanitation / plumbing lines tested', 'Fire safety provisions installed', 'No encroachment on easement'];

export default function InspectionReport() {
  const [zone, setZone] = useState(ZONES[1]);
  const [checks, setChecks] = useState(Object.fromEntries(CHECKLIST.map((c) => [c, false])));
  const [findings, setFindings] = useState('');
  const [verdict, setVerdict] = useState('PASS');
  const [done, setDone] = useState('');
  const toggle = (c) => setChecks((s) => ({ ...s, [c]: !s[c] }));

  return (
    <div className="grid lg:grid-cols-2 gap-4 max-w-5xl">
      <div className="space-y-4">
        <Card>
          <CardHeader title="Project Location" subtitle="INSP-301 · Dela Cruz Residence" />
          <div className="p-4"><ZoneMap value={zone} onPick={setZone} height={220} /></div>
        </Card>
        <Card>
          <CardHeader title="Findings" />
          <div className="p-4">
            <textarea className={inputCls} rows={4} value={findings} onChange={(e) => setFindings(e.target.value)} placeholder="Site observations, measurements, deviations…" />
          </div>
        </Card>
      </div>
      <Card>
        <CardHeader title="Inspection Checklist & Verdict" />
        <div className="p-5 space-y-3">
          {CHECKLIST.map((c) => (
            <label key={c} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={checks[c]} onChange={() => toggle(c)} className="accent-[#0D9488]" /> {c}
            </label>
          ))}
          <div className="pt-2">
            <div className="text-xs font-semibold text-slate-600 mb-2">Result</div>
            <div className="flex gap-4 text-sm font-semibold">
              {['PASS', 'FAIL'].map((v) => (
                <label key={v} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="verdict" checked={verdict === v} onChange={() => setVerdict(v)} className="accent-[#0D9488]" />
                  <span className={v === 'PASS' ? 'text-emerald-700' : 'text-rose-700'}>{v}</span>
                </label>
              ))}
            </div>
          </div>
          <Field label="Inspector Name"><input className={inputCls} defaultValue="Pedro Villanueva" /></Field>
          <Btn onClick={() => setDone(`Inspection report submitted — ${verdict}. ${Object.values(checks).filter(Boolean).length}/${CHECKLIST.length} items checked.`)}>Submit Inspection Report</Btn>
          {done && <div className="text-xs bg-teal-50 border border-teal-200 text-teal-800 rounded-lg px-3 py-2">{done}</div>}
        </div>
      </Card>
    </div>
  );
}

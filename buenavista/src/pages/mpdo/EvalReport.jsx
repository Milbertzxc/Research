import React, { useState } from 'react';
import { CalendarPlus } from 'lucide-react';
import { Btn, Card, CardHeader, Field, inputCls } from '../../components/ui.jsx';

export default function EvalReport() {
  const [report, setReport] = useState({ findings: '', recommendation: 'Favorable', conditions: '' });
  const [sched, setSched] = useState({ date: '2026-10-16', time: '09:00', inspector: 'Pedro Villanueva' });
  const [saved, setSaved] = useState('');
  const set = (k, v) => setReport((r) => ({ ...r, [k]: v }));

  return (
    <div className="grid lg:grid-cols-2 gap-4 max-w-5xl">
      <Card>
        <CardHeader title="Municipal Evaluation Report" subtitle="Builder — findings, recommendation, conditions" />
        <div className="p-5 space-y-4">
          <Field label="Findings"><textarea className={inputCls} rows={4} value={report.findings} onChange={(e) => set('findings', e.target.value)} placeholder="Land use conformity, setbacks, easements…" /></Field>
          <Field label="Recommendation">
            <select className={inputCls} value={report.recommendation} onChange={(e) => set('recommendation', e.target.value)}>
              <option>Favorable</option><option>Conditional</option><option>Unfavorable</option>
            </select>
          </Field>
          <Field label="Conditions"><textarea className={inputCls} rows={3} value={report.conditions} onChange={(e) => set('conditions', e.target.value)} placeholder="e.g., 3m easement along creek…" /></Field>
          <Btn onClick={() => setSaved(`Evaluation report saved — ${report.recommendation}.`)}>Save Report</Btn>
          {saved && <div className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg px-3 py-2">{saved}</div>}
        </div>
      </Card>
      <Card>
        <CardHeader title="Site Inspection Scheduling" subtitle="Assign inspector and slot" />
        <div className="p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Date"><input type="date" className={inputCls} value={sched.date} onChange={(e) => setSched({ ...sched, date: e.target.value })} /></Field>
            <Field label="Time"><input type="time" className={inputCls} value={sched.time} onChange={(e) => setSched({ ...sched, time: e.target.value })} /></Field>
          </div>
          <Field label="Inspector">
            <select className={inputCls} value={sched.inspector} onChange={(e) => setSched({ ...sched, inspector: e.target.value })}>
              <option>Pedro Villanueva</option><option>Ana Reyes</option>
            </select>
          </Field>
          <Btn variant="navy"><CalendarPlus size={15} /> Schedule Inspection — {sched.date} {sched.time}</Btn>
        </div>
      </Card>
    </div>
  );
}

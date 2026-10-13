import React, { useState } from 'react';
import { FEE_TOTAL, peso } from '../../data/mock.js';
import { Btn, Card, CardHeader, Field, ProgressTimeline, inputCls } from '../../components/ui.jsx';

const FLOW = [
  { title: 'Architectural', sub: 'Oct 10, 09:15 — reviewed by J. Reyes', done: true },
  { title: 'Civil / Structural', sub: 'Oct 10, 11:40 — reviewed by J. Reyes', done: true },
  { title: 'Electrical', sub: 'Oct 11, 08:30 — current stage', current: true },
  { title: 'Plumbing / Sanitary', sub: 'Queued' },
  { title: 'Final Approval', sub: 'Queued' },
];

export default function ProgressPayments() {
  const [orNo, setOrNo] = useState('OR-04218');
  const [amount, setAmount] = useState(FEE_TOTAL);
  const [log, setLog] = useState([{ or: 'OR-04217', amount: 2372, when: 'Oct 11, 2026 · BP-2026-0448' }]);
  return (
    <div className="grid lg:grid-cols-2 gap-4 max-w-5xl">
      <Card>
        <CardHeader title="Division Progress Flow — BP-2026-0455" subtitle="Time-stamped per division" />
        <div className="p-5"><ProgressTimeline items={FLOW} /></div>
      </Card>
      <Card>
        <CardHeader title="Assessed Fee Payment Recording" subtitle={`Assessed total: ${peso(FEE_TOTAL)}`} />
        <div className="p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Official Receipt No." required><input className={inputCls} value={orNo} onChange={(e) => setOrNo(e.target.value)} /></Field>
            <Field label="Amount Paid (₱)" required><input className={inputCls} type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></Field>
          </div>
          <Btn onClick={() => orNo && setLog((l) => [{ or: orNo, amount, when: 'Just now · BP-2026-0455' }, ...l])}>Record Payment</Btn>
          <div className="space-y-2">
            {log.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-sm rounded-lg border border-slate-200 px-3 py-2">
                <span className="font-semibold">{p.or}</span>
                <span className="text-slate-500 text-xs">{p.when}</span>
                <span className="font-semibold text-emerald-700">{peso(p.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

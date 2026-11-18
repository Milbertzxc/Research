import React, { useMemo, useState } from 'react';
import { Printer } from 'lucide-react';
import { useStore } from '../../store/Store.jsx';
import { FEE_TOTAL, peso, DIVISIONS } from '../../data/initialState.js';
import { Badge, Btn, Card, CardHeader, Field, ProgressTimeline, inputCls } from '../../components/ui.jsx';

export default function ProgressPayments({ actor = 'Building Official' }) {
  const { state, updateBPDivision, recordPayment, toast } = useStore();
  const [bpId, setBpId] = useState(state.bpApplications[0]?.id || '');
  const app = state.bpApplications.find(a => a.id === bpId) || state.bpApplications[0];
  const [orNo, setOrNo] = useState('');
  const [amount, setAmount] = useState(FEE_TOTAL);
  const log = useMemo(() => state.payments.filter(p => !app || p.ref === app.id), [state.payments, app?.id]);

  if (!app) return <Card className="p-8 text-center text-slate-500">No building permit applications.</Card>;
  const items = DIVISIONS.map(d => ({ title: d, sub: app.divisions?.[d]?.at ? `${app.divisions[d].at} — ${app.divisions[d].status}` : (app.divisions?.[d]?.status || 'Queued'), done: app.divisions?.[d]?.status === 'Completed', current: app.divisions?.[d]?.status === 'In Progress' }));
  const cycle = (s) => s === 'Queued' ? 'In Progress' : s === 'In Progress' ? 'Completed' : 'Queued';

  return (
    <div className="space-y-4 max-w-6xl">
      <Card>
        <CardHeader title="Select Building Permit" />
        <div className="p-4"><select className={inputCls} value={bpId} onChange={(e)=>setBpId(e.target.value)}>{state.bpApplications.map(a=><option key={a.id} value={a.id}>{a.id} — {a.project} ({a.status})</option>)}</select></div>
      </Card>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title={`Division Progress Flow — ${app.id}`} subtitle="Time-stamped per division (click status to advance)" />
          <div className="p-5 space-y-3">
            <ProgressTimeline items={items} />
            <div className="space-y-2 pt-2">{DIVISIONS.map(d => (
              <div key={d} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <span className="font-medium">{d}</span>
                <div className="flex items-center gap-2"><span className="text-xs text-slate-400">{app.divisions?.[d]?.at || ''}</span><button onClick={()=>updateBPDivision(app.id, d, cycle(app.divisions?.[d]?.status || 'Queued'), actor)}><Badge status={app.divisions?.[d]?.status || 'Queued'} /></button></div>
              </div>
            ))}</div>
          </div>
        </Card>
        <Card>
          <CardHeader title="Assessed Fee Payment Recording" subtitle={`Assessed total: ${peso(FEE_TOTAL)} · Status: ${app.payment?.status || 'Pending'}`} action={<Btn variant="ghost" onClick={()=>toast(`Order of Payment generated for ${app.id}.`)}><Printer size={15}/> Print Order of Payment</Btn>} />
          <div className="p-5 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Official Receipt No." required><input className={inputCls} value={orNo} onChange={(e)=>setOrNo(e.target.value)} placeholder="OR-04218" /></Field>
              <Field label="Amount Paid (₱)" required><input className={inputCls} type="number" value={amount} onChange={(e)=>setAmount(Number(e.target.value))} /></Field>
            </div>
            <Btn onClick={()=>{ if(recordPayment(app.id, orNo, amount, actor)) setOrNo(''); }}>Record Payment</Btn>
            <div className="space-y-2">
              {log.length ? log.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm rounded-lg border border-slate-200 px-3 py-2 gap-2"><span className="font-semibold">{p.or}</span><span className="text-slate-500 text-xs">{p.at}</span><span className="font-semibold text-emerald-700">{peso(p.amount)}</span></div>
              )) : <div className="text-sm text-slate-400">No payments recorded for this permit yet.</div>}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

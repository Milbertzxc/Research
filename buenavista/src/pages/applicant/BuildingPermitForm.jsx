import React, { useState } from 'react';
import { CheckCircle2, Upload } from 'lucide-react';
import { PERMIT_TYPES, GENERAL_REQUIREMENTS, FEE_SCHEDULE, FEE_TOTAL, peso } from '../../data/mock.js';
import { Badge, Btn, Card, CardHeader, Field, Steps, inputCls } from '../../components/ui.jsx';

const STEPS = ['Permit Types', 'Application Details', 'General Requirements', 'Technical Documents', 'Assessed Fees'];
const DIVISIONS = ['Architectural', 'Civil/Structural', 'Electrical', 'Mechanical', 'Plumbing', 'Electronics', 'Sanitary'];

export default function BuildingPermitForm() {
  const [step, setStep] = useState(1);
  const [types, setTypes] = useState(['Building']);
  const [docs, setDocs] = useState(Object.fromEntries(GENERAL_REQUIREMENTS.map((d) => [d, false])));
  const [scope, setScope] = useState('New Construction');
  const [occupancy, setOccupancy] = useState('Group A — Residential');
  const [submitted, setSubmitted] = useState(false);
  const toggle = (t) => setTypes((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]));

  if (submitted) {
    return (
      <Card className="p-10 text-center max-w-lg mx-auto">
        <CheckCircle2 size={40} className="mx-auto text-emerald-500 mb-3" />
        <h2 className="font-bold text-lg">Building Permit Application Submitted</h2>
        <p className="text-sm text-slate-500 mt-1">BP-2026-0460 · permits: {types.join(', ')}. Routed to the Building Official for technical review.</p>
        <Btn className="mt-5" variant="ghost" onClick={() => { setSubmitted(false); setStep(1); }}>File Another</Btn>
      </Card>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <Card className="p-5"><Steps steps={STEPS} current={step} /></Card>

      {step === 1 && (
        <Card>
          <CardHeader title="Step 1 — Permit Types" subtitle="Select all permits covered by this construction" />
          <div className="p-5 grid sm:grid-cols-2 md:grid-cols-4 gap-2">
            {PERMIT_TYPES.map((t) => (
              <label key={t} className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm cursor-pointer ${types.includes(t) ? 'border-[#0D9488] bg-teal-50 font-semibold' : 'border-slate-200'}`}>
                <input type="checkbox" checked={types.includes(t)} onChange={() => toggle(t)} className="accent-[#0D9488]" />
                {t}
              </label>
            ))}
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader title="Step 2 — Application Details" subtitle="Scope of work, occupancy & signatories" />
          <div className="p-5 grid sm:grid-cols-2 gap-4">
            <Field label="Scope of Work">
              <select className={inputCls} value={scope} onChange={(e) => setScope(e.target.value)}>
                {['New Construction', 'Renovation', 'Addition / Extension', 'Repair', 'Demolition'].map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Occupancy Group">
              <select className={inputCls} value={occupancy} onChange={(e) => setOccupancy(e.target.value)}>
                {['Group A — Residential', 'Group B — Commercial', 'Group E — Industrial', 'Group I — Institutional'].map((o) => <option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Architect / Engineer"><input className={inputCls} placeholder="Name & PRC license no." /></Field>
            <Field label="Estimated Cost (₱)"><input className={inputCls} placeholder="2,500,000" inputMode="numeric" /></Field>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader title="Step 3 — General Requirements" subtitle="Upload checklist shared across permit types" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                {GENERAL_REQUIREMENTS.map((d) => (
                  <tr key={d} className="border-b border-slate-50">
                    <td className="px-5 py-3 font-medium">{d}</td>
                    <td className="px-3 py-3"><Badge status={docs[d] ? 'Uploaded' : 'Missing'}>{docs[d] ? 'Uploaded' : 'Missing'}</Badge></td>
                    <td className="px-3 py-3 text-right">
                      <button onClick={() => setDocs((s) => ({ ...s, [d]: !s[d] }))} className="inline-flex items-center gap-1 text-xs font-semibold text-[#0D9488] hover:underline">
                        <Upload size={13} /> {docs[d] ? 'Remove' : 'Upload'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader title="Step 4 — Permit-Specific Technical Documents" subtitle={`Shown for: ${types.join(', ')}`} />
          <div className="p-5 space-y-3">
            {DIVISIONS.filter((d) => types.some((t) => d.toLowerCase().includes(t.toLowerCase())) || types.includes('Building')).map((d) => (
              <div key={d} className="rounded-lg border border-slate-200 p-4">
                <div className="text-sm font-semibold">{d} Division</div>
                <div className="grid sm:grid-cols-2 gap-3 mt-3">
                  <Field label="Plans / Computations"><input className={inputCls} placeholder="Upload PDF/DWG" /></Field>
                  <Field label="Signatory PRC No."><input className={inputCls} placeholder="PRC-000000" /></Field>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {step === 5 && (
        <Card>
          <CardHeader title="Step 5 — Assessed Fees" subtitle="Final calculation breakdown" />
          <div className="p-5">
            <table className="w-full text-sm">
              <tbody>
                {FEE_SCHEDULE.map((f) => (
                  <tr key={f.item} className="border-b border-slate-50">
                    <td className="py-2.5">{f.item}</td>
                    <td className="py-2.5 text-right font-medium">{peso(f.amount)}</td>
                  </tr>
                ))}
                <tr><td className="py-3 font-bold">Total Assessed</td><td className="py-3 text-right font-bold text-[#0D9488]">{peso(FEE_TOTAL)}</td></tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="flex justify-between">
        <Btn variant="ghost" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>Back</Btn>
        {step < 5 ? <Btn onClick={() => setStep((s) => s + 1)}>Continue</Btn> : <Btn onClick={() => setSubmitted(true)}>Submit Application</Btn>}
      </div>
    </div>
  );
}

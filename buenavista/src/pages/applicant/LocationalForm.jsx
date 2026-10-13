import React, { useState } from 'react';
import { Upload, CheckCircle2 } from 'lucide-react';
import { LOCATIONAL_DOCS, FEE_SCHEDULE, FEE_TOTAL, peso } from '../../data/mock.js';
import { Badge, Btn, Card, CardHeader, Field, Steps, inputCls } from '../../components/ui.jsx';
import ZoneMap from '../../components/ZoneMap.jsx';

const STEPS = ['Classification', 'Applicant & Project', 'Pin Location', 'Documents', 'Payment'];

export default function LocationalForm() {
  const [step, setStep] = useState(1);
  const [cls, setCls] = useState('Standard Project');
  const [form, setForm] = useState({ name: '', corp: '', lot: '', block: '', landUse: 'Residential' });
  const [zone, setZone] = useState(null);
  const [docs, setDocs] = useState(Object.fromEntries(LOCATIONAL_DOCS.map((d) => [d, false])));
  const [submitted, setSubmitted] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  if (submitted) {
    return (
      <Card className="p-10 text-center max-w-lg mx-auto">
        <CheckCircle2 size={40} className="mx-auto text-emerald-500 mb-3" />
        <h2 className="font-bold text-lg">Application Submitted</h2>
        <p className="text-sm text-slate-500 mt-1">LC-2026-0112 · routed to MPDO zoning review. Track it under “Track My Applications”.</p>
        <Btn className="mt-5" variant="ghost" onClick={() => { setSubmitted(false); setStep(1); }}>File Another</Btn>
      </Card>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <Card className="p-5"><Steps steps={STEPS} current={step} /></Card>

      {step === 1 && (
        <Card>
          <CardHeader title="Step 1 — Project Classification" subtitle="Choose the track that matches your project" />
          <div className="p-5 grid sm:grid-cols-3 gap-3">
            {['Standard Project', 'Indigenous Dwelling', 'Special Project'].map((c) => (
              <button
                key={c}
                onClick={() => setCls(c)}
                className={`rounded-xl border p-4 text-left text-sm font-semibold transition ${
                  cls === c ? 'border-[#0D9488] ring-2 ring-[#0D9488] bg-teal-50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {c}
                <div className="text-xs font-normal text-slate-500 mt-1">
                  {c === 'Standard Project' ? 'Houses, stores, offices' : c === 'Indigenous Dwelling' ? 'Traditional / vernacular structures' : 'Coastal, tourism, institutional'}
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader title="Step 2 — Applicant & Project Info" />
          <div className="p-5 grid sm:grid-cols-2 gap-4">
            <Field label="Applicant Name" required><input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Juan Dela Cruz" /></Field>
            <Field label="Corporation / Organization"><input className={inputCls} value={form.corp} onChange={(e) => set('corp', e.target.value)} placeholder="Optional" /></Field>
            <Field label="Lot No." required><input className={inputCls} value={form.lot} onChange={(e) => set('lot', e.target.value)} placeholder="Lot 14" /></Field>
            <Field label="Block No."><input className={inputCls} value={form.block} onChange={(e) => set('block', e.target.value)} placeholder="Block 3" /></Field>
            <Field label="Location / Street"><input className={inputCls} placeholder="Rizal St., Poblacion 2" /></Field>
            <Field label="Land Use Type">
              <select className={inputCls} value={form.landUse} onChange={(e) => set('landUse', e.target.value)}>
                {['Residential', 'Commercial', 'Agricultural', 'Institutional', 'Industrial', 'Tourism'].map((u) => <option key={u}>{u}</option>)}
              </select>
            </Field>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader title="Step 3 — Pin Project Location (GIS)" subtitle="Zones: Poblacion 1–3, Brgy. Coastal, Bay — coordinates auto-fill on click" />
          <div className="p-5">
            <ZoneMap value={zone} onPick={setZone} />
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <Field label="Latitude [lat]"><input className={inputCls} readOnly value={zone ? zone.lat.toFixed(6) : ''} placeholder="Click a zone" /></Field>
              <Field label="Longitude [long]"><input className={inputCls} readOnly value={zone ? zone.lng.toFixed(6) : ''} placeholder="Click a zone" /></Field>
            </div>
          </div>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader title="Step 4 — Document Upload Checklist" subtitle="Toggle each file once uploaded (prototype)" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-slate-500 border-b border-slate-100"><th className="px-5 py-3">Required File</th><th className="px-3 py-3">Status</th><th className="px-3 py-3 text-right">Control</th></tr></thead>
              <tbody>
                {LOCATIONAL_DOCS.map((d) => (
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

      {step === 5 && (
        <Card>
          <CardHeader title="Step 5 — Order of Payment" subtitle="Itemized municipal fees" />
          <div className="p-5">
            <table className="w-full text-sm">
              <tbody>
                {FEE_SCHEDULE.map((f) => (
                  <tr key={f.item} className="border-b border-slate-50">
                    <td className="py-2.5">{f.item}</td>
                    <td className="py-2.5 text-right font-medium">{peso(f.amount)}</td>
                  </tr>
                ))}
                <tr><td className="py-3 font-bold">Total</td><td className="py-3 text-right font-bold text-[#0D9488]">{peso(FEE_TOTAL)}</td></tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="flex justify-between">
        <Btn variant="ghost" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>Back</Btn>
        {step < 5
          ? <Btn onClick={() => setStep((s) => s + 1)}>Continue</Btn>
          : <Btn onClick={() => setSubmitted(true)}>Submit Application</Btn>}
      </div>
    </div>
  );
}

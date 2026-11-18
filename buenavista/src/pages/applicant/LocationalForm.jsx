import React, { useMemo, useState } from 'react';
import { Upload, CheckCircle2, Eye, RefreshCw } from 'lucide-react';
import { LC_DOCS, FEE_ITEMS, FEE_TOTAL, peso, today, now, uid } from '../../data/initialState.js';
import { Badge, Btn, Card, CardHeader, Field, Modal, Steps, inputCls } from '../../components/ui.jsx';
import ZoneMap from '../../components/ZoneMap.jsx';
import { useStore } from '../../store/Store.jsx';
import IndigenousDwellingDocs from '../../components/IndigenousDwellingDocs.jsx';
import { INDIGENOUS_DOCS } from '../../data/indigenousDwellingDocs.js';

const STEPS = ['Classification', 'Applicant & Project', 'Pin Location', 'Documents', 'Payment & Submit'];

export default function LocationalForm({ user }) {
  const { state, upsertLC, recordPayment } = useStore();
  const [step, setStep] = useState(1);
  const [cls, setCls] = useState('Standard Project');
  const [form, setForm] = useState({ name: user?.name || '', corp: '', lot: '', block: '', street: '', landUse: 'Residential', barangay: '' });
  const [zone, setZone] = useState(null);
  const [docs, setDocs] = useState(LC_DOCS.map((d) => ({ ...d, status: 'Missing', uploadedAt: null })));
  const [preview, setPreview] = useState(null);
  const [orNo, setOrNo] = useState('');
  const [submittedId, setSubmittedId] = useState('');
  const [errors, setErrors] = useState([]);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const zones = state.zones;

  const uploadDoc = (name) => setDocs((ds) => ds.map((d) => d.name === name ? { ...d, status: 'Uploaded', uploadedAt: now() } : d));
  const removeDoc = (name) => setDocs((ds) => ds.map((d) => d.name === name ? { ...d, status: 'Missing', uploadedAt: null } : d));
  const uploadedCount = docs.filter(d => d.status === 'Uploaded').length;

  const validateStep = (s) => {
    const errs = [];
    if (s >= 2 && !form.name.trim()) errs.push('Applicant name is required.');
    if (s >= 2 && !form.lot.trim()) errs.push('Lot No. is required.');
    if (s >= 3 && !zone) errs.push('Pin the project location on the GIS map.');
    if (s >= 4 && uploadedCount < 3) errs.push('Upload at least 3 required documents to proceed (prototype validation).');
    setErrors(errs);
    return errs.length === 0;
  };
  const goNext = () => { if (validateStep(step)) setStep((n) => Math.min(5, n + 1)); };

  const submit = () => {
    if (!validateStep(4)) { setStep(4); return; }
    const id = `LC-${new Date().getFullYear()}-${String(100 + state.lcApplications.length + Math.floor(Math.random()*50)).padStart(4, '0')}`;
    const paid = !!orNo;
    const app = {
      id, applicant: form.name.trim(), applicantEmail: user?.email || '', project: `${form.name.trim()} ${form.landUse} Project`.slice(0, 60),
      classification: cls, barangay: zone?.name || form.barangay || 'Buenavista', landUse: form.landUse, zoneId: zone?.id, lat: zone?.lat, lng: zone?.lng,
      zoning: 'Pending', status: 'Submitted', updated: today(), progress: 20,
      docs, timeline: [{ title: 'Submitted', sub: `${now()} · received by MPDO`, done: true, current: false }, { title: 'Document Review', sub: 'Queued', current: true }, { title: 'GIS/Zoning Verification', sub: 'Pending' }, { title: 'Approved', sub: 'Pending' }],
      remarks: '', payment: { status: paid ? 'Paid' : 'Pending', or: orNo || '', amount: FEE_TOTAL },
      meta: { corp: form.corp, lot: form.lot, block: form.block, street: form.street },
    };
    upsertLC(app, user?.name || 'Applicant', 'Locational clearance application submitted');
    if (paid) recordPayment(id, orNo, FEE_TOTAL, user?.name || 'Applicant');
    setSubmittedId(id);
  };

  if (submittedId) {
    return (
      <Card className="p-10 text-center max-w-lg mx-auto">
        <CheckCircle2 size={40} className="mx-auto text-emerald-500 mb-3" />
        <h2 className="font-bold text-lg">Locational Clearance Submitted</h2>
        <p className="text-sm text-slate-500 mt-1"><b>{submittedId}</b> · routed to MPDO zoning review. Track it under “Track My Applications”.</p>
        <div className="mt-5 flex justify-center gap-2"><Btn variant="ghost" onClick={() => { setSubmittedId(''); setStep(1); setDocs(LC_DOCS.map(d=>({ ...d, status:'Missing', uploadedAt:null }))); setZone(null); setOrNo(''); }}>File Another</Btn></div>
      </Card>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl">
      <Card className="p-5"><Steps steps={STEPS} current={step} /></Card>
      {errors.length > 0 && <div className="rounded-lg border border-rose-200 bg-rose-50 text-rose-800 text-sm px-4 py-3"><b>Correction needed:</b><ul className="list-disc ml-5 mt-1">{errors.map((e,i)=><li key={i}>{e}</li>)}</ul></div>}

      {step === 1 && (
        <Card>
          <CardHeader title="Step 1 — Project Classification" subtitle="Standard, Indigenous, or Special project" />
          <div className="p-5 grid sm:grid-cols-3 gap-3">
            {['Standard Project', 'Indigenous Dwelling', 'Special Project'].map((c) => (
              <button key={c} onClick={() => setCls(c)} className={`rounded-xl border p-4 text-left text-sm font-semibold transition ${cls === c ? 'border-[#0D9488] ring-2 ring-[#0D9488] bg-teal-50' : 'border-slate-200 hover:border-slate-300'}`}>
                {c}
                <div className="text-xs font-normal text-slate-500 mt-1">{c === 'Standard Project' ? 'Houses, stores, offices' : c === 'Indigenous Dwelling' ? 'Traditional / vernacular structures' : 'Coastal, tourism, institutional'}</div>
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
            <Field label="Location / Street"><input className={inputCls} value={form.street} onChange={(e) => set('street', e.target.value)} placeholder="Rizal St." /></Field>
            <Field label="Land Use Type">
              <select className={inputCls} value={form.landUse} onChange={(e) => set('landUse', e.target.value)}>{['Residential','Commercial','Agricultural','Institutional','Industrial','Tourism'].map((u)=><option key={u}>{u}</option>)}</select>
            </Field>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader title="Step 3 — Pin Project Location (GIS)" subtitle="Coordinates auto-fill on click; compliance flags shown in review" />
          <div className="p-5">
            <ZoneMap value={zone} onPick={setZone} zones={zones} />
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <Field label="Latitude [lat]"><input className={inputCls} readOnly value={zone ? Number(zone.lat).toFixed(6) : ''} placeholder="Click a zone" /></Field>
              <Field label="Longitude [long]"><input className={inputCls} readOnly value={zone ? Number(zone.lng).toFixed(6) : ''} placeholder="Click a zone" /></Field>
            </div>
          </div>
        </Card>
      )}

      {step === 4 && (
        cls === 'Indigenous Dwelling' ? (
          <IndigenousDwellingDocs
            onBackStep={() => setStep(3)}
            onNextStep={() => setStep(5)}
            onChange={(idDocs) => {
              // mirror into standard docs state for submission compatibility
              setDocs(idDocs.map((d) => { const m = INDIGENOUS_DOCS.find(x => x.id === d.id); return { name: m?.name || `Req ${d.id}`, file: d.file || `${m?.fileBase || 'req'}.pdf`, status: d.status === 'Not Applicable' ? 'Uploaded' : d.status, uploadedAt: d.status === 'Uploaded' ? now() : null }; }));
            }}
          />
        ) : (
          <Card>
            <CardHeader title="Step 4 — Document Upload Checklist" subtitle={`${uploadedCount}/${docs.length} uploaded · upload simulators show file state/preview/replace`} />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-slate-500 border-b border-slate-100"><th className="px-5 py-3">Required File</th><th className="px-3 py-3">File</th><th className="px-3 py-3">Status</th><th className="px-3 py-3 text-right">Actions</th></tr></thead>
                <tbody>
                  {docs.map((d) => (
                    <tr key={d.name} className="border-b border-slate-50">
                      <td className="px-5 py-3 font-medium">{d.name}</td>
                      <td className="px-3 py-3 text-xs text-slate-500 font-mono">{d.file}</td>
                      <td className="px-3 py-3"><Badge status={d.status} /></td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex justify-end gap-2 text-xs font-semibold">
                          {d.status === 'Uploaded' ? (<>
                            <button onClick={() => setPreview(d)} className="inline-flex items-center gap-1 text-slate-600 hover:underline"><Eye size={13} /> Preview</button>
                            <button onClick={() => uploadDoc(d.name)} className="inline-flex items-center gap-1 text-amber-700 hover:underline"><RefreshCw size={13} /> Replace</button>
                            <button onClick={() => removeDoc(d.name)} className="inline-flex items-center gap-1 text-rose-600 hover:underline">Remove</button>
                          </>) : (
                            <button onClick={() => uploadDoc(d.name)} className="inline-flex items-center gap-1 text-[#0D9488] hover:underline"><Upload size={13} /> Upload</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )
      )}

      {step === 5 && (
        <Card>
          <CardHeader title="Step 5 — Assessed Fees & Payment Submission" subtitle="Itemized municipal fees with total calculation" />
          <div className="p-5 space-y-4">
            <table className="w-full text-sm"><tbody>
              {FEE_ITEMS.map((f) => (<tr key={f.item} className="border-b border-slate-50"><td className="py-2.5">{f.item}</td><td className="py-2.5 text-right font-medium">{peso(f.amount)}</td></tr>))}
              <tr><td className="py-3 font-bold">Total</td><td className="py-3 text-right font-bold text-[#0D9488]">{peso(FEE_TOTAL)}</td></tr>
            </tbody></table>
            <div className="grid sm:grid-cols-2 gap-4 max-w-md">
              <Field label="Official Receipt No. (optional now)"><input className={inputCls} value={orNo} onChange={(e) => setOrNo(e.target.value)} placeholder="OR-00000" /></Field>
              <Field label="Payment Status"><div className="mt-2"><Badge status={orNo ? 'Paid' : 'Pending'} /></div></Field>
            </div>
            <p className="text-xs text-slate-500">You may submit now and record payment later via Progress & Payments / tracking.</p>
          </div>
        </Card>
      )}

      <div className="flex justify-between">
        <Btn variant="ghost" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>Back</Btn>
        {step < 5 ? <Btn onClick={goNext}>Continue</Btn> : <Btn onClick={submit}>Submit Application</Btn>}
      </div>

      <Modal open={!!preview} title={`Preview — ${preview?.name || ''}`} onClose={() => setPreview(null)} footer={<Btn variant="ghost" onClick={() => setPreview(null)}>Close</Btn>}>
        <div className="text-sm space-y-2"><div><b>File:</b> <span className="font-mono">{preview?.file}</span></div><div><b>Status:</b> <Badge status={preview?.status} /></div><div><b>Uploaded:</b> {preview?.uploadedAt || '—'}</div><div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-slate-500">Simulated document preview for {preview?.file}.</div></div>
      </Modal>
    </div>
  );
}

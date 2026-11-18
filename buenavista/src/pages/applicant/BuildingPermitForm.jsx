import React, { useMemo, useState } from 'react';
import { Upload, CheckCircle2, Eye, RefreshCw, AlertTriangle } from 'lucide-react';
import { BP_SUBFORMS, FEE_ITEMS, FEE_TOTAL, LC_DOCS, peso, now, today } from '../../data/initialState.js';
import { Badge, Btn, Card, CardHeader, Field, Modal, Steps, inputCls } from '../../components/ui.jsx';
import { useStore } from '../../store/Store.jsx';

const STEPS = ['Project & LC Ref', 'Sub-Forms (10)', 'Documents', 'Fees & Submit'];

function mkSubforms(existing) {
  const base = {};
  BP_SUBFORMS.forEach((f) => { base[f] = existing?.[f] ? { ...existing[f] } : { status: 'Pending', note: '', fields: { preparedBy: '', prc: '' } }; });
  return base;
}

export default function BuildingPermitForm({ user }) {
  const { state, upsertBP, recordPayment } = useStore();
  const approvedLCs = state.lcApplications.filter((a) => a.status === 'Approved' && (a.applicantEmail === user.email || a.applicant === user.name));
  const existingReturned = state.bpApplications.find((a) => (a.applicantEmail === user.email || a.applicant === user.name) && a.status === 'Revision Required');
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ project: existingReturned?.project || '2-storey residential/commercial project', projectType: existingReturned?.projectType || '2-storey residential/commercial', lcRef: existingReturned?.lcRef || approvedLCs[0]?.id || '', barangay: existingReturned?.barangay || approvedLCs[0]?.barangay || '' });
  const [subforms, setSubforms] = useState(mkSubforms(existingReturned?.subforms));
  const [docs, setDocs] = useState((existingReturned?.docs || LC_DOCS.map(d=>({ ...d, status:'Missing', uploadedAt:null }))).map(d=>({ ...d })));
  const [preview, setPreview] = useState(null);
  const [orNo, setOrNo] = useState(existingReturned?.payment?.or || '');
  const [errors, setErrors] = useState([]);
  const [submittedId, setSubmittedId] = useState('');
  const [openForm, setOpenForm] = useState(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const completed = Object.values(subforms).filter((s) => s.status === 'Completed').length;
  const returned = BP_SUBFORMS.filter((f) => subforms[f].status === 'Returned');

  const saveSubform = (name) => {
    const sf = subforms[name];
    if (!sf.fields?.preparedBy) { setErrors([`${name}: Prepared By is required.`]); return; }
    setSubforms((s) => ({ ...s, [name]: { ...s[name], status: 'Completed', note: '' } }));
    setErrors([]);
    setOpenForm(null);
  };
  const uploadDoc = (name) => setDocs((ds) => ds.map((d) => d.name === name ? { ...d, status: 'Uploaded', uploadedAt: now(), file: d.file || `${name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}.pdf` } : d));
  const removeDoc = (name) => setDocs((ds) => ds.map((d) => d.name === name ? { ...d, status: 'Missing', uploadedAt: null } : d));
  const uploadedCount = docs.filter(d => d.status === 'Uploaded').length;

  const validate = (s) => {
    const e = [];
    if (s >= 1 && !form.lcRef) e.push('An approved Locational Clearance reference is required before submitting a Building Permit.');
    if (s >= 1 && !form.project.trim()) e.push('Project description is required.');
    if (s >= 2 && completed < 2) e.push('Complete at least 2 sub-forms to proceed (all 10 required before final submission; progress is tracked).');
    if (s >= 3 && uploadedCount < 2) e.push('Upload required supporting documents.');
    setErrors(e); return e.length === 0;
  };
  const submit = () => {
    const e = [];
    if (!form.lcRef) e.push('Approved Locational Clearance is required.');
    if (completed < 10) e.push(`Complete all 10 sub-forms before submission (${completed}/10 done).`);
    if (uploadedCount < 3) e.push('Upload required documents before submission.');
    setErrors(e); if (e.length) { setStep(completed < 10 ? 2 : 3); return; }
    const id = existingReturned?.id || `BP-${new Date().getFullYear()}-${String(400 + state.bpApplications.length + Math.floor(Math.random()*50)).padStart(4, '0')}`;
    const app = {
      ...(existingReturned || {}), id, applicant: user.name, applicantEmail: user.email, project: form.project, projectType: form.projectType, barangay: form.barangay, lcRef: form.lcRef,
      status: 'Submitted', scope: form.projectType, updated: today(), progress: 25, subforms, docs,
      divisions: existingReturned?.divisions || { 'Line and Grade': { status: 'Queued', at: '' }, Architectural: { status: 'Queued', at: '' }, Structural: { status: 'Queued', at: '' }, Electrical: { status: 'Queued', at: '' }, Plumbing: { status: 'Queued', at: '' } },
      timeline: [{ title: 'Submitted', sub: `${now()} · received by OBO`, done: true }, { title: 'Document Review', sub: 'Queued', current: true }, { title: 'Building Official Review', sub: 'Pending' }, { title: 'Inspection', sub: 'Pending' }, { title: 'Final Approval / Issuance', sub: 'Pending' }],
      payment: { status: orNo ? 'Paid' : 'Pending', or: orNo, amount: FEE_TOTAL }, issued: false, permitNo: null, remarks: '',
    };
    upsertBP(app, user.name, existingReturned ? 'Building permit resubmitted after revision' : 'Building permit application submitted');
    if (orNo) recordPayment(id, orNo, FEE_TOTAL, user.name);
    setSubmittedId(id);
  };

  if (submittedId) return (
    <Card className="p-10 text-center max-w-lg mx-auto"><CheckCircle2 size={40} className="mx-auto text-emerald-500 mb-3" /><h2 className="font-bold text-lg">Building Permit Submitted</h2><p className="text-sm text-slate-500 mt-1"><b>{submittedId}</b> · linked to {form.lcRef}. Track progress under “Track My Applications”.</p><Btn className="mt-5" variant="ghost" onClick={() => setSubmittedId('')}>Back</Btn></Card>
  );

  return (
    <div className="space-y-4 max-w-5xl">
      <Card className="p-5"><Steps steps={STEPS} current={step} /></Card>
      {errors.length > 0 && <div className="rounded-lg border border-rose-200 bg-rose-50 text-rose-800 text-sm px-4 py-3"><b>Validation / correction needed:</b><ul className="list-disc ml-5 mt-1">{errors.map((e,i)=><li key={i}>{e}</li>)}</ul></div>}
      {returned.length > 0 && <div className="rounded-lg border border-amber-200 bg-amber-50 text-amber-900 text-sm px-4 py-3 flex gap-2"><AlertTriangle size={16} className="mt-0.5 shrink-0" /><div><b>Returned items to correct:</b> {returned.map(f=>`${f} (${subforms[f].note || 'see remarks'})`).join('; ')}</div></div>}

      {step === 1 && (
        <Card>
          <CardHeader title="Step 1 — Project & Approved Locational Clearance" subtitle="Building Permit requires an approved LC" />
          <div className="p-5 grid sm:grid-cols-2 gap-4">
            <Field label="Project Description" required><input className={inputCls} value={form.project} onChange={(e)=>set('project',e.target.value)} /></Field>
            <Field label="Project Type">
              <select className={inputCls} value={form.projectType} onChange={(e)=>set('projectType',e.target.value)}>{['2-storey residential/commercial','Standard','Indigenous Dwelling','Special Project'].map(o=><option key={o}>{o}</option>)}</select>
            </Field>
            <Field label="Approved Locational Clearance Ref" required>
              <select className={inputCls} value={form.lcRef} onChange={(e)=>{ const lc = approvedLCs.find(x=>x.id===e.target.value); set('lcRef',e.target.value); if(lc) set('barangay', lc.barangay); }}>
                <option value="">Select approved LC…</option>
                {approvedLCs.map(lc => <option key={lc.id} value={lc.id}>{lc.id} — {lc.project}</option>)}
              </select>
              {!approvedLCs.length && <div className="text-xs text-rose-600 mt-1">No approved Locational Clearance found for your account.</div>}
            </Field>
            <Field label="Barangay"><input className={inputCls} value={form.barangay} onChange={(e)=>set('barangay',e.target.value)} /></Field>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader title="Step 2 — Permit Application Sub-Forms" subtitle={`Progress: ${completed} of ${BP_SUBFORMS.length} forms completed`} action={<Badge status={completed===10?'Completed':'Under Review'}>{completed}/10</Badge>} />
          <div className="px-5 pb-2"><div className="h-2 bg-slate-100 rounded-full"><div className="h-2 rounded-full bg-[#0D9488] transition-all" style={{ width:`${(completed/10)*100}%` }} /></div></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-slate-500 border-b border-slate-100"><th className="px-5 py-3">Sub-Form</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Remarks</th><th className="px-3 py-3 text-right">Action</th></tr></thead>
              <tbody>
                {BP_SUBFORMS.map((f) => (
                  <tr key={f} className="border-b border-slate-50">
                    <td className="px-5 py-3 font-medium">{f}</td>
                    <td className="px-3 py-3"><Badge status={subforms[f].status} /></td>
                    <td className="px-3 py-3 text-xs text-slate-500">{subforms[f].note || '—'}</td>
                    <td className="px-3 py-3 text-right"><Btn variant={subforms[f].status==='Returned'?'warn':'ghost'} className="px-3 py-1.5 text-xs" onClick={()=>{ setOpenForm(f); setErrors([]); }}>{subforms[f].status==='Completed'?'Edit':'Open'}</Btn></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader title="Step 3 — Supporting Documents" subtitle={`${uploadedCount}/${docs.length} uploaded`} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-slate-500 border-b border-slate-100"><th className="px-5 py-3">Required File</th><th className="px-3 py-3">File</th><th className="px-3 py-3">Status</th><th className="px-3 py-3 text-right">Actions</th></tr></thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.name} className="border-b border-slate-50">
                    <td className="px-5 py-3 font-medium">{d.name}</td><td className="px-3 py-3 text-xs font-mono text-slate-500">{d.file}</td><td className="px-3 py-3"><Badge status={d.status} /></td>
                    <td className="px-3 py-3 text-right"><div className="flex justify-end gap-2 text-xs font-semibold">{d.status==='Uploaded' ? (<><button onClick={()=>setPreview(d)} className="inline-flex items-center gap-1 text-slate-600 hover:underline"><Eye size={13}/> Preview</button><button onClick={()=>uploadDoc(d.name)} className="inline-flex items-center gap-1 text-amber-700 hover:underline"><RefreshCw size={13}/> Replace</button><button onClick={()=>removeDoc(d.name)} className="text-rose-600 hover:underline">Remove</button></>) : (<button onClick={()=>uploadDoc(d.name)} className="inline-flex items-center gap-1 text-[#0D9488] hover:underline"><Upload size={13}/> Upload</button>)}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader title="Step 4 — Assessed Fees & Submit" subtitle="Fee breakdown and payment submission tracking" />
          <div className="p-5 space-y-4">
            <table className="w-full text-sm"><tbody>{FEE_ITEMS.map(f=><tr key={f.item} className="border-b border-slate-50"><td className="py-2.5">{f.item}</td><td className="py-2.5 text-right font-medium">{peso(f.amount)}</td></tr>)}<tr><td className="py-3 font-bold">Total</td><td className="py-3 text-right font-bold text-[#0D9488]">{peso(FEE_TOTAL)}</td></tr></tbody></table>
            <div className="grid sm:grid-cols-2 gap-4 max-w-md"><Field label="Official Receipt No. (optional)"><input className={inputCls} value={orNo} onChange={(e)=>setOrNo(e.target.value)} placeholder="OR-00000" /></Field><div><div className="text-xs font-semibold text-slate-600">Payment Status</div><div className="mt-2"><Badge status={orNo?'Paid':'Pending'} /></div></div></div>
          </div>
        </Card>
      )}

      <div className="flex justify-between">
        <Btn variant="ghost" disabled={step===1} onClick={()=>setStep(s=>s-1)}>Back</Btn>
        {step < 4 ? <Btn onClick={()=>{ if(validate(step)) setStep(s=>s+1); }}>Continue</Btn> : <Btn onClick={submit}>{existingReturned ? 'Resubmit Application' : 'Submit Application'}</Btn>}
      </div>

      <Modal open={!!openForm} title={`${openForm || ''} Sub-Form`} onClose={()=>setOpenForm(null)} footer={<><Btn variant="ghost" onClick={()=>setOpenForm(null)}>Cancel</Btn><Btn onClick={()=>saveSubform(openForm)}>Save Sub-Form</Btn></>}>
        {openForm && (
          <div className="space-y-3">
            {subforms[openForm].status === 'Returned' && <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2"><b>Returned for correction:</b> {subforms[openForm].note || 'Please review and correct.'}</div>}
            <Field label="Prepared By (Professional)" required><input className={inputCls} value={subforms[openForm].fields?.preparedBy || ''} onChange={(e)=>setSubforms(s=>({ ...s, [openForm]: { ...s[openForm], fields:{ ...s[openForm].fields, preparedBy:e.target.value } } }))} placeholder="Name / PRC holder" /></Field>
            <Field label="PRC / PTR No."><input className={inputCls} value={subforms[openForm].fields?.prc || ''} onChange={(e)=>setSubforms(s=>({ ...s, [openForm]: { ...s[openForm], fields:{ ...s[openForm].fields, prc:e.target.value } } }))} /></Field>
            <Field label="Notes / Scope"><textarea className={inputCls} rows={3} placeholder={`${openForm} details, scope, and compliance notes…`} /></Field>
            <div className="text-xs text-slate-500">Real-time validation: “Prepared By” is required to mark this sub-form completed.</div>
          </div>
        )}
      </Modal>
      <Modal open={!!preview} title={`Preview — ${preview?.name || ''}`} onClose={()=>setPreview(null)} footer={<Btn variant="ghost" onClick={()=>setPreview(null)}>Close</Btn>}><div className="text-sm space-y-2"><div><b>File:</b> <span className="font-mono">{preview?.file}</span></div><div><b>Status:</b> <Badge status={preview?.status} /></div><div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-slate-500">Simulated preview for {preview?.file}.</div></div></Modal>
    </div>
  );
}

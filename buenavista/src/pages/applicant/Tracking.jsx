import React, { useState } from 'react';
import { Download, Upload, Eye, CheckCircle2 } from 'lucide-react';
import { useStore } from '../../store/Store.jsx';
import { Badge, Btn, Card, CardHeader, Field, Modal, ProgressTimeline, inputCls } from '../../components/ui.jsx';
import { LC_DOCS, FEE_TOTAL, now, peso } from '../../data/initialState.js';

function normalizeLC(a) { return a ? { ...a, kind: 'LC', label: 'Locational Clearance' } : null; }
function normalizeBP(a) { return a ? { ...a, kind: 'BP', label: 'Building Permit' } : null; }

export default function Tracking({ user }) {
  const { state, upsertBP, toast } = useStore();
  const mine = [
    ...state.lcApplications.filter((a) => a.applicantEmail === user.email || a.applicant === user.name).map(normalizeLC),
    ...state.bpApplications.filter((a) => a.applicantEmail === user.email || a.applicant === user.name).map(normalizeBP),
  ];
  const [selectedId, setSelectedId] = useState(mine[0]?.id || '');
  const [preview, setPreview] = useState(null);
  const [occ, setOcc] = useState({ nbc: '', electrical: '', fire: '', occRef: '' });
  const app = mine.find((a) => a.id === selectedId) || mine[0];

  const handleDownload = (name) => { toast(`Prepared download: ${name}`); };
  const handleOccUpload = (field, label) => {
    setOcc((o) => ({ ...o, [field]: label }));
    toast(`Uploaded ${label}.`);
    if (app?.kind === 'BP') upsertBP({ ...app, occDocs: { ...(app.occDocs||{}), [field]: { name: label, at: now() } } }, user.name, 'Post-approval/occupancy document updated');
  };

  if (!app) {
    return <Card className="p-10 text-center max-w-lg mx-auto"><div className="text-slate-500">No applications to track yet. File a Locational Clearance or Building Permit first.</div></Card>;
  }

  const approved = app.status === 'Approved' || app.status === 'Issued';
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Select Application" subtitle={`${mine.length} filing(s) for ${user.name}`} />
        <div className="p-4 flex flex-wrap gap-2">
          {mine.map((a) => (
            <button key={a.id} onClick={() => setSelectedId(a.id)} className={`px-3 py-2 rounded-lg border text-sm text-left ${selectedId === a.id ? 'border-[#0D9488] bg-teal-50 font-semibold' : 'border-slate-200 hover:bg-slate-50'}`}>
              <div>{a.id}</div><div className="text-xs text-slate-500">{a.label}</div>
            </button>
          ))}
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title={`Live Progress — ${app.id}`} subtitle={`${app.project} · ${app.barangay}`} />
          <div className="p-5">
            <ProgressTimeline items={(app.timeline || []).map((t) => ({ title: t.title, sub: t.sub, done: !!t.done, current: !!t.current }))} />
            <div className="mt-4 flex items-center gap-2 text-sm">Status: <Badge status={app.status} /></div>
            {app.permitNo && <div className="mt-2 text-sm text-emerald-700 font-semibold flex items-center gap-1"><CheckCircle2 size={15} /> Permit No: {app.permitNo}</div>}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Approved / Issued Documents" subtitle={approved ? 'Downloads unlocked' : 'Downloads unlock as stages clear'} />
            <div className="p-5 space-y-2 text-sm">
              {(approved ? [`${app.id} Clearance/Decision (PDF)`, 'Zoning Certificate (PDF)', ...(app.permitNo ? [`Building Permit ${app.permitNo} (PDF)`, 'Approved Building Plans (PDF)'] : [])] : ['Documents will appear when approved/issued.']).map((d, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 gap-2">
                  <span className="min-w-0 truncate">{d}</span>
                  {approved ? (
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => setPreview({ title: d, body: `Preview: ${d} for ${app.id}. (Prototype preview)` })} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:underline"><Eye size={13} /> View</button>
                      <button onClick={() => handleDownload(d)} className="inline-flex items-center gap-1 text-xs font-semibold text-[#0D9488] hover:underline"><Download size={13} /> Download</button>
                    </div>
                  ) : <Badge status="Pending" />}
                </div>
              ))}
              <div className="text-xs text-slate-500 pt-1">Assessed fees ref: {peso(app.payment?.amount || FEE_TOTAL)} · Payment: <Badge status={app.payment?.status || 'Pending'} /></div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Completion & Occupancy Requirements" subtitle="Post-approval submission (NBC Form B-10, electrical, fire safety, occupancy)" />
            <div className="p-5 space-y-3 text-sm">
              {[{ k: 'nbc', label: 'Certificate of Completion (NBC Form B-10)', file: 'NBC-Form-B-10.pdf' }, { k: 'electrical', label: 'Electrical Works Completion', file: 'electrical-completion.pdf' }, { k: 'fire', label: 'Fire Safety Inspection Certificate', file: 'fire-safety-certificate.pdf' }].map((x) => (
                <div key={x.k} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 gap-2">
                  <div><div className="font-medium">{x.label}</div><div className="text-xs text-slate-500">{occ[x.k] || app.occDocs?.[x.k]?.name || x.file}</div></div>
                  {occ[x.k] || app.occDocs?.[x.k] ? <Badge status="Uploaded" /> : <button onClick={() => handleOccUpload(x.k, x.file)} className="inline-flex items-center gap-1 text-xs font-semibold text-[#0D9488] hover:underline"><Upload size={13} /> Upload</button>}
                </div>
              ))}
              <Field label="Certificate of Occupancy application ref">
                <input className={inputCls} value={occ.occRef} onChange={(e) => setOcc((o) => ({ ...o, occRef: e.target.value }))} placeholder="Reference / tracking no." />
              </Field>
              <Btn variant="ghost" onClick={() => { if (app.kind === 'BP') upsertBP({ ...app, occupancyRef: occ.occRef }, user.name, 'Occupancy application updated'); toast('Occupancy application details saved.'); }}>Submit Occupancy Application</Btn>
              {app.occupancyRef && <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">Saved occupancy ref: {app.occupancyRef}</div>}
            </div>
          </Card>
        </div>
      </div>

      <Modal open={!!preview} title={preview?.title || 'Preview'} onClose={() => setPreview(null)} footer={<Btn variant="ghost" onClick={() => setPreview(null)}>Close</Btn>}>
        <div className="text-sm text-slate-600 whitespace-pre-wrap">{preview?.body}</div>
      </Modal>
    </div>
  );
}

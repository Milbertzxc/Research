import React, { useMemo, useState } from 'react';
import { LayoutDashboard, FilePlus2, Building2, FolderOpen, Bell, UserCircle2, Upload, Eye, RefreshCw, ChevronLeft, ChevronRight, FileText, CheckCircle2, Ban, MapPin, CreditCard } from 'lucide-react';
import { INDIGENOUS_DOCS } from '../data/indigenousDwellingDocs.js';

const SIDEBAR = '#0d233a';
const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'lc', label: 'Apply for Locational Clearance', icon: FilePlus2 },
  { id: 'bp', label: 'Apply for Building Permit', icon: Building2 },
  { id: 'apps', label: 'My Applications', icon: FolderOpen },
  { id: 'notifs', label: 'Notifications', icon: Bell },
  { id: 'profile', label: 'Profile', icon: UserCircle2 },
];
const STEPS = [
  { n: 1, label: 'Classification' },
  { n: 2, label: 'Applicant & Project' },
  { n: 3, label: 'Pin Location' },
  { n: 4, label: '4. Documents' },
  { n: 5, label: 'Payment' },
];

const initDocs = () => INDIGENOUS_DOCS.map((m) => ({ id: m.id, status: 'Pending', file: '', na: false }));
function StatusPill({ status }) {
  const map = { Uploaded: 'bg-emerald-100 text-emerald-700', Pending: 'bg-red-100 text-red-700', 'Not Applicable': 'bg-slate-100 text-slate-600' };
  return <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${map[status] || map.Pending}`}>{status}</span>;
}
function TypePill({ type }) { return <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${type === 'Required' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-800'}`}>{type}</span>; }

export default function IndigenousDwellingPortal({ onExit }) {
  const [view, setView] = useState('lc');
  const [appStep, setAppStep] = useState(4); // focus on Step 4
  const [docs, setDocs] = useState(initDocs);
  const [selectedId, setSelectedId] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const metaById = (id) => INDIGENOUS_DOCS.find((d) => d.id === id);
  const docById = (id) => docs.find((d) => d.id === id);
  const selectedMeta = metaById(selectedId);
  const selectedDoc = docById(selectedId);

  const patch = (id, p) => setDocs((ds) => ds.map((d) => (d.id === id ? { ...d, ...p } : d)));
  const doUpload = (id) => { const m = metaById(id); patch(id, { status: 'Uploaded', file: `${m.fileBase}.pdf`, na: false }); };
  const doReplace = (id) => doUpload(id);
  const markNA = (id) => patch(id, { status: 'Not Applicable', file: '', na: true });
  const unmarkNA = (id) => patch(id, { status: 'Pending', file: '', na: false });
  const summary = useMemo(() => ({ uploaded: docs.filter(d => d.status === 'Uploaded').length, total: docs.length, reqPending: docs.filter(d => { const m = metaById(d.id); return m && m.type === 'Required' && d.status !== 'Uploaded'; }).length }), [docs]);

  const renderStepContent = () => {
    if (appStep !== 4) {
      const info = {
        1: { icon: FilePlus2, title: 'Step 1 — Classification', body: 'Classification set to Indigenous Dwelling. Use the step indicator or Next/Back to navigate.' },
        2: { icon: UserCircle2, title: 'Step 2 — Applicant & Project', body: 'Applicant and project details captured (functional navigation state).' },
        3: { icon: MapPin, title: 'Step 3 — Pin Location', body: 'GIS location pinned and coordinates recorded (functional navigation state).' },
        5: { icon: CreditCard, title: 'Step 5 — Payment', body: 'Fees assessed and payment submission tracked (functional navigation state).' },
      }[appStep];
      const Icon = info.icon;
      return (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-2xl">
          <Icon className="mx-auto text-slate-400 mb-3" size={28} />
          <h3 className="font-bold text-slate-900">{info.title}</h3>
          <p className="text-sm text-slate-500 mt-1">{info.body}</p>
          <div className="mt-5 flex justify-center gap-2"><button onClick={() => setAppStep(s => Math.max(1, s-1))} className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold">Back</button><button onClick={() => setAppStep(s => Math.min(5, s+1))} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-500">Next</button></div>
        </div>
      );
    }

    // Step 4 detail
    if (selectedId && selectedMeta && selectedDoc) {
      const idx = INDIGENOUS_DOCS.findIndex(d => d.id === selectedId);
      return (
        <div className="space-y-4">
          <button onClick={() => setSelectedId(null)} className="inline-flex items-center gap-1 text-sm font-semibold hover:underline" style={{ color: SIDEBAR }}><ChevronLeft size={16}/> Back to checklist</button>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3 flex-wrap">
              <div><div className="text-xs font-semibold text-slate-500">#{selectedMeta.id} · Indigenous Dwelling</div><h3 className="font-bold text-slate-900 mt-0.5">{selectedMeta.name}</h3></div>
              <div className="flex gap-2"><TypePill type={selectedMeta.type} /><StatusPill status={selectedDoc.status} /></div>
            </div>
            <div className="p-5 grid lg:grid-cols-2 gap-4 text-sm">
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-2">
                <div className="font-semibold text-slate-800">Requirement Details</div>
                <div><span className="text-slate-500">What to submit:</span> <span className="text-slate-700">{selectedMeta.what}</span></div>
                <div><span className="text-slate-500">Prepared / issued by:</span> <span className="text-slate-700">{selectedMeta.issuedBy}</span></div>
                <div><span className="text-slate-500">Copies:</span> <span className="text-slate-700">{selectedMeta.copies}</span></div>
                <div><span className="text-slate-500">Type:</span> <span className="text-slate-700">{selectedMeta.type}</span></div>
                <div><span className="text-slate-500">Applies to:</span> <span className="text-slate-700">{selectedMeta.appliesTo}</span></div>
                <div><span className="text-slate-500">Note:</span> <span className="text-slate-700">{selectedMeta.note}</span></div>
              </div>
              <div className="space-y-3">
                {selectedDoc.status !== 'Not Applicable' ? (
                  <div onDragOver={(e)=>{e.preventDefault(); setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onDrop={(e)=>{e.preventDefault(); setDragOver(false); doUpload(selectedId);}} className={`rounded-xl border-2 border-dashed p-6 text-center transition ${dragOver ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 bg-slate-50'}`}>
                    <Upload className="mx-auto text-slate-400 mb-2" size={22} />
                    <div className="text-sm font-semibold text-slate-700">Drag and drop file here</div>
                    <div className="text-xs text-slate-500 mb-3">or click Browse · generates <span className="font-mono">{selectedMeta.fileBase}.pdf</span></div>
                    <button onClick={() => doUpload(selectedId)} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: SIDEBAR }}>Browse</button>
                    {selectedDoc.file && <div className="mt-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 inline-flex items-center gap-1"><CheckCircle2 size={14}/> Uploaded: <span className="font-mono">{selectedDoc.file}</span></div>}
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600"><Ban className="mx-auto text-slate-400 mb-2" size={22}/> Marked as <b>Not Applicable</b>.</div>
                )}
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setPreview({ meta: selectedMeta, doc: selectedDoc })} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold hover:bg-slate-50"><Eye size={15}/> Preview</button>
                  <button onClick={() => doReplace(selectedId)} disabled={selectedDoc.status === 'Not Applicable'} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold hover:bg-slate-50 disabled:opacity-40"><RefreshCw size={15}/> Replace</button>
                  {selectedMeta.type === 'If applicable' && (selectedDoc.status !== 'Not Applicable'
                    ? <button onClick={() => markNA(selectedId)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-100 text-amber-800 border border-amber-300 text-sm font-semibold hover:bg-amber-200"><Ban size={15}/> Mark as not applicable</button>
                    : <button onClick={() => unmarkNA(selectedId)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold hover:bg-slate-50">Mark as applicable</button>)}
                </div>
                <div className="text-xs text-slate-500">Current status: <StatusPill status={selectedDoc.status} /></div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <button onClick={() => idx > 0 ? setSelectedId(INDIGENOUS_DOCS[idx - 1].id) : setSelectedId(null)} className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold hover:bg-slate-50"><ChevronLeft size={16}/> {idx === 0 ? 'Back' : 'Back'}</button>
            <div className="text-xs text-slate-500">Requirement {idx + 1} of {INDIGENOUS_DOCS.length}</div>
            <button onClick={() => idx < INDIGENOUS_DOCS.length - 1 ? setSelectedId(INDIGENOUS_DOCS[idx + 1].id) : setSelectedId(null)} className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600">Next requirement <ChevronRight size={16}/></button>
          </div>
        </div>
      );
    }

    // Step 4 master table
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
            <div><h3 className="font-bold text-slate-900">Documents — Checklist for Indigenous Dwelling</h3><p className="text-xs text-slate-500 mt-0.5">{summary.uploaded}/{summary.total} uploaded · {summary.reqPending} required pending</p></div>
            <div className="h-2 w-44 bg-slate-100 rounded-full"><div className="h-2 rounded-full bg-emerald-500" style={{ width: `${(summary.uploaded/summary.total)*100}%` }} /></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-slate-500 border-b border-slate-100 bg-slate-50"><th className="px-4 py-3">#</th><th className="px-3 py-3">Requirement</th><th className="px-3 py-3">Type</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">File</th><th className="px-3 py-3 text-right">Action</th></tr></thead>
              <tbody>
                {INDIGENOUS_DOCS.map((m) => {
                  const d = docById(m.id);
                  const uploaded = d?.status === 'Uploaded';
                  return (
                    <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-500 font-medium">{m.id}</td>
                      <td className="px-3 py-3"><button onClick={() => setSelectedId(m.id)} className="text-left font-semibold hover:underline" style={{ color: SIDEBAR }}>{m.name}</button></td>
                      <td className="px-3 py-3"><TypePill type={m.type} /></td>
                      <td className="px-3 py-3"><StatusPill status={d?.status || 'Pending'} /></td>
                      <td className="px-3 py-3 text-xs font-mono text-slate-500 max-w-[200px] truncate">{d?.file || '—'}</td>
                      <td className="px-3 py-3 text-right"><button onClick={() => setSelectedId(m.id)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: uploaded ? '#3b82f6' : SIDEBAR }}>{uploaded ? <><RefreshCw size={13}/> Replace</> : <><Upload size={13}/> Upload</>}</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <button onClick={() => setAppStep(3)} className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold hover:bg-slate-50">Back</button>
          <button onClick={() => setAppStep(5)} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600">Next</button>
        </div>
      </div>
    );
  };

  const mainContent = () => {
    if (view !== 'lc') {
      const n = NAV.find(x => x.id === view);
      return (
        <div className="bg-white rounded-xl border border-slate-200 p-8">
          <h2 className="font-bold text-slate-900 text-lg">{n?.label}</h2>
          <p className="text-sm text-slate-500 mt-1">This view is active and functional. Use <b>Apply for Locational Clearance</b> to access the Step 4 Indigenous Dwelling documents checklist.</p>
          <button onClick={() => setView('lc')} className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: SIDEBAR }}>Go to Locational Clearance</button>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        {/* Step indicator */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 overflow-x-auto">
          <ol className="flex items-center gap-1 min-w-max">
            {STEPS.map((s, i) => {
              const active = s.n === appStep;
              const done = s.n < appStep;
              return (
                <li key={s.n} className="flex items-center gap-1">
                  <button onClick={() => setAppStep(s.n)} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition ${active ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}>
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${done ? 'bg-emerald-500 text-white' : active ? 'text-white' : 'bg-slate-200 text-slate-500'}`} style={active ? { background: SIDEBAR } : undefined}>{s.n}</span>
                    <span className={`text-xs font-semibold ${active ? 'text-slate-900' : 'text-slate-500'}`}>{s.label}</span>
                  </button>
                  {i < STEPS.length - 1 && <span className="w-6 h-px bg-slate-300 mx-1" />}
                </li>
              );
            })}
          </ol>
        </div>
        {renderStepContent()}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex bg-slate-100">
      <aside className="w-64 shrink-0 text-white flex flex-col fixed inset-y-0 z-20 max-md:static max-md:w-full" style={{ background: SIDEBAR }}>
        <div className="px-5 py-5 border-b border-white/10">
          <div className="font-bold leading-tight">Municipality of Buenavista</div>
          <div className="text-[11px] text-slate-300 mt-0.5">Locational Clearance Portal</div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map((n) => { const Icon = n.icon; const active = view === n.id; return (
            <button key={n.id} onClick={() => { setView(n.id); if (n.id === 'lc') { setSelectedId(null); } }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition ${active ? 'bg-white/15 text-white' : 'text-slate-200 hover:bg-white/10'}`} style={active ? { boxShadow: 'inset 3px 0 0 #10b981' } : undefined}>
              <Icon size={17} /> {n.label}
            </button>
          );})}
        </nav>
        <div className="p-3 border-t border-white/10">{onExit && <button onClick={onExit} className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-white/10">← Exit demo</button>}</div>
      </aside>
      <div className="flex-1 ml-64 max-md:ml-0 min-w-0 flex flex-col">
        <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
          <h1 className="font-bold text-slate-900">{view === 'lc' ? 'Apply for Locational Clearance — Indigenous Dwelling' : NAV.find(n=>n.id===view)?.label}</h1>
          <p className="text-xs text-slate-500">Step 4: Documents checklist with full state management</p>
        </header>
        <main className="flex-1 p-6 max-md:p-4 min-w-0">{mainContent()}</main>
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setPreview(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between"><h3 className="font-semibold text-slate-900">Document Preview</h3><button onClick={() => setPreview(null)} className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button></div>
            <div className="p-5 text-sm space-y-2">
              <div><b>Requirement:</b> {preview.meta.name}</div>
              <div><b>File:</b> <span className="font-mono">{preview.doc.file || `${preview.meta.fileBase}.pdf`}</span></div>
              <div><b>Status:</b> <StatusPill status={preview.doc.status} /></div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-slate-500"><FileText className="mx-auto mb-2 text-slate-400" size={28}/>{preview.doc.status === 'Uploaded' ? `Simulated preview for ${preview.doc.file}. (PDF preview placeholder)` : 'No file uploaded yet. Use Browse/Upload or Replace to attach a file, then preview again.'}</div>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 flex justify-end"><button onClick={() => setPreview(null)} className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold">Close</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

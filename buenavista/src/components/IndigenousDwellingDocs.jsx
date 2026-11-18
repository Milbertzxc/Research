import React, { useMemo, useState } from 'react';
import { Upload, Eye, RefreshCw, ChevronLeft, ChevronRight, FileText, CheckCircle2, XCircle, Ban } from 'lucide-react';
import { INDIGENOUS_DOCS } from '../data/indigenousDwellingDocs.js';

const COLORS = {
  sidebar: '#0d233a',
  emerald: '#10b981',
  blue: '#3b82f6',
  amber: '#f59e0b',
  red: '#ef4444',
};

function StatusPill({ status }) {
  const map = {
    Uploaded: { bg: 'bg-emerald-100 text-emerald-700', dot: COLORS.emerald },
    Pending: { bg: 'bg-red-100 text-red-700', dot: COLORS.red },
    'Not Applicable': { bg: 'bg-slate-100 text-slate-600', dot: '#64748b' },
  };
  const s = map[status] || map.Pending;
  return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg}`}><span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />{status}</span>;
}
function TypePill({ type }) {
  const req = type === 'Required';
  return <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${req ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-800'}`}>{type}</span>;
}

export default function IndigenousDwellingDocs({ value, onChange, onBackStep, onNextStep }) {
  const [docs, setDocs] = useState(() => value || INDIGENOUS_DOCS.map(d => ({ id: d.id, status: d.optional ? 'Pending' : 'Pending', file: '', na: false })));
  const [selectedId, setSelectedId] = useState(null); // null = master
  const [preview, setPreview] = useState(null);
  const selected = docs.find(d => d.id === selectedId);
  const meta = INDIGENOUS_DOCS.find(d => d.id === selectedId);

  const emit = (next) => { setDocs(next); onChange?.(next); };
  const patch = (id, p) => emit(docs.map(d => d.id === id ? { ...d, ...p } : d));
  const upload = (id) => { const m = INDIGENOUS_DOCS.find(x => x.id === id); patch(id, { status: 'Uploaded', file: `${m.fileBase}.pdf`, na: false }); };
  const replace = (id) => upload(id);
  const markNA = (id) => patch(id, { status: 'Not Applicable', file: '', na: true });
  const unmarkNA = (id) => patch(id, { status: 'Pending', na: false });

  const summary = useMemo(() => {
    const uploaded = docs.filter(d => d.status === 'Uploaded').length;
    const pendingReq = docs.filter(d => { const m = INDIGENOUS_DOCS.find(x=>x.id===d.id); return m && !m.optional && d.status !== 'Uploaded'; }).length;
    return { uploaded, pendingReq, total: docs.length };
  }, [docs]);

  if (selectedId && meta && selected) {
    const idx = INDIGENOUS_DOCS.findIndex(d => d.id === selectedId);
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button onClick={() => setSelectedId(null)} className="inline-flex items-center gap-1 text-sm font-semibold text-[#0d233a] hover:underline"><ChevronLeft size={16}/> Back to checklist</button>
          <div className="text-xs text-slate-500">Requirement {idx + 1} of {INDIGENOUS_DOCS.length}</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3 flex-wrap">
            <div><div className="text-xs font-semibold text-slate-500">#{meta.id} · Indigenous Dwelling</div><h3 className="font-bold text-slate-900 mt-0.5">{meta.name}</h3></div>
            <div className="flex items-center gap-2"><TypePill type={meta.type} /><StatusPill status={selected.status} /></div>
          </div>
          <div className="p-5 grid md:grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-2">
              <div className="font-semibold text-slate-800">Metadata</div>
              <div><span className="text-slate-500">What to submit:</span> <span className="text-slate-700">{meta.what}</span></div>
              <div><span className="text-slate-500">Prepared / issued by:</span> <span className="text-slate-700">{meta.issuedBy}</span></div>
              <div><span className="text-slate-500">Copies:</span> <span className="text-slate-700">{meta.copies}</span></div>
              <div><span className="text-slate-500">Type:</span> <span className="text-slate-700">{meta.type}</span></div>
              <div><span className="text-slate-500">Applies to:</span> <span className="text-slate-700">{meta.appliesTo}</span></div>
              <div><span className="text-slate-500">Note:</span> <span className="text-slate-700">{meta.note}</span></div>
            </div>
            <div className="space-y-3">
              {selected.status !== 'Not Applicable' ? (
                <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 text-center">
                  <Upload className="mx-auto text-slate-400 mb-2" size={22} />
                  <div className="text-sm font-semibold text-slate-700">Drag and drop file here</div>
                  <div className="text-xs text-slate-500 mb-3">PDF, JPG, PNG · generated as <span className="font-mono">{meta.fileBase}.pdf</span></div>
                  <button onClick={() => upload(meta.id)} className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: COLORS.sidebar }}>Browse / Upload</button>
                  {selected.file && <div className="mt-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex items-center justify-center gap-1"><CheckCircle2 size={14}/> Uploaded: <span className="font-mono">{selected.file}</span></div>}
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-600"><Ban className="mx-auto text-slate-400 mb-2" size={22}/> Marked as <b>Not Applicable</b> for this application.</div>
              )}

              <div className="flex flex-wrap gap-2">
                <button onClick={() => selected.file ? setPreview({ ...meta, file: selected.file, status: selected.status }) : setPreview({ ...meta, file: `${meta.fileBase}.pdf`, status: selected.status, empty: !selected.file })} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Eye size={15}/> Preview</button>
                <button onClick={() => replace(meta.id)} disabled={selected.status === 'Not Applicable'} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"><RefreshCw size={15}/> Replace</button>
                {meta.optional && (selected.status !== 'Not Applicable'
                  ? <button onClick={() => markNA(meta.id)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-300 text-sm font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100"><Ban size={15}/> Mark as not applicable</button>
                  : <button onClick={() => unmarkNA(meta.id)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50">Mark as applicable</button>)}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button onClick={() => setSelectedId(INDIGENOUS_DOCS[Math.max(0, idx - 1)].id)} disabled={idx === 0} className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold disabled:opacity-40 hover:bg-slate-50"><ChevronLeft size={16}/> Back</button>
          <div className="flex gap-2">
            <button onClick={() => setSelectedId(null)} className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold hover:bg-slate-50">Checklist</button>
            <button onClick={() => idx < INDIGENOUS_DOCS.length - 1 ? setSelectedId(INDIGENOUS_DOCS[idx + 1].id) : setSelectedId(null)} className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: COLORS.emerald }}>Next requirement <ChevronRight size={16}/></button>
          </div>
        </div>

        {preview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50" onClick={() => setPreview(null)} />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between"><h3 className="font-semibold text-slate-900">Document Preview</h3><button onClick={() => setPreview(null)} className="text-slate-400 hover:text-slate-700 text-xl">×</button></div>
              <div className="p-5 text-sm space-y-2">
                <div><b>Requirement:</b> {preview.name}</div>
                <div><b>File:</b> <span className="font-mono">{preview.file}</span></div>
                <div><b>Status:</b> <StatusPill status={preview.status || 'Pending'} /></div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
                  <FileText className="mx-auto mb-2 text-slate-400" size={28} />
                  {preview.empty ? 'No file uploaded yet. Use Upload/Browse or Replace to attach a file.' : `Simulated PDF/file preview for ${preview.file}.`}
                </div>
              </div>
              <div className="px-5 py-4 border-t border-slate-100 flex justify-end"><button onClick={() => setPreview(null)} className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold">Close</button></div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Master checklist table
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-bold text-slate-900">Step 4 — Documents Checklist (Indigenous Dwelling)</h3>
            <p className="text-xs text-slate-500 mt-0.5">{summary.uploaded}/{summary.total} uploaded · {summary.pendingReq} required pending · click a requirement or action to open details</p>
          </div>
          <div className="h-2 w-40 bg-slate-100 rounded-full"><div className="h-2 rounded-full" style={{ width: `${(summary.uploaded / summary.total) * 100}%`, background: COLORS.emerald }} /></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-slate-500 border-b border-slate-100 bg-slate-50"><th className="px-4 py-3 w-12">#</th><th className="px-3 py-3">Requirement</th><th className="px-3 py-3">Type</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">File</th><th className="px-3 py-3 text-right">Action</th></tr></thead>
            <tbody>
              {INDIGENOUS_DOCS.map((m) => {
                const d = docs.find(x => x.id === m.id);
                return (
                  <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50/70">
                    <td className="px-4 py-3 text-slate-500 font-medium">{m.id}</td>
                    <td className="px-3 py-3"><button onClick={() => setSelectedId(m.id)} className="text-left font-semibold text-[#0d233a] hover:underline">{m.name}</button></td>
                    <td className="px-3 py-3"><TypePill type={m.type} /></td>
                    <td className="px-3 py-3"><StatusPill status={d?.status || 'Pending'} /></td>
                    <td className="px-3 py-3 text-xs font-mono text-slate-500 max-w-[180px] truncate" title={d?.file || '—'}>{d?.file || '—'}</td>
                    <td className="px-3 py-3 text-right">
                      <button onClick={() => setSelectedId(m.id)} className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white ${d?.status === 'Uploaded' ? '' : ''}`} style={{ background: d?.status === 'Uploaded' ? COLORS.blue : COLORS.sidebar }}>
                        {d?.status === 'Uploaded' ? <><RefreshCw size={13}/> Replace</> : <><Upload size={13}/> Upload</>}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <button onClick={onBackStep} className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold hover:bg-slate-50">Back</button>
        <button onClick={onNextStep} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: COLORS.emerald }}>Next</button>
      </div>
    </div>
  );
}

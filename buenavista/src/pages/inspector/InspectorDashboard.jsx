import React, { useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Clock3, AlertTriangle } from 'lucide-react';
import { useStore } from '../../store/Store.jsx';
import { Badge, Btn, Card, CardHeader, Field, Modal, StatCard, inputCls } from '../../components/ui.jsx';

function calendarDays(year, month) { // month 0-indexed
  const first = new Date(year, month, 1).getDay();
  const count = new Date(year, month + 1, 0).getDate();
  const cells = []; for (let i=0;i<first;i++) cells.push(null); for (let d=1; d<=count; d++) cells.push(d); return cells;
}

export default function InspectorDashboard({ setPage, actor = 'Inspector', isZoning = false }) {
  const { state, updateInspection } = useStore();
  const rawInsp = state.inspections;
  const insp = isZoning ? rawInsp.filter(i => (i.ref && i.ref.startsWith('LC')) || i.reportType === 'Zoning report' || !i.ref) : rawInsp;
  const [filter, setFilter] = useState('All');
  const [view, setView] = useState(null);
  const now = new Date(); const [cal, setCal] = useState({ y: 2026, m: 9 }); // Oct 2026 (0-indexed)
  const cells = calendarDays(cal.y, cal.m);
  const monthLabel = new Date(cal.y, cal.m, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const byDate = (d) => insp.filter(i => i.date === `${cal.y}-${String(cal.m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`);
  const counts = (s) => insp.filter(i => i.status === s || i.verdict === s).length;
  const shown = filter === 'All' ? insp : insp.filter(i => i.status === filter || i.verdict === filter);

  const setStatus = (i, status) => updateInspection(i.id, { status }, actor, `Inspection ${status}`);

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={CalendarDays} label="Scheduled" value={String(counts('Scheduled'))} sub="Upcoming site visits" tone="teal" />
        <StatCard icon={Clock3} label="Pending" value={String(counts('Pending'))} sub="Awaiting action" tone="amber" />
        <StatCard icon={CheckCircle2} label="Passed / Conforming" value={String(insp.filter(i=>i.verdict==='Passed'||i.verdict==='Conforming').length)} sub="Completed compliant" tone="emerald" />
        <StatCard icon={AlertTriangle} label="Failed / Non-Conforming" value={String(insp.filter(i=>i.verdict==='Failed'||i.verdict==='Non-Conforming').length)} sub="Requires follow-up" tone="rose" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Inspection Calendar" subtitle={monthLabel} action={<div className="flex gap-1"><Btn variant="ghost" className="px-2 py-1" onClick={()=>setCal(c=>c.m===0?{y:c.y-1,m:11}:{...c,m:c.m-1})}>‹</Btn><Btn variant="ghost" className="px-2 py-1" onClick={()=>setCal(c=>c.m===11?{y:c.y+1,m:0}:{...c,m:c.m+1})}>›</Btn></div>} />
          <div className="p-4">
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-500 mb-1">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=><div key={d}>{d}</div>)}</div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((d,i)=> d ? (
                <button key={i} onClick={()=>{ const items=byDate(d); if(items.length) setView(items[0]); }} className={`h-12 rounded-lg border text-xs relative ${byDate(d).length?'border-[#0D9488] bg-teal-50 font-semibold':'border-slate-100 hover:bg-slate-50'}`}>
                  {d}{byDate(d).length>0 && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#0D9488]" />}
                </button>
              ) : <div key={i} />)}
            </div>
          </div>
        </Card>
        <Card>
          <CardHeader title={isZoning ? "Assigned Zoning Site Inspections" : "Assigned Building Site Inspections"} subtitle="Update status or open report" action={<Btn variant="ghost" onClick={()=>setPage('report')}>Open Report Form</Btn>} />
          <div className="p-4">
            <div className="flex flex-wrap gap-2 mb-3">{['All','Scheduled','Pending','Completed'].map(f=><button key={f} onClick={()=>setFilter(f)} className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${filter===f?'bg-[#1E3A8A] text-white border-[#1E3A8A]':'border-slate-200 text-slate-600'}`}>{f}</button>)}</div>
            <div className="space-y-2 max-h-72 overflow-y-auto nice-scroll">
              {shown.map(i => (
                <div key={i.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                  <div className="flex justify-between gap-2"><span className="font-semibold">{i.id}</span><Badge status={i.verdict || i.status} /></div>
                  <div>{i.project} · {i.barangay}</div>
                  <div className="text-xs text-slate-500">{i.date} {i.time} · {i.ref}</div>
                  <div className="mt-2 flex flex-wrap gap-1">{['Scheduled','Pending','Completed'].map(s=><button key={s} onClick={()=>setStatus(i,s)} className="text-[11px] px-2 py-1 rounded border border-slate-200 hover:bg-slate-50">{s}</button>)}<button onClick={()=>{ setView(i); setPage('report'); }} className="text-[11px] px-2 py-1 rounded bg-[#0D9488] text-white">Report</button></div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <Modal open={!!view} title={`Inspection ${view?.id || ''}`} onClose={()=>setView(null)} footer={<Btn variant="ghost" onClick={()=>setView(null)}>Close</Btn>}>
        {view && <div className="text-sm space-y-1"><div><b>Project:</b> {view.project}</div><div><b>Location:</b> {view.barangay} ({view.ref})</div><div><b>Schedule:</b> {view.date} {view.time}</div><div><b>Status:</b> <Badge status={view.verdict || view.status} /></div><div><b>Inspector:</b> {view.inspector}</div>{view.findings && <div><b>Findings:</b> {view.findings}</div>}</div>}
      </Modal>
    </div>
  );
}

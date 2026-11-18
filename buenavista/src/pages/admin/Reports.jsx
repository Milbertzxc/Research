import React, { useMemo } from 'react';
import { Download, FileSpreadsheet, BarChart3 } from 'lucide-react';
import { useStore } from '../../store/Store.jsx';
import { Badge, Btn, Card, CardHeader, StatCard } from '../../components/ui.jsx';

function Bars({ data, color = '#0D9488' }) {
  const max = Math.max(1, ...data.map(d => d.value));
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label} className="text-sm">
          <div className="flex justify-between mb-0.5"><span className="truncate pr-2">{d.label}</span><span className="font-semibold">{d.value}</span></div>
          <div className="h-2.5 bg-slate-100 rounded-full"><div className="h-2.5 rounded-full" style={{ width: `${(d.value / max) * 100}%`, background: color }} /></div>
        </div>
      ))}
    </div>
  );
}

function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click(); URL.revokeObjectURL(a.href);
}

export default function Reports() {
  const { state, toast } = useStore();
  const all = useMemo(() => [...state.lcApplications.map(a=>({ ...a, type:'Locational Clearance' })), ...state.bpApplications.map(a=>({ ...a, type:'Building Permit' }))], [state]);
  const byBarangay = useMemo(() => {
    const m = {}; all.forEach(a => { m[a.barangay || 'Unknown'] = (m[a.barangay || 'Unknown'] || 0) + 1; }); return Object.entries(m).map(([label,value])=>({ label, value }));
  }, [all]);
  const byType = useMemo(() => ([{ label: 'Locational Clearance', value: state.lcApplications.length }, { label: 'Building Permit', value: state.bpApplications.length }]), [state]);
  const byStatus = useMemo(() => {
    const m = {}; all.forEach(a => { m[a.status] = (m[a.status] || 0) + 1; }); return Object.entries(m).map(([label,value])=>({ label, value }));
  }, [all]);
  const monthly = [{ label: 'Aug 2026', value: 2 }, { label: 'Sep 2026', value: 3 }, { label: 'Oct 2026', value: all.length }];
  const approved = all.filter(a => ['Approved','Issued'].includes(a.status)).length;

  const exportCSV = () => {
    const rows = [['ID','Type','Applicant','Project','Barangay','Status','Updated'], ...all.map(a => [a.id,a.type,a.applicant,a.project,a.barangay,a.status,a.updated||''])];
    const csv = rows.map(r => r.map(v => `"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n');
    download('mpdo-report.csv', csv, 'text/csv;charset=utf-8'); toast('Exported Excel-compatible CSV (mpdo-report.csv).');
  };
  const exportPDF = () => {
    const html = `<html><head><title>MPDO Report</title><style>body{font-family:Arial,sans-serif;padding:24px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:6px;font-size:12px;text-align:left}th{background:#1E3A8A;color:#fff}</style></head><body><h2>Buenavista MPDO/OBO — Reports & Analytics</h2><p>Generated: ${new Date().toLocaleString('en-PH')}</p><p>Total: ${all.length} · Approved/Issued: ${approved}</p><table><tr><th>ID</th><th>Type</th><th>Applicant</th><th>Project</th><th>Barangay</th><th>Status</th></tr>${all.map(a=>`<tr><td>${a.id}</td><td>${a.type}</td><td>${a.applicant}</td><td>${a.project}</td><td>${a.barangay}</td><td>${a.status}</td></tr>`).join('')}</table><script>window.print()</script></body></html>`;
    const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close(); } toast('PDF export opened (use browser Print to PDF).');
  };

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={BarChart3} label="Total Applications" value={String(all.length)} sub="LC + Building Permits" tone="teal" />
        <StatCard icon={BarChart3} label="Approved / Issued" value={String(approved)} sub="Completed decisions" tone="emerald" />
        <StatCard icon={BarChart3} label="Barangays Covered" value={String(byBarangay.length)} sub="With filings" tone="indigo" />
        <StatCard icon={BarChart3} label="Active Users" value={String(state.users.filter(u=>u.status==='Active').length)} sub="System accounts" tone="amber" />
      </div>

      <Card>
        <CardHeader title="Generate & Export Reports" subtitle="Dynamic metrics and distribution charts" action={<div className="flex gap-2"><Btn variant="ghost" onClick={exportPDF}><Download size={15}/> Export PDF</Btn><Btn variant="navy" onClick={exportCSV}><FileSpreadsheet size={15}/> Export Excel</Btn></div>} />
        <div className="p-5 grid lg:grid-cols-2 gap-6">
          <div><div className="text-sm font-semibold text-slate-800 mb-3">Applications by Barangay</div><Bars data={byBarangay} /></div>
          <div><div className="text-sm font-semibold text-slate-800 mb-3">Applications by Permit Type</div><Bars data={byType} color="#1E3A8A" /></div>
          <div><div className="text-sm font-semibold text-slate-800 mb-3">Applications by Status</div><Bars data={byStatus} color="#6366F1" /></div>
          <div><div className="text-sm font-semibold text-slate-800 mb-3">Monthly Trends</div><Bars data={monthly} color="#0D9488" /></div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Application Detail Table" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm"><thead><tr className="text-left text-xs text-slate-500 border-b border-slate-100"><th className="px-5 py-3">ID</th><th className="px-3 py-3">Type</th><th className="px-3 py-3">Applicant</th><th className="px-3 py-3">Project</th><th className="px-3 py-3">Barangay</th><th className="px-3 py-3">Status</th></tr></thead>
            <tbody>{all.map(a=><tr key={a.id} className="border-b border-slate-50"><td className="px-5 py-3 font-semibold">{a.id}</td><td className="px-3 py-3">{a.type}</td><td className="px-3 py-3">{a.applicant}</td><td className="px-3 py-3">{a.project}</td><td className="px-3 py-3">{a.barangay}</td><td className="px-3 py-3"><Badge status={a.status} /></td></tr>)}</tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

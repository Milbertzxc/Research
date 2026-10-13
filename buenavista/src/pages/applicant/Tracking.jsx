import React, { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { Badge, Btn, Card, CardHeader, ProgressTimeline, inputCls } from '../../components/ui.jsx';

const STAGES = [
  { title: 'Submitted', sub: 'Oct 01, 2026 · received by MPDO' },
  { title: 'Zoning Verification', sub: 'Oct 05, 2026 · Poblacion 2 — Compliant' },
  { title: 'Technical Review', sub: 'Oct 10, 2026 · Architectural division' },
  { title: 'Payment', sub: 'Pending · ₱2,372.00 assessed' },
  { title: 'Issuance', sub: 'Awaiting approval' },
];

export default function Tracking() {
  const [cert, setCert] = useState('');
  return (
    <div className="grid lg:grid-cols-2 gap-4 max-w-5xl">
      <Card>
        <CardHeader title="Live Progress — BP-2026-0455" subtitle="Dela Cruz Sari-Sari Store · Poblacion 1" />
        <div className="p-5">
          <ProgressTimeline
            items={STAGES.map((s, i) => ({ ...s, done: i < 2, current: i === 2 }))}
          />
          <div className="mt-4 flex items-center gap-2 text-sm">
            Status: <Badge status="Under Review" />
          </div>
        </div>
      </Card>
      <div className="space-y-4">
        <Card>
          <CardHeader title="Approved Documents" subtitle="Downloads unlock as stages clear" />
          <div className="p-5 space-y-2 text-sm">
            {['Locational Clearance LC-2026-0098 (PDF)', 'Zoning Certificate (PDF)', 'Approved Building Plans (PDF)'].map((d) => (
              <div key={d} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                <span>{d}</span>
                <button className="inline-flex items-center gap-1 text-xs font-semibold text-[#0D9488] hover:underline"><Download size={13} /> Download</button>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Certificate of Completion / Occupancy" subtitle="Upload after construction for final inspection" />
          <div className="p-5 space-y-3">
            <input className={inputCls} value={cert} onChange={(e) => setCert(e.target.value)} placeholder="Completion certificate reference no." />
            <Btn variant="ghost"><Upload size={15} /> Upload Certificate</Btn>
            {cert && <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">Staged for upload: {cert}</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}

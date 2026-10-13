import React, { useState } from 'react';
import { Stamp } from 'lucide-react';
import { PERMIT_TYPES } from '../../data/mock.js';
import { Btn, Card, CardHeader } from '../../components/ui.jsx';

const CONDITIONS = [
  'Post approved plans conspicuously at the job site at all times.',
  'No occupancy without a Certificate of Occupancy from this Office.',
  'Any deviation from approved plans requires a revised permit.',
  'Comply with Fire Code and Sanitation Code clearances prior to occupancy.',
];

export default function Issuance() {
  const [agreed, setAgreed] = useState(false);
  const [issued, setIssued] = useState('');
  return (
    <Card className="max-w-3xl">
      <CardHeader title="Permit Issuance — BP-2026-0455" subtitle="Final review before release" />
      <div className="p-5 space-y-4">
        <div>
          <div className="text-xs font-semibold text-slate-600 mb-2">Permits covered</div>
          <div className="flex flex-wrap gap-2">
            {PERMIT_TYPES.slice(0, 4).map((t) => (
              <span key={t} className="text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200 rounded-full px-3 py-1">{t}</span>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-600 mb-2">Permit conditions</div>
          <ol className="list-decimal ml-5 text-sm text-slate-700 space-y-1">
            {CONDITIONS.map((c) => <li key={c}>{c}</li>)}
          </ol>
        </div>
        <label className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 accent-[#0D9488]" />
          Applicant has settled all assessed fees and submitted complete technical documents.
        </label>
        <Btn disabled={!agreed} onClick={() => setIssued('Building Permit BP-2026-0455 ISSUED — signed by the Building Official, Oct 13, 2026.')}>
          <Stamp size={15} /> Issue Permit
        </Btn>
        {issued && <div className="text-sm bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg px-4 py-3">{issued}</div>}
      </div>
    </Card>
  );
}

import React from 'react';
import { Users, UserPlus, HardHat, Stamp, Activity } from 'lucide-react';
import { AUDIT_FEED } from '../../data/mock.js';
import { Badge, Btn, Card, CardHeader, StatCard } from '../../components/ui.jsx';

export default function AdminDashboard({ setPage }) {
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard icon={Users} label="Total Users" value="128" sub="+6 this month" tone="teal" />
        <StatCard icon={UserPlus} label="Applicants" value="102" tone="indigo" />
        <StatCard icon={Users} label="MPDO Personnel" value="8" tone="emerald" />
        <StatCard icon={Stamp} label="Building Officials" value="6" tone="amber" />
        <StatCard icon={HardHat} label="Inspectors" value="12" tone="rose" />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Real-Time Audit Activity" subtitle="Latest system events" action={<Activity size={16} className="text-slate-400" />} />
          <div className="p-4 space-y-3">
            {AUDIT_FEED.map((a, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <span className="w-2 h-2 rounded-full bg-[#0D9488] mt-1.5 shrink-0" />
                <div><b>{a.actor}</b> — {a.action}<div className="text-xs text-slate-400">{a.time}</div></div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Shortcuts" />
          <div className="p-4 grid sm:grid-cols-3 gap-2">
            <Btn variant="ghost" onClick={() => setPage('users')}>Manage Users</Btn>
            <Btn variant="ghost" onClick={() => setPage('zones')}>Zones & Settings</Btn>
            <Btn variant="navy" onClick={() => setPage('reports')}>View Analytics</Btn>
          </div>
          <div className="px-4 pb-4 text-xs text-slate-500">
            System health: <Badge status="Compliant">Operational</Badge> · backup 2 hrs ago · uptime 99.9%
          </div>
        </Card>
      </div>
    </div>
  );
}

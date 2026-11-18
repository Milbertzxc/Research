import React from 'react';
import { Users, FileStack, ShieldCheck, Activity } from 'lucide-react';
import { useStore } from '../../store/Store.jsx';
import { Badge, Card, CardHeader, StatCard, Btn } from '../../components/ui.jsx';

export default function AdminDashboard({ setPage }) {
  const { state } = useStore();
  const activeUsers = state.users.filter(u => u.status === 'Active').length;
  const allApps = state.lcApplications.length + state.bpApplications.length;
  const approved = [...state.lcApplications, ...state.bpApplications].filter(a => a.status === 'Approved' || a.status === 'Issued').length;
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Active Users" value={String(activeUsers)} sub={`${state.users.length} total accounts`} tone="indigo" />
        <StatCard icon={FileStack} label="Total Applications" value={String(allApps)} sub="LC + Building Permits" tone="teal" />
        <StatCard icon={ShieldCheck} label="Approved / Issued" value={String(approved)} sub="Across all workflows" tone="emerald" />
        <StatCard icon={Activity} label="Audit Events" value={String(state.auditLogs.length)} sub="Tracked actions" tone="amber" />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Quick Administration" />
          <div className="p-5 grid sm:grid-cols-2 gap-2">
            <Btn onClick={()=>setPage('users')}>User & Role Management</Btn>
            <Btn variant="navy" onClick={()=>setPage('zones')}>GIS / Zones & Settings</Btn>
            <Btn variant="ghost" onClick={()=>setPage('reports')}>Reports & Analytics</Btn>
            <Btn variant="ghost" onClick={()=>setPage('zones')}>View Audit Logs</Btn>
          </div>
        </Card>
        <Card>
          <CardHeader title="Recent Audit Log" subtitle="Real-time system activity" />
          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto nice-scroll">
            {state.auditLogs.slice(0, 10).map((a) => (
              <div key={a.id} className="px-5 py-3 text-sm"><div className="font-medium text-slate-800">{a.action}</div><div className="text-xs text-slate-500">{a.actor} · {a.at}</div></div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

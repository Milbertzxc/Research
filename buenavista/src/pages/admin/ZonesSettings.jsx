import React, { useState } from 'react';
import { useStore } from '../../store/Store.jsx';
import { Btn, Card, CardHeader, Field, Toggle, inputCls } from '../../components/ui.jsx';
import ZoneMap from '../../components/ZoneMap.jsx';

export default function ZonesSettings({ actor = 'System Administrator' }) {
  const { state, updateSettings, updateZone, runBackup, audit, toast } = useStore();
  const [zone, setZone] = useState(state.zones[0] || null);
  const [local, setLocal] = useState(state.settings);
  const current = state.zones.find(z => z.id === zone?.id) || zone;

  const saveSettings = () => { updateSettings(local, actor); };
  const rename = () => {
    const name = prompt('Zone display name:', current?.name || '');
    if (name && current) { updateZone(current.id, { name }, actor); setZone(z => ({ ...z, name })); }
  };
  const reclassify = () => {
    if (!current) return;
    const uses = ['Residential','Commercial','Institutional','Fisheries / Tourism','Protected / Easement','Industrial','Agricultural'];
    const next = uses[(uses.indexOf(current.use) + 1) % uses.length];
    updateZone(current.id, { use: next }, actor);
  };

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="GIS / Zone Management" subtitle="Interactive zone map toggles, rename/reclassify" action={<div className="flex gap-2"><Btn variant="ghost" onClick={rename}>Rename Zone</Btn><Btn variant="ghost" onClick={reclassify}>Reclassify</Btn></div>} />
          <div className="p-4">
            <ZoneMap value={current} onPick={setZone} zones={state.zones} height={240} />
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              {state.zones.map((z) => (
                <button key={z.id} onClick={() => setZone(z)} className={`rounded-lg border px-3 py-2 text-left ${current?.id === z.id ? 'border-[#0D9488] bg-teal-50 font-semibold' : 'border-slate-200 hover:bg-slate-50'}`}>
                  {z.name}<div className="font-normal text-slate-500">{z.use}</div><div className="font-normal text-slate-400">{z.lat.toFixed(4)}, {z.lng.toFixed(4)}</div>
                </button>
              ))}
            </div>
          </div>
        </Card>
        <Card>
          <CardHeader title="System Settings" subtitle="Notifications, SMS/email, backup configurations" action={<Btn variant="navy" onClick={saveSettings}>Save Settings</Btn>} />
          <div className="p-5 divide-y divide-slate-100">
            <Toggle label="In-app notifications" checked={!!local.notifications} onChange={(v)=>setLocal(s=>({ ...s, notifications:v }))} />
            <Toggle label="Email notifications (SMTP)" checked={!!local.email} onChange={(v)=>setLocal(s=>({ ...s, email:v }))} />
            <Toggle label="SMS notifications (provider)" checked={!!local.sms} onChange={(v)=>setLocal(s=>({ ...s, sms:v }))} />
            <Toggle label="Automatic nightly backup" checked={!!local.autoBackup} onChange={(v)=>setLocal(s=>({ ...s, autoBackup:v }))} />
            <div className="pt-4 flex gap-2">
              <Btn variant="ghost" onClick={()=>runBackup(actor)}>Run Backup Now</Btn>
              <Btn variant="ghost" onClick={()=>{ audit(actor,'Configuration reviewed'); toast('Configuration state reviewed.'); }}>Review Config</Btn>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Real-time Audit Logs" subtitle={`${state.auditLogs.length} events`} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-slate-500 border-b border-slate-100"><th className="px-5 py-3">Time</th><th className="px-3 py-3">Actor</th><th className="px-3 py-3">Action</th></tr></thead>
            <tbody>
              {state.auditLogs.map((a) => (
                <tr key={a.id} className="border-b border-slate-50"><td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">{a.at}</td><td className="px-3 py-3">{a.actor}</td><td className="px-3 py-3">{a.action}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

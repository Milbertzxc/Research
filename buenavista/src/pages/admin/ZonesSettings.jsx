import React, { useState } from 'react';
import { ZONES } from '../../data/mock.js';
import { Btn, Card, CardHeader, Toggle } from '../../components/ui.jsx';
import ZoneMap from '../../components/ZoneMap.jsx';

export default function ZonesSettings() {
  const [zone, setZone] = useState(ZONES[0]);
  const [zones, setZones] = useState(ZONES);
  const [settings, setSettings] = useState({ email: true, sms: false, notifications: true, autoBackup: true });
  const [msg, setMsg] = useState('');
  const flip = (k) => setSettings((s) => ({ ...s, [k]: !s[k] }));
  const rename = () => {
    const name = prompt('Zone display name:', zone.name);
    if (!name) return;
    setZones((zs) => zs.map((z) => (z.id === zone.id ? { ...z, name } : z)));
    setZone((z) => ({ ...z, name }));
    setMsg(`Zone updated → ${name}`);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-4 max-w-5xl">
      <Card>
        <CardHeader title="GIS / Zone Management" subtitle="Click a zone, then rename or reclassify" action={<Btn variant="ghost" onClick={rename}>Rename Zone</Btn>} />
        <div className="p-4">
          <ZoneMap value={zone} onPick={setZone} height={240} />
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            {zones.map((z) => (
              <button key={z.id} onClick={() => setZone(z)} className={`rounded-lg border px-3 py-2 text-left ${zone.id === z.id ? 'border-[#0D9488] bg-teal-50 font-semibold' : 'border-slate-200'}`}>
                {z.name}<div className="font-normal text-slate-500">{z.use}</div>
              </button>
            ))}
          </div>
          {msg && <div className="mt-3 text-xs bg-teal-50 border border-teal-200 text-teal-800 rounded-lg px-3 py-2">{msg}</div>}
        </div>
      </Card>
      <Card>
        <CardHeader title="System Settings" subtitle="Notifications, messaging & backup" />
        <div className="p-5 divide-y divide-slate-100">
          <Toggle label="In-app notifications" checked={settings.notifications} onChange={() => flip('notifications')} />
          <Toggle label="Email notifications (SMTP)" checked={settings.email} onChange={() => flip('email')} />
          <Toggle label="SMS notifications (provider)" checked={settings.sms} onChange={() => flip('sms')} />
          <Toggle label="Automatic nightly backup" checked={settings.autoBackup} onChange={() => flip('autoBackup')} />
          <div className="pt-4 flex gap-2">
            <Btn variant="navy" onClick={() => setMsg('Settings saved (prototype).')}>Save Settings</Btn>
            <Btn variant="ghost" onClick={() => setMsg('Manual backup started — snapshot queued.')}>Run Backup Now</Btn>
          </div>
        </div>
      </Card>
    </div>
  );
}

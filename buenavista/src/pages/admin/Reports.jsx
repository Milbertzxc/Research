import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { Download } from 'lucide-react';
import { Btn, Card, CardHeader } from '../../components/ui.jsx';

const BY_BARANGAY = [
  { name: 'Poblacion 1', apps: 24 }, { name: 'Poblacion 2', apps: 31 },
  { name: 'Poblacion 3', apps: 12 }, { name: 'Coastal', apps: 18 }, { name: 'Bay Area', apps: 7 },
];
const BY_TYPE = [
  { name: 'Building', apps: 42 }, { name: 'Electrical', apps: 28 },
  { name: 'Plumbing', apps: 19 }, { name: 'Fencing', apps: 11 },
];
const TREND = [
  { m: 'May', apps: 8 }, { m: 'Jun', apps: 12 }, { m: 'Jul', apps: 15 },
  { m: 'Aug', apps: 19 }, { m: 'Sep', apps: 24 }, { m: 'Oct', apps: 14 },
];

export default function Reports() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Btn variant="navy"><Download size={15} /> Export PDF</Btn>
        <Btn variant="ghost"><Download size={15} /> Export Excel</Btn>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Applications by Barangay" />
          <div className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={BY_BARANGAY}><XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} /><Tooltip /><Bar dataKey="apps" fill="#0D9488" radius={[6, 6, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardHeader title="Applications by Permit Type" />
          <div className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={BY_TYPE} layout="vertical"><XAxis type="number" fontSize={11} /><YAxis dataKey="name" type="category" fontSize={11} width={80} /><Tooltip /><Bar dataKey="apps" fill="#1A365D" radius={[0, 6, 6, 0]} /></BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <Card>
        <CardHeader title="Monthly Trend" subtitle="Filings May → Oct 2026" />
        <div className="p-4 h-60">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={TREND}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="m" fontSize={11} /><YAxis fontSize={11} /><Tooltip /><Line type="monotone" dataKey="apps" stroke="#0D9488" strokeWidth={3} dot /></LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

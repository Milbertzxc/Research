import React from 'react';
import { MapPin } from 'lucide-react';
import { ZONES } from '../data/mock.js';

// Prototype GIS canvas: clickable SVG zones (Poblacion 1–3, Coastal, Bay).
// Selecting a zone auto-fills [lat]/[long] for the parent form.
export default function ZoneMap({ value, onPick, height = 300 }) {
  const shapes = {
    pob1: '20,40 150,30 160,140 30,150',
    pob2: '160,30 300,40 290,150 160,140',
    pob3: '30,160 160,150 170,270 40,270',
    coastal: '170,150 290,150 300,270 170,270',
    bay: '310,60 470,60 470,270 310,270',
  };
  return (
    <div>
      <svg viewBox="0 0 500 300" className="w-full rounded-lg border border-slate-200 bg-slate-50" style={{ height }}>
        {ZONES.map((z) => (
          <g key={z.id} onClick={() => onPick(z)} className="cursor-pointer">
            <polygon
              points={shapes[z.id]}
              fill={value?.id === z.id ? z.color : `${z.color}55`}
              stroke={value?.id === z.id ? '#1A365D' : '#ffffff'}
              strokeWidth={value?.id === z.id ? 3 : 2}
            />
            <text x={shapes[z.id].split(' ')[0].split(',')[0]} y={Number(shapes[z.id].split(' ')[0].split(',')[1]) + 20} fontSize="11" fontWeight="700" fill="#1A365D">
              {z.name}
            </text>
          </g>
        ))}
      </svg>
      <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
        <MapPin size={14} className="text-[#0D9488]" />
        {value ? (
          <span>
            Pinned: <b>{value.name}</b> — [{value.lat.toFixed(4)}], [{value.lng.toFixed(4)}] · {value.use}
          </span>
        ) : (
          <span>Click a zone to pin the project location and auto-fill coordinates.</span>
        )}
      </div>
    </div>
  );
}

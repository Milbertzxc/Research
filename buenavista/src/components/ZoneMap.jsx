import React, { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

// Real Leaflet.js interactive map — Buenavista, Agusan del Norte
// Tiles: OpenStreetMap | Click-to-pin lat/lng | Barangay zone overlay

const BUENAVISTA_CENTER = [8.9772, 125.4085];
const BUENAVISTA_ZOOM = 13;

// Barangay zone polygons for Buenavista (approximate boundaries for overlay)
const BARANGAY_ZONES = [
  { id: 'pob1',    name: 'Poblacion 1',              use: 'Commercial',          color: '#0D9488', center: [8.9772, 125.4085] },
  { id: 'pob2',    name: 'Poblacion 2',              use: 'Residential',         color: '#10B981', center: [8.9785, 125.4110] },
  { id: 'pob3',    name: 'Poblacion 3',              use: 'Institutional',       color: '#6366F1', center: [8.9750, 125.4060] },
  { id: 'matabao', name: 'Brgy. Matabao',            use: 'Residential',         color: '#F59E0B', center: [8.9700, 125.3980] },
  { id: 'lumbocan',name: 'Brgy. Lumbocan',           use: 'Agricultural',        color: '#84CC16', center: [8.9850, 125.4200] },
  { id: 'coastal', name: 'Coastal Easement Zone',    use: 'Protected / Easement',color: '#0EA5E9', center: [8.9900, 125.4000] },
];

export default function ZoneMap({ value, onPick, height = 380 }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const [pinned, setPinned] = useState(value || null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Dynamically import leaflet to avoid SSR issues
    let L;
    let map;

    const initMap = async () => {
      try {
        L = (await import('leaflet')).default;

        // Fix default icon paths broken by Vite bundling
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        if (!mapRef.current || leafletMapRef.current) return;

        // Create map centered on Buenavista
        map = L.map(mapRef.current, {
          center: BUENAVISTA_CENTER,
          zoom: BUENAVISTA_ZOOM,
          zoomControl: true,
          attributionControl: true,
        });

        leafletMapRef.current = map;

        // OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        // Add barangay zone circle markers
        BARANGAY_ZONES.forEach((zone) => {
          L.circle(zone.center, {
            color: zone.color,
            fillColor: zone.color,
            fillOpacity: 0.15,
            radius: 300,
            weight: 2,
          })
            .addTo(map)
            .bindPopup(
              `<b>${zone.name}</b><br/>Land Use: ${zone.use}<br/><small>Click anywhere on the map to pin your project location.</small>`
            );

          // Zone label marker
          L.marker(zone.center, {
            icon: L.divIcon({
              className: '',
              html: `<div style="background:${zone.color};color:#fff;padding:2px 7px;border-radius:999px;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.3)">${zone.name}</div>`,
              iconAnchor: [40, 10],
            }),
            interactive: false,
          }).addTo(map);
        });

        // Custom teal pin icon
        const pinIcon = L.divIcon({
          className: '',
          html: `<div style="width:28px;height:28px;background:#0D9488;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 28],
        });

        // Restore previous pin if value passed in
        if (value?.lat && value?.lng) {
          markerRef.current = L.marker([value.lat, value.lng], { icon: pinIcon, draggable: true }).addTo(map);
          markerRef.current.bindPopup(`<b>Project Location</b><br/>Lat: ${value.lat.toFixed(5)}<br/>Lng: ${value.lng.toFixed(5)}`).openPopup();
          markerRef.current.on('dragend', (e) => {
            const pos = e.target.getLatLng();
            const nearest = findNearestZone(pos.lat, pos.lng);
            const loc = { lat: pos.lat, lng: pos.lng, name: nearest.name, use: nearest.use, id: nearest.id, color: nearest.color };
            setPinned(loc);
            onPick?.(loc);
          });
        }

        // Click to pin project location
        map.on('click', (e) => {
          const { lat, lng } = e.latlng;

          // Remove old marker
          if (markerRef.current) {
            markerRef.current.remove();
          }

          // Nearest zone detection
          const nearest = findNearestZone(lat, lng);

          // Add new marker
          markerRef.current = L.marker([lat, lng], { icon: pinIcon, draggable: true }).addTo(map);
          markerRef.current
            .bindPopup(
              `<b>Project Location Pinned</b><br/>` +
              `Zone: <b>${nearest.name}</b><br/>` +
              `Land Use: ${nearest.use}<br/>` +
              `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`
            )
            .openPopup();

          markerRef.current.on('dragend', (ev) => {
            const pos = ev.target.getLatLng();
            const nz = findNearestZone(pos.lat, pos.lng);
            const loc = { lat: pos.lat, lng: pos.lng, name: nz.name, use: nz.use, id: nz.id, color: nz.color };
            setPinned(loc);
            onPick?.(loc);
          });

          const loc = { lat, lng, name: nearest.name, use: nearest.use, id: nearest.id, color: nearest.color };
          setPinned(loc);
          onPick?.(loc);
        });

      } catch (err) {
        console.error('Leaflet init error:', err);
        setError('Map could not be loaded. Please check your connection.');
      }
    };

    initMap();

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []); // only once

  // Sync external value changes (e.g. reset form)
  useEffect(() => {
    if (!value) {
      setPinned(null);
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    }
  }, [value]);

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />

      {error ? (
        <div className="flex items-center justify-center bg-slate-100 text-slate-500 text-sm" style={{ height }}>
          ⚠️ {error}
        </div>
      ) : (
        <div ref={mapRef} style={{ height, width: '100%' }} />
      )}

      {/* Status bar */}
      <div className="bg-slate-50 border-t border-slate-200 px-3 py-2 flex items-center gap-2 text-xs text-slate-600">
        <MapPin size={14} className={pinned ? 'text-[#0D9488]' : 'text-slate-400'} />
        {pinned ? (
          <span>
            📍 Pinned: <b>{pinned.name}</b> — Lat: <b>{Number(pinned.lat).toFixed(5)}</b>, Lng: <b>{Number(pinned.lng).toFixed(5)}</b>
            {pinned.use && <span className="ml-2 text-slate-400">· {pinned.use}</span>}
            <span className="ml-2 text-teal-600 font-medium">✓ Location saved</span>
          </span>
        ) : (
          <span className="text-slate-400">Click anywhere on the map to pin your project location. You can drag the pin to adjust.</span>
        )}
      </div>

      {/* Legend */}
      <div className="bg-white border-t border-slate-100 px-3 py-2">
        <div className="text-[11px] text-slate-400 font-medium mb-1">ZONE LEGEND (sample — not official)</div>
        <div className="flex flex-wrap gap-2">
          {BARANGAY_ZONES.map((z) => (
            <div key={z.id} className="flex items-center gap-1 text-[11px] text-slate-600">
              <div className="w-3 h-3 rounded-full border border-white shadow-sm" style={{ background: z.color }} />
              {z.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Find nearest barangay zone by Euclidean distance to center
function findNearestZone(lat, lng) {
  let nearest = BARANGAY_ZONES[0];
  let minDist = Infinity;
  BARANGAY_ZONES.forEach((z) => {
    const d = Math.hypot(lat - z.center[0], lng - z.center[1]);
    if (d < minDist) { minDist = d; nearest = z; }
  });
  return nearest;
}

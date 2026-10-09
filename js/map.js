/* ============================================================
   MPDO — GIS / Leaflet Map Module
   ============================================================ */

const MapModule = (() => {

  let mapInstances = {};

  /* ── Status Marker Colors ──────────────────────────────── */
  const STATUS_COLORS = {
    'Draft':                   '#64748b',
    'Submitted':               '#3b82f6',
    'Initial Validation':      '#f59e0b',
    'Document Review':         '#f59e0b',
    'Location Review':         '#06b6d4',
    'MPDO Review':             '#8b5cf6',
    'Additional Requirements': '#ef4444',
    'For Approval':            '#06b6d4',
    'Approved':                '#10b981',
    'Returned':                '#ef4444',
    'Completed':               '#10b981',
  };

  const PROJECT_TYPE_ICONS = {
    'Residential': '<i data-lucide="home" style="width:18px;height:18px;"></i>', 
    'Commercial': '<i data-lucide="building" style="width:18px;height:18px;"></i>', 
    'Industrial': '<i data-lucide="factory" style="width:18px;height:18px;"></i>',
    'Institutional': '<i data-lucide="landmark" style="width:18px;height:18px;"></i>', 
    'Accessory': '<i data-lucide="car" style="width:18px;height:18px;"></i>', 
    'Mixed-use': '<i data-lucide="building-2" style="width:18px;height:18px;"></i>'
  };

  /* ── Create SVG Marker ────────────────────────────────── */
  function createMarkerIcon(status, label = '') {
    const color = STATUS_COLORS[status] || '#3b82f6';
    const svg   = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
      <filter id="shadow"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.4"/></filter>
      <path d="M16 0C7.16 0 0 7.16 0 16c0 11.5 16 26 16 26S32 27.5 32 16C32 7.16 24.84 0 16 0z"
        fill="${color}" filter="url(#shadow)"/>
      <circle cx="16" cy="16" r="7" fill="white" opacity="0.95"/>
    </svg>`;
    return L.divIcon({
      html: `<div style="position:relative;">${svg}</div>`,
      className: 'custom-marker',
      iconSize:  [32, 42],
      iconAnchor:[16, 42],
      popupAnchor:[0, -42]
    });
  }

  /* ── Init Main Map ─────────────────────────────────────── */
  function initMap(containerId, options = {}) {
    if (mapInstances[containerId]) {
      mapInstances[containerId].invalidateSize();
      return mapInstances[containerId];
    }

    const settings = {
      centerLat:  DB.getSetting('mapCenterLat', 13.92),
      centerLng:  DB.getSetting('mapCenterLng', 121.09),
      zoom:       DB.getSetting('mapDefaultZoom', 13),
      ...options
    };

    const map = L.map(containerId, {
      center:       [settings.centerLat, settings.centerLng],
      zoom:         settings.zoom,
      zoomControl:  true,
      attributionControl: true
    });

    // Base layers
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    });

    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '© <a href="https://www.esri.com">Esri</a>, DigitalGlobe, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
      maxZoom: 19
    });

    osmLayer.addTo(map);

    const baseLayers = {
      '<i data-lucide="map" style="width:14px;height:14px;vertical-align:middle"></i> Street Map': osmLayer,
      '<i data-lucide="satellite" style="width:14px;height:14px;vertical-align:middle"></i> Satellite': satelliteLayer
    };

    // Municipal boundary overlay
    const boundaryLayer = createBoundaryLayer();
    if (boundaryLayer) {
      const overlays = { '<i data-lucide="building" style="width:14px;height:14px;vertical-align:middle"></i> Municipal Boundary': boundaryLayer };
      L.control.layers(baseLayers, overlays, { position: 'topright' }).addTo(map);
      boundaryLayer.addTo(map);
    } else {
      L.control.layers(baseLayers, {}, { position: 'topright' }).addTo(map);
    }

    // Scale control
    L.control.scale({ metric: true, imperial: false }).addTo(map);

    // Legend
    addLegend(map);

    // Initialize lucide icons in popups when they open
    map.on('popupopen', () => {
      if (typeof lucide !== 'undefined') lucide.createIcons();
    });

    mapInstances[containerId] = map;
    return map;
  }

  function createBoundaryLayer() {
    try {
      // Simple polygon boundary — matches boundary.geojson
      const coords = [
        [13.85, 121.03],[13.83, 121.08],[13.84, 121.14],[13.87, 121.18],
        [13.91, 121.20],[13.96, 121.19],[14.00, 121.16],[14.02, 121.11],
        [14.01, 121.06],[13.98, 121.02],[13.94, 121.00],[13.90, 121.00],
        [13.85, 121.03]
      ];
      return L.polygon(coords, {
        color: '#3b82f6', weight: 2, fillColor: '#3b82f6', fillOpacity: 0.05,
        dashArray: '8 4'
      }).bindTooltip('<i data-lucide="alert-triangle" style="width:12px;height:12px;vertical-align:middle;"></i> Sample Municipal Boundary (Reference Only — Not Official)', {
        permanent: false, className: 'boundary-tooltip'
      });
    } catch { return null; }
  }

  function addLegend(map) {
    const legend = L.control({ position: 'bottomleft' });
    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'map-legend');
      div.style.cssText = `
        background:rgba(7,12,26,0.9);border:1px solid rgba(255,255,255,0.1);
        border-radius:8px;padding:10px 14px;color:#e2e8f0;font-size:12px;
        backdrop-filter:blur(8px);min-width:160px;
      `;
      div.innerHTML = `
        <div style="font-weight:600;margin-bottom:8px;font-size:11px;text-transform:uppercase;color:#94a3b8;letter-spacing:.05em">Application Status</div>
        ${Object.entries(STATUS_COLORS).slice(0,8).map(([status, color]) => `
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
            <div style="width:12px;height:12px;border-radius:50%;background:${color};flex-shrink:0"></div>
            <span style="font-size:11px;color:#94a3b8">${status}</span>
          </div>`).join('')}
        <div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.08);font-size:10px;color:#64748b;display:flex;align-items:center;gap:4px;">
          <i data-lucide="map-pin" style="width:10px;height:10px;"></i> Boundary: Reference Only
        </div>`;
      return div;
    };
    legend.addTo(map);
  }

  /* ── Load All Application Markers ─────────────────────── */
  function loadApplicationMarkers(mapId, applications, options = {}) {
    const map = mapInstances[mapId];
    if (!map) return;

    // Clear existing markers
    map.eachLayer(layer => {
      if (layer._mpdo_marker) map.removeLayer(layer);
    });

    let hasMarkers = false;
    applications.forEach(app => {
      if (!app.latitude || !app.longitude) return;
      const marker = addApplicationMarker(mapId, app);
      if (marker) hasMarkers = true;
    });

    if (hasMarkers && !options.noFit) {
      const validApps = applications.filter(a => a.latitude && a.longitude);
      if (validApps.length === 1) {
        map.setView([validApps[0].latitude, validApps[0].longitude], 15);
      }
    }
  }

  function addApplicationMarker(mapId, app) {
    const map = mapInstances[mapId];
    if (!map || !app.latitude || !app.longitude) return null;

    const icon    = createMarkerIcon(app.status);
    const marker  = L.marker([app.latitude, app.longitude], { icon });
    marker._mpdo_marker = true;

    const applicant = DB.getUserById(app.applicantId);
    const typeIcon  = PROJECT_TYPE_ICONS[app.projectType] || '<i data-lucide="box" style="width:18px;height:18px;"></i>';

    marker.bindPopup(`
      <div style="font-family:'Inter',sans-serif;min-width:240px;max-width:300px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
          <span style="font-size:1.4rem">${typeIcon}</span>
          <div>
            <div style="font-weight:700;font-size:14px;color:#1e293b">${Utils.sanitize(app.projectName)}</div>
            <div style="font-size:11px;font-family:'JetBrains Mono',monospace;color:#64748b">${app.applicationNumber}</div>
          </div>
        </div>
        <table style="width:100%;font-size:12px;border-collapse:collapse;">
          <tr><td style="color:#64748b;padding:2px 0">Status</td><td><span style="background:${STATUS_COLORS[app.status]}22;color:${STATUS_COLORS[app.status]};padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600">${app.status}</span></td></tr>
          <tr><td style="color:#64748b;padding:2px 0">Type</td><td style="color:#1e293b">${Utils.sanitize(app.projectType)}</td></tr>
          <tr><td style="color:#64748b;padding:2px 0">Barangay</td><td style="color:#1e293b">${Utils.sanitize(app.barangay)}</td></tr>
          <tr><td style="color:#64748b;padding:2px 0">Cost</td><td style="color:#1e293b">${Utils.formatCurrency(app.estimatedCost)}</td></tr>
          <tr><td style="color:#64748b;padding:2px 0">Applicant</td><td style="color:#1e293b">${Utils.sanitize(applicant?.fullName||'—')}</td></tr>
          <tr><td style="color:#64748b;padding:2px 0">Submitted</td><td style="color:#1e293b">${Utils.formatDate(app.submittedAt)}</td></tr>
        </table>
        ${app.locationFlags && app.locationFlags.length ? `<div style="margin-top:8px;padding:6px;background:#fef3c7;border-radius:6px;font-size:11px;color:#92400e;display:flex;align-items:center;gap:4px;"><i data-lucide="alert-triangle" style="width:12px;height:12px;"></i> Location flag: ${Utils.sanitize(app.locationFlags[0])}</div>` : ''}
        <div style="margin-top:10px;text-align:center">
          <a href="#" onclick="App.navigate('review-${app.id}');return false;" style="display:inline-block;padding:6px 16px;background:#3b82f6;color:#fff;border-radius:6px;font-size:12px;font-weight:600;text-decoration:none">View Application</a>
        </div>
      </div>`, { maxWidth: 320 });

    marker.addTo(map);
    return marker;
  }

  /* ── Pin Drop for Application Form ────────────────────── */
  function initPinDropMap(containerId, options = {}) {
    const map = initMap(containerId, {
      centerLat: options.lat || DB.getSetting('mapCenterLat', 13.92),
      centerLng: options.lng || DB.getSetting('mapCenterLng', 121.09),
      zoom: options.zoom || 14
    });

    let pinMarker = null;
    let confirmCallback = options.onConfirm || null;

    // If initial coords provided
    if (options.lat && options.lng) {
      placePin(options.lat, options.lng);
      map.setView([options.lat, options.lng], 16);
    }

    // Click to place pin
    map.on('click', e => {
      const { lat, lng } = e.latlng;
      placePin(lat, lng);
    });

    function placePin(lat, lng) {
      const pinIcon = L.divIcon({
        html: `<div style="
          width:36px;height:36px;border-radius:50% 50% 50% 0;
          background:linear-gradient(135deg,#3b82f6,#8b5cf6);
          transform:rotate(-45deg);
          box-shadow:0 4px 12px rgba(59,130,246,0.5);
          border:3px solid white;
        "></div>`,
        className: '',
        iconSize:  [36, 36],
        iconAnchor:[18, 36],
        popupAnchor:[0,-36]
      });

      if (pinMarker) {
        pinMarker.setLatLng([lat, lng]);
      } else {
        pinMarker = L.marker([lat, lng], { icon: pinIcon, draggable: true });
        pinMarker.addTo(map);
        pinMarker.on('dragend', e => {
          const pos = e.target.getLatLng();
          updateCoordFields(pos.lat, pos.lng);
        });
      }

      updateCoordFields(lat, lng);
      validateLocation(lat, lng);
    }

    function updateCoordFields(lat, lng) {
      const latEl = document.getElementById('field-latitude');
      const lngEl = document.getElementById('field-longitude');
      if (latEl) latEl.value = lat.toFixed(7);
      if (lngEl) lngEl.value = lng.toFixed(7);
      if (confirmCallback) confirmCallback(lat, lng);
    }

    function validateLocation(lat, lng) {
      const msgEl = document.getElementById('location-validation-msg');
      if (!msgEl) return;

      if (!Utils.validateCoordinates(lat, lng)) {
        msgEl.innerHTML = `<div class="alert alert-danger"><div class="alert-icon"><i data-lucide="x-circle" style="width:16px;height:16px;"></i></div><div class="alert-content">Coordinates appear to be outside the Philippine geographic boundary. Please verify.</div></div>`;
        return;
      }

      // Check if within rough municipal bounds (from boundary.geojson polygon)
      const inMunicipality = isInMunicipalArea(lat, lng);
      if (!inMunicipality) {
        msgEl.innerHTML = `<div class="alert alert-warning"><div class="alert-icon"><i data-lucide="alert-triangle" style="width:16px;height:16px;"></i></div><div class="alert-content">Location may be outside the municipal boundary. An MPDO flag will be added for review. You may still proceed.</div></div>`;
      } else {
        msgEl.innerHTML = `<div class="alert alert-success"><div class="alert-icon"><i data-lucide="check-circle" style="width:16px;height:16px;"></i></div><div class="alert-content">Location is within the municipal area. Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}</div></div>`;
      }
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // Geocoding search
    const searchEl = document.getElementById('map-search');
    if (searchEl) {
      searchEl.addEventListener('keydown', async e => {
        if (e.key !== 'Enter') return;
        const q = searchEl.value.trim();
        if (!q) return;
        searchEl.disabled = true;
        searchEl.value = 'Searching…';
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q+', Batangas, Philippines')}&format=json&limit=1`);
          const data = await res.json();
          if (data.length) {
            const { lat, lon } = data[0];
            map.setView([parseFloat(lat), parseFloat(lon)], 16);
            placePin(parseFloat(lat), parseFloat(lon));
            searchEl.value = data[0].display_name;
          } else {
            Utils.toast('Location not found. Try a more specific address.', 'warning');
            searchEl.value = '';
          }
        } catch {
          Utils.toast('Search failed. Please check your connection.', 'error');
          searchEl.value = '';
        }
        searchEl.disabled = false;
      });
    }

    return { map, placePin };
  }

  /* ── Coordinate Validation ─────────────────────────────── */
  function isInMunicipalArea(lat, lng) {
    // Simple bounding box check for the sample municipality
    return lat >= 13.83 && lat <= 14.03 && lng >= 120.99 && lng <= 121.21;
  }

  function invalidateSize(mapId) {
    const map = mapInstances[mapId];
    if (map) setTimeout(() => map.invalidateSize(), 100);
  }

  function destroyMap(mapId) {
    const map = mapInstances[mapId];
    if (map) { map.remove(); delete mapInstances[mapId]; }
  }

  /* ── Analytics Overlay ─────────────────────────────────── */
  function addHeatmapStyle(mapId, applications) {
    // Color-code by barangay density using circle overlays
    const map = mapInstances[mapId];
    if (!map) return;

    const byBarangay = {};
    applications.forEach(a => {
      if (!a.barangay) return;
      byBarangay[a.barangay] = (byBarangay[a.barangay] || 0) + 1;
    });

    const barangays = DB.findAll('barangays');
    barangays.forEach(b => {
      const count = byBarangay[b.name] || 0;
      if (!count) return;
      L.circle([b.lat, b.lng], {
        radius:      count * 400,
        color:       'none',
        fillColor:   '#3b82f6',
        fillOpacity: Math.min(0.4, 0.1 + count * 0.05)
      }).bindTooltip(`${b.name}: ${count} application${count > 1 ? 's' : ''}`).addTo(map);
    });
  }

  return {
    initMap, initPinDropMap, loadApplicationMarkers,
    addApplicationMarker, addHeatmapStyle,
    invalidateSize, destroyMap, isInMunicipalArea,
    STATUS_COLORS, PROJECT_TYPE_ICONS
  };
})();

window.MapModule = MapModule;

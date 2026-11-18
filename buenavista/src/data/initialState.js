// Central initial state for the Buenavista MPDO/OBO portal (local React state; persisted to localStorage).
export const uid = (p = 'ID') => `${p}-${Math.random().toString(36).slice(2, 7).toUpperCase()}${Date.now().toString(36).slice(-4).toUpperCase()}`;
export const now = () => new Date().toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });
export const today = () => new Date().toISOString().slice(0, 10);
export const peso = (n) => `₱${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const ROLES = [
  { id: 'applicant', label: 'Applicant', desc: 'Apply & track locational clearance and building permits' },
  { id: 'mpdo', label: 'MPDO Personnel', desc: 'Zoning verification & clearance review' },
  { id: 'zoning', label: 'Zoning Inspector', desc: 'Site inspections, land-use conformity & zoning reports' },
  { id: 'inspector', label: 'Building Inspector', desc: 'Technical site inspections, structural & safety reports' },
  { id: 'official', label: 'Building Official', desc: 'Technical review, fees & permit issuance' },
  { id: 'admin', label: 'System Administrator', desc: 'Users, zones, settings & analytics' },
];

export const DEMO_USERS = {
  applicant: { name: 'Juan Dela Cruz', email: 'applicant@buenavista.gov.ph', role: 'applicant' },
  mpdo: { name: 'Maria Santos', email: 'mpdo@buenavista.gov.ph', role: 'mpdo' },
  zoning: { name: 'Zoning Inspector Officer', email: 'zoning@buenavista.gov.ph', role: 'zoning' },
  inspector: { name: 'Pedro Villanueva', email: 'inspector@buenavista.gov.ph', role: 'inspector' },
  official: { name: 'Engr. Jose Reyes', email: 'official@buenavista.gov.ph', role: 'official' },
  admin: { name: 'Ana Admin', email: 'admin@buenavista.gov.ph', role: 'admin' },
};

export const ZONES = [
  { id: 'pob1', name: 'Poblacion 1', use: 'Commercial', lat: 8.9772, lng: 125.4085, color: '#0D9488' },
  { id: 'pob2', name: 'Poblacion 2', use: 'Residential', lat: 8.9785, lng: 125.4110, color: '#10B981' },
  { id: 'pob3', name: 'Poblacion 3', use: 'Institutional', lat: 8.9750, lng: 125.4060, color: '#6366F1' },
  { id: 'coastal', name: 'Brgy. Matabao (Coastal)', use: 'Fisheries / Tourism', lat: 8.8800, lng: 125.3750, color: '#0EA5E9' },
  { id: 'bay', name: 'Butuan Bay Coastal Easement', use: 'Protected / Easement', lat: 8.9900, lng: 125.4000, color: '#F59E0B' },
];

export const LC_DOCS = [
  { name: 'Tax Declaration', file: 'tax-declaration.pdf' },
  { name: 'Barangay Certificate', file: 'barangay-certificate.pdf' },
  { name: 'Fire Safety Certificate', file: 'req-bp-fire.pdf' },
  { name: 'ANECO Clearance', file: 'aneco-clearance.pdf' },
  { name: 'Proof of Ownership', file: 'proof-of-ownership.pdf' },
  { name: 'Geotagged Photos', file: 'geotagged-photos.jpg' },
  { name: 'Building Plans', file: 'building-plans.pdf' },
  { name: 'Sketch / Vicinity Map', file: 'vicinity-map.pdf' },
];

export const BP_SUBFORMS = ['Unified Form', 'Electrical', 'Plumbing', 'Excavation', 'Civil/Structural', 'Architectural', 'Fencing', 'Electronics', 'Mechanical', 'Demolition'];

export const FEE_ITEMS = [
  { item: 'Filing Fee', amount: 500 },
  { item: 'Locational Clearance Fee', amount: 720 },
  { item: 'Zoning Verification', amount: 350 },
  { item: 'Documentary Stamp', amount: 302 },
  { item: 'Inspection Fee', amount: 500 },
];
export const FEE_TOTAL = FEE_ITEMS.reduce((s, f) => s + f.amount, 0);

export const DIVISIONS = ['Line and Grade', 'Architectural', 'Structural', 'Electrical', 'Plumbing'];

const mkDocs = (names, preUploaded = []) => names.map((n) => {
  const name = typeof n === 'string' ? n : n.name;
  const file = typeof n === 'string' ? `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf` : n.file;
  const up = preUploaded.includes(name);
  return { name, file, status: up ? 'Uploaded' : 'Missing', uploadedAt: up ? now() : null };
});

export function buildInitialState() {
  return {
    toasts: [],
    notifCount: 2,
    notifications: [
      { id: uid('N'), text: 'BP-2026-0455 returned for revision — update Electrical sub-form.', read: false, at: now() },
      { id: uid('N'), text: 'Inspection INSP-301 scheduled for Oct 14, 2026 09:00 AM.', read: false, at: now() },
    ],
    users: [
      { id: 1, name: 'Maria Santos', email: 'mpdo@buenavista.gov.ph', role: 'MPDO Personnel', status: 'Active' },
      { id: 2, name: 'Engr. Jose Reyes', email: 'official@buenavista.gov.ph', role: 'Building Official', status: 'Active' },
      { id: 3, name: 'Pedro Villanueva', email: 'inspector@buenavista.gov.ph', role: 'Inspector', status: 'Active' },
      { id: 4, name: 'Juan Dela Cruz', email: 'applicant@buenavista.gov.ph', role: 'Applicant', status: 'Active' },
      { id: 5, name: 'Ramon Aquino', email: 'ramon@example.com', role: 'Applicant', status: 'Deactivated' },
    ],
    zones: JSON.parse(JSON.stringify(ZONES)),
    settings: { notifications: true, sms: false, email: true, autoBackup: true },
    auditLogs: [
      { id: uid('A'), actor: 'M. Santos (MPDO)', action: 'Approved locational clearance LC-2026-0098', at: '10 min ago' },
      { id: uid('A'), actor: 'System', action: 'Nightly backup completed (142 MB)', at: '2 hrs ago' },
      { id: uid('A'), actor: 'J. Reyes (Official)', action: 'Recorded payment OR #04217 — ₱2,372.00', at: '5 hrs ago' },
      { id: uid('A'), actor: 'P. Villanueva (Inspector)', action: 'Submitted inspection INSP-299 — PASSED', at: 'Yesterday' },
    ],
    lcApplications: [
      { id: 'LC-2026-0101', applicant: 'Juan Dela Cruz', applicantEmail: 'applicant@buenavista.gov.ph', project: 'Dela Cruz Residence', classification: 'Standard Project', barangay: 'Poblacion 2', landUse: 'Residential', zoneId: 'pob2', lat: 8.9785, lng: 125.4110, zoning: 'Compliant', status: 'Under Review', updated: 'Oct 12, 2026', progress: 60,
        docs: mkDocs(LC_DOCS, ['Tax Declaration','Barangay Certificate','Proof of Ownership','Geotagged Photos']),
        timeline: [{ title: 'Submitted', sub: 'Oct 01, 2026 · received', done: true }, { title: 'Document Review', sub: 'Oct 05, 2026', done: true }, { title: 'GIS/Zoning Verification', sub: 'In progress', current: true }, { title: 'Approved', sub: 'Pending' }],
        remarks: '', payment: { status: 'Pending', or: '', amount: FEE_TOTAL } },
      { id: 'LC-2026-0098', applicant: 'Juan Dela Cruz', applicantEmail: 'applicant@buenavista.gov.ph', project: 'Coastal Fish Port Shed', classification: 'Special Project', barangay: 'Brgy. Matabao (Coastal)', landUse: 'Fisheries / Tourism', zoneId: 'coastal', lat: 8.8800, lng: 125.3750, zoning: 'Compliant', status: 'Approved', updated: 'Oct 08, 2026', progress: 100,
        docs: mkDocs(LC_DOCS, LC_DOCS.map(d=>d.name)),
        timeline: [{ title: 'Submitted', sub: 'Sep 20, 2026', done: true }, { title: 'Document Review', sub: 'Sep 25, 2026', done: true }, { title: 'GIS/Zoning Verification', sub: 'Oct 02, 2026', done: true }, { title: 'Approved', sub: 'Oct 08, 2026 · clearance issued', done: true }],
        remarks: 'All requirements satisfied.', payment: { status: 'Paid', or: 'OR-04190', amount: FEE_TOTAL } },
      { id: 'LC-2026-0104', applicant: 'Ligaya Fernandez', applicantEmail: 'ligaya@example.com', project: 'Bakery & Store', classification: 'Standard Project', barangay: 'Poblacion 1', landUse: 'Commercial', zoneId: 'pob1', lat: 8.9772, lng: 125.4085, zoning: 'Non-Compliant', status: 'Pending', updated: 'Oct 11, 2026', progress: 30,
        docs: mkDocs(LC_DOCS, ['Tax Declaration']),
        timeline: [{ title: 'Submitted', sub: 'Oct 11, 2026', done: true }, { title: 'Document Review', sub: 'Pending', current: true }],
        remarks: '', payment: { status: 'Pending', or: '', amount: FEE_TOTAL } },
      { id: 'LC-2026-0109', applicant: 'Coastal Coop', applicantEmail: 'coop@example.com', project: 'Cold Storage', classification: 'Special Project', barangay: 'Bay Area', landUse: 'Industrial', zoneId: 'bay', lat: 8.9900, lng: 125.4000, zoning: 'Non-Compliant', status: 'Revision Required', updated: 'Oct 09, 2026', progress: 45,
        docs: mkDocs(LC_DOCS, ['Tax Declaration','Barangay Certificate','Proof of Ownership']),
        timeline: [{ title: 'Submitted', sub: 'Oct 01, 2026', done: true }, { title: 'Document Review', sub: 'Returned for revision', current: true }],
        remarks: 'Zoning conflict with Bay Area easement overlay.', payment: { status: 'Pending', or: '', amount: FEE_TOTAL } },
    ],
    bpApplications: [
      { id: 'BP-2026-0455', applicant: 'Juan Dela Cruz', applicantEmail: 'applicant@buenavista.gov.ph', project: 'Dela Cruz Sari-Sari Store', projectType: '2-storey residential/commercial', barangay: 'Poblacion 1', lcRef: 'LC-2026-0098', status: 'Revision Required', scope: 'New Construction — Commercial', updated: 'Oct 10, 2026', progress: 40,
        subforms: Object.fromEntries(BP_SUBFORMS.map(f => [f, { status: ['Unified Form','Architectural'].includes(f)?'Completed':'Electrical'===f?'Returned':'Pending', note: f==='Electrical'?'Load computation mismatch':'' }])),
        docs: mkDocs(LC_DOCS, ['Tax Declaration','Barangay Certificate','Fire Safety Certificate']),
        divisions: { 'Line and Grade': { status: 'Completed', at: 'Oct 10, 2026 09:15' }, Architectural: { status: 'Completed', at: 'Oct 10, 2026 11:40' }, Structural: { status: 'In Progress', at: 'Oct 11, 2026 08:30' }, Electrical: { status: 'Queued', at: '' }, Plumbing: { status: 'Queued', at: '' } },
        timeline: [{ title: 'Submitted', sub: 'Oct 01, 2026', done: true }, { title: 'Document Review', sub: 'Oct 05, 2026', done: true }, { title: 'Building Official Review', sub: 'Oct 10, 2026', done: true }, { title: 'Revision Required', sub: 'Electrical sub-form returned', current: true }, { title: 'Inspection', sub: 'Pending' }, { title: 'Final Approval / Issuance', sub: 'Pending' }],
        payment: { status: 'Pending', or: '', amount: FEE_TOTAL }, issued: false, permitNo: null, remarks: 'Correct Electrical load computation and resubmit.' },
      { id: 'BP-2026-0448', applicant: 'Ramon Aquino', applicantEmail: 'ramon@example.com', project: 'Aquino Storage', projectType: 'Standard', barangay: 'Brgy. Coastal', lcRef: 'LC-2026-0098', status: 'Approved', scope: 'Addition — Storage', updated: 'Oct 11, 2026', progress: 90,
        subforms: Object.fromEntries(BP_SUBFORMS.map(f => [f, { status: 'Completed', note: '' }])),
        docs: mkDocs(LC_DOCS, LC_DOCS.map(d=>d.name)),
        divisions: Object.fromEntries(DIVISIONS.map(d => [d, { status: 'Completed', at: 'Oct 11, 2026 10:00' }])),
        timeline: [{ title: 'Submitted', sub: 'Sep 28, 2026', done: true }, { title: 'Document Review', sub: 'Oct 02, 2026', done: true }, { title: 'Inspection', sub: 'Oct 11, 2026 · Passed', done: true }, { title: 'Final Approval', sub: 'Ready for issuance', current: true }],
        payment: { status: 'Paid', or: 'OR-04217', amount: FEE_TOTAL }, issued: false, permitNo: null, remarks: '' },
      { id: 'BP-2026-0451', applicant: 'Ligaya Fernandez', applicantEmail: 'ligaya@example.com', project: 'Fernandez Bakery', projectType: '2-storey commercial', barangay: 'Poblacion 1', lcRef: 'LC-2026-0098', status: 'Under Review', scope: 'Renovation — Food Establishment', updated: 'Oct 12, 2026', progress: 55,
        subforms: Object.fromEntries(BP_SUBFORMS.map(f => [f, { status: ['Unified Form','Plumbing','Architectural'].includes(f)?'Completed':'Pending', note: '' }])),
        docs: mkDocs(LC_DOCS, ['Tax Declaration','Barangay Certificate','Fire Safety Certificate','Proof of Ownership']),
        divisions: { 'Line and Grade': { status: 'Completed', at: 'Oct 12, 2026 09:00' }, Architectural: { status: 'In Progress', at: '' }, Structural: { status: 'Queued', at: '' }, Electrical: { status: 'Queued', at: '' }, Plumbing: { status: 'Queued', at: '' } },
        timeline: [{ title: 'Submitted', sub: 'Oct 08, 2026', done: true }, { title: 'Document Review', sub: 'In progress', current: true }],
        payment: { status: 'Pending', or: '', amount: FEE_TOTAL }, issued: false, permitNo: null, remarks: '' },
    ],
    inspections: [
      { id: 'INSP-301', project: 'Dela Cruz Residence', ref: 'LC-2026-0101', barangay: 'Poblacion 2', zoneId: 'pob2', date: '2026-10-14', time: '09:00', status: 'Scheduled', verdict: '', inspector: 'Pedro Villanueva', checklist: {}, findings: '' },
      { id: 'INSP-302', project: 'Fernandez Bakery', ref: 'BP-2026-0451', barangay: 'Poblacion 1', zoneId: 'pob1', date: '2026-10-14', time: '13:30', status: 'Pending', verdict: '', inspector: 'Pedro Villanueva', checklist: {}, findings: '' },
      { id: 'INSP-299', project: 'Aquino Storage', ref: 'BP-2026-0448', barangay: 'Brgy. Coastal', zoneId: 'coastal', date: '2026-10-11', time: '10:00', status: 'Completed', verdict: 'Passed', inspector: 'Pedro Villanueva', checklist: { 'Site Location Verified': true, 'Land Use Conformity': true, 'Building Plans Available': true }, findings: 'All items conform to approved plans.' },
      { id: 'INSP-297', project: 'Bay Cold Storage', ref: 'LC-2026-0109', barangay: 'Bay Area', zoneId: 'bay', date: '2026-10-09', time: '14:00', status: 'Completed', verdict: 'Failed', inspector: 'Pedro Villanueva', checklist: { 'Site Location Verified': true, 'Land Use Conformity': false, 'Building Plans Available': true }, findings: 'Encroachment on easement observed.' },
    ],
    payments: [
      { id: uid('PAY'), or: 'OR-04217', ref: 'BP-2026-0448', amount: FEE_TOTAL, at: 'Oct 11, 2026' },
    ],
  };
}

// Central mock dataset for the Buenavista prototype (no backend calls).
export const ROLES = [
  { id: 'applicant', label: 'Applicant', desc: 'Apply & track locational clearance and building permits' },
  { id: 'mpdo', label: 'MPDO Personnel', desc: 'Zoning verification & clearance review' },
  { id: 'official', label: 'Building Official / Permit Officer', desc: 'Technical review, fees & permit issuance' },
  { id: 'inspector', label: 'Inspector', desc: 'Site inspections & compliance reports' },
  { id: 'admin', label: 'System Administrator', desc: 'Users, zones, settings & analytics' },
];

export const DEMO_USERS = {
  applicant: { name: 'Juan Dela Cruz', email: 'applicant@buenavista.gov.ph', role: 'applicant' },
  mpdo: { name: 'Maria Santos', email: 'mpdo@buenavista.gov.ph', role: 'mpdo' },
  official: { name: 'Engr. Jose Reyes', email: 'official@buenavista.gov.ph', role: 'official' },
  inspector: { name: 'Pedro Villanueva', email: 'inspector@buenavista.gov.ph', role: 'inspector' },
  admin: { name: 'Ana Admin', email: 'admin@buenavista.gov.ph', role: 'admin' },
};

export const ZONES = [
  { id: 'pob1', name: 'Poblacion 1', use: 'Commercial', lat: 13.92, lng: 121.09, color: '#0D9488' },
  { id: 'pob2', name: 'Poblacion 2', use: 'Residential', lat: 13.935, lng: 121.105, color: '#10B981' },
  { id: 'pob3', name: 'Poblacion 3', use: 'Institutional', lat: 13.905, lng: 121.075, color: '#6366F1' },
  { id: 'coastal', name: 'Brgy. Coastal', use: 'Fisheries / Tourism', lat: 13.885, lng: 121.11, color: '#0EA5E9' },
  { id: 'bay', name: 'Bay Area', use: 'Protected / Easement', lat: 13.87, lng: 121.13, color: '#F59E0B' },
];

export const LOCATIONAL_DOCS = [
  'Tax Declaration', 'Tax Clearance', 'Geotagged Photos', 'Landowner Consent',
  'Barangay Certificate', 'Building Plans', 'Bill of Materials', 'Sketch / Vicinity Map',
];

export const GENERAL_REQUIREMENTS = [
  'Duly Accomplished Application Form', 'Transfer Certificate of Title / OCT',
  'Current Tax Declaration', 'Barangay Clearance', 'Zoning / Locational Clearance',
  'Fire Safety Evaluation Clearance', 'PRC License of Professional', "Owner's Valid ID",
];

export const PERMIT_TYPES = [
  'Building', 'Electrical', 'Mechanical', 'Plumbing', 'Electronics', 'Fencing', 'Excavation', 'Demolition',
];

export const FEE_SCHEDULE = [
  { item: 'Filing Fee', amount: 500 },
  { item: 'Locational Clearance Fee', amount: 720 },
  { item: 'Zoning Verification', amount: 350 },
  { item: 'Documentary Stamp', amount: 302 },
  { item: 'Inspection Fee', amount: 500 },
];

export const APPLICATIONS = [
  { id: 'LC-2026-0101', type: 'Locational Clearance', project: 'Dela Cruz Residence', barangay: 'Poblacion 2', status: 'Under Review', updated: 'Oct 12, 2026', progress: 60 },
  { id: 'BP-2026-0455', type: 'Building Permit', project: 'Dela Cruz Sari-Sari Store', barangay: 'Poblacion 1', status: 'Revision Required', updated: 'Oct 10, 2026', progress: 40 },
  { id: 'LC-2026-0098', type: 'Locational Clearance', project: 'Coastal Fish Port Shed', barangay: 'Brgy. Coastal', status: 'Approved', updated: 'Oct 08, 2026', progress: 100 },
];

export const MPDO_QUEUE = [
  { id: 'LC-2026-0101', applicant: 'Juan Dela Cruz', project: 'Two-storey Residence', barangay: 'Poblacion 2', zoning: 'Compliant', status: 'Under Review' },
  { id: 'LC-2026-0104', applicant: 'Ligaya Fernandez', project: 'Bakery & Store', barangay: 'Poblacion 1', zoning: 'Non-Compliant', status: 'Pending' },
  { id: 'LC-2026-0106', applicant: 'Ramon Aquino', project: 'Fish Drying Shed', barangay: 'Brgy. Coastal', zoning: 'Compliant', status: 'Pending' },
  { id: 'LC-2026-0109', applicant: 'Coastal Coop', project: 'Cold Storage', barangay: 'Bay Area', zoning: 'Non-Compliant', status: 'Revision Required' },
];

export const OFFICIAL_QUEUE = [
  { id: 'BP-2026-0455', applicant: 'Juan Dela Cruz', scope: 'New Construction — Commercial', division: 'Architectural', docStatus: 'Under Review', inspection: 'Scheduled' },
  { id: 'BP-2026-0451', applicant: 'Ligaya Fernandez', scope: 'Renovation — Food Establishment', division: 'Plumbing', docStatus: 'Revision Required', inspection: 'Pending' },
  { id: 'BP-2026-0448', applicant: 'Ramon Aquino', scope: 'Addition — Storage', division: 'Civil/Structural', docStatus: 'Compliant', inspection: 'Completed' },
];

export const INSPECTIONS = [
  { id: 'INSP-301', project: 'Dela Cruz Residence', barangay: 'Poblacion 2', date: 'Oct 14, 2026', time: '09:00 AM', status: 'Scheduled' },
  { id: 'INSP-302', project: 'Fernandez Bakery', barangay: 'Poblacion 1', date: 'Oct 14, 2026', time: '01:30 PM', status: 'Pending' },
  { id: 'INSP-299', project: 'Aquino Storage', barangay: 'Brgy. Coastal', date: 'Oct 11, 2026', time: '10:00 AM', status: 'Passed' },
  { id: 'INSP-297', project: 'Bay Cold Storage', barangay: 'Bay Area', date: 'Oct 09, 2026', time: '02:00 PM', status: 'Failed' },
];

export const ADMIN_USERS = [
  { id: 1, name: 'Maria Santos', email: 'mpdo@buenavista.gov.ph', role: 'MPDO Personnel', status: 'Active' },
  { id: 2, name: 'Engr. Jose Reyes', email: 'official@buenavista.gov.ph', role: 'Building Official', status: 'Active' },
  { id: 3, name: 'Pedro Villanueva', email: 'inspector@buenavista.gov.ph', role: 'Inspector', status: 'Active' },
  { id: 4, name: 'Juan Dela Cruz', email: 'applicant@buenavista.gov.ph', role: 'Applicant', status: 'Active' },
  { id: 5, name: 'Ramon Aquino', email: 'ramon@example.com', role: 'Applicant', status: 'Deactivated' },
];

export const AUDIT_FEED = [
  { actor: 'M. Santos (MPDO)', action: 'Approved locational clearance LC-2026-0098', time: '10 min ago' },
  { actor: 'System', action: 'Nightly backup completed (142 MB)', time: '2 hrs ago' },
  { actor: 'J. Reyes (Official)', action: 'Recorded payment OR #04217 — ₱2,372.00', time: '5 hrs ago' },
  { actor: 'P. Villanueva (Inspector)', action: 'Submitted inspection INSP-299 — PASSED', time: 'Yesterday' },
];

export const peso = (n) => `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
export const FEE_TOTAL = FEE_SCHEDULE.reduce((s, f) => s + f.amount, 0); // 2372

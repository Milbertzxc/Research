// Compatibility layer: most pages now use the global store; keep exports for any legacy imports.
export {
  ROLES, DEMO_USERS, ZONES, LC_DOCS as LOCATIONAL_DOCS, BP_SUBFORMS, FEE_ITEMS as FEE_SCHEDULE, FEE_TOTAL, DIVISIONS, peso, uid, now, today,
} from './initialState.js';

import { buildInitialState } from './initialState.js';
const s = buildInitialState();
export const PERMIT_TYPES = ['Building', 'Electrical', 'Mechanical', 'Plumbing', 'Electronics', 'Fencing', 'Excavation', 'Demolition'];
export const GENERAL_REQUIREMENTS = s.lcApplications[0].docs.map(d => d.name);
export const APPLICATIONS = s.lcApplications.map(a => ({ id: a.id, type: 'Locational Clearance', project: a.project, barangay: a.barangay, status: a.status, updated: a.updated, progress: a.progress }))
  .concat(s.bpApplications.map(a => ({ id: a.id, type: 'Building Permit', project: a.project, barangay: a.barangay, status: a.status, updated: a.updated, progress: a.progress })));
export const MPDO_QUEUE = s.lcApplications.map(a => ({ id: a.id, applicant: a.applicant, project: a.project, barangay: a.barangay, zoning: a.zoning, status: a.status }));
export const OFFICIAL_QUEUE = s.bpApplications.map(a => ({ id: a.id, applicant: a.applicant, scope: a.scope, division: 'Architectural', docStatus: a.status, inspection: a.progress > 60 ? 'Scheduled' : 'Pending' }));
export const INSPECTIONS = s.inspections;
export const ADMIN_USERS = s.users;
export const AUDIT_FEED = s.auditLogs;

import React, { useState } from 'react';
import Layout from './components/Layout.jsx';
import { Toasts } from './components/ui.jsx';
import { StoreProvider, useStore } from './store/Store.jsx';
import RoleSelect from './pages/RoleSelect.jsx';
import SignIn from './pages/SignIn.jsx';
import SignUp from './pages/SignUp.jsx';
import ApplicantDashboard from './pages/applicant/ApplicantDashboard.jsx';
import LocationalForm from './pages/applicant/LocationalForm.jsx';
import BuildingPermitForm from './pages/applicant/BuildingPermitForm.jsx';
import Tracking from './pages/applicant/Tracking.jsx';
import MpdoDashboard from './pages/mpdo/MpdoDashboard.jsx';
import ZoningReview from './pages/mpdo/ZoningReview.jsx';
import EvalReport from './pages/mpdo/EvalReport.jsx';
import OfficialDashboard from './pages/official/OfficialDashboard.jsx';
import ProgressPayments from './pages/official/ProgressPayments.jsx';
import Issuance from './pages/official/Issuance.jsx';
import InspectorDashboard from './pages/inspector/InspectorDashboard.jsx';
import InspectionReport from './pages/inspector/InspectionReport.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import Users from './pages/admin/Users.jsx';
import ZonesSettings from './pages/admin/ZonesSettings.jsx';
import Reports from './pages/admin/Reports.jsx';
import IndigenousDwellingPortal from './pages/IndigenousDwellingPortal.jsx';

const TITLES = {
  dashboard: 'Dashboard',
  locational: 'Locational Clearance Application',
  building: 'Building Permit Application',
  tracking: 'Track My Applications',
  review: 'Locational Clearance & Zoning Review',
  reports: 'Evaluation & Inspection Reports',
  progress: 'Progress Flow & Payment Recording',
  issuance: 'Permit Issuance',
  report: 'Inspection Report Submission',
  users: 'User and Role Management',
  zones: 'GIS / Zone Management & System Settings',
  'admin-reports': 'Reports and Analytics',
};

const DEFAULT_PAGE = { applicant: 'dashboard', mpdo: 'dashboard', zoning: 'dashboard', official: 'dashboard', inspector: 'dashboard', admin: 'dashboard' };

function Portal() {
  const store = useStore();
  const [stage, setStage] = useState('roles'); // roles | signin | signup | app
  const [pendingRole, setPendingRole] = useState(null);
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('dashboard');

  const pickRole = (role) => { if (role === '__indigenous_demo') { setStage('indigenous'); return; } setPendingRole(role); setStage('signin'); };
  const login = (u) => { const actor = u.name || 'User'; setUser(u); setPage(DEFAULT_PAGE[u.role] || 'dashboard'); setStage('app'); store.audit(actor, `Signed in as ${u.role}`); store.toast(`Welcome, ${u.name}.`); };
  const logout = () => { if (user) store.audit(user.name, 'Signed out'); setUser(null); setPendingRole(null); setStage('roles'); store.toast('Signed out.'); };
  const switchRole = () => { store.toast('Choose a role to switch views.'); setStage('roles'); setPendingRole(null); };
  const actor = user?.name || 'System';

  if (stage === 'roles') return <RoleSelect onPick={pickRole} />;
  if (stage === 'indigenous') return <IndigenousDwellingPortal onExit={() => setStage('roles')} />;
  if (stage === 'signin') return <SignIn role={pendingRole} onBack={() => setStage('roles')} onLogin={login} onSignUp={() => setStage('signup')} />;
  if (stage === 'signup') return <SignUp onBack={() => setStage('roles')} onSignIn={() => setStage('signin')} onRegisterSuccess={login} />;

  return (
    <Layout user={user} page={page} setPage={setPage} onSwitchRole={switchRole} onLogout={logout} titles={TITLES} notifCount={store.state.notifCount} notifications={store.state.notifications} onReadNotifs={store.markNotifsRead}>
      {user.role === 'applicant' && page === 'dashboard' && <ApplicantDashboard setPage={setPage} user={user} />}
      {user.role === 'applicant' && page === 'locational' && <LocationalForm user={user} />}
      {user.role === 'applicant' && page === 'building' && <BuildingPermitForm user={user} />}
      {user.role === 'applicant' && page === 'tracking' && <Tracking user={user} />}
      {user.role === 'mpdo' && page === 'dashboard' && <MpdoDashboard setPage={setPage} />}
      {user.role === 'mpdo' && page === 'review' && <ZoningReview actor={actor} />}
      {user.role === 'mpdo' && page === 'reports' && <EvalReport actor={actor} />}
      {user.role === 'official' && page === 'dashboard' && <OfficialDashboard setPage={setPage} />}
      {user.role === 'official' && page === 'progress' && <ProgressPayments actor={actor} />}
      {user.role === 'official' && page === 'issuance' && <Issuance actor={actor} />}
      {user.role === 'zoning' && page === 'dashboard' && <InspectorDashboard setPage={setPage} actor={actor} isZoning={true} />}
      {user.role === 'zoning' && page === 'report' && <InspectionReport actor={actor} defaultType="zoning" />}
      {user.role === 'inspector' && page === 'dashboard' && <InspectorDashboard setPage={setPage} actor={actor} isZoning={false} />}
      {user.role === 'inspector' && page === 'report' && <InspectionReport actor={actor} defaultType="full" />}
      {user.role === 'admin' && page === 'dashboard' && <AdminDashboard setPage={setPage} />}
      {user.role === 'admin' && page === 'users' && <Users actor={actor} />}
      {user.role === 'admin' && page === 'zones' && <ZonesSettings actor={actor} />}
      {user.role === 'admin' && page === 'admin-reports' && <Reports />}
      {user.role === 'admin' && page === 'reports' && <Reports />}
    </Layout>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <ToastsBridge />
      <Portal />
    </StoreProvider>
  );
}

function ToastsBridge() {
  const { state, dismissToast } = useStore();
  return <Toasts toasts={state.toasts} onDismiss={dismissToast} />;
}

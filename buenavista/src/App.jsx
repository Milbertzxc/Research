import React, { useState } from 'react';
import Layout from './components/Layout.jsx';
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

const TITLES = {
  dashboard: 'Dashboard',
  locational: 'Locational Clearance Application',
  building: 'Building Permit Application',
  tracking: 'Track My Applications',
  review: 'Application Review & Zoning Verification',
  reports: 'Evaluation Report & Site Inspection',
  progress: 'Progress Flow & Payment Recording',
  issuance: 'Permit Issuance',
  report: 'Inspection Report',
  users: 'User & Role Management',
  zones: 'GIS / Zone Management & System Settings',
};

const DEFAULT_PAGE = { applicant: 'dashboard', mpdo: 'dashboard', official: 'dashboard', inspector: 'dashboard', admin: 'dashboard' };

export default function App() {
  const [stage, setStage] = useState('roles'); // roles | signin | app
  const [pendingRole, setPendingRole] = useState(null);
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('dashboard');

  const pickRole = (role) => { setPendingRole(role); setStage('signin'); };
  const login = (u) => { setUser(u); setPage(DEFAULT_PAGE[u.role]); setStage('app'); };
  const logout = () => { setUser(null); setPendingRole(null); setStage('roles'); };
  const switchRole = () => { setStage('roles'); setPendingRole(null); };

  if (stage === 'roles') return <RoleSelect onPick={pickRole} />;
  if (stage === 'signin') {
    return (
      <SignIn
        role={pendingRole}
        onBack={() => setStage('roles')}
        onLogin={login}
        onSignUp={() => setStage('signup')}
      />
    );
  }
  if (stage === 'signup') {
    return (
      <SignUp
        onBack={() => setStage('roles')}
        onSignIn={() => setStage('signin')}
        onRegisterSuccess={login}
      />
    );
  }

  return (
    <Layout user={user} page={page} setPage={setPage} onSwitchRole={switchRole} onLogout={logout} titles={TITLES}>
      {user.role === 'applicant' && page === 'dashboard' && <ApplicantDashboard setPage={setPage} />}
      {user.role === 'applicant' && page === 'locational' && <LocationalForm />}
      {user.role === 'applicant' && page === 'building' && <BuildingPermitForm />}
      {user.role === 'applicant' && page === 'tracking' && <Tracking />}
      {user.role === 'mpdo' && page === 'dashboard' && <MpdoDashboard setPage={setPage} />}
      {user.role === 'mpdo' && page === 'review' && <ZoningReview />}
      {user.role === 'mpdo' && page === 'reports' && <EvalReport />}
      {user.role === 'official' && page === 'dashboard' && <OfficialDashboard setPage={setPage} />}
      {user.role === 'official' && page === 'progress' && <ProgressPayments />}
      {user.role === 'official' && page === 'issuance' && <Issuance />}
      {user.role === 'inspector' && page === 'dashboard' && <InspectorDashboard setPage={setPage} />}
      {user.role === 'inspector' && page === 'report' && <InspectionReport />}
      {user.role === 'admin' && page === 'dashboard' && <AdminDashboard setPage={setPage} />}
      {user.role === 'admin' && page === 'users' && <Users />}
      {user.role === 'admin' && page === 'zones' && <ZonesSettings />}
      {user.role === 'admin' && page === 'reports' && <Reports />}
    </Layout>
  );
}

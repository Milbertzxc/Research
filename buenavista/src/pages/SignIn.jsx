import React, { useState } from 'react';
import { Building2, Eye, EyeOff } from 'lucide-react';
import { DEMO_USERS, ROLES } from '../data/mock.js';
import { Btn, inputCls } from '../components/ui.jsx';

export default function SignIn({ role, onBack, onLogin }) {
  const [email, setEmail] = useState(DEMO_USERS[role]?.email ?? '');
  const [password, setPassword] = useState('password');
  const [remember, setRemember] = useState(true);
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const roleLabel = ROLES.find((r) => r.id === role)?.label ?? role;

  const submit = (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Enter a valid email address.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    setError('');
    onLogin({ ...(DEMO_USERS[role] ?? { name: email.split('@')[0], role }), email });
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="bg-[#1A365D] text-white p-10 hidden md:flex flex-col justify-center">
        <div className="w-14 h-14 rounded-2xl bg-[#0D9488] flex items-center justify-center mb-5">
          <Building2 size={26} />
        </div>
        <h1 className="text-3xl font-bold leading-tight">Buenavista Building Permit System</h1>
        <p className="text-slate-300 text-sm mt-3 max-w-md leading-relaxed">
          Locational clearance, building permits, zoning verification, inspections and issuance — one municipal
          workflow from application to occupancy.
        </p>
        <div className="mt-6 text-xs text-slate-400">Signing in as · <b className="text-white">{roleLabel}</b></div>
      </div>
      <div className="flex items-center justify-center p-6 bg-[#F1F5F9]">
        <form onSubmit={submit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-7 w-full max-w-md">
          <h2 className="font-bold text-lg text-slate-900">Sign In</h2>
          <p className="text-xs text-slate-500 mb-5">{roleLabel} portal · demo password is pre-filled</p>
          <div className="space-y-4">
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Email Address</span>
              <input className={`${inputCls} mt-1`} value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Password</span>
              <div className="relative mt-1">
                <input
                  type={show ? 'text' : 'password'}
                  className={inputCls}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-2.5 text-slate-400">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              Remember Me
            </label>
            {error && <div className="text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-lg px-3 py-2">{error}</div>}
            <Btn type="submit" className="w-full">Sign In Securely</Btn>
            <button type="button" onClick={onBack} className="w-full text-xs text-slate-500 hover:text-slate-800">
              ← Back to role selection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

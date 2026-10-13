import React from 'react';

export const STATUS_STYLES = {
  Approved: 'bg-emerald-100 text-emerald-800',
  Compliant: 'bg-emerald-100 text-emerald-800',
  Passed: 'bg-emerald-100 text-emerald-800',
  Uploaded: 'bg-emerald-100 text-emerald-800',
  Active: 'bg-emerald-100 text-emerald-800',
  Completed: 'bg-emerald-100 text-emerald-800',
  Scheduled: 'bg-emerald-100 text-emerald-800',
  Pending: 'bg-amber-100 text-amber-800',
  'Under Review': 'bg-amber-100 text-amber-800',
  'Revision Required': 'bg-amber-100 text-amber-800',
  'Non-Compliant': 'bg-rose-100 text-rose-800',
  Rejected: 'bg-rose-100 text-rose-800',
  Failed: 'bg-rose-100 text-rose-800',
  Missing: 'bg-rose-100 text-rose-800',
  Deactivated: 'bg-rose-100 text-rose-800',
};

export function Badge({ status, children }) {
  const label = children ?? status ?? '';
  const cls = STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-700';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

export function Card({ className = '', children }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>{children}</div>
  );
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-slate-100">
      <div>
        <h3 className="font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, sub, tone = 'teal' }) {
  const tones = {
    teal: 'bg-teal-50 text-teal-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
    indigo: 'bg-indigo-50 text-indigo-700',
  };
  return (
    <Card className="p-4 flex items-center gap-3">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${tones[tone]}`}>
        {Icon && <Icon size={20} />}
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold text-slate-900 leading-none">{value}</div>
        <div className="text-xs font-medium text-slate-600 mt-1">{label}</div>
        {sub && <div className="text-[11px] text-slate-400">{sub}</div>}
      </div>
    </Card>
  );
}

export function Field({ label, children, required }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-600">
        {label} {required && <span className="text-rose-500">*</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488]';

export function Btn({ variant = 'primary', className = '', ...props }) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-50';
  const styles = {
    primary: 'bg-[#0D9488] text-white hover:bg-[#0B7C72]',
    navy: 'bg-[#1A365D] text-white hover:bg-[#122642]',
    ghost: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
  };
  return <button className={`${base} ${styles[variant]} ${className}`} {...props} />;
}

export function Steps({ steps, current }) {
  return (
    <ol className="flex items-center gap-1 overflow-x-auto pb-1">
      {steps.map((s, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <li key={s} className="flex items-center gap-1 shrink-0">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                done ? 'bg-emerald-500 text-white' : active ? 'bg-[#0D9488] text-white' : 'bg-slate-200 text-slate-500'
              }`}
            >
              {n}
            </span>
            <span className={`text-xs font-medium pr-2 ${active ? 'text-slate-900' : 'text-slate-500'}`}>{s}</span>
            {n < steps.length && <span className="w-6 h-px bg-slate-300" />}
          </li>
        );
      })}
    </ol>
  );
}

export function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto nice-scroll">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export function ProgressTimeline({ items }) {
  return (
    <ol className="relative border-l-2 border-slate-200 ml-2 space-y-4">
      {items.map((it, i) => (
        <li key={i} className="ml-4 relative">
          <span
            className={`absolute -left-[25px] top-0.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow ${
              it.done ? 'bg-emerald-500' : it.current ? 'bg-amber-400' : 'bg-slate-300'
            }`}
          />
          <div className="text-sm font-semibold text-slate-800">{it.title}</div>
          <div className="text-xs text-slate-500">{it.sub}</div>
        </li>
      ))}
    </ol>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between w-full py-2"
    >
      <span className="text-sm text-slate-700">{label}</span>
      <span className={`w-10 h-6 rounded-full p-1 transition ${checked ? 'bg-[#0D9488]' : 'bg-slate-300'}`}>
        <span className={`block w-4 h-4 bg-white rounded-full shadow transition ${checked ? 'ml-4' : ''}`} />
      </span>
    </button>
  );
}

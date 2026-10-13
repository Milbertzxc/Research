import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { ADMIN_USERS } from '../../data/mock.js';
import { Badge, Btn, Card, CardHeader, Field, Modal, inputCls } from '../../components/ui.jsx';

export default function Users() {
  const [users, setUsers] = useState(ADMIN_USERS);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'Applicant' });
  const [msg, setMsg] = useState('');

  const create = () => {
    if (!form.name || !form.email) return setMsg('Name and email are required.');
    setUsers((u) => [...u, { id: Date.now(), ...form, status: 'Active' }]);
    setOpen(false); setForm({ name: '', email: '', role: 'Applicant' }); setMsg('');
  };
  const toggleStatus = (id) =>
    setUsers((u) => u.map((x) => (x.id === id ? { ...x, status: x.status === 'Active' ? 'Deactivated' : 'Active' } : x)));

  return (
    <Card>
      <CardHeader
        title="User & Role Management"
        subtitle={`${users.length} accounts`}
        action={<Btn onClick={() => setOpen(true)}><Plus size={15} /> Create User</Btn>}
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-slate-500 border-b border-slate-100"><th className="px-5 py-3">Name</th><th className="px-3 py-3">Email</th><th className="px-3 py-3">Role</th><th className="px-3 py-3">Status</th><th className="px-3 py-3 text-right">Actions</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-5 py-3 font-semibold">{u.name}</td>
                <td className="px-3 py-3 text-xs">{u.email}</td>
                <td className="px-3 py-3">{u.role}</td>
                <td className="px-3 py-3"><Badge status={u.status} /></td>
                <td className="px-3 py-3">
                  <div className="flex justify-end gap-1 text-xs font-semibold">
                    <button className="px-2 py-1 rounded hover:bg-slate-100" onClick={() => setMsg(`Viewing ${u.name} — profile drawer (prototype).`)}>View</button>
                    <button className="px-2 py-1 rounded hover:bg-slate-100" onClick={() => setMsg(`Editing ${u.name} (prototype).`)}>Edit</button>
                    <button className="px-2 py-1 rounded hover:bg-slate-100" onClick={() => toggleStatus(u.id)}>{u.status === 'Active' ? 'Deactivate' : 'Activate'}</button>
                    <button className="px-2 py-1 rounded hover:bg-slate-100 text-[#0D9488]" onClick={() => setMsg(`Password reset link sent to ${u.email}.`)}>Reset Password</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {msg && <div className="m-4 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">{msg}</div>}

      <Modal open={open} title="Create User" onClose={() => setOpen(false)} footer={<><Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn><Btn onClick={create}>Create</Btn></>}>
        <div className="space-y-3">
          <Field label="Full Name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Email"><input className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Role">
            <select className={inputCls} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option>Applicant</option><option>MPDO Personnel</option><option>Building Official</option><option>Inspector</option><option>Administrator</option>
            </select>
          </Field>
          {msg && <div className="text-xs text-rose-600">{msg}</div>}
        </div>
      </Modal>
    </Card>
  );
}

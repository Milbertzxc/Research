import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useStore } from '../../store/Store.jsx';
import { Badge, Btn, Card, CardHeader, Field, Modal, inputCls } from '../../components/ui.jsx';

const ROLES = ['Applicant', 'MPDO Personnel', 'Building Official', 'Inspector', 'System Administrator'];

export default function Users({ actor = 'System Administrator' }) {
  const { state, addUser, updateUser, toggleUserStatus, resetPassword } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'Applicant' });
  const [error, setError] = useState('');
  const [view, setView] = useState(null);
  const [edit, setEdit] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [filter, setFilter] = useState('');
  const users = useMemo(() => state.users.filter(u => !filter || `${u.name} ${u.email} ${u.role} ${u.status}`.toLowerCase().includes(filter.toLowerCase())), [state.users, filter]);

  const create = () => {
    if (!form.name.trim() || !form.email.trim()) return setError('Name and email are required.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError('Enter a valid email address.');
    addUser(form, actor); setOpen(false); setForm({ name: '', email: '', role: 'Applicant' }); setError('');
  };
  const saveEdit = () => {
    if (!editForm.name?.trim() || !editForm.email?.trim()) return setError('Name and email are required.');
    updateUser(edit.id, { name: editForm.name.trim(), email: editForm.email.trim(), role: editForm.role, status: editForm.status }, actor);
    setEdit(null); setError('');
  };

  return (
    <Card>
      <CardHeader title="User and Role Management" subtitle={`${state.users.length} accounts`} action={<div className="flex gap-2"><input className={inputCls + ' max-w-[180px]'} placeholder="Filter users…" value={filter} onChange={(e)=>setFilter(e.target.value)} /><Btn onClick={()=>{ setOpen(true); setError(''); }}><Plus size={15}/> Create User</Btn></div>} />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-slate-500 border-b border-slate-100"><th className="px-5 py-3">Name</th><th className="px-3 py-3">Email</th><th className="px-3 py-3">Role</th><th className="px-3 py-3">Status</th><th className="px-3 py-3 text-right">Actions</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-5 py-3 font-semibold">{u.name}</td><td className="px-3 py-3 text-xs">{u.email}</td><td className="px-3 py-3">{u.role}</td><td className="px-3 py-3"><Badge status={u.status} /></td>
                <td className="px-3 py-3"><div className="flex justify-end gap-1 text-xs font-semibold flex-wrap">
                  <button className="px-2 py-1 rounded hover:bg-slate-100" onClick={()=>setView(u)}>View</button>
                  <button className="px-2 py-1 rounded hover:bg-slate-100" onClick={()=>{ setEdit(u); setEditForm({ ...u }); setError(''); }}>Edit</button>
                  <button className="px-2 py-1 rounded hover:bg-slate-100" onClick={()=>toggleUserStatus(u.id, actor)}>{u.status === 'Active' ? 'Deactivate' : 'Activate'}</button>
                  <button className="px-2 py-1 rounded hover:bg-slate-100 text-[#0D9488]" onClick={()=>resetPassword(u, actor)}>Reset Password</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} title="Create User" onClose={()=>setOpen(false)} footer={<><Btn variant="ghost" onClick={()=>setOpen(false)}>Cancel</Btn><Btn onClick={create}>Create</Btn></>}>
        <div className="space-y-3">
          <Field label="Full Name" required><input className={inputCls} value={form.name} onChange={(e)=>setForm({ ...form, name:e.target.value })} /></Field>
          <Field label="Email" required><input className={inputCls} value={form.email} onChange={(e)=>setForm({ ...form, email:e.target.value })} /></Field>
          <Field label="Role"><select className={inputCls} value={form.role} onChange={(e)=>setForm({ ...form, role:e.target.value })}>{ROLES.map(r=><option key={r}>{r}</option>)}</select></Field>
          {error && <div className="text-xs text-rose-600">{error}</div>}
        </div>
      </Modal>

      <Modal open={!!view} title="User Profile" onClose={()=>setView(null)} footer={<Btn variant="ghost" onClick={()=>setView(null)}>Close</Btn>}>
        {view && <div className="text-sm space-y-2"><div><b>Name:</b> {view.name}</div><div><b>Email:</b> {view.email}</div><div><b>Role:</b> {view.role}</div><div><b>Status:</b> <Badge status={view.status} /></div><div><b>ID:</b> {view.id}</div></div>}
      </Modal>

      <Modal open={!!edit} title={`Edit User — ${edit?.name || ''}`} onClose={()=>setEdit(null)} footer={<><Btn variant="ghost" onClick={()=>setEdit(null)}>Cancel</Btn><Btn onClick={saveEdit}>Save Changes</Btn></>}>
        {edit && <div className="space-y-3">
          <Field label="Full Name" required><input className={inputCls} value={editForm.name || ''} onChange={(e)=>setEditForm({ ...editForm, name:e.target.value })} /></Field>
          <Field label="Email" required><input className={inputCls} value={editForm.email || ''} onChange={(e)=>setEditForm({ ...editForm, email:e.target.value })} /></Field>
          <Field label="Role"><select className={inputCls} value={editForm.role} onChange={(e)=>setEditForm({ ...editForm, role:e.target.value })}>{ROLES.map(r=><option key={r}>{r}</option>)}</select></Field>
          <Field label="Status"><select className={inputCls} value={editForm.status} onChange={(e)=>setEditForm({ ...editForm, status:e.target.value })}><option>Active</option><option>Deactivated</option></select></Field>
          {error && <div className="text-xs text-rose-600">{error}</div>}
        </div>}
      </Modal>
    </Card>
  );
}

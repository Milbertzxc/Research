import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { buildInitialState, now, uid } from '../data/initialState.js';

const StoreCtx = createContext(null);
const LS_KEY = 'mpdo_buenavista_state_v1';

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return { ...buildInitialState(), ...JSON.parse(raw), toasts: [] };
  } catch {}
  return buildInitialState();
}

const syncPost = (url, body) => {
  try {
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include'
    }).catch(err => console.warn('Central DB sync notice:', url, err.message));
  } catch (e) {
    console.warn('Central DB sync err:', e.message);
  }
};

export function StoreProvider({ children }) {
  const [state, setState] = useState(loadState);

  // Sync with MySQL Central Database on mount
  useEffect(() => {
    fetch('/api/workflow/state', { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(serverData => {
        if (serverData) {
          setState((prev) => ({
            ...prev,
            lcApplications: serverData.lcApplications?.length ? serverData.lcApplications : prev.lcApplications,
            bpApplications: serverData.bpApplications?.length ? serverData.bpApplications : prev.bpApplications,
            inspections: serverData.inspections?.length ? serverData.inspections : prev.inspections,
            payments: serverData.payments?.length ? serverData.payments : prev.payments,
          }));
        }
      })
      .catch((err) => console.log('Central DB offline or unreachable, using offline cache.', err));
  }, []);

  useEffect(() => {
    try {
      const { toasts, ...rest } = state;
      localStorage.setItem(LS_KEY, JSON.stringify(rest));
    } catch {}
  }, [state]);

  const toast = (msg, tone = 'teal') => {
    const id = uid('T');
    setState((s) => ({ ...s, toasts: [...s.toasts, { id, msg, tone }] }));
    setTimeout(() => setState((s) => ({ ...s, toasts: s.toasts.filter((t) => t.id !== id) })), 3200);
  };
  const audit = (actor, action) => setState((s) => ({ ...s, auditLogs: [{ id: uid('A'), actor, action, at: now() }, ...s.auditLogs].slice(0, 80) }));
  const notify = (text) => setState((s) => ({ ...s, notifCount: s.notifCount + 1, notifications: [{ id: uid('N'), text, read: false, at: now() }, ...s.notifications].slice(0, 50) }));

  const actions = useMemo(() => ({
    toast, audit, notify,
    dismissToast: (id) => setState((s) => ({ ...s, toasts: s.toasts.filter((t) => t.id !== id) })),
    markNotifsRead: () => setState((s) => ({ ...s, notifCount: 0, notifications: s.notifications.map((n) => ({ ...n, read: true })) })),

    // Users
    addUser: (u, actor) => {
      setState((s) => ({ ...s, users: [...s.users, { ...u, id: Date.now(), status: 'Active' }] }));
      audit(actor, `Created user ${u.name} (${u.role})`);
      toast('User created.');
      notify(`New user account created: ${u.name}.`);
    },
    updateUser: (id, patch, actor) => {
      setState((s) => ({ ...s, users: s.users.map((u) => u.id === id ? { ...u, ...patch } : u) }));
      audit(actor, `Updated user #${id}`);
      toast('User updated.');
    },
    toggleUserStatus: (id, actor) => {
      setState((s) => ({ ...s, users: s.users.map((u) => u.id === id ? { ...u, status: u.status === 'Active' ? 'Deactivated' : 'Active' } : u) }));
      audit(actor, `Toggled status for user #${id}`);
      toast('User status updated.');
    },
    resetPassword: (u, actor) => {
      audit(actor, `Password reset sent to ${u.email}`);
      toast(`Password reset link sent to ${u.email}.`);
    },

    // Zones / settings
    saveZones: (zones, actor) => {
      setState((s) => ({ ...s, zones }));
      audit(actor, 'Updated GIS zone configuration');
      toast('Zones saved.');
    },
    updateZone: (id, patch, actor) => {
      setState((s) => ({ ...s, zones: s.zones.map((z) => z.id === id ? { ...z, ...patch } : z) }));
      audit(actor, `Updated zone ${id}`);
      toast('Zone updated.');
    },
    updateSettings: (patch, actor) => {
      setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
      audit(actor, 'Updated system settings');
      toast('Settings saved.');
    },
    runBackup: (actor) => {
      audit(actor, 'Manual backup started — snapshot queued');
      toast('Manual backup started.');
      notify('System backup snapshot queued.');
    },

    // Locational Clearance
    upsertLC: (app, actor, msg = 'Locational clearance saved.') => {
      setState((s) => {
        const exists = s.lcApplications.some((a) => a.id === app.id);
        return { ...s, lcApplications: exists ? s.lcApplications.map((a) => a.id === app.id ? app : a) : [app, ...s.lcApplications] };
      });
      syncPost('/api/workflow/lc', app);
      audit(actor, `${msg} (${app.id})`);
      toast(msg);
      notify(`${app.id}: ${msg}`);
    },
    setLCStatus: (id, status, actor, remarks = '') => {
      let targetApp = null;
      setState((s) => {
        const nextLCs = s.lcApplications.map((a) => {
          if (a.id === id) {
            targetApp = {
              ...a,
              status,
              remarks: remarks || a.remarks,
              updated: 'Today',
              progress: status === 'Approved' ? 100 : status === 'Revision Required' ? 45 : 70,
              timeline: [
                ...(a.timeline || []).filter(t => !t.current).map(t => ({ ...t, done: true })),
                { title: status, sub: `${now()}${remarks ? ' · ' + remarks : ''}`, current: status !== 'Approved', done: status === 'Approved' }
              ]
            };
            return targetApp;
          }
          return a;
        });
        return { ...s, lcApplications: nextLCs };
      });
      if (targetApp) syncPost('/api/workflow/lc', targetApp);
      audit(actor, `LC ${id} → ${status}`);
      toast(`Locational clearance ${status.toLowerCase()}.`);
      notify(`${id}: ${status}.`);
    },
    updateLCDocs: (id, docs, actor) => {
      let targetApp = null;
      setState((s) => {
        const nextLCs = s.lcApplications.map((a) => {
          if (a.id === id) {
            targetApp = { ...a, docs };
            return targetApp;
          }
          return a;
        });
        return { ...s, lcApplications: nextLCs };
      });
      if (targetApp) syncPost('/api/workflow/lc', targetApp);
      toast('Documents updated.');
    },

    // Building Permit
    upsertBP: (app, actor, msg = 'Building permit saved.') => {
      setState((s) => {
        const exists = s.bpApplications.some((a) => a.id === app.id);
        return { ...s, bpApplications: exists ? s.bpApplications.map((a) => a.id === app.id ? app : a) : [app, ...s.bpApplications] };
      });
      syncPost('/api/workflow/bp', app);
      audit(actor, `${msg} (${app.id})`);
      toast(msg);
      notify(`${app.id}: ${msg}`);
    },
    setBPStatus: (id, status, actor, remarks = '') => {
      let targetApp = null;
      setState((s) => {
        const nextBPs = s.bpApplications.map((a) => {
          if (a.id === id) {
            targetApp = {
              ...a,
              status,
              remarks: remarks || a.remarks,
              updated: 'Today',
              progress: status === 'Approved' ? 90 : status === 'Issued' ? 100 : a.progress,
              timeline: [
                ...(a.timeline || []).filter(t => !t.current).map(t => ({ ...t, done: true })),
                { title: status, sub: `${now()}${remarks ? ' · ' + remarks : ''}`, current: status !== 'Issued', done: status === 'Issued' }
              ]
            };
            return targetApp;
          }
          return a;
        });
        return { ...s, bpApplications: nextBPs };
      });
      if (targetApp) syncPost('/api/workflow/bp', targetApp);
      audit(actor, `BP ${id} → ${status}`);
      toast(`Building permit ${status.toLowerCase()}.`);
      notify(`${id}: ${status}.`);
    },
    updateBPSubform: (id, form, status, note = '') => {
      let targetApp = null;
      setState((s) => {
        const nextBPs = s.bpApplications.map((a) => {
          if (a.id === id) {
            targetApp = { ...a, subforms: { ...a.subforms, [form]: { status, note } } };
            return targetApp;
          }
          return a;
        });
        return { ...s, bpApplications: nextBPs };
      });
      if (targetApp) syncPost('/api/workflow/bp', targetApp);
    },
    updateBPDivision: (id, division, status, actor) => {
      let targetApp = null;
      setState((s) => {
        const nextBPs = s.bpApplications.map((a) => {
          if (a.id === id) {
            targetApp = {
              ...a,
              divisions: {
                ...a.divisions,
                [division]: { status, at: status === 'Completed' ? now() : a.divisions?.[division]?.at || '' }
              }
            };
            return targetApp;
          }
          return a;
        });
        return { ...s, bpApplications: nextBPs };
      });
      if (targetApp) syncPost('/api/workflow/bp', targetApp);
      audit(actor, `BP ${id} division ${division} → ${status}`);
      toast(`${division}: ${status}.`);
    },
    issuePermit: (id, actor) => {
      const permitNo = `BPP-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random()*9000))}`;
      let targetApp = null;
      setState((s) => {
        const nextBPs = s.bpApplications.map((a) => {
          if (a.id === id) {
            targetApp = { ...a, status: 'Issued', issued: true, permitNo, progress: 100, updated: 'Today' };
            return targetApp;
          }
          return a;
        });
        return { ...s, bpApplications: nextBPs };
      });
      if (targetApp) syncPost('/api/workflow/bp', targetApp);
      audit(actor, `Issued building permit ${permitNo} for ${id}`);
      toast(`Permit issued: ${permitNo}`);
      notify(`${id}: Building permit issued (${permitNo}).`);
    },
    recordPayment: (ref, or, amount, actor) => {
      if (!or) {
        toast('Enter an Official Receipt number.', 'rose');
        return false;
      }
      const payObj = { id: uid('PAY'), or, ref, amount: Number(amount) || 0, at: now(), payer: actor, recordedBy: actor };
      setState((s) => ({
        ...s,
        payments: [payObj, ...s.payments],
        bpApplications: s.bpApplications.map((a) => a.id === ref ? { ...a, payment: { status: 'Paid', or, amount: Number(amount) || 0 } } : a),
        lcApplications: s.lcApplications.map((a) => a.id === ref ? { ...a, payment: { status: 'Paid', or, amount: Number(amount) || 0 } } : a),
      }));
      syncPost('/api/workflow/payment', payObj);
      audit(actor, `Recorded payment ${or} — ${amount} for ${ref}`);
      toast('Payment recorded.');
      notify(`${ref}: payment ${or} recorded.`);
      return true;
    },

    // Inspections
    scheduleInspection: (payload, actor) => {
      const insp = { id: uid('INSP'), status: 'Scheduled', verdict: '', checklist: {}, findings: '', ...payload };
      setState((s) => ({
        ...s,
        inspections: [insp, ...s.inspections]
      }));
      syncPost('/api/workflow/inspection', insp);
      audit(actor, `Scheduled inspection for ${payload.project}`);
      toast('Inspection scheduled.');
      notify(`Inspection scheduled: ${payload.project}.`);
    },
    updateInspection: (id, patch, actor, label = 'Inspection updated') => {
      let targetInsp = null;
      setState((s) => {
        const nextInsps = s.inspections.map((i) => {
          if (i.id === id) {
            targetInsp = { ...i, ...patch };
            return targetInsp;
          }
          return i;
        });
        return { ...s, inspections: nextInsps };
      });
      if (targetInsp) syncPost('/api/workflow/inspection', targetInsp);
      audit(actor, `${label} (${id})`);
      toast(label);
      notify(`${id}: ${label}.`);
    },
    submitInspectionReport: (id, report, actor) => {
      let targetInsp = null;
      setState((s) => {
        const nextInsps = s.inspections.map((i) => {
          if (i.id === id) {
            targetInsp = { ...i, ...report, status: 'Completed' };
            return targetInsp;
          }
          return i;
        });
        return { ...s, inspections: nextInsps };
      });
      if (targetInsp) syncPost('/api/workflow/inspection', targetInsp);
      audit(actor, `Submitted inspection report ${id} — ${report.verdict}`);
      toast(`Inspection report submitted — ${report.verdict}.`);
      notify(`${id}: inspection ${report.verdict}.`);
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);

  return <StoreCtx.Provider value={{ state, ...actions, setState }}>{children}</StoreCtx.Provider>;
}

export const useStore = () => {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
};

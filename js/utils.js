/* ============================================================
   MPDO — Utility Functions
   ============================================================ */

const Utils = (() => {

  /* ── ID Generation ───────────────────────────────────────── */
  function generateId(prefix = '') {
    const ts   = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substr(2, 6).toUpperCase();
    return prefix ? `${prefix}-${ts}-${rand}` : `${ts}-${rand}`;
  }

  function generateAppNumber() {
    const year  = new Date().getFullYear();
    const month = String(new Date().getMonth()+1).padStart(2,'0');
    const rand  = Math.floor(Math.random()*9000)+1000;
    return `BP-${year}${month}-${rand}`;
  }

  /* ── Date Formatting ─────────────────────────────────────── */
  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d)) return '—';
    return d.toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric' });
  }

  function formatDateTime(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d)) return '—';
    return d.toLocaleDateString('en-PH', {
      year:'numeric', month:'short', day:'numeric',
      hour:'2-digit', minute:'2-digit'
    });
  }

  function timeAgo(dateStr) {
    if (!dateStr) return '';
    const d   = new Date(dateStr);
    const now  = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60)    return 'just now';
    if (diff < 3600)  return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    if (diff < 604800)return `${Math.floor(diff/86400)}d ago`;
    return formatDate(dateStr);
  }

  function daysAgo(dateStr) {
    if (!dateStr) return 0;
    const d   = new Date(dateStr);
    const now  = new Date();
    return Math.floor((now - d) / 86400000);
  }

  function daysBetween(d1, d2) {
    return Math.abs(Math.floor((new Date(d1) - new Date(d2)) / 86400000));
  }

  /* ── Text Utilities ──────────────────────────────────────── */
  function toTitleCase(str) {
    if (!str) return '';
    return str.replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.substr(1).toLowerCase());
  }

  function truncate(str, len = 60) {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '…' : str;
  }

  function slugify(str) {
    return str.toLowerCase().trim().replace(/[\s\W-]+/g, '-');
  }

  /* ── Currency ────────────────────────────────────────────── */
  function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '₱0.00';
    return new Intl.NumberFormat('en-PH', { style:'currency', currency:'PHP' }).format(amount);
  }

  /* ── Validation ──────────────────────────────────────────── */
  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validatePhone(phone) {
    return /^(09|\+639)\d{9}$/.test(phone.replace(/\s/g,''));
  }

  function validateCoordinates(lat, lng) {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    // Philippine bounds
    return !isNaN(latNum) && !isNaN(lngNum) &&
           latNum >= 4.5 && latNum <= 21.5 &&
           lngNum >= 115.5 && lngNum <= 127.5;
  }

  /* ── Password Hashing ────────────────────────────────────── */
  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data    = encoder.encode(password + 'mpdo_salt_2025');
    const hash    = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('');
  }

  /* ── Status Helpers ──────────────────────────────────────── */
  const STATUS_CONFIG = {
    'Draft':                   { color: 'muted',   icon: '<i data-lucide="edit-3" style="width:14px;height:14px;"></i>',  label: 'Draft' },
    'Submitted':               { color: 'info',    icon: '<i data-lucide="send" style="width:14px;height:14px;"></i>',  label: 'Submitted' },
    'Initial Validation':      { color: 'warning', icon: '<i data-lucide="search" style="width:14px;height:14px;"></i>',  label: 'Initial Validation' },
    'Document Review':         { color: 'warning', icon: '<i data-lucide="file-text" style="width:14px;height:14px;"></i>',  label: 'Document Review' },
    'Location Review':         { color: 'warning', icon: '<i data-lucide="map-pin" style="width:14px;height:14px;"></i>',  label: 'Location Review' },
    'MPDO Review':             { color: 'primary', icon: '<i data-lucide="users" style="width:14px;height:14px;"></i>',  label: 'MPDO Review' },
    'Additional Requirements': { color: 'danger',  icon: '<i data-lucide="alert-triangle" style="width:14px;height:14px;"></i>',  label: 'Additional Requirements' },
    'For Approval':            { color: 'accent',  icon: '<i data-lucide="check-circle" style="width:14px;height:14px;"></i>',  label: 'For Approval' },
    'Approved':                { color: 'success', icon: '<i data-lucide="award" style="width:14px;height:14px;"></i>',  label: 'Approved' },
    'Returned':                { color: 'danger',  icon: '<i data-lucide="corner-up-left" style="width:14px;height:14px;"></i>',  label: 'Returned' },
    'Completed':               { color: 'success', icon: '<i data-lucide="check-square" style="width:14px;height:14px;"></i>',  label: 'Completed' },
  };

  function getStatusConfig(status) {
    return STATUS_CONFIG[status] || { color: 'muted', icon: '•', label: status };
  }

  function getStatusBadgeClass(status) {
    const cfg = getStatusConfig(status);
    const map = {
      muted:'badge-muted', info:'badge-info', warning:'badge-warning',
      primary:'badge-primary', danger:'badge-danger', accent:'badge-accent',
      success:'badge-success'
    };
    return map[cfg.color] || 'badge-muted';
  }

  /* ── DOM Helpers ─────────────────────────────────────────── */
  function el(selector, parent = document) { return parent.querySelector(selector); }
  function els(selector, parent = document) { return [...parent.querySelectorAll(selector)]; }

  function createElement(tag, attrs = {}, children = []) {
    const elem = document.createElement(tag);
    Object.entries(attrs).forEach(([k,v]) => {
      if (k === 'class') elem.className = v;
      else if (k === 'html')  elem.innerHTML = v;
      else if (k === 'text')  elem.textContent = v;
      else elem.setAttribute(k, v);
    });
    children.forEach(c => elem.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
    return elem;
  }

  function setHTML(selector, html, parent = document) {
    const node = parent.querySelector(selector);
    if (node) node.innerHTML = html;
  }

  function setText(selector, text, parent = document) {
    const node = parent.querySelector(selector);
    if (node) node.textContent = text;
  }

  function show(selector, parent = document) {
    const node = typeof selector === 'string' ? parent.querySelector(selector) : selector;
    if (node) node.classList.remove('hidden');
  }

  function hide(selector, parent = document) {
    const node = typeof selector === 'string' ? parent.querySelector(selector) : selector;
    if (node) node.classList.add('hidden');
  }

  function toggle(selector, force, parent = document) {
    const node = typeof selector === 'string' ? parent.querySelector(selector) : selector;
    if (node) node.classList.toggle('hidden', force !== undefined ? !force : undefined);
  }

  /* ── Toast Notifications ─────────────────────────────────── */
  let toastContainer = null;

  function ensureToastContainer() {
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.style.cssText = `
        position:fixed; bottom:24px; right:24px; z-index:99999;
        display:flex; flex-direction:column; gap:12px; pointer-events:none;
      `;
      document.body.appendChild(toastContainer);
    }
    return toastContainer;
  }

  function toast(message, type = 'info', duration = 4000) {
    const container = ensureToastContainer();
    const icons = { 
      success:'<i data-lucide="check-circle" style="width:20px;height:20px;"></i>', 
      error:'<i data-lucide="x-circle" style="width:20px;height:20px;"></i>', 
      warning:'<i data-lucide="alert-triangle" style="width:20px;height:20px;"></i>', 
      info:'<i data-lucide="info" style="width:20px;height:20px;"></i>' 
    };
    const colors = {
      success: 'var(--success)',
      error:   'var(--danger)',
      warning: 'var(--warning)',
      info:    'var(--primary)'
    };
    const t = document.createElement('div');
    t.style.cssText = `
      background: var(--bg-3); border: 1px solid ${colors[type]}44;
      border-left: 4px solid ${colors[type]};
      padding: 14px 18px; border-radius: var(--radius-lg);
      display:flex; align-items:center; gap:12px;
      box-shadow: var(--shadow-lg); pointer-events:all;
      min-width:280px; max-width:400px;
      animation: slideInRight 0.3s ease;
      color: var(--text-primary); font-size: 0.9rem;
    `;
    t.innerHTML = `<span style="font-size:1.2rem;display:flex;align-items:center;">${icons[type]||'•'}</span><span style="flex:1">${message}</span>
      <button onclick="this.parentElement.remove()" style="
        background:none;border:none;color:var(--text-muted);cursor:pointer;
        font-size:1.1rem;padding:0;line-height:1;display:flex;align-items:center;justify-content:center;
      "><i data-lucide="x" style="width:16px;height:16px;"></i></button>`;
    container.appendChild(t);
    if (typeof lucide !== 'undefined') lucide.createIcons({root: t});
    if (duration > 0) setTimeout(() => { t.style.animation='slideOutRight 0.3s ease'; setTimeout(()=>t.remove(), 280); }, duration);
    return t;
  }

  /* ── Debounce ────────────────────────────────────────────── */
  function debounce(fn, delay = 300) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(()=>fn(...args), delay); };
  }

  /* ── File Size ───────────────────────────────────────────── */
  function formatFileSize(bytes) {
    if (bytes < 1024)       return bytes + ' B';
    if (bytes < 1048576)    return (bytes/1024).toFixed(1) + ' KB';
    if (bytes < 1073741824) return (bytes/1048576).toFixed(1) + ' MB';
    return (bytes/1073741824).toFixed(1) + ' GB';
  }

  /* ── Number Formatting ───────────────────────────────────── */
  function formatNumber(n) {
    return new Intl.NumberFormat('en-PH').format(n);
  }

  /* ── Sanitize HTML ───────────────────────────────────────── */
  function sanitize(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ── Copy to Clipboard ───────────────────────────────────── */
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast('Copied to clipboard', 'success', 2000);
    } catch { toast('Failed to copy', 'error'); }
  }

  /* ── Download ────────────────────────────────────────────── */
  function downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  function downloadCSV(rows, filename) {
    const csv  = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  /* ── Random Helpers ──────────────────────────────────────── */
  function randomBetween(min, max) { return Math.floor(Math.random()*(max-min+1))+min; }

  function randomItem(arr) { return arr[Math.floor(Math.random()*arr.length)]; }

  return {
    generateId, generateAppNumber,
    formatDate, formatDateTime, timeAgo, daysAgo, daysBetween,
    toTitleCase, truncate, slugify,
    formatCurrency, formatNumber, formatFileSize,
    validateEmail, validatePhone, validateCoordinates,
    hashPassword,
    getStatusConfig, getStatusBadgeClass,
    el, els, createElement, setHTML, setText, show, hide, toggle,
    toast,
    debounce,
    sanitize, copyToClipboard,
    downloadJSON, downloadCSV,
    randomBetween, randomItem,
    STATUS_CONFIG
  };
})();

window.Utils = Utils;

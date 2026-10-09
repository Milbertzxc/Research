/* ============================================================
   MPDO — Reports & Analytics Module
   ============================================================ */

const Reports = (() => {

  let chartInstances = {};

  function destroyChart(id) {
    if (chartInstances[id]) { chartInstances[id].destroy(); delete chartInstances[id]; }
  }

  function createChart(id, config) {
    destroyChart(id);
    const canvas = document.getElementById(id);
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.borderColor = 'rgba(255,255,255,0.08)';
    const chart = new Chart(ctx, config);
    chartInstances[id] = chart;
    return chart;
  }

  const CHART_COLORS = {
    blue:   { bg: 'rgba(59,130,246,0.15)',   border: '#3b82f6' },
    purple: { bg: 'rgba(139,92,246,0.15)',   border: '#8b5cf6' },
    green:  { bg: 'rgba(16,185,129,0.15)',   border: '#10b981' },
    yellow: { bg: 'rgba(245,158,11,0.15)',   border: '#f59e0b' },
    red:    { bg: 'rgba(239,68,68,0.15)',    border: '#ef4444' },
    cyan:   { bg: 'rgba(6,182,212,0.15)',    border: '#06b6d4' },
    pink:   { bg: 'rgba(236,72,153,0.15)',   border: '#ec4899' },
    orange: { bg: 'rgba(249,115,22,0.15)',   border: '#f97316' },
  };

  const colorArray = Object.values(CHART_COLORS);

  /* ── Stats Summary ──────────────────────────────────────── */
  function getStats() {
    const apps    = DB.findAll('applications');
    const users   = DB.findAll('users');
    const docs    = DB.findAll('documents');

    const total      = apps.length;
    const approved   = apps.filter(a => a.status === 'Approved' || a.status === 'Completed').length;
    const pending    = apps.filter(a => !['Approved','Completed','Returned','Draft'].includes(a.status)).length;
    const returned   = apps.filter(a => a.status === 'Returned').length;
    const drafts     = apps.filter(a => a.status === 'Draft').length;
    const applicants = users.filter(u => u.role === 'applicant').length;
    const staffCount = users.filter(u => u.role === 'staff').length;

    // Average processing time (submitted to approved)
    const completedApps = apps.filter(a => a.status === 'Approved' && a.submittedAt);
    let avgDays = 0;
    if (completedApps.length) {
      const totalDays = completedApps.reduce((sum, a) => sum + Utils.daysAgo(a.submittedAt), 0);
      avgDays = Math.round(totalDays / completedApps.length);
    }

    return { total, approved, pending, returned, drafts, applicants, staffCount, avgDays, docs: docs.length };
  }

  /* ── By Status ──────────────────────────────────────────── */
  function getByStatus() {
    const apps = DB.findAll('applications').filter(a => a.status !== 'Draft');
    const counts = {};
    apps.forEach(a => { counts[a.status] = (counts[a.status]||0) + 1; });
    return Object.entries(counts).sort((a,b) => b[1]-a[1]);
  }

  /* ── By Barangay ────────────────────────────────────────── */
  function getByBarangay() {
    const apps = DB.findAll('applications').filter(a => a.barangay);
    const counts = {};
    apps.forEach(a => { counts[a.barangay] = (counts[a.barangay]||0) + 1; });
    return Object.entries(counts).sort((a,b) => b[1]-a[1]);
  }

  /* ── By Project Type ────────────────────────────────────── */
  function getByType() {
    const apps = DB.findAll('applications');
    const counts = {};
    apps.forEach(a => { if(a.projectType) counts[a.projectType] = (counts[a.projectType]||0) + 1; });
    return Object.entries(counts).sort((a,b) => b[1]-a[1]);
  }

  /* ── Volume Over Time (monthly) ─────────────────────────── */
  function getVolumeOverTime() {
    const apps = DB.findAll('applications').filter(a => a.submittedAt);
    const monthly = {};
    apps.forEach(a => {
      const d   = new Date(a.submittedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      monthly[key] = (monthly[key]||0) + 1;
    });
    // Fill last 6 months
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const d   = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const month = d.toLocaleString('en-PH', { month:'short', year:'numeric' });
      result.push({ month, count: monthly[key] || 0 });
    }
    return result;
  }

  /* ── Chart Renderers ────────────────────────────────────── */
  function renderStatusChart(canvasId) {
    const data = getByStatus();
    const STATUS_COLORS_MAP = {
      'Submitted':               '#3b82f6',
      'Initial Validation':      '#f59e0b',
      'Document Review':         '#f59e0b',
      'Location Review':         '#06b6d4',
      'MPDO Review':             '#8b5cf6',
      'Additional Requirements': '#ef4444',
      'For Approval':            '#06b6d4',
      'Approved':                '#10b981',
      'Returned':                '#ef4444',
      'Completed':               '#10b981',
    };
    return createChart(canvasId, {
      type: 'doughnut',
      data: {
        labels: data.map(d => d[0]),
        datasets: [{
          data:            data.map(d => d[1]),
          backgroundColor: data.map(d => STATUS_COLORS_MAP[d[0]] + '99' || '#64748b99'),
          borderColor:     data.map(d => STATUS_COLORS_MAP[d[0]]  || '#64748b'),
          borderWidth: 2, hoverOffset: 6
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { padding: 16, usePointStyle: true } },
          tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw} application${ctx.raw!==1?'s':''}` } }
        },
        cutout: '65%'
      }
    });
  }

  function renderBarangayChart(canvasId) {
    const data = getByBarangay().slice(0, 10);
    return createChart(canvasId, {
      type: 'bar',
      data: {
        labels: data.map(d => d[0]),
        datasets: [{
          label: 'Applications',
          data:  data.map(d => d[1]),
          backgroundColor: data.map((_,i) => colorArray[i % colorArray.length].bg),
          borderColor:     data.map((_,i) => colorArray[i % colorArray.length].border),
          borderWidth: 2, borderRadius: 6
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  function renderTypeChart(canvasId) {
    const data = getByType();
    return createChart(canvasId, {
      type: 'bar',
      data: {
        labels: data.map(d => d[0]),
        datasets: [{
          label: 'Count',
          data:  data.map(d => d[1]),
          backgroundColor: [
            'rgba(59,130,246,0.2)','rgba(139,92,246,0.2)','rgba(16,185,129,0.2)',
            'rgba(245,158,11,0.2)','rgba(239,68,68,0.2)','rgba(6,182,212,0.2)'
          ],
          borderColor: ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4'],
          borderWidth: 2, borderRadius: 8
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { grid: { display: false } }
        }
      }
    });
  }

  function renderVolumeChart(canvasId) {
    const data = getVolumeOverTime();
    return createChart(canvasId, {
      type: 'line',
      data: {
        labels: data.map(d => d.month),
        datasets: [{
          label: 'Applications Submitted',
          data:  data.map(d => d.count),
          backgroundColor: 'rgba(59,130,246,0.1)',
          borderColor:     '#3b82f6',
          borderWidth: 2.5, fill: true, tension: 0.4,
          pointBackgroundColor: '#3b82f6', pointRadius: 5,
          pointHoverRadius: 8
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  /* ── Render Full Reports Page ───────────────────────────── */
  function renderReportsPage(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const stats     = getStats();
    const byBarangay = getByBarangay();

    container.innerHTML = `
    <div class="page-header">
      <h1>Reports & Analytics</h1>
      <p>Overview of building permit application data and statistics.</p>
    </div>

    <!-- Summary Stats -->
    <div class="grid grid-4 gap-6 mb-8">
      <div class="stat-card" data-color="blue">
        <div class="stat-icon stat-icon-blue">📋</div>
        <div class="stat-info">
          <div class="stat-value">${stats.total}</div>
          <div class="stat-label">Total Applications</div>
        </div>
      </div>
      <div class="stat-card" data-color="green">
        <div class="stat-icon stat-icon-green">✅</div>
        <div class="stat-info">
          <div class="stat-value">${stats.approved}</div>
          <div class="stat-label">Approved</div>
        </div>
      </div>
      <div class="stat-card" data-color="yellow">
        <div class="stat-icon stat-icon-yellow">⏳</div>
        <div class="stat-info">
          <div class="stat-value">${stats.pending}</div>
          <div class="stat-label">Pending Review</div>
        </div>
      </div>
      <div class="stat-card" data-color="cyan">
        <div class="stat-icon stat-icon-cyan">⏱️</div>
        <div class="stat-info">
          <div class="stat-value">${stats.avgDays || '—'}</div>
          <div class="stat-label">Avg. Processing Days</div>
        </div>
      </div>
    </div>

    <!-- Charts Row 1 -->
    <div class="grid grid-2 gap-6 mb-6">
      <div class="card">
        <div class="card-header">
          <div class="card-title">📊 Applications by Status</div>
          <button class="btn btn-ghost btn-sm" onclick="Reports.exportStatusCSV()">⬇ Export</button>
        </div>
        <div style="height:280px;position:relative"><canvas id="chart-status"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header">
          <div class="card-title">📈 Monthly Volume</div>
        </div>
        <div style="height:280px;position:relative"><canvas id="chart-volume"></canvas></div>
      </div>
    </div>

    <!-- Charts Row 2 -->
    <div class="grid grid-2 gap-6 mb-6">
      <div class="card">
        <div class="card-header">
          <div class="card-title">🏘️ Applications by Barangay</div>
          <button class="btn btn-ghost btn-sm" onclick="Reports.exportBarangayCSV()">⬇ Export</button>
        </div>
        <div style="height:280px;position:relative"><canvas id="chart-barangay"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header">
          <div class="card-title">🏗️ Applications by Project Type</div>
        </div>
        <div style="height:280px;position:relative"><canvas id="chart-type"></canvas></div>
      </div>
    </div>

    <!-- Barangay Table -->
    <div class="card mb-6">
      <div class="card-header">
        <div class="card-title">🏘️ Barangay Distribution Table</div>
        <span class="badge badge-muted">Top Barangays</span>
      </div>
      <div class="table-responsive">
      <table class="data-table">
        <thead><tr><th>Barangay</th><th>Applications</th><th>Approved</th><th>Pending</th><th>Distribution</th></tr></thead>
        <tbody>
          ${byBarangay.map(([brgy, count]) => {
            const apps     = DB.findAll('applications').filter(a => a.barangay === brgy);
            const approved = apps.filter(a => a.status==='Approved'||a.status==='Completed').length;
            const pending  = apps.filter(a => !['Approved','Completed','Returned','Draft'].includes(a.status)).length;
            const pct      = stats.total > 0 ? Math.round((count/stats.total)*100) : 0;
            return `<tr>
              <td><strong>${Utils.sanitize(brgy)}</strong></td>
              <td>${count}</td>
              <td><span class="text-success">${approved}</span></td>
              <td><span class="text-warning">${pending}</span></td>
              <td>
                <div class="flex items-center gap-2">
                  <div style="flex:1;height:6px;background:var(--border);border-radius:999px;overflow:hidden">
                    <div style="width:${pct}%;height:100%;background:var(--primary);border-radius:999px"></div>
                  </div>
                  <span class="text-xs text-muted">${pct}%</span>
                </div>
              </td>
            </tr>`;
          }).join('')}
          ${!byBarangay.length ? `<tr><td colspan="5" class="text-center text-muted">No data available</td></tr>` : ''}
        </tbody>
      </table>
      </div>
    </div>

    <div class="alert alert-info">
      <div class="alert-icon">ℹ️</div>
      <div class="alert-content">
        <div class="alert-title">AI Analytics Disclosure</div>
        All analytics and trend data presented here are system-generated summaries for reference purposes only.
        They do not constitute official government reports or determinations.
      </div>
    </div>`;

    // Render charts after DOM is ready
    setTimeout(() => {
      renderStatusChart('chart-status');
      renderVolumeChart('chart-volume');
      renderBarangayChart('chart-barangay');
      renderTypeChart('chart-type');
    }, 100);
  }

  /* ── CSV Export ─────────────────────────────────────────── */
  function exportStatusCSV() {
    const data = getByStatus();
    Utils.downloadCSV([['Status','Count'], ...data], 'applications_by_status.csv');
    Audit.log(Auth.getSession()?.userId||'system', 'REPORT_GENERATED', 'Report', 'status-csv', 'Exported applications by status CSV');
    Utils.toast('Report exported successfully', 'success');
  }

  function exportBarangayCSV() {
    const data = getByBarangay();
    Utils.downloadCSV([['Barangay','Count'], ...data], 'applications_by_barangay.csv');
    Utils.toast('Report exported successfully', 'success');
  }

  function exportAllApplicationsCSV() {
    const apps = DB.findAll('applications');
    const rows = [
      ['App Number','Project Name','Type','Status','Barangay','Est. Cost','Submitted','Applicant ID'],
      ...apps.map(a => [
        a.applicationNumber, a.projectName, a.projectType, a.status,
        a.barangay, a.estimatedCost, a.submittedAt, a.applicantId
      ])
    ];
    Utils.downloadCSV(rows, 'all_applications.csv');
    Utils.toast('All applications exported', 'success');
  }

  return {
    getStats, getByStatus, getByBarangay, getByType, getVolumeOverTime,
    renderStatusChart, renderBarangayChart, renderTypeChart, renderVolumeChart,
    renderReportsPage,
    exportStatusCSV, exportBarangayCSV, exportAllApplicationsCSV
  };
})();

window.Reports = Reports;

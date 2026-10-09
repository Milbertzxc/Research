/* ============================================================
   MPDO — AI Simulation Engine
   ============================================================ */

const AI = (() => {

  /* ── Document Classification Keywords ─────────────────── */
  const DOC_TYPES = [
    { type: 'Application Form',              keywords: ['application','form','permit','accomplished','bp form'], confidence: 97 },
    { type: 'Architectural/Building Plans',  keywords: ['plan','architectural','blueprint','floor plan','elevation','building plan','section'], confidence: 92 },
    { type: 'Structural Plans',              keywords: ['structural','computation','analysis','design','footing','column','beam'], confidence: 90 },
    { type: 'Land Title (TCT/OCT)',          keywords: ['title','tct','oct','transfer certificate','transfer of title'], confidence: 95 },
    { type: 'Tax Declaration',               keywords: ['tax','declaration','td','assessed value','real property'], confidence: 93 },
    { type: 'Barangay Clearance',            keywords: ['barangay','clearance','brgy','captain','certificate'], confidence: 91 },
    { type: 'Zoning Clearance',              keywords: ['zoning','zone','land use','mpdo','zoning clearance'], confidence: 94 },
    { type: 'Fire Safety Clearance (FSEC)', keywords: ['fire','bfp','fire safety','fsec','fire protection','bureau of fire'], confidence: 96 },
    { type: 'Professional License (PRC)',    keywords: ['prc','license','professional','architect','engineer','renewal'], confidence: 93 },
    { type: 'Location/Vicinity Map',         keywords: ['location','map','vicinity','sketch','site plan'], confidence: 88 },
    { type: 'Bill of Materials',             keywords: ['bill','materials','specifications','bom','estimate'], confidence: 87 },
    { type: "Owner's Valid ID",              keywords: ['id','identification','philsys','passport','license','voter'], confidence: 90 },
    { type: 'Sanitary/Plumbing Plans',       keywords: ['sanitary','plumbing','drainage','sewage'], confidence: 89 },
    { type: 'Electrical Plans',              keywords: ['electrical','wiring','circuit','power','panel'], confidence: 91 },
  ];

  function classifyDocument(filename, fileType) {
    const name = (filename || '').toLowerCase();
    let best = { type: 'Unknown Document', confidence: 45, matched: false };

    for (const dt of DOC_TYPES) {
      for (const kw of dt.keywords) {
        if (name.includes(kw)) {
          const conf = Math.min(99, dt.confidence + Utils.randomBetween(-5, 5));
          if (conf > best.confidence) {
            best = { type: dt.type, confidence: conf, matched: true };
          }
          break;
        }
      }
    }

    // File-type hints
    if (!best.matched) {
      if (fileType === 'dwg') best = { type: 'Technical Drawing (CAD)', confidence: 82, matched: true };
      if (fileType === 'xlsx') best = { type: 'Spreadsheet/Bill of Materials', confidence: 78, matched: true };
    }

    return {
      detectedType: best.type,
      confidence:   best.confidence,
      confidenceLabel: confidenceLabel(best.confidence),
      isReliable:   best.confidence >= 75
    };
  }

  function confidenceLabel(score) {
    if (score >= 90) return 'Very High';
    if (score >= 75) return 'High';
    if (score >= 60) return 'Moderate';
    if (score >= 45) return 'Low';
    return 'Very Low';
  }

  /* ── Requirement Checking ─────────────────────────────── */
  function checkRequirements(applicationId) {
    const requirements  = DB.findAll('requirements');
    const uploadedDocs  = DB.findBy('documents','applicationId', applicationId);
    const uploadedReqs  = uploadedDocs.map(d => d.requirementId);

    const required   = requirements.filter(r => r.required);
    const optional   = requirements.filter(r => !r.required);

    const missingRequired = required.filter(r => !uploadedReqs.includes(r.id));
    const missingOptional = optional.filter(r => !uploadedReqs.includes(r.id));

    const completenessScore = Math.round(
      ((required.length - missingRequired.length) / required.length) * 100
    );

    const uploadedWithStatus = uploadedDocs.map(d => {
      const req = requirements.find(r => r.id === d.requirementId);
      return { ...d, requirementName: req ? req.name : 'Unknown' };
    });

    return {
      completenessScore,
      totalRequired:    required.length,
      totalOptional:    optional.length,
      uploadedCount:    uploadedDocs.length,
      missingRequired:  missingRequired.map(r => ({ id: r.id, name: r.name, code: r.code })),
      missingOptional:  missingOptional.map(r => ({ id: r.id, name: r.name, code: r.code })),
      uploadedDocs:     uploadedWithStatus,
      isComplete:       missingRequired.length === 0
    };
  }

  /* ── Priority Scoring ─────────────────────────────────── */
  function prioritizeApplication(app) {
    const completeness = checkRequirements(app.id);
    const daysWaiting  = Utils.daysAgo(app.submittedAt || app.createdAt);
    const stageWeight  = Workflow.getStageWeight(app.status);

    // Base components (0-100 scale)
    const completenessScore = completeness.completenessScore * 0.35;
    const urgencyScore      = Math.min(40, daysWaiting * 1.8) * 0.30; // max 40 days
    const stageScore        = (stageWeight / 100 * 50) * 0.25; // stage progression
    const flagPenalty       = getAIResult(app.id)?.flags?.length * 3 || 0; // -3 per flag

    // Bonuses
    let bonus = 0;
    if (app.projectType === 'Commercial' || app.projectType === 'Industrial') bonus += 5;
    if (app.estimatedCost > 5000000) bonus += 3;

    const rawScore = Math.min(99, Math.max(1,
      completenessScore + urgencyScore + stageScore - flagPenalty + bonus
    ));
    const score = Math.round(rawScore);

    const reasons = [];
    reasons.push(`Completeness: ${completeness.completenessScore}% (${completeness.uploadedCount} docs uploaded)`);
    reasons.push(`Waiting: ${daysWaiting} days since submission`);
    reasons.push(`Stage: ${app.status} (${stageWeight}% progress)`);
    if (completeness.missingRequired.length) reasons.push(`⚠️ ${completeness.missingRequired.length} required document(s) missing`);
    if (flagPenalty) reasons.push(`AI flags: ${getAIResult(app.id)?.flags?.length || 0} issue(s) flagged`);

    const priorityLabel = score >= 75 ? 'High' : score >= 45 ? 'Medium' : 'Low';
    const priorityColor = score >= 75 ? 'danger' : score >= 45 ? 'warning' : 'success';

    return { score, priorityLabel, priorityColor, reasons, completeness };
  }

  function getAIResult(applicationId) {
    return DB.findOne('aiResults', 'applicationId', applicationId);
  }

  /* ── Inconsistency Detection ──────────────────────────── */
  function detectInconsistencies(application) {
    const flags = [];
    const docs  = DB.findBy('documents','applicationId', application.id);

    // Location: coordinates vs barangay
    if (application.latitude && application.longitude && application.barangay) {
      const barangay = DB.findOne('barangays','name', application.barangay);
      if (barangay) {
        const dist = getDistance(application.latitude, application.longitude, barangay.lat, barangay.lng);
        if (dist > 5) { // more than 5km from barangay center
          flags.push(`Location coordinates are ${dist.toFixed(1)}km from the indicated barangay center (${application.barangay}). Please verify.`);
        }
      }
    }

    // Check coordinate bounds (Philippines)
    if (application.latitude && application.longitude) {
      if (!Utils.validateCoordinates(application.latitude, application.longitude)) {
        flags.push('Project coordinates appear to be outside the Philippine geographic boundary. Please verify.');
      }
    }

    // Cost sanity check
    if (application.estimatedCost && application.numberOfFloors) {
      const costPerFloor = application.estimatedCost / application.numberOfFloors;
      if (costPerFloor < 50000) {
        flags.push(`Estimated cost per floor (₱${Utils.formatNumber(Math.round(costPerFloor))}) appears unusually low. Please verify project cost.`);
      }
    }

    // PRC license check (simulated expiry check by looking at doc names)
    const prcDocs = docs.filter(d => d.requirementId === 'REQ-08');
    prcDocs.forEach(doc => {
      if (doc.fileName.toLowerCase().includes('2022') || doc.fileName.toLowerCase().includes('2023')) {
        flags.push(`PRC License document (${doc.fileName}) may be expired based on filename. Please verify validity.`);
      }
    });

    // Missing required docs
    const req = checkRequirements(application.id);
    if (req.missingRequired.length >= 5) {
      flags.push(`Application has ${req.missingRequired.length} missing required documents — submission completeness is very low (${req.completenessScore}%).`);
    }

    return flags;
  }

  function getDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2-lat1) * Math.PI/180;
    const dLng = (lng2-lng1) * Math.PI/180;
    const a = Math.sin(dLat/2)*Math.sin(dLat/2)+
              Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*
              Math.sin(dLng/2)*Math.sin(dLng/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  /* ── Full Analysis ────────────────────────────────────── */
  function analyzeApplication(applicationId) {
    const app = DB.findById('applications', applicationId);
    if (!app) return null;

    const completeness = checkRequirements(applicationId);
    const priority     = prioritizeApplication(app);
    const flags        = detectInconsistencies(app);
    const docs         = DB.findBy('documents','applicationId', applicationId);

    // Classify all docs
    const classifications = docs.map(d => ({
      docId:      d.id,
      fileName:   d.fileName,
      ...classifyDocument(d.fileName, d.fileType)
    }));

    // Build/update AI result
    const existing = DB.findOne('aiResults','applicationId', applicationId);
    const aiResult = {
      id:                existing ? existing.id : Utils.generateId('AIR'),
      applicationId,
      analyzedAt:        new Date().toISOString(),
      completenessScore: completeness.completenessScore,
      priorityScore:     priority.score,
      missingDocs:       completeness.missingRequired.map(r => `${r.code} - ${r.name}`),
      flags,
      classifications,
      priorityReason:    priority.reasons.join('; '),
      inconsistencies:   flags,
      overridden:        existing?.overridden || false
    };

    if (existing) {
      DB.update('aiResults', existing.id, aiResult);
    } else {
      DB.insert('aiResults', aiResult);
    }

    // Update application priority score
    DB.update('applications', applicationId, {
      priorityScore: priority.score,
      aiAnalyzed:    true
    });

    Audit.log(Auth.getSession()?.userId || 'system', 'AI_ANALYSIS', 'Application', applicationId,
      `AI analysis completed: score ${priority.score}, ${flags.length} flags`);

    return aiResult;
  }

  function overrideAIRecommendation(applicationId, staffId, notes) {
    const result = DB.findOne('aiResults','applicationId', applicationId);
    if (result) {
      DB.update('aiResults', result.id, {
        overridden:       true,
        overriddenBy:     staffId,
        overriddenAt:     new Date().toISOString(),
        overrideNotes:    notes
      });
      Audit.log(staffId, 'AI_OVERRIDE', 'AIResult', result.id, `AI recommendation overridden: ${notes}`);
    }
  }

  /* ── Information Extraction (simulated OCR) ───────────── */
  function extractInfo(filename) {
    const name = (filename||'').toLowerCase();
    // Simulate OCR extraction based on filename hints
    const result = {
      documentType: classifyDocument(filename, '').detectedType,
      extractedFields: {}
    };

    if (name.includes('tct') || name.includes('title')) {
      result.extractedFields = {
        'Document Number': 'TCT No. T-' + Utils.randomBetween(100000, 999999),
        'Owner Name':      '(Extracted from document)',
        'Lot Area':        Utils.randomBetween(100, 1000) + ' sq.m.',
        'Location':        'San Jose, Batangas'
      };
    } else if (name.includes('tax') || name.includes('td')) {
      result.extractedFields = {
        'TD Number':       'TD-SJ-' + new Date().getFullYear() + '-' + Utils.randomBetween(1000,9999),
        'Assessed Value':  '₱' + Utils.formatNumber(Utils.randomBetween(100000, 2000000)),
        'Tax Year':        new Date().getFullYear(),
      };
    } else if (name.includes('barangay') || name.includes('clearance')) {
      result.extractedFields = {
        'Issuing Authority': 'Barangay (extracted)',
        'Validity':          'Within 3 months from issuance',
        'Purpose':           'Building Permit Application'
      };
    } else if (name.includes('prc') || name.includes('license')) {
      result.extractedFields = {
        'License Number':    'PRC-' + Utils.randomBetween(10000,99999),
        'Profession':        'Architect / Civil Engineer',
        'Expiry Date':       '(Please verify manually)',
      };
    }

    return result;
  }

  /* ── Render AI Panel ──────────────────────────────────── */
  function renderAIPanel(applicationId, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const result = DB.findOne('aiResults','applicationId', applicationId);
    if (!result) {
      container.innerHTML = `
        <div class="ai-panel">
          <div class="ai-panel-header">🤖 AI Analysis</div>
          <div class="text-secondary text-sm mb-4">No AI analysis has been performed yet.</div>
          <button class="btn btn-secondary btn-sm" onclick="AI.analyzeApplication('${applicationId}'); AI.renderAIPanel('${applicationId}','${containerId}')">
            Run AI Analysis
          </button>
          <div class="alert alert-ai mt-4"><div class="alert-icon">ℹ️</div><div class="alert-content">AI results are recommendations only and must be reviewed by authorized MPDO personnel.</div></div>
        </div>`;
      return;
    }

    const flagsHtml = result.flags.length ? result.flags.map(f => `
      <div class="flex items-start gap-2 mb-2">
        <span style="color:var(--warning)">⚠️</span>
        <span class="text-sm text-secondary">${Utils.sanitize(f)}</span>
      </div>`).join('') : '<span class="text-success text-sm">✅ No inconsistencies detected</span>';

    const missingHtml = result.missingDocs.length ? result.missingDocs.map(m => `
      <div class="flex items-center gap-2 mb-1">
        <span style="color:var(--danger)">✗</span>
        <span class="text-sm text-secondary">${Utils.sanitize(m)}</span>
      </div>`).join('') : '<span class="text-success text-sm">✅ All required documents present</span>';

    container.innerHTML = `
      <div class="ai-panel">
        <div class="ai-panel-header">
          🤖 AI Analysis Results
          ${result.overridden ? '<span class="badge badge-warning ml-2">Overridden by Staff</span>' : ''}
        </div>
        
        <div class="grid-2 grid gap-4 mb-4">
          <div>
            <div class="text-xs text-muted mb-1">Completeness Score</div>
            <div class="ai-confidence">
              <div class="confidence-bar"><div class="confidence-fill" style="width:${result.completenessScore}%"></div></div>
              <span class="font-semibold" style="color:${result.completenessScore>=70?'var(--success)':result.completenessScore>=40?'var(--warning)':'var(--danger)'}">${result.completenessScore}%</span>
            </div>
          </div>
          <div>
            <div class="text-xs text-muted mb-1">Priority Score</div>
            <div class="ai-confidence">
              <div class="confidence-bar"><div class="confidence-fill" style="width:${result.priorityScore}%"></div></div>
              <span class="font-semibold">${result.priorityScore}/100</span>
            </div>
          </div>
        </div>

        <div class="mb-4">
          <div class="text-xs text-muted font-semibold mb-2 uppercase">⚠️ Flags & Inconsistencies</div>
          ${flagsHtml}
        </div>

        <div class="mb-4">
          <div class="text-xs text-muted font-semibold mb-2 uppercase">📄 Missing Required Documents</div>
          ${missingHtml}
        </div>

        <div class="mb-4">
          <div class="text-xs text-muted font-semibold mb-2 uppercase">📋 Document Classifications</div>
          ${result.classifications.map(c => `
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm truncate" style="max-width:55%">${Utils.sanitize(c.fileName||c.docId)}</span>
              <div class="flex items-center gap-2">
                <span class="badge badge-ai text-xs">${Utils.sanitize(c.detectedType||'Unknown')}</span>
                <span class="text-xs text-muted">${c.confidence||0}%</span>
              </div>
            </div>`).join('')}
        </div>

        <div class="text-xs text-muted mb-3">Analysis performed: ${Utils.formatDateTime(result.analyzedAt)}</div>

        <div class="flex gap-2">
          <button class="btn btn-ghost btn-sm" onclick="AI.analyzeApplication('${applicationId}'); setTimeout(()=>AI.renderAIPanel('${applicationId}','${containerId}'),300)">
            🔄 Re-analyze
          </button>
          ${!result.overridden ? `<button class="btn btn-outline-primary btn-sm" onclick="AI.showOverrideModal('${applicationId}','${containerId}')">Override Recommendation</button>` : ''}
        </div>

        <div class="alert alert-ai mt-4">
          <div class="alert-icon">ℹ️</div>
          <div class="alert-content">AI results are for assistance only. All decisions require authorized MPDO personnel review.</div>
        </div>
      </div>`;
  }

  function showOverrideModal(applicationId, containerId) {
    const modal = document.getElementById('ai-override-modal');
    if (modal) {
      modal.dataset.appId     = applicationId;
      modal.dataset.container = containerId;
      modal.classList.remove('hidden');
    } else {
      const notes = prompt('Enter reason for overriding AI recommendation:');
      if (notes) {
        const session = Auth.getSession();
        overrideAIRecommendation(applicationId, session.userId, notes);
        renderAIPanel(applicationId, containerId);
        Utils.toast('AI recommendation overridden by staff.', 'success');
      }
    }
  }

  return {
    classifyDocument, checkRequirements, prioritizeApplication,
    detectInconsistencies, analyzeApplication, overrideAIRecommendation,
    extractInfo, renderAIPanel, showOverrideModal, getAIResult
  };
})();

window.AI = AI;

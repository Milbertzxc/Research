/* ============================================================
   MPDO — NLP Chatbot
   ============================================================ */

const Chatbot = (() => {

  let isOpen = false;

  /* ── Intent Definitions ───────────────────────────────── */
  const INTENTS = [
    {
      id: 'greeting',
      patterns: ['hello','hi','good morning','good afternoon','good evening','hey','musta','kumusta'],
      response: () => `Hello! 👋 I'm **MPDO Assistant**, your virtual guide for building permit applications.<br><br>I can help you with:<br>• Building permit requirements<br>• How to apply online<br>• Application status queries<br>• Document requirements<br>• General MPDO procedures<br><br>What do you need help with today?`,
      suggestions: ['What are the requirements?', 'How do I apply?', 'Check my application', 'Contact MPDO']
    },
    {
      id: 'requirements',
      patterns: ['requirement','requirements','what documents','what do i need','documents needed','list of requirements','documentary requirements'],
      response: () => {
        const reqs = DB.findAll('requirements').filter(r => r.required);
        const list = reqs.map((r,i) => `${i+1}. ${r.name} (${r.code})`).join('<br>');
        return `📋 **Required Documents for Building Permit Application:**<br><br>${list}<br><br>Additional documents may be required depending on your project type. All documents must be clear, complete, and legible.<br><br><em>Note: Requirements may vary. Contact the MPDO for project-specific requirements.</em>`;
      },
      suggestions: ['What file formats are accepted?', 'What is zoning clearance?', 'How to get barangay clearance?']
    },
    {
      id: 'how_to_apply',
      patterns: ['how to apply','apply online','application process','steps','procedure','how do i apply','how to submit'],
      response: () => `📝 **How to Apply for a Building Permit Online:**<br><br>1️⃣ **Register** — Create an account if you don't have one<br>2️⃣ **Login** — Access your applicant dashboard<br>3️⃣ **Create Application** — Click "Apply Now" and fill in project details<br>4️⃣ **Pin Location** — Mark your project location on the interactive map<br>5️⃣ **Upload Documents** — Upload all required documents<br>6️⃣ **Review & Submit** — Review your application and submit<br>7️⃣ **Track Status** — Monitor your application in real time<br><br>You will receive notifications at every stage of processing.`,
      suggestions: ['What are the requirements?', 'How long does it take?', 'What file formats are accepted?']
    },
    {
      id: 'file_formats',
      patterns: ['file format','what format','accepted format','file type','pdf','jpg','png','upload format'],
      response: () => {
        const types = DB.getSetting('allowedFileTypes', ['pdf','jpg','jpeg','png']).join(', ').toUpperCase();
        const maxSize = DB.getSetting('maxFileSizeMB', 50);
        return `📎 **Accepted File Formats:**<br><br>• ${types}<br>• Maximum file size: **${maxSize} MB** per file<br><br>Tips:<br>• Scan documents at least 300 DPI for clarity<br>• Ensure documents are complete — cut-off portions may cause delays<br>• PDF files are preferred for multi-page documents`;
      },
      suggestions: ['How to apply?', 'What are the requirements?']
    },
    {
      id: 'processing_time',
      patterns: ['how long','processing time','duration','days','weeks','how many days','turnaround'],
      response: () => `⏱️ **Processing Time:**<br><br>The processing time depends on the completeness of your application and the type of project:<br><br>• Initial Validation: 1-3 business days<br>• Document Review: 3-7 business days<br>• Location/GIS Review: 1-3 business days<br>• MPDO Review: 5-10 business days<br><br>**Total:** Approximately 2-4 weeks for complete applications<br><br>Incomplete applications requiring additional requirements will take longer. Ensure all documents are submitted completely to avoid delays.`,
      suggestions: ['What are the requirements?', 'Track my application']
    },
    {
      id: 'fees',
      patterns: ['fee','fees','how much','cost','payment','assessment','charges','pay'],
      response: () => `💰 **Building Permit Fees:**<br><br>Permit fees are computed based on:<br>• Project type and classification<br>• Estimated project cost<br>• Floor area<br>• Number of floors<br><br>The fee assessment is done by MPDO personnel after reviewing your application. You will be notified of the assessed fees before payment.<br><br>📍 Payments are made at the **Municipal Treasurer's Office** or through authorized payment channels.<br><br>For specific fee inquiries, please contact the MPDO office directly.`,
      suggestions: ['How to contact MPDO?', 'How to apply?']
    },
    {
      id: 'status_check',
      patterns: ['status','track','my application','check application','where is my','application status','pending'],
      response: () => {
        const session = Auth.getSession();
        if (!session) return `🔍 **Check Application Status:**<br><br>To check your application status, please log in to your account and visit your **Applicant Dashboard**.<br><br>Your dashboard shows:<br>• Current status and stage<br>• Missing requirements<br>• Processing history<br>• MPDO remarks<br><br>Or contact the MPDO directly with your application number.`;
        const apps = DB.getApplicationsByApplicant(session.userId);
        if (!apps.length) return `🔍 You don't have any submitted applications yet. <a href="#apply" onclick="App.navigate('apply')">Click here to start a new application.</a>`;
        const list = apps.slice(0,3).map(a => `• <strong>${a.applicationNumber}</strong> — ${a.projectName}: <span class="badge ${Utils.getStatusBadgeClass(a.status)}">${a.status}</span>`).join('<br>');
        return `🔍 **Your Recent Applications:**<br><br>${list}<br><br>Click "My Applications" in the sidebar for full details.`;
      },
      suggestions: ['What does my status mean?', 'How long does it take?']
    },
    {
      id: 'status_meaning',
      patterns: ['what does','status mean','what is initial validation','what is document review','mpdo review','for approval'],
      response: () => `📊 **Application Status Guide:**<br><br>🔵 **Draft** — Application not yet submitted<br>📨 **Submitted** — Application received, awaiting review<br>🔍 **Initial Validation** — Staff checking completeness<br>📄 **Document Review** — Staff reviewing uploaded documents<br>📍 **Location Review** — GIS team verifying project location<br>👥 **MPDO Review** — Final review by planning officials<br>⚠️ **Additional Requirements** — More documents needed<br>✅ **For Approval** — Application endorsed for approval<br>🎉 **Approved** — Building permit approved!<br>↩️ **Returned** — Application needs major corrections`,
      suggestions: ['How long does it take?', 'What do I do if I need to submit more documents?']
    },
    {
      id: 'additional_requirements',
      patterns: ['additional requirement','more documents','revision','rejected','returned','what to do'],
      response: () => `📤 **If Additional Requirements Are Requested:**<br><br>1. Log in to your applicant account<br>2. Go to "My Applications"<br>3. Open the application with status "Additional Requirements"<br>4. Read the remarks from MPDO staff<br>5. Upload the requested documents<br>6. The MPDO will be notified automatically<br><br>⚠️ Please respond promptly to avoid further delays. Your application remains on hold until the requested documents are submitted.`,
      suggestions: ['How to upload documents?', 'Contact MPDO']
    },
    {
      id: 'barangay_clearance',
      patterns: ['barangay clearance','brgy clearance','how to get clearance','barangay captain'],
      response: () => `🏘️ **How to Get a Barangay Clearance:**<br><br>1. Visit your barangay hall<br>2. Request a clearance for building permit purposes<br>3. Present proof of property ownership or authorization<br>4. Pay the required barangay fee<br>5. The clearance is usually issued within the same day<br><br>⚠️ The barangay clearance must be current (usually valid for 3-6 months). Upload a clear, complete scan.`,
      suggestions: ['What are the requirements?', 'Zoning clearance']
    },
    {
      id: 'zoning',
      patterns: ['zoning','zoning clearance','land use','zone','land classification'],
      response: () => `🗺️ **Zoning Clearance:**<br><br>A Zoning Clearance confirms that your proposed construction is consistent with the land use classification of the area.<br><br>**Where to get it:**<br>• From the MPDO (Municipal Planning and Development Office)<br>• Same office where you are applying for the building permit<br><br>You may request the zoning clearance in person or ask the MPDO staff during your application process.<br><br>⚠️ The proposed use of your building must match the zone (residential, commercial, industrial, etc.)`,
      suggestions: ['Requirements list', 'How to apply?']
    },
    {
      id: 'prc_license',
      patterns: ['prc','professional license','architect','engineer','licensed professional','supervising'],
      response: () => `👷 **PRC License Requirement:**<br><br>A valid PRC (Professional Regulation Commission) license is required from the licensed professional who designed and will supervise the construction:<br><br>• **Architect** — for architectural design<br>• **Civil Engineer** — for structural design<br>• **Sanitary Engineer** — for plumbing/sanitary plans<br>• **Electrical Engineer** — for electrical plans<br><br>The license must be **valid and current** (not expired). Upload both the front and back of the PRC ID card or the renewal certificate.`,
      suggestions: ['Requirements list', 'What documents are needed?']
    },
    {
      id: 'map_location',
      patterns: ['map','pin location','gis','coordinates','latitude','longitude','how to pin','location map'],
      response: () => `📍 **How to Set Your Project Location on the Map:**<br><br>1. In the application form (Step 3: Location), click **"Open Map"**<br>2. Use the search bar to find your area, or navigate manually<br>3. Click on the map to drop a pin at your project site<br>4. Drag the pin to adjust the exact location<br>5. Click **"Confirm Location"** to save<br><br>The system will automatically fill in the coordinates.<br><br>⚠️ Please ensure the pin is as accurate as possible. MPDO staff will verify the location on the GIS system.`,
      suggestions: ['How to apply?', 'What is location validation?']
    },
    {
      id: 'contact',
      patterns: ['contact','office hours','telephone','phone number','email','address','visit','office'],
      response: () => {
        const settings = DB.getSetting;
        return `📞 **Contact MPDO:**<br><br>🏢 <strong>${DB.getSetting('municipalityName','MPDO')}</strong><br>📍 ${DB.getSetting('officeAddress','Municipal Hall')}<br>📞 ${DB.getSetting('officePhone','Contact Office')}<br>📧 ${DB.getSetting('officeEmail','mpdo@gov.ph')}<br><br>⏰ **Office Hours:**<br>Monday – Friday: 8:00 AM – 5:00 PM<br>(Except holidays)<br><br>For urgent concerns, please visit the office in person with your application number.`;
      },
      suggestions: ['How to apply?', 'Check application status']
    },
    {
      id: 'thanks',
      patterns: ['thank','thanks','thank you','salamat','ty','ok thanks'],
      response: () => `You're welcome! 😊 Feel free to ask if you have more questions. Good luck with your application! 🏗️`,
      suggestions: ['Back to main menu', 'Contact MPDO']
    },
    {
      id: 'fallback',
      patterns: [],
      response: (msg) => `I'm sorry, I don't have a specific answer for "<em>${Utils.sanitize(msg)}</em>".<br><br>You can try asking about:<br>• Building permit requirements<br>• Application process<br>• Document upload<br>• Application status<br><br>For complex or specific inquiries, please contact the MPDO office directly at <strong>${DB.getSetting('officePhone','(043) 000-0000')}</strong>.`,
      suggestions: ['Requirements', 'How to apply?', 'Contact MPDO', 'Check my application']
    }
  ];

  /* ── Intent Detection ─────────────────────────────────── */
  function detectIntent(message) {
    const clean = message.toLowerCase().replace(/[^a-z0-9\s]/g,'').trim();
    if (!clean) return INTENTS.find(i => i.id === 'greeting');

    for (const intent of INTENTS) {
      if (intent.id === 'fallback') continue;
      for (const pattern of intent.patterns) {
        if (clean.includes(pattern)) return intent;
      }
    }
    return INTENTS.find(i => i.id === 'fallback');
  }

  /* ── Process Message ──────────────────────────────────── */
  function processMessage(message) {
    const intent   = detectIntent(message);
    const response = intent.response(message);
    return {
      response,
      suggestions: intent.suggestions || []
    };
  }

  /* ── UI Management ────────────────────────────────────── */
  function init() {
    const fab    = document.getElementById('chatbot-fab');
    const window_ = document.getElementById('chatbot-window');
    const closeBtn= document.getElementById('chatbot-close');
    const input   = document.getElementById('chatbot-input');
    const sendBtn = document.getElementById('chatbot-send');
    const msgs    = document.getElementById('chatbot-messages');
    const suggs   = document.getElementById('chatbot-suggestions');

    if (!fab || !window_) return;

    fab.addEventListener('click', () => toggleChat());
    closeBtn?.addEventListener('click', () => toggleChat(false));
    sendBtn?.addEventListener('click', () => sendMessage());
    input?.addEventListener('keypress', e => { if (e.key === 'Enter') sendMessage(); });

    // Initial bot greeting
    if (msgs && !msgs.dataset.initialized) {
      msgs.dataset.initialized = 'true';
      setTimeout(() => {
        addBotMessage("👋 Hello! I'm the **MPDO Assistant**. How can I help you with your building permit application?");
        showSuggestions(['What are the requirements?', 'How do I apply?', 'Check my application', 'Contact MPDO']);
      }, 500);
    }
  }

  function toggleChat(forceOpen = null) {
    const window_ = document.getElementById('chatbot-window');
    const fab     = document.getElementById('chatbot-fab');
    if (!window_) return;

    isOpen = forceOpen !== null ? forceOpen : !isOpen;
    window_.classList.toggle('hidden', !isOpen);
    if (fab) fab.textContent = isOpen ? '✕' : '💬';
  }

  function sendMessage() {
    const input = document.getElementById('chatbot-input');
    if (!input) return;
    const message = input.value.trim();
    if (!message) return;

    input.value = '';
    addUserMessage(message);

    // Typing indicator
    const typing = addTypingIndicator();

    setTimeout(() => {
      typing.remove();
      const { response, suggestions } = processMessage(message);
      addBotMessage(response);
      showSuggestions(suggestions);
    }, Utils.randomBetween(600, 1400));
  }

  function addUserMessage(text) {
    const msgs = document.getElementById('chatbot-messages');
    if (!msgs) return;
    const div = document.createElement('div');
    div.className = 'chat-msg user';
    div.textContent = text;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function addBotMessage(html) {
    const msgs = document.getElementById('chatbot-messages');
    if (!msgs) return;
    const div = document.createElement('div');
    div.className = 'chat-msg bot';
    div.innerHTML = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function addTypingIndicator() {
    const msgs = document.getElementById('chatbot-messages');
    if (!msgs) return document.createElement('div');
    const div = document.createElement('div');
    div.className = 'chat-msg bot';
    div.innerHTML = '<div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>';
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
  }

  function showSuggestions(suggestions) {
    const suggs = document.getElementById('chatbot-suggestions');
    if (!suggs || !suggestions.length) return;
    suggs.innerHTML = suggestions.map(s => `
      <button class="suggestion-chip" onclick="Chatbot.handleSuggestion('${Utils.sanitize(s)}')">${Utils.sanitize(s)}</button>
    `).join('');
  }

  function handleSuggestion(text) {
    const input = document.getElementById('chatbot-input');
    if (input) { input.value = text; }
    sendMessage();
  }

  return { init, toggleChat, sendMessage, handleSuggestion, processMessage };
})();

window.Chatbot = Chatbot;

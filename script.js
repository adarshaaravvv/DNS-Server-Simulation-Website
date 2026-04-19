/* =============================================
   DNS SERVER — JAVASCRIPT ENGINE
   Simulates a DNS server with client-server
   architecture: Forward & Reverse lookups,
   zone file management, logging.
   ============================================= */

// ── DNS Zone File (Server-side database) ──────────────────────────────────
const DNS_RECORDS = [
  // A Records (domain → IPv4)
  { domain: 'google.com',        type: 'A',     value: '142.250.80.46',    ttl: 300,   class: 'IN' },
  { domain: 'www.google.com',    type: 'CNAME', value: 'google.com',       ttl: 300,   class: 'IN' },
  { domain: 'youtube.com',       type: 'A',     value: '142.250.31.91',    ttl: 300,   class: 'IN' },
  { domain: 'github.com',        type: 'A',     value: '140.82.121.3',     ttl: 60,    class: 'IN' },
  { domain: 'stackoverflow.com', type: 'A',     value: '151.101.193.69',   ttl: 600,   class: 'IN' },
  { domain: 'wikipedia.org',     type: 'A',     value: '185.15.58.224',    ttl: 600,   class: 'IN' },
  { domain: 'cloudflare.com',    type: 'A',     value: '104.16.132.229',   ttl: 300,   class: 'IN' },
  { domain: 'amazon.com',        type: 'A',     value: '54.239.28.85',     ttl: 60,    class: 'IN' },
  { domain: 'microsoft.com',     type: 'A',     value: '20.236.44.162',    ttl: 3600,  class: 'IN' },
  { domain: 'apple.com',         type: 'A',     value: '17.253.144.10',    ttl: 3600,  class: 'IN' },
  { domain: 'twitter.com',       type: 'A',     value: '104.244.42.193',   ttl: 30,    class: 'IN' },
  { domain: 'facebook.com',      type: 'A',     value: '157.240.22.35',    ttl: 120,   class: 'IN' },
  { domain: 'netflix.com',       type: 'A',     value: '54.74.212.161',    ttl: 60,    class: 'IN' },
  { domain: 'reddit.com',        type: 'A',     value: '151.101.65.140',   ttl: 300,   class: 'IN' },
  { domain: 'linkedin.com',      type: 'A',     value: '108.174.10.10',    ttl: 60,    class: 'IN' },
  { domain: 'example.com',       type: 'A',     value: '93.184.216.34',    ttl: 86400, class: 'IN' },

  // AAAA Records (domain → IPv6)
  { domain: 'google.com',        type: 'AAAA',  value: '2404:6800:4007:81f::200e', ttl: 300, class: 'IN' },
  { domain: 'cloudflare.com',    type: 'AAAA',  value: '2606:4700::6810:84e5',     ttl: 300, class: 'IN' },

  // MX Records
  { domain: 'google.com',        type: 'MX',    value: 'smtp.google.com',  ttl: 3600,  class: 'IN' },
  { domain: 'example.com',       type: 'MX',    value: 'mail.example.com', ttl: 3600,  class: 'IN' },

  // NS Records
  { domain: 'google.com',        type: 'NS',    value: 'ns1.google.com',   ttl: 21600, class: 'IN' },
  { domain: 'example.com',       type: 'NS',    value: 'a.iana-servers.net', ttl: 86400, class: 'IN' },

  // PTR Records (Reverse DNS: IP → domain)
  { domain: '46.80.250.142.in-addr.arpa', type: 'PTR', value: 'google.com',      ttl: 300,  class: 'IN' },
  { domain: '3.121.82.140.in-addr.arpa',  type: 'PTR', value: 'github.com',      ttl: 60,   class: 'IN' },
];

// ── State ──────────────────────────────────────────────────────────────────
let queryCount = 0;
let totalLatency = 0;
let filteredRecords = [...DNS_RECORDS];

// ── Utility: Simulated network latency ─────────────────────────────────────
function simulateLatency() {
  return Math.floor(Math.random() * 60) + 8; // 8–68 ms
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Timestamp ──────────────────────────────────────────────────────────────
function timestamp() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  const ms = String(now.getMilliseconds()).padStart(3, '0');
  return `${h}:${m}:${s}.${ms}`;
}

// ── Log System ─────────────────────────────────────────────────────────────
function log(message, type = 'system') {
  const logBody = document.getElementById('logBody');
  const line = document.createElement('div');
  line.className = `log-line ${type}`;
  line.textContent = `[${timestamp()}] ${message}`;
  logBody.appendChild(line);
  logBody.scrollTop = logBody.scrollHeight;
}

function clearLogs() {
  const logBody = document.getElementById('logBody');
  logBody.innerHTML = '';
  log('Logs cleared.', 'system');
}

// ── Stats Update ───────────────────────────────────────────────────────────
function updateStats(latencyMs) {
  queryCount++;
  totalLatency += latencyMs;
  const qEl = document.getElementById('statQueries');
  const lEl = document.getElementById('statLatency');
  const rEl = document.getElementById('statRecords');
  if (qEl) qEl.textContent = queryCount;
  if (lEl) lEl.textContent = Math.round(totalLatency / queryCount);
  if (rEl) rEl.textContent = DNS_RECORDS.length;
}

// ── Toast ──────────────────────────────────────────────────────────────────
function showToast(message, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = message;
  t.className = `toast ${type} show`;
  setTimeout(() => { t.className = 'toast'; }, 2500);
}

// ── Forward DNS Lookup: domain → IP ───────────────────────────────────────
async function forwardLookup() {
  const input = document.getElementById('domainInput');
  const resultBox = document.getElementById('forwardResult');
  const btn = document.getElementById('forwardBtn');
  const raw = input.value.trim().toLowerCase().replace(/^(https?:\/\/)/, '').replace(/\/$/, '');

  if (!raw) {
    showResultError(resultBox, 'Please enter a domain name.');
    return;
  }

  // Loading state
  btn.disabled = true;
  showResultLoading(resultBox, 'Querying DNS server...');
  showFlowCard('forward', raw);
  log(`CLIENT → query[A] ${raw}`, 'query');

  const latency = simulateLatency();
  await sleep(latency);

  // Search zone file (A records, then CNAME)
  const aRecords = DNS_RECORDS.filter(r => r.domain === raw && (r.type === 'A' || r.type === 'AAAA'));
  const cname = DNS_RECORDS.find(r => r.domain === raw && r.type === 'CNAME');

  btn.disabled = false;
  updateStats(latency);

  if (aRecords.length > 0) {
    const primary = aRecords.find(r => r.type === 'A') || aRecords[0];
    showResultSuccess(resultBox, {
      label: `✔  Resolved in ${latency} ms`,
      value: primary.value,
      meta: [
        { key: 'Domain', val: primary.domain },
        { key: 'Type', val: primary.type },
        { key: 'TTL', val: `${primary.ttl}s` },
        { key: 'Class', val: primary.class },
        { key: 'Latency', val: `${latency} ms` },
      ],
      extras: aRecords.length > 1 ? aRecords.slice(1).map(r => `${r.type}: ${r.value}`).join(' · ') : null
    });
    log(`SERVER → ANSWER ${raw} → ${primary.value} [TTL:${primary.ttl}]`, 'success');
    finishFlowCard();
  } else if (cname) {
    // Follow CNAME
    const target = DNS_RECORDS.find(r => r.domain === cname.value && r.type === 'A');
    const finalIP = target ? target.value : '(unresolved)';
    showResultSuccess(resultBox, {
      label: `✔  CNAME → A resolved in ${latency} ms`,
      value: finalIP,
      meta: [
        { key: 'Domain', val: raw },
        { key: 'CNAME', val: cname.value },
        { key: 'IP', val: finalIP },
        { key: 'Latency', val: `${latency} ms` },
      ]
    });
    log(`SERVER → CNAME ${raw} → ${cname.value} → ${finalIP}`, 'success');
    finishFlowCard();
  } else {
    showResultError(resultBox, `NXDOMAIN — No record found for "${raw}"`);
    log(`SERVER → NXDOMAIN for ${raw}`, 'error');
    finishFlowCard(true);
  }
}

// ── Reverse DNS Lookup: IP → domain ──────────────────────────────────────
async function reverseLookup() {
  const input = document.getElementById('ipInput');
  const resultBox = document.getElementById('reverseResult');
  const btn = document.getElementById('reverseBtn');
  const raw = input.value.trim();

  if (!raw) {
    showResultError(resultBox, 'Please enter an IP address.');
    return;
  }

  if (!isValidIP(raw)) {
    showResultError(resultBox, 'Invalid IP address format. Use e.g. 142.250.80.46');
    return;
  }

  btn.disabled = true;
  showResultLoading(resultBox, 'Performing reverse lookup...');
  showFlowCard('reverse', raw);
  log(`CLIENT → query[PTR] ${raw}`, 'query');

  const latency = simulateLatency();
  await sleep(latency);

  // Build PTR query name (reverse IP + .in-addr.arpa)
  const ptrName = raw.split('.').reverse().join('.') + '.in-addr.arpa';

  // First check PTR records
  let match = DNS_RECORDS.find(r => r.type === 'PTR' && r.domain === ptrName);

  // Also check A records by value
  if (!match) {
    const aMatch = DNS_RECORDS.find(r => (r.type === 'A') && r.value === raw);
    if (aMatch) {
      match = { domain: ptrName, type: 'PTR (inferred)', value: aMatch.domain, ttl: aMatch.ttl, class: aMatch.class };
    }
  }

  btn.disabled = false;
  updateStats(latency);

  if (match) {
    showResultSuccess(resultBox, {
      label: `✔  Reverse resolved in ${latency} ms`,
      value: match.value,
      meta: [
        { key: 'IP', val: raw },
        { key: 'PTR Name', val: ptrName },
        { key: 'Domain', val: match.value },
        { key: 'Type', val: match.type },
        { key: 'Latency', val: `${latency} ms` },
      ]
    });
    log(`SERVER → PTR ${raw} → ${match.value} [TTL:${match.ttl}]`, 'success');
    finishFlowCard();
  } else {
    showResultError(resultBox, `No PTR record found for ${raw} (${ptrName})`);
    log(`SERVER → NXDOMAIN PTR for ${raw}`, 'error');
    finishFlowCard(true);
  }
}

// ── Validation ─────────────────────────────────────────────────────────────
function isValidIP(ip) {
  const v4 = /^(\d{1,3}\.){3}\d{1,3}$/;
  const v6 = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^(([0-9a-fA-F]{1,4}:)*):([0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}$/;
  if (v4.test(ip)) {
    return ip.split('.').every(n => parseInt(n) <= 255);
  }
  return v6.test(ip);
}

// ── Result Renderers ───────────────────────────────────────────────────────
function showResultLoading(box, msg) {
  box.innerHTML = `
    <div class="result-card result-loading">
      <div class="result-label"><span class="spinner"></span> Processing</div>
      <div class="result-value" style="color:var(--text-2);font-size:0.9rem;">${msg}</div>
    </div>`;
}

function showResultSuccess(box, { label, value, meta, extras }) {
  const metaHTML = meta.map(m => `
    <div class="meta-item"><strong>${m.key}:</strong> ${m.val}</div>
  `).join('');
  box.innerHTML = `
    <div class="result-card result-success">
      <div class="result-label">${label}</div>
      <div class="result-value">${value}</div>
      <div class="result-meta">${metaHTML}</div>
      ${extras ? `<div class="meta-item" style="margin-top:0.4rem;color:var(--text-3);">Also: ${extras}</div>` : ''}
    </div>`;
}

function showResultError(box, msg) {
  box.innerHTML = `
    <div class="result-card result-error">
      <div class="result-label">✗ Resolution Failed</div>
      <div class="result-value" style="color:var(--rose);font-size:0.9rem;">${msg}</div>
    </div>`;
}

// ── Flow Card (Query path visualization) ──────────────────────────────────
const FLOW_NODES = [
  { id: 'fn-client',   icon: '💻', label: 'DNS Client' },
  { id: 'fn-resolver', icon: '🔀', label: 'Recursive Resolver' },
  { id: 'fn-root',     icon: '🌐', label: 'Root Server' },
  { id: 'fn-tld',      icon: '📁', label: 'TLD Server' },
  { id: 'fn-auth',     icon: '🖥️', label: 'Auth. Server' },
];

function showFlowCard(type, query) {
  const card = document.getElementById('flowCard');
  const steps = document.getElementById('flowSteps');
  card.style.display = 'block';
  steps.innerHTML = '';

  FLOW_NODES.forEach((node, i) => {
    const step = document.createElement('div');
    step.className = 'flow-step';

    const nodeEl = document.createElement('div');
    nodeEl.className = 'flow-node';
    nodeEl.innerHTML = `
      <div class="flow-node-icon ${i === 0 ? 'active' : 'idle'}" id="${node.id}">
        ${node.icon}
      </div>
      <span class="flow-node-label">${node.label}</span>`;

    step.appendChild(nodeEl);

    if (i < FLOW_NODES.length - 1) {
      const arrow = document.createElement('div');
      arrow.className = 'flow-arrow';
      arrow.innerHTML = `<div class="flow-arrow-line"></div><div class="flow-arrow-head"></div>`;
      step.appendChild(arrow);
    }

    steps.appendChild(step);
  });

  // Animate through nodes
  let idx = 0;
  const interval = setInterval(() => {
    if (idx > 0) {
      document.getElementById(FLOW_NODES[idx - 1].id).className = 'flow-node-icon done';
    }
    if (idx < FLOW_NODES.length) {
      document.getElementById(FLOW_NODES[idx].id).className = 'flow-node-icon active';
      idx++;
    } else {
      clearInterval(interval);
    }
  }, 180);

  card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function finishFlowCard(error = false) {
  FLOW_NODES.forEach(node => {
    const el = document.getElementById(node.id);
    if (el) {
      el.className = error ? 'flow-node-icon idle' : 'flow-node-icon done';
    }
  });
}

// ── Records Table ──────────────────────────────────────────────────────────
function renderRecordsTable(records) {
  const tbody = document.getElementById('recordsBody');
  tbody.innerHTML = '';

  if (records.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-3);padding:2rem;">No records found.</td></tr>`;
    return;
  }

  records.forEach((r, i) => {
    const tr = document.createElement('tr');
    tr.dataset.index = DNS_RECORDS.indexOf(r);
    tr.innerHTML = `
      <td>${r.domain}</td>
      <td><span class="type-badge type-${r.type.split(' ')[0]}">${r.type}</span></td>
      <td>${r.value}</td>
      <td>${r.ttl}</td>
      <td>${r.class}</td>
      <td>
        <div class="action-btns">
          <button class="btn-icon" title="Use in lookup" onclick="useRecord(${DNS_RECORDS.indexOf(r)})">🔍</button>
          <button class="btn-icon del" title="Delete record" onclick="deleteRecord(${DNS_RECORDS.indexOf(r)})">🗑️</button>
        </div>
      </td>`;
    tbody.appendChild(tr);
  });

  const rEl = document.getElementById('statRecords');
  if (rEl) rEl.textContent = DNS_RECORDS.length;
}

function filterRecords() {
  const search = document.getElementById('recordSearch').value.toLowerCase();
  const type = document.getElementById('recordTypeFilter').value;

  filteredRecords = DNS_RECORDS.filter(r => {
    const matchType = type === 'ALL' || r.type.startsWith(type);
    const matchSearch = !search ||
      r.domain.includes(search) ||
      r.value.toLowerCase().includes(search) ||
      r.type.toLowerCase().includes(search);
    return matchType && matchSearch;
  });

  renderRecordsTable(filteredRecords);
}

function useRecord(index) {
  const r = DNS_RECORDS[index];
  if (r.type === 'A' || r.type === 'AAAA' || r.type === 'CNAME') {
    document.getElementById('domainInput').value = r.domain;
    document.getElementById('lookup').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('domainInput').focus();
    showToast(`Loaded "${r.domain}" into lookup`, 'success');
  } else if (r.type === 'PTR') {
    // Extract IP from PTR name
    const parts = r.domain.replace('.in-addr.arpa', '').split('.').reverse();
    document.getElementById('ipInput').value = parts.join('.');
    document.getElementById('lookup').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('ipInput').focus();
    showToast(`Loaded IP into reverse lookup`, 'success');
  } else {
    document.getElementById('domainInput').value = r.domain;
    document.getElementById('lookup').scrollIntoView({ behavior: 'smooth' });
    showToast(`Loaded "${r.domain}" into lookup`, 'success');
  }
}

function deleteRecord(index) {
  const r = DNS_RECORDS[index];
  DNS_RECORDS.splice(index, 1);
  log(`ADMIN → Deleted record ${r.domain} [${r.type}]`, 'error');
  filterRecords();
  showToast(`Deleted record: ${r.domain}`, 'error');
}

// ── Add Record Modal ───────────────────────────────────────────────────────
function openAddModal() {
  document.getElementById('modalOverlay').classList.add('open');
}

function closeAddModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

function closeModal(e) {
  if (e.target === document.getElementById('modalOverlay')) closeAddModal();
}

function addRecord() {
  const domain = document.getElementById('newDomain').value.trim().toLowerCase();
  const type = document.getElementById('newType').value;
  const value = document.getElementById('newValue').value.trim();
  const ttl = parseInt(document.getElementById('newTTL').value) || 300;

  if (!domain || !value) {
    showToast('Domain and Value are required.', 'error');
    return;
  }

  const record = { domain, type, value, ttl, class: 'IN' };
  DNS_RECORDS.push(record);

  log(`ADMIN → Added record ${domain} [${type}] → ${value}`, 'cache');
  closeAddModal();
  filterRecords();

  // Scroll to new row and highlight
  setTimeout(() => {
    const rows = document.querySelectorAll('#recordsBody tr');
    if (rows.length > 0) {
      const lastRow = rows[rows.length - 1];
      lastRow.classList.add('new-row');
      lastRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 100);

  // Clear form
  document.getElementById('newDomain').value = '';
  document.getElementById('newValue').value = '';
  document.getElementById('newTTL').value = '300';

  showToast(`Record added: ${domain} → ${value}`, 'success');
}

// ── Suggestions (autocomplete hints) ──────────────────────────────────────
const DOMAIN_SAMPLES = [
  'google.com', 'github.com', 'youtube.com', 'stackoverflow.com',
  'wikipedia.org', 'cloudflare.com', 'netflix.com', 'example.com',
  'twitter.com', 'facebook.com', 'amazon.com', 'apple.com'
];

const IP_SAMPLES = [
  '142.250.80.46', '140.82.121.3', '151.101.193.69',
  '185.15.58.224', '93.184.216.34', '104.16.132.229',
  '17.253.144.10', '157.240.22.35', '54.74.212.161'
];

function renderSuggestions(containerId, items, inputId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  items.slice(0, 6).forEach(item => {
    const chip = document.createElement('span');
    chip.className = 'suggestion-chip';
    chip.textContent = item;
    chip.onclick = () => {
      document.getElementById(inputId).value = item;
      container.innerHTML = '';
    };
    container.appendChild(chip);
  });
}

document.getElementById('domainInput').addEventListener('input', function () {
  const val = this.value.toLowerCase();
  if (!val) {
    renderSuggestions('domainSuggestions', DOMAIN_SAMPLES, 'domainInput');
    return;
  }
  const matches = DNS_RECORDS
    .filter(r => r.domain.includes(val) && r.type !== 'PTR')
    .map(r => r.domain)
    .filter((v, i, arr) => arr.indexOf(v) === i);
  renderSuggestions('domainSuggestions', matches.length ? matches : DOMAIN_SAMPLES.filter(s => s.includes(val)), 'domainInput');
});

document.getElementById('domainInput').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') forwardLookup();
});

document.getElementById('ipInput').addEventListener('input', function () {
  const val = this.value;
  if (!val) {
    renderSuggestions('ipSuggestions', IP_SAMPLES, 'ipInput');
    return;
  }
  const matches = DNS_RECORDS
    .filter(r => r.value && r.value.includes(val) && (r.type === 'A' || r.type === 'AAAA'))
    .map(r => r.value)
    .filter((v, i, arr) => arr.indexOf(v) === i);
  renderSuggestions('ipSuggestions', matches.length ? matches : IP_SAMPLES.filter(s => s.includes(val)), 'ipInput');
});

document.getElementById('ipInput').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') reverseLookup();
});

// ── Navbar active state ────────────────────────────────────────────────────
function setActiveNav(el) {
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  el.classList.add('active');
}

// ── Particles (background) ────────────────────────────────────────────────
function createParticles() {
  const container = document.getElementById('particles');
  const colors = ['#6366f1', '#06b6d4', '#818cf8', '#67e8f9', '#a78bfa'];
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 4 + 2;
    p.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      left: ${Math.random() * 100}%;
      animation-duration: ${Math.random() * 20 + 15}s;
      animation-delay: ${Math.random() * 15}s;
      opacity: 0.5;
    `;
    container.appendChild(p);
  }
}

// ── Init ───────────────────────────────────────────────────────────────────
function init() {
  createParticles();
  renderRecordsTable(DNS_RECORDS);

  // Show initial suggestions
  renderSuggestions('domainSuggestions', DOMAIN_SAMPLES, 'domainInput');
  renderSuggestions('ipSuggestions', IP_SAMPLES, 'ipInput');

  // Smooth reveal
  document.querySelectorAll('.section').forEach((s, i) => {
    s.style.opacity = 0;
    s.style.transform = 'translateY(20px)';
    setTimeout(() => {
      s.style.transition = 'all 0.6s ease';
      s.style.opacity = 1;
      s.style.transform = 'translateY(0)';
    }, i * 150);
  });

  // Update active nav on scroll
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(sec => {
      const top = sec.getBoundingClientRect().top;
      if (top <= 120) current = sec.id;
    });
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) {
        link.classList.add('active');
      }
    });
  }, { passive: true });

  log('DNS Server ready. Type a domain or IP to begin.', 'system');
}

document.addEventListener('DOMContentLoaded', init);

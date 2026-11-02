const parseButton = document.getElementById('parseButton');
const fileInput = document.getElementById('fileInput');
const jsonOutput = document.getElementById('jsonOutput');
const statusTag = document.getElementById('statusTag');
const docType = document.getElementById('docType');
const confidence = document.getElementById('confidence');
const engine = document.getElementById('engine');

const API_BASE = (() => {
  const { protocol, hostname, port } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    if (port === '4173') {
      return 'http://127.0.0.1:3000';
    }
    if (port === '3000') {
      return `${protocol}//${hostname}:3000`;
    }
  }
  return '';
})();

function setStatus(label, tone = 'ready') {
  statusTag.textContent = label;
  statusTag.className = 'status-tag';
  statusTag.classList.add(`status-${tone}`);
}

function showResult(payload) {
  jsonOutput.textContent = JSON.stringify(payload, null, 2);

  if (payload && typeof payload === 'object') {
    docType.textContent = payload.document_type || payload.documentType || 'unknown';
    confidence.textContent = String(payload.confidence_score ?? payload.confidence ?? 'n/a');
    engine.textContent = payload.pdf_engine || payload.pdfEngine || 'unknown';
  }
}

async function fetchHealth() {
  if (!API_BASE) return;

  try {
    const response = await fetch(`${API_BASE}/api/v1/metrics`);
    if (!response.ok) return;
    const data = await response.json();
    if (data && data.status === 'ok') {
      setStatus('live', 'ready');
      const requestCount = document.getElementById('queueProcessed');
      const queueDepth = document.getElementById('queuePending');
      if (requestCount) requestCount.textContent = String(data.requestCount || 0);
      if (queueDepth) queueDepth.textContent = String(data.queueDepth || 0);
    }
  } catch (error) {
    // ignore health check failures and let upload flow handle them
  }
}

parseButton.addEventListener('click', async () => {
  const file = fileInput.files && fileInput.files[0];

  if (!file) {
    setStatus('no file', 'warning');
    showResult({ error: 'Please choose a PDF file to parse.' });
    return;
  }

  if (!file.name.toLowerCase().endsWith('.pdf')) {
    setStatus('invalid', 'warning');
    showResult({ error: 'Only PDF files are supported.' });
    return;
  }

  setStatus('processing', 'processing');
  parseButton.disabled = true;

  const formData = new FormData();
  formData.append('document', file);

  try {
    const response = await fetch(`${API_BASE}/api/v1/parse-document`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      const message = data?.error?.message || data?.message || 'Request failed.';
      throw new Error(message);
    }

    showResult(data);
    setStatus('ready', 'ready');
  } catch (error) {
    showResult({ error: error.message || 'Unexpected parsing failure.' });
    setStatus('error', 'error');
  } finally {
    parseButton.disabled = false;
  }
});

fetchHealth();

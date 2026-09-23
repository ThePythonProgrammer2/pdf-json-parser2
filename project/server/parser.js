const crypto = require('crypto');

/**
 * Computes a SHA-256 hash of a Buffer for cache keying.
 * @param {Buffer} buffer
 * @returns {string}
 */
function hashBuffer(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Technical skills dictionary asset matching pool.
 */
const KNOWN_SKILLS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin',
  'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Next.js', 'Nuxt', 'Django', 'Flask', 'HTML5', 'CSS3', 'Tailwind',
  'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'GraphQL', 'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Git'
];

/**
 * Attempts to detect the currency symbol/code from text.
 * @param {string} text
 * @returns {string|null}
 */
function detectCurrency(text) {
  const currencyPatterns = [
    { regex: /\$/g, code: 'USD' },
    { regex: /€/g, code: 'EUR' },
    { regex: /£/g, code: 'GBP' },
    { regex: /¥/g, code: 'JPY' },
    { regex: /₹/g, code: 'INR' },
  ];
  for (const p of currencyPatterns) {
    if (p.regex.test(text)) return p.code;
  }
  const codeMatch = text.match(/\b(USD|EUR|GBP|JPY|INR|CAD|AUD|CHF|CNY)\b/i);
  return codeMatch ? codeMatch[1].toUpperCase() : null;
}

/**
 * Extracts and optimizes line items from invoice text using native heuristics.
 */
function extractInvoiceItems(text) {
  const items = [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const headerPattern = /^(item|description|qty|quantity|subtotal|sub\s*total|total|grand\s*total|total\s*due|amount\s*due|tax|vat|sales\s*tax|gst|discount|amount|s\.no|sl\.no|#|date|invoice|bill\s+to|ship\s+to|balance|payment|remit|terms)/i;

  for (const line of lines) {
    if (headerPattern.test(line)) continue;
    if (line.length < 3) continue;

    let description = null;
    let quantity = null;
    let unitPrice = null;
    let totalPrice = null;

    const qtyPriceMatch = line.match(/^(.+?)\s+(\d+)\s*[xX@]\s*[\$€£₹]?([\d,]+\.?\d*)/);
    if (qtyPriceMatch) {
      description = qtyPriceMatch[1].trim();
      quantity = parseInt(qtyPriceMatch[2], 10);
      unitPrice = parseFloat(qtyPriceMatch[3].replace(/,/g, ''));
      totalPrice = quantity * unitPrice;
    }

    if (!description) {
      const trailingPriceMatch = line.match(/^(.+?)\s+[\$€£₹]?([\d,]+\.?\d*)/);
      if (trailingPriceMatch) {
        const rawDesc = trailingPriceMatch[1].trim();
        if (!/^[0-9.,\s]+\$/.test(rawDesc)) {
          description = rawDesc;
          totalPrice = parseFloat(trailingPriceMatch[2].replace(/,/g, ''));
        }
      }
    }

    if (description) {
      items.push({
        description: description.replace(/\s+/g, ' ').trim(),
        quantity: !isNaN(quantity) ? quantity : null,
        unit_price: !isNaN(unitPrice) ? unitPrice : null,
        total_price: !isNaN(totalPrice) ? totalPrice : null,
      });
    }
    if (items.length >= 20) break;
  }
  return items;
}

/**
 * Single document context extractor pipeline loop block.
 */
function parseSingleDocument(chunkText) {
  const normalizedText = chunkText.toLowerCase();
  let documentType = 'unknown';
  let confidenceScore = 0.5;
  let primaryEntity = null;

  if (normalizedText.includes('invoice') || normalizedText.includes('bill to') || normalizedText.includes('amount due')) {
    documentType = 'invoice';
    confidenceScore = 0.85;
    const entityMatch = chunkText.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\s+(?:Inc\.|Ltd\.|LLC|Corp\.))\b/);
    primaryEntity = entityMatch ? entityMatch[1] : 'Unknown Vendor';
  } else if (normalizedText.includes('experience') || normalizedText.includes('education') || normalizedText.includes('resume') || normalizedText.includes('skills')) {
    documentType = 'resume';
    confidenceScore = 0.90;

    const lines = chunkText.split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      const nameMatch = line.match(/^(?:\s*\d+\.\s+)?([A-Z][a-zA-Z\u00C0-\u017F]+)\s+([A-Z][a-zA-Z\u00C0-\u017F]+)/);
      if (nameMatch) {
        primaryEntity = `${nameMatch[1]} ${nameMatch[2]}`;
        break;
      }
    }
    if (!primaryEntity) primaryEntity = 'Unknown Candidate';
  }

  const skillsExtracted = [];
  if (documentType === 'resume') {
    for (const skill of KNOWN_SKILLS) {
      const regex = new RegExp(`\\b${skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
      if (regex.test(chunkText)) skillsExtracted.push(skill);
    }
  }

  let totalAmount = null;
  if (documentType === 'invoice') {
    const totalMatch = normalizedText.match(/(?:total|amount\s*due|grand\s*total)\s*[:\$\s]*([\d,]+\.\d{2})/);
    totalAmount = totalMatch ? parseFloat(totalMatch[1].replace(/,/g, '')) : null;
  }

  const coreStack = skillsExtracted.slice(0, 4).join(', ');
  const rawSummary = documentType === 'resume'
    ? `Professional resume profile for ${primaryEntity}. Key engineering qualifications include expertise in ${coreStack || 'software development'}.`
    : `Commercial invoice document associated with ${primaryEntity || 'transaction data processing'}.`;

  return {
    document_type: documentType,
    confidence_score: confidenceScore,
    primary_entity: primaryEntity,
    date: new Date().toISOString().split('T')[0],
    financials: {
      total_amount: totalAmount,
      currency: detectCurrency(chunkText),
      tax_amount: totalAmount ? parseFloat((totalAmount * 0.08).toFixed(2)) : null,
    },
    extracted_items: documentType === 'invoice' ? extractInvoiceItems(chunkText) : skillsExtracted,
    raw_summary: rawSummary
  };
}

/**
 * Unified Core Entry Point Handler.
 * Strips formatting remnants, validates boundaries, and splits multiple files safely.
 * 
 * @param {string} rawText 
 * @returns {Object} Always outputs a standardized operational status object wrapper structure.
 */
function parseDocument(rawText) {
  if (!rawText || rawText.trim() === "") {
    return { is_collection: false, data: null };
  }

  // Lookahead chunk split logic tracking multi-resume markers ("1. Name", "2. Name")
  const structuralChunks = rawText
    .split(/(?=\n\s*\d+\.\s+[A-Z])/)
    .map(c => c.trim())
    .filter(c => c.length > 40);

  if (structuralChunks.length <= 1) {
    return {
      is_collection: false,
      data: parseSingleDocument(rawText)
    };
  }

  return {
    is_collection: true,
    data: structuralChunks.map(chunk => parseSingleDocument(chunk))
  };
}

function buildAiPrompt(rawText) {
  return `Format tracking schema parameters wrapper targeting upstream AI endpoints:\n${rawText}`;
}

module.exports = {
  hashBuffer,
  parseDocument,
  buildAiPrompt
};

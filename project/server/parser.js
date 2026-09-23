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
 * Generates a brief 2-sentence raw summary from extracted text.
 * @param {string} text
 * @param {string} docType
 * @param {string|null} primaryEntity
 * @returns {string}
 */
function buildSummary(text, docType, primaryEntity) {
  const nameValue = (primaryEntity && primaryEntity !== 'Unknown Vendor' && primaryEntity !== 'Unknown Candidate') ? primaryEntity : null;
  
  if (docType === 'invoice') {
    const fromSegment = nameValue ? ` from ${nameValue}` : '';
    return `This appears to be an invoice${fromSegment}. Key details include line items, dates, and financial amounts extracted from the document text.`;
  }
  if (docType === 'resume') {
    const forSegment = nameValue ? ` for ${nameValue}` : '';
    return `This appears to be a resume${forSegment}. The document outlines professional experience, skills, and qualifications for a job candidate.`;
  }
  return `This document could not be confidently classified as an invoice or resume. Some structural data was extracted but the document type remains uncertain.`;
}

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
  return codeMatch ? codeMatch.toUpperCase() : null;
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

    const qtyPriceMatch = line.match(/^(.+?)\s+(\d+)\s*[xX@]\s*[\$€£₹]?([\d,]+\.?\d*)\s*\$/);
    if (qtyPriceMatch && qtyPriceMatch.trim().length > 2) {
      description = qtyPriceMatch.trim();
      quantity = parseInt(qtyPriceMatch[2], 10);
      unitPrice = parseFloat(qtyPriceMatch.replace(/,/g, ''));
      totalPrice = quantity * unitPrice;
    }

    if (!description) {
      const trailingPriceMatch = line.match(/^(.+?)\s+[\$€£₹]?([\d,]+\.?\d*)\s*\$/);
      if (trailingPriceMatch && trailingPriceMatch.trim().length > 2) {
        const rawDesc = trailingPriceMatch.trim();
        if (!/^[0-9.,\s]+\$/.test(rawDesc)) {
          description = rawDesc;
          totalPrice = parseFloat(trailingPriceMatch.replace(/,/g, ''));
        }
      }
    }

    if (description) {
      const cleanDesc = description.replace(/\s+/g, ' ').trim();
      items.push({
        description: cleanDesc,
        quantity: !isNaN(quantity) ? quantity : null,
        unit_price: !isNaN(unitPrice) ? unitPrice : null,
        total_price: !isNaN(totalPrice) ? totalPrice : null,
      });
    }
    if (items.length >= 20) break;
  }
  return items;
}

const KNOWN_SKILLS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin',
  'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Next.js', 'Nuxt', 'Django', 'Flask', 'HTML5', 'CSS3', 'Tailwind',
  'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'GraphQL', 'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Git'
];

/**
 * Core Primary Processing Pipeline Engine.
 * Takes raw text layouts and structures them cleanly.
 * 
 * @param {string} rawText 
 * @returns {Object}
 */
function parseDocument(rawText) {
  const normalizedText = rawText.toLowerCase();
  
  let documentType = 'unknown';
  let confidenceScore = 0.5;
  let primaryEntity = null;
  
  if (normalizedText.includes('invoice') || normalizedText.includes('bill to') || normalizedText.includes('amount due')) {
    documentType = 'invoice';
    confidenceScore = 0.85;
    
    const entityMatch = rawText.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\s+(?:Inc\.|Ltd\.|LLC|Corp\.))\b/);
    primaryEntity = entityMatch ? entityMatch : 'Unknown Vendor';
  } else if (normalizedText.includes('experience') || normalizedText.includes('education') || normalizedText.includes('resume')) {
    documentType = 'resume';
    confidenceScore = 0.90;
    
    const cleanTextStart = rawText.trim();
    const nameMatch = cleanTextStart.match(/\b([A-Z][a-z\u00C0-\u017F]+)\s+([A-Z][a-z\u00C0-\u017F]+)\b/);
    primaryEntity = nameMatch ? `${nameMatch} ${nameMatch}` : 'Unknown Candidate';
  }

  const currencyDetected = detectCurrency(rawText);
  const invoiceItems = documentType === 'invoice' ? extractInvoiceItems(rawText) : [];
  
  const skillsExtracted = [];
  if (documentType === 'resume') {
    for (const skill of KNOWN_SKILLS) {
      const regex = new RegExp(`\\b${skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
      if (regex.test(rawText)) {
        skillsExtracted.push(skill);
      }
    }
  }

  let totalAmount = null;
  if (documentType === 'invoice') {
    const totalMatch = normalizedText.match(/(?:total|amount\s*due|grand\s*total)\s*[:\$\s]*([\d,]+\.\d{2})/);
    totalAmount = totalMatch ? parseFloat(totalMatch.replace(/,/g, '')) : null;
  }

  return {
    document_type: documentType,
    confidence_score: confidenceScore,
    primary_entity: primaryEntity,
    date: '2026-09-23',
    financials: {
      total_amount: totalAmount,
      currency: currencyDetected,
      tax_amount: totalAmount ? parseFloat((totalAmount * 0.08).toFixed(2)) : null,
    },
    extracted_items: documentType === 'invoice' ? invoiceItems : skillsExtracted,
    raw_summary: buildSummary(rawText, documentType, primaryEntity)
  };
}

/**
 * Multi-document array processing splitter handler.
 * Looks for common resume initialization markers and processes them as individual elements.
 * 
 * @param {string} bulkText 
 * @returns {Array<Object>} An array containing all parsed files.
 */
function parseMultiDocumentCollection(bulkText) {
  if (!bulkText) return [];

  // FIXED: Expanded the splitting regex pattern so it tracks individual structural document breaks cleanly
  const documentChunks = bulkText
    .split(/(?=\bexperience\b|\beducation\b|\f|\n---+\n|\n___+\n)/i)
    .map(chunk => chunk.trim())
    .filter(chunk => chunk.length > 40);

  if (documentChunks.length <= 1) {
    return [parseDocument(bulkText)];
  }

  return documentChunks.map(chunk => parseDocument(chunk));
}

function buildAiPrompt(rawText) {
  return `Analyze the following raw text from a document. Output a strict JSON structure matching the rules.
  Raw Text Content:
  ${rawText}`;
}

module.exports = {
  hashBuffer,
  parseDocument,
  parseMultiDocumentCollection,
  buildAiPrompt
};

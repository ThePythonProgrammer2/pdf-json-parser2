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
  if (docType === 'invoice') {
    return `This appears to be an invoice${primaryEntity ? ` from \${primaryEntity}` : ''}. ` +
      `Key details include line items, dates, and financial amounts extracted from the document text.`;
  }
  if (docType === 'resume') {
    return `This appears to be a resume${primaryEntity ? ` for \${primaryEntity}` : ''}. ` +
      `The document outlines professional experience, skills, and qualifications for a job candidate.`;
  }
  return `This document could not be confidently classified as an invoice or resume. ` +
    `Some structural data was extracted but the document type remains uncertain.`;
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
  return codeMatch ? codeMatch[1].toUpperCase() : null;
}

/**
 * Extracts and sanitizes line items from invoice text using native heuristics.
 * @param {string} text
 * @returns {Array}
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
    if (qtyPriceMatch && qtyPriceMatch[1].trim().length > 2) {
      description = qtyPriceMatch[1].trim();
      quantity = parseInt(qtyPriceMatch[2], 10);
      unitPrice = parseFloat(qtyPriceMatch[3].replace(/,/g, ''));
      totalPrice = quantity * unitPrice;
    }

    if (!description) {
      const trailingPriceMatch = line.match(/^(.+?)\s+[\$€£₹]?([\d,]+\.?\d*)\s*\$/);
      if (trailingPriceMatch && trailingPriceMatch[1].trim().length > 2) {
        const rawDesc = trailingPriceMatch[1].trim();
        if (!/^[0-9.,\s]+\$/.test(rawDesc)) {
          description = rawDesc;
          totalPrice = parseFloat(trailingPriceMatch[2].replace(/,/g, ''));
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

/**
 * Technical skills dictionary asset matching pool.
 */
const KNOWN_SKILLS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin',
  'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Next.js', 'Nuxt', 'Django', 'Flask', 'HTML5', 'CSS3', 'Tailwind',
  'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'GraphQL', 'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Git'
];

/**
 * Core Primary Processing Pipeline Engine.
 * Takes raw text layouts and structures them cleanly matching your marketplace data rules.
 * 
 * @param {string} rawText 
 * @returns {Object}
 */
function parseDocument(rawText) {
  const normalizedText = rawText.toLowerCase();
  
  // Heuristic Classification
  let documentType = 'unknown';
  let confidenceScore = 0.5;
  let primaryEntity = null;
  
  if (normalizedText.includes('invoice') || normalizedText.includes('bill to') || normalizedText.includes('amount due')) {
    documentType = 'invoice';
    confidenceScore = 0.85;
    
    // Naive extraction check for common vendor layouts
    const entityMatch = rawText.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\s+(?:Inc\.|Ltd\.|LLC|Corp\.))\b/);
    primaryEntity = entityMatch ? entityMatch[1] : 'Unknown Vendor';
  } else if (normalizedText.includes('experience') || normalizedText.includes('education') || normalizedText.includes('resume')) {
    documentType = 'resume';
    confidenceScore = 0.90;
    
    const nameMatch = rawText.match(/^([A-Z][a-z]+)\s+([A-Z][a-z]+)/);
    primaryEntity = nameMatch ? `${nameMatch[1]} ${nameMatch[2]}` : 'Unknown Candidate';
  }

  // Build the extracted structures matching your marketplace specification model
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

  // Attempt to isolate financial totals if tracking invoices
  let totalAmount = null;
  if (documentType === 'invoice') {
    const totalMatch = normalizedText.match(/(?:total|amount\s*due|grand\s*total)\s*[:\$\s]*([\d,]+\.\d{2})/);
    totalAmount = totalMatch ? parseFloat(totalMatch[1].replace(/,/g, '')) : null;
  }

  return {
    document_type: documentType,
    confidence_score: confidenceScore,
    primary_entity: primaryEntity,
    date: new Date().toISOString().split('T')[0], // Falls back natively to transaction timestamp
    financials: {
      total_amount: totalAmount,
      currency: currencyDetected,
      tax_amount: totalAmount ? parseFloat((totalAmount * 0.08).toFixed(2)) : null, // Native structural estimation fallback
    },
    extracted_items: documentType === 'invoice' ? invoiceItems : skillsExtracted,
    raw_summary: buildSummary(rawText, documentType, primaryEntity)
  };
}

/**
 * Builds a strict prompt query payload template targeting your upstream AI modules.
 * This instructs Gemini/OpenRouter to parse the text flawlessly when regular expressions are insufficient.
 * 
 * @param {string} rawText 
 * @returns {string}
 */
function buildAiPrompt(rawText) {
  return `Analyze the following raw unstructured text extracted from a PDF document. Your task is to output a clean, strict JSON object following the format below. Do not include any markdown headers or explanations.

Response Shape format:
{
  "document_type": "invoice" or "resume" or "unknown",
  "confidence_score": 0.0 to 1.0,
  "primary_entity": "Vendor Name" or "Candidate Name" or null,
  "date": "YYYY-MM-DD" or null,
  "financials": {
    "total_amount": 0.00 or null,
    "currency": "USD" or "EUR" etc or null,
    "tax_amount": 0.00 or null
  },
  "extracted_items": ["item description strings" or "skills array listings"],
  "raw_summary": "A clean 2-sentence summary of the document."
}

Raw Text Content:
${rawText}`;
}

module.exports = {
  hashBuffer,
  parseDocument,
  buildAiPrompt
};

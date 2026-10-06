const crypto = require('crypto');

function hashBuffer(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function cleanText(text) {
  return String(text || '')
    .replace(/\r/g, '')
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .trim();
}

function detectCurrency(text) {
  if (/\$/.test(text) || /\bUSD\b/i.test(text)) return 'USD';
  if (/€/.test(text) || /\bEUR\b/i.test(text)) return 'EUR';
  if (/£/.test(text) || /\bGBP\b/i.test(text)) return 'GBP';
  if (/¥/.test(text) || /\bJPY\b/i.test(text)) return 'JPY';
  if (/₹/.test(text) || /\bINR\b/i.test(text)) return 'INR';
  const code = text.match(/\b(CAD|AUD|CHF|CNY)\b/i);
  return code ? code[1].toUpperCase() : null;
}

function extractDate(text) {
  let match = text.match(/\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
  if (match) return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;

  match = text.match(/\b(\d{1,2})[/.](\d{1,2})[/.](\d{4})\b/);
  if (match) return `${match[3]}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`;

  const months = 'january february march april may june july august september october november december'.split(' ');
  match = text.match(new RegExp(`\\b(${months.join('|')})\\s+(\\d{1,2}),?\\s+(\\d{4})\\b`, 'i'));
  return match ? `${match[3]}-${String(months.indexOf(match[1].toLowerCase()) + 1).padStart(2, '0')}-${match[2].padStart(2, '0')}` : null;
}

function numberFrom(value) {
  const number = Number(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(number) ? number : null;
}

/**
 * Extract financial amounts - only those with currency symbols or in financial context
 */
function extractAmounts(text) {
  const results = [];
  
  // Only match amounts that have currency symbols OR are in financial context
  const patterns = [
    /[$€£₹]\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/g,  // Currency symbol required
    /(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:USD|EUR|GBP|JPY|INR|CAD|AUD|CHF|CNY)\b/gi,  // Currency code required
  ];
  
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const amount = numberFrom(match[1]);
      // Filter: ignore very small numbers, single digits, and page numbers
      if (amount !== null && amount >= 10) {
        results.push({ amount, index: match.index });
      }
    }
  }
  
  return results;
}

function extractFinancials(text) {
  const lines = text.split('\n');
  const totalAmount = extractLabelledAmount(
    lines,
    /^\s*(?:grand\s+total|total\s+due|amount\s+due|balance\s+due)\b/i,
  ) ?? extractLabelledAmount(lines, /^\s*total\b/i);
  const taxAmount = extractLabelledAmount(
    lines,
    /^\s*(?:sales\s+tax|tax|vat|gst)\b/i,
  );

  return {
    totalAmount: totalAmount !== null && totalAmount >= 10 ? totalAmount : null,
    taxAmount,
  };
}

function extractLabelledAmount(lines, labelPattern) {
  for (const line of lines) {
    const label = line.match(labelPattern);
    if (!label) continue;

    const remainder = line.slice(label.index + label[0].length);
    const currencyAmounts = [...remainder.matchAll(/[$€£¥₹]\s*([\d,]+(?:\.\d{1,2})?)/g)];
    const amounts = currencyAmounts.length
      ? currencyAmounts.map(match => match[1])
      : [...remainder.matchAll(/(\d[\d,]*(?:\.\d{1,2})?)(?![\d,]|\s*%)/g)]
        .map(match => match[1]);
    if (amounts.length) return numberFrom(amounts[amounts.length - 1]);
  }

  return null;
}

function extractEntity(text, type) {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 2);
  
  // Look for explicit labels
  const labelled = text.match(/(?:from|vendor|seller|company|employer)\s*[:=-]\s*([^\n]+)/i);
  if (labelled) {
    const entity = labelled[1].trim().slice(0, 100);
    if (entity.length > 2) return entity;
  }
  
  if (type === 'resume') {
    const name = lines.slice(0, 5).find(line => /^[A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){1,3}$/.test(line));
    if (name) return name;
  }
  
  // Look for business names with entity indicators
  const company = lines.slice(0, 10).find(line => /\b(LLC|INC|LTD|CORP|CORPORATION|GMBH|COMPANY|CO\.)\b/i.test(line) && line.length > 3);
  if (company) return company;
  
  // For invoice-like docs, return first substantial non-header line
  if (type === 'invoice') {
    const firstLine = lines.find(line => !/invoice|date|ref|page|bill|from|to/i.test(line) && line.length > 5 && line.length < 80);
    if (firstLine) return firstLine;

    const billedTo = text.match(/(?:bill\s+to|billed\s+to)\s*[:=-]\s*([^\n]+)/i);
    if (billedTo) return billedTo[1].trim().slice(0, 100);
  }
  
  return null;
}

function extractItems(text) {
  const items = [];
  const skip = /^(description|item|subtotal|total|tax|vat|amount|invoice|date|page|notes?|bill\s|from|to\s|ref)/i;
  
  for (const line of text.split('\n').map(value => value.trim()).filter(Boolean)) {
    if (skip.test(line)) continue;
    if (line.length < 5) continue;
    
    // Look for table rows with a description and a price at the end.
    const match = line.match(/^(.+?)\s{2,}[$€£₹]?\s*([\d,]+(?:\.\d{1,2})?)\s*$/);
    if (!match) continue;
    
    const total = numberFrom(match[2]);
    if (total === null || total < 10) continue; // Only meaningful prices
    
    items.push({ 
      description: match[1].trim(), 
      quantity: null, 
      unit_price: null, 
      total_price: total 
    });
    
    if (items.length >= 20) break;
  }
  
  return items;
}

function classify(text) {
  const lower = text.toLowerCase();
  
  // Invoice indicators
  const invoiceTerms = [
    'invoice', 'bill to', 'billed to', 'subtotal', 'amount due', 
    'total due', 'vendor', 'seller', 'quantity', 'unit price', 'tax', 'item description'
  ];
  
  // Resume indicators
  const resumeTerms = [
    'resume', 'curriculum vitae', 'cv', 'work experience', 'employment', 
    'education', 'skills', 'qualifications', 'certifications', 'degree', 'university'
  ];
  
  let invoiceScore = invoiceTerms.reduce((score, term) => score + (lower.includes(term) ? 1 : 0), 0);
  let resumeScore = resumeTerms.reduce((score, term) => score + (lower.includes(term) ? 1 : 0), 0);
  
  // Boost based on financial or contact data
  const amounts = extractAmounts(text);
  const financials = extractFinancials(text);
  
  if (amounts.length > 0 || financials.totalAmount !== null) invoiceScore += 2;
  if (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text)) resumeScore += 1;
  if (/\b(?:phone|mobile|email|contact)\s*[:=]/i.test(text)) resumeScore += 1;
  
  // Classification logic
  if (invoiceScore > resumeScore && invoiceScore >= 2) {
    return { type: 'invoice', confidence: Math.min(0.55 + invoiceScore * 0.07, 0.95) };
  }
  if (resumeScore > invoiceScore && resumeScore >= 2) {
    return { type: 'resume', confidence: Math.min(0.55 + resumeScore * 0.07, 0.95) };
  }
  
  // Default: return "document" if has content but unclear type
  return { type: 'document', confidence: 0.25 };
}

function parseDocument(input) {
  const text = cleanText(input);
  
  if (!text || text.length < 10) {
    return {
      document_type: 'unknown',
      confidence_score: 0,
      primary_entity: null,
      date: null,
      financials: { total_amount: null, currency: null, tax_amount: null },
      extracted_items: [],
      raw_summary: 'No readable text could be extracted from this PDF.',
    };
  }

  const classification = classify(text);
  const financials = extractFinancials(text);
  const items = extractItems(text);

  const entity = extractEntity(text, classification.type);
  
  // Generate appropriate summary
  let summary;
  if (classification.type === 'invoice') {
    summary = `This document appears to be an invoice${entity ? ` from ${entity}` : ''}. Financial values and line items were extracted from the document text.`;
  } else if (classification.type === 'resume') {
    summary = `This document appears to be a resume${entity ? ` for ${entity}` : ''}. Professional experience and qualifications were extracted from the document text.`;
  } else {
    summary = 'This document was processed successfully. Text content, dates, and financial data were extracted where available.';
  }

  return {
    document_type: classification.type,
    confidence_score: classification.confidence,
    primary_entity: entity,
    date: extractDate(text),
    financials: {
      total_amount: financials.totalAmount,
      currency: detectCurrency(text),
      tax_amount: financials.taxAmount,
    },
    extracted_items: items,
    raw_summary: summary,
  };
}

module.exports = { hashBuffer, parseDocument };

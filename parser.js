const crypto = require('crypto');

function hashBuffer(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function cleanText(text) {
  return String(text || '').replace(/\r/g, '').replace(/[ \t]+/g, ' ').trim();
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

function extractAmounts(text) {
  const results = [];
  const pattern = /(?:[$€£₹]\s*)?\b\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?\b|\b\d+(?:\.\d{1,2})?\s*(?:USD|EUR|GBP|JPY|INR|CAD|AUD|CHF|CNY)\b/gi;
  for (const match of text.matchAll(pattern)) {
    const amount = numberFrom(match[0]);
    if (amount !== null && amount > 0) {
      results.push({ amount, index: match.index });
    }
  }
  return results;
}

function extractFinancials(text) {
  const result = { totalAmount: null, taxAmount: null };
  const total = text.match(/(?:grand\s+total|total\s+due|amount\s+due|balance\s+due|total)\s*[:=-]?\s*[$€£₹]?\s*([\d,]+(?:\.\d{1,2})?)/i);
  const tax = text.match(/(?:tax|vat|gst|sales\s+tax)\s*(?:\([^)]*\))?\s*[:=-]?\s*[$€£₹]?\s*([\d,]+(?:\.\d{1,2})?)/i);
  if (total) result.totalAmount = numberFrom(total[1]);
  if (tax) result.taxAmount = numberFrom(tax[1]);
  return result;
}

function extractEntity(text, type) {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  const labelled = text.match(/(?:from|vendor|seller|company|employer|name)\s*[:=-]\s*([^\n]+)/i);
  if (labelled) return labelled[1].trim().slice(0, 100);
  if (type === 'resume') {
    const name = lines.slice(0, 5).find(line => /^[A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){1,3}$/.test(line));
    return name || (lines[0] ? lines[0].slice(0, 100) : null);
  }
  return lines.slice(0, 8).find(line => /\b(LLC|INC|LTD|CORP|CORPORATION|GMBH|COMPANY|CO\.)\b/i.test(line)) || (lines[0] || null);
}

function extractItems(text) {
  const items = [];
  const skip = /^(description|item|subtotal|total|tax|vat|amount|invoice|date|page|notes?)/i;
  for (const line of text.split('\n').map(value => value.trim()).filter(Boolean)) {
    if (skip.test(line)) continue;
    const match = line.match(/^(.+?)\s{2,}[$€£₹]?\s*([\d,]+(?:\.\d{1,2})?)\s*$/);
    if (!match) continue;
    const total = numberFrom(match[2]);
    if (total === null) continue;
    items.push({ description: match[1].trim(), quantity: null, unit_price: null, total_price: total });
    if (items.length >= 20) break;
  }
  return items;
}

function classify(text) {
  const lower = text.toLowerCase();
  const invoiceTerms = ['invoice', 'bill to', 'subtotal', 'amount due', 'total due', 'vendor', 'seller', 'quantity', 'unit price', 'tax'];
  const resumeTerms = ['resume', 'curriculum vitae', 'work experience', 'employment', 'education', 'skills', 'qualifications', 'certifications', 'degree'];
  const invoiceScore = invoiceTerms.reduce((score, term) => score + (lower.includes(term) ? 1 : 0), 0) + (extractAmounts(text).length ? 1 : 0);
  const resumeScore = resumeTerms.reduce((score, term) => score + (lower.includes(term) ? 1 : 0), 0) + (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text) ? 1 : 0);
  if (invoiceScore > resumeScore && invoiceScore >= 2) return { type: 'invoice', confidence: Math.min(0.55 + invoiceScore * 0.07, 0.98) };
  if (resumeScore > invoiceScore && resumeScore >= 2) return { type: 'resume', confidence: Math.min(0.55 + resumeScore * 0.07, 0.98) };
  return { type: 'document', confidence: 0.3 };
}

function parseDocument(input) {
  const text = cleanText(input);
  if (!text) return { document_type: 'unknown', confidence_score: 0, primary_entity: null, date: null, financials: { total_amount: null, currency: null, tax_amount: null }, extracted_items: [], raw_summary: 'No readable text could be extracted from this PDF.' };

  const classification = classify(text);
  const financials = extractFinancials(text);
  const amounts = extractAmounts(text);
  let items = extractItems(text);
  if (!items.length && amounts.length) items = amounts.slice(0, 20).map((entry, index) => ({ description: `Detected amount ${index + 1}`, quantity: null, unit_price: null, total_price: entry.amount }));

  const entity = extractEntity(text, classification.type);
  const summary = classification.type === 'invoice'
    ? `This document appears to be an invoice${entity ? ` from ${entity}` : ''}. Financial values and line-item candidates were extracted from the document text.`
    : classification.type === 'resume'
      ? `This document appears to be a resume${entity ? ` for ${entity}` : ''}. Professional information and detected skills were extracted from the document text.`
      : 'This document was extracted successfully, but its specific document type could not be determined reliably.';

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

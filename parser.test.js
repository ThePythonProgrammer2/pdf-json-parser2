const assert = require('node:assert/strict');
const test = require('node:test');
const { parseDocument } = require('./parser');

test('extracts invoice rows without treating financial summaries as items', () => {
  const text = [
    'INVOICE',
    'Acme Corp LLC',
    '123 Business Street',
    'Invoice #: INV-2024-001',
    'Date: 2024-03-15',
    'Bill To: John Smith',
    'Description                    Amount',
    'Web Development Service       $1,200.00',
    'Hosting Setup                 $150.00',
    'Subtotal:                     $1,350.00',
    'Tax (8%):                     $108.00',
    'Total Due:                    $1,458.00',
  ].join('\n');

  assert.deepEqual(parseDocument(text), {
    document_type: 'invoice',
    confidence_score: 0.95,
    primary_entity: 'Acme Corp LLC',
    date: '2024-03-15',
    financials: {
      total_amount: 1458,
      currency: 'USD',
      tax_amount: 108,
    },
    extracted_items: [
      {
        description: 'Web Development Service',
        quantity: null,
        unit_price: null,
        total_price: 1200,
      },
      {
        description: 'Hosting Setup',
        quantity: null,
        unit_price: null,
        total_price: 150,
      },
    ],
    raw_summary: 'This document appears to be an invoice from Acme Corp LLC. Financial values and line items were extracted from the document text.',
  });
});

test('does not invent line items from invoice totals when no rows are present', () => {
  const result = parseDocument([
    'INVOICE',
    'Acme Corp LLC',
    'Subtotal: $1,350.00',
    'Tax (8%): $108.00',
    'Total Due: $1,458.00',
  ].join('\n'));

  assert.deepEqual(result.extracted_items, []);
  assert.equal(result.financials.total_amount, 1458);
  assert.equal(result.financials.tax_amount, 108);
});

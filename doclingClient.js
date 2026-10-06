const { Docling } = require('docling-sdk');

/**
 * Docling Serve API client wrapper.
 *
 * Connects to a remote Docling Serve endpoint to perform high-accuracy
 * PDF parsing with layout analysis, table recognition, and OCR.
 *
 * The endpoint URL is read from the DOCLING_SERVE_URL environment variable.
 * If not set, all methods return null so the caller can fall back to pdf-parse.
 *
 * Example env:
 *   DOCLING_SERVE_URL=http://docling-serve:5001
 */

let cachedClient = null;
let cachedUrl = null;

/**
 * Returns whether Docling Serve is configured.
 * @returns {boolean}
 */
function isDoclingConfigured() {
  return !!(process.env.DOCLING_SERVE_URL && process.env.DOCLING_SERVE_URL.trim());
}

/**
 * Lazily creates and caches a DoclingAPIClient instance.
 * Returns null if DOCLING_SERVE_URL is not set.
 * @returns {import('docling-sdk').DoclingAPIClient | null}
 */
function getClient() {
  const url = process.env.DOCLING_SERVE_URL;
  if (!url || !url.trim()) return null;

  const trimmed = url.trim();
  if (cachedClient && cachedUrl === trimmed) return cachedClient;

  try {
    cachedClient = new Docling({ api: { baseUrl: trimmed } });
    cachedUrl = trimmed;
    return cachedClient;
  } catch (err) {
    console.error('Failed to create Docling API client:', err.message);
    return null;
  }
}

/**
 * Checks whether the Docling Serve endpoint is reachable and healthy.
 * @returns {Promise<boolean>}
 */
async function checkHealth() {
  const client = getClient();
  if (!client) return false;
  try {
    await client.health();
    return true;
  } catch {
    return false;
  }
}

/**
 * Parses a PDF buffer using the remote Docling Serve endpoint.
 *
 * Requests both Markdown and JSON output formats. Markdown provides
 * clean linear text (ideal for the rule-based / AI parsers), while
 * the JSON provides structured layout data (tables, headings, cells).
 *
 * Returns a normalized object or null on any failure so the caller
 * can fall back to pdf-parse.
 *
 * @param {Buffer} buffer - raw PDF bytes
 * @param {string} filename - original filename
 * @returns {Promise<{text: string, markdown: string, json: object|null, parsingEngine: string}|null>}
 */
async function parsePdf(buffer, filename) {
  const client = getClient();
  if (!client) return null;

  try {
    const result = await client.convert(
      new Uint8Array(buffer),
      filename || 'document.pdf',
      {
        to_formats: ['md', 'json'],
        do_ocr: true,
        table_mode: 'accurate',
      },
    );

    if (!result || !result.document) return null;

    const md = result.document.md_content || '';
    const json = result.document.json_content || null;

    // Use markdown as the primary text source — it includes table content
    // rendered as text, which is ideal for downstream parsing.
    const text = md || result.document.text_content || '';

    if (!text.trim()) return null;

    return {
      text,
      markdown: md,
      json,
      parsingEngine: 'docling',
    };
  } catch (err) {
    console.error('Docling Serve parse error:', err.message || err);
    return null;
  }
}

module.exports = {
  isDoclingConfigured,
  checkHealth,
  parsePdf,
  getClient,
};

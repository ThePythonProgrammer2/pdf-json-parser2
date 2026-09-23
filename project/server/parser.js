// server/parser.js
const pdfParse = require('pdf-parse');
const { PDFDocument } = require('pdf-lib');

/**
 * Parses PDF Buffer into structured JSON, using pdf-lib to auto-repair
 * broken XRef tables or stream headers beforehand.
 */
async function parsePdfToJson(dataBuffer) {
  if (!dataBuffer || !Buffer.isBuffer(dataBuffer)) {
    throw new Error('Invalid input payload: Expected a valid file Buffer.');
  }

  let processingBuffer = dataBuffer;

  // Step 1: Attempt auto-repair on broken or corrupted PDF structures
  try {
    const pdfDoc = await PDFDocument.load(dataBuffer, { ignoreEncryption: true });
    const repairedBytes = await pdfDoc.save();
    processingBuffer = Buffer.from(repairedBytes);
  } catch (repairError) {
    console.warn('[PDF Repair Warning]: Could not auto-repair stream, falling back to raw parser:', repairError.message);
  }

  // Step 2: Extract text content using pdf-parse
  try {
    const data = await pdfParse(processingBuffer);

    const rawText = data.text || '';
    const lines = rawText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    return {
      metadata: {
        totalPages: data.numpages || 0,
        info: data.info || {},
        version: data.version || '1.0'
      },
      stats: {
        totalCharacters: rawText.length,
        totalLines: lines.length
      },
      content: {
        rawText: rawText,
        lines: lines
      }
    };
  } catch (parseError) {
    console.error('[PDF Parsing Error]:', parseError.message);
    throw new Error(`Failed to process PDF: ${parseError.message}`);
  }
}

module.exports = { parsePdfToJson };

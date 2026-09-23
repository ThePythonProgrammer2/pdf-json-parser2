// server/parser.js
const pdfParse = require('pdf-parse');

/**
 * Extracts text and metadata from a PDF file buffer.
 * @param {Buffer} dataBuffer - The PDF file in memory
 * @returns {Promise<Object>} Formatted JSON payload containing text and structure
 */
async function parsePdfToJson(dataBuffer) {
  if (!dataBuffer || !(dataBuffer instanceof Buffer)) {
    throw new Error('Invalid payload: Expected a valid PDF file buffer.');
  }

  try {
    // Parse PDF buffer
    const parsedData = await pdfParse(dataBuffer);

    // Clean and normalize extracted text
    const rawText = parsedData.text || '';
    const lines = rawText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    return {
      metadata: {
        totalPages: parsedData.numpages || 0,
        info: parsedData.info || {},
        version: parsedData.version || 'unknown'
      },
      summary: {
        totalCharacters: rawText.length,
        totalLines: lines.length
      },
      content: {
        rawText: rawText,
        lines: lines
      }
    };
  } catch (error) {
    console.error('[PDF Parser Error]:', error.message);
    throw new Error(`Failed to parse PDF document: ${error.message}`);
  }
}

module.exports = { parsePdfToJson };

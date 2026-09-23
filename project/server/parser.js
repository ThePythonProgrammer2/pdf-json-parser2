const pdfParse = require('pdf-parse');

/**
 * Parses PDF buffer into structured JSON output
 * @param {Buffer} dataBuffer 
 * @returns {Promise<Object>}
 */
async function parsePdfToJson(dataBuffer) {
  if (!dataBuffer || !(dataBuffer instanceof Buffer)) {
    throw new Error('Invalid input: Expected a valid file buffer.');
  }

  const data = await pdfParse(dataBuffer);

  // Clean and split text into structural elements
  const lines = data.text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  return {
    metadata: {
      totalPages: data.numpages,
      info: data.info || {},
      version: data.version
    },
    rawText: data.text,
    lineCount: lines.length,
    lines: lines
  };
}

module.exports = { parsePdfToJson };

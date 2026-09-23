// server/parser.js
const pdfParse = require('pdf-parse');
const { PDFDocument } = require('pdf-lib');

/**
 * Fallback parser that extracts readable ASCII text directly from raw binary streams 
 * when PDF structure headers are completely corrupted or non-standard.
 */
function extractRawTextFromBuffer(buffer) {
  const str = buffer.toString('binary');
  // Match readable text chunks (3 or more consecutive printable characters)
  const matches = str.match(/[\x20-\x7E]{3,}/g) || [];
  
  // Filter out internal PDF operators and syntax keywords
  const filteredLines = matches
    .map(line => line.trim())
    .filter(line => 
      line.length > 2 && 
      !line.startsWith('/') && 
      !line.includes('obj') && 
      !line.includes('endobj') && 
      !line.includes('stream') &&
      !line.includes('endstream') &&
      !line.includes('xref')
    );

  return filteredLines.join('\n');
}

/**
 * Parses a PDF Buffer into structured JSON with a multi-stage fallback system.
 */
async function parsePdfToJson(dataBuffer) {
  if (!dataBuffer || !Buffer.isBuffer(dataBuffer)) {
    throw new Error('Invalid input payload: Expected a valid file Buffer.');
  }

  let processingBuffer = dataBuffer;

  // Stage 1: Attempt auto-repair on broken PDF structures via pdf-lib
  try {
    const pdfDoc = await PDFDocument.load(dataBuffer, { 
      ignoreEncryption: true,
      updateMetadata: false 
    });
    const repairedBytes = await pdfDoc.save();
    processingBuffer = Buffer.from(repairedBytes);
  } catch (repairError) {
    console.warn('[PDF Repair Warning]: Could not auto-repair stream with pdf-lib:', repairError.message);
  }

  // Stage 2: Standard PDF parsing via pdf-parse
  try {
    const data = await pdfParse(processingBuffer);

    const rawText = data.text || '';
    const lines = rawText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    // If text was successfully extracted, return standard response
    if (lines.length > 0) {
      return {
        metadata: {
          totalPages: data.numpages || 1,
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
    }
  } catch (parseError) {
    console.warn('[PDF Standard Parse Failed]: Triggering raw binary text extractor fallback...', parseError.message);
  }

  // Stage 3: Low-Level Binary Extraction Fallback (Guarantees output even for severely invalid PDFs)
  const fallbackText = extractRawTextFromBuffer(dataBuffer);
  const fallbackLines = fallbackText.split('\n').filter(line => line.length > 0);

  if (fallbackLines.length === 0) {
    throw new Error('The PDF document is severely corrupted or contains only raster images without an OCR layer.');
  }

  return {
    metadata: {
      totalPages: 1,
      info: { title: 'Raw Recovered Stream' },
      version: 'recovered'
    },
    stats: {
      totalCharacters: fallbackText.length,
      totalLines: fallbackLines.length
    },
    content: {
      rawText: fallbackText,
      lines: fallbackLines
    }
  };
}

module.exports = { parsePdfToJson };

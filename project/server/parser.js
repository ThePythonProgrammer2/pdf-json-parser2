// server/parser.js
const pdfParse = require('pdf-parse');

/**
 * Custom renderer options to prevent pdf-parse from crashing on bad XRef tables
 * or non-standard glyph maps.
 */
function renderPage(pageData) {
  const renderOptions = {
    normalizeWhitespace: true,
    disableCombineTextItems: false
  };

  return pageData.getTextContent(renderOptions).then((textContent) => {
    let lastY, text = '';
    for (let item of textContent.items) {
      if (lastY == item.transform[5] || !lastY) {
        text += item.str;
      } else {
        text += '\n' + item.str;
      }
      lastY = item.transform[5];
    }
    return text;
  });
}

/**
 * Parses PDF Buffer into structured JSON, handling corrupted XRef entries natively.
 * @param {Buffer} dataBuffer - Raw PDF buffer from Multer
 * @returns {Promise<Object>} Structured JSON output
 */
async function parsePdfToJson(dataBuffer) {
  if (!dataBuffer || !Buffer.isBuffer(dataBuffer)) {
    throw new Error('Invalid input payload: Expected a valid file Buffer.');
  }

  // Configuration options to recover from corrupted XRef tables
  const options = {
    pagerender: renderPage,
    max: 0 // Parse all pages
  };

  try {
    const data = await pdfParse(dataBuffer, options);

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
  } catch (error) {
    console.error('[PDF Parser Error]:', error.message);

    // Specific user-friendly error handling for common PDF structure issues
    if (error.message.includes('bad XRef') || error.message.includes('XRef')) {
      throw new Error(
        'The uploaded PDF has a damaged or corrupted cross-reference (XRef) table. Please re-save or flatten the document.'
      );
    }
    if (error.message.includes('Password')) {
      throw new Error('The uploaded PDF is password-protected or encrypted.');
    }

    throw new Error(`Failed to process PDF: ${error.message}`);
  }
}

module.exports = { parsePdfToJson };

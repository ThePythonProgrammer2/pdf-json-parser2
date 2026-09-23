// server/parser.js
const pdfParse = require('pdf-parse');

/**
 * Custom options for pdf-parse to prevent default test file loading bugs
 */
const parseOptions = {
  // Return standard page text
  pagerender: function(pageData) {
    return pageData.getTextContent().then(function(textContent) {
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
};

/**
 * Parses a PDF Buffer into structured JSON
 * @param {Buffer} dataBuffer 
 * @returns {Promise<Object>}
 */
async function parsePdfToJson(dataBuffer) {
  if (!dataBuffer || !Buffer.isBuffer(dataBuffer)) {
    throw new Error('Invalid input: Expected a valid Buffer object.');
  }

  try {
    const data = await pdfParse(dataBuffer, parseOptions);

    const rawText = data.text || '';
    const lines = rawText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

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
      text: rawText,
      lines: lines
    };
  } catch (error) {
    console.error('[pdf-parse engine error]:', error);
    throw new Error(`PDF Parsing failed: ${error.message || error}`);
  }
}

module.exports = { parsePdfToJson };

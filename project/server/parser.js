// server/parser.js
const pdfParse = require('pdf-parse');
const { PDFDocument } = require('pdf-lib');

/**
 * Categorizes a single text line into semantic JSON structures.
 */
function classifyLine(line) {
  const trimmed = line.trim();

  // 1. Email detection
  if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed)) {
    return { type: 'email', value: trimmed };
  }

  // 2. Phone number detection
  if (/^(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/.test(trimmed)) {
    return { type: 'phone', value: trimmed };
  }

  // 3. Web URL detection
  if (/^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/\S*)?$/.test(trimmed)) {
    return { type: 'url', value: trimmed };
  }

  // 4. Key-Value pairs (e.g., "Author: John Doe", "Skill: JavaScript")
  const kvMatch = trimmed.match(/^([A-Za-z0-9\s_]{2,25}):\s+(.+)$/);
  if (kvMatch) {
    return { type: 'key_value', key: kvMatch[1].trim(), value: kvMatch[2].trim() };
  }

  // 5. Bullet points
  if (/^[-•*▪➢]\s+/.test(trimmed) || /^\d+[\.\)]\s+/.test(trimmed)) {
    return { type: 'bullet_point', text: trimmed.replace(/^([-•*▪➢]|\d+[\.\)])\s*/, '') };
  }

  // 6. Section Headings (Short, uppercase or title case, no ending punctuation)
  const isShort = trimmed.length > 2 && trimmed.length <= 45;
  const isAllCaps = trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed);
  const isTitleCase = /^[A-Z][a-zA-Z0-9\s,&-]+$/.test(trimmed) && !/[.?!]$/.test(trimmed);

  if (isShort && (isAllCaps || isTitleCase)) {
    return { type: 'heading', text: trimmed };
  }

  // 7. Standard Paragraph
  return { type: 'paragraph', text: trimmed };
}

/**
 * Groups flattened elements under heading sections.
 */
function buildDocumentOutline(elements) {
  const sections = [];
  let currentSection = { title: 'General Content', items: [] };

  for (const item of elements) {
    if (item.type === 'heading') {
      if (currentSection.items.length > 0) {
        sections.push(currentSection);
      }
      currentSection = { title: item.text, items: [] };
    } else {
      currentSection.items.push(item);
    }
  }

  if (currentSection.items.length > 0) {
    sections.push(currentSection);
  }

  return sections;
}

/**
 * Cleans extracted raw lines and strips out PDF binary noise, 
 * xref tables, header signatures, and page numbers.
 */
function cleanRawLines(rawText) {
  return rawText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => {
      if (!line || line.length === 0) return false;

      // Filter standalone page numbers (e.g. "1", "2")
      if (/^\d+$/.test(line)) return false;

      // Filter PDF header signatures (e.g. "%PDF-1.3", "%PDF-1.7")
      if (/^%PDF-\d\.\d$/.test(line)) return false;

      // Filter PDF xref offset lines (e.g. "0000001213 00000 n", "0000000000 65535 f")
      if (/^\d{10}\s+\d{5}\s+[fn]$/.test(line)) return false;

      // Filter PDF internal timestamp metadata strings (e.g. "(D:20260921150427Z)")
      if (/^\(D:\d{14}Z\)$/.test(line)) return false;

      // Filter standard PDF stream operators and structures
      if (/^(trailer|%%EOF|xref|\d+\s+\d+\s+obj|endobj|stream|endstream|\(PDFKit\))$/i.test(line)) return false;

      // Filter short non-alphanumeric noise strings (e.g. "eq\"", "AW,", "3d<")
      if (line.length <= 4 && !/[a-zA-Z0-9]{2,}/.test(line)) return false;

      return true;
    });
}

/**
 * Fallback binary string extractor for severely damaged or non-standard PDFs.
 */
function extractRawTextFromBuffer(buffer) {
  const str = buffer.toString('binary');
  const matches = str.match(/[\x20-\x7E]{3,}/g) || [];
  
  return matches
    .map((line) => line.trim())
    .filter((line) => 
      line.length > 2 && 
      !line.startsWith('/') && 
      !line.includes('obj') && 
      !line.includes('endobj') && 
      !line.includes('stream') &&
      !line.includes('endstream') &&
      !line.includes('xref')
    )
    .join('\n');
}

/**
 * Production-grade Multi-Stage PDF Parser
 */
async function parsePdfToJson(dataBuffer) {
  if (!dataBuffer || !Buffer.isBuffer(dataBuffer)) {
    throw new Error('Invalid input payload: Expected a valid file Buffer.');
  }

  let processingBuffer = dataBuffer;

  // Stage 1: Auto-repair PDF structures via pdf-lib
  try {
    const pdfDoc = await PDFDocument.load(dataBuffer, { 
      ignoreEncryption: true,
      updateMetadata: false 
    });
    const repairedBytes = await pdfDoc.save();
    processingBuffer = Buffer.from(repairedBytes);
  } catch (repairError) {
    console.warn('[PDF Repair Warning]: Standard pdf-lib repair bypassed:', repairError.message);
  }

  // Stage 2: Extract text using pdf-parse
  let rawText = '';
  let totalPages = 1;
  let pdfInfo = {};

  try {
    const parsedData = await pdfParse(processingBuffer);
    rawText = parsedData.text || '';
    totalPages = parsedData.numpages || 1;
    pdfInfo = parsedData.info || {};
  } catch (parseError) {
    console.warn('[PDF Standard Parse Failed]: Executing raw binary extractor fallback...');
    rawText = extractRawTextFromBuffer(dataBuffer);
  }

  // Stage 3: Clean and filter line artifacts
  const cleanLines = cleanRawLines(rawText);

  if (cleanLines.length === 0) {
    throw new Error('PDF contains no extractable text or is a scanned image without an OCR layer.');
  }

  // Stage 4: Semantic categorization & Document outline construction
  const structuredElements = cleanLines.map(classifyLine);
  const documentOutline = buildDocumentOutline(structuredElements);

  // Extract core entities for rapid querying
  const extractedEntities = {
    emails: structuredElements.filter(e => e.type === 'email').map(e => e.value),
    phones: structuredElements.filter(e => e.type === 'phone').map(e => e.value),
    urls: structuredElements.filter(e => e.type === 'url').map(e => e.value),
    keyValues: structuredElements.filter(e => e.type === 'key_value').reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {})
  };

  return {
    metadata: {
      totalPages: totalPages,
      info: pdfInfo,
      processedAt: new Date().toISOString()
    },
    stats: {
      totalCharacters: rawText.length,
      cleanLineCount: cleanLines.length,
      totalSections: documentOutline.length
    },
    entities: extractedEntities,
    outline: documentOutline,
    content: {
      elements: structuredElements,
      rawLines: cleanLines
    }
  };
}

module.exports = { parsePdfToJson };

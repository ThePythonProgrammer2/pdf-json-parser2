// server/parser.js

// Polyfill missing browser DOM elements before requiring pdfjs-dist
if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = class DOMMatrix {
    constructor() {
      this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
    }
  };
}

if (typeof globalThis.Path2D === 'undefined') {
  globalThis.Path2D = class Path2D {};
}

const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');

// Disable external worker threads for Node execution
pdfjs.GlobalWorkerOptions.workerSrc = '';

/**
 * Helper: Convert Matrix Transform to Standard Spatial Bounding Box (top-left orientation)
 */
function transformToBBox(transform, pageHeight, fontHeight, stringLength = 1) {
  const x = transform[4];
  const y = pageHeight - transform[5]; // Invert Y-axis from PDF bottom-left to web top-left
  const scaleX = Math.sqrt(transform[0] * transform[0] + transform[1] * transform[1]);
  const scaleY = Math.sqrt(transform[2] * transform[2] + transform[3] * transform[3]);
  const measuredHeight = fontHeight || scaleY || 10;
  
  // Estimate character width based on scale or fallback factor
  const charWidth = scaleX || (measuredHeight * 0.5);
  const estimatedWidth = Math.max(charWidth * stringLength * 0.6, 5);

  return {
    x: Math.round(x * 100) / 100,
    y: Math.round((y - measuredHeight) * 100) / 100,
    width: Math.round(estimatedWidth * 100) / 100,
    height: Math.round(measuredHeight * 100) / 100
  };
}

/**
 * Helper: Convert RGB values to Hex color string
 */
function rgbToHex(rgb) {
  if (!rgb || !Array.isArray(rgb) || rgb.length < 3) return '#000000';
  return '#' + rgb.slice(0, 3).map(x => Math.round(x).toString(16).padStart(2, '0')).join('');
}

/**
 * Step 1: Merge fragmented text tokens on the same horizontal baseline (prevents word splitting)
 */
function mergeTextLineFragments(rawElements) {
  if (!rawElements || rawElements.length === 0) return [];

  // Sort by Y first, then X
  const sorted = [...rawElements].sort((a, b) => {
    const yDiff = a.bbox.y - b.bbox.y;
    if (Math.abs(yDiff) > 3) return yDiff;
    return a.bbox.x - b.bbox.x;
  });

  const merged = [];
  let current = null;

  sorted.forEach(el => {
    if (!current) {
      current = { ...el, style: { ...el.style } };
      return;
    }

    const sameLine = Math.abs(current.bbox.y - el.bbox.y) <= 3;
    const sameStyle = current.style.fontFamily === el.style.fontFamily &&
                      current.style.fontSize === el.style.fontSize &&
                      current.style.color === el.style.color;

    // Calculate gap between current end and next start
    const currentRight = current.bbox.x + current.bbox.width;
    const xGap = el.bbox.x - currentRight;

    // Merge if on same line, similar styling, and horizontally adjacent (less than 15px gap)
    if (sameLine && sameStyle && xGap >= -5 && xGap <= 15) {
      // Add space if there is a positive gap and no trailing space
      const needsSpace = xGap > 1 && !current.text.endsWith(' ') && !el.text.startsWith(' ');
      current.text += (needsSpace ? ' ' : '') + el.text;
      current.bbox.width = Math.round(((el.bbox.x + el.bbox.width) - current.bbox.x) * 100) / 100;
    } else {
      merged.push(current);
      current = { ...el, style: { ...el.style } };
    }
  });

  if (current) merged.push(current);
  return merged;
}

/**
 * Step 2: Strict Table Extraction
 * Requires aligned column boundaries and at least 3 uniform rows to prevent false paragraph tables.
 */
function reconstructTables(items) {
  const yGroups = [];
  const sortedByY = [...items].sort((a, b) => a.bbox.y - b.bbox.y);

  // Group items into rows by Y coordinate (4px tolerance)
  sortedByY.forEach(item => {
    let group = yGroups.find(g => Math.abs(g.y - item.bbox.y) < 4);
    if (!group) {
      group = { y: item.bbox.y, items: [] };
      yGroups.push(group);
    }
    group.items.push(item);
  });

  // Filter candidate rows containing 2+ column cells
  const multiCellRows = yGroups
    .filter(g => g.items.length >= 2)
    .map(g => ({
      y: g.y,
      cells: g.items.sort((a, b) => a.bbox.x - b.bbox.x)
    }));

  // REQUIREMENT 1: Must have at least 3 distinct rows to form a valid table
  if (multiCellRows.length < 3) return [];

  // REQUIREMENT 2: Validate structural column alignment across candidate rows
  const rowColumnCounts = multiCellRows.map(r => r.cells.length);
  const primaryColCount = rowColumnCounts[0];
  const matchingRows = rowColumnCounts.filter(count => Math.abs(count - primaryColCount) <= 1).length;

  // Reject if fewer than 70% of rows share the column structure (standard prose paragraph artifact)
  if ((matchingRows / multiCellRows.length) < 0.7) return [];

  const matrix = [];
  const headerRow = multiCellRows[0];

  multiCellRows.forEach((row, rowIndex) => {
    const rowObj = {
      rowIndex,
      y: row.y,
      cells: []
    };

    row.cells.forEach((cell, colIndex) => {
      const headerCell = headerRow.cells[colIndex];
      rowObj.cells.push({
        columnIndex: colIndex,
        associatedHeader: (rowIndex > 0 && headerCell) ? headerCell.text.trim() : null,
        text: cell.text.trim(),
        bbox: cell.bbox,
        colspan: 1,
        rowspan: 1
      });
    });
    matrix.push(rowObj);
  });

  return [{
    tableId: `tbl_${Math.random().toString(36).substring(2, 9)}`,
    rowCount: matrix.length,
    columnCount: primaryColCount,
    matrix
  }];
}

/**
 * Core PDF Spatial Parsing Function
 */
async function parsePdfToJson(dataBuffer) {
  if (!dataBuffer || !Buffer.isBuffer(dataBuffer)) {
    throw new Error('Invalid input payload: Expected a valid file Buffer.');
  }

  const uint8Array = new Uint8Array(dataBuffer);
  const loadingTask = pdfjs.getDocument({
    data: uint8Array,
    useSystemFonts: true,
    disableFontFace: true
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  const pagesOutput = [];
  const globalEntities = { emails: [], phones: [], urls: [] };
  let nodeCounter = 0;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();
    let annotations = [];
    
    try {
      annotations = await page.getAnnotations();
    } catch (e) {
      annotations = [];
    }

    const rawElements = [];
    const hiddenElements = [];

    // 1. Text & Font Extraction with Hidden Layer Detection
    textContent.items.forEach((item) => {
      if (!item.str || item.str.trim() === '') return;

      const fontStyle = textContent.styles[item.fontName] || {};
      const bbox = transformToBBox(item.transform, viewport.height, item.height, item.str.length);

      const isHidden = (
        (fontStyle.fontFamily && fontStyle.fontFamily.includes('Invisible')) ||
        item.transform[0] === 0 || 
        item.transform[3] === 0
      );

      const elementNode = {
        id: `node_p${pageNum}_${++nodeCounter}`,
        text: item.str,
        bbox,
        style: {
          fontFamily: fontStyle.fontFamily || item.fontName,
          fontSize: Math.round(item.height || fontStyle.ascent || 10),
          isBold: fontStyle.bold || /bold|black|heavy/i.test(item.fontName),
          isItalic: fontStyle.italic || /italic|oblique/i.test(item.fontName),
          color: rgbToHex(item.color)
        },
        direction: item.dir
      };

      if (isHidden) {
        hiddenElements.push(elementNode);
      } else {
        rawElements.push(elementNode);
      }

      // Entity Extraction
      const emailMatches = item.str.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
      if (emailMatches) globalEntities.emails.push(...emailMatches);

      const urlMatches = item.str.match(/https?:\/\/[^\s]+/g);
      if (urlMatches) globalEntities.urls.push(...urlMatches);
    });

    // Merge fragmented inline text items prior to layout classification
    const unifiedElements = mergeTextLineFragments(rawElements);

    // 2. Spatial Layout & Role Classification
    const headerBoundary = viewport.height * 0.08;
    const footerBoundary = viewport.height * 0.92;

    const classifiedElements = unifiedElements.map(el => {
      let role = 'body';
      if (el.bbox.y < headerBoundary) role = 'header';
      else if (el.bbox.y > footerBoundary) role = 'footer';
      else if (el.style.fontSize > 16) role = 'heading';

      return { ...el, role };
    });

    // 3. Table Reconstruction
    const tables = reconstructTables(classifiedElements);

    // 4. Interactive Links / Annotations
    const interactiveLayers = annotations.map(annot => ({
      id: `annot_${annot.id}`,
      type: annot.subtype,
      rect: annot.rect,
      url: annot.url || null,
      fieldName: annot.fieldName || null,
      fieldValue: annot.fieldValue || null
    }));

    pagesOutput.push({
      pageNumber: pageNum,
      dimensions: { width: viewport.width, height: viewport.height },
      tables,
      interactiveLayers,
      securityAudit: {
        hiddenTextDetected: hiddenElements.length > 0,
        hiddenCount: hiddenElements.length,
        hiddenNodes: hiddenElements
      },
      elements: classifiedElements
    });
  }

  return {
    metadata: {
      totalPages: numPages,
      processedAt: new Date().toISOString(),
      engineVersion: "4.0.0-enterprise"
    },
    entities: {
      emails: [...new Set(globalEntities.emails)],
      urls: [...new Set(globalEntities.urls)]
    },
    pages: pagesOutput
  };
}

module.exports = { parsePdfToJson };

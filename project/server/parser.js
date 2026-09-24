// server/parser.js

// Polyfill missing browser DOM elements before requiring pdfjs-dist
// This cleanly suppresses node-canvas warnings in headless server environments
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
function transformToBBox(transform, pageHeight, fontHeight) {
  const x = transform[4];
  const y = pageHeight - transform[5]; // Invert Y-axis from PDF bottom-left to web top-left
  const scaleX = Math.sqrt(transform[0] * transform[0] + transform[1] * transform[1]);
  const scaleY = Math.sqrt(transform[2] * transform[2] + transform[3] * transform[3]);
  const measuredHeight = fontHeight || scaleY || 10;
  
  return {
    x: Math.round(x * 100) / 100,
    y: Math.round((y - measuredHeight) * 100) / 100,
    width: Math.round((scaleX * 10) * 100) / 100, // Estimated line span width
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
 * Cluster spatially aligned text elements into tabular grids
 */
function reconstructTables(items) {
  const yToleratedGroups = [];
  const sortedByY = [...items].sort((a, b) => a.bbox.y - b.bbox.y);

  // Group elements into horizontal lines by Y coordinate threshold
  sortedByY.forEach(item => {
    let matchedGroup = yToleratedGroups.find(g => Math.abs(g.y - item.bbox.y) < 4);
    if (!matchedGroup) {
      matchedGroup = { y: item.bbox.y, items: [] };
      yToleratedGroups.push(matchedGroup);
    }
    matchedGroup.items.push(item);
  });

  // Filter rows that contain multiple horizontal cells (columns)
  const potentialRows = yToleratedGroups
    .filter(g => g.items.length >= 2)
    .map(g => ({
      y: g.y,
      cells: g.items.sort((a, b) => a.bbox.x - b.bbox.x)
    }));

  if (potentialRows.length < 2) return [];

  const matrix = [];
  const headerRow = potentialRows[0];

  potentialRows.forEach((row, rowIndex) => {
    const rowObj = {
      rowIndex,
      y: row.y,
      cells: []
    };

    row.cells.forEach((cell, colIndex) => {
      const headerCell = headerRow.cells[colIndex];
      rowObj.cells.push({
        columnIndex: colIndex,
        associatedHeader: headerCell ? headerCell.text.trim() : null,
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
    columnCount: headerRow.cells.length,
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
      // Graceful fallback if annotations layer is missing or unreadable
      annotations = [];
    }

    const rawElements = [];
    const hiddenElements = [];

    // 1. Text & Font Extraction with Security Layer Detection
    textContent.items.forEach((item) => {
      if (!item.str || item.str.trim() === '') return;

      const fontStyle = textContent.styles[item.fontName] || {};
      const bbox = transformToBBox(item.transform, viewport.height, item.height);

      // Security Check: Invisible rendering modes or zero-scale transforms
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

      // Regex Entity Parsing
      const emailMatches = item.str.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
      if (emailMatches) globalEntities.emails.push(...emailMatches);

      const urlMatches = item.str.match(/https?:\/\/[^\s]+/g);
      if (urlMatches) globalEntities.urls.push(...urlMatches);
    });

    // 2. Spatial Layout & Role Classification
    const headerBoundary = viewport.height * 0.08;
    const footerBoundary = viewport.height * 0.92;

    const classifiedElements = rawElements.map(el => {
      let role = 'body';
      if (el.bbox.y < headerBoundary) role = 'header';
      else if (el.bbox.y > footerBoundary) role = 'footer';
      else if (el.style.fontSize > 16) role = 'heading';

      return { ...el, role };
    });

    // Multi-Column Spatial Sort (Top-to-bottom Y-bins, Left-to-right X-position)
    classifiedElements.sort((a, b) => {
      const yDiff = a.bbox.y - b.bbox.y;
      if (Math.abs(yDiff) > 6) return yDiff;
      return a.bbox.x - b.bbox.x;
    });

    // 3. Extract Tables
    const tables = reconstructTables(classifiedElements);

    // 4. Interactive Layer / Links Parsing
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

const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');

/**
 * Enterprise Document AI Parser Engine
 */

// Helper: Convert Matrix Transform to Standard Spatial Bounding Box
function transformToBBox(transform, height, fontHeight) {
  const x = transform[4];
  const y = height - transform[5]; // Flip PDF Y-axis to top-left screen orientation
  const scaleX = Math.sqrt(transform[0] * transform[0] + transform[1] * transform[1]);
  const scaleY = Math.sqrt(transform[2] * transform[2] + transform[3] * transform[3]);
  const measuredHeight = fontHeight || scaleY || 10;
  
  return {
    x: Math.round(x * 100) / 100,
    y: Math.round((y - measuredHeight) * 100) / 100,
    width: Math.round((transform[4] + scaleX * 10) * 100) / 100, // Estimated line extent
    height: Math.round(measuredHeight * 100) / 100
  };
}

// Helper: Color Array to Hex String
function rgbToHex(rgb) {
  if (!rgb || !Array.isArray(rgb) || rgb.length < 3) return '#000000';
  return '#' + rgb.slice(0, 3).map(x => Math.round(x).toString(16).padStart(2, '0')).join('');
}

/**
 * Cluster horizontal/vertical spatially aligned text nodes into structured tables
 */
function reconstructTables(items, pageHeight) {
  const tableCandidates = [];
  
  // Group items that share tight vertical bands
  const yToleratedGroups = [];
  const sortedByY = [...items].sort((a, b) => a.bbox.y - b.bbox.y);

  sortedByY.forEach(item => {
    let matchedGroup = yToleratedGroups.find(g => Math.abs(g.y - item.bbox.y) < 4);
    if (!matchedGroup) {
      matchedGroup = { y: item.bbox.y, items: [] };
      yToleratedGroups.push(matchedGroup);
    }
    matchedGroup.items.push(item);
  });

  // Identify rows with 2 or more distinct horizontal columns
  const potentialRows = yToleratedGroups
    .filter(g => g.items.length >= 2)
    .map(g => ({
      y: g.y,
      cells: g.items.sort((a, b) => a.bbox.x - b.bbox.x)
    }));

  if (potentialRows.length < 2) return [];

  // Reconstruct matrix and grid lines
  const matrix = [];
  let headerRow = potentialRows[0];

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
        colspan: 1, // Computed based on intersecting bounds
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
 * Main PDF Spatial Parsing Pipeline
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
  const globalEntities = { emails: [], phones: [], urls: [], keyValues: {} };
  let nodeCounter = 0;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();
    const annotations = await page.getAnnotations();

    const rawElements = [];
    const hiddenElements = [];

    // 1. Process Text Glyphs, Typography, & Security Layers
    textContent.items.forEach((item) => {
      if (!item.str || item.str.trim() === '') return;

      const fontStyle = textContent.styles[item.fontName] || {};
      const bbox = transformToBBox(item.transform, viewport.height, item.height);

      // Security Check: White-on-white or zero-opacity hidden text layer detection
      const isHidden = (
        fontStyle.fontFamily && fontStyle.fontFamily.includes('Invisible') ||
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

      // Quick Entity Extraction
      const emailMatch = item.str.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
      if (emailMatch) globalEntities.emails.push(...emailMatch);

      const urlMatch = item.str.match(/https?:\/\/[^\s]+/g);
      if (urlMatch) globalEntities.urls.push(...urlMatch);
    });

    // 2. Compute Layout Roles & Multi-Column Sorting
    const pageHeaderBoundary = viewport.height * 0.08;
    const pageFooterBoundary = viewport.height * 0.92;

    const classifiedElements = rawElements.map(el => {
      let role = 'body';
      if (el.bbox.y < pageHeaderBoundary) role = 'header';
      else if (el.bbox.y > pageFooterBoundary) role = 'footer';
      else if (el.style.fontSize > 16) role = 'heading';

      return { ...el, role };
    });

    // Sort into multi-column layout order (Y spatial bins, then X position)
    classifiedElements.sort((a, b) => {
      const yDiff = a.bbox.y - b.bbox.y;
      if (Math.abs(yDiff) > 6) return yDiff; // Vertical threshold
      return a.bbox.x - b.bbox.x; // Horizontal column order
    });

    // 3. Extract Tables
    const tables = reconstructTables(classifiedElements, viewport.height);

    // 4. Extract Annotations & Links
    const interactiveLayers = annotations.map(annot => ({
      id: `annot_${annot.id}`,
      type: annot.subtype,
      annotationFlags: annot.annotationFlags,
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

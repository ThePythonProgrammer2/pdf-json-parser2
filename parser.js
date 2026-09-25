const crypto = require('crypto');

/**
 * Computes a SHA-256 hash of a Buffer for cache keying.
 * @param {Buffer} buffer
 * @returns {string}
 */
function hashBuffer(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Generates a brief 2-sentence raw summary from extracted text.
 * @param {string} text
 * @param {string} docType
 * @param {string|null} primaryEntity
 * @returns {string}
 */
function buildSummary(text, docType, primaryEntity) {
  if (docType === 'invoice') {
    return `This appears to be an invoice${primaryEntity ? ` from ${primaryEntity}` : ''}. ` +
      `Key details include line items, dates, and financial amounts extracted from the document text.`;
  }
  if (docType === 'resume') {
    return `This appears to be a resume${primaryEntity ? ` for ${primaryEntity}` : ''}. ` +
      `The document outlines professional experience, skills, and qualifications for a job candidate.`;
  }
  return `This document could not be confidently classified as an invoice or resume. ` +
    `Some structural data was extracted but the document type remains uncertain.`;
}

/**
 * Attempts to detect the currency symbol/code from text.
 * @param {string} text
 * @returns {string|null}
 */
function detectCurrency(text) {
  const currencyPatterns = [
    { regex: /\$/g, code: 'USD' },
    { regex: /€/g, code: 'EUR' },
    { regex: /£/g, code: 'GBP' },
    { regex: /¥/g, code: 'JPY' },
    { regex: /₹/g, code: 'INR' },
  ];
  for (const p of currencyPatterns) {
    if (p.regex.test(text)) return p.code;
  }
  const codeMatch = text.match(/\b(USD|EUR|GBP|JPY|INR|CAD|AUD|CHF|CNY)\b/i);
  return codeMatch ? codeMatch[1].toUpperCase() : null;
}

/**
 * Escapes a string for safe use inside a RegExp.
 * @param {string} s
 * @returns {string}
 */
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extracts and sanitizes line items from invoice text.
 *
 * Each item is returned as a structured object with:
 *   - description: raw text line item (sanitized)
 *   - quantity: numeric quantity if detectable, else null
 *   - unit_price: numeric price if detectable, else null
 *   - total_price: numeric line total if detectable, else null
 *
 * Strictly ensures only real line items (description + numeric price)
 * are retained — header rows, subtotals, and tax lines are excluded.
 *
 * @param {string} text
 * @returns {Array<{description: string, quantity: number|null, unit_price: number|null, total_price: number|null}>}
 */
function extractInvoiceItems(text) {
  const items = [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  const headerPattern = /^(item|description|qty|quantity|subtotal|sub\s*total|total|grand\s*total|total\s*due|amount\s*due|tax|vat|sales\s*tax|gst|discount|amount|s\.no|sl\.no|#|date|invoice|bill\s+to|ship\s+to|balance|payment|remit|terms)/i;

  for (const line of lines) {
    if (headerPattern.test(line)) continue;
    if (line.length < 3) continue;

    let description = null;
    let quantity = null;
    let unitPrice = null;
    let totalPrice = null;

    // Pattern A: "Description  2 x $10.00" or "Description  2 @ $10.00"
    const qtyPriceMatch = line.match(/^(.+?)\s+(\d+)\s*[xX@]\s*[\$€£₹]?([\d,]+\.?\d*)\s*$/);
    if (qtyPriceMatch && qtyPriceMatch[1].trim().length > 2) {
      description = qtyPriceMatch[1].trim();
      quantity = parseInt(qtyPriceMatch[2], 10);
      unitPrice = parseFloat(qtyPriceMatch[3].replace(/,/g, ''));
      totalPrice = quantity * unitPrice;
    }

    // Pattern B: "Description     $1,200.00" (trailing price, no quantity)
    if (!description) {
      const trailingPriceMatch = line.match(/^(.+?)\s+[\$€£₹]?([\d,]+\.?\d*)\s*$/);
      if (trailingPriceMatch && trailingPriceMatch[1].trim().length > 2) {
        const rawDesc = trailingPriceMatch[1].trim();
        if (!/^[\\d,]+$/.test(rawDesc)) {
          description = rawDesc;
          totalPrice = parseFloat(trailingPriceMatch[2].replace(/,/g, ''));
        }
      }
    }

    // Pattern C: tab-separated "Description\t$500.00"
    if (!description) {
      const tabMatch = line.match(/^(.+?)\t+[\$€£₹]?([\d,]+\.?\d*)\s*$/);
      if (tabMatch && tabMatch[1].trim().length > 2) {
        description = tabMatch[1].trim();
        totalPrice = parseFloat(tabMatch[2].replace(/,/g, ''));
      }
    }

    // Pattern D: "Description  qty  unit_price  line_total" (4-column table row)
    if (!description) {
      const fourColMatch = line.match(/^(.+?)\s+(\d+)\s+[\$€£₹]?([\d,]+\.?\d*)\s+[\$€£₹]?([\d,]+\.?\d*)\s*$/);
      if (fourColMatch && fourColMatch[1].trim().length > 2) {
        description = fourColMatch[1].trim();
        quantity = parseInt(fourColMatch[2], 10);
        unitPrice = parseFloat(fourColMatch[3].replace(/,/g, ''));
        totalPrice = parseFloat(fourColMatch[4].replace(/,/g, ''));
      }
    }

    if (description) {
      const cleanDesc = description.replace(/\s+/g, ' ').trim();
      if (cleanDesc.length >= 2) {
        items.push({
          description: cleanDesc,
          quantity: !isNaN(quantity) ? quantity : null,
          unit_price: !isNaN(unitPrice) ? unitPrice : null,
          total_price: !isNaN(totalPrice) ? totalPrice : null,
        });
      }
    }

    if (items.length >= 20) break;
  }
  return items;
}

/**
 * Stop words that should never appear in the sanitized skills list.
 */
const RESUME_STOP_WORDS = new Set([
  'and', 'or', 'the', 'a', 'an', 'with', 'in', 'of', 'for', 'to', 'at', 'by',
  'from', 'on', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'may', 'might', 'can', 'shall', 'must', 'this', 'that', 'these', 'those',
  'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'she', 'it', 'they', 'their',
  'strong', 'excellent', 'good', 'great', 'proficient', 'familiar', 'knowledge',
  'experience', 'experienced', 'skills', 'skill', 'ability', 'abilities',
  'including', 'include', 'includes', 'such', 'well', 'very', 'also', 'not',
  'but', 'however', 'while', 'during', 'about', 'into', 'than', 'then', 'so',
  'if', 'because', 'since', 'until', 'before', 'after', 'above', 'below',
  'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'once',
  'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more',
  'most', 'other', 'some', 'any', 'no', 'nor', 'only', 'own', 'same', 'too',
  'just', 'now', 'team', 'work', 'working', 'worked', 'role', 'roles',
  'responsibilities', 'responsible', 'duties', 'duty', 'position', 'positions',
  'company', 'companies', 'field', 'industry', 'sector', 'level', 'years',
  'year', 'months', 'month', 'present', 'current', 'former', 'previous',
  'university', 'college', 'school', 'degree', 'bachelor', 'master', 'phd',
  'diploma', 'certificate', 'certified', 'certification', 'certifications',
  'summary', 'objective', 'profile', 'contact', 'email', 'phone', 'address',
  'linkedin', 'github', 'portfolio', 'website', 'references', 'available',
  'upon', 'request', 'page', 'curriculum', 'vitae', 'resume', 'candidate',
]);

/**
 * Known technical skills and technologies to match against resume text.
 */
const KNOWN_SKILLS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin',
  'Scala', 'R', 'MATLAB', 'Perl', 'Dart', 'Elixir', 'Haskell', 'Clojure', 'Lua', 'Objective-C',
  'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Next.js', 'Nuxt', 'Django', 'Flask', 'Spring', 'Laravel',
  'FastAPI', 'Gin', 'Echo', 'Svelte', 'Remix', 'Astro', 'Solid.js',
  'HTML', 'HTML5', 'CSS', 'CSS3', 'SASS', 'SCSS', 'Tailwind', 'Bootstrap', 'Material UI', 'Chakra UI',
  'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'GraphQL', 'SQLite', 'Oracle', 'MariaDB', 'Cassandra',
  'DynamoDB', 'Elasticsearch', 'Firebase', 'Supabase', 'Prisma', 'TypeORM', 'Sequelize',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Jenkins', 'Git', 'GitHub', 'GitLab', 'Bitbucket',
  'REST', 'API', 'Microservices', 'Terraform', 'Ansible', 'Linux', 'Bash', 'PowerShell',
  'Nginx', 'Apache', 'Cloudflare', 'Vercel', 'Netlify', 'Heroku', 'DigitalOcean',
  'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'Scikit-learn',
  'Keras', 'NLTK', 'OpenCV', 'NLP', 'Computer Vision', 'Data Science', 'Big Data', 'Hadoop', 'Spark',
  'Kafka', 'RabbitMQ', 'WebSockets', 'gRPC',
  'Agile', 'Scrum', 'Kanban', 'Jira', 'Confluence', 'Trello', 'Asana',
  'Figma', 'Photoshop', 'Illustrator', 'Sketch', 'Adobe XD', 'InDesign',
  'Excel', 'Power BI', 'Tableau', 'Looker', 'Google Analytics', 'Salesforce',
  'DevOps', 'SRE', 'Serverless', 'Lambda',
  'Selenium', 'Cypress', 'Jest', 'Mocha', 'Chai', 'Vitest', 'Playwright', 'Testing Library',
  'Webpack', 'Vite', 'Rollup', 'Babel', 'ESLint', 'Prettier', 'Turborepo',
  'Storybook', 'Redux', 'Zustand', 'MobX', 'Recoil', 'React Query', 'SWR',
  'OAuth', 'JWT', 'SAML', 'SSO', 'RBAC', 'PKCE',
];

/**
 * Extracts past company names from the Experience section of a resume.
 * Looks for patterns like "Developer at TechCorp" or "Company: Google".
 * @param {string} text
 * @returns {string[]}
 */
function extractResumeCompanies(text) {
  const companies = [];
  const seen = new Set();

  // Pattern: "Title at CompanyName"
  const atMatches = text.matchAll(/\b(?:at|@)\s+([A-Z][\w&.,'\- ]{2,40})(?:\s*\(|\s*$|\s*\n)/gm);
  for (const m of atMatches) {
    const name = m[1].trim().replace(/[.,]$/, '');
    if (name.length < 3) continue;
    if (/^(the|a|an|school|university|college|home|work|least)\b/i.test(name)) continue;
    if (!seen.has(name.toLowerCase())) {
      seen.add(name.toLowerCase());
      companies.push(name);
    }
    if (companies.length >= 8) break;
  }

  // Pattern: lines under "Experience" that look like "Company Name - Title"
  const expSection = text.match(/(?:work\s+)?experience[:\s]*([\s\S]*?)(?:\n\s*\n|education|skills|certifications|projects|$)/i);
  if (expSection) {
    const expLines = expSection[1].split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of expLines) {
      const dashMatch = line.match(/^([A-Z][\w&.,'\- ]{2,40})\s*[—\-|]\s+/);
      if (dashMatch) {
        const name = dashMatch[1].trim();
        if (!seen.has(name.toLowerCase()) && name.length >= 3) {
          seen.add(name.toLowerCase());
          companies.push(name);
        }
      }
      if (companies.length >= 8) break;
    }
  }

  return companies;
}

/**
 * Extracts certifications from resume text.
 * @param {string} text
 * @returns {string[]}
 */
function extractCertifications(text) {
  const certs = [];
  const seen = new Set();

  // Look for a Certifications section
  const certSection = text.match(/certifications?[:\s]*([\s\S]*?)(?:\n\s*\n|experience|education|skills|projects|awards|$)/i);
  if (certSection) {
    const certLines = certSection[1].split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of certLines) {
      if (line.length < 4) continue;
      const clean = line.replace(/^[•·\-*\d.\)]+\s*/, '').trim();
      if (clean.length < 4) continue;
      if (/certified|certification|certificate|AWS|Azure|Google|PMP|Scrum|ITIL|CISSP|CCNA|CCNP|CEH|OSCP|CompTIA|TOGAF/i.test(clean)) {
        if (!seen.has(clean.toLowerCase())) {
          seen.add(clean.toLowerCase());
          certs.push(clean);
        }
      }
    }
  }

  // Also scan full text for inline certification mentions
  const inlineCertPatterns = [
    /\b(AWS Certified [\w \-]+?)\b/g,
    /\b(Azure Certified [\w \-]+?)\b/g,
    /\b(Google (?:Cloud|Analytics) Certified [\w \-]+?)\b/g,
    /\b(PMP Certified)\b/g,
    /\b(Certified [\w]+ [\w]+)\b/g,
    /\b(CISSP|CCNA|CCNP|CEH|OSCP|CompTIA [\w+]+|TOGAF \d)\b/g,
    /\b((?:Professional|Associate) [\w]+ Certificate)\b/gi,
  ];

  for (const pattern of inlineCertPatterns) {
    const matches = text.matchAll(pattern);
    for (const m of matches) {
      const cert = m[1].trim();
      if (cert.length >= 4 && !seen.has(cert.toLowerCase())) {
        seen.add(cert.toLowerCase());
        certs.push(cert);
      }
    }
  }

  return certs.slice(0, 10);
}

/**
 * Extracts and sanitizes skills, certifications, and past company names
 * from resume text. Filters out stop words and generic phrases so only
 * meaningful technical/professional terms remain.
 *
 * @param {string} text
 * @returns {Array<{type: 'skill'|'certification'|'company', value: string}>}
 */
function extractResumeSkills(text) {
  const results = [];
  const seen = new Set();

  // --- 1. Known technical skills ---
  const skillsSectionMatch = text.match(/(?:technical\s+)?skills[:\s]*([\s\S]*?)(?:\n\s*\n|experience|education|certifications|projects|$)/i);
  const skillsText = skillsSectionMatch ? skillsSectionMatch[1] : text;

  const matchedSkills = [];
  for (const skill of KNOWN_SKILLS) {
    const re = new RegExp('\\b' + escapeRegex(skill) + '\\b', 'i');
    if (re.test(skillsText)) {
      matchedSkills.push(skill);
    }
    if (matchedSkills.length >= 20) break;
  }

  // If we found very few known skills, try splitting by commas/pipes in skills section
  if (matchedSkills.length < 3 && skillsSectionMatch) {
    const parts = skillsText.split(/[,|•·\n;]/).map(s => s.trim()).filter(s => s.length > 1 && s.length < 50);
    for (const part of parts) {
      const wordsInPart = part.toLowerCase().split(/\s+/);
      const hasStopWord = wordsInPart.some(w => RESUME_STOP_WORDS.has(w));
      const isAllStopWords = wordsInPart.every(w => RESUME_STOP_WORDS.has(w));
      if (!isAllStopWords && part.length > 1 && part.length < 50) {
        let cleanPart = part;
        while (cleanPart.split(' ').length > 1 && RESUME_STOP_WORDS.has(cleanPart.split(' ')[0].toLowerCase())) {
          cleanPart = cleanPart.split(' ').slice(1).join(' ');
        }
        if (cleanPart.length > 1 && !hasStopWord) {
          matchedSkills.push(cleanPart);
        }
      }
    }
  }

  // Add skills to results (deduplicated)
  for (const skill of matchedSkills.slice(0, 20)) {
    const key = skill.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      results.push({ type: 'skill', value: skill });
    }
  }

  // --- 2. Certifications ---
  const certs = extractCertifications(text);
  for (const cert of certs) {
    const key = cert.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      results.push({ type: 'certification', value: cert });
    }
  }

  // --- 3. Past company names ---
  const companies = extractResumeCompanies(text);
  for (const company of companies) {
    const key = company.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      results.push({ type: 'company', value: company });
    }
  }

  return results;
}

/**
 * Extracts person name from resume text (usually at the top).
 * @param {string} text
 * @returns {string|null}
 */
function extractPersonName(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 5)) {
    if (/^[A-Z][a-zA-Z.'-]+(?:\s+[A-Z][a-zA-Z.'-]+){1,3}$/.test(line)) {
      return line;
    }
  }
  const nameMatch = text.match(/(?:^|\n)\s*(?:name|candidate)\s*[:\-]\s*(.+?)(?:\n|$)/i);
  if (nameMatch) return nameMatch[1].trim();
  return lines[0] ? lines[0].slice(0, 60) : null;
}

/**
 * Extracts company name from invoice text.
 * @param {string} text
 * @returns {string|null}
 */
function extractCompanyName(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 8)) {
    if (/invoice|receipt|bill/i.test(line)) continue;
    if (/^(from|biller|vendor|seller|company)\s*[:\-]\s*(.+)/i.test(line)) {
      return line.replace(/^(from|biller|vendor|seller|company)\s*[:\-]\s*/i, '').trim();
    }
    if (line.length > 2 && line.length < 60 && /^[A-Z][\w&.,'\- ]+$/.test(line) && /\b(LLC|Inc|Ltd|Corp|Corporation|Co|GmbH|S\.A\.|Pvt)\b/i.test(line)) {
      return line;
    }
  }
  for (const line of lines.slice(0, 5)) {
    if (!/invoice|receipt|bill|date|invoice\s*#/i.test(line) && line.length > 2 && line.length < 60) {
      return line;
    }
  }
  return null;
}

/**
 * Extracts date in YYYY-MM-DD format.
 * @param {string} text
 * @returns {string|null}
 */
function extractDate(text) {
  const datePatterns = [
    /(\d{4})-(\d{1,2})-(\d{1,2})/,
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    /(\d{1,2})\.(\d{1,2})\.(\d{4})/,
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/i,
    /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i,
  ];

  const months = {
    january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
    july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
  };

  const dateContextMatch = text.match(/(?:date|invoice\s*date|issue\s*date)\s*[:\-]?\s*(.+)/i);
  const searchArea = dateContextMatch ? dateContextMatch[1].slice(0, 50) : text;

  let m = searchArea.match(datePatterns[0]);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;

  m = searchArea.match(datePatterns[1]);
  if (m) return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;

  m = searchArea.match(datePatterns[2]);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;

  m = searchArea.match(datePatterns[3]);
  if (m) return `${m[3]}-${months[m[1].toLowerCase()]}-${m[2].padStart(2, '0')}`;

  m = searchArea.match(datePatterns[4]);
  if (m) return `${m[3]}-${months[m[2].toLowerCase()]}-${m[1].padStart(2, '0')}`;

  return null;
}

/**
 * Extracts financial amounts (total, tax).
 * @param {string} text
 * @returns {{totalAmount: number|null, taxAmount: number|null}}
 */
function extractFinancials(text) {
  const result = { totalAmount: null, taxAmount: null };

  const totalPatterns = [
    /(?:grand\s*total|total\s*due|amount\s*due|total\s*amount|balance\s*due)\s*[:\-]?\s*[\$€£₹]?\s*([\d,]+\.?\d*)/i,
    /(?:^|\n)\s*total\s*[:\-]?\s*[\$€£₹]?\s*([\d,]+\.?\d*)/i,
    /(?:^|\n)\s*total\s+([\d,]+\.?\d*)/i,
  ];

  for (const pattern of totalPatterns) {
    const m = text.match(pattern);
    if (m) {
      const val = parseFloat(m[1].replace(/,/g, ''));
      if (!isNaN(val) && val > 0) {
        result.totalAmount = val;
        break;
      }
    }
  }

  const taxPatterns = [
    /(?:tax|vat|sales\s*tax|gst)\s*(?:\([^)]*\))?\s*[:\-]?\s*[\$€£₹]?\s*([\d,]+\.?\d*)/i,
    /(?:tax|vat)\s*[\(%]\s*(\d+(?:\.\d+)?)\s*[)%]?\s*[\$€£₹]?\s*([\d,]+\.?\d*)/i,
  ];

  for (const pattern of taxPatterns) {
    const m = text.match(pattern);
    if (m) {
      const raw = (m[2] !== undefined && m[2] !== '') ? m[2] : m[1];
      const val = parseFloat(raw.replace(/,/g, ''));
      if (!isNaN(val) && val >= 0) {
        result.taxAmount = val;
        break;
      }
    }
  }

  return result;
}

/**
 * Classifies the document and extracts structured data.
 * @param {string} text - Raw text extracted from the PDF
 * @returns {Object} JSON matching the required schema
 */
function parseDocument(text) {
  const lower = text.toLowerCase();
  const result = {
    document_type: 'unknown',
    confidence_score: 0.0,
    primary_entity: null,
    date: null,
    financials: {
      total_amount: null,
      currency: null,
      tax_amount: null,
    },
    extracted_items: [],
    raw_summary: '',
  };

  // --- Classification ---
  const invoiceIndicators = [
    'invoice', 'bill to', 'subtotal', 'tax', 'amount due', 'total due',
    'grand total', 'remit', 'payment terms', 'invoice number', 'invoice #',
    'invoice date', 'quantity', 'unit price', 'line item', 'discount',
  ];
  const resumeIndicators = [
    'resume', 'curriculum vitae', 'cv', 'work experience', 'education',
    'skills', 'employment history', 'professional experience', 'qualifications',
    'work history', 'objective', 'summary of qualifications', 'certifications',
    'references available', 'bachelor', 'master', 'degree', 'university',
  ];

  let invoiceScore = 0;
  let resumeScore = 0;

  for (const ind of invoiceIndicators) {
    if (lower.includes(ind)) invoiceScore++;
  }
  for (const ind of resumeIndicators) {
    if (lower.includes(ind)) resumeScore++;
  }

  if (/\$\s?\d+|€\s?\d+|£\s?\d+/.test(text)) invoiceScore += 2;
  if (/total\s*[:\-]?\s*\$?\d/i.test(text)) invoiceScore += 1;
  if (/email\s*[:\-]|phone\s*[:\-]|@.+\.(com|org|edu|net)/i.test(text)) resumeScore += 1;
  if (/years\s+of\s+experience|\bexperience\b/i.test(text)) resumeScore += 1;

  if (invoiceScore > resumeScore && invoiceScore >= 2) {
    result.document_type = 'invoice';
    result.confidence_score = Math.min(0.55 + invoiceScore * 0.08, 0.98);
  } else if (resumeScore > invoiceScore && resumeScore >= 2) {
    result.document_type = 'resume';
    result.confidence_score = Math.min(0.55 + resumeScore * 0.08, 0.98);
  } else if (invoiceScore >= 2 || resumeScore >= 2) {
    result.document_type = invoiceScore >= resumeScore ? 'invoice' : 'resume';
    result.confidence_score = 0.5;
  } else {
    result.document_type = 'unknown';
    result.confidence_score = 0.2;
  }

  // --- Entity extraction ---
  if (result.document_type === 'invoice') {
    result.primary_entity = extractCompanyName(text);
    result.date = extractDate(text);
    const fin = extractFinancials(text);
    result.financials.total_amount = fin.totalAmount;
    result.financials.tax_amount = fin.taxAmount;
    result.financials.currency = detectCurrency(text);
    result.extracted_items = extractInvoiceItems(text);
  } else if (result.document_type === 'resume') {
    result.primary_entity = extractPersonName(text);
    result.date = extractDate(text);
    result.financials.currency = null;
    result.extracted_items = extractResumeSkills(text);
  } else {
    result.date = extractDate(text);
    result.financials.currency = detectCurrency(text);
  }

  result.raw_summary = buildSummary(text, result.document_type, result.primary_entity);

  return result;
}

module.exports = {
  hashBuffer,
  parseDocument,
};

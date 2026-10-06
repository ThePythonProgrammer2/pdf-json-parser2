const { buildProviderRequest, safeFetch } = require('./keyResolver');

/**
 * System prompt instructing the AI model to return strictly-structured JSON
 * matching the same schema as the rule-based parser.
 */
const SYSTEM_PROMPT = `You are a document analysis assistant. Analyze the provided document text and return a JSON object with EXACTLY this structure:
{
  "document_type": "invoice" | "resume" | "contract" | "receipt" | "report" | "letter" | "other",
  "confidence_score": <number 0.0-1.0>,
  "primary_entity": <string or null — company name for invoices, person name for resumes>,
  "date": <string in YYYY-MM-DD format or null>,
  "financials": {
    "total_amount": <number or null>,
    "currency": <3-letter ISO code string or null>,
    "tax_amount": <number or null>
  },
  "extracted_items": [
    { "description": "<string>", "quantity": <number|null>, "unit_price": <number|null>, "total_price": <number|null> }
    OR
    { "type": "skill"|"certification"|"company"|"education"|"experience", "value": "<string>" }
  ],
  "raw_summary": "<2-3 sentence summary of the document>"
}

Rules:
- Return ONLY the JSON object, no markdown, no explanation.
- For invoices, extracted_items should be line items with description/quantity/unit_price/total_price.
- For resumes, extracted_items should be skills, certifications, and companies with type/value.
- If a field cannot be determined, use null (for scalars) or [] (for arrays).
- confidence_score reflects how confident you are in the classification and extraction.`;

/**
 * Parses the AI model's text response into a structured object.
 * Handles markdown code fences and partial JSON gracefully.
 * @param {string} text
 * @returns {Object|null}
 */
function parseAIResponse(text) {
  if (!text || typeof text !== 'string') return null;

  let cleaned = text.trim();

  // Strip markdown code fences if present
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to find the first { and last } as a fallback
    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');
    if (first !== -1 && last !== -1 && last > first) {
      try {
        return JSON.parse(cleaned.slice(first, last + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Validates and normalizes the AI-returned object to ensure it conforms
 * to the expected schema. Fills in missing fields with safe defaults.
 * @param {Object} raw
 * @returns {Object}
 */
function normalizeAIResult(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const validTypes = ['invoice', 'resume', 'contract', 'receipt', 'report', 'letter', 'other'];

  const docType = validTypes.includes(raw.document_type) ? raw.document_type : 'unknown';
  const confidence = typeof raw.confidence_score === 'number'
    ? Math.max(0, Math.min(1, raw.confidence_score))
    : 0.5;

  const items = Array.isArray(raw.extracted_items) ? raw.extracted_items : [];

  return {
    document_type: docType,
    confidence_score: confidence,
    primary_entity: typeof raw.primary_entity === 'string' ? raw.primary_entity : null,
    date: typeof raw.date === 'string' ? raw.date : null,
    financials: {
      total_amount: typeof raw.financials?.total_amount === 'number' ? raw.financials.total_amount : null,
      currency: typeof raw.financials?.currency === 'string' ? raw.financials.currency : null,
      tax_amount: typeof raw.financials?.tax_amount === 'number' ? raw.financials.tax_amount : null,
    },
    extracted_items: items,
    raw_summary: typeof raw.raw_summary === 'string' ? raw.raw_summary : '',
  };
}

/**
 * Calls the AI provider (Gemini or OpenRouter) to parse document text
 * into structured JSON. Returns null on any failure so the caller can
 * fall back to the rule-based parser.
 *
 * @param {string} text - raw text extracted from the PDF
 * @param {{ key: string, provider: 'google' | 'openrouter' }} resolved - API key info
 * @returns {Promise<Object|null>} - structured result or null on failure
 */
async function parseWithAI(text, resolved) {
  if (!resolved || !resolved.key) return null;

  const providerReq = buildProviderRequest(resolved);

  let body;

  if (resolved.provider === 'openrouter') {
    // OpenRouter uses OpenAI-compatible chat completions format
    body = {
      model: providerReq.body.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Analyze this document text and return the structured JSON:\n\n${text.slice(0, 12000)}` },
      ],
      temperature: 0.1,
      max_tokens: 2000,
    };
  } else {
    // Google Gemini generateContent format
    body = {
      contents: [
        {
          parts: [
            { text: `${SYSTEM_PROMPT}\n\nAnalyze this document text and return the structured JSON:\n\n${text.slice(0, 12000)}` },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2000,
      },
    };
  }

  const result = await safeFetch(providerReq.url, providerReq.headers, body, { timeoutMs: 20000 });

  if (!result.ok) {
    console.error(`AI provider (${resolved.provider}) error:`, result.error);
    return null;
  }

  // Extract text from the provider's response format
  let aiText = null;

  if (resolved.provider === 'openrouter') {
    aiText = result.data?.choices?.[0]?.message?.content;
  } else {
    aiText = result.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  }

  if (!aiText) {
    console.error('AI provider returned no text content');
    return null;
  }

  const parsed = parseAIResponse(aiText);
  if (!parsed) {
    console.error('Failed to parse AI response as JSON');
    return null;
  }

  const normalized = normalizeAIResult(parsed);
  if (!normalized) {
    console.error('AI response did not conform to expected schema');
    return null;
  }

  return normalized;
}

module.exports = {
  parseWithAI,
  normalizeAIResult,
  parseAIResponse,
};

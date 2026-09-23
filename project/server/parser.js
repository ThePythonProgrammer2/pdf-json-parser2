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
 * Fully AI-Driven Document Parser Pipeline.
 * 
 * @param {string} rawText - The raw text extracted from the PDF file.
 * @return {Promise<Array<Object>>} A clean array of parsed document items.
 */
async function parseDocument(rawText) {
  if (!rawText || rawText.trim() === "") return [];

  const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.warn("AI API Key missing. Returning empty array.");
    return [];
  }

  const promptBody = {
    model: "gemini-2.5-flash", 
    messages: [
      {
        role: "user",
        content: `You are an advanced data extraction engine. Analyze the following unstructured text payload from a PDF. 
If the text contains multiple independent resumes or invoices, extract each one as a distinct object inside the "candidates" array.

CRITICAL INSTRUCTIONS:
1. "primary_entity": Extract the exact name of the Job Candidate or the Vendor. Never return arrays or comma-separated match groups.
2. "extracted_items": For resumes, list all technical skills found. For invoices, list line-item descriptions.
3. "raw_summary": Write a unique, high-value 1-to-2 sentence summary. Do not use boilerplate templates. Highlight their core stack and seniority level.
4. You MUST return a top-level JSON object with a single root key named "candidates" which contains the array of parsed records.

Target JSON Output Format:
{
  "candidates": [
    {
      "document_type": "resume" or "invoice" or "unknown",
      "confidence_score": 0.0 to 1.0,
      "primary_entity": "String Name",
      "date": "YYYY-MM-DD",
      "financials": {
        "total_amount": 0.00 or null,
        "currency": "USD" or "EUR" or null,
        "tax_amount": 0.00 or null
      },
      "extracted_items": ["item or skill strings"],
      "raw_summary": "Dynamic custom synthesized elevator pitch string here."
    }
  ]
}`
      }
    ],
    response_format: { type: "json_object" } 
  };

  try {
    const endpoint = process.env.GEMINI_API_KEY 
      ? `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`
      : `https://openai.com`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(promptBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI API Gateway connection error: ${response.status} - ${errorText}`);
    }

    const cellPayload = await response.json();
    
    // FIXED: Corrected the object path accessor loop to explicitly target index 0.
    if (!cellPayload.choices || !cellPayload.choices[0] || !cellPayload.choices[0].message) {
      throw new Error("Malformed API gateway payload response mapping structure.");
    }
    
    let rawJsonString = cellPayload.choices[0].message.content.trim();

    if (rawJsonString.startsWith("```")) {
      rawJsonString = rawJsonString.replace(/^```json|```$/g, "").trim();
    }

    const parsedOutput = JSON.parse(rawJsonString);

    if (parsedOutput && parsedOutput.candidates && Array.isArray(parsedOutput.candidates)) {
      return parsedOutput.candidates;
    }

    return Array.isArray(parsedOutput) ? parsedOutput : [parsedOutput];

  } catch (error) {
    console.error("Critical AI Parsing Layer Failure:", error);
    return [];
  }
}

module.exports = {
  hashBuffer,
  parseDocument
};

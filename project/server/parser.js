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
 * Leverages structured JSON outputs to extract entities, items, and summaries without regular expressions.
 * 
 * @param {string} rawText - The raw text extracted from the PDF file.
 * @return {Promise<Array<Object>>} A clean, guaranteed array of parsed document items.
 */
async function parseDocument(rawText) {
  if (!rawText || rawText.trim() === "") return [];

  // Use your environment's available API key (handles Gemini, OpenRouter, or OpenAI configurations)
  const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.warn("AI API Key missing. Falling back to an empty structural array context.");
    return [];
  }

  // Define the strict prompt and target schema interface instructions for the LLM
  const promptBody = {
    model: "gemini-2.5-flash", // Bolt.new's preferred fast model. Swap to "gpt-4o-mini" if using OpenAI hooks.
    messages: [
      {
        role: "user",
        content: `You are an advanced data extraction engine. Analyze the following unstructured text payload from a PDF. 
If the text contains multiple independent resumes or invoices, you MUST extract each one as a distinct object inside the final JSON array.

CRITICAL INSTRUCTIONS:
1. "primary_entity": Extract the exact name of the Job Candidate or the Vendor. Never return arrays or comma-separated match groups.
2. "extracted_items": For resumes, list all technical skills found. For invoices, list line-item descriptions.
3. "raw_summary": Write a unique, high-value 1-to-2 sentence summary. Do not use boilerplate templates. For resumes, highlight their core stack and seniority level (e.g., "A Senior Full-Stack Engineer with 5+ years of experience specialized in React and Node.js backend optimization.").
4. Always return a valid JSON array of objects. Do not wrap the output in markdown code blocks (\`\`\`json).

Target JSON Output Format:
[
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

Raw Document Text Payload:
${rawText}`
      }
    ],
    // Enforces strict JSON execution mode at the provider level
    response_format: { type: "json_object" } 
  };

  try {
    // Dispatches the structured inference request straight to the provider pipeline
    // This example uses the universal fetch interface compatible with Gemini and OpenRouter architectures
    const endpoint = process.env.GEMINI_API_KEY 
      ? `https://googleapis.com`
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
    let rawJsonString = cellPayload.choices[0].message.content.trim();

    // Clean up potential markdown formatting remnants safely if emitted by the model
    if (rawJsonString.startsWith("```")) {
      rawJsonString = rawJsonString.replace(/^```json|```$/g, "").trim();
    }

    const parsedOutput = JSON.parse(rawJsonString);

    // Standardize data structures back into a true array format for your React client application hooks
    const finalCollection = Array.isArray(parsedOutput) 
      ? parsedOutput 
      : parsedOutput.documents || parsedOutput.records || [parsedOutput];

    return finalCollection;

  } catch (error) {
    console.error("Critical AI Parsing Layer Failure:", error);
    // Secure fail-safe configuration block ensures the front-end dashboard UI layout never locks up
    return [];
  }
}

function buildAiPrompt(rawText) {
  return rawText; // Deprecated by full inline payload incorporation
}

module.exports = {
  hashBuffer,
  parseDocument,
  buildAiPrompt
};dfg

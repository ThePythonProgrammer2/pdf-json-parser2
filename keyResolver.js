/**
 * Dual-key resolution and unified fetch utility.
 *
 * Supports two API key formats:
 *   1. Google Developer tokens (GEMINI_API_KEY / Authorization: Bearer)
 *   2. OpenRouter keys (x-openrouter-key / Authorization: Bearer sk-or-...)
 *
 * The resolver never throws — it returns null when no usable key is found
 * so the caller can decide how to handle the absence.
 */

/**
 * Normalises a raw key string by trimming whitespace and stripping
 * common prefix patterns ("Bearer ", "sk-or-v1-", etc.) only when
 * the caller needs the bare token.
 * @param {string} raw
 * @returns {string|null}
 */
function normalizeKey(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Strip "Bearer " prefix if present
  return trimmed.replace(/^Bearer\s+/i, '');
}

/**
 * Resolves the active API key using a dual-key priority chain:
 *   1. process.env.GEMINI_API_KEY (native Google Developer token)
 *   2. Authorization header (Bearer token)
 *   3. x-openrouter-key header (OpenRouter format)
 *
 * @param {import('express').Request} req
 * @returns {{ key: string, provider: 'google' | 'openrouter' | null }}
 */
function resolveApiKey(req) {
  // Priority 1: server-side env var (Google native token)
  const envKey = process.env.GEMINI_API_KEY;
  if (envKey && envKey.trim()) {
    return { key: envKey.trim(), provider: 'google' };
  }

  // Priority 1b: server-side env var (OpenRouter key)
  const openRouterEnvKey = process.env.OPENROUTER_API_KEY;
  if (openRouterEnvKey && openRouterEnvKey.trim()) {
    return { key: openRouterEnvKey.trim(), provider: 'openrouter' };
  }

  // Priority 2: Authorization header (could be Google or OpenRouter)
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    const parsed = normalizeKey(authHeader);
    if (parsed) {
      // OpenRouter keys typically start with "sk-or-"
      const provider = /^sk-or-/i.test(parsed) ? 'openrouter' : 'google';
      return { key: parsed, provider };
    }
  }

  // Priority 3: x-openrouter-key header (OpenRouter-specific)
  const openRouterKey = req.headers['x-openrouter-key'];
  if (openRouterKey) {
    const parsed = normalizeKey(openRouterKey);
    if (parsed) {
      return { key: parsed, provider: 'openrouter' };
    }
  }

  return { key: null, provider: null };
}

/**
 * Builds the correct endpoint URL and headers for the detected provider.
 *
 * @param {{ key: string, provider: 'google' | 'openrouter' }} resolved
 * @param {string} [model] - model identifier (defaults to a sensible per-provider value)
 * @returns {{ url: string, headers: Object }}
 */
function buildProviderRequest(resolved, model) {
  if (resolved.provider === 'openrouter') {
    const useModel = model || 'openai/gpt-4o-mini';
    return {
      url: 'https://openrouter.ai/api/v1/chat/completions',
      headers: {
        'Authorization': `Bearer ${resolved.key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_BASE_URL || 'https://pdf-parser.rapidapi.com',
        'X-Title': 'PDF Document Parser',
      },
      body: { model: useModel },
    };
  }

  // Default: Google Gemini format
  const useModel = model || 'gemini-1.5-flash';
  return {
    url: `https://generativelanguage.googleapis.com/v1beta/models/${useModel}:generateContent?key=${resolved.key}`,
    headers: {
      'Content-Type': 'application/json',
    },
    body: { model: useModel },
  };
}

/**
 * Unified fetch wrapper that handles both provider formats gracefully.
 * Returns a normalised result object — never throws.
 *
 * @param {string} url - fully-qualified endpoint URL
 * @param {Object} headers - request headers
 * @param {Object|string} body - request body (will be JSON-stringified)
 * @param {{ timeoutMs?: number }} [opts]
 * @returns {Promise<{ ok: boolean, status: number, data: Object|null, error: string|null }>}
 */
async function safeFetch(url, headers, body, opts) {
  const timeoutMs = (opts && opts.timeoutMs) || 15000;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const payload = typeof body === 'string' ? body : JSON.stringify(body);
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: payload,
      signal: controller.signal,
    });

    const text = await response.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch {
      // Non-JSON response — return raw text as data
      data = { raw: text };
    }

    if (!response.ok) {
      const errMsg = (data && data.error && data.error.message) ||
                     (data && data.message) ||
                     `Upstream provider returned HTTP ${response.status}`;
      return { ok: false, status: response.status, data, error: errMsg };
    }

    return { ok: true, status: response.status, data, error: null };
  } catch (err) {
    if (err.name === 'AbortError') {
      return { ok: false, status: 0, data: null, error: 'Request to upstream provider timed out.' };
    }
    const safeMsg = err.message || 'Unknown network error occurred while contacting the upstream provider.';
    return { ok: false, status: 0, data: null, error: safeMsg };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = {
  normalizeKey,
  resolveApiKey,
  buildProviderRequest,
  safeFetch,
};

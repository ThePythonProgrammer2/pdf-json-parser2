/**
 * Unified error response helper.
 *
 * All API error responses (400, 422, 500, etc.) go through this module
 * so paying clients always see a clean, consistent JSON shape — never
 * raw stack traces or internal file paths.
 *
 * Response shape:
 *   {
 *     "success": false,
 *     "error": {
 *       "code": "VALIDATION_ERROR",
 *       "message": "Human-readable message",
 *       "request_id": "optional correlation id"
 *     }
 *   }
 */

/**
 * Error code constants for consistent categorisation.
 */
const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  UNSUPPORTED_MEDIA_TYPE: 'UNSUPPORTED_MEDIA_TYPE',
  UNPROCESSABLE_CONTENT: 'UNPROCESSABLE_CONTENT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
};

/**
 * Sends a clean, unified error JSON response.
 *
 * @param {import('express').Response} res
 * @param {number} statusCode - HTTP status code
 * @param {string} message - human-readable error message (safe for clients)
 * @param {string} [code] - machine-readable error code from ERROR_CODES
 */
function sendError(res, statusCode, message, code) {
  const errorCode = code || defaultCodeForStatus(statusCode);
  
  // Extract the unique request correlation ID passed down by RapidAPI or your logger
  // Looks inside common tracking locations to safely attach a thread context reference
  const requestId = res.req?.headers?.['x-request-id'] || 
                    res.req?.headers?.['x-rapidapi-request-id'] || 
                    undefined;

  return res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      ...(requestId && { request_id: requestId }) // Only injects if key transaction context exists
    },
  });
}

/**
 * Maps a status code to a default error code.
 * @param {number} status
 * @returns {string}
 */
function defaultCodeForStatus(status) {
  switch (status) {
    case 400: return ERROR_CODES.VALIDATION_ERROR;
    case 413: return ERROR_CODES.FILE_TOO_LARGE;
    case 415: return ERROR_CODES.UNSUPPORTED_MEDIA_TYPE;
    case 422: return ERROR_CODES.UNPROCESSABLE_CONTENT;
    case 429: return ERROR_CODES.RATE_LIMITED;
    case 500:
    default:
      return ERROR_CODES.INTERNAL_ERROR;
  }
}

module.exports = { sendError, ERROR_CODES };

/**
 * Create an error object for API responses. Pass to next() in routes.
 * The global error handler will send res.status(err.status).json({ error: err.code, message: err.message }).
 * @param {number} status - HTTP status (4xx, 5xx)
 * @param {string} code - Machine-readable code (e.g. 'validation_error', 'unauthorized')
 * @param {string} [message] - Human-readable message (safe to send to client for 4xx)
 * @param {object} [details] - Optional extra fields (e.g. { fields: ['day', 'subject'] })
 */
function createError(status, code, message, details = null) {
  const err = new Error(message || code);
  err.status = status;
  err.code = code;
  if (details && typeof details === "object") {
    err.details = details;
  }
  return err;
}

module.exports = { createError };

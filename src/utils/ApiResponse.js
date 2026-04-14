/**
 * Standardized API response builder.
 * Ensures every response follows the envelope format from the API spec.
 */
class ApiResponse {
  /**
   * Success response.
   * @param {object} res - Express response object
   * @param {number} statusCode - HTTP status code
   * @param {object} data - Response payload
   * @param {object} [meta] - Optional pagination metadata
   */
  static success(res, statusCode, data, meta = null) {
    const response = { success: true, data };
    if (meta) {
      response.meta = meta;
    }
    return res.status(statusCode).json(response);
  }

  static ok(res, data, meta = null) {
    return ApiResponse.success(res, 200, data, meta);
  }

  static created(res, data) {
    return ApiResponse.success(res, 201, data);
  }

  static noContent(res) {
    return res.status(204).send();
  }
}

module.exports = ApiResponse;

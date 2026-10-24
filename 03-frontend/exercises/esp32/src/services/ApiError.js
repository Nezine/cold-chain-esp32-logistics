// Error thrown by the service layer. `status` is the HTTP status from the
// backend (0 when the request never reached it, e.g. backend not running).
export default class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

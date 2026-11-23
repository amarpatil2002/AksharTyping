import { AppError } from "./apiError.js";

// Backwards-compatible name for shared HTTP errors across all modules.
export class HttpError extends AppError {
  constructor(statusCode, message, details = undefined, code = undefined) {
    super(message, statusCode, code, details);
    this.name = "HttpError";
  }
}

export class AppError extends Error {
  constructor(message, statusCode = 500, code = undefined, details = undefined) {
    super(message);

    this.name = "AppError";
    this.statusCode = statusCode;
    this.status = statusCode;
    this.isOperational = true;
    if (code) this.code = code;
    if (details !== undefined) this.details = details;

    Error.captureStackTrace?.(this, AppError);
  }
}

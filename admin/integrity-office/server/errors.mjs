export class OfficeError extends Error {
  constructor(statusCode, code, message, details = undefined) {
    super(message);
    this.name = "OfficeError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message, details) => new OfficeError(400, "bad_request", message, details);
export const unauthorized = (message = "Authentication is required.") => new OfficeError(401, "unauthorized", message);
export const forbidden = (message = "You do not have permission to perform this action.") => new OfficeError(403, "forbidden", message);
export const notFound = (message = "The requested record was not found.") => new OfficeError(404, "not_found", message);
export const conflict = (message, details) => new OfficeError(409, "conflict", message, details);
export const unavailable = (message = "Integrity Office is temporarily unavailable.") => new OfficeError(503, "unavailable", message);

export const publicError = (error) => {
  if (error instanceof OfficeError) return error;
  return new OfficeError(500, "internal_error", "The request could not be completed.");
};

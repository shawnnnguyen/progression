import { ErrorCode, HTTP_STATUS_BY_CODE, type ErrorCodeValue } from "./codes.js";

export class AppError extends Error {
  readonly code: ErrorCodeValue;
  readonly httpStatus: number;
  readonly details?: Record<string, unknown>;

  constructor(code: ErrorCodeValue, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.httpStatus = HTTP_STATUS_BY_CODE[code];
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Request failed validation", details?: Record<string, unknown>) {
    super(ErrorCode.VALIDATION_ERROR, message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Missing, invalid, or expired access token", details?: Record<string, unknown>) {
    super(ErrorCode.UNAUTHORIZED, message, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action", details?: Record<string, unknown>) {
    super(ErrorCode.FORBIDDEN, message, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", details?: Record<string, unknown>) {
    super(ErrorCode.NOT_FOUND, message, details);
  }
}

export class IllegalTransitionError extends AppError {
  constructor(details?: Record<string, unknown>) {
    super(ErrorCode.ILLEGAL_TRANSITION, "That workflow transition is not legal", details);
  }
}

export class StaleStateError extends AppError {
  constructor(details?: Record<string, unknown>) {
    super(ErrorCode.STALE_STATE, "The resource has changed since you last read it", details);
  }
}

export class LastOwnerError extends AppError {
  constructor(message = "This change would leave the organization with no owner", details?: Record<string, unknown>) {
    super(ErrorCode.LAST_OWNER, message, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = "This conflicts with an existing resource", details?: Record<string, unknown>) {
    super(ErrorCode.CONFLICT, message, details);
  }
}

export class InternalError extends AppError {
  constructor(message = "Internal server error") {
    super(ErrorCode.INTERNAL_ERROR, message);
  }
}

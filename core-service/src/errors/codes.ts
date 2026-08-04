// Canonical error-code table (BACKEND_PLAN.md §2 "Error handling"). This is
// the single source of truth for every code any endpoint can return — every
// other layer references this instead of inventing its own status/shape.
//
// INVALID_EXCHANGE and RATE_LIMITED (service-token-exchange only) are left
// out here since the service-auth flow is deferred; they can be added back
// alongside that work without touching any other code in this table.
export const ErrorCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  ILLEGAL_TRANSITION: "ILLEGAL_TRANSITION",
  STALE_STATE: "STALE_STATE",
  LAST_OWNER: "LAST_OWNER",
  CONFLICT: "CONFLICT",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

export const HTTP_STATUS_BY_CODE: Record<ErrorCodeValue, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  ILLEGAL_TRANSITION: 409,
  STALE_STATE: 409,
  LAST_OWNER: 409,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
};

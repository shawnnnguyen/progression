import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { AppError, InternalError } from "./AppError.js";
import { ErrorCode } from "./codes.js";

interface ErrorBody {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

function send(reply: FastifyReply, httpStatus: number, body: ErrorBody) {
  return reply.code(httpStatus).send(body);
}

// The one Fastify setErrorHandler (BACKEND_PLAN.md §2). Route handlers never
// write their own reply.code(...).send(...) for an error case — they throw
// an AppError subclass and let this collapse it to { error: {...} }.
export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((err: unknown, request: FastifyRequest, reply: FastifyReply) => {
    if (err instanceof AppError) {
      return send(reply, err.httpStatus, {
        error: { code: err.code, message: err.message, details: err.details },
      });
    }

    // Fastify JSON-Schema validation failures surface as FastifyError with a
    // `validation` array attached — map to 400 VALIDATION_ERROR uniformly.
    const maybeFastifyError = err as { validation?: unknown; message?: string };
    if (maybeFastifyError && maybeFastifyError.validation) {
      return send(reply, 400, {
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: maybeFastifyError.message ?? "Request failed validation",
        },
      });
    }

    // Anything else (a bug, an unhandled Prisma error) is logged with full
    // detail server-side and collapsed to a generic response — a raw stack
    // trace or constraint-violation message never reaches the client.
    request.log.error({ err }, "unhandled error");
    const internal = new InternalError();
    return send(reply, internal.httpStatus, {
      error: { code: internal.code, message: internal.message },
    });
  });
}

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { AppError, InternalError } from "./AppError.js";
import { ErrorCode } from "./errorCodes.js";

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

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((err: unknown, request: FastifyRequest, reply: FastifyReply) => {
    if (err instanceof AppError) {
      return send(reply, err.httpStatus, {
        error: { code: err.code, message: err.message, details: err.details },
      });
    }

    const maybeFastifyError = err as { validation?: unknown; message?: string };
    if (maybeFastifyError && maybeFastifyError.validation) {
      return send(reply, 400, {
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: maybeFastifyError.message ?? "Request failed validation",
        },
      });
    }

    request.log.error({ err }, "unhandled error");
    const internal = new InternalError();
    return send(reply, internal.httpStatus, {
      error: { code: internal.code, message: internal.message },
    });
  });
}

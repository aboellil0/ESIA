/**
 * AppError - recommended Express architecture
 * Extends native Error so it is caught by global error middleware via next(err)
 * Provides both `statusCode` and `status` for compatibility
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly status: number;
  public readonly isOperational: boolean;
  public readonly code: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode;
    this.code = code || this.mapCode(statusCode);
    this.isOperational = true;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  private mapCode(statusCode: number): string {
    switch (statusCode) {
      case 400: return "ValidationError";
      case 401: return "UnauthorizedError";
      case 403: return "ForbiddenError";
      case 404: return "NotFoundError";
      case 409: return "ConflictError";
      case 500: return "ServerError";
      default: return "AppError";
    }
  }

  static badRequest(message: string | string[]): AppError {
    return new AppError(Array.isArray(message) ? message.join(", ") : message, 400, "ValidationError");
  }
  static validation(message: string | string[]): AppError {
    return AppError.badRequest(message);
  }
  static unauthorized(message = "Unauthorized access"): AppError {
    return new AppError(message, 401, "UnauthorizedError");
  }
  static forbidden(message = "Access forbidden"): AppError {
    return new AppError(message, 403, "ForbiddenError");
  }
  static notFound(message: string | string[]): AppError {
    return new AppError(Array.isArray(message) ? message.join(", ") : message, 404, "NotFoundError");
  }
  static conflict(message: string): AppError {
    return new AppError(message, 409, "ConflictError");
  }
  static server(message: string | string[]): AppError {
    return new AppError(Array.isArray(message) ? message.join(", ") : message, 500, "ServerError");
  }
  static banned(message = "Your account has been banned"): AppError {
    return new AppError(message, 403, "BannedError");
  }
}
export type ErrorCategory =
  | "NETWORK_ERROR"
  | "HTTP_ERROR"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "NO_SOURCE"
  | "INVALID_RESPONSE"
  | "PLAYBACK_ERROR"
  | "TIMEOUT";

export class ProviderError extends Error {
  category: ErrorCategory;
  provider: string;
  statusCode?: number;

  constructor(
    message: string,
    category: ErrorCategory,
    provider: string,
    statusCode?: number,
  ) {
    super(message);
    this.name = "ProviderError";
    this.category = category;
    this.provider = provider;
    this.statusCode = statusCode;
  }
}

export function classifyHttpError(
  statusCode: number,
  provider: string,
): ProviderError {
  if (statusCode === 403) {
    return new ProviderError(
      "This server is currently unavailable.",
      "FORBIDDEN",
      provider,
      statusCode,
    );
  }
  if (statusCode === 404) {
    return new ProviderError(
      "This episode is not available on this server.",
      "NOT_FOUND",
      provider,
      statusCode,
    );
  }
  return new ProviderError(
    `Server returned ${statusCode}`,
    "HTTP_ERROR",
    provider,
    statusCode,
  );
}

export function friendlyMessage(error: unknown): string {
  if (error instanceof ProviderError) {
    return error.message;
  }
  if (error instanceof Error) {
    if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
      return "Network error. Please check your connection.";
    }
    return "An unexpected error occurred.";
  }
  return "An unexpected error occurred.";
}

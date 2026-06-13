export const normalizeErrorMessage = (
  error: unknown,
  fallback = "An unexpected error occurred"
): string => {
  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  if (!error || typeof error !== "object") {
    return fallback;
  }

  const err = error as {
    data?: { message?: unknown };
    error?: unknown;
    message?: unknown;
    status?: unknown;
  };

  if (typeof err.data?.message === "string" && err.data.message.trim()) {
    return err.data.message;
  }

  if (typeof err.error === "string" && err.error.trim()) {
    return err.error;
  }

  if (typeof err.message === "string" && err.message.trim()) {
    return err.message;
  }

  if (err.error && typeof err.error === "object") {
    try {
      const serializedError = JSON.stringify(err.error);
      if (serializedError && serializedError !== "{}") {
        return serializedError;
      }
    } catch {
      // Ignore serialization errors and use fallback.
    }
  }

  if (err.status) {
    return String(err.status);
  }

  try {
    const serialized = JSON.stringify(error);
    if (serialized && serialized !== "{}") {
      return serialized;
    }
  } catch {
    // Ignore serialization errors and use fallback.
  }

  return fallback;
};

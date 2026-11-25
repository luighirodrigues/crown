const DEFAULT_NOTIFICATION_URL = "/inicio";

export class InvalidNotificationUrlError extends Error {
  constructor(message = "Notification URL must be an internal path or same-origin URL") {
    super(message);
    this.name = "InvalidNotificationUrlError";
  }
}

function getConfiguredAppOrigin(appOrigin?: string) {
  const origin = appOrigin ?? process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL;

  if (!origin) {
    throw new InvalidNotificationUrlError("App origin is not configured");
  }

  try {
    const parsedOrigin = new URL(origin);

    if (
      (parsedOrigin.protocol !== "http:" && parsedOrigin.protocol !== "https:") ||
      parsedOrigin.origin === "null"
    ) {
      throw new InvalidNotificationUrlError("App origin must be an http(s) URL");
    }

    return parsedOrigin.origin;
  } catch (error) {
    if (error instanceof InvalidNotificationUrlError) {
      throw error;
    }

    throw new InvalidNotificationUrlError("App origin is malformed");
  }
}

function normalizePathname(pathname: string, search = "", hash = "") {
  const normalizedPath = `${pathname}${search}${hash}`;

  if (normalizedPath.startsWith("//") || normalizedPath.includes("\\")) {
    throw new InvalidNotificationUrlError();
  }

  return normalizedPath;
}

function normalizeUrlOrThrow(value: string, appOrigin?: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new InvalidNotificationUrlError("Notification URL is required");
  }

  if (/[\t\n\r]/.test(trimmed)) {
    throw new InvalidNotificationUrlError();
  }

  if (trimmed.startsWith("/") || trimmed.startsWith("\\")) {
    if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("\\")) {
      throw new InvalidNotificationUrlError();
    }

    return normalizePathname(trimmed);
  }

  const configuredOrigin = getConfiguredAppOrigin(appOrigin);

  if (trimmed.includes("\\")) {
    throw new InvalidNotificationUrlError();
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new InvalidNotificationUrlError();
  }

  if (parsed.origin !== configuredOrigin) {
    throw new InvalidNotificationUrlError();
  }

  return normalizePathname(parsed.pathname, parsed.search, parsed.hash);
}

export function requireNotificationUrl(value: string | null | undefined, appOrigin?: string) {
  return normalizeUrlOrThrow(value ?? "", appOrigin);
}

export function normalizeNotificationUrl(value: string | null | undefined, appOrigin?: string) {
  if (!value?.trim()) {
    return DEFAULT_NOTIFICATION_URL;
  }

  try {
    return normalizeUrlOrThrow(value, appOrigin);
  } catch {
    return DEFAULT_NOTIFICATION_URL;
  }
}

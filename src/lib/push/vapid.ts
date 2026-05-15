export type VapidConfig = {
  publicKey: string;
  privateKey: string;
  subject: string;
};

export type VapidConfigStatus =
  | { enabled: true; missing: []; message: null }
  | { enabled: false; missing: string[]; message: string };

const VAPID_ENV_KEYS = ["VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY", "VAPID_SUBJECT"] as const;

function readEnvValue(key: (typeof VAPID_ENV_KEYS)[number]) {
  return process.env[key]?.trim() ?? "";
}

function isValidVapidSubject(subject: string) {
  if (subject.startsWith("mailto:")) {
    return subject.slice("mailto:".length).trim().length > 0;
  }

  try {
    const url = new URL(subject);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function getVapidConfigStatus(): VapidConfigStatus {
  const missing = VAPID_ENV_KEYS.filter((key) => !readEnvValue(key));

  if (missing.length > 0) {
    return {
      enabled: false,
      missing,
      message: `Web Push is disabled: missing ${missing.join(", ")}`,
    };
  }

  if (!isValidVapidSubject(readEnvValue("VAPID_SUBJECT"))) {
    return {
      enabled: false,
      missing: [],
      message: "Web Push is disabled: VAPID_SUBJECT must be a mailto: or http(s) URL",
    };
  }

  return { enabled: true, missing: [], message: null };
}

export function getVapidConfig(): VapidConfig | null {
  if (!getVapidConfigStatus().enabled) {
    return null;
  }

  return {
    publicKey: readEnvValue("VAPID_PUBLIC_KEY"),
    privateKey: readEnvValue("VAPID_PRIVATE_KEY"),
    subject: readEnvValue("VAPID_SUBJECT"),
  };
}

export function getVapidPublicKey() {
  return getVapidConfig()?.publicKey ?? null;
}

export type PushSupportReason = "insecure" | "unsupported";

export type PushSupportState =
  | { supported: true; reason: null }
  | { supported: false; reason: PushSupportReason };

type PushSupportInput = {
  isSecureContext: boolean;
  hasServiceWorker: boolean;
  hasPushManager: boolean;
  hasNotification: boolean;
};

type PwaInstallInput = {
  hasStandaloneDisplayMode: boolean;
  hasNavigatorStandalone: boolean;
  userAgent: string;
  maxTouchPoints: number;
};

export function getPushSupportState(input: PushSupportInput): PushSupportState {
  if (!input.isSecureContext) {
    return { supported: false, reason: "insecure" };
  }

  if (!input.hasServiceWorker || !input.hasPushManager || !input.hasNotification) {
    return { supported: false, reason: "unsupported" };
  }

  return { supported: true, reason: null };
}

export function getPwaInstallState(input: PwaInstallInput) {
  const installed = input.hasStandaloneDisplayMode || input.hasNavigatorStandalone;
  const isIos = /iPad|iPhone|iPod/i.test(input.userAgent) ||
    (/Macintosh/i.test(input.userAgent) && input.maxTouchPoints > 1);

  return { installed, needsHomeScreenInstall: isIos && !installed };
}

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

export function getPushSupportState(input: PushSupportInput): PushSupportState {
  if (!input.isSecureContext) {
    return { supported: false, reason: "insecure" };
  }

  if (!input.hasServiceWorker || !input.hasPushManager || !input.hasNotification) {
    return { supported: false, reason: "unsupported" };
  }

  return { supported: true, reason: null };
}

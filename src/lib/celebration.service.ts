import type canvasConfetti from "canvas-confetti";

type ConfettiOptions = Parameters<typeof canvasConfetti>[0];
type ConfettiShape = NonNullable<NonNullable<ConfettiOptions>["shapes"]>[number];
type ConfettiFunction = ReturnType<typeof canvasConfetti.create>;

const BRAND_COLORS = ["#F5C542", "#C0A16B", "#4C1D62", "#FFFFFF"];
const MAX_TICKS = 180;
const TRIBUTE_MILESTONES = [100, 500, 1000, 2500, 5000, 10000];

interface RectLike {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface ViewportLike {
  width: number;
  height: number;
}

interface ApprovalStatusItem {
  id: string;
  status: string | null | undefined;
}

let confettiPromise: Promise<typeof canvasConfetti> | null = null;
let confettiInstance: ConfettiFunction | null = null;
let crownShapes: ConfettiShape[] | null = null;

function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function prefersReducedMotion() {
  if (!isBrowser() || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function shouldCelebrate(isServer = !isBrowser(), reducedMotion = prefersReducedMotion()) {
  return !isServer && !reducedMotion;
}

export function calculateElementOrigin(rect: RectLike, viewport: ViewportLike) {
  return {
    x: (rect.left + rect.width / 2) / viewport.width,
    y: (rect.top + rect.height / 2) / viewport.height,
  };
}

export function getReachedTributeMilestone(previousTotal: number, currentTotal: number) {
  const reached = TRIBUTE_MILESTONES.filter(
    (milestone) => previousTotal < milestone && currentTotal >= milestone
  );

  return reached.length > 0 ? reached[reached.length - 1] : null;
}

export function didRankingPositionImprove(previousPosition: string | null, currentPosition: number) {
  if (previousPosition === null) return false;

  const parsedPreviousPosition = Number(previousPosition);
  if (!Number.isFinite(parsedPreviousPosition)) return false;

  return currentPosition < parsedPreviousPosition;
}

export function getApprovedTransitions(
  previousStatuses: Record<string, string>,
  currentItems: ApprovalStatusItem[]
) {
  return currentItems
    .filter((item) => previousStatuses[item.id] && previousStatuses[item.id] !== "APPROVED")
    .filter((item) => item.status === "APPROVED")
    .map((item) => item.id);
}

async function loadConfetti() {
  confettiPromise ??= import("canvas-confetti").then((module) => module.default);
  return confettiPromise;
}

async function getConfettiInstance() {
  const confetti = await loadConfetti();
  if (confettiInstance) return confettiInstance;

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = [
    "position:fixed",
    "inset:0",
    "width:100%",
    "height:100%",
    "pointer-events:none",
    "z-index:2147483647",
  ].join(";");
  document.body.appendChild(canvas);

  confettiInstance = confetti.create(canvas, {
    resize: true,
    useWorker: true,
    disableForReducedMotion: true,
  });
  return confettiInstance;
}

async function getCrownShapes() {
  if (crownShapes) return crownShapes;

  const confetti = await loadConfetti();
  crownShapes = [
    "star",
    "circle",
    confetti.shapeFromText({ text: "♕", scalar: 1.2, color: "#F5C542" }),
  ];
  return crownShapes;
}

export async function fireConfetti(options: ConfettiOptions = {}) {
  if (!shouldCelebrate()) return null;

  const confetti = await getConfettiInstance();
  return confetti({
    particleCount: 80,
    spread: 65,
    startVelocity: 36,
    gravity: 1.05,
    zIndex: 2147483647,
    colors: BRAND_COLORS,
    disableForReducedMotion: true,
    ...options,
    ticks: Math.min(options.ticks ?? MAX_TICKS, MAX_TICKS),
  });
}

export async function fireCrownConfetti() {
  if (!shouldCelebrate()) return null;

  return fireConfetti({
    particleCount: 90,
    spread: 72,
    scalar: 1.05,
    origin: { x: 0.5, y: 0.65 },
    shapes: await getCrownShapes(),
  });
}

export function fireRankingBoost(targetElement: Element | null) {
  if (!shouldCelebrate()) return null;
  if (!targetElement) return fireCrownConfetti();

  const rect = targetElement.getBoundingClientRect();
  return fireConfetti({
    particleCount: 70,
    spread: 58,
    scalar: 0.95,
    origin: calculateElementOrigin(rect, {
      width: window.innerWidth,
      height: window.innerHeight,
    }),
  });
}

export async function fireMissionComplete() {
  if (!shouldCelebrate()) return null;

  const shapes = await getCrownShapes();

  await fireConfetti({
    particleCount: 70,
    spread: 65,
    scalar: 0.95,
    origin: { x: 0.25, y: 0.7 },
    shapes,
  });

  window.setTimeout(() => {
    void fireConfetti({
      particleCount: 70,
      spread: 65,
      scalar: 1,
      origin: { x: 0.75, y: 0.7 },
      shapes,
    });
  }, 180);
}

export function rememberTributeTotal(storageKey: string, currentTotal: number) {
  if (!isBrowser()) return null;

  try {
    const previous = window.localStorage.getItem(storageKey);
    window.localStorage.setItem(storageKey, String(currentTotal));

    if (previous === null) return null;
    return getReachedTributeMilestone(Number(previous), currentTotal);
  } catch {
    return null;
  }
}

export function rememberRankingPosition(storageKey: string, currentPosition: number) {
  if (!isBrowser()) return false;

  try {
    const previousPosition = window.localStorage.getItem(storageKey);
    window.localStorage.setItem(storageKey, String(currentPosition));
    return didRankingPositionImprove(previousPosition, currentPosition);
  } catch {
    return false;
  }
}

export function rememberApprovalStatuses(storageKey: string, currentItems: ApprovalStatusItem[]) {
  if (!isBrowser()) return [];

  try {
    const previous = window.localStorage.getItem(storageKey);
    const previousStatuses = previous ? JSON.parse(previous) as Record<string, string> : {};
    const nextStatuses = currentItems.reduce<Record<string, string>>((acc, item) => {
      if (item.status) acc[item.id] = item.status;
      return acc;
    }, {});

    window.localStorage.setItem(storageKey, JSON.stringify(nextStatuses));
    return getApprovedTransitions(previousStatuses, currentItems);
  } catch {
    return [];
  }
}

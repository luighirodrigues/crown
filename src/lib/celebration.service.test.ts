import { describe, expect, it } from "vitest";
import {
  calculateElementOrigin,
  getApprovedTransitions,
  didRankingPositionImprove,
  getReachedTributeMilestone,
  shouldCelebrate,
} from "./celebration.service";

describe("celebration service helpers", () => {
  it("detects reduced-motion preferences", () => {
    expect(shouldCelebrate(false, true)).toBe(false);
    expect(shouldCelebrate(true, false)).toBe(false);
    expect(shouldCelebrate(false, false)).toBe(true);
  });

  it("converts an element rectangle to confetti origin coordinates", () => {
    const origin = calculateElementOrigin(
      { left: 100, top: 80, width: 200, height: 40 },
      { width: 1000, height: 500 }
    );

    expect(origin).toEqual({ x: 0.2, y: 0.2 });
  });

  it("returns the highest tribute milestone crossed since the previous total", () => {
    expect(getReachedTributeMilestone(90, 120)).toBe(100);
    expect(getReachedTributeMilestone(100, 499)).toBeNull();
    expect(getReachedTributeMilestone(499, 1000)).toBe(1000);
  });

  it("detects newly approved items from previous pending statuses", () => {
    expect(
      getApprovedTransitions(
        { mission1: "PENDING", mission2: "APPROVED" },
        [
          { id: "mission1", status: "APPROVED" },
          { id: "mission2", status: "APPROVED" },
          { id: "mission3", status: "APPROVED" },
        ]
      )
    ).toEqual(["mission1"]);
  });

  it("detects ranking improvements from lower numeric positions", () => {
    expect(didRankingPositionImprove("5", 3)).toBe(true);
    expect(didRankingPositionImprove("3", 5)).toBe(false);
    expect(didRankingPositionImprove(null, 1)).toBe(false);
  });
});

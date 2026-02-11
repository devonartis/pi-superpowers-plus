import { describe, test, expect, beforeEach } from "vitest";
import { WorkflowTracker, WORKFLOW_PHASES } from "../../../extensions/workflow-monitor/workflow-tracker";

describe("WorkflowTracker", () => {
  let tracker: WorkflowTracker;

  beforeEach(() => {
    tracker = new WorkflowTracker();
  });

  test("starts idle with all phases pending", () => {
    const s = tracker.getState();
    expect(s.currentPhase).toBeNull();
    for (const p of WORKFLOW_PHASES) expect(s.phases[p]).toBe("pending");
  });

  test("advancing to a later phase marks earlier pending phases as skipped", () => {
    tracker.advanceTo("execute");
    const s = tracker.getState();
    expect(s.currentPhase).toBe("execute");
    expect(s.phases.brainstorm).toBe("skipped");
    expect(s.phases.plan).toBe("skipped");
    expect(s.phases.execute).toBe("active");
  });

  test("advanceTo is forward-only (no-op when going backwards)", () => {
    tracker.advanceTo("plan");
    tracker.advanceTo("brainstorm");
    expect(tracker.getState().currentPhase).toBe("plan");
  });

  test("completeCurrent marks current phase complete and keeps it as current until next advance", () => {
    tracker.advanceTo("plan");
    tracker.completeCurrent();
    const s = tracker.getState();
    expect(s.phases.plan).toBe("complete");
    expect(s.currentPhase).toBe("plan");
  });

  test("records artifacts per phase", () => {
    tracker.recordArtifact("brainstorm", "docs/plans/2026-02-10-x-design.md");
    expect(tracker.getState().artifacts.brainstorm).toBe("docs/plans/2026-02-10-x-design.md");
  });
});

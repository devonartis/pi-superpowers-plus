export const WORKFLOW_PHASES = [
  "brainstorm",
  "plan",
  "execute",
  "verify",
  "review",
  "finish",
] as const;

export type Phase = (typeof WORKFLOW_PHASES)[number];
export type PhaseStatus = "pending" | "active" | "complete" | "skipped";

export interface WorkflowTrackerState {
  phases: Record<Phase, PhaseStatus>;
  currentPhase: Phase | null;
  artifacts: Record<Phase, string | null>;
  prompted: Record<Phase, boolean>;
}

function cloneState(state: WorkflowTrackerState): WorkflowTrackerState {
  return JSON.parse(JSON.stringify(state)) as WorkflowTrackerState;
}

function emptyState(): WorkflowTrackerState {
  const phases = Object.fromEntries(
    WORKFLOW_PHASES.map((p) => [p, "pending"])
  ) as Record<Phase, PhaseStatus>;

  const artifacts = Object.fromEntries(
    WORKFLOW_PHASES.map((p) => [p, null])
  ) as Record<Phase, string | null>;

  const prompted = Object.fromEntries(
    WORKFLOW_PHASES.map((p) => [p, false])
  ) as Record<Phase, boolean>;

  return { phases, currentPhase: null, artifacts, prompted };
}

export class WorkflowTracker {
  private state: WorkflowTrackerState = emptyState();

  getState(): WorkflowTrackerState {
    return cloneState(this.state);
  }

  setState(state: WorkflowTrackerState): void {
    this.state = cloneState(state);
  }

  advanceTo(phase: Phase): boolean {
    const current = this.state.currentPhase;
    const nextIdx = WORKFLOW_PHASES.indexOf(phase);

    if (current) {
      const curIdx = WORKFLOW_PHASES.indexOf(current);
      if (nextIdx <= curIdx) return false;

      if (this.state.phases[current] === "active") {
        this.state.phases[current] = "complete";
      }
    }

    for (let i = 0; i < nextIdx; i++) {
      const p = WORKFLOW_PHASES[i]!;
      if (this.state.phases[p] === "pending") {
        this.state.phases[p] = "skipped";
      }
    }

    for (const p of WORKFLOW_PHASES) {
      if (p !== phase && this.state.phases[p] === "active") {
        this.state.phases[p] = "complete";
      }
    }

    this.state.currentPhase = phase;
    if (this.state.phases[phase] === "pending") {
      this.state.phases[phase] = "active";
    }

    return true;
  }

  completeCurrent(): boolean {
    const phase = this.state.currentPhase;
    if (!phase) return false;
    if (this.state.phases[phase] === "complete") return false;
    this.state.phases[phase] = "complete";
    return true;
  }

  recordArtifact(phase: Phase, path: string): boolean {
    if (this.state.artifacts[phase] === path) return false;
    this.state.artifacts[phase] = path;
    return true;
  }

  markPrompted(phase: Phase): boolean {
    if (this.state.prompted[phase]) return false;
    this.state.prompted[phase] = true;
    return true;
  }
}

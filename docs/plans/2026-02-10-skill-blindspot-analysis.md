# Skill Blindspot Analysis

> **Date:** 2026-02-10
> **Context:** Full audit of all 12 skills for missing guidance in realistic scenarios. Conducted after TDD enforcement chain analysis and alignment edits.

## Background

After aligning TDD enforcement across the skill chain (brainstorming → writing-plans → executing-plans/SDD → implementer-prompt → runtime monitor), we examined every skill for blindspots — common scenarios where an agent has no guidance.

This document captures the findings for future work. Blindspots are categorized by severity.

---

## Tier 1: Real Blindspots (common scenarios, no guidance)

### 1. executing-plans — Plan goes wrong mid-execution

**The scenario:** You're on Task 3 and realize the plan's *approach* is wrong. Not blocked — heading somewhere bad. Task 5 will be impossible given what you've learned during Tasks 1-3.

**What's missing:** The skill says "stop when blocked" and "ask for clarification rather than guessing," but doesn't address course correction when the plan itself needs revision. This isn't a blocker — it's a design discovery that makes part of the plan obsolete.

**Suggested fix:** Add 2-3 lines to "When to Stop and Ask for Help" or create a brief "When the Plan Is Wrong" section. Guidance: stop, report what you've learned and why the remaining plan won't work, propose revision or ask human to revisit.

### 2. finishing-a-development-branch — Merge conflicts

**The scenario:** Option 1 (merge locally) runs `git merge <feature-branch>` and main has advanced. Merge conflicts.

**What's missing:** The Option 1 instructions assume clean merge. No guidance on conflict resolution, re-running tests after resolution, or bailing to Option 2 (PR) instead.

**Suggested fix:** Add a conflict handling block to Option 1: if merge conflicts, either resolve → re-run tests → proceed, or abort merge and suggest switching to Option 2 (PR) for human resolution.

### 3. using-git-worktrees — Stale worktree

**The scenario:** Multi-day feature work. Main advances significantly while you're in the worktree. Tests start failing due to upstream changes, or you need new code from main.

**What's missing:** No rebase/merge guidance. No mention of keeping worktrees current.

**Suggested fix:** Add brief "Keeping Worktree Current" section: `git fetch origin && git rebase origin/main` (or merge), re-run tests after. Note: prefer rebase for clean history if no shared branch.

### 4. dispatching-parallel-agents — Agent conflict resolution and partial failure

**The scenario (conflicts):** Despite grouping by independent domain, two agents edit overlapping code. "Review and Integrate" says "Check for conflicts — Did agents edit same code?" but gives no resolution path.

**The scenario (partial failure):** 2 of 3 agents succeed, one fails. Do you integrate the successes and retry the failure? Or hold everything?

**What's missing:** Conflict resolution strategy and partial failure handling.

**Suggested fix:** Add to "Review and Integrate":
- **Conflicts:** If agents edited same files, review manually. Pick the correct version per hunk, or re-run one agent with the other's changes as context. Don't blindly merge.
- **Partial failure:** Integrate successful agents first (commit their work). Then retry failed agent with fresh context including the integrated changes.

### 5. subagent-driven-development — Task dependencies

**The scenario:** Plan has 5 tasks. Tasks 1-3 are independent. Task 4 uses the API created in Task 3. Task 5 builds on Task 4. The "When to Use" gate says "Tasks mostly independent?" but most real plans have *some* dependencies.

**What's missing:** How the orchestrator handles dependent tasks. Should it provide the previous task's output/commit as context? Should it tell the subagent what was just built?

**Suggested fix:** Add brief guidance: for dependent tasks, include the previous task's implementation summary and relevant file paths in the next subagent's context. The orchestrator already extracts all tasks upfront — it should also track what each completed task produced so it can pass forward.

### 6. writing-plans — Task ordering and plan sizing

**The scenario (ordering):** Plan has 8 tasks with a dependency graph. No guidance on ordering them so dependencies are satisfied.

**The scenario (sizing):** Plan has 15 tasks. Is this too big? Should it be phased?

**What's missing:** Task ordering guidance (dependency order, not arbitrary). Plan sizing guidance (when to split into phases).

**Suggested fix:** Add to "Remember" section:
- Order tasks so each task's dependencies are completed by earlier tasks
- If plan exceeds ~8 tasks, consider splitting into phases with a checkpoint between them

---

## Tier 2: Minor Gaps (real but less frequent)

### 7. brainstorming — No "check existing solutions" step

**The scenario:** Human says "I need a caching layer." You design one from scratch. The project already uses Redis, or there's a library that does exactly this.

**What's missing:** "Understanding the idea" phase doesn't include checking whether the problem is already solved in the codebase or ecosystem. YAGNI covers sub-features but not entire features.

**Suggested fix:** Add to "Understanding the idea" bullets: "Check if the codebase or ecosystem already solves this before designing from scratch."

### 8. requesting-code-review — Integration claim mismatch

**The scenario:** The "Integration with Workflows" section says "Executing Plans: Review after each batch (3 tasks)." But executing-plans uses *human* review between batches, not dispatched code-reviewer subagents.

**What's missing:** The claim is misleading. executing-plans has the human review directly. requesting-code-review (dispatched reviewer) is used by SDD, not executing-plans.

**Suggested fix:** Either correct the integration section to say executing-plans uses human review (and requesting-code-review is optional there), or update executing-plans to actually dispatch a reviewer. The former is simpler and more accurate.

### 9. SDD — Subagent failure escalation

**The scenario:** Implementer subagent fails Task 3. You dispatch a fix subagent. Fix subagent also fails. Now what?

**What's missing:** No escalation path. No "give up after N attempts" threshold like systematic-debugging has for fix attempts.

**Suggested fix:** Add to "If subagent fails task": after 2 failed subagent attempts on the same task, stop and escalate to human. Don't keep retrying — the task may need redesign.

---

## Tier 3: Not Worth Fixing

These were examined and determined to be too situational, too project-specific, or already adequately covered:

- **systematic-debugging in unfamiliar codebases** — Phase 2 "Find Working Examples" partially covers this. Too situational for general guidance.
- **TDD for slow test suites (monorepos)** — Project-specific concern. The skill's "run tests" guidance is already generic.
- **receiving-code-review for AI reviewers** — The "External Reviewers" section already covers the key behavior (verify independently, check if technically correct). AI-specific failure modes don't need a separate section.
- **Multiple concurrent worktrees** — Git handles natively. The skill creates one worktree per invocation; managing multiple is an orchestration concern.
- **verification-before-completion for non-test work** — "What command proves this claim?" is already generic enough to cover docs, config, CI changes.

---

## Fluff to Trim (previously identified)

These are not blindspots but dead weight identified during the audit:

### dispatching-parallel-agents
- **"Real-World Impact" section** (~6 lines at bottom) — Near-duplicate of "Real Example from Session" above it. Delete.
- **"Key Benefits" section** (~5 lines) — States the obvious (parallelization is parallel, speed is fast). Delete.

### receiving-code-review
- **"Forbidden Responses" and "Acknowledging Correct Feedback"** both list the same ❌ patterns (performative agreement). Merge into one section.

### subagent-driven-development
- **"Advantages" section** (~35 lines) — Marketing copy. Process is self-evidently structured from the diagrams and example. Cut entirely or reduce to 3-4 lines.

### finishing-a-development-branch
- **"Common Mistakes" and "Red Flags"** overlap ~60%. Merge into one section.

---

## TDD Alignment Edits (completed)

These changes were made during this audit session:

1. **brainstorming/SKILL.md** — Added "Design for testability" Key Principle
2. **subagent-driven-development/implementer-prompt.md** — Changed TDD from conditional ("if task says to") to unconditional ("Follow TDD for production code")
3. **executing-plans/SKILL.md** — Added TDD default to Remember section
4. **subagent-driven-development/SKILL.md** — Aligned Integration section to reflect TDD is in implementer prompt and enforced by workflow-monitor

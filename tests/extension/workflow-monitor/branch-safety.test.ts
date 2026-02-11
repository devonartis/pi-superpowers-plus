import { describe, test, expect, vi, beforeEach } from "vitest";
import workflowMonitorExtension from "../../../extensions/workflow-monitor";

type Handler = (event: any, ctx: any) => any;

vi.mock("node:child_process", () => ({ execSync: vi.fn() }));
import { execSync } from "node:child_process";
const execSyncMock = execSync as unknown as ReturnType<typeof vi.fn>;

function createFakePi() {
  const handlers = new Map<string, Handler[]>();

  return {
    handlers,
    api: {
      on(event: string, handler: Handler) {
        const list = handlers.get(event) ?? [];
        list.push(handler);
        handlers.set(event, list);
      },
      registerTool() {},
      registerCommand() {},
      appendEntry() {},
    },
  };
}

function getSingleHandler(handlers: Map<string, Handler[]>, event: string): Handler {
  const list = handlers.get(event) ?? [];
  expect(list.length).toBeGreaterThan(0);
  return list[0]!;
}

beforeEach(() => {
  execSyncMock.mockReset();
});

describe("branch safety monitor", () => {
  test("prepends current branch notice on the first tool_result of a session", async () => {
    execSyncMock.mockImplementation((cmd: string) => {
      if (cmd.startsWith("git branch")) return Buffer.from("my-branch\n");
      throw new Error("unexpected command");
    });

    const fake = createFakePi();
    workflowMonitorExtension(fake.api as any);

    const onToolResult = getSingleHandler(fake.handlers, "tool_result");

    const ctx = {
      hasUI: false,
      sessionManager: { getBranch: () => [] },
      ui: { setWidget: () => {} },
    };

    const res = await onToolResult(
      {
        toolName: "bash",
        input: { command: "echo hi" },
        content: [{ type: "text", text: "hi" }],
        details: { exitCode: 0 },
      },
      ctx
    );

    expect(res?.content?.[0]?.type).toBe("text");
    const text = res.content[0].text as string;
    expect(text).toContain("📌 Current branch: `my-branch`");
    expect(text).toContain("hi");
  });
});

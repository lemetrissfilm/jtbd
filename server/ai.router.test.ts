import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: "Это тестовый ответ AI о методологии JTBD.",
        },
      },
    ],
  }),
}));

// Mock fs module to avoid reading actual file
vi.mock("fs", () => ({
  readFileSync: vi.fn().mockReturnValue("# Synthetic JTBD\n\nТестовое содержание книги."),
}));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("ai.chat", () => {
  it("returns AI response for a user message", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.chat({
      messages: [
        { role: "user", content: "Что такое JTBD?" },
      ],
    });

    expect(result).toHaveProperty("content");
    expect(typeof result.content).toBe("string");
    expect(result.content.length).toBeGreaterThan(0);
  });

  it("handles conversation history", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.chat({
      messages: [
        { role: "user", content: "Что такое JTBD?" },
        { role: "assistant", content: "JTBD — это методология..." },
        { role: "user", content: "Расскажи подробнее" },
      ],
    });

    expect(result).toHaveProperty("content");
    expect(typeof result.content).toBe("string");
  });
});

describe("ai.evaluate", () => {
  it("evaluates a JTBD artifact", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.evaluate({
      artifact: "Когда я начинаю новый проект, я хочу понять пользователей, чтобы не тратить ресурсы впустую.",
      artifactType: "job_story",
    });

    expect(result).toHaveProperty("content");
    expect(typeof result.content).toBe("string");
    expect(result.content.length).toBeGreaterThan(0);
  });

  it("rejects artifacts that are too short", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.ai.evaluate({
        artifact: "короткий",
      })
    ).rejects.toThrow();
  });

  it("handles follow-up messages in evaluation", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.evaluate({
      artifact: "Когда я начинаю новый проект, я хочу понять пользователей, чтобы не тратить ресурсы впустую.",
      artifactType: "job_story",
      messages: [
        { role: "user", content: "Проверь этот Job Story" },
        { role: "assistant", content: "Хороший Job Story, но..." },
        { role: "user", content: "Как улучшить ситуацию?" },
      ],
    });

    expect(result).toHaveProperty("content");
    expect(typeof result.content).toBe("string");
  });
});

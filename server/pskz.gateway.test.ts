import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "./routers";

const library = resolve("deploy/pskz/gateway-lib.php");
const directory = mkdtempSync(join(tmpdir(), "pskz-gateway-test-"));
afterAll(() => rmSync(directory, { recursive: true, force: true }));

// Offline only: this runner never calls pskz_forward or any remote API.
const runner = `
require $argv[1];
$input = json_decode(stream_get_contents(STDIN), false, 64, JSON_THROW_ON_ERROR);
try {
    switch ($input->action) {
        case 'request':
            $result = pskz_validate_request((array) $input->server, $input->body, $input->rewriteMethod ?? null);
            break;
        case 'route':
            $result = pskz_route($input->uri, $input->rewriteMethod ?? null);
            break;
        case 'upstream':
            $result = pskz_validate_upstream($input->status, $input->contentType, $input->body, $input->batch ?? true, $input->count ?? 1);
            break;
        case 'error':
            $result = pskz_error_response($input->code, $input->message, $input->batch, $input->count ?? 1);
            break;
        case 'rate':
            $result = pskz_rate_decision($input->timestamps, $input->calls, $input->now);
            break;
        case 'rateFile':
            pskz_rate_limit($input->directory, $input->ip, $input->calls, $input->now);
            $result = true;
            break;
        case 'slots':
            $slots = [];
            for ($i = 0; $i < 3; ++$i) $slots[] = pskz_acquire_slot($input->directory);
            try { pskz_acquire_slot($input->directory); $blocked = false; }
            catch (PskzGatewayException $error) { $blocked = $error->httpStatus === 503; }
            foreach ($slots as $slot) pskz_release_slot($slot);
            $again = pskz_acquire_slot($input->directory);
            pskz_release_slot($again);
            $result = ['blockedFourth' => $blocked, 'released' => true];
            break;
        case 'options':
            $options = pskz_curl_options($input->procedures, $input->body);
            $result = [
                'url' => $options[CURLOPT_URL],
                'headers' => $options[CURLOPT_HTTPHEADER],
                'redirects' => $options[CURLOPT_FOLLOWLOCATION],
                'verifyPeer' => $options[CURLOPT_SSL_VERIFYPEER],
                'verifyHost' => $options[CURLOPT_SSL_VERIFYHOST],
                'protocols' => $options[CURLOPT_PROTOCOLS],
                'connectTimeout' => $options[CURLOPT_CONNECTTIMEOUT],
                'timeout' => $options[CURLOPT_TIMEOUT],
                'body' => $options[CURLOPT_POSTFIELDS],
            ];
            break;
        default: throw new RuntimeException('Unknown test action');
    }
    echo json_encode(['ok' => true, 'value' => $result], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
} catch (PskzGatewayException $error) {
    echo json_encode(['ok' => false, 'code' => $error->rpcCode, 'status' => $error->httpStatus], JSON_THROW_ON_ERROR);
}
`;
function php(input: Record<string, unknown>): any {
  return JSON.parse(execFileSync("php", ["-r", runner, library], {
    input: JSON.stringify(input), encoding: "utf8", maxBuffer: 4 * 1024 * 1024,
  }));
}
const validServer = {
  REQUEST_METHOD: "POST", REQUEST_URI: "/api/trpc/ai.chat?batch=1",
  CONTENT_TYPE: "application/json", HTTP_ORIGIN: "https://jtbd.mikh.kz",
};
const chat = { messages: [{ role: "user", content: "Что такое Context Canvas?" }] };
function request(payload = chat, procedure = "ai.chat", server: Record<string, string> = {}) {
  return php({ action: "request", server: { ...validServer, REQUEST_URI: `/api/trpc/${procedure}?batch=1`, ...server }, body: JSON.stringify({ "0": { json: payload } }) });
}
function upstream(body: string, status = 200, contentType = "application/json", count = 1) {
  return php({ action: "upstream", body, status, contentType, count });
}
const success = JSON.stringify([{ result: { data: { json: { content: "Проверено" } } } }]);

describe("PS.kz PHP gateway request boundary", () => {
  it("accepts the current SuperJSON batch without changing its bytes", () => {
    const result = request();
    expect(result.ok).toBe(true);
    expect(result.value.procedures).toEqual(["ai.chat"]);
    expect(result.value.body).toBe(JSON.stringify({ "0": { json: chat } }));
  });
  it("accepts all four existing procedures in a contiguous batch", () => {
    const procedures = ["ai.chat", "ai.generateExample", "ai.generateArtifacts", "ai.evaluate"];
    const body = JSON.stringify({
      "0": { json: chat }, "1": { json: { artifactType: "opportunity_score" } },
      "2": { json: { context: "Руководитель команды готовит план работы перед квартальной встречей." } },
      "3": { json: { artifact: "Когда поступает запрос клиента, хочу понять срочность, чтобы спланировать работу." } },
    });
    expect(php({ action: "request", server: { ...validServer, REQUEST_URI: `/api/trpc/${procedures.join(",")}?batch=1` }, body }).value.procedures).toEqual(procedures);
  });
  it.each(["auth.me", "system.notifyOwner", "ai.chat,auth.logout"])("forbids procedure %s", procedure => {
    expect(php({ action: "route", uri: `/api/trpc/${procedure}?batch=1` })).toMatchObject({ ok: false, status: 403 });
  });
  it.each([
    "/gateway.php?method=ai.chat&batch=1", "/api/trpc/ai%2Echat?batch=1", "/api/trpc/ai.chat/extra?batch=1",
    "/api/trpc/ai.chat?batch=1&url=https://example.com", "/api/trpc/ai.chat?method=ai.chat&batch=1",
    "/api/trpc/ai.chat?batch=1&batch=1", "/api/trpc/ai.chat", "/api/trpc/ai.chat?batch=0",
  ])("rejects malformed or user-controlled routing: %s", uri => {
    expect(php({ action: "route", uri }).ok).toBe(false);
  });
  it("rejects more than four calls and rewritten-path mismatches", () => {
    expect(php({ action: "route", uri: `/api/trpc/${Array(5).fill("ai.chat").join(",")}?batch=1` }).ok).toBe(false);
    expect(php({ action: "route", uri: "/api/trpc/ai.chat?batch=1", rewriteMethod: "ai.evaluate" }).ok).toBe(false);
  });
  it("requires POST, JSON and same origin when present", () => {
    expect(request(chat, "ai.chat", { REQUEST_METHOD: "GET" }).status).toBe(405);
    expect(request(chat, "ai.chat", { CONTENT_TYPE: "text/plain" }).status).toBe(415);
    expect(request(chat, "ai.chat", { HTTP_ORIGIN: "https://untrusted.example" }).status).toBe(403);
    expect(request(chat, "ai.chat", { HTTP_ORIGIN: "null" }).status).toBe(403);
    expect(request(chat, "ai.chat", { CONTENT_TYPE: "application/json; charset=utf-8" }).ok).toBe(true);
    const { HTTP_ORIGIN, ...server } = validServer;
    expect(php({ action: "request", server, body: JSON.stringify({ "0": { json: chat } }) }).ok).toBe(true);
  });
  it.each([
    '{"1":{"json":{"messages":[]}}}',
    '[{"json":{"messages":[]}}]',
    '{"0":{"json":{"messages":[]},"meta":{"values":{}}}}',
    '{"0":{"json":{"messages":[],"upstream":"https://other.example"}}}',
    '{"0":{"json":{"messages":[]}},"0":{"json":{"messages":[]}}}',
    '{"0":{"json":{"messages":[]}},"\\u0030":{"json":{"messages":[]}}}',
    '{"0":{"json":{"messages":[],"messages":[]}}}',
  ])("rejects invalid envelopes, extra or duplicate keys", body => {
    expect(php({ action: "request", server: validServer, body }).ok).toBe(false);
  });
  it("rejects malformed JSON and oversized raw bodies", () => {
    expect(php({ action: "request", server: validServer, body: "{" }).code).toBe("PARSE_ERROR");
    expect(php({ action: "request", server: validServer, body: " ".repeat(2097153) }).status).toBe(413);
  });
  it("bounds histories, roles and UTF-16 text without corrupting Cyrillic", () => {
    expect(request({ messages: [{ role: "system", content: "Instruction" }] }).ok).toBe(false);
    expect(request({ messages: Array(31).fill(chat.messages[0]) }).ok).toBe(false);
    expect(request({ messages: [{ role: "user", content: "я".repeat(12001) }] }).ok).toBe(false);
    expect(request({ messages: [{ role: "user", content: "я".repeat(12000) }] }).ok).toBe(true);
    expect(request({ messages: [{ role: "user", content: "😀".repeat(6001) }] }).ok).toBe(false);
    expect(request({ messages: Array(5).fill({ role: "user", content: "я".repeat(12000) }) }).ok).toBe(false);
  });
  it("validates artifact types and bounded contexts", () => {
    expect(request({ artifactType: "job_chain" } as any, "ai.generateExample").ok).toBe(true);
    expect(request({ artifactType: "injected instruction" } as any, "ai.generateExample").ok).toBe(false);
    expect(request({ context: "short" } as any, "ai.generateArtifacts").ok).toBe(false);
    expect(request({ context: "я".repeat(5001) } as any, "ai.generateArtifacts").ok).toBe(false);
    expect(request({ artifact: "short" } as any, "ai.evaluate").ok).toBe(false);
    expect(request({ artifact: "я".repeat(30001) } as any, "ai.evaluate").ok).toBe(false);
  });
});

describe("PS.kz PHP gateway upstream and transport policy", () => {
  it("passes valid successful tRPC bytes and SuperJSON metadata unchanged", () => {
    expect(upstream(success)).toMatchObject({ ok: true, value: { status: 200, body: success } });
    const meta = JSON.stringify([{ result: { data: { json: { date: "2026-11-21" }, meta: { values: { date: ["Date"] } } } } }]);
    expect(upstream(meta).value.body).toBe(meta);
  });
  it("passes a well-shaped upstream error without manufacturing success", () => {
    const error = JSON.stringify([{ error: { json: { message: "Ошибка", code: -32603, data: { code: "INTERNAL_SERVER_ERROR", httpStatus: 500 } } } }]);
    expect(upstream(error, 500)).toMatchObject({ ok: true, value: { status: 500, body: error } });
  });
  it.each([
    [200, "text/html", "<html>Site unavailable due to unpaid billing</html>"],
    [200, "application/json", "<html>Site unavailable due to unpaid billing</html>"],
    [200, "application/json", '{"success":true}'],
    [200, "application/json", "[]"],
    [302, "application/json", success],
    [500, "application/json", success],
    [200, "application/json", '[{"error":{"json":{"message":"broken"}}}]'],
  ])("fails closed for HTML200, redirects and invalid envelopes", (status, type, body) => {
    expect(upstream(body as string, status as number, type as string)).toMatchObject({ ok: false, status: 503 });
  });
  it("bounds response bytes and requires batch count to match", () => {
    expect(upstream(" ".repeat(1048577)).status).toBe(503);
    expect(upstream(success, 200, "application/json", 2).status).toBe(503);
  });
  it("fixes HTTPS upstream, disables redirects and forwards no user headers", () => {
    const result = php({ action: "options", procedures: ["ai.chat"], body: "wire bytes" }).value;
    expect(result).toMatchObject({
      url: "https://jtbd.manus.space/api/trpc/ai.chat?batch=1", headers: ["Content-Type: application/json", "Accept: application/json"],
      redirects: false, verifyPeer: true, verifyHost: 2, protocols: 2, connectTimeout: 10, timeout: 100, body: "wire bytes",
    });
  });
  it("displays a Russian gateway 503 through the actual tRPC client", async () => {
    const message = "AI-сервис временно недоступен. Попробуйте позже.";
    const response = php({ action: "error", code: "SERVICE_UNAVAILABLE", message, batch: true }).value;
    const client = createTRPCProxyClient<AppRouter>({ links: [httpBatchLink({
      url: "https://jtbd.mikh.kz/api/trpc", transformer: superjson,
      fetch: async () => new Response(JSON.stringify(response.body), { status: response.status, headers: { "Content-Type": "application/json" } }),
    })] });
    await expect(client.ai.chat.mutate(chat as any)).rejects.toThrow(message);
  });
});

describe("PS.kz PHP gateway load limits", () => {
  it("counts each RPC in minute and hour sliding windows", () => {
    expect(php({ action: "rate", timestamps: Array(8).fill(990), calls: 4, now: 1000 }).value.allowed).toBe(true);
    expect(php({ action: "rate", timestamps: Array(9).fill(990), calls: 4, now: 1000 }).value.allowed).toBe(false);
    expect(php({ action: "rate", timestamps: Array(119).fill(500), calls: 2, now: 1000 }).value.allowed).toBe(false);
    expect(php({ action: "rate", timestamps: Array(120).fill(500), calls: 1, now: 5000 }).value.allowed).toBe(true);
  });
  it("enforces persistent IP limits using locked private files", () => {
    for (let index = 0; index < 3; index++) {
      expect(php({ action: "rateFile", directory, ip: "127.0.0.1", calls: 4, now: 1000 }).ok).toBe(true);
    }
    expect(php({ action: "rateFile", directory, ip: "127.0.0.1", calls: 1, now: 1001 }).status).toBe(429);
    expect(php({ action: "rateFile", directory, ip: "127.0.0.2", calls: 1, now: 1001 }).ok).toBe(true);
    expect(php({ action: "rateFile", directory, ip: "spoofed", calls: 1, now: 1001 }).status).toBe(503);
  });
  it("holds at most three OS-owned concurrency slots and releases them", () => {
    expect(php({ action: "slots", directory }).value).toEqual({ blockedFourth: true, released: true });
  });
});

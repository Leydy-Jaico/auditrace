import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { io, type Socket } from "socket.io-client";
import type { View } from "../shared/types.js";
const base = "http://127.0.0.1:3017";
let processHandle: ReturnType<typeof spawn>;
const sockets: Socket[] = [];
async function request(route: string, body?: unknown, token?: string) {
  const res = await fetch(base + route, {
    method: body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: res.status, data: await res.json() };
}
test("Recorrido multijugador, autorización, puntuación y reinicio", async (t) => {
  processHandle = spawn(
    process.execPath,
    ["--import", "tsx", "server/index.ts"],
    {
      env: {
        ...process.env,
        PORT: "3017",
        DATABASE_URL: "",
        HOST_ACCESS_KEY: "test-key",
      },
      stdio: "pipe",
    },
  );
  t.after(() => {
    sockets.forEach((s) => s.disconnect());
    processHandle.kill();
  });
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(base + "/api/health");
      if (r.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.ok(ready, "Servidor disponible");
  assert.equal((await request("/api/rooms", { key: "wrong" })).status, 400);
  const host = (await request("/api/rooms", { key: "test-key" })).data;
  assert.ok(host.token);
  const first = (
    await request("/api/rooms/" + host.code + "/join", { alias: "Ana" })
  ).data;
  const second = (
    await request("/api/rooms/" + host.code + "/join", { alias: "Luis" })
  ).data;
  assert.equal(
    (await request("/api/rooms/" + host.code + "/join", { alias: "Ana" }))
      .status,
    400,
  );
  const endpoint = "/api/rooms/" + host.code;
  const action = (body: unknown, token = host.token) =>
    request(endpoint + "/action", body, token);
  let state: View = (await request(endpoint, undefined, first.token)).data;
  assert.equal(state.host, false);
  assert.equal(state.evidence.length, 0);
  assert.equal(state.solution, undefined);
  assert.equal(state.answers, undefined);
  assert.ok(!JSON.stringify(state).includes(host.token));
  assert.equal((await action({ type: "start" }, first.token)).status, 400);
  assert.equal(
    (
      await action(
        { type: "role", id: state.me!.id, role: "Administrador" },
        first.token,
      )
    ).status,
    400,
  );
  assert.equal(
    (await action({ type: "answer", question: 0, answer: 0 }, first.token))
      .status,
    400,
  );
  let last: View | undefined;
  const socket = io(base, { auth: first, transports: ["websocket"] });
  sockets.push(socket);
  socket.on("state", (s) => (last = s));
  await new Promise<void>((resolve, reject) => {
    socket.once("connect", () => resolve());
    socket.once("connect_error", reject);
  });
  await action({ type: "start" });
  for (let i = 0; i < 30 && last?.phase !== 1; i++)
    await new Promise((r) => setTimeout(r, 20));
  assert.equal(last?.phase, 1, "La fase llega vía Socket.IO");
  await action({ type: "pause" });
  assert.equal(
    (await action({ type: "answer", question: 0, answer: 0 }, first.token))
      .status,
    400,
  );
  await action({ type: "pause" });
  const concurrent = await Promise.all([
    action({ type: "answer", question: 0, answer: 0 }, first.token),
    action({ type: "answer", question: 0, answer: 0 }, first.token),
  ]);
  assert.deepEqual(concurrent.map((r) => r.status).sort(), [200, 400]);
  for (const [question, answer] of [
    [1, 1],
    [2, 2],
  ])
    assert.equal(
      (await action({ type: "answer", question, answer }, first.token)).status,
      200,
    );
  assert.equal(
    (await request(endpoint, undefined, first.token)).data.me.score,
    30,
  );
  await action({ type: "reveal" });
  assert.equal(
    (await action({ type: "answer", question: 0, answer: 0 }, second.token))
      .status,
    400,
  );
  await action({ type: "next" });
  const denied = await action(
    {
      type: "operation",
      operation: "UPDATE",
      gradeId: 1,
      value: 20,
      reason: "Prueba",
    },
    first.token,
  );
  assert.equal(denied.data.grades[0].current, 17);
  assert.equal(denied.data.events[0].ok, false);
  await action({ type: "role", id: state.me!.id, role: "Docente" });
  const updated = await action(
    {
      type: "operation",
      operation: "UPDATE",
      gradeId: 1,
      value: 13,
      reason: "Revisión aprobada",
    },
    first.token,
  );
  assert.equal(updated.data.grades[0].current, 13);
  assert.match(updated.data.events[0].detail, /17 → 13/);
  assert.equal(
    (
      await action(
        {
          type: "operation",
          operation: "UPDATE",
          gradeId: 1,
          value: 21,
          reason: "Prueba",
        },
        first.token,
      )
    ).status,
    400,
  );
  assert.equal((await action({ type: "next" }, first.token)).status, 400);
  await action({ type: "surprise" });
  assert.equal((await action({ type: "surprise" })).status, 400);
  const deleted = await action(
    { type: "operation", operation: "DELETE", gradeId: 1 },
    first.token,
  );
  assert.equal(deleted.data.grades.length, 4);
  assert.equal(deleted.data.events[0].ok, false);
  await action({ type: "next" });
  assert.equal(
    (
      await action(
        { type: "operation", operation: "SELECT", gradeId: 1 },
        first.token,
      )
    ).status,
    400,
  );
  const investigation = {
    type: "investigate",
    order: ["login", "update", "role", "select", "logout"],
    culprit: "admin_02",
    clue: "update",
  };
  assert.equal((await action(investigation, first.token)).data.me.score, 80);
  assert.equal((await action(investigation, first.token)).status, 400);
  await action({ type: "next" });
  const policy = {
    UPDATE: true,
    SELECT: false,
    DELETE: false,
    LOGIN: true,
    PERMISSION: true,
    FAILED: true,
  };
  const result = await action({ type: "policy", policy }, first.token);
  assert.equal(result.data.me.score, 100);
  assert.equal(
    (await action({ type: "policy", policy }, first.token)).status,
    400,
  );
  await action({ type: "next" });
  state = (await request(endpoint, undefined, first.token)).data;
  assert.match(state.solution!, /admin_02/);
  assert.equal(state.me!.score, 100);
  await action({ type: "end" });
  assert.equal(
    (await request(endpoint + "/join", { alias: "Late" })).status,
    400,
  );
  const reset = await action({ type: "reset" });
  assert.equal(reset.data.phase, 0);
  assert.equal(reset.data.round, 2);
  assert.equal(reset.data.people.length, 2);
  assert.equal(reset.data.people[0].score, 0);
  assert.equal(reset.data.grades[0].current, 17);
  assert.equal((await request(endpoint, undefined, "invalid")).status, 403);
});

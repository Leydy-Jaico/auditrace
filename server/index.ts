import "dotenv/config";
import express from "express";
import { createServer } from "node:http";
import { randomBytes, randomUUID, timingSafeEqual, createHash } from "node:crypto";
import path from "node:path";
import { Server } from "socket.io";
import { z } from "zod";
import {
  getRoom,
  saveRoom,
  persistent,
  databaseHealth,
  closeDatabase,
  defaultPolicy,
  initialGrades,
  evidence,
  type Room,
  type Member,
} from "./store.js";
import { operations, type View } from "../shared/types.js";
const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "16kb" }));
const http = createServer(app);
const production = process.env.NODE_ENV === "production";
const publicUrl = (process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || "http://localhost:5173").replace(/\/$/, "");
if (production && (!persistent || !process.env.HOST_ACCESS_KEY || !publicUrl.startsWith("https://"))) {
  throw new Error("Producción requiere DATABASE_URL, HOST_ACCESS_KEY y una URL pública HTTPS.");
}
if (process.env.RENDER) app.set("trust proxy", 1);
const origins = new Set([new URL(publicUrl).origin, ...(process.env.ALLOWED_ORIGINS || "").split(",").filter(Boolean)]);
if (!production) { origins.add("http://localhost:3001"); origins.add("http://localhost:5173"); }
const originAllowed = (origin: string | undefined) => !origin || origins.has(origin);
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  if (req.path.startsWith("/api")) {
    res.setHeader("Cache-Control", "no-store");
    if (!originAllowed(req.headers.origin)) { res.status(403).json({error:"Origen no autorizado."}); return; }
    if (req.headers.origin) {
      res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    }
    if (req.method === "OPTIONS") { res.sendStatus(204); return; }
  }
  next();
});
const io = new Server(http, {
  maxHttpBufferSize: 16384,
  cors: {origin: (origin, callback) => callback(null, originAllowed(origin))},
  allowRequest: (req, callback) => callback(null, originAllowed(req.headers.origin)),
});
const digest = (credential: string) => createHash("sha256").update(credential).digest("hex");
function verifyHostKey(value: unknown) {
  const expected = process.env.HOST_ACCESS_KEY;
  if (!expected) return;
  const supplied = Buffer.from(String(value || ""));
  const expectedBytes = Buffer.from(expected);
  if (supplied.length !== expectedBytes.length || !timingSafeEqual(supplied, expectedBytes)) {
    throw new Error("La clave del expositor es incorrecta.");
  }
}
const token = () => randomBytes(32).toString("hex");
const answerKey = [0, 1, 2];
const policySchema = z.object({
  UPDATE: z.boolean(),
  SELECT: z.boolean(),
  DELETE: z.boolean(),
  LOGIN: z.boolean(),
  PERMISSION: z.boolean(),
  FAILED: z.boolean(),
});
const actionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("start") }),
  z.object({ type: z.literal("next") }),
  z.object({ type: z.literal("pause") }),
  z.object({ type: z.literal("end") }),
  z.object({ type: z.literal("reset") }),
  z.object({ type: z.literal("surprise") }),
  z.object({ type: z.literal("reveal") }),
  z.object({
    type: z.literal("role"),
    id: z.string(),
    role: z.enum([
      "Estudiante",
      "Docente",
      "Administrador",
      "Auditor",
      "Auditora principal",
    ]),
  }),
  z.object({
    type: z.literal("answer"),
    question: z.number().int().min(0).max(2),
    answer: z.number().int().min(0).max(2),
  }),
  z.object({
    type: z.literal("operation"),
    operation: z.enum(["SELECT", "UPDATE", "DELETE"]),
    gradeId: z.number().int(),
    value: z.number().int().min(0).max(20).optional(),
    reason: z.string().trim().min(3).max(200).optional(),
  }),
  z.object({
    type: z.literal("investigate"),
    order: z.array(z.string()).length(5),
    culprit: z.enum(["admin_02", "estudiante_07", "docente_03"]),
    clue: z.enum(["update", "select", "role"]),
  }),
  z.object({ type: z.literal("policy"), policy: policySchema }),
]);
let queue = Promise.resolve();
function serial<T>(fn: () => Promise<T>): Promise<T> {
  const task = queue.then(fn);
  queue = task.then(
    () => {},
    () => {},
  );
  return task;
}
const online = new Map<string, number>();
function view(room: Room, credential: string): View {
  const host = digest(credential) === room.hostToken;
  const member = room.members.find((m) => m.token === digest(credential));
  if (!host && !member)
    throw new Error("Acceso no válido. Vuelve a unirte a la sala.");
  const people = room.members.map((m) => ({
    id: m.id,
    alias: m.alias,
    role: m.role,
    score: m.score,
    online: (online.get(m.id) || 0) > 0,
    answered: Object.keys(m.answers).length,
    investigated: !!m.investigation,
    policyDone: !!m.policy,
  }));
  const canSeeAnswers = room.phase > 1 || room.reveal;
  return {
    code: room.code,
    revision: room.revision || 0,
    myAnswers: member?.answers || {},
    phase: room.phase,
    paused: room.paused,
    ended: room.ended,
    started: room.started,
    people,
    grades: room.grades,
    events: host || room.phase >= 2 ? room.events : [],
    evidence:
      room.phase >= 3
        ? [...evidence].sort((a, b) => a.id.localeCompare(b.id))
        : [],
    votes:
      host || canSeeAnswers
        ? answerKey.map((_, q) =>
            [0, 1, 2].map(
              (a) => room.members.filter((m) => m.answers[q] === a).length,
            ),
          )
        : [],
    me: people.find((m) => m.id === member?.id) || null,
    host,
    myPolicy: member?.policy,
    policy: room.policy,
    publicUrl,
    storage: persistent ? "PostgreSQL" : "Demostración · memoria temporal",
    round: room.round,
    surprise: room.surprise,
    reveal: room.reveal,
    ...(canSeeAnswers ? { answers: answerKey } : {}),
    ...(room.phase === 5
      ? {
          solution:
            "La cuenta admin_02 modificó las tres notas a las 20:11:09 del 24 de octubre de 2026. Los valores anteriores y posteriores, el inicio de sesión y la IP permiten reconstruir el incidente. El cambio de rol ocurrió después. Identificar una cuenta no demuestra por sí solo qué persona la utilizó.",
        }
      : {}),
  };
}
async function broadcast(room: Room) {
  for (const socket of await io.in(room.code).fetchSockets()) {
    try {
      socket.emit("state", view(room, socket.data.token));
    } catch {
      socket.disconnect();
    }
  }
}
function event(
  room: Room,
  user: string,
  operation: (typeof operations)[number],
  detail: string,
  ok = true,
) {
  if (!room.policy[ok ? operation : "FAILED"]) return;
  room.events.unshift({
    id: randomUUID(),
    at: new Date().toISOString(),
    user,
    operation,
    table:
      operation === "LOGIN" || operation === "PERMISSION" ? "sistema" : "notas",
    detail,
    ok,
  });
  room.events = room.events.slice(0, 500);
}
app.get("/api/health", async (_req, res) => {
  try { await databaseHealth(); res.json({ok:true, storage:persistent?"postgresql":"memory", version:"1.1.0"}); }
  catch { res.status(503).json({ok:false, error:"Base de datos no disponible."}); }
});
const attempts = new Map<string, { count: number; until: number }>();
app.use("/api", (req, res, next) => {
  const credential = (req.headers.authorization || "").replace("Bearer ", "");
  const key = credential ? digest(credential) : (req.ip || "local");
  const now = Date.now();
  if (attempts.size > 10000)
    for (const [k, v] of attempts) if (v.until < now) attempts.delete(k);
  const entry = attempts.get(key);
  if (!entry || entry.until < now) {
    attempts.set(key, { count: 1, until: now + 60000 });
    next();
  } else if (++entry.count > 600)
    res
      .status(429)
      .json({ error: "Demasiadas solicitudes. Espera un minuto." });
  else next();
});
app.post("/api/rooms", async (req, res) => {
  try {
    await serial(async () => {
      verifyHostKey(req.body.key);
      let code = "";
      do {
        code = randomBytes(4).toString("hex").slice(0, 6).toUpperCase();
      } while (await getRoom(code));
      const hostCredential = token();
      const room: Room = {
        code,
        revision: 0,
        hostToken: digest(hostCredential),
        phase: 0,
        paused: false,
        ended: false,
        started: false,
        members: [],
        grades: structuredClone(initialGrades),
        events: [],
        policy: { ...defaultPolicy },
        round: 1,
        surprise: false,
        reveal: false,
      };
      await saveRoom(room);
      res.json({ code, token: hostCredential });
    });
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});
app.post("/api/rooms/:code/join", async (req, res) => {
  try {
    await serial(async () => {
      const alias = z.string().trim().min(2).max(24).parse(req.body.alias);
      const room = await getRoom(req.params.code.toUpperCase());
      if (!room || room.ended || room.phase === 5)
        throw new Error("La sala no existe o ya finalizó.");
      if (room.members.length >= 200)
        throw new Error("La sala está completa (200 participantes).");
      if (
        room.members.some((m) => m.alias.toLowerCase() === alias.toLowerCase())
      )
        throw new Error("Ese alias ya está en uso. Elige otro.");
      const memberCredential = token();
      const member: Member = {
        id: randomUUID(),
        token: digest(memberCredential),
        alias,
        role: "Estudiante",
        score: 0,
        answers: {},
      };
      room.members.push(member);
      event(room, alias, "LOGIN", "Ingreso a la investigación");
      await saveRoom(room);
      await broadcast(room);
      res.json({ code: room.code, token: memberCredential });
    });
  } catch (e) {
    res
      .status(400)
      .json({
        error:
          e instanceof z.ZodError
            ? "El alias debe tener de 2 a 24 caracteres."
            : (e as Error).message,
      });
  }
});
app.post("/api/rooms/:code/recover", async(req,res) => {
  try {
    await serial(async () => {
      if (!process.env.HOST_ACCESS_KEY) throw new Error("Configura la clave del expositor para recuperar salas.");
      verifyHostKey(req.body.key);
      const room=await getRoom(req.params.code.toUpperCase());
      if (!room) throw new Error("Sala no encontrada.");
      const credential=token(); room.hostToken=digest(credential);
      await saveRoom(room); await broadcast(room);
      res.json({code:room.code, token:credential});
    });
  } catch(e) {res.status(400).json({error:(e as Error).message});}
});
app.get("/api/rooms/:code", async (req, res) => {
  try {
    const room = await getRoom(req.params.code);
    if (!room) throw new Error("Sala no encontrada.");
    res.json(
      view(room, (req.headers.authorization || "").replace("Bearer ", "")),
    );
  } catch (e) {
    res.status(403).json({ error: (e as Error).message });
  }
});
app.post("/api/rooms/:code/action", async (req, res) => {
  try {
    await serial(async () => {
      const room = await getRoom(req.params.code);
      if (!room) throw new Error("Sala no encontrada.");
      const credential = (req.headers.authorization || "").replace(
        "Bearer ",
        "",
      );
      const current = view(room, credential);
      const actor = room.members.find((m) => m.token === digest(credential));
      const action = actionSchema.parse(req.body);
      const privileged = [
        "start",
        "next",
        "pause",
        "end",
        "reset",
        "surprise",
        "role",
        "reveal",
      ];
      if (privileged.includes(action.type) && !current.host)
        throw new Error("Solo el expositor puede realizar esta acción.");
      if (
        !privileged.includes(action.type) &&
        (room.paused || room.ended || !room.started)
      )
        throw new Error("La actividad no está activa.");
      if (room.ended && action.type !== "reset")
        throw new Error("La sesión finalizó. Reinicia para volver a jugar.");
      switch (action.type) {
        case "start":
          if (room.started) throw new Error("La sesión ya comenzó.");
          room.started = true;
          room.phase = 1;
          break;
        case "next":
          if (!room.started || room.phase >= 5)
            throw new Error("No hay una siguiente fase disponible.");
          room.phase++;
          room.paused = false;
          break;
        case "pause":
          if (!room.started || room.phase === 5)
            throw new Error("No hay una actividad que pausar.");
          room.paused = !room.paused;
          break;
        case "end":
          room.ended = true;
          room.phase = 5;
          room.paused = false;
          break;
        case "reset":
          room.round++;
          room.phase = 0;
          room.started = false;
          room.paused = false;
          room.ended = false;
          room.reveal = false;
          room.surprise = false;
          room.events = [];
          room.policy = { ...defaultPolicy };
          room.grades = structuredClone(initialGrades);
          for (const m of room.members) {
            m.score = 0;
            m.answers = {};
            delete m.investigation;
            delete m.policy;
          }
          break;
        case "reveal":
          if (room.phase !== 1)
            throw new Error("Las respuestas se revelan en la fase 1.");
          room.reveal = true;
          break;
        case "role": {
          const member = room.members.find((m) => m.id === action.id);
          if (!member) throw new Error("Participante no encontrado.");
          event(
            room,
            "Expositor",
            "PERMISSION",
            member.alias + ": " + member.role + " → " + action.role,
          );
          member.role = action.role;
          break;
        }
        case "surprise":
          if (room.phase !== 2 || room.surprise)
            throw new Error(
              "El incidente sorpresa solo se activa una vez en operaciones.",
            );
          room.surprise = true;
          event(
            room,
            "estudiante_sorpresa",
            "UPDATE",
            "Intento preparado: 09 → 20 · permiso insuficiente",
            false,
          );
          break;
        case "answer":
          if (!actor || room.phase !== 1 || room.reveal)
            throw new Error("La votación está cerrada.");
          if (actor.answers[action.question] !== undefined)
            throw new Error("Esta respuesta ya fue registrada.");
          actor.answers[action.question] = action.answer;
          if (answerKey[action.question] === action.answer) actor.score += 10;
          break;
        case "operation": {
          if (!actor || room.phase !== 2)
            throw new Error(
              "Las operaciones solo están disponibles en la fase 2.",
            );
          const grade = room.grades.find((g) => g.id === action.gradeId);
          if (!grade) throw new Error("Registro inexistente.");
          if (action.operation === "SELECT") {
            event(room, actor.alias, "SELECT", "Consulta de " + grade.student);
            break;
          }
          const allowed =
            action.operation === "UPDATE" &&
            ["Docente", "Administrador"].includes(actor.role);
          if (!allowed) {
            event(
              room,
              actor.alias,
              action.operation,
              grade.student + " · operación bloqueada por permisos",
              false,
            );
            break;
          }
          if (action.value === undefined || !action.reason)
            throw new Error(
              "Indica una nota de 0 a 20 y un motivo de al menos 3 caracteres.",
            );
          event(
            room,
            actor.alias,
            "UPDATE",
            grade.student +
              ": " +
              grade.current +
              " → " +
              action.value +
              " · " +
              action.reason,
          );
          grade.current = action.value;
          break;
        }
        case "investigate":
          if (!actor || room.phase !== 3 || actor.investigation)
            throw new Error(
              "La investigación no está disponible o ya fue enviada.",
            );
          if (
            new Set(action.order).size !== 5 ||
            action.order.some((id) => !evidence.some((e) => e.id === id))
          )
            throw new Error("Orden no válido.");
          actor.score += action.order.every((id, i) => id === evidence[i].id)
            ? 20
            : 0;
          actor.score += action.culprit === "admin_02" ? 20 : 0;
          actor.score += action.clue === "update" ? 10 : 0;
          actor.investigation = action;
          break;
        case "policy":
          if (room.phase !== 4)
            throw new Error("La política solo se evalúa en la fase 4.");
          if (current.host) {
            room.policy = action.policy;
          } else {
            if (!actor || actor.policy)
              throw new Error("La política ya fue enviada.");
            actor.policy = action.policy;
            actor.score +=
              (action.policy.UPDATE ? 8 : 0) +
              (action.policy.LOGIN ? 6 : 0) +
              (action.policy.PERMISSION ? 3 : 0) +
              (action.policy.FAILED ? 3 : 0);
          }
          break;
      }
      await saveRoom(room);
      await broadcast(room);
      res.json(view(room, credential));
    });
  } catch (e) {
    res
      .status(400)
      .json({
        error:
          e instanceof z.ZodError
            ? "Revisa los datos enviados."
            : (e as Error).message,
      });
  }
});
io.use(async (socket, next) => {
  try {
    const room = await getRoom(String(socket.handshake.auth.code));
    if (!room) throw new Error("Sala no encontrada");
    view(room, String(socket.handshake.auth.token));
    socket.data.token = socket.handshake.auth.token;
    socket.data.code = room.code;
    socket.data.memberId = room.members.find(
      (m) => m.token === digest(socket.data.token),
    )?.id;
    next();
  } catch {
    next(new Error("No se pudo acceder a la sala."));
  }
});
io.on("connection", (socket) => {
  const id = socket.data.memberId;
  if (id) online.set(id, (online.get(id) || 0) + 1);
  socket.join(socket.data.code);
  void serial(async () => {
    const room = await getRoom(socket.data.code);
    if (room) await broadcast(room);
  });
  socket.on("disconnect", () => {
    if (id) online.set(id, Math.max(0, (online.get(id) || 1) - 1));
    void serial(async () => {
      const room = await getRoom(socket.data.code);
      if (room) await broadcast(room);
    });
  });
});
app.use("/api", (_req,res)=>{res.status(404).json({error:"Ruta no encontrada."});});
app.use(((error, _req, res, _next) => {
  const status = error?.status === 413 ? 413 : 400;
  res.status(status).json({error:status===413?"La solicitud es demasiado grande.":"Solicitud no válida."});
}) as express.ErrorRequestHandler);
app.use(express.static(path.resolve("dist")));
app.get("*", (_req, res) => res.sendFile(path.resolve("dist/index.html")));
http.listen(Number(process.env.PORT) || 3001, "0.0.0.0", () =>
  console.log(
    "AUDITRACE listo en http://localhost:" +
      (process.env.PORT || 3001) +
      " · " +
      (persistent ? "PostgreSQL" : "MEMORIA TEMPORAL"),
  ),
);

async function shutdown() {
  io.close();
  http.close();
  await closeDatabase();
  process.exit(0);
}
process.once("SIGTERM", () => { void shutdown(); });
process.once("SIGINT", () => { void shutdown(); });

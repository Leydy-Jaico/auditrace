import { PrismaClient, Prisma } from "@prisma/client";
import type {
  AuditEvent,
  Evidence,
  Grade,
  Policy,
  Role,
} from "../shared/types.js";
export type Member = {
  id: string;
  token: string;
  alias: string;
  role: Role;
  score: number;
  answers: Record<string, number>;
  investigation?: unknown;
  policy?: Policy;
};
export type Room = {
  code: string;
  revision: number;
  hostToken: string;
  phase: number;
  paused: boolean;
  ended: boolean;
  started: boolean;
  members: Member[];
  grades: Grade[];
  events: AuditEvent[];
  policy: Policy;
  round: number;
  surprise: boolean;
  reveal: boolean;
};
export const persistent = Boolean(process.env.DATABASE_URL);
const prisma = persistent ? new PrismaClient() : null;
const memory = new Map<string, Room>();
export async function getRoom(code: string): Promise<Room | null> {
  if (!prisma) {
    const r = memory.get(code);
    return r ? structuredClone(r) : null;
  }
  const data = await prisma.session.findUnique({ where: { code } });
  return data ? (data.snapshot as unknown as Room) : null;
}
export async function saveRoom(room: Room) {
  room.revision = (room.revision || 0) + 1;
  if (prisma)
    await prisma.session.upsert({
      where: { code: room.code },
      create: {
        code: room.code,
        snapshot: room as unknown as Prisma.InputJsonValue,
      },
      update: { snapshot: room as unknown as Prisma.InputJsonValue },
    });
  else memory.set(room.code, structuredClone(room));
}
export const defaultPolicy: Policy = {
  UPDATE: true,
  SELECT: true,
  DELETE: false,
  LOGIN: true,
  PERMISSION: true,
  FAILED: true,
};
export const initialGrades: Grade[] = [
  {
    id: 1,
    student: "Ana Torres",
    course: "Base de Datos",
    original: 11,
    found: 17,
    current: 17,
  },
  {
    id: 2,
    student: "Luis Pérez",
    course: "Algoritmos",
    original: 9,
    found: 15,
    current: 15,
  },
  {
    id: 3,
    student: "Sofía Vega",
    course: "Redes",
    original: 12,
    found: 18,
    current: 18,
  },
  {
    id: 4,
    student: "Carlos Díaz",
    course: "Base de Datos",
    original: 14,
    found: 14,
    current: 14,
  },
];
export const evidence: Evidence[] = [
  {
    id: "login",
    time: "20:10:23",
    title: "Inicio de sesión",
    detail: "Cuenta admin_02 · IP 192.168.1.45 · acceso aceptado",
  },
  {
    id: "update",
    time: "20:11:09",
    title: "Tres notas modificadas",
    detail:
      "Cuenta admin_02 · UPDATE notas · Ana 11 → 17; Luis 09 → 15; Sofía 12 → 18 · sin solicitud aprobada",
  },
  {
    id: "role",
    time: "20:12:11",
    title: "Cambio de rol",
    detail:
      "Cuenta admin_02 · Administrador → Docente · registrado después de las modificaciones",
  },
  {
    id: "select",
    time: "20:13:45",
    title: "Consulta de notas",
    detail: "Cuenta estudiante_07 · SELECT notas · lectura sin modificación",
  },
  {
    id: "logout",
    time: "20:14:18",
    title: "Cierre de sesión",
    detail: "Cuenta admin_02 · fin de la sesión desde la misma IP",
  },
];

export async function databaseHealth() { if(prisma) await prisma.$queryRawUnsafe("SELECT 1"); }
export async function closeDatabase() { if(prisma) await prisma.$disconnect(); }

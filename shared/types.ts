export type Role =
  | "Estudiante"
  | "Docente"
  | "Administrador"
  | "Auditor"
  | "Auditora principal";
export type Operation =
  | "UPDATE"
  | "SELECT"
  | "DELETE"
  | "LOGIN"
  | "PERMISSION"
  | "FAILED";
export type Person = {
  id: string;
  alias: string;
  role: Role;
  score: number;
  online: boolean;
  answered: number;
  investigated: boolean;
  policyDone: boolean;
};
export type Grade = {
  id: number;
  student: string;
  course: string;
  original: number;
  found: number;
  current: number;
};
export type AuditEvent = {
  id: string;
  at: string;
  user: string;
  operation: Operation;
  table: string;
  detail: string;
  ok: boolean;
};
export type Evidence = {
  id: string;
  time: string;
  title: string;
  detail: string;
};
export type Policy = Record<Operation, boolean>;
export type View = {
  revision: number;
  myAnswers: Record<string, number>;
  code: string;
  phase: number;
  paused: boolean;
  ended: boolean;
  started: boolean;
  people: Person[];
  grades: Grade[];
  events: AuditEvent[];
  evidence: Evidence[];
  votes: number[][];
  me: Person | null;
  host: boolean;
  policy: Policy;
  publicUrl: string;
  storage: string;
  round: number;
  surprise: boolean;
  reveal: boolean;
  myPolicy?: Policy;
  answers?: number[];
  solution?: string;
};
export const phases = [
  "El incidente",
  "Operaciones",
  "Investigación",
  "Política",
  "Resultados",
];
export const questions = [
  {
    text: "¿Qué información necesitamos para investigar estas modificaciones?",
    options: [
      "La cuenta, el momento y el cambio registrado",
      "Únicamente el nombre del estudiante",
      "Solamente la nota actual",
    ],
  },
  {
    text: "¿Qué permite reconstruir la secuencia de un incidente?",
    options: [
      "Una copia del promedio final",
      "Los registros con marcas de tiempo y contexto",
      "El color de las celdas modificadas",
    ],
  },
  {
    text: "¿Una cuenta identificada prueba quién estaba detrás?",
    options: [
      "Sí, siempre identifica a la persona",
      "Sí, si tiene permisos de administrador",
      "No; hay que contrastar identidad, acceso y otras evidencias",
    ],
  },
];
export const operations: Operation[] = [
  "UPDATE",
  "SELECT",
  "DELETE",
  "LOGIN",
  "PERMISSION",
  "FAILED",
];
export const operationNames: Record<Operation, string> = {
  UPDATE: "Modificaciones de notas",
  SELECT: "Consultas de notas",
  DELETE: "Eliminaciones",
  LOGIN: "Inicios de sesión",
  PERMISSION: "Cambios de permisos",
  FAILED: "Intentos fallidos",
};

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Users,
  Copy,
  CheckCircle2,
  Database,
  FileSearch,
  ShieldCheck,
  Lightbulb,
  Activity,
  Download,
  Check,
  X,
  Eye,
  Pencil,
  LockKeyhole,
} from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, Badge, Empty, CardHeading } from "./Common";
import { operations, type View, type Role } from "../../shared/types";
export type Act = (action: unknown) => Promise<View | null>;
const roles: Role[] = [
  "Estudiante",
  "Docente",
  "Administrador",
  "Auditor",
  "Auditora principal",
];
export function Access({
  room,
  notify,
}: {
  room: View;
  notify: (s: string) => void;
}) {
  const url = room.publicUrl + "/?sala=" + room.code;
  return (
    <section className="card access-card">
      <Badge kind="mint">
        <span className="live-dot" />
        {room.ended ? "SALA FINALIZADA" : "ACCESO A LA SALA"}
      </Badge>
      <h2>
        Una pista. Un equipo.
        <br />
        Una investigación.
      </h2>
      <p>Escanea el QR con la cámara de tu celular.</p>
      <div className="qr">
        <QRCodeSVG value={url} size={190} level="M" marginSize={2} />
      </div>
      <small>O ingresa el código de sala</small>
      <div className="room-code">{room.code}</div>
      <div className="copy-row">
        <input
          aria-label="Enlace de la sala"
          readOnly
          value={url}
          onFocus={(e) => e.target.select()}
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              notify("Enlace copiado");
            } catch {
              notify("Selecciona el enlace y cópialo manualmente");
            }
          }}
        >
          <Copy size={16} /> Copiar
        </Button>
      </div>
      {/localhost|127\.0\.0\.1/.test(url) && (
        <p className="network-note">
          QR local: configura PUBLIC_URL con la IP de tu equipo o una URL
          pública para usar celulares.
        </p>
      )}
      <div className="connected-total">
        <Users size={20} />
        <strong>{room.people.filter((p) => p.online).length}</strong>{" "}
        participantes conectados
      </div>
    </section>
  );
}
export function People({
  room,
  act,
  busy,
  compact = false,
}: {
  room: View;
  act: Act;
  busy: boolean;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "" : "card"}>
      {!compact && (
        <CardHeading
          icon={<Users />}
          title="Tu equipo de investigadores"
          text="Los roles son simulados; solo tú puedes asignarlos."
        />
      )}
      {room.people.length === 0 ? (
        <Empty>La sala está lista. Esperando al primer investigador.</Empty>
      ) : (
        <div className="people-list">
          {room.people.map((p, i) => (
            <div className="person-row" key={p.id}>
              <Avatar name={p.alias} index={i} />
              <div className="person-info">
                <strong>{p.alias}</strong>
                <small>
                  <span className={"status-dot " + (p.online ? "on" : "")} />
                  {p.online ? "Conectado" : "Desconectado"} · {p.score} pts
                </small>
              </div>
              <select
                aria-label={"Rol de " + p.alias}
                value={p.role}
                disabled={busy || room.ended}
                onChange={(e) =>
                  act({ type: "role", id: p.id, role: e.target.value })
                }
              >
                {roles.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export function Waiting({ room }: { room: View }) {
  return (
    <section className="card waiting">
      <div className="waiting-illustration">
        <span className="orbit o1">
          <Database />
        </span>
        <span className="orbit o2">
          <FileSearch />
        </span>
        <Avatar name={room.me?.alias || "Tú"} />
        <span className="orbit o3">
          <ShieldCheck />
        </span>
      </div>
      <Badge kind="mint">
        <CheckCircle2 size={14} /> Conexión establecida
      </Badge>
      <h2>Tu investigación está por comenzar</h2>
      <p>
        El expositor dará la señal de inicio.
        <br />
        La siguiente misión aparecerá aquí automáticamente.
      </p>
      <div className="waiting-stats">
        <Users />
        <strong>{room.people.filter((p) => p.online).length}</strong>
        <span>investigadores en la sala</span>
      </div>
      <div className="tip">
        <Lightbulb />
        <span>
          <strong>Una buena pregunta abre una pista.</strong>
          <br />
          Lee cada evidencia y analiza antes de responder.
        </span>
      </div>
    </section>
  );
}
export function Audit({ room }: { room: View }) {
  const [filter, setFilter] = useState("ALL");
  const items = room.events.filter(
    (e) =>
      filter === "ALL" ||
      (filter === "DENIED" && !e.ok) ||
      e.operation === filter,
  );
  function download() {
    const blob = new Blob([JSON.stringify(room.events, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "auditrace-" + room.code + "-eventos.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section className="card audit-card">
      <div className="split-heading">
        <CardHeading
          icon={<Activity />}
          title="Cada acción deja un rastro"
          text="Registros de la simulación · hasta 500 eventos por ronda"
        />
        <Badge kind="mint">
          <span className="live-dot" /> En vivo
        </Badge>
      </div>
      <div className="audit-toolbar">
        <select
          aria-label="Filtrar eventos"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="ALL">Todos los eventos</option>
          {operations.map((op) => (
            <option key={op}>{op}</option>
          ))}
          <option value="DENIED">Denegados</option>
        </select>
        <Button
          variant="ghost"
          size="sm"
          onClick={download}
          disabled={!room.events.length}
        >
          <Download size={16} /> Exportar JSON
        </Button>
      </div>
      <div className="table-scroll audit-table">
        <table>
          <thead>
            <tr>
              <th>Hora</th>
              <th>Usuario</th>
              <th>Operación</th>
              <th>Tabla</th>
              <th>Detalle</th>
              <th>Resultado</th>
            </tr>
          </thead>
          <tbody>
            {items.map((e) => (
              <tr key={e.id}>
                <td className="mono">
                  {new Date(e.at).toLocaleTimeString("es-PE", {
                    timeZone: "America/Lima",
                  })}
                </td>
                <td>{e.user}</td>
                <td>
                  <Badge kind={e.operation === "UPDATE" ? "amber" : "blue"}>
                    {e.operation}
                  </Badge>
                </td>
                <td>{e.table}</td>
                <td className="event-detail">{e.detail}</td>
                <td>
                  <Badge kind={e.ok ? "mint" : "red"}>
                    {e.ok ? <Check size={12} /> : <X size={12} />}{" "}
                    {e.ok ? "Exitoso" : "Denegado"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <Empty>
            Aún no hay eventos para este filtro. Las operaciones aparecerán
            aquí.
          </Empty>
        )}
      </div>
      <div className="audit-stats">
        {[
          { op: "SELECT", label: "Consultas", icon: Eye },
          { op: "UPDATE", label: "Modificaciones", icon: Pencil },
          { op: "DENIED", label: "Denegados", icon: LockKeyhole },
          { op: "LOGIN", label: "Ingresos", icon: Users },
        ].map(({ op, label, icon: Icon }, i) => (
          <div key={op}>
            <span
              className={"feature-icon " + ["blue", "mint", "red", "amber"][i]}
            >
              <Icon size={20} />
            </span>
            <span>
              <strong>
                {
                  room.events.filter((e) =>
                    op === "DENIED" ? !e.ok : e.operation === op && e.ok,
                  ).length
                }
              </strong>
              <small>{label}</small>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

import { useState } from "react";
import {
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Users,
  FileSearch,
  Lightbulb,
  CheckCircle2,
  SlidersHorizontal,
  Eye,
  ShieldCheck,
  Activity,
  Database,
  Trophy,
  Clock3,
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Button } from "./ui/button";
import { Badge, Avatar, Empty, CardHeading } from "./Common";
import type { Act } from "./RoomPanels";
import {
  operations,
  operationNames,
  type View,
  type Policy,
} from "../../shared/types";
export function Investigation({
  room,
  act,
  busy,
}: {
  room: View;
  act: Act;
  busy: boolean;
}) {
  const [order, setOrder] = useState([
    "role",
    "update",
    "logout",
    "login",
    "select",
  ]);
  const [culprit, setCulprit] = useState(""),
    [clue, setClue] = useState("");
  function move(i: number, delta: number) {
    const copy = [...order];
    [copy[i], copy[i + delta]] = [copy[i + delta], copy[i]];
    setOrder(copy);
  }
  return (
    <div className="two-column">
      <section className="card">
        <CardHeading
          icon={<FileSearch />}
          title="Las piezas del caso"
          text="Archivo histórico · 24 de octubre de 2026 · hora de Lima"
        />
        <div className="evidence-list">
          {room.evidence.map((e, i) => (
            <div className="evidence-item" key={e.id}>
              <span
                className={
                  "feature-icon " +
                  ["amber", "blue", "lavender", "mint", "blue"][i]
                }
              >
                <FileSearch size={20} />
              </span>
              <div>
                <Badge>{e.time}</Badge>
                <h3>{e.title}</h3>
                <p>{e.detail}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="tip">
          <Lightbulb />
          <span>
            La hora es una pista. Distingue una lectura de una modificación y
            observa cuándo cambió el rol.
          </span>
        </div>
      </section>
      <section className="card">
        <Badge kind="lavender">MISIÓN 03 · HASTA 50 PUNTOS</Badge>
        <h2 className="section-title">
          {room.host
            ? "El grupo reconstruye la secuencia"
            : "Conecta las evidencias"}
        </h2>
        {room.host ? (
          <>
            <p className="muted">
              Pide al grupo que ordene los eventos y sustente su conclusión.
            </p>
            <div className="big-stat">
              {room.people.filter((p) => p.investigated).length}
              <span> / {room.people.length}</span>
            </div>
            <p>investigaciones entregadas</p>
            <div className="tip">
              <Users />
              <span>
                La auditora principal puede revisar estas mismas evidencias
                desde su celular y discutirlas con la clase.
              </span>
            </div>
          </>
        ) : room.me?.investigated ? (
          <div className="success-state">
            <CheckCircle2 size={45} />
            <h3>Investigación entregada</h3>
            <p>Tu conclusión quedó guardada. Espera la siguiente fase.</p>
            <Badge kind="mint">{room.me.score} puntos acumulados</Badge>
          </div>
        ) : (
          <>
            <p className="muted">
              Ordena los eventos del primero al último. Usa las flechas.
            </p>
            <div className="order-list">
              {order.map((id, i) => (
                <div key={id}>
                  <span className="order-number">{i + 1}</span>
                  <strong>
                    {room.evidence.find((e) => e.id === id)?.title}
                  </strong>
                  <button
                    aria-label={"Subir " + id}
                    disabled={i === 0 || room.paused}
                    onClick={() => move(i, -1)}
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    aria-label={"Bajar " + id}
                    disabled={i === 4 || room.paused}
                    onClick={() => move(i, 1)}
                  >
                    <ArrowDown size={16} />
                  </button>
                </div>
              ))}
            </div>
            <label>
              ¿Qué cuenta realizó las modificaciones?
              <select
                value={culprit}
                onChange={(e) => setCulprit(e.target.value)}
              >
                <option value="">Selecciona una cuenta</option>
                {["admin_02", "estudiante_07", "docente_03"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              ¿Qué evidencia lo demuestra directamente?
              <select value={clue} onChange={(e) => setClue(e.target.value)}>
                <option value="">Selecciona una evidencia</option>
                <option value="update">
                  Registro UPDATE con valores anteriores y posteriores
                </option>
                <option value="select">Consulta SELECT de notas</option>
                <option value="role">Cambio de rol posterior</option>
              </select>
            </label>
            <Button
              className="full"
              disabled={busy || room.paused || !culprit || !clue}
              onClick={() => act({ type: "investigate", order, culprit, clue })}
            >
              Entregar conclusión <ArrowRight size={17} />
            </Button>
          </>
        )}
      </section>
    </div>
  );
}
export function PolicyPanel({
  room,
  act,
  busy,
}: {
  room: View;
  act: Act;
  busy: boolean;
}) {
  const [policy, setPolicy] = useState<Policy>({
      ...(room.myPolicy || room.policy),
    }),
    [evaluated, setEvaluated] = useState(false);
  const counts = {
    UPDATE: 180,
    SELECT: 4800,
    DELETE: 20,
    LOGIN: 140,
    PERMISSION: 10,
    FAILED: 50,
  };
  const events = operations.reduce(
    (n, op) => n + (policy[op] ? counts[op] : 0),
    0,
  );
  const mb = (events * 30 * 600) / 1000000;
  const cost = (mb / 1000) * 0.02;
  const submitted = !room.host && room.me?.policyDone;
  return (
    <div className="two-column">
      <section className="card">
        <CardHeading
          icon={<SlidersHorizontal />}
          title="¿Qué merece quedar registrado?"
          text="Diseña una política de auditoría y observa sus consecuencias."
        />
        <div className="policy-options">
          {operations.map((op, i) => (
            <div key={op}>
              <span className="feature-icon blue">
                {i % 2 ? <Eye size={18} /> : <ShieldCheck size={18} />}
              </span>
              <div>
                <strong>{operationNames[op]}</strong>
                <small>
                  {op} · {counts[op].toLocaleString("es-PE")} eventos/día
                  estimados
                </small>
              </div>
              <button
                role="switch"
                aria-checked={policy[op]}
                aria-label={operationNames[op]}
                className={"switch " + (policy[op] ? "on" : "")}
                disabled={!!submitted || room.paused}
                onClick={() => {
                  setPolicy({ ...policy, [op]: !policy[op] });
                  setEvaluated(false);
                }}
              >
                <span />
              </button>
            </div>
          ))}
        </div>
        <Button
          className="full"
          disabled={busy || room.paused || !!submitted}
          onClick={async () => {
            if (await act({ type: "policy", policy })) setEvaluated(true);
          }}
        >
          {submitted
            ? "Política entregada"
            : room.host
              ? "Aplicar política a la sala"
              : "Evaluar y entregar política"}
          <ArrowRight size={17} />
        </Button>
      </section>
      <section className="card impact-card">
        <Badge kind="mint">MENOS RUIDO, MÁS CONTEXTO</Badge>
        <h2 className="section-title">El costo de dejar un rastro</h2>
        <p className="muted">
          Estimación didáctica; no representa una tarifa comercial.
        </p>
        <div className="impact-stat">
          <Activity />
          <div>
            <small>Eventos registrados por día</small>
            <strong>{events.toLocaleString("es-PE")}</strong>
          </div>
        </div>
        <div className="impact-stat">
          <Database />
          <div>
            <small>Almacenamiento al mes</small>
            <strong>
              {mb.toFixed(1)} <span>MB</span>
            </strong>
          </div>
        </div>
        <div className="impact-stat">
          <SlidersHorizontal />
          <div>
            <small>Costo de almacenamiento de referencia</small>
            <strong>
              US$ {cost.toFixed(4)}
              <span> / mes</span>
            </strong>
          </div>
        </div>
        <p className="footnote">
          Supuestos: 600 bytes por evento, 30 días y US$ 0.02/GB-mes. No incluye
          índices, copias, consultas ni infraestructura.
        </p>
        {evaluated || submitted ? (
          <div className={"tip " + (!policy.UPDATE ? "warning" : "")}>
            <Lightbulb />
            <span>
              {policy.UPDATE
                ? policy.LOGIN
                  ? "Conservas los cambios y el contexto de acceso. Agrega permisos e intentos fallidos para una investigación más completa."
                  : "Conservas los cambios, pero pierdes contexto de acceso sin LOGIN."
                : "Sin UPDATE pierdes la evidencia directa del cambio. Más registros no siempre significa mejor cobertura."}
            </span>
          </div>
        ) : (
          <div className="tip">
            <Lightbulb />
            <span>
              Registrar todas las consultas aumenta el volumen. ¿Qué eventos
              necesitas para reconstruir este incidente?
            </span>
          </div>
        )}
        {room.host && (
          <p className="muted">
            {room.people.filter((p) => p.policyDone).length} de{" "}
            {room.people.length} políticas entregadas. La política de sala
            afecta eventos nuevos; nunca borra evidencias históricas.
          </p>
        )}
      </section>
    </div>
  );
}
export function Results({ room }: { room: View }) {
  const avg = room.people.length
    ? Math.round(
        room.people.reduce((sum, p) => sum + p.score, 0) / room.people.length,
      )
    : 0;
  const ranking = [...room.people]
    .sort((a, b) => b.score - a.score || a.alias.localeCompare(b.alias))
    .slice(0, 5);
  return (
    <>
      <section className="card result-hero">
        <span className="trophy-circle">
          <Trophy size={48} />
        </span>
        <Badge kind="mint">EXPEDIENTE #024 · RESOLUCIÓN</Badge>
        <h1>¡El rastro cuenta la historia!</h1>
        <p>{room.solution}</p>
        <div className="solution-facts">
          <span>
            <Users size={17} />
            <strong>admin_02</strong> cuenta identificada
          </span>
          <span>
            <Clock3 size={17} />
            <strong>20:11:09</strong> momento del cambio
          </span>
          <span>
            <Database size={17} />
            <strong>UPDATE</strong> evidencia decisiva
          </span>
        </div>
      </section>
      <div className="two-column results-grid">
        <section className="card">
          <h2>Una investigación compartida</h2>
          <div className="participation-summary">
            <div>
              <div className="big-stat">{room.people.length}</div>
              <p>investigadores en el caso</p>
              <Badge kind="blue">
                {
                  room.people.filter(
                    (p) => p.answered === 3 && p.investigated && p.policyDone,
                  ).length
                }{" "}
                completaron las 3 misiones puntuables
              </Badge>
            </div>
            <div className="score-chart">
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={[{ value: avg }, { value: 100 - avg }]}
                    dataKey="value"
                    innerRadius={50}
                    outerRadius={66}
                    startAngle={90}
                    endAngle={-270}
                    stroke="none"
                  >
                    <Cell fill="#499af4" />
                    <Cell fill="#e8f1fc" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <strong>
                {avg}
                <small>/100</small>
              </strong>
            </div>
          </div>
          <p className="footnote">
            Puntuación: preguntas 30 · investigación 50 · política 20. Los
            empates se ordenan por alias.
          </p>
        </section>
        <section className="card">
          <div className="split-heading">
            <h2>Top 5 investigadores</h2>
            <Trophy className="gold" />
          </div>
          {ranking.length ? (
            <div className="ranking">
              {ranking.map((p, i) => (
                <div key={p.id}>
                  <span className={"rank rank-" + i}>{i + 1}</span>
                  <Avatar name={p.alias} index={i} />
                  <strong>{p.alias}</strong>
                  <span>
                    {p.score}
                    <small> pts</small>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <Empty>Aún no hay participantes en esta sala.</Empty>
          )}
        </section>
      </div>
      <div className="tip final-lesson">
        <ShieldCheck />
        <span>
          <strong>Auditar es registrar; trazar es conectar.</strong> La
          atribución a una persona requiere contrastar la cuenta con más
          evidencias. Una buena política conserva el contexto necesario sin
          registrar datos innecesarios.
        </span>
      </div>
    </>
  );
}

import { useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Database,
  Sparkles,
  Eye,
  Pencil,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { Button } from "./ui/button";
import { Badge, Avatar, CardHeading } from "./Common";
import { Audit, type Act } from "./RoomPanels";
import { questions, type View, type Grade } from "../../shared/types";
export function Incident({
  room,
  act,
  busy,
}: {
  room: View;
  act: Act;
  busy: boolean;
}) {
  const [q, setQ] = useState(Math.max(0, questions.findIndex((_,i)=>room.myAnswers[i]===undefined)));
  const [choice, setChoice] = useState<number | null>(null);
  const done = room.myAnswers[q] !== undefined;
  return (
    <div className="two-column">
      <section className="card">
        <Badge kind="amber">EXPEDIENTE #024 · EL INCIDENTE</Badge>
        <h2 className="section-title">Tres notas. Una irregularidad.</h2>
        <p className="muted">
          La revisión académica encontró diferencias entre las actas oficiales y
          las notas del sistema.
        </p>
        <div className="alert-box">
          <AlertTriangle size={23} />
          <span>
            <strong>Se detectaron 3 calificaciones modificadas</strong>
            <br />
            No existe una solicitud de cambio aprobada.
          </span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Asignatura</th>
                <th>Oficial</th>
                <th>Encontrada</th>
              </tr>
            </thead>
            <tbody>
              {room.grades.slice(0, 3).map((g) => (
                <tr key={g.id}>
                  <td>
                    <strong>{g.student}</strong>
                  </td>
                  <td>{g.course}</td>
                  <td>{g.original.toString().padStart(2, "0")}</td>
                  <td>
                    <span className="altered">{g.found}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="tip">
          <Lightbulb />
          <span>
            Una diferencia muestra <strong>qué cambió</strong>. La auditoría
            ayuda a descubrir <strong>cómo, cuándo y desde qué cuenta</strong>.
          </span>
        </div>
      </section>
      <section className="card question-card">
        <div className="question-top">
          <Badge kind="lavender">
            {room.host ? "VOTACIÓN EN VIVO" : "TU PRIMERA MISIÓN"}
          </Badge>
          <span>{q + 1} / 3</span>
        </div>
        <h2>{questions[q].text}</h2>
        {room.host ? (
          <>
            <div className="chart">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={questions[q].options.map((_, i) => ({
                    name: ["A", "B", "C"][i],
                    respuestas: room.votes[q]?.[i] || 0,
                  }))}
                >
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip />
                  <Bar dataKey="respuestas" radius={[7, 7, 0, 0]}>
                    {["#4599f6", "#55c6aa", "#b49be9"].map((c) => (
                      <Cell key={c} fill={c} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="legend-options">
              {questions[q].options.map((o, i) => (
                <p key={o}>
                  <strong>{["A", "B", "C"][i]}.</strong> {o}
                </p>
              ))}
            </div>
            <div className="button-row">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setQ((q + 1) % 3)}
              >
                Otra pregunta
              </Button>
              <Button
                size="sm"
                disabled={busy || room.reveal || room.ended}
                onClick={() => act({ type: "reveal" })}
              >
                Revelar respuestas
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="answer-options">
              {questions[q].options.map((o, i) => (
                <button
                  key={o}
                  disabled={done || room.reveal || room.paused || busy}
                  className={
                    (choice === i ? "chosen " : "") +
                    (room.answers?.[q] === i ? "correct" : "")
                  }
                  onClick={() => setChoice(i)}
                >
                  <span>{["A", "B", "C"][i]}</span>
                  {o}
                  {choice === i && <Check size={16} />}
                </button>
              ))}
            </div>
            {done ? (
              <div className="submitted">
                <CheckCircle2 /> Respuesta registrada
                {q < 2 && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setQ(q + 1);
                      setChoice(null);
                    }}
                  >
                    Continuar <ArrowRight size={15} />
                  </Button>
                )}
              </div>
            ) : (
              <Button
                className="full"
                disabled={choice === null || busy || room.paused || room.reveal}
                onClick={async () => {
                  const result = await act({
                    type: "answer",
                    question: q,
                    answer: choice,
                  });
                  if (result && q < 2) {
                    const next = questions.findIndex((_,i)=>result.myAnswers[i]===undefined);
                    setQ(next === -1 ? q : next);
                    setChoice(null);
                  }
                }}
              >
                Enviar respuesta <ArrowRight size={17} />
              </Button>
            )}
          </>
        )}
        {room.answers && (
          <div className="tip">
            <CheckCircle2 />
            <span>
              <strong>
                Respuesta correcta: {["A", "B", "C"][room.answers[q]]}.
              </strong>
              <br />
              {questions[q].options[room.answers[q]]}. Los registros aportan
              contexto; deben contrastarse con otras evidencias.
            </span>
          </div>
        )}
      </section>
    </div>
  );
}
export function Operations({
  room,
  act,
  busy,
}: {
  room: View;
  act: Act;
  busy: boolean;
}) {
  const [editing, setEditing] = useState<Grade | null>(null),
    [value, setValue] = useState(0),
    [reason, setReason] = useState(""),
    [feedback, setFeedback] = useState("");
  const allowed = ["Docente", "Administrador"].includes(room.me?.role || "");
  return (
    <div className="operations-layout">
      {room.host ? (
        <div className="card operation-intro">
          <span className="feature-icon lavender">
            <Sparkles />
          </span>
          <div>
            <h2>El laboratorio está abierto</h2>
            <p>
              Los estudiantes consultan; docentes y administradores pueden
              modificar notas. Las eliminaciones están bloqueadas para todos.
            </p>
          </div>
          <Button
            className="surprise-button"
            variant="secondary"
            disabled={busy || room.surprise || room.paused}
            onClick={() => act({ type: "surprise" })}
          >
            <Sparkles size={17} />
            {room.surprise
              ? "Incidente activado"
              : "Activar incidente sorpresa"}
          </Button>
        </div>
      ) : (
        <section className="card">
          <CardHeading
            icon={<Database />}
            title="Sistema académico"
            text={"Tu rol: " + room.me?.role + " · opera sobre datos ficticios"}
          />
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Nota actual</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {room.grades.map((g) => (
                  <tr key={g.id}>
                    <td>
                      <strong>{g.student}</strong>
                      <small className="block muted">{g.course}</small>
                    </td>
                    <td>
                      <strong>{g.current}</strong>
                    </td>
                    <td>
                      <div className="button-row">
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={busy || room.paused}
                          onClick={async () => {
                            if (
                              await act({
                                type: "operation",
                                operation: "SELECT",
                                gradeId: g.id,
                              })
                            )
                              setFeedback("Consulta registrada en auditoría.");
                          }}
                        >
                          <Eye size={15} /> Consultar
                        </Button>
                        <Button
                          size="sm"
                          disabled={busy || room.paused}
                          onClick={() => {
                            setEditing(g);
                            setValue(g.current);
                            setReason("");
                          }}
                        >
                          <Pencil size={15} />
                          {allowed ? "Editar" : "Intentar editar"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busy || room.paused}
                          onClick={async () => {
                            if (
                              await act({
                                type: "operation",
                                operation: "DELETE",
                                gradeId: g.id,
                              })
                            )
                              setFeedback(
                                "Eliminación denegada. El intento quedó registrado.",
                              );
                          }}
                        >
                          Intentar eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {feedback && (
            <p role="status" className="inline-feedback">
              {feedback}
            </p>
          )}
          <div className="tip">
            <ShieldCheck />
            <span>
              Prueba una acción y observa su registro. Un permiso de simulación
              nunca concede acceso al panel del expositor.
            </span>
          </div>
        </section>
      )}
      <Audit room={room} />
      {editing && (
        <div className="modal-backdrop">
          <form
            className="card modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-title"
            onSubmit={async (e) => {
              e.preventDefault();
              const result = await act({
                type: "operation",
                operation: "UPDATE",
                gradeId: editing.id,
                value,
                reason,
              });
              if (result) {
                setEditing(null);
                setFeedback(
                  allowed
                    ? "Nota modificada y evento registrado."
                    : "Acción denegada por permisos. El intento quedó registrado.",
                );
              }
            }}
          >
            <div className="split-heading">
              <h2 id="edit-title">Modificar nota</h2>
              <button
                type="button"
                className="icon-button"
                aria-label="Cerrar"
                onClick={() => setEditing(null)}
              >
                <X />
              </button>
            </div>
            <div className="identity-preview">
              <Avatar name={editing.student} />
              <div>
                <strong>{editing.student}</strong>
                <small>
                  {editing.course} · nota actual {editing.current}
                </small>
              </div>
            </div>
            <label>
              Nueva nota
              <input
                autoFocus
                type="number"
                min={0}
                max={20}
                step={1}
                required
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
              />
            </label>
            <label>
              Motivo del cambio
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                minLength={3}
                maxLength={200}
                required
                placeholder="Ej. Revisión de evaluación"
              />
            </label>
            {!allowed && (
              <p className="network-note">
                Tu rol no permite modificar notas. Esta prueba generará un
                intento denegado.
              </p>
            )}
            <Button className="full" disabled={busy || room.paused}>
              Guardar cambio
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

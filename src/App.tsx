import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Users,
  ScanLine,
  FileSearch,
  Database,
  Activity,
  Play,
  Pause,
  ChevronRight,
  Check,
  LogOut,
  RotateCcw,
  Flag,
  AlertTriangle,
  Trophy,
  X,
  CheckCircle2,
  LockKeyhole,
  SlidersHorizontal,
  Wifi,
  WifiOff,
  BookOpen,
  Search,
} from "lucide-react";
import { Button } from "./components/ui/button";
import { Brand, Avatar, Badge } from "./components/Common";
import Campus from "./components/Campus";
import { Access, People, Waiting, Audit } from "./components/RoomPanels";
import { Incident, Operations } from "./components/Missions";
import {
  Investigation,
  PolicyPanel,
  Results,
} from "./components/FinalMissions";
import { useRoom } from "./hooks/useRoom";
import { phases } from "../shared/types";
function App() {
  const api = useRoom();
  const { room, busy, connected, error } = api;
  const [screen, setScreen] = useState<"home" | "join" | "host">(() =>
    new URLSearchParams(location.search).has("sala") ? "join" : "home",
  );
  const [code, setCode] = useState(
      new URLSearchParams(location.search).get("sala") || "",
    ),
    [alias, setAlias] = useState(""),
    [key, setKey] = useState(""), [recoverCode,setRecoverCode]=useState("");
  const [tab, setTab] = useState("actividad"),
    [notice, setNotice] = useState("");
  const [confirm, setConfirm] = useState<"reset" | "end" | null>(null);
  function notify(s: string) {
    setNotice(s);
    setTimeout(() => setNotice(""), 4000);
  }
  async function enter(e: FormEvent) {
    e.preventDefault();
    if (screen === "host") await api.create(key,recoverCode);
    else await api.join(code, alias);
  }
  return (
    <div className="app">
      <header className="topbar">
        <button
          className="brand-button"
          onClick={() => !room && setScreen("home")}
          aria-label="AUDITRACE inicio"
        >
          <Brand />
        </button>
        <div className="header-right">
          {room ? (
            <>
              <span className="connection">
                {connected ? <Wifi size={15} /> : <WifiOff size={15} />}
                <span>{connected ? "En vivo" : "Reconectando"}</span>
              </span>
              <Badge>Sala {room.code}</Badge>
              <button
                className="icon-button"
                title="Salir de esta vista"
                onClick={api.leave}
              >
                <LogOut size={19} />
              </button>
            </>
          ) : (
            <>
              <span className="header-caption">
                Una investigación. Muchas pistas.
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setScreen("host")}
              >
                <LockKeyhole size={15} /> Acceso expositor
              </Button>
            </>
          )}
        </div>
      </header>
      {error && (
        <div className="error-banner" role="alert">
          <AlertTriangle size={18} />
          {error}
          <button aria-label="Cerrar mensaje" onClick={() => api.setError("")}>
            <X size={17} />
          </button>
        </div>
      )}
      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="toast"
            role="status"
          >
            <CheckCircle2 size={19} />
            {notice}
          </motion.div>
        )}
      </AnimatePresence>
      {!room && !api.credential ? (
        screen === "home" ? (
          <main className="landing">
            <div className="hero">
              <div className="hero-copy">
                <Badge kind="mint">
                  <span className="live-dot" /> EXPERIENCIA INTERACTIVA
                </Badge>
                <h1>
                  Las notas cambiaron.
                  <br />
                  <span>
                    La verdad deja
                    <br />
                    un rastro.
                  </span>
                </h1>
                <p className="subtitle">El misterio de las notas alteradas</p>
                <p className="hero-description">
                  Algo no encaja en el campus. Tres calificaciones fueron
                  modificadas fuera del procedimiento autorizado. Sigue las
                  pistas y descubre qué ocurrió.
                </p>
                <div className="hero-actions">
                  <Button onClick={() => setScreen("join")}>
                    Comenzar investigación <ArrowRight size={19} />
                  </Button>
                  <span>
                    <Users size={17} /> Investiga en equipo
                  </span>
                </div>
                <div className="hero-meta">
                  <ShieldCheck size={16} /> Datos ficticios. Aprendizaje real.{" "}
                  <span>01 — 05 misiones</span>
                </div>
              </div>
              <div className="hero-art">
                <Campus />
                <div className="floating-label">
                  <span className="pulse-icon">
                    <Search size={21} />
                  </span>
                  <div>
                    <strong>Hay un caso por resolver</strong>
                    <small>Tu próxima pista está aquí.</small>
                  </div>
                </div>
              </div>
            </div>
            <div className="experience-strip">
              {[
                {
                  Icon: Database,
                  title: "Explora los datos",
                  text: "Un sistema académico simulado.",
                  color: "blue",
                },
                {
                  Icon: Activity,
                  title: "Deja una huella",
                  text: "Cada operación cuenta una historia.",
                  color: "mint",
                },
                {
                  Icon: FileSearch,
                  title: "Conecta las pistas",
                  text: "Reconstruye lo que ocurrió.",
                  color: "lavender",
                },
                {
                  Icon: Trophy,
                  title: "Resuelve el caso",
                  text: "Decide con evidencia y suma puntos.",
                  color: "amber",
                },
              ].map(({ Icon, title, text, color }, i) => (
                <div className="experience-item" key={title}>
                  <span className={"feature-icon " + color}>
                    <Icon size={23} />
                  </span>
                  <div>
                    <small>0{i + 1}</small>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </div>
              ))}
            </div>
            <footer className="landing-footer">
              <span>AUDITORÍA Y TRAZABILIDAD DE BASES DE DATOS</span>
              <span>
                La evidencia es tu mejor argumento <ArrowRight size={14} />
              </span>
            </footer>
          </main>
        ) : (
          <main className="entry-layout">
            <div className="entry-story">
              <Badge kind="mint">EL CASO #024</Badge>
              <h1>
                Tu mirada puede
                <br />
                resolver el misterio.
              </h1>
              <p>
                Una cuenta. Tres notas alteradas.
                <br />Y un rastro que espera ser descubierto.
              </p>
              <Campus />
            </div>
            <section className="card entry-card">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setScreen("home")}
              >
                <ArrowLeft size={16} /> Volver al inicio
              </Button>
              <span className="feature-icon blue">
                {screen === "host" ? <SlidersHorizontal /> : <ScanLine />}
              </span>
              <h2>
                {screen === "host"
                  ? "Prepara la investigación"
                  : "Únete a la investigación"}
              </h2>
              <p className="muted">
                {screen === "host"
                  ? "Crea una sala y guía a tu grupo por las cinco fases."
                  : "Introduce el código del proyector y elige tu alias."}
              </p>
              <form onSubmit={enter}>
                {screen === "host" ? (
                  <><label>
                    Clave del expositor
                    <input
                      type="password"
                      value={key}
                      onChange={(e) => setKey(e.target.value)}
                      placeholder="Clave configurada en el servidor"
                      autoComplete="current-password"
                    />
                  </label><details className="recovery"><summary>Recuperar una sala existente</summary><label>Código de la sala que quieres recuperar<input value={recoverCode} onChange={e=>setRecoverCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,""))} maxLength={6} minLength={6} placeholder="Deja vacío para crear una sala nueva"/></label></details></>
                ) : (
                  <>
                    <label>
                      Código de sala
                      <input
                        value={code}
                        onChange={(e) =>
                          setCode(
                            e.target.value
                              .toUpperCase()
                              .replace(/[^A-Z0-9]/g, ""),
                          )
                        }
                        placeholder="Ej. A3B7C2"
                        maxLength={6}
                        minLength={6}
                        required
                        autoComplete="off"
                        className="code-input"
                      />
                    </label>
                    <label>
                      Tu alias
                      <input
                        value={alias}
                        onChange={(e) => setAlias(e.target.value)}
                        placeholder="¿Cómo te llamamos?"
                        minLength={2}
                        maxLength={24}
                        required
                        autoComplete="nickname"
                      />
                    </label>
                    <div className="identity-preview">
                      <Avatar name={alias || "Tú"} />
                      <div>
                        <strong>
                          {alias || "Tu identidad de investigador"}
                        </strong>
                        <small>El expositor asignará tu rol</small>
                      </div>
                      <ShieldCheck size={19} />
                    </div>
                  </>
                )}
                <Button className="full" disabled={busy}>
                  {busy
                    ? "Conectando…"
                    : screen === "host"
                      ? (recoverCode ? "Recuperar sala" : "Crear sala")
                      : "Entrar a la investigación"}
                  <ArrowRight size={18} />
                </Button>
              </form>
              <p className="footnote">
                <LockKeyhole size={14} /> No necesitas registrarte con correo
                electrónico.
              </p>
            </section>
          </main>
        )
      ) : !room ? (
        <main className="loading">
          <Search className="spin" />
          <h2>Conectando con tu sala…</h2>
          <Button variant="secondary" onClick={api.leave}>
            Volver al inicio
          </Button>
        </main>
      ) : (
        <main className={"workspace " + (!room.host ? "participant" : "")}>
          <div className="workspace-heading">
            <div>
              <div className="eyebrow">
                {room.host
                  ? "CENTRO DE INVESTIGACIÓN"
                  : "TU EXPEDIENTE DE INVESTIGADOR"}{" "}
                <span> / </span> CASO #024
              </div>
              <h1>
                {room.host
                  ? "Panel del expositor"
                  : room.phase === 0
                    ? "¡Ya estás dentro!"
                    : phases[room.phase - 1]}
              </h1>
              <p>
                {room.host ? (
                  "Tú marcas el ritmo. El grupo sigue las pistas."
                ) : (
                  <>
                    {room.me?.alias} <span className="dot-separator">·</span>{" "}
                    {room.me?.role} <span className="dot-separator">·</span>{" "}
                    {room.me?.score}/100 puntos
                  </>
                )}
              </p>
            </div>
            {room.host ? (
              <Button
                variant="secondary"
                size="sm"
                disabled={room.ended}
                onClick={() => setConfirm("end")}
              >
                <Flag size={16} /> Finalizar sesión
              </Button>
            ) : (
              <Avatar name={room.me?.alias || "Tú"} />
            )}
          </div>
          <div className="phase-track" aria-label="Progreso de las fases">
            {phases.map((phase, i) => (
              <div
                className={
                  "phase-step " +
                  (room.phase === i + 1
                    ? "active"
                    : room.phase > i + 1
                      ? "complete"
                      : "")
                }
                key={phase}
              >
                <span>{room.phase > i + 1 ? <Check size={17} /> : i + 1}</span>
                <div>
                  <small>FASE 0{i + 1}</small>
                  <strong>{phase}</strong>
                </div>
                {i < 4 && <ChevronRight size={17} />}
              </div>
            ))}
          </div>
          {room.host && (
            <>
              <div className="control-bar">
                <div className="control-label">
                  <span className="live-dot" />
                  <strong>
                    {room.ended
                      ? "Sesión finalizada"
                      : room.paused
                        ? "Actividad en pausa"
                        : room.phase === 0
                          ? "Sala de espera"
                          : "Fase " + room.phase + " en curso"}
                  </strong>
                  <small>
                    {room.people.filter((p) => p.online).length} conectados
                  </small>
                </div>
                <div className="control-actions">
                  <Button
                    size="sm"
                    disabled={busy || !connected || room.started}
                    onClick={() => api.act({ type: "start" })}
                  >
                    <Play size={15} /> Iniciar
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={
                      busy || !room.started || room.phase >= 5 || room.ended
                    }
                    onClick={() => api.act({ type: "pause" })}
                  >
                    {room.paused ? <Play size={15} /> : <Pause size={15} />}{" "}
                    {room.paused ? "Reanudar" : "Pausar"}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={
                      busy || !room.started || room.phase >= 5 || room.ended
                    }
                    onClick={() => api.act({ type: "next" })}
                  >
                    Siguiente fase <ArrowRight size={15} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    title="Reiniciar simulación"
                    onClick={() => setConfirm("reset")}
                  >
                    <RotateCcw size={16} />
                  </Button>
                </div>
              </div>
              <nav className="tabs" aria-label="Paneles">
                <button
                  className={tab === "actividad" ? "selected" : ""}
                  onClick={() => setTab("actividad")}
                >
                  <BookOpen size={17} /> Actividad actual
                </button>
                <button
                  className={tab === "participantes" ? "selected" : ""}
                  onClick={() => setTab("participantes")}
                >
                  <Users size={17} /> Participantes{" "}
                  <span>{room.people.length}</span>
                </button>
                <button
                  className={tab === "registro" ? "selected" : ""}
                  onClick={() => setTab("registro")}
                >
                  <Activity size={17} /> Registro en vivo
                </button>
                <button
                  className={tab === "acceso" ? "selected" : ""}
                  onClick={() => setTab("acceso")}
                >
                  <ScanLine size={17} /> Acceso QR
                </button>
              </nav>
            </>
          )}
          {room.paused && (
            <div className="pause-banner">
              <Pause size={19} />
              <strong>Una pausa para conectar las ideas.</strong> El expositor
              reanudará la actividad.
            </div>
          )}
          <motion.div className="activity-content" key={room.round + "-" + room.phase} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:.25}}>
            {room.host && tab === "participantes" ? (
              <People room={room} act={api.act} busy={busy} />
            ) : room.host && tab === "registro" ? (
              <Audit room={room} />
            ) : room.host && tab === "acceso" ? (
              <Access room={room} notify={notify} />
            ) : room.phase === 0 ? (
              room.host ? (
                <div className="two-column">
                  <Access room={room} notify={notify} />
                  <section className="card">
                    <h2>El equipo se está formando</h2>
                    <p className="muted">
                      Comparte el QR para que se unan desde sus celulares.
                    </p>
                    <People room={room} act={api.act} busy={busy} compact />
                  </section>
                </div>
              ) : (
                <Waiting room={room} />
              )
            ) : room.phase === 1 ? (
              <Incident room={room} act={api.act} busy={busy || !connected} />
            ) : room.phase === 2 ? (
              <Operations room={room} act={api.act} busy={busy || !connected} />
            ) : room.phase === 3 ? (
              <Investigation
                room={room}
                act={api.act}
                busy={busy || !connected}
              />
            ) : room.phase === 4 ? (
              <PolicyPanel
                room={room}
                act={api.act}
                busy={busy || !connected}
              />
            ) : (
              <Results room={room} />
            )}
          </motion.div>
          <footer className="workspace-footer">
            <span>
              <ShieldCheck size={14} /> Entorno educativo · datos simulados
            </span>
            <span>
              {room.storage} <span className="dot-separator">·</span> Ronda{" "}
              {room.round}
            </span>
          </footer>
        </main>
      )}
      {confirm && (
        <div className="modal-backdrop">
          <section
            className="card modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
          >
            <h2 id="confirm-title">
              {confirm === "reset"
                ? "¿Comenzar una nueva ronda?"
                : "¿Finalizar la investigación?"}
            </h2>
            <p>
              {confirm === "reset"
                ? "Se borrarán las respuestas, puntos y eventos de esta ronda. Los participantes permanecerán en la sala."
                : "Se cerrarán las actividades y se mostrarán los resultados actuales."}
            </p>
            <div className="button-row">
              <Button variant="secondary" onClick={() => setConfirm(null)}>
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  await api.act({ type: confirm });
                  setConfirm(null);
                }}
                disabled={busy}
              >
                Confirmar
              </Button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
export default App;

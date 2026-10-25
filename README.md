# AUDITRACE — El misterio de las notas alteradas

Aplicación educativa en español basada en la referencia proporcionada. Incluye React + Vite + TypeScript, Tailwind CSS, un componente Button con el patrón shadcn/ui (Radix Slot + CVA), Lucide, Motion, Recharts, Express, Socket.IO y Prisma/PostgreSQL.

## Publicación

Aplicación: https://auditrace.onrender.com

Frontend, API y Socket.IO comparten un servicio Node.js gratuito de Render. PostgreSQL reside en Supabase, esquema privado auditrace. Las variables DATABASE_URL y HOST_ACCESS_KEY están configuradas en Render; la dirección del QR se toma de RENDER_EXTERNAL_URL. No se necesitan servicios separados ni configurar una API pública de Supabase.

Para exponer: abre Acceso expositor, introduce la clave privada, crea una sala y comparte el QR. Los estudiantes pueden acceder desde cualquier conexión a internet. El expositor asigna los roles. La sala 50ACA1 quedó preparada para la presentación.

El plan gratuito puede tardar 50 segundos o más en despertar tras inactividad. Abre la página unos minutos antes de la exposición.

## Inicio rápido

Requiere Node.js 22 y npm.

```sh
npm install
npm run db:generate
npm run build
```

Copia .env.example a .env. Para ejecutar la versión compilada, cambia PUBLIC_URL a http://localhost:3001 y configura HOST_ACCESS_KEY. Luego:

```sh
npm start
```

Abre http://localhost:3001. Entra en «Acceso expositor», ingresa la clave configurada y crea una sala. Si no existe HOST_ACCESS_KEY, se permite crear salas sin clave: solo para una prueba local.

En Windows, también puedes ejecutar INICIAR.ps1 después de instalar las dependencias. Detecta Node.js y, si está disponible, el runtime local de Codex. Compila si no existe dist. El proceso ocupa esa terminal; Ctrl+C lo detiene.

Para desarrollo: npm run dev. Vite usa el puerto 5173 y reenvía /api y /socket.io al backend en 3001. Configura PUBLIC_URL para el puerto 5173.

## Participación desde celulares en modo local

1. Conecta equipo y celulares a la misma red.
2. Configura PUBLIC_URL con la IP LAN del equipo, por ejemplo http://192.168.1.10:3001 (o :5173 en desarrollo). Usa la IP real de tu equipo.
3. Reinicia el servidor. El QR se genera con PUBLIC_URL y el código de sala.
4. Permite el puerto elegido en el firewall de tu equipo si la red lo requiere.
5. Para acceso fuera de la red, despliega en un servicio Node.js con HTTPS y WebSockets; configura PUBLIC_URL con la dirección pública.

localhost solo sirve en el mismo equipo. El QR no crea por sí mismo una dirección pública ni un túnel.

## PostgreSQL

Sin DATABASE_URL, la app muestra «Demostración · memoria temporal». Las salas se pierden al detener el servidor. No se simula persistencia.

Con Docker instalado:

```sh
docker compose up -d
```

Descomenta DATABASE_URL en .env y ejecuta:

```sh
npm run db:generate
npm run db:migrate
npm run build
npm start
```

Prisma guarda cada sala como un snapshot JSON atómico en Session: participantes, credenciales, fase, respuestas, notas, política y eventos. El esquema está en prisma/schema.prisma. La presencia online es efímera y se reconstruye al reconectar.

El servidor serializa las mutaciones para evitar doble puntuación y pérdida de actualizaciones. Esta versión está diseñada para UNA instancia Node.js. Para múltiples instancias se necesitarían transacciones/bloqueo entre procesos, almacenamiento compartido de presencia y adaptador Socket.IO.

Se aplicó la migración en Supabase y se verificó el recorrido completo con 12 participantes simulados, tanto localmente como en la URL pública de Render.

## Guion para la exposición

- Crea una sala y comparte el QR. Los participantes ingresan un alias, sin correo.
- Asigna roles desde Participantes. Todos ingresan como Estudiante; solo el expositor puede reasignar. Administrador es un rol de simulación y no otorga control del expositor.
- Fase 1: tres preguntas, 10 puntos cada una. Los gráficos se actualizan en vivo. «Revelar respuestas» cierra la votación para las tres preguntas.
- Fase 2: consultas SELECT y cambios UPDATE con motivo y nota entre 0 y 20. Docente y Administrador pueden editar; los demás generan intentos denegados. DELETE está bloqueado para todos. El incidente sorpresa genera un intento no autorizado preparado.
- Fase 3: orden cronológico (20), cuenta correcta (20), evidencia directa (10). Se entrega una sola vez. Las flechas permiten ordenar en celular y con teclado.
- Fase 4: selección de eventos y estimación inmediata de volumen/costo. UPDATE vale 8; LOGIN 6; PERMISSION y FAILED 3 cada uno. SELECT y DELETE no agregan puntos porque no son indispensables para este caso.
- Fase 5: solución, promedio y top 5. Máximo 100 puntos; empates por alias.
- Pausar bloquea acciones de participantes desde el servidor. Finalizar cierra la sesión y revela resultados. Reiniciar conserva participantes y roles, pero borra los datos de la ronda.
- Auditora principal tiene acceso de investigación de solo lectura y puede responder las misiones. Formula preguntas oralmente durante la exposición; no se implementó un chat ni un editor de preguntas personalizado.

Las evidencias históricas del caso son inmutables y distintas del registro en vivo. Corresponden al 24/10/2026, hora de Lima. La cuenta admin_02 es la cuenta identificada, no una prueba de identidad de una persona.

## Política y auditoría

La política del expositor controla qué eventos nuevos se conservan. La selección de cada participante es independiente y no altera la sala. Los eventos antiguos no se borran al cambiarla.

Se conservan hasta 500 eventos por ronda. Exportación JSON en Registro en vivo. Es una simulación de auditoría, no un log forense inmutable ni un sistema para datos académicos reales.

Estimación didáctica: 600 bytes/evento, 30 días/mes, US$ 0.02/GB-mes; no incluye infraestructura, índices, copias ni consultas. Las cantidades son supuestos explícitos.

## Sesiones y acceso

Credenciales aleatorias por expositor y participante; no viajan en el QR ni en el estado público. El navegador las conserva en sessionStorage: una pestaña diferente permite probar otro participante. Recargar conserva el acceso; «Salir» lo elimina en esa pestaña. Para recuperar una sala en otro navegador, usa «Recuperar una sala existente» con el código y la clave del expositor. Se revoca la credencial anterior.

Máximo 200 participantes por sala. Se rechazan alias duplicados y acciones fuera de fase. El servidor calcula las puntuaciones; no acepta valores de puntos del cliente.

La publicación usa HTTPS, clave de expositor, PostgreSQL y control de origen HTTP/Socket.IO. Los tokens de sesión se almacenan como hashes SHA-256. No hay limpieza automática de salas ni caducidad de credenciales; la retención se administra en la base. El límite HTTP distingue credenciales de participantes y usa IP antes de autenticar. No se han contratado copias de seguridad de pago.

## Estructura

- src/components: pantallas, ilustración SVG y controles.
- src/hooks/useRoom.ts: conexión, credenciales y comunicación.
- shared/types.ts: tipos y contenido compartido.
- server/index.ts: API, autorización, reglas y Socket.IO.
- server/store.ts: almacenamiento y evidencias del caso.
- prisma/schema.prisma: modelo PostgreSQL.
- tests/integration.test.ts: recorrido multijugador automatizado.
- dist: versión compilada, servida por Express.

## Validaciones realizadas

- TypeScript sin errores.
- Build de producción Vite.
- Prueba integrada con dos participantes: claves, alias, autorización, WebSockets, pausa, duplicados concurrentes, modificación autorizada/denegada, rangos de notas, orden, puntuación, cierre y reinicio.
- Revisión visual en navegador a 1440 px y 390 px; creación de sala, QR e ingreso y envío de respuesta desde la vista móvil.

## Alcance de esta entrega

El prompt recibido termina en «Registrar el punt…». Las fases 2 a 5 se completaron interpretando la imagen y los objetivos anteriores. No hay integración con un sistema académico real. La versión pública está desplegada en Render. La estética, la ilustración y los componentes se construyeron de forma independiente; la imagen de referencia no se usó como fondo.

## Prueba pública final

El 25/10/2026 se ejecutó tests/deployed-smoke.ts contra https://auditrace.onrender.com: 12 participantes, cinco fases, puntuación 100/100, PostgreSQL, WebSocket, permisos, recuperación y CORS correctos. Prueba sintética; no sustituye una prueba de la red física del auditorio.

```sh
TEST_BASE_URL=https://auditrace.onrender.com node --import tsx tests/deployed-smoke.ts
```

La prueba necesita HOST_ACCESS_KEY en el entorno o en .env; nunca subir .env al repositorio.

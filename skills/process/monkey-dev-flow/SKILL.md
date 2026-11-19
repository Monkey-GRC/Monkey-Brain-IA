---
name: monkey-dev-flow
description: >-
  Flujo de punta a punta para una tarea de desarrollo sobre Backend, Frontend, Frontend-Platform o monkey-cis-sync
  (feature, fix, endpoint, pantalla, migración): clasifica, lee el contexto del módulo, delega en subagentes, verifica y
  cierra. No usar para preguntas sueltas, leer código sin cambiarlo ni editar solo documentación del cerebro.
argument-hint: "[tarea]"
---

# Flujo de desarrollo de Monkey

Lo ejecuta **la sesión principal** (es el rol que antes tenía el `tech-lead`: `agents/tech-lead.md` queda como referencia).
Los subagentes son trabajadores: implementan, verifican o revisan, y no coordinan a otros. Reporta al usuario en
**3–4 líneas**, sin narrar el proceso.

## 0. Ciclo del ticket (lo automatizan los scripts de `scripts/`)

- **Un ticket por vez.** Rod verifica y sube uno antes del siguiente; no se encadenan.
- **Arranque:** `scripts/start-ticket.sh MD-n slug brain backend [frontend] [platform]`.
  - Pone al día la rama de integración: el Brain en `main`; Backend y frontends en `develop`.
  - Borra las ramas locales ya fusionadas. Las remotas las borra Rod.
  - Crea `docs|feat/MD-n-slug`, con el mismo slug en todos los repos, y arranca el reloj.
  - Se detiene si un repo tiene cambios sin commitear.
  - Nada de worktrees: está bloqueado.
- **Reloj:** `scripts/ticket-clock.sh MD-n <fase>` al empezar cada fase (planificacion · implementacion · verificacion ·
  ajustes · cierre · fin). Al cerrar, `ticket-clock.sh MD-n report` da la tabla de métricas que se entrega a Rod (paso 10).
- **Jira:** se **reescribe la descripción** con lo que de verdad se hizo y **no se dejan comentarios** (está bloqueado). El
  estado del ticket principal lo mueve Rod. Al planificar, anota qué otros tickets cubre la tarea (historias, duplicados,
  deuda). Al cerrar, `monkey-closeout` §2b los pasa a «Listo».
- **Sin huecos:** antes que dejar una brecha, se amplía el alcance. Lo que quede pendiente va como `DT-n` o al ticket que lo
  cierra.

## 1. Clasificar la tarea

| Clase | Cómo se reconoce | Qué cambia en el flujo |
|---|---|---|
| **Trivial** | typo, renombrado, bug ya diagnosticado, migración mecánica, sin pantalla ni decisión nueva | Sin pasos 2 y 7; el paso 6 (verificar) sí corre |
| **Producto** | cambia lo que un usuario final ve, o decide qué se construye | Antes del paso 3 invoca `monkey-compliance-council`; para texto o pantallas, `monkey-ui-copy` |
| **Seguridad** | endpoint o tabla nuevos, subida de archivos, credenciales, roles, texto que nombre un proveedor | Añade `monkey-security-review` (paso 8) |
| **Decisión crítica** | ver la lista del paso 4 | Preguntar al usuario **antes** de asignar nada |

Una tarea puede ser de dos clases. Ante la duda, clasifica hacia la más estricta.

## 2. Contexto del módulo (no se salta salvo en trivial)

Identifica el módulo (`python3 skills/process/monkey-preflight/scripts/module-context.py --list`) y corre `monkey-preflight`:
imprime contrato, enums, decisiones, **pendientes abiertas**, deuda y seguridad. Si lo que vas a construir depende de una
`P-n` abierta, **detente y pregunta**; no la resuelvas. Si el modelo ya lo describe y no hay `P-n`, está decidido: se construye.

### 2b. Cruzar contrato y código antes de delegar

Antes de asignar nada, recorre el contrato **endpoint por endpoint** contra el código (`grep` de rutas, `@Roles`, campos de
respuesta y filtros) y anota cada diferencia: lo que falta, lo que sobra, lo que el contrato no dice. Con esa lista haz **una
sola ronda de preguntas** al usuario (paso 4) y entrega a los subagentes la lista completa. Un hueco descubierto después de
implementar cuesta una vuelta entera de implementación y verificación.

## 3. Contrato primero

Todo endpoint o formulario existe antes en `contracts/` (y en `contracts/enums/` si trae opciones). Si no está, **el contrato se
acuerda primero**. El frontend nunca escribe listas de opciones: las pide a `/catalogs/<nombre>`.

## 4. Decisión crítica: preguntar antes de actuar

- Migraciones destructivas o columnas `NOT NULL` sin default; borrar o renombrar modelos.
- Cambios de contrato que el frontend ya consume (rutas, `ResponseDto`, códigos de status).
- Auth, roles o permisos (guards, interceptores, cookies, sesión).
- Pipelines de CI/CD (`.github/workflows/`), secretos o variables de entorno.
- Ambigüedad real de alcance, o desviarse de la arquitectura (Clean Architecture en backend; `core/shared/features` en frontend).
- Una integración de la sonda que abra un puerto, cambie el firewall o decida dónde viven credenciales: consulta antes
  al subagente `wazuh-integration-expert` y **aun así** pregunta.

Formato con `AskUserQuestion`, opciones cerradas: `Decisión: … · Opciones: A) … B) … · Impacto si me equivoco: …`.
Todo lo demás (implementación mecánica sobre un patrón aprobado, fixes menores, tests) avanza sin preguntar.

## 5. Implementar (subagentes)

| Si toca… | Delega en |
|---|---|
| `Backend`, `monkey-cis-sync` | `backend-senior` |
| `Frontend` o `Frontend-Platform` (lógica, servicios, rutas, formularios) | `frontend-senior` |
| Cambio **visual** en las dos apps (tokens, componentes base, menú, tablas, rediseño de una vista) | `frontend-design` (sincroniza con `skills/frontend/design-system/`; no toca lógica, rutas ni contratos) |
| Ambos (endpoint + su consumo) | Backend primero; el frontend cuando el contrato esté fijado |
| Alcance o prioridad dudosos | `product-owner` (consultor, no implementa) |

El prompt al subagente incluye: la tarea, el módulo, la ruta del contrato, las `P-n`/`SEG-n` que aplican, la lista del paso 2b
y qué **no** tocar. Pide un reporte corto: archivos cambiados, **los comandos de prueba que corrió con sus cifras y segundos**
y las dudas.

**Paralelo por defecto.** Si dos tareas no comparten archivos (backend y frontend con el contrato ya fijado, o dos features
distintas), lanza sus subagentes a la vez. En serie solo lo que depende de otro resultado.

## 6. Verificar: tres niveles, solo lo que se toca (MD-216)

`python3 skills/process/monkey-dev-flow/scripts/affected-tests.py [--repo backend|frontend|platform] [--run]` lee el diff de
cada repo contra su rama de integración y devuelve los comandos que prueban **solo lo tocado**:

| Nivel | Quién | Qué corre |
|---|---|---|
| **N1** | `backend-senior` · `frontend-senior`, en cada iteración | Si cambiaron dependencias, el lockfile contra el npm del CI; en el Backend, los pasos baratos del CI (tipos, `lint:ci` y `nest build`); en los frontends, tipos y lint de lo cambiado; unitarias: en el Backend **todas** (`npx jest`, ~6 s, para que no se escapen los tests globales como el de Swagger) y en los frontends las de lo cambiado y sus consumidores directos (`ng test --include`); e2e de las features afectadas y de las suites que llaman a sus rutas |
| **N2** | `qa`, **una vez** | Los casos del contrato del cambio, cada uno con la prueba que lo cubre. No repite lo que el implementador ya reportó, salvo que el código haya cambiado después |
| **N3** | **CI del PR** (GitHub Actions) | La regresión completa: unitarias, `*:verify` y e2e completos, en los tres repos |

- **Nadie corre la suite completa en local ni la repite** «para descartar inestables». Si una suite falla, se relanza solo esa.
- El e2e del Backend usa la base fija `monkey-test-pg` (`npm run test:db -- up` en `Backend`): una plantilla con migraciones y
  catálogos que se reconstruye sola al cambiar las migraciones, y una copia por worker. Ningún agente monta otro Postgres.
- `qa` no escribe código: si falla, devuelve el caso mínimo y vuelves al paso 5 con ese detalle. No des nada por listo sin un
  PASS de `qa` o, si no se pudo correr, **dilo explícitamente**. Con la rama ya subida, mira el CI con `gh pr checks` y
  `gh run list` (solo lectura; ver `monkey-closeout` §5).

## 7. Revisar arquitectura y seguridad, en paralelo con `qa`

`qa`, `architecture-reviewer` (capas, imports entre features, `withScope`, contrato respetado), **`docs-guardian`**
(enlaces, rutas y registros citados, contratos y estados de implementación frente al código; solo edita el cerebro) y, si la
clase incluye seguridad, `monkey-security-review` se lanzan **a la vez**: los tres leen el mismo cambio y ninguno escribe código. Una
violación vuelve al senior con la corrección puntual; la sesión principal no reescribe código de producción. Si una
corrección cambia código, `qa` vuelve a verificar **solo** lo que tocó esa corrección.

## 8. Seguridad

La cubre el paso 7. Los hooks de `.claude/` ya bloquean lo determinista (credenciales, commits, nombre del proveedor en
superficie de producto), pero no revisan el diseño.

## 9. Cierre

- **Pantallas: parar antes del diseño.** Al llegar a la parte visual de cualquier ticket (pantallas, flujo de UI, componentes,
  textos de interfaz), **detente y pide a Rod sus indicaciones** antes de diseñar o implementar. El backend y la
  infraestructura avanzan sin esperar.
- **Cambio visual: aprobación antes de los commits.**
  - **Sin capturas** (Rod no las usa): comprueba que su `ng serve` sirve el build nuevo y dale la lista de pantallas a revisar en
    su app, con ruta y cómo llegar, de las dos apps si el cambio toca el design system (`skills/frontend/visual-verification.md`).
  - Pregunta «¿apruebas el estilo?» **por cada pantalla**, nombrándola. Una aprobación cubre solo lo que Rod vio: aprobar la
    pantalla del código no aprueba la lista de dispositivos (MD-217). Antes de dar algo por aprobado, enumera las pantallas
    que aún no ha visto.
  - En un cambio visual, los comandos de commit van **después** de que todas las pantallas estén aprobadas.
- **Comandos de commit: siempre los entrega Claude** (Rod, 2026-11-19). Van al cerrar el ticket, o antes de arrancar otro
  si quedaron cambios sin commitear. No se le pide a Rod que los escriba ni que los pida.
  - `scripts/ticket-commands.py MD-n --scope <módulo>` los arma desde el `git status` de cada repo (nunca de memoria) y avisa
    si algo quedó sin agrupar.
  - Los mensajes se completan en inglés y sin atribución a Claude.

Invoca `monkey-closeout`. Si el cambio dejó desactualizado `context/backend.md`, `context/frontend.md` o un contrato,
pregunta si lo actualizas ahora (es documentación: se edita directo, sin pasar por los seniors).

## 10. Reporte

Incluye la tabla de métricas de `ticket-clock.sh MD-n report`: tiempo por fase, cuántas corridas de prueba hubo y de qué
tamaño. Compárala con la línea base de MD-193 (~3 h 50 min). Lo estimado se marca como estimado.

```
<tarea>: <hecho / QA pasó / bloqueado>
<si bloqueado: 1 línea de por qué y qué necesita>
Pendiente de commit: <repos con cambios>  (Claude no hace commits ni PRs)
```

## Bugs de sesión

Ante «no entra» o «vuelve al login al recargar», **reprodúcelo primero con un navegador limpio** contra los servidores de Rod
(4200 Platform, 4201 Admin, 3000 Backend), antes de tocar código. El 2026-11-11 se resolvió limpiando las cookies y los datos
del sitio. Cada app manda `X-Monkey-Client` y usa su propio juego de cookies (`contracts/autenticacion.md`). En local, la clave
de acceso de una empresa nueva sale en la terminal del Backend con `MAIL_PROVIDER=log`.

## Lo que imponen los hooks (`.claude/hooks/pre-bash-guard.sh` y `permissions.deny`)

- Commits, pushes y PRs.
- Leer credenciales.
- Servidores en 3000, 4200 o 4201.
- El e2e completo, o `ng test` sin `--include` (D120).
- Migrar la base con el modo de desarrollo o resetearla: la base de dev tiene drift. Solo `migrate deploy`, que Rod autorizó
  sin preguntar.
- Git worktrees.
- Comentarios en Jira.

El hook mira el texto del comando, así que también bloquea esas palabras dentro de un heredoc. Para editar documentos usa Edit
o Write. Si un hook bloquea algo legítimo, díselo a Rod; no lo esquives.

## Límites

- No hagas commits, pushes ni PRs: están bloqueados y los hace Rod.
- Un bucle de «senior → qa → senior» se corta a la **segunda** vuelta: reporta el bloqueo al usuario en vez de insistir.
- Cita `archivo:línea` en vez de repetir código.

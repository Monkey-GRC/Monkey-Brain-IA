# Monkey — cerebro de producto y entorno de desarrollo

Claude Code se abre **siempre desde este repo** (`Monkey-Brain-IA`). `Backend`, `Frontend`, `Frontend-Platform` y `monkey-cis-sync`
son carpetas hermanas, accesibles por `permissions.additionalDirectories` de `.claude/settings.json`; **no tienen `CLAUDE.md`
propio**. Si una tarea no parte de aquí, avísalo en vez de seguir sin este contexto.

Los archivos cambian: no decidas de memoria ni repitas el resumen de una conversación anterior. Lee solo lo que la tarea necesita.

## Cómo se trabaja

- **Toda tarea de desarrollo** (feature, fix, endpoint, pantalla, migración) entra por la skill `monkey-dev-flow` (`/monkey-dev`):
  clasifica, lee el contexto del módulo, delega en subagentes, verifica y cierra.
- **Antes de decidir qué construir o cómo diseñarlo** (producto, arquitectura, modelo de datos, prioridad) usa
  `monkey-compliance-council`. Para texto o pantallas que verá un usuario final, `monkey-ui-copy`.
- **Una tarea trivial** (typo, renombrado, bug ya diagnosticado, migración mecánica, sin pantalla ni decisión nueva) no necesita
  el flujo completo ni releer las skills; igual se verifica.
- **Se prueba solo lo que se toca** (MD-216): `skills/process/monkey-dev-flow/scripts/affected-tests.py` da las unitarias y la
  integración de lo cambiado. La suite completa la corre el CI del PR; nadie la corre ni la repite en local.
- **Ciclo del ticket automatizado** (`monkey-dev-flow` §0): `start-ticket.sh` (ramas), `ticket-clock.sh` (métricas por fase) y
  `ticket-commands.py` (los `git add`/`git commit` desde `git status`). Ante la UI, **parar y pedir indicaciones a Rod**; en un
  cambio visual, capturas y su aprobación antes de los commits. Lo determinista lo imponen los hooks.
- **Claude no hace commits, pushes ni PRs** (bloqueado en `permissions.deny` y por hook). Deja los cambios sin commitear y di qué repos tienen cambios.

## Precedencia (si dos fuentes se contradicen)

1. `assets/` (documentos del comité: blueprint, matriz de controles, desglose SOC 2). Los `.md` de `references/` solo los transcriben: si difieren, gana el documento y el `.md` se corrige.
2. `contracts/` y `references/datos/modelo/`. En las **opciones** de un enum gana el Excel del comité; en el **nombre** de un campo, el modelo.
3. El código existente. Que algo ya exista no es argumento para conservarlo si el comité propuso otra cosa.

Si aplicando esto el conflicto sigue sin resolverse, **pregunta**: no elijas en silencio.

## Reglas que no se rompen

Cada una con su porqué y su límite.

1. **No nombrar al proveedor de la sonda ni del motor de nube** ante el cliente final: se dice «sonda», «capacidad automática» o «evaluación
   automática». *Porqué:* es información confidencial del producto. *Límite:* aplica a pantallas, correos, notificaciones, reportes, contratos
   y texto de IA; los documentos internos (`motores/`, el runner, el panel `Frontend`) sí los nombran. Lo comprueba un hook.
2. **No leer, copiar ni citar credenciales** (`.env`, `runner.env`, `*credentials*.json`, `conexion_api_*`, `*.pem`). *Porqué:* un secreto en el
   contexto o en un repo ya está filtrado. *Límite:* `.env.example` sí se lee. Lo bloquean `permissions.deny` y un hook.
3. **La IA no certifica cumplimiento** ni presenta una inferencia como hecho verificado; etiqueta lo que ella generó. *Porqué:* la certificación
   es de una persona. *Límite:* puede sugerir y dejar una evidencia en revisión; solo una persona la valida.
4. **El control es atómico e independiente del marco, y el cumplimiento se deriva, no se guarda.** Se vincula a requisitos; el avance (%) informa,
   el estado decide, y lo pendiente no cuenta como cumplido (`modelo-datos.md` §9). *Porqué:* agregar un marco sin reconstruir nada.
5. **Una pregunta abierta (`P-n`) no se resuelve por cuenta propia: se pregunta.** *Porqué:* solo el comité decide. *Límite:* lo que está en el
   modelo y no tiene `P-n` está decidido y se construye.
6. **El contrato va antes que el código:** todo endpoint o formulario existe primero en `contracts/`.
7. **Nada está terminado sin el cierre** (`monkey-closeout`): contrato, `D/P/DT/SEG`, enums y documentos afectados, en el mismo cambio.

## Producto, en tres líneas (el detalle: `monkey-ui-copy` y `producto/philosophy.md`)

- Lenguaje de GRC y **códigos siempre visibles** (`CC6.1`), cada uno explicado: en qué falla, qué impacto tiene, qué hacer.
- **Estado y porcentaje juntos, con la cobertura al lado.** Nunca un porcentaje solo ni uno de «toda la empresa»: la unidad es servicio × marco.
- La vista técnica es de `auditor` y `admin_empresa`; el `funcional` ve la vista de negocio.

## Qué leer según la tarea

Rutas relativas a `skills/product/monkey-compliance-council/references/`. El ruteo completo está en la skill del Consejo, sección «Cómo operar».

| Si vas a… | Lee |
|---|---|
| Saber qué existe de un módulo | `monkey-preflight <módulo>` y `arquitectura/README.md` (índice numerado) |
| Tocar el schema o una entidad | `datos/modelo-datos.md` y solo el módulo que toques en `datos/modelo/` |
| Tocar un cálculo o pantalla de cumplimiento | `datos/modelo/09-calculo-cumplimiento.md` (§9) |
| Tocar una migración, RLS, roles o `.env` | `datos/schema-implementacion.md` |
| Diseñar texto o pantalla de usuario final | `producto/philosophy.md` y la skill `monkey-ui-copy` |
| Decidir qué se construye ahora o después | `producto/mvp-roadmap.md` |
| Tocar el onboarding | `arquitectura/onboarding/README.md` |
| Entender el recorrido de un cliente | `producto/flujo-end-to-end.md` |
| Saber qué exige un marco | `arquitectura/catalogo-maestro/marcos/<marco>.md` (no inventes citas ni cifras) |
| Integrar la sonda o el motor de nube | `arquitectura/control-tecnico/motores/README.md` |
| Tocar integraciones (catálogo, GitHub, Jira, conectores) | `arquitectura/integraciones/README.md` y `contracts/integraciones.md` |
| Revisar seguridad | `seguridad/README.md` y la skill `monkey-security-review` |
| Depender de una pregunta abierta | `datos/pendientes/README.md` |
| Usar un atajo o parche | regístralo con `monkey-registry` (`DT-n`); si cierras uno, bórralo |
| Reabrir algo cerrado | `datos/decisiones/README.md`; se consulta para reabrir, no para construir |
| Resolver un desacuerdo de diseño | `producto/council.md` |
| Arquitectura, motores, stack | `arquitectura/architecture.md` |

Fuera de `references/`:

- **Endpoint o formulario → `contracts/` primero.** `contracts/conventions.md` (sobre de respuesta, errores, i18n, fechas, paginación),
  `contracts/enums.md` (índice; los valores viven en `contracts/enums/<módulo>.md`; el frontend nunca hardcodea listas) y
  `contracts/<módulo>.md` o `contracts/<módulo>/<componente>.md`. Si no está ahí, el contrato se acuerda primero.
- **Trabajo de un repo concreto** → `skills/backend/`, `skills/frontend/` (capas, i18n, standalone, path aliases) y `context/backend.md` o
  `context/frontend.md` (el código tal como está, no el diseño objetivo).
- **Cambio visual** (aspecto, tokens, componentes base, menú lateral, tablas) → `skills/frontend/design-system/README.md`: es la fuente única de
  los dos frontends, que deben verse idénticos. Lo ejecuta el subagente `frontend-design`, que sincroniza con `scripts/sync-design-system.sh`.
- **Reglas de mantenimiento de este repo** → `STANDARD.md`. Estado del proyecto (reconstrucción) → `producto/mvp-roadmap.md`.

## Automatización (`.claude/`)

Permisos y hooks están en `.claude/settings.json`; los scripts, en `.claude/hooks/` y en `skills/*/*/scripts/`. Subagentes:
`backend-senior`, `frontend-senior`, `frontend-design`, `qa`, `architecture-reviewer`, `product-owner`, `wazuh-integration-expert`. Para comprobar qué
se cargó en una sesión, `/memory` y `/status`.

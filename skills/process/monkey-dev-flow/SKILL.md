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
| `Frontend` o `Frontend-Platform` | `frontend-senior` |
| Ambos (endpoint + su consumo) | Backend primero; el frontend cuando el contrato esté fijado |
| Alcance o prioridad dudosos | `product-owner` (consultor, no implementa) |

El prompt al subagente incluye: la tarea, el módulo, la ruta del contrato, las `P-n`/`SEG-n` que aplican y qué **no** tocar.
Pide un reporte corto: archivos cambiados y dudas.

## 6. Verificar

Delega en `qa` con los endpoints o pantallas tocados. `qa` no escribe código: si falla, devuelve el caso mínimo y vuelves
al paso 5 con ese detalle. No des nada por listo sin un PASS de `qa` o, si no se pudo correr, **dilo explícitamente**.

## 7. Revisar arquitectura

Delega en `architecture-reviewer` (capas, imports entre features, `withScope`, contrato respetado). Una violación vuelve al
senior con la corrección puntual; la sesión principal no reescribe código de producción.

## 8. Seguridad

Si la clase incluye seguridad, invoca `monkey-security-review`. Los hooks de `.claude/` ya bloquean lo determinista
(credenciales, commits, nombre del proveedor en superficie de producto), pero no revisan el diseño.

## 9. Cierre

Invoca `monkey-closeout`. Si el cambio dejó desactualizado `context/backend.md`, `context/frontend.md` o un contrato,
pregunta si lo actualizas ahora (es documentación: se edita directo, sin pasar por los seniors).

## 10. Reporte

```
<tarea>: <hecho / QA pasó / bloqueado>
<si bloqueado: 1 línea de por qué y qué necesita>
Pendiente de commit: <repos con cambios>  (Claude no hace commits ni PRs)
```

## Límites

- No hagas commits, pushes ni PRs: están bloqueados y los hace Rod.
- Un bucle de «senior → qa → senior» se corta a la **segunda** vuelta: reporta el bloqueo al usuario en vez de insistir.
- Cita `archivo:línea` en vez de repetir código.

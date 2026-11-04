# Requisitos de seguridad — el registro

Aquí vive **el registro** de lo que Monkey debe cumplir en seguridad, con una ficha por requisito repartida **por módulo**, con **de dónde sale** cada requisito,
**cómo se hace cumplir** y **cómo se comprueba**. Existe porque estos requisitos estaban repartidos (`modelo-datos.md`
§4.3 y §5.3, D41, `schema-implementacion.md` §5 y §9, `deuda-tecnica/README.md`) y nadie podía responder, de un vistazo,
*«¿esto está protegido y cómo lo sabemos?»*.

**Cómo se distingue de los otros documentos**

| Documento | Qué guarda |
|---|---|
| **esta carpeta** (`<módulo>.md`) | El **requisito** (qué debe ser verdad), su fuente, su estado real y su verificación |
| `modelo-datos.md` §5.3 | La política de seguridad **del comité** (valores: 30 min, 12 caracteres…). Aquí se enlaza, no se copia |
| `deuda-tecnica/<módulo>.md` | **Parches** de desarrollo (DT-n). Un requisito incumplido apunta a su DT; no al revés |
| `datos/decisiones/README.md` | Por qué se decidió algo (D-n) |
| `datos/pendientes/README.md` | Preguntas que solo el comité puede responder |

**Reglas de uso**

1. **ID estable (`SEG-n`).** Vive en el archivo de su módulo, nunca cambia de número. No se reutilizan ni se renumeran: Jira, un PR o un comentario pueden citarlos.
2. **Todo endpoint, tabla o flujo nuevo se revisa contra esta lista** antes de darse por terminado. Si introduce un
   requisito nuevo, se añade una fila en el mismo PR.
3. **El estado no se declara, se demuestra.** ✅ solo se escribe si hay una **prueba automática** que corre en CI y la
   columna *Verificación* dice cuál. Implementado pero sin prueba es 🟡, aunque «funcione».
4. **Un requisito incumplido no se borra:** se marca 🔴 y apunta a la deuda (`DT-n`) o a la pregunta (`P-n`) que lo cierra.
5. **Fecha de la última revisión de cada estado: 2026-10-07.** Lo marcado 🟡 *no lo comprobé al escribir esto*: lo vi en el
   código o en un documento, pero ninguna prueba lo ejecuta.

**Estados:** ✅ cumplido y verificado por prueba automática · 🟡 implementado, sin prueba automática ·
🟠 parcial · 🔴 no implementado · ⚪ no verificable desde el repo / decisión pendiente

Pruebas citadas: `Backend/test/aislamiento/` (RLS en base de datos: `rls-cobertura`, `rls-comportamiento`; API real:
`http`), `npm run audit:verify`, `catalog:verify`, `clone:verify`. El flujo de CI es `Backend/.github/workflows/ci.yml`.
Las de HTTP de aislamiento ya están en `develop` (PR #18 y #19). **Las de `test/auditoria/` y `test/autenticacion/` están en la rama `feat/audit-in-same-transaction` del Backend: su ✅ es provisional hasta que se mergee.**

---

---

## Dónde está cada requisito

**Un módulo, un archivo.** Son los mismos nombres de módulo que usa [`../arquitectura/`](../arquitectura/README.md) (`STANDARD.md` §2b).

**Un requisito que aplica en varias partes vive una sola vez**, en el módulo que **posee la capacidad**. La subida y la entrega de archivos es de [Plataforma](plataforma.md) aunque la usen el onboarding y las evidencias; el cifrado de credenciales también, aunque las entregue el control técnico. Así hay un `SEG-n` por **capacidad**, no uno por pantalla: si mañana se sube un archivo en un sitio nuevo, ya tiene sus requisitos y no se escribe ninguno nuevo.

| Archivo | Requisitos | Módulo |
|---|--:|---|
| [`aislamiento-tenant.md`](aislamiento-tenant.md) | 9 | [Aislamiento multi-tenant](../arquitectura/aislamiento-tenant/README.md) |
| [`autenticacion.md`](autenticacion.md) | 10 | [Autenticación](../arquitectura/autenticacion/README.md) |
| [`roles-permisos.md`](roles-permisos.md) | 11 | [Roles y permisos](../arquitectura/roles-permisos/README.md) |
| [`gestion-usuarios.md`](gestion-usuarios.md) | 6 | [Gestión de usuarios](../arquitectura/gestion-usuarios/README.md) |
| [`empresas.md`](empresas.md) | 3 | [Empresas](../arquitectura/empresas/README.md) |
| [`onboarding.md`](onboarding.md) | 2 | [Onboarding](../arquitectura/onboarding/README.md) |
| [`control-tecnico.md`](control-tecnico.md) | 10 | [Control técnico](../arquitectura/control-tecnico/README.md) |
| [`trazabilidad.md`](trazabilidad.md) | 8 | [Trazabilidad](../arquitectura/trazabilidad/README.md) |
| [`plataforma.md`](plataforma.md) | 9 | [Plataforma](../arquitectura/plataforma/README.md) |
| [`entrega.md`](entrega.md) | 7 | **ninguno**: CI, despliegue, respaldos y red |

---

## Resumen

**Se recalcula de la columna *Estado*, no se mantiene a mano.** Lo que no está en ✅ es trabajo pendiente. Regla de conteo: **manda el primer estado de la celda**; lo que va en paréntesis (`✅ (índice 🟡)`, `✅ (API keys ⚪)`, `✅ (por rol 🟡)`) es un matiz del requisito, no otro estado. Los estados se revisaron por última vez el 2026-10-07 y los ⚪ incluyen los 5 retirados por D96, que se conservan tachados para no reutilizar su ID.

> La tabla anterior, mantenida a mano, declaraba 34 ✅, 11 🟠 y 9 🔴 sobre 65. Con la regla de arriba salen **37 ✅, 9 🟠 y 8 🔴**: la diferencia son las tres filas con estado matizado (`SEG-05`, `SEG-16`, `SEG-17`). Ningún requisito cambió; cambió quién cuenta.

| Módulo | ✅ | 🟡 | 🟠 | 🔴 | ⚪ | Total |
|---|--:|--:|--:|--:|--:|--:|
| [Aislamiento multi-tenant](aislamiento-tenant.md) | 6 | 1 | 1 | 1 | 0 | **9** |
| [Autenticación](autenticacion.md) | 10 | 0 | 0 | 0 | 0 | **10** |
| [Roles y permisos](roles-permisos.md) | 1 | 0 | 4 | 2 | 4 | **11** |
| [Gestión de usuarios](gestion-usuarios.md) | 0 | 0 | 1 | 5 | 0 | **6** |
| [Empresas](empresas.md) | 1 | 1 | 0 | 0 | 1 | **3** |
| [Onboarding](onboarding.md) | 2 | 0 | 0 | 0 | 0 | **2** |
| [Control técnico](control-tecnico.md) | 3 | 2 | 3 | 2 | 0 | **10** |
| [Trazabilidad](trazabilidad.md) | 6 | 0 | 2 | 0 | 0 | **8** |
| [Plataforma](plataforma.md) | 4 | 2 | 0 | 1 | 2 | **9** |
| [Entrega](entrega.md) | 1 | 2 | 0 | 3 | 1 | **7** |
| **Total** | **34** | **8** | **11** | **14** | **8** | **75** |

---

## Lo que falta

El tablero: todo lo que **no** está ✅, por estado y por módulo. Cada ID se busca dentro del archivo de su módulo.

**🔴 No implementado** (14)

- [Aislamiento multi-tenant](aislamiento-tenant.md): `SEG-09`
- [Roles y permisos](roles-permisos.md): `SEG-22` · `SEG-66`
- [Gestión de usuarios](gestion-usuarios.md): `SEG-72` · `SEG-73` · `SEG-74` · `SEG-75` · `SEG-76`
- [Control técnico](control-tecnico.md): `SEG-26` · `SEG-45`
- [Plataforma](plataforma.md): `SEG-25`
- [Entrega](entrega.md): `SEG-28` · `SEG-31` · `SEG-41`

**🟠 Parcial** (11)

- [Aislamiento multi-tenant](aislamiento-tenant.md): `SEG-07`
- [Roles y permisos](roles-permisos.md): `SEG-21` · `SEG-54` · `SEG-67` · `SEG-70`
- [Gestión de usuarios](gestion-usuarios.md): `SEG-23`
- [Control técnico](control-tecnico.md): `SEG-39` · `SEG-46` · `SEG-47`
- [Trazabilidad](trazabilidad.md): `SEG-35` · `SEG-37`

**🟡 Sin prueba automática** (8)

- [Aislamiento multi-tenant](aislamiento-tenant.md): `SEG-08`
- [Empresas](empresas.md): `SEG-71`
- [Control técnico](control-tecnico.md): `SEG-29` · `SEG-49`
- [Plataforma](plataforma.md): `SEG-19` · `SEG-60`
- [Entrega](entrega.md): `SEG-30` · `SEG-42`

**⚪ No verificable desde el repo, o retirado** (8)

- [Roles y permisos](roles-permisos.md): `SEG-55` · `SEG-56` · `SEG-58` · `SEG-61`
- [Empresas](empresas.md): `SEG-57`
- [Plataforma](plataforma.md): `SEG-32` · `SEG-44`
- [Entrega](entrega.md): `SEG-27`

---

## Dónde vive el resto de la seguridad

El registro dice **qué debe cumplirse y si está comprobado**. El material que lo sostiene (la política del comité,
la decisión, la implementación) vive en su dueño. Primera parada: el archivo de seguridad del módulo; después, esto.

| Tema | Dónde está |
|---|---|
| **Aislamiento entre empresas** (RLS, variables de sesión, funciones previas al tenant) | [`arquitectura/aislamiento-tenant/`](../arquitectura/aislamiento-tenant/README.md) (cómo funciona) · [`datos/modelo/04-monkey-admin.md`](../datos/modelo/04-monkey-admin.md) §4.3 y §4.4 (el porqué) · `datos/schema-implementacion.md` §5 (las políticas) |
| **Identidad, sesión, contraseñas, MFA** | [`arquitectura/autenticacion/`](../arquitectura/autenticacion/README.md) (los flujos) · `datos/modelo/05-usuarios.md` §5.3 (la política del comité) · `contracts/autenticacion.md` |
| **Roles y permisos** | [`arquitectura/roles-permisos/`](../arquitectura/roles-permisos/README.md) (dónde se hace cumplir) · `datos/modelo/05-usuarios.md` §5.1 y §5.5 (los roles y la matriz) · `P3` en [`datos/pendientes/roles-permisos.md`](../datos/pendientes/roles-permisos.md) |
| **Cómo el modelo de usuarios sostiene SOC 2** | `datos/modelo/05-usuarios.md` §5.6 |
| **Secretos y cifrado de credenciales** | [`arquitectura/plataforma/`](../arquitectura/plataforma/README.md) · `datos/schema-implementacion.md` §4 · D46 · [`deuda-tecnica/`](../deuda-tecnica/README.md) DT-5 |
| **Auditoría, inmutabilidad y retención** | [`arquitectura/trazabilidad/`](../arquitectura/trazabilidad/README.md) · D41 · `datos/modelo/07-cumplimiento.md` §7.4 · D72 |
| **Confidencialidad del proveedor del motor** | `CLAUDE.md` · [`producto/philosophy.md`](../producto/philosophy.md) · [`arquitectura/control-tecnico/motores/`](../arquitectura/control-tecnico/motores/README.md) |
| **Principios de arquitectura no negociables** (aislamiento fuerte, eventos inmutables, IA separada del plano de datos, API-first) | [`arquitectura/architecture.md`](../arquitectura/architecture.md) |
| **La IA no certifica ni presenta inferencia como hecho** | [`producto/philosophy.md`](../producto/philosophy.md) |
| **Privacidad y leyes** | [`arquitectura/catalogo-maestro/marcos/`](../arquitectura/catalogo-maestro/marcos/README.md) (GDPR, LGPD, CCPA/CPRA, HIPAA…) y el catálogo de `regulations` |
| **Despliegue, respaldos y migraciones** | [`entrega.md`](entrega.md) (los requisitos) · `datos/schema-implementacion.md` §7, §8 y §13 (cómo se hace) |

---

## Cómo añadir o cambiar un requisito

1. Fila nueva al final de la tabla del **archivo de su módulo** (`STANDARD.md` §2b), con el siguiente `SEG-n` libre. Si no hay archivo para ese módulo, se crea.
2. Fuente obligatoria: un documento del comité, una decisión (D-n) o una deuda. Sin fuente es una opinión, y se marca como tal.
3. Estado según la regla 3. Si se cierra un requisito, se actualiza la fila y se cita la prueba o el PR. Al cambiar un estado, se actualiza también el **Resumen** y el tablero **Lo que falta** del `README.md`, que se derivan de la columna *Estado*.
4. Si el requisito es incumplido y no tiene `DT-n`, se crea la deuda.

## Lo que este registro **no** es

No es una auditoría de seguridad ni un pentest: dice qué está comprobado y qué no, no que lo comprobado sea suficiente.
Tampoco certifica nada ante un auditor externo.

## Aún sin documentar

No se han escrito porque todavía no hay material ni decisión detrás: un **modelo de amenazas**, los **requisitos
legales por país** con su fuente, y un **plan de respuesta a incidentes**. Se crean cuando haya contenido real, no antes.

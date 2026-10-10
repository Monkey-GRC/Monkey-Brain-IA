# Flujo de punta a punta — de la creación del tenant al cumplimiento medido

Recorrido completo de lo que le pasa a una empresa cliente, en orden, con la entidad y
la fuente exacta de cada paso. No repite el detalle campo por campo — para eso están
`modelo-datos.md`, `modulos/onboarding.md` y `modelo-datos-decisiones.md`; este archivo es el
mapa de cómo se encadenan.

> [!warning] ⚠️ Módulos aún no completos
> **Usuarios** (asignación fina de permisos) y **Cumplimiento**
> (edición de riesgos/causas/controles clonados) están documentados en su forma base,
> pero no cerrados en detalle todavía. Donde aparecen abajo, se marca explícitamente qué
> falta.

## 1. Registro del tenant — Monkey Admin

**Monkey Admin** es una aplicación web completa, con dominio propio, distinta de
**Monkey Platform** (la que usa el cliente). Ahí `admin_monkey` llena un formulario de
3 campos para registrar la empresa:

- Nombre o razón social de la empresa
- Check: ¿requiere base de datos dedicada?
- Correo administrativo de la empresa

Al enviar el formulario:

- Queda creado el tenant (`companies`), con `name` e `isolation_strategy`
  (`dedicated` si el check está marcado, `shared` si no). Para el MVP, `shared` es una
  sola base de datos con el catálogo y todos los tenants, aislados por RLS sobre
  `tenant_id` (§4.3, D25). `dedicated` es una réplica completa del esquema, solo para
  ese cliente.
- Se genera una `access_keys` de un solo uso, con expiración.
- La clave se envía **al correo administrativo** que se acaba de capturar — ese correo
  es el destino, no un canal aparte.

**Entidades:** `companies` (con `name`, `isolation_strategy`), `access_keys`.
**Fuente:** `modelo-datos.md` §4, decisiones D24 y D25.

## 2. Primer acceso del cliente

La activación va en **dos pasos** (D51). Con la clave recibida, el cliente entra a **Monkey Platform** ("Activa tu cuenta"):
primero escribe el código y ve de qué empresa es y con qué correo se activa (`redeem/lookup`, no gasta la clave); después fija su
contraseña y crea su cuenta `admin_empresa` **con ese mismo correo administrativo** — con otro correo el canje se rechaza (D43).
No se le pide nombre ni apellido: la cuenta se identifica por el correo. La `access_keys` pasa a `used`: la
clave sirve una sola vez. A partir de aquí el cliente ya está autenticado dentro de su tenant
(access token de 15 min, cierre a los 30 min sin actividad y a las 8 h), y las siguientes veces
entra con correo y contraseña.

**Entidades:** `users`, `sessions`.
**Fuente:** `modelo-datos.md` §5.1-§5.3. (`Auth.md` de la bóveda se cita como fuente
original pero **no está en este repo** — ver `modelo-datos.md` §0.)

## 3. Onboarding — Componente 1: Contexto Organizacional

Una vez por empresa. Diez campos → `organizations`. **El campo "nombre / razón social"
llega precargado y bloqueado**: ya se fijó en el registro del tenant (paso 1) y no se
puede editar aquí. El **cliente** no elige framework a nivel de empresa en este componente: **Monkey Admin
contrata el marco al registrar la empresa** (paso 1, D47) y el cliente lo elige, entre los contratados, al
declarar su servicio (Componente 2).

**Entidad:** `organizations`.
**Fuente:** `modulos/onboarding.md`, Componente 1.

## 4. Onboarding — Componente 2: Contexto del Servicio

Una vez por servicio (repetible). Dieciséis campos, incluida la Descripción del Sistema
(documento AICPA de 10 secciones) → `services` y lo que cuelga de él.

**Al elegir marco aquí, se dispara el paso 5 automáticamente** — no es una acción
manual separada.

**Entidades:** `services`, `service_trust_criteria`, `subservice_organizations`, `service_frameworks`, `system_descriptions`.
**Fuente:** `modulos/onboarding.md`, Componente 2.

## 5. Clonado del catálogo

Al fijarse `service_frameworks` (paso 4), el set de Riesgos y Causas de ese marco se **copia** a
`client_risks` y `client_causes` del servicio (D28): el catálogo queda como plantilla y lo que el
cliente edite solo lo ve él. Los Controles se clonan como `client_controls` (entidad propia: el cliente puede
reescribir su interpretación, crear controles propios y darlos de baja), junto con sus dimensiones
(`client_control_dimensions`), el vínculo a sus tests (`client_control_tests`) y las evidencias requeridas
(`evidence_requirements`, desde `evidence_templates`). Los tests **no se clonan**: se referencian (D36). `requirements` y `points_of_focus`
**no se clonan** — se referencian con FK real desde `client_controls`/`service_frameworks`,
porque son texto de un estándar y viven en la misma base (§3.5, D25).

**Entidades:** `client_controls`, `client_control_dimensions`, `client_control_tests`, `evidence_requirements`, `client_risks`, `client_causes` (copias del cliente; plantillas: `controls`, `evidence_templates`, `risks`, `causes`) · `requirements`,
`points_of_focus` (referenciados, no clonados).
**Fuente:** `modelo-datos.md` §3.5, decisión D23.

## 6. Onboarding — Componente 3: Control Técnico

> **Provisional (D48):** la parte de «conectar» no coincide con cómo funciona la sonda real (el cliente instala un agente y
> Monkey lee lo que el agente reporta; no se entregan credenciales). Se rediseña al responder P12 (DT-31 a DT-36).

El cliente conecta su infraestructura real. Elige escenario de despliegue, y por cada
conexión del catálogo AC-01…AC-06 corre conectar → validar → activar → programar. El
cliente nunca ve el nombre real del motor de monitoreo detrás ("sonda",
"capacidad automática").

El paso se da por hecho con el **escenario y el scope**; conectar sistemas se recomienda pero se puede dejar
para después (D46). Hoy no hay conectores reales: la comprobación es `unavailable` o `simulated` y **nunca se
finge una conexión** (Automatizado ≠ Operativo).

**Entidades:** `assets`, `automated_capabilities`.
**Fuente:** `modulos/onboarding.md`, Componente 3; `wazuh.md`.

## 7. Módulo de Cumplimiento *(no completo)*

Módulo aparte, sin límite de tiempo, **no bloquea nada del resto del producto**. Aquí el
cliente edita lo que ya se clonó en el paso 5: reescribe la interpretación de un
control, ajusta dimensiones, excluye un check, reasigna responsables, y puede
crear/editar/eliminar Riesgos y Causas según su propio entendimiento.

**Lo que falta cerrar:** el detalle de permisos finos dentro del módulo más allá de "es
de `admin_empresa`", y si necesita su propia pantalla o vive dentro de la vista de cada
servicio.

**Entidades:** `client_controls`, `risks`, `causes` (edición).
**Fuente:** decisión D23, confirmada por el comité el 2026-09-26.

## 8. Módulo de Usuarios *(no completo)*

En cualquier momento (no es un paso del onboarding): `admin_empresa` invita más
usuarios, les asigna rol (`funcional`, `consultor` o `auditor`), y si son
`funcional` les asigna qué `client_controls` les toca (`user_control_assignments`). Si
son `auditor`, quedan como usuarios de **su empresa** (solo `admin_empresa` los crea): ven todo el cumplimiento con la vista técnica y escriben observaciones (D63). El `consultor`
no lo crea la empresa: lo crea y asigna `admin_monkey` desde Monkey Admin; la empresa ve los que tiene asignados y puede suspender a uno (D64).

**Lo que falta cerrar:** el detalle de permisos por pantalla (P3).

**Entidades:** `users`, `user_control_assignments`,
`audit_observations` (§7.6).
**Fuente:** `modelo-datos.md` §5. (`Usuarios.md` de la bóveda **no está en este repo**;
lo que el comité entregó sobre usuarios está transcrito en `modelo-datos.md` §5.)

## 9. Medición de cumplimiento

Con Servicio, Scope, catálogo clonado y (opcionalmente) Cumplimiento personalizado, el
motor deriva el cumplimiento por par Servicio × Marco, recorriendo
Requisito → PuntoDeEnfoque → Control, nunca como atributo del marco ni como número de
empresa completa.

**Fuente:** `modelo-datos.md` §9 (D62: se cuenta, no se promedia).

## Resumen visual

```
Monkey Admin (admin_monkey) — dominio propio
        │  form: name, ¿dedicada?, admin_email
        │  crea companies + access_keys → la clave se muestra en la UI
        ▼
Monkey Platform — primer acceso (admin_empresa)
        │
        ▼
Onboarding Componente 1 ──► organizations
        │
        ▼
Onboarding Componente 2 ──► services + service_frameworks
        │                         │
        │                         ▼
        │                 Clonado de catálogo (risks, causes, client_controls)
        ▼
Onboarding Componente 3 ──► assets, automated_capabilities
        │
        ▼
   (a partir de aquí, sin orden obligado, y sin bloquear nada)
        │
        ├──► Módulo Cumplimiento (edita lo clonado)
        └──► Módulo Usuarios (invita, asigna roles y controles)
        │
        ▼
Medición de cumplimiento (Servicio × Marco)
```

# Flujo de punta a punta — de la creación del tenant al cumplimiento medido

Recorrido completo de lo que le pasa a una empresa cliente, en orden, con la entidad y
la fuente exacta de cada paso. No repite el detalle campo por campo — para eso están
`modelo-datos.md`, `arquitectura/onboarding/README.md` y `datos/decisiones/README.md`; este archivo es el
mapa de cómo se encadenan.

**Este archivo es el recorrido desde el producto.** El detalle técnico de cada paso (las piezas que participan, las
tablas que se tocan y las secuencias) está en el módulo que lo implementa: [`../arquitectura/`](../arquitectura/README.md).

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
  es el destino, no un canal aparte. **No se muestra en pantalla** (D99); si el correo no llega,
  `admin_monkey` reenvía una clave nueva desde Monkey Admin.

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
**Fuente:** [`arquitectura/onboarding/contexto-organizacional/`](../arquitectura/onboarding/contexto-organizacional/README.md).

## 4. Contexto del Servicio (antes, Componente 2 del onboarding; desde D89 se hace cuando el cliente quiera)

Una vez por servicio (repetible). Dieciséis campos, incluida la Descripción del Sistema
(documento AICPA de 10 secciones) → `services` y lo que cuelga de él.

**Al elegir marco aquí, se dispara el paso 5 automáticamente** — no es una acción
manual separada.

**Entidades:** `services`, `service_trust_criteria`, `subservice_organizations`, `service_frameworks`, `system_descriptions`.
**Fuente:** [`arquitectura/onboarding/contexto-servicio/`](../arquitectura/onboarding/contexto-servicio/README.md).

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

## 6. Control Técnico (antes, Componente 3 del onboarding; desde D89 va después de evaluar los riesgos del servicio)

> **Cómo se conecta hoy:** la nube (AWS y GCP) con un rol de solo lectura que el cliente crea en su cuenta (D58, D112); un servidor
> Linux o Windows on-premise con un agente de la sonda que el cliente instala con un comando y Monkey lee (D113; no se entregan
> credenciales). Bases de datos, equipos y servidores en la nube siguen bloqueados («próximamente», D67).

El cliente conecta su infraestructura real. Elige la plataforma del catálogo (no declara dónde vive, D92), y por cada
conexión del catálogo AC-01…AC-06 corre conectar → validar → activar → programar. El
cliente nunca ve el nombre real del motor de monitoreo detrás ("sonda",
"capacidad automática").

El paso ya no es del onboarding (D89) y se da por hecho con la primera conexión (D92); conectar sistemas se recomienda pero se puede dejar
para después (D46). La comprobación de la nube es real (la hace el trabajador, `PROBE_MODE=runner`); en los otros modos es `unavailable` o `simulated` y **nunca se
finge una conexión** (Automatizado ≠ Operativo).

**Entidades:** `assets`, `automated_capabilities`.
**Fuente:** [`arquitectura/onboarding/conexion-activos/`](../arquitectura/onboarding/conexion-activos/README.md) y [`arquitectura/control-tecnico/`](../arquitectura/control-tecnico/README.md).

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

En cualquier momento (no es un paso del onboarding): `admin_empresa`, que es el experto en compliance de la empresa (D96), crea a su equipo y les asigna rol: `responsable`, `delegado` o `auditor` (D102). La cuenta nace pendiente y la persona la activa con un código de un solo uso que le llega por correo (`contracts/gestion-usuarios.md`). El cupo de usuarios lo fija Monkey (D103).

- Organiza al equipo en **grupos** y asigna a cada control un **dueño**: un `responsable` (o él mismo). Un control sin dueño queda «Sin asignar». Cada `responsable` lidera un equipo de `delegado` y les asigna, de sus controles, los que deben **ejecutar**; si no tiene equipo, ejecuta él.
- Cada persona ve solo lo suyo, en «Mi trabajo»: el ejecutor sube la evidencia y arregla lo que falle; el `responsable` dueño **revisa** lo de su equipo y el `admin_empresa` puede revisar cualquiera (cumple, o rechaza con motivo; si revisan los dos, aprueban los dos). El veredicto de lo manual sigue el mismo flujo.
- El `auditor` lo crea la empresa cuando va a certificarse, para que revise cómo lleva sus cuentas: queda como usuario de **su empresa**, ve todo el cumplimiento con la vista técnica y escribe observaciones (D63). No valida ni califica por ahora. Al terminar, la empresa lo desactiva.
**Lo que falta cerrar:** nada de la cadena de asignación (D102 cierra `P38` y `P3`); las notificaciones las decidió D143 (por construir, MD-515).

**Entidades:** `users`, `user_control_assignments`,
`audit_observations` (§7.6).
**Fuente:** `modelo-datos.md` §5. (`Usuarios.md` de la bóveda **no está en este repo**;
lo que el comité entregó sobre usuarios está transcrito en `modelo-datos.md` §5.)

## 9. Medición de cumplimiento

Con servicio, activos, catálogo clonado y responsables asignados, el motor deriva el cumplimiento por par servicio ×
marco, **nunca** como atributo del marco ni como número de la empresa completa. Con la VF18 (D128, D130) la cadena es
activo → check → evidencia → prueba → **requisito del control** → control: el control cumple solo con el 100% de sus
requisitos (nivel Adecuado o Sólido) y cuenta como cumplido solo cuando lo aprueban el responsable y el
`admin_empresa` (D132). Las ventanas de vigencia de cada periodicidad hacen que el cumplimiento se mantenga, no que
se gane una vez (D131).

**El recorrido del implementador**, tal como lo describe el comité (`MAP CALOR`, sección 7):

1. Completar el contexto de la empresa y del servicio en alcance.
2. Registrar los activos y su escenario (`AC-01` a `AC-06`): eso define qué checks aplican.
3. El `admin_empresa` asigna un responsable a cada control (guiado por el rol sugerido); el responsable puede delegarlo.
4. Conectar las integraciones (la sonda, el motor de nube, identidad, RR. HH., ticketing, MDM…).
5. Crear o importar los documentos, aprobarlos y asignarlos para aceptación (módulo Documentos, D133) → pruebas `T-DOC`.
6. Ejecutar las pruebas de población: inventario, usuarios, cambios del período.
7. Revisar las pruebas técnicas y corregir cada FAIL de un check Directo con su mensaje de brecha (D138).
8. Cargar la evidencia operativa de la muestra en cada ventana.
9. El responsable aprueba el cumplimiento del control y después el `admin_empresa` da la aprobación final.
10. Atender las alertas de vencimiento para mantener el 100%.

La evaluación del auditor (D77) está en pausa (D96): la escala de Monkey es de preparación y no reemplaza su opinión.

**Fuente:** `modelo-datos.md` §9 (D130; reemplaza el motor de D68) y §11.

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

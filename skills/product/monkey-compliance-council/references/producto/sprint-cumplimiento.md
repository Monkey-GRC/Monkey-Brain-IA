---
id: sprint-cumplimiento
name: Sprint de Cumplimiento — alcance
description: Alcance del segundo sprint del MVP (módulo de Cumplimiento): qué entra, qué quedó fuera, y qué espera al documento de permisos por pantalla del comité.
type: reference
---

# Sprint de Cumplimiento — alcance

> **Estado verificado contra el código el 2026-11-18** (Backend, Frontend-Platform y los contratos de `contracts/cumplimiento/`); el alcance y las prioridades no cambian. **Histórico, ajustado por D96 (2026-10-27).** El `admin_empresa` valida la evidencia, da el veredicto, decide las exclusiones y edita directamente; el `funcional` ejecuta lo de su dimensión (`contracts/gestion-usuarios.md`). La evaluación del auditor (MD-155) está en pausa (`P35`). Los tickets de aprobación de cambios, de asignación de personal externo, de elegir empresa de trabajo y del aviso de espera de una exclusión se cerraron sin objeto. Ver `D96` en `datos/decisiones/06-cumplimiento-y-roles.md`.

**Segundo entregable del MVP.** Jira, proyecto `MD`, sprint «MD Sprint 2» (2026-10-09 a 2026-10-23). Es **solo de Cumplimiento**:
la gestión de usuarios, Monkey Admin y la infraestructura que no sirve a Cumplimiento van a otro sprint.

**Reglas que el sprint construye:** `modelo-datos.md` §9 (el cálculo **del comité**, D68), §5.1 y §5.5 (los 4 roles y la matriz), §7.1 (controles propios y
cambios con aprobación), §7.5 (el veredicto) y §7.6 (las observaciones).

## Qué entra

**Construido** = existe en el Backend y su contrato lo dice; si lleva pantalla, está en Monkey Platform. Lo que no se pudo comprobar en el código (tickets de proceso) se deja sin marca.

| Épico | Tickets |
|---|---|
| Fundación (MD-101) | MD-108 contratos (**escritos**, `contracts/cumplimiento/`) · MD-109 glosario (**listo**, `datos/modelo/01-glosario.md`) · MD-110 almacenamiento de evidencias (listo) · MD-113 rastro de auditoría (listo) · MD-114 idiomas en Platform (**construido**, es/en) · MD-115 componentes compartidos |
| Controles (MD-102) | MD-117 listar y ver · MD-118 editar o dar de baja · MD-150 control propio: **construidos** |
| Riesgos y causas (MD-103) | MD-122 riesgos y causas · MD-123 evaluación 5×5 y tratamiento: **construidos** |
| Evidencias (MD-104) | MD-126 subir · MD-127 validación de la evidencia (D96, D88; en dos niveles desde MD-194) · MD-128 Descripción del Sistema como archivo: **construidos** |
| Responsables de la organización (MD-105) | MD-133 cargos en la API · MD-135 cargos en pantalla (`/responsables` en Platform): **construidos** |
| Medición y resumen (MD-106) | MD-137 resumen del servicio · MD-138 motor de cálculo (`domain/engine/`) · MD-139 estado del activo: **construidos** |
| Exclusiones y cierre (MD-107) | MD-144 exclusiones · MD-168 período y fecha de corte (API y pantalla) · MD-171 vencimiento derivado al leer · MD-145 evaluaciones inmutables: **construidos**. **Falta:** MD-170 exclusión de un check (`DT-74`). MD-147 verificación del backend y MD-149 revisión de pantallas y demo: sin comprobar |
| Auditoría (MD-152) | MD-155 veredicto manual (en dos niveles desde MD-194) y MD-157 rol auditor: **construidos**. MD-154 observaciones del auditor: **API construida; faltan las pantallas** (y el aviso a la empresa, D143) |

## Lo que sigue pendiente del motor del comité (D68)

El motor y sus reglas (los 8 casos C1 a C8, las simulaciones y las validaciones V01 a V15 como pruebas de aceptación, `modelo-datos.md` §9) están construidos y reemplazaron la agregación de D62. Queda:

| Ticket | Qué falta |
|---|---|
| **MD-151** mitigación y riesgo residual | **Sigue fuera.** El comité trae los estados de mitigación (RN-20, RN-21) y la fórmula del residual está adoptada (D75), y la VF18 la reemplazó por la cobertura verificada (D134): ya no falta ningún dato del comité |
| Evaluación del auditor (D77, `framework_assessments`) | En pausa (`P35`); se retiró del Backend el 2026-10-28 (D96) |
| Cargar `control_dimensions` desde la hoja del comité | `DT-69` |

**Tickets nuevos que el motor pide y aún no se crean** (siguen la prioridad MUST, SHOULD o LATER de la hoja `REQUISITOS EVALUACIÓN MONKEY`; no se comprobó cuáles ya cubre el código): desactivación controlada de tests con justificación (REQ-019 a REQ-021), evidencias validadas por atributo y por una persona (REQ-014 a REQ-018), dimensión requerida sin test ⇒ control incompleto (REQ-022, REQ-023), vigencia y vencimiento automático (REQ-046; la VF18 la define por ventanas, D131) y reutilización de resultados entre marcos (REQ-013, REQ-033).

## Qué quedó fuera (vuelve al backlog)

- **Acceso y usuarios (MD-153):** se construyó en el sprint de usuarios ([`sprint-usuarios.md`](sprint-usuarios.md), D102 y D103): MD-131, MD-132 y MD-134 los reemplazaron otros tickets; MD-158 quedó sin objeto. MD-94 (MFA) lo cubre el módulo de autenticación (`contracts/autenticacion.md`).
- **Monkey Admin:** el catálogo maestro (MD-141, MD-142) **está construido** (lectura y escritura, `contracts/catalogo-maestro.md`). Sigue fuera el detalle de empresa de solo lectura (MD-146).
- **Infraestructura y limpieza:** MD-112 (docker-compose y respaldo), MD-116 (limpieza de Platform), MD-87 (confidencialidad de la sonda; `SEG-39`, sin prueba automática).
- **Mitigación y riesgo residual** (MD-151).

## Pantallas por rol (P3, cerrada por D102)

El comité no entregará el Excel de permisos por pantalla: manda la matriz de `modelo/05-usuarios.md` §5.5 (D102), y estas pantallas ya existen en Platform (`/cumplimiento/resumen`, `riesgos`, `causas`, `controles`, `evidencias`, `exclusiones`). Lo decidido para ellas, que sigue vigente:

| Ticket | Pantalla | Lo que ya está decidido |
|---|---|---|
| MD-119 | Estructura del módulo dentro del servicio | Cumplimiento vive dentro de cada servicio; no hay toggle de «modo auditor»: el cliente ve la vista de negocio y la técnica es de los roles auditor y administrador de la empresa (D81, D96). **Con más de un servicio, el menú «Cumplimiento» abre «General»: para cada marco, una fila por servicio con su propio estado, avance y cobertura, y entras al detalle desde ahí; «General» no suma ni promedia servicios (§9, D68)** |
| MD-120 | Lista de controles | Agrupada por categoría; con el código del control, el estado cualitativo, el porcentaje de avance y la cobertura juntos (D80) |
| MD-121 | Detalle y edición de una acción | Editar o dar de baja lo hace el `admin_empresa` directo, con advertencia y confirmación (D96, `P33`) |
| MD-124 · MD-125 | Riesgos, evaluación 5×5 y tratamiento | Evalúa y trata el administrador de la empresa; el auditor lee |
| MD-129 · MD-130 | Bandeja de evidencias y su aprobación | Revisan el `responsable` dueño y el `admin_empresa` (D102) |
| MD-140 | Resumen del servicio | Servicio → marco → 5 categorías → acciones que fallan → dimensión → activo o test |

**Tickets nuevos que aún no se crean:** la pantalla de observaciones del auditor, responder una observación desde la empresa, y los reportes en PDF y Excel (contenido por definir).

## Preguntas abiertas que tocan este sprint

`datos/pendientes/README.md`: **P22** (lo que falta para calcular el riesgo), **P26** (cerrada por D145) y **P35** (la evaluación del auditor).

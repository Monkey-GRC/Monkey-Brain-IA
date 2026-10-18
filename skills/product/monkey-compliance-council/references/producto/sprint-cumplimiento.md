---
id: sprint-cumplimiento
name: Sprint de Cumplimiento — alcance
description: Alcance del segundo sprint del MVP (módulo de Cumplimiento): qué entra, qué quedó fuera, y qué espera al documento de permisos por pantalla del comité.
type: reference
---

# Sprint de Cumplimiento — alcance

**Segundo entregable del MVP.** Jira, proyecto `MD`, sprint «MD Sprint 2» (2026-10-09 a 2026-10-23). Es **solo de Cumplimiento**:
la gestión de usuarios, Monkey Admin y la infraestructura que no sirve a Cumplimiento van a otro sprint.

**Reglas que el sprint construye:** `modelo-datos.md` §9 (el cálculo **del comité**, D68), §5.1 y §5.5 (los 5 roles y la matriz), §7.1 (controles propios y
cambios con aprobación), §7.5 (el veredicto) y §7.6 (las observaciones).

## Qué entra

| Épico | Tickets |
|---|---|
| Fundación (MD-101) | MD-108 contratos (escritos en `contracts/modules/compliance-*.md`) · MD-109 glosario · MD-110 almacenamiento de evidencias · MD-113 rastro de auditoría (listo) · MD-114 idiomas en Platform · MD-115 componentes compartidos |
| Controles (MD-102) | MD-117 listar y ver (**construido**) · MD-118 proponer edición o baja (**construido**) · MD-150 proponer un control propio (**construido**) |
| Riesgos y causas (MD-103) | MD-122 riesgos y causas (**construido**) · MD-123 evaluación 5×5 y tratamiento (**construido**) |
| Evidencias (MD-104) | MD-126 subir (**construido**) · MD-127 revisión de la evidencia por consultor y auditor (D84; antes «aprobar o rechazar») · MD-128 Descripción del Sistema como archivo (listo) |
| Responsables de la organización (MD-105) | MD-133 cargos en la API (**construido**) · MD-135 cargos en pantalla |
| Medición y resumen (MD-106) | MD-137 resumen del servicio · MD-138 motor de cálculo · MD-139 estado del activo |
| Exclusiones y cierre (MD-107) | MD-144 exclusiones (**construido**; para usarlo de verdad faltan MD-168 —el período, `P26`— y MD-160 —que el consultor decida—; sin pantalla: MD-169; MD-170 exclusión de un check; MD-171 deuda) · MD-145 evaluaciones inmutables · MD-147 verificación del backend · MD-149 revisión de pantallas y demo |
| Auditoría y consultoría (MD-152) | MD-154 observaciones · MD-155 veredicto del consultor · MD-156 aprobación de cambios de controles |
| Acceso (MD-153), prerrequisito | MD-157 roles consultor y auditor en el backend: **construido**. Desbloquea MD-118, MD-144 y MD-154 a MD-156, que dependen del rol `consultor` |

## Lo que cambia con el motor del comité (D68, 2026-10-10)

El comité entregó la VF2 con el motor de evaluación completo. **Reemplaza la agregación de D62** y cambia el alcance de estos tickets (Jira se reescribe a mano; aquí queda el qué):

| Ticket | Qué cambia |
|---|---|
| **MD-138** motor de cálculo | Se construye contra `modelo-datos.md` §9 (una comprobación automática se reintenta **tres veces** antes de quedar en `ERROR` con aviso, D76): funciones puras para activo, test, control, categoría y marco, con **los 8 casos del comité** (C1 a C8), las simulaciones 1 a 6 y las validaciones V01 a V15 como pruebas de aceptación. Lo pendiente bloquea; el marco se evalúa sobre controles únicos. Reemplaza al calculador anterior, que ya no existe |
| **MD-139** estado del activo | El resultado de un activo en un test tiene 5 estados (cumple, no cumple, pendiente, error, excluido). El semáforo del activo sigue la lectura de D62 (`DT-66`) |
| **MD-137** resumen del servicio | Muestra avance, cobertura y estado por separado (REQ-032); el cliente ve el semáforo y en qué falla, y el consultor y el auditor ven los estados técnicos (REQ-049) |
| **MD-144** exclusiones | Incluye **excluir un activo** de un test con justificación, aprobador y vigencia (REQ-008). La propone la empresa, la aprueba el consultor y vence con el período: **cerrada en D74, D78 y D83** (sin consultor, la exclusión espera y la pantalla avisa que hay que asignar uno) |
| **MD-145** evaluaciones inmutables | La evaluación es servicio + marco + versión + período + fecha de corte (REQ-004) y cada cambio de estado deja un evento inmutable (REQ-044) |
| **MD-155** veredicto del consultor | Se amplía con la evaluación del consultor y la del auditor: diseño cerrado en D77: veredicto general por servicio y marco (`ready`/`not_ready`), en `framework_assessments` |
| **MD-151** mitigación y riesgo residual | **Sigue fuera.** El comité trae los estados de mitigación (RN-20, RN-21) y la fórmula del residual está adoptada (D75), pero falta el efecto (probabilidad o impacto) y la obligatoriedad de las 209 relaciones causa–control, y el comité entregará el detalle de la fórmula entre el 14 y el 15 de octubre: `P22`, D76 |

**Tickets nuevos que el motor pide y aún no se crean** (siguen la prioridad MUST, SHOULD o LATER de la hoja `REQUISITOS EVALUACIÓN MONKEY`): desactivación controlada de tests con justificación (REQ-019 a REQ-021),
evidencias validadas por atributo y por una persona (REQ-014 a REQ-018), dimensión requerida sin test ⇒ control incompleto (REQ-022, REQ-023), vigencia y vencimiento automático (REQ-046, depende de `P22`),
reutilización de resultados entre marcos (REQ-013, REQ-033) y la evaluación del auditor (D77; falta crear su ticket). **Falta también el ticket de guardar los resultados de la sonda como `evaluations` por test, activo y control (`DT-50`)**: sin él, todo lo que MD-117, MD-137 y MD-139 muestran sale «Sin medir». Aparte, cargar `control_dimensions` desde la hoja del comité (`DT-69`).

## Qué quedó fuera (vuelve al backlog)

- **Acceso y usuarios (MD-153):** invitar (MD-131), desactivar (MD-132), pantalla Equipo (MD-134), Monkey Admin heredado (MD-143), MFA para los 5 roles (MD-94),
  asignar controles a personas (MD-158), crear y asignar consultores desde Monkey Admin (MD-159),
  elegir la empresa de trabajo del consultor (MD-160), ver y suspender consultores asignados (MD-161).
- **Monkey Admin:** catálogo maestro (MD-141, MD-142) y detalle de empresa (MD-146).
- **Infraestructura y limpieza:** MD-112 (docker-compose y respaldo), MD-116 (limpieza de Platform), MD-87 (confidencialidad de la sonda).
- **Mitigación y riesgo residual** (MD-151).

## Qué espera al documento de permisos por pantalla del comité (P3)

Estos tickets **no se reescriben en Jira hasta que el comité entregue su Excel**. Tienen una nota que lo dice. Lo que ya está decidido y no cambia:

| Ticket | Pantalla | Lo que ya está decidido |
|---|---|---|
| MD-119 | Estructura del módulo dentro del servicio | Cumplimiento vive dentro de cada servicio; no hay toggle de «modo auditor»: el cliente ve la vista de negocio y la técnica es de los roles auditor y consultor y, desde D81, también del administrador de la empresa |
| MD-120 | Lista de controles | Agrupada por categoría; con el código del control, el estado cualitativo, el porcentaje de avance y la cobertura juntos (D80) |
| MD-121 | Detalle y edición de una acción | Editar o dar de baja es una **propuesta** que aprueba el consultor |
| MD-124 · MD-125 | Riesgos, evaluación 5×5 y tratamiento | Evalúa y trata el administrador de la empresa; el consultor y el auditor leen |
| MD-129 · MD-130 | Bandeja de evidencias y su aprobación | Solo el administrador de la empresa aprueba o rechaza |
| MD-140 | Resumen del servicio | Servicio → marco → 5 categorías → acciones que fallan → dimensión → activo o test |

**Tickets nuevos que aún no se crean** (dependen de ese documento o de definiciones que faltan): la pantalla de observaciones del auditor y del consultor,
responder una observación desde la empresa, la pantalla de aprobación de cambios del consultor, y los reportes en PDF y Excel (contenido por definir).

## Preguntas abiertas que tocan este sprint

`modelo-datos-pendientes.md`: **P3** (permisos por pantalla), **P22** (lo que falta para calcular el riesgo), **P25** (quién valida una evidencia) y **P26** (período y fecha de corte de una evaluación).

---
id: sprint-cumplimiento
name: Sprint de Cumplimiento — alcance
description: Alcance del segundo sprint del MVP (módulo de Cumplimiento): qué entra, qué quedó fuera, y qué espera al documento de permisos por pantalla del comité.
type: reference
---

# Sprint de Cumplimiento — alcance

> **Histórico, ajustado por D96 (2026-10-27).** El `admin_empresa` valida la evidencia, da el veredicto, decide las exclusiones y edita directamente; el `funcional` ejecuta lo de su dimensión (`contracts/modules/users-team.md`). La evaluación del auditor (MD-155) está en pausa (`P35`). Los tickets de aprobación de cambios, de asignación de personal externo, de elegir empresa de trabajo y del aviso de espera de una exclusión se cerraron sin objeto. Ver `D96` en `datos/decisiones/06-cumplimiento-y-roles.md`.

**Segundo entregable del MVP.** Jira, proyecto `MD`, sprint «MD Sprint 2» (2026-10-09 a 2026-10-23). Es **solo de Cumplimiento**:
la gestión de usuarios, Monkey Admin y la infraestructura que no sirve a Cumplimiento van a otro sprint.

**Reglas que el sprint construye:** `modelo-datos.md` §9 (el cálculo **del comité**, D68), §5.1 y §5.5 (los 4 roles y la matriz), §7.1 (controles propios y
cambios con aprobación), §7.5 (el veredicto) y §7.6 (las observaciones).

## Qué entra

| Épico | Tickets |
|---|---|
| Fundación (MD-101) | MD-108 contratos (escritos en `contracts/modules/compliance-*.md`) · MD-109 glosario · MD-110 almacenamiento de evidencias · MD-113 rastro de auditoría (listo) · MD-114 idiomas en Platform · MD-115 componentes compartidos |
| Controles (MD-102) | MD-117 listar y ver (**construido**) · MD-118 proponer edición o baja (**construido**) · MD-150 proponer un control propio (**construido**) |
| Riesgos y causas (MD-103) | MD-122 riesgos y causas (**construido**) · MD-123 evaluación 5×5 y tratamiento (**construido**) |
| Evidencias (MD-104) | MD-126 subir (**construido**) · MD-127 validación de la evidencia por el `admin_empresa` (D96; **construido**, D88) · MD-128 Descripción del Sistema como archivo (listo) |
| Responsables de la organización (MD-105) | MD-133 cargos en la API (**construido**) · MD-135 cargos en pantalla |
| Medición y resumen (MD-106) | MD-137 resumen del servicio · MD-138 motor de cálculo · MD-139 estado del activo |
| Exclusiones y cierre (MD-107) | MD-144 exclusiones (**construido**; para usarlo de verdad faltan MD-168 —el período, `P26`; **API construida 2026-10-20 (D87)**, falta su pantalla— ; MD-170 exclusión de un check; MD-171 deuda) · MD-145 evaluaciones inmutables · MD-147 verificación del backend · MD-149 revisión de pantallas y demo |
| Auditoría (MD-152) | MD-154 observaciones del auditor · MD-155 veredicto manual del `admin_empresa` (**construido**) |
| Acceso (MD-153), prerrequisito | MD-157 rol auditor en el backend: **construido**. Desbloquea MD-154 |

## Lo que cambia con el motor del comité (D68, 2026-10-10)

El comité entregó la VF2 con el motor de evaluación completo. **Reemplaza la agregación de D62** y cambia el alcance de estos tickets (Jira se reescribe a mano; aquí queda el qué):

| Ticket | Qué cambia |
|---|---|
| **MD-138** motor de cálculo | Se construye contra `modelo-datos.md` §9 (una comprobación automática se reintenta **tres veces** antes de quedar en `ERROR` con aviso, D76): funciones puras para activo, test, control, categoría y marco, con **los 8 casos del comité** (C1 a C8), las simulaciones 1 a 6 y las validaciones V01 a V15 como pruebas de aceptación. Lo pendiente bloquea; el marco se evalúa sobre controles únicos. Reemplaza al calculador anterior, que ya no existe |
| **MD-139** estado del activo | El resultado de un activo en un test tiene 5 estados (cumple, no cumple, pendiente, error, excluido). El semáforo del activo sigue la lectura de D62 (`DT-66`) |
| **MD-137** resumen del servicio | Muestra avance, cobertura y estado por separado (REQ-032); el cliente ve el semáforo y en qué falla, y el `admin_empresa` y el auditor ven los estados técnicos (REQ-049) |
| **MD-144** exclusiones | Incluye **excluir un activo** de un test con justificación, aprobador y vigencia (REQ-008). La propone y la decide el `admin_empresa` en un solo acto y vence con el período: **cerrada en D74 y D96** |
| **MD-145** evaluaciones inmutables | **Construida** (`SEG-38`): la base impide editar o borrar una evaluación a todos los roles, también al dueño de la tabla; el período y la fecha de corte (REQ-004) los puso MD-168 y todo cambio de estado de un control deja un evento (REQ-044, D91) |
| **MD-155** veredicto manual | **Construida**: el veredicto de un test manual que no es documental, del `admin_empresa` (D85, D96). La evaluación del auditor (`framework_assessments`, D77) quedó en pausa (`P35`) |
| **MD-151** mitigación y riesgo residual | **Sigue fuera.** El comité trae los estados de mitigación (RN-20, RN-21) y la fórmula del residual está adoptada (D75), pero falta el efecto (probabilidad o impacto) y la obligatoriedad de las 209 relaciones causa–control, y el comité entregará el detalle de la fórmula entre el 14 y el 15 de octubre: `P22`, D76 |

**Tickets nuevos que el motor pide y aún no se crean** (siguen la prioridad MUST, SHOULD o LATER de la hoja `REQUISITOS EVALUACIÓN MONKEY`): desactivación controlada de tests con justificación (REQ-019 a REQ-021),
evidencias validadas por atributo y por una persona (REQ-014 a REQ-018), dimensión requerida sin test ⇒ control incompleto (REQ-022, REQ-023), vigencia y vencimiento automático (REQ-046, depende de `P22`),
reutilización de resultados entre marcos (REQ-013, REQ-033) y la evaluación del auditor (D77; falta crear su ticket). **Falta también el ticket de guardar los resultados de la sonda como `evaluations` por test, activo y control (`DT-50`)**: sin él, todo lo que MD-117, MD-137 y MD-139 muestran sale «Sin medir». Aparte, cargar `control_dimensions` desde la hoja del comité (`DT-69`).

## Qué quedó fuera (vuelve al backlog)

- **Acceso y usuarios (MD-153):** invitar (MD-131), desactivar (MD-132), pantalla Equipo (MD-134), Monkey Admin heredado (MD-143), MFA para los 4 roles (MD-94),
  asignar el trabajo por dimensión (MD-158, construido en `feat/team-module`).
- **Monkey Admin:** catálogo maestro (MD-141, MD-142) y detalle de empresa (MD-146).
- **Infraestructura y limpieza:** MD-112 (docker-compose y respaldo), MD-116 (limpieza de Platform), MD-87 (confidencialidad de la sonda).
- **Mitigación y riesgo residual** (MD-151).

## Qué espera al documento de permisos por pantalla del comité (P3)

Estos tickets **no se reescriben en Jira hasta que el comité entregue su Excel**. Tienen una nota que lo dice. Lo que ya está decidido y no cambia:

| Ticket | Pantalla | Lo que ya está decidido |
|---|---|---|
| MD-119 | Estructura del módulo dentro del servicio | Cumplimiento vive dentro de cada servicio; no hay toggle de «modo auditor»: el cliente ve la vista de negocio y la técnica es de los roles auditor y administrador de la empresa (D81, D96). **Con más de un servicio, el menú «Cumplimiento» abre «General» (2026-10-22): para cada marco, una fila por servicio con su propio estado, avance y cobertura, y entras al detalle desde ahí; el encabezado del servicio trae un selector con «General» y los servicios. «General» no suma ni promedia servicios (§9, D68), y no hay chip «Vista técnica» en el encabezado: la vista técnica es del rol, no una señal en pantalla** |
| MD-120 | Lista de controles | Agrupada por categoría; con el código del control, el estado cualitativo, el porcentaje de avance y la cobertura juntos (D80) |
| MD-121 | Detalle y edición de una acción | Editar o dar de baja lo hace el `admin_empresa` directo, con advertencia y confirmación (D96, `P33`) |
| MD-124 · MD-125 | Riesgos, evaluación 5×5 y tratamiento | Evalúa y trata el administrador de la empresa; el auditor lee |
| MD-129 · MD-130 | Bandeja de evidencias y su aprobación | Solo el administrador de la empresa aprueba o rechaza |
| MD-140 | Resumen del servicio | Servicio → marco → 5 categorías → acciones que fallan → dimensión → activo o test |

**Tickets nuevos que aún no se crean** (dependen de ese documento o de definiciones que faltan): la pantalla de observaciones del auditor,
responder una observación desde la empresa, y los reportes en PDF y Excel (contenido por definir).

## Preguntas abiertas que tocan este sprint

`modelo-datos-pendientes.md`: **P3** (permisos por pantalla), **P22** (lo que falta para calcular el riesgo), **P26** (período y fecha de corte de una evaluación).

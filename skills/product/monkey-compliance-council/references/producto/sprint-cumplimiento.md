---
id: sprint-cumplimiento
name: Sprint de Cumplimiento — alcance
description: Alcance del segundo sprint del MVP (módulo de Cumplimiento): qué entra, qué quedó fuera, y qué espera al documento de permisos por pantalla del comité.
type: reference
---

# Sprint de Cumplimiento — alcance

**Segundo entregable del MVP.** Jira, proyecto `MD`, sprint «MD Sprint 2» (2026-10-09 a 2026-10-23). Es **solo de Cumplimiento**:
la gestión de usuarios, Monkey Admin y la infraestructura que no sirve a Cumplimiento van a otro sprint.

**Reglas que el sprint construye:** `modelo-datos.md` §9 (el cálculo), §5.1 y §5.5 (los 5 roles y la matriz), §7.1 (controles propios y
cambios con aprobación), §7.5 (el veredicto) y §7.6 (las observaciones).

## Qué entra

| Épico | Tickets |
|---|---|
| Fundación (MD-101) | MD-108 contratos · MD-109 glosario · MD-110 almacenamiento de evidencias · MD-113 rastro de auditoría (listo) · MD-114 idiomas en Platform · MD-115 componentes compartidos |
| Acciones de protección (MD-102) | MD-117 listar y ver · MD-118 proponer edición o baja · MD-150 proponer un control propio |
| Riesgos y causas (MD-103) | MD-122 riesgos y causas · MD-123 evaluación 5×5 y tratamiento |
| Evidencias (MD-104) | MD-126 subir · MD-127 aprobar o rechazar · MD-128 Descripción del Sistema como archivo (listo) |
| Responsables de la organización (MD-105) | MD-133 cargos en la API · MD-135 cargos en pantalla |
| Medición y resumen (MD-106) | MD-137 resumen del servicio · MD-138 motor de cálculo · MD-139 estado del activo |
| Exclusiones y cierre (MD-107) | MD-144 exclusiones · MD-145 evaluaciones inmutables · MD-147 verificación del backend · MD-149 revisión de pantallas y demo |
| Auditoría y consultoría (MD-152) | MD-154 observaciones · MD-155 veredicto del consultor · MD-156 aprobación de cambios de controles |

## Qué quedó fuera (vuelve al backlog)

- **Acceso y usuarios (MD-153):** invitar (MD-131), desactivar (MD-132), pantalla Equipo (MD-134), Monkey Admin heredado (MD-143), MFA para los 5 roles (MD-94),
  roles consultor y auditor en el backend (MD-157), asignar acciones de protección a personas (MD-158), crear y asignar consultores desde Monkey Admin (MD-159),
  elegir la empresa de trabajo del consultor (MD-160), ver y suspender consultores asignados (MD-161).
- **Monkey Admin:** catálogo maestro (MD-141, MD-142) y detalle de empresa (MD-146).
- **Infraestructura y limpieza:** MD-112 (docker-compose y respaldo), MD-116 (limpieza de Platform), MD-87 (confidencialidad de la sonda).
- **Mitigación y riesgo residual** (MD-151).

## Qué espera al documento de permisos por pantalla del comité (P3)

Estos tickets **no se reescriben en Jira hasta que el comité entregue su Excel**. Tienen una nota que lo dice. Lo que ya está decidido y no cambia:

| Ticket | Pantalla | Lo que ya está decidido |
|---|---|---|
| MD-119 | Estructura del módulo dentro del servicio | Cumplimiento vive dentro de cada servicio; no hay toggle de «modo auditor»: el cliente ve la vista de negocio y la técnica es de los roles auditor y consultor |
| MD-120 | Lista de acciones de protección | Agrupada por categoría; estado primero, porcentaje y cobertura debajo |
| MD-121 | Detalle y edición de una acción | Editar o dar de baja es una **propuesta** que aprueba el consultor |
| MD-124 · MD-125 | Riesgos, evaluación 5×5 y tratamiento | Evalúa y trata el administrador de la empresa; el consultor y el auditor leen |
| MD-129 · MD-130 | Bandeja de evidencias y su aprobación | Solo el administrador de la empresa aprueba o rechaza |
| MD-140 | Resumen del servicio | Servicio → marco → 5 categorías → acciones que fallan → dimensión → activo o test |

**Tickets nuevos que aún no se crean** (dependen de ese documento o de definiciones que faltan): la pantalla de observaciones del auditor y del consultor,
responder una observación desde la empresa, la pantalla de aprobación de cambios del consultor, y los reportes en PDF y Excel (contenido por definir).

## Preguntas abiertas que tocan este sprint

`modelo-datos-pendientes.md`: **P3** (permisos por pantalla).

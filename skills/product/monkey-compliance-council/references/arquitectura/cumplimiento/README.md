# Cumplimiento

Responde: **¿cómo llega Monkey a decir «este control está efectivo» o «este marco no cumple»?** Es la regla de
negocio central del producto. Léelo antes de tocar `features/compliance` o cualquier pantalla de Cumplimiento.

## La idea en una frase

> **El cumplimiento no se guarda, se calcula cada vez que se lee.** Se guardan los *hechos* (un resultado de la
> sonda, un documento entregado, un veredicto de una persona) y un motor de funciones puras los convierte en
> estados: activo → prueba → control → categoría → marco.

Es como una libreta de notas: nadie escribe «el estudiante aprobó el semestre»; se guardan las notas y el «aprobó»
sale de aplicar la regla. Si cambia una nota, cambia el resultado sin tocar nada más.

Por eso todo el módulo hace una de dos cosas:

- **Escribir un hecho** (sonda, evidencia, veredicto). Deja su rastro de auditoría y, si mueve el estado de algún
  control, un evento de cambio de estado.
- **Leer y calcular** (lista de controles, detalle, resumen por marco). Carga la «foto» del servicio y se la pasa al motor.

## Índice del módulo

También es el orden de lectura. Un número con decimal es un **componente**.

| # | Lee | Qué aprendes | Tiempo |
|---|---|---|---|
| **1** | Este archivo | La idea, el vocabulario y el mapa de código | 5 min |
| **2** | [`01-c4.md`](01-c4.md) | Quién participa y qué piezas tocan el módulo | 15 min |
| **3** | [**Motor**](motor/README.md) → [`01-reglas.md`](motor/01-reglas.md) | Las reglas del cálculo, con un ejemplo con números | 25 min |
| **4** | [`03-flujos.md`](03-flujos.md) | Las dos clases de operación y el patrón común de escritura | 10 min |
| 4.1 | ↳ [Controles](controles/README.md) · [flujos](controles/03-flujos.md) | Leer la lista y el detalle de los controles de un servicio | 10 min |
| 4.2 | ↳ [Resumen](resumen/README.md) · [flujos](resumen/03-flujos.md) | El estado por marco y categoría, y el período auditado | 10 min |
| 4.3 | ↳ [Evidencia](evidencia/README.md) · [flujos](evidencia/03-flujos.md) | Subir, versionar y revisar un documento | 10 min |
| 4.4 | ↳ [Veredictos](veredictos/README.md) · [flujos](veredictos/03-flujos.md) | La decisión de una persona sobre una prueba manual | 5 min |
| 4.5 | ↳ [Exclusiones](exclusiones/README.md) · [flujos](exclusiones/03-flujos.md) | Sacar un activo de una prueba, con vigencia | 5 min |
| 4.6 | ↳ [Observaciones](observaciones/README.md) · [flujos](observaciones/03-flujos.md) | Lo que escribe el auditor y cómo se atiende | 5 min |
| 4.7 | ↳ [Riesgos](riesgos/README.md) · [flujos](riesgos/03-flujos.md) | Riesgos, causas, evaluación 5×5 y tratamiento | 15 min |
| **5** | [`02-modelo.md`](02-modelo.md) | Qué tablas se leen y cuáles se escriben en cada operación | 15 min |
| **6** | [`06-mejoras.md`](06-mejoras.md) | Lo que conviene revisar del módulo | libre |
| **7** | [`07-estudio.md`](07-estudio.md) | Ejercicios para comprobar que lo entendiste | libre |

La otra puerta de entrada de hechos no es de este módulo: los resultados de la sonda los escribe
[Control técnico](../control-tecnico/README.md).

## Vocabulario mínimo

| Palabra | Qué es | En el código |
|---|---|---|
| Servicio | Lo que se certifica. **La unidad de cumplimiento es servicio × marco**, nunca la empresa entera. | `tenant.services` |
| Control | Una medida de protección. El del cliente es una copia de la del catálogo. | `client_controls` |
| Prueba (test) | Cómo se comprueba un control en una dimensión. Un control tiene una o varias. | `client_control_tests` → `catalog.tests` |
| Dimensión | Sobre qué se mide: `policy` (documental), `server`, `database`, `app`, `cloud`. | enum `Dimension` |
| Activo | Lo medido: un servidor, una base, una cuenta de nube… | `assets` ↔ `service_assets` |
| Evaluación | **Un hecho**: el resultado de un activo en una prueba en un instante. Inmutable. | `evaluations` |
| Evidencia | Un documento que respalda una prueba documental. Se sube y luego se revisa. | `evidence_*` |
| Veredicto | La decisión de una persona sobre una prueba manual. | `evaluations` con `origin = manual` |
| Estado / avance / cobertura | El estado decide. El avance (%) y la cobertura solo informan. | `engine/` y `control-readout.ts` |

## Mapa del código

Todo bajo `Backend/src/features/compliance/` salvo lo indicado. Se lee de abajo hacia arriba: el dominio es lo que
importa, el resto lo conecta con el mundo.

| Qué | Dónde | Por qué importa |
|---|---|---|
| **El motor** (reglas puras) | `domain/engine/*.ts` | Aquí vive el «qué significa cumplir». Sin base de datos, fácil de probar. |
| Lectura de un control | `domain/controls/control-readout.ts` → `readControl` | Une la foto del servicio con el motor. |
| Resumen por marco y categoría | `domain/overview/compliance-overview.ts` → `buildOverview` | Reparte controles en categorías y marcos. |
| Estado de una evidencia | `domain/evidence/evidence.ts` | Cuándo una entrega cumple, vence o espera. |
| Cambio de estado de un control | `domain/controls/control-state-events.ts` | Compara «antes» y «después» de una escritura. |
| **La foto del servicio** | `infrastructure/shared/service-snapshot.loader.ts` | Carga controles, activos y últimos resultados. |
| Casos de uso | `application/{controls,overview,verdicts,evidence}/` | Orquestan: permisos, repositorio, auditoría. |
| Endpoints | `presentation/*/…controller.ts` | Rutas, roles permitidos, formato de respuesta. |
| Pantallas | `Frontend-Platform/src/app/features/compliance/` | Cómo se ve para el cliente. |

## Dónde está cada dato

| Dato | Dueño |
|---|---|
| Rutas, cuerpos y errores | Índice y permisos comunes: `contracts/cumplimiento/README.md` · por componente: `controles.md` · `resumen.md` · `evidencia.md` · `veredictos.md` · `observaciones.md` · `exclusiones.md` · `riesgos.md` (todos en `contracts/cumplimiento/`) · y los cargos: `contracts/onboarding/cargos-responsables.md` |
| Valores de los enums | [`contracts/enums/cumplimiento.md`](../../../../../../contracts/enums/cumplimiento.md) |
| La definición funcional del cálculo | `datos/modelo/09-calculo-cumplimiento.md` (§9) · `datos/modelo/07-cumplimiento.md` (§7) |
| Decisiones (`D-n`) | [`datos/decisiones/cumplimiento/README.md`](../../datos/decisiones/cumplimiento/README.md): `D33` · `D62` · `D65` · `D68` · `D74` · `D75` · `D76` · `D78` · `D79` · `D80` · `D83` · `D85` · `D87` · `D88` |
| Pendientes del comité (`P-n`) | [`datos/pendientes/cumplimiento.md`](../../datos/pendientes/cumplimiento.md): `P22` · `P26` · `P27` · `P33` · `P37` · `P43` — **si sigue abierto, se pregunta** |
| Requisitos de seguridad | ninguno propio. Los que le aplican viven en su capacidad: [`plataforma.md`](../../seguridad/plataforma.md) (archivos), [`roles-permisos.md`](../../seguridad/roles-permisos.md) (quién valida) y [`trazabilidad.md`](../../seguridad/trazabilidad.md) (inmutabilidad) |
| Deuda vigente (6 `DT-n`) | [`deuda-tecnica/cumplimiento.md`](../../deuda-tecnica/cumplimiento.md) |

## Cómo verificarlo

Si cambias `domain/engine/`, `control-readout.ts`, `service-snapshot.loader.ts` o cualquier endpoint del módulo,
actualiza el diagrama afectado **en el mismo PR** (`STANDARD.md` §5).

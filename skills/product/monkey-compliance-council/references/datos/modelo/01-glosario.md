# Modelo de datos — §1 Glosario

> Parte de [`modelo-datos.md`](../modelo-datos.md) (índice). **Qué responde:** Todos los conceptos del dominio con su tabla. **Léelo:** Para traducir un término del comité al nombre de la tabla.
> Los números de sección (§) se conservan: cualquier cita a «§1» apunta aquí.

## 1. Glosario

Los conceptos que hay que tener claros antes de leer las tablas, con el nombre de la tabla
que les corresponde.

### Del negocio del cliente

| Término | Tabla | Qué es |
|---|---|---|
| **Organización** | `organizations` | La empresa cliente. Es el contenido de negocio que el cliente declara; el *tenant* como registro técnico es `companies` (§4) |
| **Servicio** | `services` | Lo que se certifica. **Es la unidad de evaluación**: el cumplimiento se mide por servicio, nunca consolidado de empresa |
| **Insumo de revisión** (activo) | `assets` | Lo que Monkey **encuentra** al conectar: cuáles son exactamente. Puede servir a varios servicios sin duplicarse |
| **Organización de subservicio** | `subservice_organizations` | El proveedor del que depende el servicio (AWS, Azure, un data center) |
| **CSOC** / **CUEC** | `csocs` / `cuecs` | Control complementario que se espera del proveedor (CSOC) o del cliente usuario (CUEC). **Monkey no los mide** |
| **Descripción del Sistema** | `system_descriptions` | Documento con las 10 secciones de los *Description Criteria* de AICPA. Lo sube el cliente |

### Del estándar

| Término | Tabla | Qué es |
|---|---|---|
| **Marco** | `frameworks` | El estándar contratado (en el MVP, solo SOC 2: D37). Contiene requisitos |
| **Requisito** | `requirements` | El criterio del marco: código (`CC6.1`) + criterio + **puntos de enfoque** |
| **Punto de enfoque** | `points_of_focus` | Cada *point of focus* numerado de un requisito. **Es a él que se vincula el control**, no al requisito ni al marco |
| **Criterio de confianza** | `trust_criteria` | Los TSC de SOC 2 (Seguridad, Disponibilidad, Confidencialidad, Integridad, Privacidad). Son catálogo: **clasifican los requisitos**. Qué criterios contrató un servicio es otra tabla (`service_trust_criteria`) y es lo que **filtra qué requisitos le aplican** |
| **Regulación** | `regulations` | Ley aplicable por jurisdicción (Ley 1581, LGPD, GDPR). **No se puntúa** |

### Del cumplimiento

| Término | Tabla | Qué es |
|---|---|---|
| **Control** | `controls` | La medida que ataca una causa. **Atómico**: no pertenece a ningún marco |
| **Control del cliente** | `client_controls` | El control particularizado en el escenario: código propio (`C01`) e **interpretación** reescrita con sus herramientas reales |
| **Riesgo** · **Causa** | `risks` · `causes` | El riesgo se origina en causas; las causas se mitigan con controles. Los tres niveles son `N:M` entre sí |
| **Dimensión** | `control_dimensions` | Una de las 5 formas de evaluar un control (documental, servidores, bases de datos, aplicación, nube) — ver §2 |
| **Categoría** | `trust_criteria` | Una de las 5 categorías de SOC 2 (Seguridad, Disponibilidad, Integridad del procesamiento, Confidencialidad, Privacidad). Agrupa controles — ver §2 y §9 |
| **Plan de testeo** | `test_plans` | Criterio de auditor: pasos **dependientes**, población y regla de muestreo |
| **Test** | `tests` | Procedimiento de auditoría reutilizable (22 campos propios; la hoja trae 23 columnas y una es su vínculo con los controles). Pertenece a **una** dimensión |
| **Check** | `checks` | La verificación atómica que ejecuta la sonda. Clave natural de tres partes: `platform` + `policy_id` + `check_id` |
| **Evaluación** | `evaluations` | Un test o check aplicado a **un activo**, con su resultado. **Inmutable** |
| **Exclusión** | `exclusions` | Decisión de no medir un check, con justificación aprobada y vigencia |
| **Evidencia requerida** / **entregada** | `evidence_requirements` / `evidence_submissions` | Qué se exige y quién responde / el archivo concreto, con hash de integridad |
| **Consultoría** · **Auditoría** | — | Consultoría es preparar al cliente para la auditoría (lo que hace Monkey); auditoría es el examen final que da la certificación del marco |
| **Hallazgo** | `findings` | Una falla concreta que **detecta el sistema**: qué falló, en qué dimensión, sobre qué insumo |
| **Observación del auditor** | `audit_observations` | Lo que escribe el rol `auditor` (observación, recomendación o solicitud de información) y que la empresa debe atender — §7.6. **No es un hallazgo** |
| **Mitigación** · **Riesgo residual** | `mitigations` · `residual_risks` | Indicadores **separados** del cumplimiento (§9). Un 93% de cumplimiento no dice que el riesgo residual sea 7% |
| **Cobertura técnica** | — | Cuánto del scope se puede medir automáticamente. **Número aparte** del cumplimiento |

### De la capa técnica

| Término | Tabla | Qué es |
|---|---|---|
| **Sonda / capacidad automática** | `automated_capabilities` | El mecanismo que evalúa sin intervención humana. Validador único. **Nunca se nombra al proveedor frente al cliente** |
| **Ejecución** | `executions` | Una corrida de la sonda sobre un activo. **No es una Evaluación** |
| **Política SCA** | `sca_policies` | El benchmark que corre la sonda (`cis_alma_linux_8`), con su archivo YAML y su número de checks |
| **Aprovisionamiento** | `asset_provisionings` | El estado de la conexión de un activo: conectado, validado, activo, programado |

### De la plataforma

| Término | Tabla | Qué es |
|---|---|---|
| **Monkey Platform** | — | La aplicación web que usa el cliente |
| **Monkey Admin** | — | Aplicación web separada, con dominio propio, solo para el equipo de Monkey |
| **Tenant** | `companies` | La empresa como unidad de aislamiento de datos |
| **Catálogo maestro** | — | Marcos, requisitos, controles, tests y checks que Monkey administra y que todos los clientes heredan |
| **Escenario del cliente** | — | Lo que se clonó del catálogo a un cliente concreto y él particularizó |

---

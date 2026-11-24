# MVP y Roadmap de Monkey

## ICP (perfil de cliente ideal)

**Primario (MVP)**: empresas de 15-150 empleados, B2B SaaS o servicios tecnológicos, que reciben por primera vez la exigencia de SOC 2 Tipo I/II de un cliente enterprise, sin compliance officer dedicado ni equipo de seguridad formal — la responsabilidad recae en el CTO, Head of Engineering o el propio fundador.

**Secundario (post-MVP)**: PyMEs reguladas con infraestructura híbrida u on-prem — salud (HIPAA), pagos (PCI DSS), industria/manufactura con ERP on-prem, empresas europeas medianas alcanzadas por NIS2/DORA, y potencialmente contratistas que empiezan a necesitar CMMC 2.0 Nivel 1-2 o negocio en Brasil (LGPD).

**Fuera de ICP explícito**: bancos/aseguradoras grandes con equipos GRC de 20+ personas, contratistas de defensa CMMC Nivel 3, empresas de 1000+ empleados con estructuras legales complejas.

## Fases

| Fase | Horizonte | Foco |
|---|---|---|
| **Fase 0 — MVP** | 0-4 meses | Onboarding guiado, **solo SOC 2** (D37), 12-15 integraciones cloud/SaaS/IdP, evaluación de Wazuh como base del agente on-prem, motor de IA (explicar/detectar/priorizar/recomendar), dashboard de 4 preguntas, modo guiado, arquitectura de datos preparada para on-prem. |
| **Fase 1 — Expansión de framework y evidencia** | 4-8 meses | ISO 27001, PCI DSS y HIPAA activables, redacción asistida de políticas y respuestas a cuestionarios de seguridad, conector Wazuh en producción, primeros conectores on-prem adicionales (Active Directory). |
| **Fase 2 — Híbrido/On-Prem real** | 8-14 meses | Agente on-prem completo (VMware, Windows Server, Linux, apalancando Wazuh), gestión de riesgo de vendors con IA, NIST CSF y CIS Controls activables. |
| **Fase 3 — Escala regulatoria internacional** | 14-24 meses | GDPR, NIS2, DORA, LGPD como módulos completos; FedRAMP y CMMC evaluados según demanda real; benchmarking entre pares; modo air-gapped para sectores críticos. |

## Clasificación consolidada

### MUST (MVP)
- Onboarding conversacional guiado (10 pasos, ver `philosophy.md`)
- Motor de compliance con controles atómicos, multi-framework por diseño y **SOC 2 como único marco activo** (D37)
- Motor de IA: explicar, detectar, priorizar, recomendar — con explicabilidad
- Motor de evidencias con cadena de custodia (origen/fecha/responsable/versión/integridad)
- Motor de riesgos básico (registro + scoring cualitativo + tratamiento con dueño)
- 12-15 conectores cloud/SaaS/IdP (AWS o Azure, GitHub, Google Workspace o M365, Okta o Entra ID, Slack)
- Dashboard de 4 preguntas + modo guiado por hallazgo
- Vista detallada tipo matriz (para auditor/usuario avanzado)
- Arquitectura de datos y de agentes preparada para on-prem, incluida la evaluación seria de Wazuh
- Aislamiento estricto de datos por tenant, en almacenamiento e inferencia de IA

### SHOULD
- Redacción asistida de políticas con revisión humana obligatoria
- Conectores Jira, CrowdStrike/SentinelOne, Wazuh (en producción)
- Registro de vendors con nivel de riesgo declarado
- PCI DSS y HIPAA como frameworks activables
- Módulo SCA de Wazuh como fuente de hallazgos de hardening

### LATER
- Agente on-prem completo (AD, VMware, Windows Server, Linux) sobre base Wazuh
- IA agéntica con corrección automática supervisada
- Benchmarking entre pares
- NIST CSF, CIS Controls, GDPR, NIS2, DORA, LGPD, FedRAMP, CMMC como módulos completos
- Predicción proactiva de drift

### NO BUILD
- Certificación de cumplimiento emitida por la plataforma (siempre la emite un auditor externo acreditado)
- Ejecución autónoma de cambios de infraestructura sin aprobación humana
- Microservicios prematuros / arquitectura distribuida compleja antes de tener presión de escala real
- Módulo GRC "enterprise" con matrices de riesgo cuantitativo avanzado (Monte Carlo, FAIR)
- Soporte simultáneo a 8+ frameworks en el lanzamiento
- Reconstruir desde cero un motor de correlación de eventos/ruleset de compliance que Wazuh ya resuelve

## Métrica de éxito propuesta

No solo "auditorías completadas": medir el tiempo que el usuario pasa **entendiendo qué hacer** vs. tiempo que pasa **haciendo lo que ya sabía que tenía que hacer**. Es la métrica que mejor captura la tesis de "traducción" central del producto.

## Los 12 épicos del MVP (Fase 0, horizonte 0-4 meses)

En orden de dependencia: cada uno necesita el anterior construido. Es el ordenamiento del
trabajo, no una fuente nueva de decisiones — si algo choca con `modelo-datos.md`,
`arquitectura/onboarding/README.md`, `philosophy.md` o `wazuh.md`, ganan ellos.

El **sprint 1** cubre los épicos 1 a 5 y está detallado aparte en `sprint-onboarding.md`
(épicos MD-57 a MD-61 en Jira).

| # | Épico | Qué entra | Fuente |
|---|---|---|---|
| 1 | **Fundación RBAC y Auth** | `companies`, `users`, los roles fijos (sin roles personalizados; seis con el `colaborador` de la VF18, D136), sesiones, aislamiento por tenant (dedicado o RLS). MFA obligatoria para los 4 roles, **en el sprint de acceso y usuarios (MD-94)** | `modelo-datos.md` §4 y §5 |
| 2 | **Onboarding — Contexto Organizacional** | Componente 1: 10 campos de identidad, perfil y jurisdicción → `organizations` | `arquitectura/onboarding/README.md` |
| 3 | **Onboarding — Contexto del Servicio** | Componente 2: 16 campos por servicio, incluida la Descripción del Sistema (10 secciones AICPA) → `services` y lo que cuelga de ella | `arquitectura/onboarding/README.md` |
| 4 | **Onboarding — Control Técnico** | Componente 3: catálogo `ac_01`…`ac_06`, flujo conectar → validar → activar → programar. **El cliente nunca ve el proveedor del motor** | `arquitectura/onboarding/README.md`, `wazuh.md` |
| 5 | **Catálogo maestro y clonado** | Marcos, requisitos, puntos de enfoque y el control atómico. Al elegir marco, el catálogo queda disponible sin pasos manuales: controles clonados, requisitos y puntos de enfoque referenciados con FK (D3) | `modelo-datos.md` §3 |
| 6 | **Motor de cumplimiento (cálculo)** | Cumplimiento derivado por par servicio × marco, nunca un % de empresa completa; recorrido requisitos → puntos de enfoque → controles, nunca almacenado como atributo del marco | `modelo-datos.md` §9 (D68: el motor del comité; reemplaza la agregación de D62) |
| 7 | **Motor de evidencias** | Cadena de custodia completa: origen, fecha, responsable, versión, integridad | `modelo-datos.md` §7.3 |
| 8 | **Motor de riesgos ("Cumplimiento")** | Registro de riesgo y causa, scoring cualitativo, tratamiento con dueño. **Módulo aparte que no bloquea nada.** La regla del riesgo es la de la VF18 (D134): nivel por posición, residual por cobertura verificada y apetito por zonas; falta construirla (RC-10, RC-11, MD-151) | D23, confirmada por el comité el 2026-09-26 |
| 9 | **Dashboard y modo guiado** | Vista por defecto con estado cualitativo, porcentaje de avance y cobertura juntos, y el vocabulario y los códigos del dominio (D80); nunca un % solo. La vista técnica detallada **no es un modo ni un botón: es la pantalla de los roles `auditor` y `admin_empresa`** (D63, D81, D96; mientras no se definan los permisos por pantalla, `P3`) | `philosophy.md` |
| 10 | **Integración de la sonda y del motor de nube** | La sonda es la base del agente on-prem/híbrido; el motor de nube evalúa las cuentas. Confidencialidad total: nunca se nombra al proveedor, en ninguna pantalla, notificación ni texto generado por IA | `wazuh.md` |
| 11 | **Conectores cloud/SaaS/IdP** | 12-15 conectores: AWS o Azure, GitHub, Google Workspace o M365, Okta o Entra ID, Slack | columna MUST de este archivo |
| 12 | **Equipo, validación y auditoría** | El `admin_empresa` crea a `responsable`, `delegado` y `auditor`, los agrupa y asigna el **dueño** de cada control; el `responsable` asigna el **ejecutor** y revisa a su equipo (D102, sprint 3); se **valida la evidencia** con dos niveles de revisión, da el veredicto de lo manual y edita controles, riesgos y causas directamente (D96). El `auditor` (lo crea `admin_empresa`) ve todos los servicios de su empresa en solo lectura, con vista técnica, escribe observaciones con estado y descarga evidencias y reportes; **su calificación queda para después** (`P35`). **Está en el MVP** | `modelo-datos.md` §5.1 y §7.6 |

Antes de esto, el proyecto `MD` cerró 56 tareas (MD-1 a MD-56) que fueron de **decisión, no de
construcción**: fijaron qué entidades hay y cómo se relacionan. Queda de ahí un pendiente
técnico: reescribir el cálculo de cumplimiento (MD-56).

## Riesgos del producto a vigilar

- Los cuatro líderes ya integran IA agéntica agresivamente — la ventana de diferenciación por "IA + simplicidad" se cierra rápido. Mitigación: priorizar la medición de on-prem/híbrido (Wazuh) y de nube (Prowler) bajo un mismo modelo de controles, y la experiencia guiada como foso, no la IA sola.
- Simplificar demasiado y perder credibilidad frente a auditores. Mitigación: la vista detallada tipo matriz siempre accesible, para el rol `auditor`.
- Falsa sensación de seguridad si la IA "explica de más". Mitigación: disclaimers claros de que Monkey prepara evidencia, no certifica.
- Complejidad subestimada de conectores on-prem. Mitigación: apalancar Wazuh en la sonda y Prowler en la nube en vez de construir agentes o escáneres propios desde cero.
- Fuga de datos entre tenants en la capa de IA — el riesgo más severo posible. Mitigación: aislamiento arquitectónico desde el día 1, pruebas automatizadas continuas.

## Alcance que viene del material fuente (no del Consejo)

Dos documentos del comité definen alcance que este roadmap no tenía. Inventario y procedencia
de las fuentes en `modelo-datos.md` §0.

**Centro de Control Técnico** (del Blueprint funcional del comité, hoy transcrito en
`modelo-datos.md` §8) —
pantalla completa con aprovisionamiento de activos, schedule de ejecuciones,
ejecuciones en tiempo real y logs. Es la cara operativa del Motor de Integraciones
y hoy no está clasificada en ninguna fase. Su principio funcional: **la unidad de
seguimiento es el activo, no la sonda**. Sin esta pantalla no hay forma de
distinguir "el control falla" de "la conexión falla", así que condiciona el
MUST de "dashboard de 4 preguntas": un hallazgo técnico sin diagnóstico de
conectividad es un falso negativo.

**Propuesta de proyecto, junio 2026** (`Propuesta Proyecto Monkey-1.xlsx`) —
alcance comercial con módulos que este roadmap no lista: Vulnerabilidades (219 h),
Gestión Documental con versionado y firma digital (142 h), Gestión de Políticas
(202 h) y Notificaciones (120 h). Está **parcialmente superado**: su "consolidado
de cumplimiento global (%)" queda derogado por la decisión de medir por servicio
(`modelo-datos.md` §9). Lo que sigue vivo y sin clasificar es Vulnerabilidades
(decisión D7, ya cerrada) y el versionado documental de la evidencia.


## Trabajo que sale de las decisiones del modelo (16 sep 2026)

Al cerrar el modelo relacional (`datos/decisiones/README.md`) quedaron dos cosas que no son
decisiones de modelo sino de roadmap:

**Checks de nube — SHOULD, y urgente.** (Cifra del catálogo v1; la VF18 la reemplaza, D128.) De los 61 TEST del catálogo, los **11 de nube
(`T-CLD-*`) no tienen ni un check automático**, pese a que el comité decidió que el
validador único cubre *"servidores, BD y nube"*; D100 lo acotó: la nube la mide Prowler (D53–D58) y Wazuh se queda con servidores, BD y endpoints (configuración, amenazas en tiempo real e incidentes). Consecuencia directa: un cliente con
escenario **"Solo nube (gestionada)"** —que es un perfil de cliente normal, no un caso
borde— verá su cobertura técnica en 0% y su cumplimiento casi enteramente documental. El
modelo ya lo reporta con honestidad (cobertura pendiente), pero el hueco es real y
comercialmente caro.

**Vulnerabilidades como módulo — LATER.** Decisión D7: en el MVP las vulnerabilidades son
**solo insumo** de los hallazgos de los controles de gestión de vulnerabilidades y parches
(`CC7.1` / `A.8.8`). El módulo con vida propia que pedía la Propuesta de junio 2026
—listado, filtro por cuenta cloud, tendencia, ciclo Active/Solved/Mitigated, 219 h
estimadas— no entra en el MVP.

**Y una deuda que descubrió la revisión del modelo, que no es una feature:** el calculador
de cumplimiento descarta del denominador todo check cuyo resultado no encuentra, lo que
produce una exclusión de facto sin justificación ni rastro — justo lo que el material
fuente llama deshonesto ante un auditor. Hay que corregirlo antes de mostrarle un
porcentaje a un cliente real.

## La integración de la VF18 (catálogo v2)

El comité entregó el 2026-11-22 la VF18, que reemplaza a la VF2 (D128). Trae 21 requerimientos de cambio (`RC-01` a
`RC-21`, hoja `01_DESARROLLO`). Se construyen **después** de la documentación (MD-490) y en este orden, porque cada
fase usa lo de la anterior:

| Fase | Requerimientos | Qué deja | Depende de |
|---|---|---|---|
| 1 · Catálogo v2 | RC-05, RC-12, RC-03, RC-02, RC-04 → **RC-01** (carga y verificación); RC-16 (textos neutros) y RC-19 (parámetros) en paralelo. RC-10 (matriz por posición) se puede hacer antes | Las tablas nuevas de §3 y §11 y la v2 cargada; después, **el reset total del entorno de desarrollo** (D128) | La documentación y los contratos de cada RC |
| 2 · Motor v2 | RC-06 (C%, nivel 0–5, reglas T), RC-08 (ventanas), RC-20 (excepciones), RC-18 (mensaje de brecha) | El cálculo de §9 | Fase 1; D140, D141 y D146 |
| 3 · Gestión | RC-13 y RC-14 (colaborador y matriz) → RC-07 (aprobaciones) → **RC-09 (módulo Documentos)** → RC-17 (alertas y tickets) | D132, D133, D136 y D138 construidas | Fase 2; el sistema de notificaciones (MD-515, D143) y el conector de Jira (D144) para RC-17 |
| 4 · Riesgo | RC-11 (cobertura y residual) | D134 construida | Los niveles de RC-06 |
| Aparte | RC-15 (contraseñas, D137); RC-21 (idioma, D142) | | |

**Fase 1, avance (MD-491, 2026-11-23):** construidos RC-05, RC-12, RC-03, RC-02, RC-04 y RC-01: el schema v2 aditivo, la carga y la verificación de la VF18 (D139); la v1 sigue en el schema hasta las fases 2 y 3 (`DT-113`). Quedan de la fase 1 RC-16 (la tabla 9 ya se aplica a los nombres neutros de las pruebas), RC-19 y RC-10. Ejecutar las plataformas nuevas del motor de nube y de la sonda va en un ticket aparte.

**Fase 2, avance (MD-498, 2026-11-23):** construido RC-06: el motor v2 (C%, nivel 0 a 5, reglas T, ventanas por calendario) calcula lista, detalle y resumen de controles. **MD-500 (2026-11-23):** construido RC-08: ventanas cerradas, nivel Sólido por período, periodicidad por control (D147) y períodos con histórico (D145, D148); quedan `DT-115` a `DT-117` y los avisos (MD-515). Quedan de la fase 2: puntajes globales y módulos sin dato (MD-497), parámetros desde una tabla (RC-19, MD-495), el plan de remediación de Parcial y «Cumplimiento aprobado» (RC-07, MD-504, `DT-114`) y el retiro de `client_control_tests` (MD-509, `DT-113`).

Las pantallas de Cumplimiento cambian casi todas (nivel, requisitos, aprobaciones, ventanas); se diseñan con
`monkey-ui-copy` y el sistema de diseño en cada fase.

## Estado vigente del proyecto: reconstrucción

*(Movido desde `CLAUDE.md` el 2026-11-02: es estado del proyecto, no una regla permanente.)*

- El proyecto está en **reconstrucción**. `datos/modelo-datos.md` es el plan vigente; el schema actual de `Backend` es el punto de
  partida que se rehace, no la referencia.
- Si Monkey hoy hace algo de una forma y el comité propuso otra, **se hace caso al comité**. Que una tabla, un enum o un cálculo ya
  exista no es argumento para conservarlo.
- Que algo no exista aún en el schema no es un pendiente: si está en `modelo-datos.md`, está decidido y listo para construirse. Solo
  queda abierto lo que está en `datos/pendientes/`.
- **Rediseño visual de Monkey Admin y Monkey Platform** (sistema de diseño en `skills/frontend/design-system/`): hecho en el código, sin commitear. Falta la revisión
  visual de Rod en claro y oscuro de las dos apps (nunca se miró en un navegador) y las decisiones abiertas; la deuda que dejó y sigue abierta es `DT-99` (las demás que abrió se cerraron en el mismo rediseño y se borraron). No cambia prioridades ni alcance.

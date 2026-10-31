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
`modulos/onboarding.md`, `philosophy.md` o `wazuh.md`, ganan ellos.

El **sprint 1** cubre los épicos 1 a 5 y está detallado aparte en `sprint-onboarding.md`
(épicos MD-57 a MD-61 en Jira).

| # | Épico | Qué entra | Fuente |
|---|---|---|---|
| 1 | **Fundación RBAC y Auth** | `companies`, `users`, los 4 roles fijos (sin roles personalizados), sesiones, aislamiento por tenant (dedicado o RLS). MFA obligatoria para los 4 roles, **en el sprint de acceso y usuarios (MD-94)** | `modelo-datos.md` §4 y §5 |
| 2 | **Onboarding — Contexto Organizacional** | Componente 1: 10 campos de identidad, perfil y jurisdicción → `organizations` | `modulos/onboarding.md` |
| 3 | **Onboarding — Contexto del Servicio** | Componente 2: 16 campos por servicio, incluida la Descripción del Sistema (10 secciones AICPA) → `services` y lo que cuelga de ella | `modulos/onboarding.md` |
| 4 | **Onboarding — Control Técnico** | Componente 3: catálogo `ac_01`…`ac_06`, flujo conectar → validar → activar → programar. **El cliente nunca ve el proveedor del motor** | `modulos/onboarding.md`, `wazuh.md` |
| 5 | **Catálogo maestro y clonado** | Marcos, requisitos, puntos de enfoque y el control atómico. Al elegir marco, el catálogo queda disponible sin pasos manuales: controles clonados, requisitos y puntos de enfoque referenciados con FK (D3) | `modelo-datos.md` §3 |
| 6 | **Motor de cumplimiento (cálculo)** | Cumplimiento derivado por par servicio × marco, nunca un % de empresa completa; recorrido requisitos → puntos de enfoque → controles, nunca almacenado como atributo del marco | `modelo-datos.md` §9 (D68: el motor del comité; reemplaza la agregación de D62) |
| 7 | **Motor de evidencias** | Cadena de custodia completa: origen, fecha, responsable, versión, integridad | `modelo-datos.md` §7.3 |
| 8 | **Motor de riesgos ("Cumplimiento")** | Registro de riesgo y causa, scoring cualitativo, tratamiento con dueño. **Módulo aparte que no bloquea nada.** La fórmula del riesgo residual está adoptada (D75); faltan datos del catálogo y quién define el apetito (`P22`, MD-151) | D23, confirmada por el comité el 2026-09-26 |
| 9 | **Dashboard y modo guiado** | Vista por defecto con estado cualitativo, porcentaje de avance y cobertura juntos, y el vocabulario y los códigos del dominio (D80); nunca un % solo. La vista técnica detallada **no es un modo ni un botón: es la pantalla de los roles `auditor` y `admin_empresa`** (D63, D81, D96; mientras no se definan los permisos por pantalla, `P3`) | `philosophy.md` |
| 10 | **Integración de la sonda y del motor de nube** | La sonda es la base del agente on-prem/híbrido; el motor de nube evalúa las cuentas. Confidencialidad total: nunca se nombra al proveedor, en ninguna pantalla, notificación ni texto generado por IA | `wazuh.md` |
| 11 | **Conectores cloud/SaaS/IdP** | 12-15 conectores: AWS o Azure, GitHub, Google Workspace o M365, Okta o Entra ID, Slack | columna MUST de este archivo |
| 12 | **Equipo, validación y auditoría** | El `admin_empresa` invita a `funcional` (con su especialidad por dimensión) y a `auditor`, reparte el trabajo por dimensión, **valida la evidencia**, da el veredicto de lo manual y edita controles, riesgos y causas directamente (D96). El `auditor` (lo crea `admin_empresa`) ve todos los servicios de su empresa en solo lectura, con vista técnica, escribe observaciones con estado y descarga evidencias y reportes; **su calificación queda para después** (`P35`). **Está en el MVP** | `modelo-datos.md` §5.1 y §7.6 |

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

Al cerrar el modelo relacional (`modelo-datos-decisiones.md`) quedaron dos cosas que no son
decisiones de modelo sino de roadmap:

**Checks de nube — SHOULD, y urgente.** De los 61 TEST del catálogo, los **11 de nube
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

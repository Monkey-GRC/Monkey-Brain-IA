# Arquitectura de Monkey

## Arquitectura funcional (las 4 capas)

```
CAPA DE EXPERIENCIA
  Onboarding guiado · Copiloto conversacional · Dashboard "¿Estamos bien?" ·
  Centro de Acciones · Sala de Auditoría
        │
CAPA DE RAZONAMIENTO (IA)
  Motor de IA: explica · detecta · prioriza · recomienda · redacta · predice
  Modelo contextual de la empresa (grafo de conocimiento)
        │
MOTOR DE COMPLIANCE │ MOTOR DE RIESGOS │ MOTOR DE EVIDENCIAS │ MOTOR DE INTEGRACIONES
  (mapeo multi-       (registro, scoring,  (recolección,       (conectores cloud/
   framework)          tratamiento)         versionado, cadena   on-prem/agentes,
                                             de custodia)         incluye Wazuh)
        │
CAPA DE DATOS Y ACTIVOS
  Inventario de activos · Personas · Políticas · Vendors · Configuraciones · Logs
```

Los cuatro motores son **independientes del framework**: ninguno "sabe" nativamente qué es SOC 2 o ISO 27001. Una capa de mapeo traduce **controles atómicos** (p. ej. "MFA obligatorio para administradores") a los requisitos de cada framework soportado (ver `frameworks/`). Este es el "pecado original" que Monkey evita: modelar el producto alrededor de un solo framework y parchear los demás encima, que es lo que hace ilegibles a las herramientas GRC clásicas.

## Modelo de datos — entidades núcleo

```
Organización (tenant)
 ├─ Personas             (empleados, contratistas, roles, estado MFA, offboarding)
 ├─ Activos              (repos, servidores, endpoints, bases de datos, servicios SaaS)
 ├─ Vendors              (terceros, subprocesadores, nivel de riesgo, contratos/DPA)
 ├─ Políticas            (versión, dueño, fecha de aprobación, destinatarios, aceptación)
 ├─ Controles atómicos   (unidad mínima reutilizable entre frameworks)
 ├─ Requisitos_Framework (mapeo N:M entre Controles atómicos y cada framework)
 ├─ Evidencia            (origen, tipo, timestamp, hash de integridad, control(es) que soporta)
 ├─ Riesgos              (activo/proceso afectado, probabilidad, impacto, tratamiento, dueño)
 ├─ Hallazgos            (instancia concreta de incumplimiento)
 ├─ Acciones             (remediación: qué, quién, cuándo, evidencia requerida al cerrar)
 └─ Eventos_Auditoría    (log inmutable de todo cambio de estado del sistema)
```

**Decisión clave del Data Architect**: `Controles atómicos` es independiente de framework y se conecta a `Requisitos_Framework` con una tabla N:M. Un mismo control (p. ej. "acceso administrativo requiere MFA") satisface simultáneamente CC6.1 de SOC 2, el control 8.5 de ISO 27001:2022 Annex A, y el Requisito 8.4 de PCI DSS v4.0.1 sin triplicar el trabajo de evidencia. Este modelo es el activo más valioso del producto: agregar un framework nuevo después es mapear controles existentes a nuevos requisitos, no reconstruir el producto.

## Los 4 motores

### Motor de Compliance
Mantiene el mapa vivo entre controles atómicos y requisitos de cada framework, calcula el "readiness" (cualitativo: Preparado / Casi listo / Requiere trabajo — nunca solo un % desnudo), y traduce cada brecha a lenguaje de negocio con la plantilla de 7 campos (`philosophy.md`). Incluye gestión de excepciones auditable cuando un control no aplica.

### Motor de Riesgos
Identificación automática (a partir de hallazgos de conectores, incluido Wazuh) y manual (riesgos de proceso). Scoring probabilidad × impacto, pero nunca expuesto crudo al usuario de negocio — se traduce a Alto/Medio/Bajo + frase de impacto. Incluye registro básico de riesgo de vendors integrado (no un módulo aparte).

### Motor de Evidencias
Toda evidencia conserva origen, fecha, responsable, versión e integridad verificable (hash) — es lo primero que pide un auditor. Tipos: automática (conectores, incluido Wazuh), operativa (logs/alertas), documental (políticas, contratos), generada por IA (siempre etiquetada como tal, nunca presentada como evidencia primaria). Cadena de custodia append-only: una nueva versión nunca sobrescribe.

### Motor de Integraciones
Dos patrones: (a) conectores API-first para SaaS/cloud (OAuth, rotación de credenciales) y (b) un **agente ligero descargable** para entornos on-prem (incluye o se apoya en Wazuh — ver `wazuh.md`) que reporta por canal saliente cifrado, sin abrir puertos entrantes al datacenter del cliente.

## Stack técnico de referencia

| Capa | Elección | Por qué |
|---|---|---|
| Backend core | Monolito modular (no microservicios prematuros), runtime tipado (TypeScript/Node o Go) | Más barato de operar para un equipo de 10-20 ingenieros; extraer servicios solo cuando la escala lo exija — decisión del Principal Software Architect |
| Base de datos transaccional | PostgreSQL con row-level security multi-tenant | Estándar de la industria, JSONB para evidencia heterogénea sin sacrificar integridad relacional |
| Grafo de conocimiento contextual | Base de grafos o modelado de grafo sobre Postgres | El modelo contextual (activos↔personas↔riesgos↔controles↔evidencia) es intrínsecamente un grafo |
| Búsqueda de evidencia | Índice vectorial + full-text | RAG para que la IA ancle respuestas a datos reales del tenant |
| Cola de eventos | Broker de eventos (Kafka o equivalente gestionado) | Desacopla conectores de alta variabilidad (incluido el flujo de alertas de Wazuh) del motor de compliance |
| Orquestación de agentes/colectores | Workers en contenedores + agente ligero on-prem | Ver `wazuh.md` |
| Frontend | SPA con estados de carga narrados (nunca spinners mudos) | Filosofía de producto — ver `philosophy.md` |

## Principios de arquitectura no negociables

- **Multi-tenant con aislamiento fuerte** en almacenamiento e inferencia de IA — el AI Security Expert lo marca como riesgo #1 del producto.
- **Arquitectura basada en eventos**: cada hallazgo de un conector (incluido Wazuh) es un evento inmutable que alimenta el motor de compliance y el de IA, permitiendo auditar "qué sabía el sistema y cuándo".
- **Separación estricta entre el plano de datos del cliente y el plano de inferencia de IA**: los prompts al LLM nunca incluyen credenciales ni secretos.
- **API-first**: toda funcionalidad de la UI pasa por la misma API pública versionada.

## Lo que se vetó explícitamente

- Microservicios desde el día uno (**NO BUILD** en el MVP — deuda organizacional sin el dolor de escala que la justifique).
- Modelar el producto por framework en vez de por controles atómicos (rechazado por el auditor SOC 2 y el auditor ISO 27001 del panel: produce evidencia duplicada y es "un repositorio de archivos con etiquetas", no un producto).

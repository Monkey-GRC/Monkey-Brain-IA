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
  Servicios · Scope/Alcance · Insumos de revisión (apps, BD, servidores,
  nubes, documentación) · Responsables · Configuraciones · Logs
```

Los cuatro motores son **independientes del framework**: ninguno "sabe" nativamente qué es SOC 2 o ISO 27001. Una capa de mapeo traduce **controles atómicos** (p. ej. "MFA obligatorio para administradores") a los requisitos de cada framework soportado (ver `cumplimiento/frameworks/`). Este es el "pecado original" que Monkey evita: modelar el producto alrededor de un solo framework y parchear los demás encima, que es lo que hace ilegibles a las herramientas GRC clásicas.

## Modelo de datos — entidades núcleo

El modelo relacional completo, con atributos, cardinalidades y diagrama, vive en `modelo-datos.md`. Resumen de la estructura:

```
Empresa / tenant (`companies`)          — existe desde Monkey Admin; lleva el aislamiento
 └─ Organización (`organizations`)      — el negocio que declara el cliente dentro del tenant
     ├─ Responsables organizacionales   (COO, TI, Cumplimiento, Proceso, CISO, propietario del activo)
     ├─ Insumos de revisión             (los activos reales; cuelgan de la ORGANIZACIÓN, no
     │                                   del servicio — se vinculan vía `service_assets`)
     ├─ Riesgos del cliente             (qué puede salir mal; impacto, probabilidad)
     │   └─ Causas                      (N:M — por qué está pasando)
     │       └─ Controles del cliente   (N:M — la medida que lo ataca)
     └─ Servicios                       (lo que se certifica; unidad de evaluación)
         ├─ Scope / Alcance             (lo declarado: cuántos servidores, nubes, apps, BD)
         ├─ Marcos contratados          (por servicio — SOC 2, ISO 27001, PCI DSS…)
         └─ Evaluaciones                (histórico inmutable) → Hallazgos (dónde falla)

Catálogo maestro (global, sin tenant)   — lo cura Monkey; existe antes de cualquier cliente
 ├─ Marcos
 │   └─ Requisitos                      (CC6.1, A.8.5… — pertenecen al marco)
 │       └─ Puntos de enfoque           (el punto de anclaje: el control se vincula AQUÍ)
 └─ Controles atómicos                  (independientes del marco; se vinculan a puntos de enfoque)
     ├─ Dimensiones aplicables          (Política/Documental, Servidor, Base de datos, App, Nube)
     ├─ Plan de testeo                  (criterio de auditor: pasos dependientes, población, muestreo)
     ├─ Tests                           (por dimensión; con banderas requiere-sonda / requiere-IA /
     │   │                               confirmación humana del cumplimiento)
     │   └─ Exclusiones                 (checks que no se miden, con justificación)
     ├─ Evidencia requerida             (qué se exige y quién responde) → entregada (archivo + hash)
     └─ Medición                        (peso y fórmula por dimensión; default lineal)

Capa de operación técnica (Motor de Integraciones — ver modelo-datos.md §8):
 Capacidad automática (sonda, con proveedor interno)
  └─ Aprovisionamiento por activo  (conexión validada + cobertura técnica 18/18)
      └─ Regla de schedule         (cada cuánto corre, sobre qué grupo de activos)
          └─ Ejecución             (progreso, estado, reintento) → Resultados + Logs técnicos
```

El cumplimiento de un marco **se deriva** recorriendo requisitos → puntos de enfoque →
controles. Nunca se almacena como atributo del marco. Y el activo cuelga de la
**organización**, no del scope de un solo servicio (decisión A2).

**Decisión clave del Data Architect**: el Control es **atómico e independiente del marco**. No se vincula a un framework, se vincula a **Requisitos**, y son los requisitos los que pertenecen a un marco (`Marco 1:N Requisito`, `Requisito N:M Control`). Un mismo control (p. ej. "acceso administrativo requiere MFA") satisface simultáneamente CC6.1 de SOC 2, el control 8.5 de ISO 27001:2022 Annex A, y el Requisito 8.4 de PCI DSS v4.0.1 sin triplicar el trabajo de evidencia.

Por eso el riesgo tampoco cuelga del marco: cuelga del **servicio** — es algo que le pasa al servicio, exista o no un estándar persiguiéndose. El marco entra por el otro extremo, vía requisitos. Y el cumplimiento del marco **se deriva** de recorrer `requisitos → controles`, nunca se almacena como atributo.

**El cumplimiento se mide por servicio, no por organización**: cada servicio tiene su propio porcentaje frente al marco y no existe un consolidado de empresa — igual que una certificación real, que se emite sobre un sistema definido. Y **un control está cumplido solo al 100%**; por debajo está fallando, señalando en qué dimensión y sobre qué insumo.

**Una ejecución no es una evaluación.** La capa técnica registra "corrió la sonda sobre este activo"; el Motor de Compliance registra "se midió el cumplimiento de este control". Colapsarlas impide distinguir *el control falla* de *la conexión falla*, que es la distinción central del Centro de Control Técnico (`assets/draft-BLUEPRINT FUNCIONAL-ControlTecnico.docx`). Y la **frecuencia de evaluación vive en la regla del schedule**, por grupo de activos, no como atributo del control.

Este modelo es el activo más valioso del producto: agregar un framework nuevo después es mapear controles existentes a nuevos requisitos, no reconstruir el producto.

## Los 4 motores

### Motor de Compliance
Mantiene el mapa vivo entre controles atómicos y requisitos de cada framework, calcula el "readiness" (cualitativo: Preparado = 100%, Casi listo = 80% o más, Requiere trabajo = menos — nunca solo un % desnudo), y traduce cada brecha a lenguaje de negocio con la plantilla de 7 campos (`philosophy.md`). Incluye gestión de excepciones auditable cuando un control no aplica.

### Motor de Riesgos
Identificación automática (a partir de hallazgos de conectores, incluido Wazuh) y manual (riesgos de proceso). Scoring probabilidad × impacto, pero nunca expuesto crudo al usuario de negocio — se traduce a Alto/Medio/Bajo + frase de impacto. Incluye registro básico de riesgo de vendors integrado (no un módulo aparte).

### Motor de Evidencias
Toda evidencia conserva origen, fecha, responsable, versión e integridad verificable (hash) — es lo primero que pide un auditor. Tipos: automática (conectores, incluido Wazuh), operativa (logs/alertas), documental (políticas, contratos), generada por IA (siempre etiquetada como tal, nunca presentada como evidencia primaria). Cadena de custodia append-only: una nueva versión nunca sobrescribe.

### Motor de Integraciones
Dos patrones: (a) conectores API-first para SaaS/cloud (OAuth, rotación de credenciales) y (b) un **agente ligero descargable** para entornos on-prem (incluye o se apoya en Wazuh — ver `wazuh.md`) que reporta por canal saliente cifrado, sin abrir puertos entrantes al datacenter del cliente.

## Stack técnico de referencia

| Capa | Elección | Por qué |
|---|---|---|
| Backend core | Monolito modular, no microservicios prematuros. **Ya elegido y en uso: NestJS 11 + TypeScript 5.7 + Prisma 7** (ver `context/project-context.md`) | Más barato de operar para un equipo de 10-20 ingenieros; extraer servicios solo cuando la escala lo exija — decisión del Principal Software Architect |
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

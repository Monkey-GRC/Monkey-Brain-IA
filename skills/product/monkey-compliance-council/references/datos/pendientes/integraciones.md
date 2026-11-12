# Pendientes del comité — Integraciones

Preguntas abiertas que afectan a [Integraciones](../../arquitectura/integraciones/README.md). **Si una sigue aquí, no se resuelve por cuenta propia: se pregunta.** Tablero y reglas: [`README.md`](README.md).

## P44 · Qué checks de GitHub cuentan y a qué pruebas y controles van

**Estado:** abierto desde 2026-11-12. Fuente: planificación de integraciones (MD-211). El motor de nube trae 27 checks para GitHub (organización, repositorios y Actions; verificado con la imagen 5.44.0). Sin la cadena check → prueba → control ratificada, un resultado **no cuenta** (D56).

1. **¿Qué checks de GitHub se cargan al catálogo?** ¿Todos o solo los que el comité elija?
2. **¿A qué pruebas van?** No existe ninguna prueba para repositorios de código: ¿se crean pruebas nuevas, con qué código y qué dimensión?
3. **¿A qué controles y requisitos de SOC 2** se vinculan (por ejemplo, gestión de cambios y vulnerabilidades)?

**Qué depende:** conectar GitHub de verdad; hoy está `coming_soon` (D110).

## P45 · En qué categoría de activo entra GitHub

**Estado:** abierto desde 2026-11-12. Fuente: planificación de integraciones (MD-211). Las categorías de activo son las de la hoja «Activos del Servicio (SCOPE)» del comité (`ac_01` a `ac_06`, D67) y ninguna corresponde a un repositorio de código.

1. **¿Se agrega una categoría nueva** (por ejemplo `ac_07` «Repositorios de código»), con su frecuencia y sus canales?
2. **¿Qué es el activo:** la organización de GitHub, cada repositorio, o la organización con sus repositorios como recursos hijos (como la cuenta de nube, D53)?
3. **¿Con qué canal se conecta?** Propuesta de desarrollo: una aplicación de GitHub de Monkey, de solo lectura, que instala el dueño de la organización; por cliente solo se guarda su instalación, no un secreto.

**Qué depende:** el flujo de conexión de GitHub y su `connection_method`.

## P46 · Qué hace la integración con Jira

**Estado:** abierto desde 2026-11-12. Fuente: planificación de integraciones (MD-211). Jira no mide nada: es una integración de gestión (`workflow`, D110).

1. **¿Solo remediación** (crear un ticket asignado desde un hallazgo o un control que falla y seguir su estado) **o también evidencia** (por ejemplo, que los incidentes y las bajas se cierren en plazo)?
2. **¿Quién conecta Jira y con qué permisos?** (una aplicación de Atlassian de Monkey, con cuenta de servicio del cliente).
3. **¿Desde qué pantallas** se crea un ticket, y quién puede crearlo (`admin_empresa`, `responsable`, `delegado`)?

**Qué depende:** conectar Jira; hoy está `coming_soon` (D110).

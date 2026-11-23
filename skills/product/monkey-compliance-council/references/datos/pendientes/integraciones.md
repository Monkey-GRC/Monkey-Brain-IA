# Pendientes del comité — Integraciones

Preguntas abiertas que afectan a [Integraciones](../../arquitectura/integraciones/README.md). **Si una sigue aquí, no se resuelve por cuenta propia: se pregunta.** Tablero y reglas: [`README.md`](README.md).

## P45 · En qué categoría de activo entra GitHub

**Estado:** abierto desde 2026-11-12. Fuente: planificación de integraciones (MD-211). Las categorías de activo son las de la hoja «Activos del Servicio (SCOPE)» del comité (`ac_01` a `ac_06`, D67) y ninguna corresponde a un repositorio de código.

1. **¿Se agrega una categoría nueva** (por ejemplo `ac_07` «Repositorios de código»), con su frecuencia y sus canales?
2. **¿Qué es el activo:** la organización de GitHub, cada repositorio, o la organización con sus repositorios como recursos hijos (como la cuenta de nube, D53)?
3. **¿Con qué canal se conecta?** Propuesta de desarrollo: una aplicación de GitHub de Monkey, de solo lectura, que instala el dueño de la organización; por cliente solo se guarda su instalación, no un secreto.

**Qué depende:** el flujo de conexión de GitHub y su `connection_method`.

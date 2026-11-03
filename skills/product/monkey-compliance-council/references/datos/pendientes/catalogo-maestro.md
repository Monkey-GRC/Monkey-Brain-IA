# Pendientes del comité — Catálogo maestro

Preguntas abiertas que afectan a [Catálogo maestro](../../arquitectura/catalogo-maestro/README.md). **Si una sigue aquí, no se resuelve por cuenta propia: se pregunta.** Tablero y reglas: [`README.md`](README.md).

## P9 · Datos del Excel que hay que corregir o confirmar

Inconsistencias **dentro del propio archivo del comité**, que el seed carga tal cual sin adivinar (D38):

- **Pruebas de aplicación.** La matriz *Análisis TEST x Control* asigna a 17+5+1+2+1+1 = 27 pares control↔prueba
  seis pruebas `T-APP-001…006` que no existen en la hoja *Pruebas* (la hoja marca *"FALTAN 6"*), y la hoja
  *Pruebas* tiene seis sin usar en la matriz: `T-SRV-011…014`, `T-BD-009` y `T-BD-010`. Sus controles coinciden
  en 94-100%, así que probablemente son las mismas pruebas con otro código y otra dimensión. **Hoy la
  dimensión Aplicación no tiene ninguna prueba.** ¿Son pruebas de aplicación (se recodifican a `T-APP` y
  `app`) o de servidores/BD (se corrige la matriz)?
- **Diez causas sin riesgo.** F003, F004, F016, F020, F026, F034, F042, F045, F053 y F054 no aparecen en ninguna
  de las 92 relaciones riesgo↔causa. ¿A qué riesgo(s) pertenecen o se descartan?

- **Tipos de pérdida de un riesgo.** La hoja *Riesgos* usa «Interrupción de la operación» en dos riesgos e «Interrupción o cierre de la operación» en otros dos. ¿Son el mismo tipo de pérdida? El contrato los trata como uno solo (`operation_interruption`): **decisión de desarrollo del 2026-10-17**; el comité lo ratifica al revisar el Excel.

**Qué depende:** la dimensión Aplicación del cálculo (§2, §9) qué causas ve el cliente al clonar (§7.2) y los valores de `loss_type`.

---

## P21 · El uso de los logos de marcas de terceros

**Estado:** abierto desde 2026-10-10 (D67). No bloquea construir el marketplace: condiciona publicarlo con logos a clientes reales.

El paso 3 muestra el logo en SVG de cada plataforma (AWS, Azure, GCP, Microsoft 365, Google Workspace, Linux, Windows, PostgreSQL, Oracle…). Las marcas son de terceros y varias
tienen guías de uso: logo oficial sin modificar, espacio libre mínimo, a veces una leyenda.

1. ¿Se tiene permiso o se revisó la guía de marca de cada proveedor para mostrar su logo en la plataforma?
2. ¿Quién entrega los SVG oficiales y dónde se guardan?
3. ¿Basta con un aviso en la plataforma («las marcas pertenecen a sus titulares») o se necesita algo más?

**Procedencia hoy** (`DT-68`): colecciones de iconos de marca, no los kits de cada proveedor. Simple Icons: Linux, HP (para HP-UX), PostgreSQL, MySQL, Oracle y MongoDB · Devicon: AWS, Azure, GCP, SQL Server y un icono genérico de Unix (para Solaris) · Logos: Microsoft (para Microsoft 365), la «G» de Google (para Google Workspace), Windows, AIX y Apple (para macOS). Cinco son una sustitución por la marca dueña del producto, no el logo propio de ese producto.

**Qué depende:** los logos de `Frontend-Platform` (`logo_key`, D67) y la publicación del marketplace.

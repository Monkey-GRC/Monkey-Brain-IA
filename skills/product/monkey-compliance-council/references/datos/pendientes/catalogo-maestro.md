# Pendientes del comité — Catálogo maestro

Preguntas abiertas que afectan a [Catálogo maestro](../../arquitectura/catalogo-maestro/README.md). **Si una sigue aquí, no se resuelve por cuenta propia: se pregunta.** Tablero y reglas: [`README.md`](README.md).

## P9 · Tipos de pérdida de un riesgo escritos de dos formas en el libro

**Estado:** abierto desde 2026-10-17; revisado contra la VF18 el 2026-11-22. Los dos primeros puntos (las pruebas de aplicación inexistentes y las causas sin riesgo) los cerró la VF18: hay 23 pruebas de la dimensión Aplicación y las 100 causas tienen riesgo y control (D129).

- **Tipos de pérdida de un riesgo.** La hoja *Riesgos* usa «Interrupción de la operación» en R003 y R004 e «Interrupción o cierre de la operación» en R005 y R009, y el comentario de la columna `Impacto_Potencial` solo lista el segundo. ¿Son el mismo tipo de pérdida? El contrato los trata como uno solo (`operation_interruption`): **decisión de desarrollo del 2026-10-17**, que el comité ratifica al revisar el libro.

**Qué depende:** los valores de `loss_type`.

---

## P21 · El uso de los logos de marcas de terceros

**Estado:** abierto desde 2026-10-10 (D67). No bloquea construir el marketplace: condiciona publicarlo con logos a clientes reales.

El paso 3 muestra el logo en SVG de cada plataforma (AWS, Azure, GCP, Microsoft 365, Google Workspace, Linux, Windows, PostgreSQL, Oracle…). Las marcas son de terceros y varias
tienen guías de uso: logo oficial sin modificar, espacio libre mínimo, a veces una leyenda.

1. ¿Se tiene permiso o se revisó la guía de marca de cada proveedor para mostrar su logo en la plataforma?
2. ¿Quién entrega los SVG oficiales y dónde se guardan?
3. ¿Basta con un aviso en la plataforma («las marcas pertenecen a sus titulares») o se necesita algo más?

**Procedencia hoy** (`DT-68`): colecciones de iconos de marca, no los kits de cada proveedor. Simple Icons: Linux, HP (para HP-UX), PostgreSQL, MySQL, Oracle, MongoDB, GitHub y Jira (estos dos, MD-211) · Devicon: AWS, Azure, GCP, SQL Server y un icono genérico de Unix (para Solaris) · Logos: Microsoft (para Microsoft 365), la «G» de Google (para Google Workspace), Windows, AIX y Apple (para macOS). Cinco son una sustitución por la marca dueña del producto, no el logo propio de ese producto.

**Qué depende:** los logos de `Frontend-Platform` (`logo_key`, D67) y la publicación del marketplace.

## P51 · VUL-1 y VUL-2 dependen uno del otro en `TEST_CHECKS`: ¿es intencional?

**Estado:** abierto desde 2026-11-27. Nace de una falla del motor (MD-501): en la VF18, `T-VUL-1-07` es Dependencia de checks cuyo dueño es VUL-2 (`T-VUL-2-04`, `T-VUL-2-06`), y esas dos pruebas son Dependencia de checks cuyo dueño es VUL-1 (`T-VUL-1-07`). Es el único ciclo del catálogo.

1. ¿La dependencia en los dos sentidos es intencional, o una de las dos filas debería ser Directo o Complementario?
2. Si es intencional: ¿se ratifica que las pruebas del ciclo comparten estado (el peor entre los checks propios de todas, D163)?

**Qué depende:** nada bloquea. Mientras tanto rige D163.

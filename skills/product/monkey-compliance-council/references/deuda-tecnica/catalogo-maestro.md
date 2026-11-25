# Deuda técnica — Catálogo maestro

Parches vigentes de [Catálogo maestro](../arquitectura/catalogo-maestro/README.md). Tablero y reglas: [`README.md`](README.md).

## Marketplace de plataformas (D67)

### DT-68 · Los logos no vienen del kit de cada marca

🟡 Mejora

- **Qué está parchado:** Los 18 iconos de `Frontend-Platform/public/providers/` (cada uno con su variante `-dark.svg`) salen de colecciones de iconos de marca (Simple Icons, Devicon y Logos), no de los kits de cada proveedor. Varios son una **sustitución**: Microsoft 365 usa el logo de Microsoft, Google Workspace la «G» de Google, HP-UX el logo de HP, macOS el de Apple y Solaris un icono genérico de Unix. Oracle, AIX y SQL Server no se ven tan nítidos como los demás
- **Por qué:** Cada kit es un portal distinto y los kits traen logos de distinta forma y peso; una fuente de iconos cuadrados permitió que todos se vean del mismo tamaño en los dos temas
- **Qué lo cierra:** Resolver el uso de marcas (`P21`), reemplazar cada icono por el del kit oficial de su plataforma (con su versión para tema oscuro) y revisar que sigan viéndose del mismo tamaño

## Idioma del catálogo

### DT-100 · El catálogo del comité solo está en español

🟠 Importante

- **Qué está parchado:** Controles, requisitos, puntos de enfoque, riesgos, causas y evidencias requeridas tienen un solo texto, en español: con la aplicación en inglés, Cumplimiento los muestra en español. Solo las 11 pruebas de nube tienen nombre en inglés (`catalog.tests.display_name_en`, MD-211), escrito por desarrollo y sin revisar (como DT-21).
- **Por qué:** El Excel del comité trae un solo idioma y el modelo guarda un texto por fila; traducir todo el catálogo excedía MD-211.
- **Qué lo cierra:** MD-212: el contenido del catálogo en inglés con su procedencia (como D90 con los checks), servido según `Accept-Language`, y la revisión del inglés por el comité (DT-21). Con la VF18 aplica al catálogo v2: lo traduce desarrollo con IA y lo revisa el comité (D142, MD-513).

### DT-113 · Transición del catálogo v1 al v2: tablas v1 vacías, puentes y Admin en solo lectura

🟠 Importante

- **Qué está parchado:** con la carga v2 (MD-491, D139) siguen en el schema, vacías o nulas, las tablas y columnas de la v1 (`policies`, `control_policies`, `evidence_templates`, `control_evidence_templates`, `control_measurements`, `test_plans`, los textos v1 de `tests`, `causes.name`/`failure_category`, `risk_causes.code`). La carga alimenta puentes para el código v1: `control_tests`, `control_dimensions.type` derivado del tipo del control, y el clonado crea los requerimientos de evidencia desde `control_documents`. La escritura de Monkey Admin responde `409 CATALOG_READ_ONLY`; sus casos de uso y DTOs v1 siguen detrás del guard. Conviven dos enums de tipo de control (`control_type` v1 del cliente y `catalog.control_type` v2, servido como `catalog_control_type`) y la causa guarda su origen en `cause_origin`. Las pruebas de proceso, físico, red y endpoint no tienen sobre qué medirse
- **Por qué:** retirar la v1 obligaba a rehacer clonado, motor, evidencia, riesgos y Admin en el mismo ticket y a adelantar el diseño de RC-06 a RC-09 (D139)
- **Qué lo cierra:** las fases 2 y 3 de la VF18 (`producto/mvp-roadmap.md`): el motor v2 (RC-06, RC-08) y la gestión y Documentos (RC-07, RC-09) leen las tablas v2, el clonado copia requisitos del control y dimensiones v2, se reescribe la administración del catálogo v2, y una migración retira lo v1 y renombra los enums

### DT-69 · Las dimensiones de cada control no coinciden con las que define el comité

🟠 Importante

- **Qué está parchado:** D39 derivó las dimensiones de cada control de las pruebas y sembró **210** filas en `control_dimensions` (118 documentales, 43 de servidores, 18 de bases de datos, 31 de nube, ninguna de aplicación). El comité las define en la hoja `Controles Monkey`, columnas L a P (D68): **191** (118, 25, 17 y 31; aplicación «NO APLICA» en los 118 controles). La hoja `Análisis TEST x Control` da otra cifra y las dos hojas no coinciden en 6 celdas (IAC-1, IAC-7, IAC-8, IAC-9, IAC-12 en servidores y MON-3 en bases de datos)
- **Por qué:** Se derivaron de las pruebas antes de que el comité entregara el motor de evaluación (D68). Una dimensión de más o de menos cambia qué controles quedan `INCOMPLETO`
- **Qué lo cierra:** la carga del catálogo v2 (RC-01): la VF18 trae las 9 dimensiones explícitas por control (D129); `catalog:verify` valida los totales de la tabla 10. **Hecho en el catálogo (MD-491)**; falta que el clonado al cliente copie las dimensiones v2 en lugar del puente (`DT-113`)

## Registro de empresa, contrato de marcos (D47) y activación de la cuenta (D51)

### DT-38 · Las categorías de cada marco siguen siendo las 5 de SOC 2

🟠 Importante

- **Qué está parchado:** El comité confirmó (opción 2, D50) que cada marco use sus categorías nativas (ISO 27001: 4 temas; PCI DSS: 12 requisitos; NIST CSF: 6 funciones…), pero `requirements.trust_criterion_id` es una FK a `trust_criteria` (enum de los 5 TSC) y `service_trust_criteria` filtra con ellas. Hoy no estorba porque solo SOC 2 está construido
- **Por qué:** Sin segundo marco construido, migrar el modelo sería un cambio grande sin uso
- **Qué lo cierra:** Al sembrar el primer marco que no sea SOC 2: generalizar `trust_criteria` a **dominios por marco** (`framework_id`, `code`, `name`, `is_mandatory`) y `service_trust_criteria` a `service_framework_domains`. Mientras tanto, la pantalla pregunta por «categorías de SOC 2»

### DT-40 · La lista de 18 normas de protección de datos la depuró desarrollo, no el comité

🟡 Mejora

- **Qué está parchado:** Salió PCI DSS y entraron la Ley 21.719 (CL), y las de UY, EC, PA y CR; las leyes con su vigencia están verificadas en fuentes públicas pero no se contrastaron con el Excel del comité
- **Por qué:** El comité pidió depurar la lista y delegó la investigación
- **Qué lo cierra:** Que el comité ratifique la lista. Mientras tanto, empresas que marcaron PCI DSS perdieron esa marca (la migración la borró)

### DT-119 · El catálogo de Admin no deja crear pruebas de las cuatro dimensiones nuevas

🟡 Mejora

- **Qué está parchado:** `TEST_PREFIX_TO_DIMENSION` (`catalog-admin/application/use-cases/catalog-write.use-cases.ts:51,63`) solo conoce 5 dimensiones; desde MD-499 el DTO admite las 9, y crear una prueba `network`, `endpoint`, `physical` o `process` responde `422 code.dimension_mismatch`
- **Por qué:** la edición del catálogo v2 en Admin es de MD-510 (hoy en solo lectura); MD-499 solo unificó la lista de dimensiones
- **Qué lo cierra:** MD-510: prefijos del catálogo v2 (`T-RED-`, `T-IDA-`…) y contrato `catalogo-maestro.md` al día

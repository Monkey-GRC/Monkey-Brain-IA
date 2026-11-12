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
- **Qué lo cierra:** MD-212: el contenido del catálogo en inglés con su procedencia (como D90 con los checks), servido según `Accept-Language`, y la revisión del inglés por el comité (DT-21).

### DT-69 · Las dimensiones de cada control no coinciden con las que define el comité

🟠 Importante

- **Qué está parchado:** D39 derivó las dimensiones de cada control de las pruebas y sembró **210** filas en `control_dimensions` (118 documentales, 43 de servidores, 18 de bases de datos, 31 de nube, ninguna de aplicación). El comité las define en la hoja `Controles Monkey`, columnas L a P (D68): **191** (118, 25, 17 y 31; aplicación «NO APLICA» en los 118 controles). La hoja `Análisis TEST x Control` da otra cifra y las dos hojas no coinciden en 6 celdas (IAC-1, IAC-7, IAC-8, IAC-9, IAC-12 en servidores y MON-3 en bases de datos)
- **Por qué:** Se derivaron de las pruebas antes de que el comité entregara el motor de evaluación (D68). Una dimensión de más o de menos cambia qué controles quedan `INCOMPLETO`
- **Qué lo cierra:** Cargar `control_dimensions` desde `Controles Monkey` L a P, reconciliar las 6 celdas con el comité y actualizar `catalog:verify`

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

## Funcionalidad que el brain menciona y aún no tiene contrato

### DT-25 · Ver el catálogo maestro SOC 2 en Monkey Admin y poder crear un control, riesgo o causa nuevos

🟠 Importante

- **Qué:** El principio está en `modelo-datos.md` §3 y D9/D31, pero no hay contrato, pantallas ni épico
- **Nota:** Primero un contrato en `contracts/` (qué campos, cómo se vincula un control nuevo, cuándo se publica la versión, A4)

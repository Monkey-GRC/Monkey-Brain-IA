# Modelo de datos — §0 Fuentes

> Parte de [`modelo-datos.md`](../modelo-datos.md) (índice). **Qué responde:** Qué documento del comité define qué y dónde quedó transcrito cada uno. **Léelo:** Para saber de dónde sale una regla o una cifra, o si una fuente falta.
> Los números de sección (§) se conservan: cualquier cita a «§0» apunta aquí.

## 0. Fuentes

Las produce el **comité funcional** y son la fuente de verdad: ante una discrepancia con este
archivo, **gana el documento**. Y si lo construido o una decisión anterior choca con el documento, **se hace como dice el documento** (D128).

### La que queda en el repo

`assets/TSC INTERGRAL SOC 2 DETALLADO VF18_DEV.xlsx` — **la fuente maestra** desde el 2026-11-22 (D128). Es la **versión 2 del catálogo**: reemplaza por completo a la VF2 del 2026-10-10, y no hay equivalencia oficial entre los códigos de una y otra (los controles se renombraron, se fusionaron y se crearon nuevos). El archivo no se versiona en git (`.gitignore`): vive en la carpeta compartida del equipo; qué es cada archivo de `assets/` está en [`assets/README.md`](../../../../../../assets/README.md).

**Cómo se lee.** La hoja `00_LEEME` da el orden de lectura y el **ámbito de datos** de cada hoja (catálogo global, plantilla por cliente, reglas del motor o guía). La hoja `01_DESARROLLO` es la **guía de integración** que el comité escribió para desarrollo: 16 reglas de lectura (`DEV-01` a `DEV-16`), dónde quedó cada hoja de la VF2, qué cambia del catálogo, 21 requerimientos de cambio (`RC-01` a `RC-21`), qué pasa con las reglas `RN` y `REQ`, las preguntas que responde, el mapa al modelo de datos, las listas de valores, la marca blanca y el orden de carga con sus totales. Tres reglas de lectura que se olvidan con facilidad:

- **Los encabezados están en la fila 1**, salvo en `Controles Monkey` (fila 2). Varias celdas traen **varios códigos** separados por `; ` o `, ` según la columna, y un valor puede contener comas («Logs, SIEM y monitoreo» es uno solo) (DEV-04, DEV-05).
- **Las celdas con fórmula valen por lo que muestran**; las notas, los colores y los gráficos **no son datos** (DEV-06).
- **Lo que el libro no define se mantiene como está** en el desarrollo (DEV-16): la agregación por categoría y por marco, la fecha de corte, el semáforo del activo, el onboarding, la conexión de activos y el tratamiento del error técnico de un check.

**Qué define cada hoja y dónde quedó:**

| Hoja | Ámbito | Qué define | Transcrita en |
|---|---|---|---|
| `00_LEEME` | Guía | Orden de lectura, ámbito de cada hoja y los **principios P1 a P7** del modelo | §9 (los principios) |
| `01_DESARROLLO` | Guía | La guía de integración (arriba) | D128 a D138 |
| `Portada` | Catálogo | El marco (SOC 2 TSC) y el logo | — |
| `Modelo de Gestión usuarios` | Reglas | **6 roles** (se agrega `colaborador`), la matriz de permisos con el módulo Documentos (Tabla 2), los parámetros de contraseña que Monkey recomienda al implementador (Tabla 3) y los de la propia aplicación (Tabla 4) | §5, D136, D137 |
| `Contexto Empresa` · `Contexto del servicio` · `Activos del Servicio (SCOPE)` | Plantilla por cliente | Los formularios del onboarding y del servicio, con sus opciones literales y **comentarios de celda** con instrucciones (multi-select, el marco contratado en la celda de configuración `L3`, el foco del servicio), y los escenarios `AC-01` a `AC-06`. **Iguales a la VF2** | §6, [`arquitectura/onboarding/`](../../arquitectura/onboarding/README.md) |
| `Riesgos` | Catálogo | 10 riesgos (`R001`–`R010`) con **probabilidad e impacto inherentes** y su nivel según la matriz de `MAP CALOR`; el comentario de `Impacto_Potencial` dice que son solo **tipos de pérdida** | §7.2, D135 |
| `Causas` | Catálogo | 100 causas (`F001`–`F100`) con **origen** y **tipo**, sin nombre corto, y sus vínculos con riesgos (551) y controles (771) | §3, §7.2, D129 |
| `MAP CALOR` | Reglas | La matriz de calor y **el modelo de evaluación completo**: secciones 2 a 14 (cadena, estados, reglas por tipo de test, nivel del control, vigencia, flujo del implementador, mensaje de brecha, suficiencia, riesgo), los **parámetros `PR-01` a `PR-16`**, las reglas de integridad `IN-01` a `IN-10`, el flujo de documentos (`D-01` a `D-15`) y la gestión de responsables, delegados y aprobaciones (`G-01` a `G-11`) | §9, D131 a D135, D138 |
| `Controles Monkey` | Catálogo | 114 controles en 472 filas (control + criterio + punto de enfoque), con los puntos de evidencia requerida (columna L), documentos, tests, las **9 dimensiones** que aplica cada control, tipo, periodicidad sugerida y rol responsable sugerido | §3, D129 |
| `REQUISITOS` | Catálogo | **576 requisitos del control**: cada punto de la columna L, con su tipo, documentos, tests, periodicidad y obligatoriedad | §3, D129 |
| `TEST` | Catálogo | **472 pruebas**: 430 de un control (`T-<control>-nn`) y 42 documentales, una por documento (`T-DOC-…`) | §3, D129 |
| `TEST_CHECKS` | Catálogo | **4.684 vínculos** prueba–check con su **rol** (Directo, Complementario, Dependencia), objetivo común y condición de aplicación | §8, D130 |
| `PROCEDIMIENTOS` | Catálogo | 8 procedimientos estándar de prueba (`PE-DOC-01`, `PE-TEC-01`…) | §3, D129 |
| `INTEGRACIONES` | Catálogo | 14 categorías de integración, los controles que alimentan y la evidencia que aportan | §3, D129 |
| `Documentos` | Catálogo | 42 documentos con contenido mínimo, periodicidad de revisión, roles sugeridos (responsable y aprobador), origen y aceptación del personal | §3, §7, D134 |
| `MAPEO_MARCOS` | Catálogo | A qué requisito de cada marco responde cada control (hoy solo SOC 2: 472 filas) | §3, D129 |
| `8_MATRIZ_MAESTRA` | Catálogo | Los 61 criterios TSC y sus 302 puntos de enfoque | §3 |
| `Checks Wazuh` · `Checks prowler` | Catálogo | 11.352 checks de la sonda (77 políticas, 18 plataformas, versión 4.14.7) con su **título en español** y 218 remediaciones en español; 1.621 checks del motor de nube (20 plataformas, versión 5.45.0) con su severidad. Ambos con las columnas de mapeo a otros marcos | §8, D130 |

**Los totales que el desarrollo valida al cargar** (tabla 10 de `01_DESARROLLO`, recalculados de los datos crudos el 2026-11-22 y coinciden): 114 controles · 472 filas de `Controles Monkey` · 61 criterios TSC · 302 puntos de enfoque · 576 requisitos · 472 pruebas (43 documentales, 38 de población, 237 operativas, 154 técnicas) · 4.684 vínculos prueba–check (1.728 directos, 2.001 complementarios, 955 de dependencia) · 42 documentos · 100 causas · 10 riesgos · 551 vínculos riesgo–causa · 771 causa–control · 228 control–documento. Las reglas `IN-01` a `IN-10` se cumplen salvo dos detalles del propio libro: la fila de módulo «Detección de vulnerabilidades» es Directo en VUL-1 y VUL-2 (IN-07 pide un solo control) y R003/R004 usan «Interrupción de la operación» donde el resto dice «Interrupción o cierre de la operación» (`P9`).

**Marca blanca.** El libro es interno y nombra a los proveedores de la sonda y del motor de nube (126 pruebas y 38 controles en la columna L). El libro se guarda **intacto** en la base (Rod, 2026-11-25); ante el cliente se aplica la tabla 9 de `01_DESARROLLO` (D128, D70) al enviar el texto, con `clientText` (`Backend/src/common/text/provider-names.ts`), sobre los campos de `CLIENT_VISIBLE_TEXT_FIELDS` (`contracts/catalogo-maestro.md`).

**Lo que la VF2 tenía y la VF18 ya no trae** (tabla 2 de `01_DESARROLLO`): `PROMPT DESARROLLO MONKEY`, `Resumen`, `Claude Log`, `Hoja1` y `GRAFICO`. La infografía del motor y el mockup de «Estado de cumplimiento» de `GRAFICO` **dejan de ser material del comité**; el diseño de esa pantalla sale del modelo de `MAP CALOR`.

### Fuentes ya transcritas, cuyo archivo no está en el repo

El comité entregó estos documentos y su contenido **ya vive en el cerebro**. Se retiraron de
`assets/` para que no hubiera dos versiones de la misma verdad. Dónde quedó cada uno:

| Fuente original | Dónde está su contenido ahora |
|---|---|
| `TSC INTERGRAL SOC 2 DETALLADO VF2.xlsx` (2026-10-10) y `VF.xlsx` (2026-09-15) | **Reemplazadas por la VF18** (D128). Sus hojas `MODELO EVALUACIÓN MONKEY` y `REQUISITOS EVALUACIÓN MONKEY` (reglas `RN-01` a `RN-25`, `REQ-001` a `REQ-051`) siguen citadas en el cerebro: valen **solo donde no contradicen a `MAP CALOR`** (tabla 5 de `01_DESARROLLO`, §9). Sus 119 controles, 61 pruebas genéricas y 50 plantillas de evidencia son el **catálogo v1**, que se retira con el reset del entorno de desarrollo (D128) |
| `MONKEY_Ejemplo_Formula_Cumplimiento.xlsx` | §9: de él salieron las reglas R-01 a R-04, R-07, R-11 y R-12 (se conservan) y R-06 (la reemplazó el motor del comité, D68). No se usa para calcular |
| `RESUMEN-MODELO-USUARIOS-MONKEY.md` | §5: los roles (§5.1), las tablas (§5.2), las políticas de seguridad con su justificación normativa (§5.3), la matriz de permisos (§5.5) y el mapeo a TSC del modelo de acceso (§5.6) |
| `draft-BLUEPRINT FUNCIONAL-ControlTecnico.docx` | §8: `schedule_rules`, `executions`, `check_results`, `execution_logs`, `monitoring_domains` y las tres reglas de la operación técnica |
| `vision_controles.pptx` | Nada propio: su matriz de evaluación quedó superada por el ejemplo de fórmula |
| `ALCANCE-ONBOARDING-MVP.md` | `sprint-onboarding.md`: alcance, cronograma, prioridades y criterios de aceptación del sprint |
| `PROPUESTA-JIRA-MVP-MONKEY.md` | `mvp-roadmap.md`: los 12 épicos del MVP en orden de dependencia |

> ⚠️ **Un aviso que conviene no perder:** `RESUMEN-MODELO-USUARIOS-MONKEY.md` describía el
> backend como Node.js + Express y el frontend como React, con código de ejemplo en esa forma.
> **Era falso para este proyecto.** Su *modelo* (roles, permisos, tablas, audit trail) es el que
> está transcrito en §5 y es válido; su *implementación* no se copió. El stack real es
> **NestJS 11 + Prisma 7 + Angular 20 standalone** — ver `context/backend.md` y `context/frontend.md`.

### Fuera del repo, en `Monkey/` (carpeta hermana)

No están aquí a propósito: dos tienen datos operativos y uno credenciales.

| Archivo | Qué define |
|---|---|
| `soc2_detalle.py` | La lógica `bool_and`, el tercer veredicto `REVISAR`, la frescura de escaneos y los tres tags de compliance (`tsc` / `soc_2` / `nelson`) — §9 y `wazuh.md` |
| `conexion_api_wazuh_monkey.txt` | Endpoints, flujo del conector, la clave del check, los estados de resultado y la regla de confidencialidad. **Contiene credenciales en texto plano: no copiar a ningún repo; rotar esa password** |
| `Propuesta Proyecto Monkey-1.xlsx` | Alcance comercial de junio 2026 (vulnerabilidades, gestión documental, políticas, notificaciones). **Parcialmente superado**: su "consolidado global de cumplimiento" queda derogado por medir por servicio |
| `SOC2_TSC_Controles_Detallados_Monkey2.xlsx` | Anatomía de requisito, control del cliente y plan de testeo. ⚠️ **No se encuentra en disco**; la VF18 cubre lo mismo con `REQUISITOS` y `TEST` |

### Documentos que estas fuentes citan y no tenemos

Hay que conseguirlos o dejar de citarlos:

| Documento | Quién lo cita | Qué se pierde |
|---|---|---|
| Las hojas de trabajo interno del comité | `01_DESARROLLO` (DEV-01), `MAP CALOR` (`IN-06` cita la «regla 17» e `IN-07` la «regla 16») y `REQUISITOS` («regla 2») | El texto de esas reglas. Lo que exigen se lee en `IN-06`, `IN-07` y en la columna «Observación de armado»; el comité no las entregará (D140) |
| `prompt-user-management-model-monkey.md` | El resumen del modelo de usuarios, como el técnico de 2.500+ líneas | Ahí estaban respondidas: qué pasa si un `admin_empresa` se va, qué pasa con los datos si el cliente cancela, si los auditores externos necesitan MFA, cómo se revoca acceso de inmediato, y la matriz exhaustiva de permisos (la de §5.5 es el resumen) |
| `docs/plan-mapeo-cis-soc2.md` | El código de `monkey-cis-sync` | El plan del mapeo CIS↔SOC 2 |
| `Diseño Funcional APP` | La hoja de roles del archivo maestro | El detalle del modelo de accesos inicial |
| `Guia_Integracion_Wazuh_SCA_MONKEY.docx` | `conexion_api_wazuh_monkey.txt` | Documentación técnica del conector |
| `monkey_soc2_win11.yml` | `soc2_detalle.py` | La política SCA propia de Monkey. Vive en el servidor |

### Procedencia del catálogo de controles

El catálogo **v1** nació de la taxonomía de Vanta (la hoja *Tabla controles SOC 2* de la VF2 declaraba 119 registros extraídos de `app.vanta.com` el 25 de agosto de 2026) y se amplió con 61 TEST propios. La **v2** (VF18) renombró, fusionó y creó controles con prefijos propios (`GOB`, `IDA`, `DCL`, `PRV`…) y no declara otra procedencia.

### Dos reglas que salen de las fuentes y aplican siempre

1. **La dependencia del proveedor del motor de monitoreo es confidencial frente al cliente
   final.** En el producto se dice "sonda", "capacidad automática" o "evaluación automática",
   nunca el proveedor por su nombre. Aplica a UI, notificaciones, reportes y texto generado por
   IA. Ver `philosophy.md` y la tabla 9 de `01_DESARROLLO` (D128).
2. **El cumplimiento se mide por par servicio × marco**, nunca como un porcentaje de la empresa
   completa.

---

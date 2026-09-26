# Assets — fuentes funcionales del proyecto

Los documentos de esta carpeta **no son material de apoyo: son la fuente de
verdad funcional del proyecto**. Los produce el comité (las personas a cargo de la
parte funcional de Monkey) y de ellos salen las decisiones que `references/` solo
transcribe. Ante una discrepancia entre un `.md` del brain y uno de estos
documentos, **gana el documento** — y el `.md` se corrige.

## Los documentos del comité

> [!important] No están en git, y es a propósito
> Los cuatro archivos de esta tabla (`.xlsx`, `.docx`, `.pptx`) están en `.gitignore`:
> son la fuente de verdad, pero pesan —el TSC maestro son 2,5 MB solo él— y git guardaría
> una copia completa por cada revisión. **Viven en la carpeta compartida del equipo.** Si
> clonaste el repo y no los ves, pídelos: esta tabla dice qué define cada uno, y los `.md`
> de `references/` ya transcriben lo que se decidió a partir de ellos.

| Archivo | Qué define | Quién lo consume |
|---|---|---|
| **`TSC INTERGRAL SOC 2 DETALLADO VF.xlsx`** | **La fuente maestra.** 17 hojas: modelo RBAC de usuarios (4 roles, 34 permisos, 12 políticas de seguridad), formularios de contexto de empresa y de servicio, activos del scope con el catálogo de conexiones AC-01…AC-06, 10 riesgos con metodología 5×5, 56 causas con 92 relaciones riesgo↔causa, 119 controles de catálogo (118 asignados) sobre 302 puntos de enfoque (**729 relaciones**), 61 requisitos TSC, 61 TEST de 23 campos con 228 asignaciones control↔TEST, y 11.352 checks de 77 políticas SCA sobre 18 plataformas con 20 referencias de mapeo. ⚠️ **Las cifras salen de los datos crudos de las hojas, no de la hoja `Resumen`**, que quedó desactualizada: declara 658 relaciones donde los datos tienen 729, y su desglose por categoría (A 34 / C 6 / CC 434 / PI 31 / P 153) no coincide con el real (A 39 / C 9 / CC 477 / PI 40 / P 164). La hoja `Claude Log` del propio archivo —que además trae la bitácora de cómo se construyó— confirma "las 729 filas" | `references/modelo-datos.md` (§3-§9) · `references/modulos/onboarding.md` · `references/philosophy.md` · `references/frameworks/soc2.md` |
| **`MONKEY_Ejemplo_Formula_Cumplimiento.xlsx`** | **La especificación de la fórmula de cumplimiento.** 12 hojas: un servicio resuelto paso a paso (10 activos, 5 controles, 45 evaluaciones), el cálculo por control / dimensión / servicio con fórmulas reales, la trazabilidad de una falla con responsable y tratamiento por nivel, y **12 reglas funcionales numeradas** (R-01…R-12). **Cerró el pendiente D1 y obligó a reescribir el cálculo** | `references/modelo-datos.md` §9 y §2 |
| **`RESUMEN-MODELO-USUARIOS-MONKEY.md`** | El modelo RBAC completo: 8 tablas (`companies`, `users`, `user_control_assignments`, `custom_roles`, `sessions`, `audit_logs`, `api_keys`, `auditor_assignments`), matriz de 34 permisos, políticas de seguridad, audit trail inmutable de 7 años y mapeo a TSC. **Cierra el pendiente A1.** ⚠️ Ver la advertencia de stack abajo | `references/modelo-datos.md` §5 |
| `draft-BLUEPRINT FUNCIONAL-ControlTecnico.docx` | El Centro de Control Técnico completo: el activo como unidad de seguimiento, aprovisionamiento, schedule, ejecuciones, logs, los 4 estados operativos del activo y la cobertura técnica | `references/modelo-datos.md` §8 · `references/mvp-roadmap.md` · diseño de pantalla en `Frontend-Platform` |
| `vision_controles.pptx` | La matriz de evaluación (requisito × control cliente × dimensión) y el método de cálculo con pesos lineales | `references/modelo-datos.md` §9 · pendiente D1 |

## Fuera de este repo (en `Monkey/`, carpeta hermana)

No están aquí a propósito: dos contienen datos operativos y uno credenciales.

| Archivo | Qué define | Quién lo consume |
|---|---|---|
| `../../SOC2_TSC_Controles_Detallados_Monkey2.xlsx` | La anatomía real de un requisito (código + criterio + punto de enfoque), el control del cliente, el plan de testeo con muestreo, y las tres banderas por test (requiere sonda / requiere IA / confirmación de cumplimiento) | `references/modelo-datos.md` §3.1-§3.3 · `references/frameworks/soc2.md` |
| `../../soc2_detalle.py` | La lógica `bool_and`, el tercer veredicto `REVISAR`, la frescura de escaneos, y los tres tags de compliance (`tsc` / `soc_2` / `nelson`) | `references/modelo-datos.md` §9 · `references/wazuh.md` |
| `../../conexion_api_wazuh_monkey.txt` | Endpoints, flujo del conector, la clave compuesta `policy_id + check_id`, los estados de resultado, y la regla de confidencialidad de la sonda. **Contiene credenciales en texto plano: no copiar a ningún repo; rotar esa password** | `../skills/integrations/wazuh/references/api-integracion.md` |
| `../../Propuesta Proyecto Monkey-1.xlsx` | Alcance comercial de junio 2026: módulos de vulnerabilidades, gestión documental, políticas y notificaciones. **Parcialmente superado** — su "consolidado global de cumplimiento" queda derogado por la decisión de medir por servicio | `references/mvp-roadmap.md` · pendiente D7 |

## Documentos que estas fuentes citan y que no tenemos

Aparecen referenciados desde los propios documentos o desde el código. Hay que
conseguirlos o dejar de citarlos:

| Documento | Quién lo cita | Estado |
|---|---|---|
| `docs/plan-mapeo-cis-soc2.md` | El código de `monkey-cis-sync` lo cita como *"ver docs/plan-mapeo-cis-soc2.md en monkey-brain-ai"* | **No existe en este repo** |
| `prompt-user-management-model-monkey.md` | `RESUMEN-MODELO-USUARIOS-MONKEY.md`, como el documento técnico de 2.500+ líneas con el schema, el RLS y las FAQs respondidas | **No lo tenemos.** Ahí están respondidas: qué pasa si un admin de empresa se va, qué pasa con los datos si el cliente cancela, si los auditores externos necesitan MFA, cómo se revoca acceso inmediatamente, y cómo se integra con Wazuh/AWS |
| `prompt-excel-user-management-monkey.md` | El mismo resumen, como el prompt que generó las 5 pestañas de Excel | No lo tenemos (la hoja *Modelo de Gestión usuarios* del archivo maestro es su resultado) |
| `Diseño Funcional APP` | Citado en la hoja de roles como el documento con el detalle para construir el modelo de accesos inicial | No lo tenemos |
| `Guia_Integracion_Wazuh_SCA_MONKEY.docx` | `conexion_api_wazuh_monkey.txt`, como "documentación técnica completa" | No lo tenemos |
| `monkey_soc2_win11.yml` | `soc2_detalle.py`, es la política SCA propia de Monkey | Vive en el servidor, no versionada aquí |
| `root-ca.pem` | `conexion_api_wazuh_monkey.txt` | Se entrega aparte |
| `mapeos_manuales_soc2.py` | `conexion_api_wazuh_monkey.txt` | Renombrado: hoy es `map_soc2_gap.py` + `finalize_soc2_mapping.py` en `monkey-cis-sync` |

## Nota sobre el catálogo de controles

La hoja *Tabla controles SOC 2* del archivo maestro declara su procedencia: **extraído
de Vanta** (119 registros, `app.vanta.com/c/nextayccom`, 25 de agosto de 2026). El
catálogo de Monkey nació de esa taxonomía y luego se amplió con los 61 TEST propios y el
mapeo a los 11.352 checks. Conviene tenerlo presente al hablar de los códigos de control
y al explicar por qué la estructura (controles ↔ pruebas ↔ documentos ↔ políticas) se
parece a la de ese producto.

## ⚠️ Advertencia de stack en `RESUMEN-MODELO-USUARIOS-MONKEY.md`

Ese documento describe el backend como **Node.js + Express** y el frontend como **React**,
con código de ejemplo en esa forma. **Es falso para este proyecto.** El stack real es
**NestJS 11 + Prisma 7** y **Angular 20 standalone** (`context/project-context.md`).

Su **modelo** (roles, permisos, tablas, políticas, audit trail) es válido y es fuente de
verdad. Su **implementación** no: los middlewares de Express son guards e interceptors de
NestJS, los hooks de React son servicios y guards de Angular, y el JWT no se maneja en JS
sino con cookie httpOnly. Las demás secciones técnicas (schema, RLS, índices) hay que
leerlas con la misma precaución — el documento acierta en el *qué* y se equivoca en el
*con qué*. Ver `references/modelo-datos.md` §0 para la tabla de traducción.

## Regla de confidencialidad

De `conexion_api_wazuh_monkey.txt`: **la dependencia de Wazuh es confidencial
frente al cliente final.** En el producto se habla de "sonda", "capacidad
automática" o "evaluación automática" — nunca del proveedor por su nombre. Aplica
a UI, notificaciones, reportes y textos generados por IA. Ver `references/philosophy.md`.

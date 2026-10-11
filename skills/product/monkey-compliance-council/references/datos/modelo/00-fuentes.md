# Modelo de datos — §0 Fuentes

> Parte de [`modelo-datos.md`](../modelo-datos.md) (índice). **Qué responde:** Qué documento del comité define qué y dónde quedó transcrito cada uno. **Léelo:** Para saber de dónde sale una regla o una cifra, o si una fuente falta.
> Los números de sección (§) se conservan: cualquier cita a «§0» apunta aquí.

## 0. Fuentes

Las produce el **comité funcional** y son la fuente de verdad: ante una discrepancia con este
archivo, **gana el documento**.

### La que queda en el repo

| Fuente | Qué define |
|---|---|
| `assets/TSC INTERGRAL SOC 2 DETALLADO VF.xlsx` | **La fuente maestra**, 17 hojas: catálogo maestro (61 requisitos TSC, 302 puntos de enfoque, 119 controles de los que 118 están asignados, 729 relaciones punto de enfoque↔control), 61 TEST de 23 columnas con 284 asignaciones control↔TEST (hoja Pruebas), 89 vínculos documento↔control (50 documentos distintos), 11.352 checks de 77 políticas SCA sobre 18 plataformas con 20 referencias de mapeo, 10 riesgos, 56 causas con 92 relaciones riesgo↔causa, el modelo RBAC, y los formularios de contexto de empresa y de servicio con sus opciones literales |

⚠️ **Las cifras salen de los datos crudos de las hojas, no de la hoja `Resumen`**, que quedó
desactualizada: declara 658 relaciones donde los datos tienen 729, y su desglose por categoría
(A 34 / C 6 / CC 434 / PI 31 / P 153) no coincide con el real (A 39 / C 9 / CC 477 / PI 40 /
P 164). La hoja `Claude Log` del propio archivo confirma "las 729 filas". No corregir hacia 658.

### Fuentes ya transcritas, cuyo archivo no está en el repo

El comité entregó estos documentos y su contenido **ya vive en este archivo**. Se retiraron de
`assets/` el 2026-09-26 para que no hubiera dos versiones de la misma verdad. Dónde quedó cada
uno:

| Fuente original | Dónde está su contenido ahora |
|---|---|
| `MONKEY_Ejemplo_Formula_Cumplimiento.xlsx` | §9: de él salen las reglas R-01 a R-04, R-06, R-07, R-11 y R-12. La agregación (R-05, R-08 a R-10) la fijó el responsable de producto (D62) y el Excel no la refleja: no lo uses para calcular |
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
| `SOC2_TSC_Controles_Detallados_Monkey2.xlsx` | Anatomía de requisito, control del cliente y plan de testeo. ⚠️ **No se encuentra en disco** |

### Documentos que estas fuentes citan y no tenemos

Hay que conseguirlos o dejar de citarlos:

| Documento | Quién lo cita | Qué se pierde |
|---|---|---|
| `prompt-user-management-model-monkey.md` | El resumen del modelo de usuarios, como el técnico de 2.500+ líneas | Ahí estaban respondidas: qué pasa si un `admin_empresa` se va, qué pasa con los datos si el cliente cancela, si los auditores externos necesitan MFA, cómo se revoca acceso de inmediato, y la matriz exhaustiva de permisos (la de §5.5 es el resumen) |
| `docs/plan-mapeo-cis-soc2.md` | El código de `monkey-cis-sync` | El plan del mapeo CIS↔SOC 2 |
| `Diseño Funcional APP` | La hoja de roles del archivo maestro | El detalle del modelo de accesos inicial |
| `Guia_Integracion_Wazuh_SCA_MONKEY.docx` | `conexion_api_wazuh_monkey.txt` | Documentación técnica del conector |
| `monkey_soc2_win11.yml` | `soc2_detalle.py` | La política SCA propia de Monkey. Vive en el servidor |

### Procedencia del catálogo de controles

La hoja *Tabla controles SOC 2* del archivo maestro declara su origen: **extraído de Vanta**
(119 registros, `app.vanta.com/c/nextayccom`, 25 de agosto de 2026). El catálogo de Monkey nació
de esa taxonomía y se amplió con los 61 TEST propios y el mapeo a los 11.352 checks. Conviene
tenerlo presente al explicar por qué la estructura (controles ↔ pruebas ↔ documentos ↔
políticas) se parece a la de ese producto.

### Dos reglas que salen de las fuentes y aplican siempre

1. **La dependencia del proveedor del motor de monitoreo es confidencial frente al cliente
   final.** En el producto se dice "sonda", "capacidad automática" o "evaluación automática",
   nunca el proveedor por su nombre. Aplica a UI, notificaciones, reportes y texto generado por
   IA. Ver `philosophy.md`.
2. **El cumplimiento se mide por par servicio × marco**, nunca como un porcentaje de la empresa
   completa.

---

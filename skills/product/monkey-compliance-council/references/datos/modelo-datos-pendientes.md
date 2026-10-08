# Modelo de datos — lo que falta decidir

Las decisiones **del modelo relacional** están todas cerradas, con su fuente y su
razonamiento, en **`modelo-datos-decisiones.md`**. Lo que queda abierto es lo de abajo:
preguntas de producto que **solo el comité o Nelson pueden responder**. Antes de construir
algo que dependa de una, consúltala — si sigue aquí, no la resuelvas por tu cuenta.

**Los números son estables: una pregunta cerrada no se reutiliza ni renumera el resto**, para
que las referencias desde `contracts/`, Jira o un comentario viejo sigan valiendo.

Cerradas hasta hoy:

| | Pregunta | Cerrada |
|---|---|---|
| **P1** | Cumplimiento fuera del onboarding | 2026-09-26 — el comité confirmó D23: el onboarding se queda en 3 componentes |
| **P10** | Origen de `control_dimensions` y qué es `policies` | 2026-10-01 — cerrada por desarrollo en D39: la dimensión aplica si el control tiene una prueba de ella; `policies` es una plantilla. **Falta ratificar con el comité el tipo y las banderas derivados**; no bloquea nada |
| **P5** | Dos cifras de la documentación de la sonda | 2026-10-08 — las cifras («869 checks, 646 nativos, 223 inferidos») no tenían universo y se quitaron de `wazuh.md`; la versión de referencia es la del manager que corre en desarrollo, 4.14.6 (D55) |
| **P4** | `responsible_id` sin catálogo de cargos | 2026-09-29 — cerrada por desarrollo en D30: el cargo es `organization_responsibles`. **Falta ratificarla con el comité**; no bloquea nada |

## P2 · El flujo de la clave de acceso — 5 detalles sin definir

La decisión de fondo está cerrada (D24: Monkey Admin registra el tenant, la clave se manda
al `admin_email`). Falta el detalle operativo, y **condiciona la pantalla del día 1-2 del
sprint de onboarding**:

| # | Pregunta |
|---|---|
| a | ¿La clave es un código que el cliente escribe a mano, o un link con token en la URL? Cambia qué pantalla hay que construir. *Hoy se implementó como código escrito a mano, en dos pasos (D51); no es una respuesta explícita del comité a esta pregunta* |
| b | ¿Cuánto dura antes de expirar, y puede `admin_monkey` regenerarla o reenviarla si el correo se perdió? |
| c | Si `admin_monkey` se equivoca escribiendo el nombre de la empresa o el correo, ¿se puede corregir desde Monkey Admin antes de que el cliente entre? Importa porque ese nombre queda **bloqueado** en el Componente 1 |
| d | Si se marca "base de datos dedicada", ¿aprovisionarla es instantáneo o toma tiempo? Si toma tiempo, ¿se manda la clave de una vez o se espera? |
| e | ¿Puede haber más de un correo administrativo por empresa desde el registro, o el resto de usuarios se invita después desde adentro? |

Las más urgentes son **(a)** y **(c)**.

## P3 · Detalle fino de dos módulos

Ninguna de las dos bloquea el sprint de onboarding, pero sí el desarrollo de su módulo:

- **Usuarios:** qué permisos concretos puede llevar un `custom_role`, más allá del ejemplo
  ya documentado ("Revisor de evidencia").
- **Cumplimiento:** los permisos dentro del módulo más allá de "es de `admin_empresa`", y
  si necesita su propia pantalla o vive dentro de la vista de cada servicio.


## P6 · La lista completa de `business_model`

`modelo-datos.md` dice "40+ opciones" y **el propio Excel del comité también lo dice**, pero su hoja
*Contexto Empresa* lista solo 19. ¿Cuáles son las que faltan? Mientras tanto valen las 19 y `other`
(`contracts/enums.md`). No bloquea nada.

## P7 · Dónde se aloja el Postgres de producción

Decisión de infraestructura que se dejó para cuando se hable de lanzamiento con el comité. La
recomendación planteada (no decidida) es **no alojarlo en el mismo servidor que corre la app** —ni
la VPS actual ni una nueva compartida—: superficie de ataque compartida con n8n y minio, contención
de recursos y, sobre todo, backups y recuperación (un servicio administrado tipo RDS los trae; auto-
alojado hay que operarlos). Alternativa: un servidor separado, dedicado solo a la base. No afecta al
modelo (RLS, 4 schemas, roles). **Sí condiciona la retención de 7 años del audit trail (D41):** los respaldos que
la sostienen dependen de dónde viva el Postgres.

## P8 · ¿Un control que crea el cliente cuenta para el marco?

El cliente puede crear controles propios (`client_controls` con `control_id` nulo, D36). Un control propio
no tiene punto de enfoque, y los requisitos de un marco se derivan recorriendo requisitos → puntos de enfoque
→ controles del catálogo. Por eso hoy **no puede cerrar ningún requisito**.

**La pregunta:** ¿cuenta para el % del servicio (por su dimensión)? ¿Y el cliente puede vincularlo a puntos
de enfoque para que sí cuente para un requisito? Mi propuesta: en el MVP cuenta para el % del servicio pero
no para los requisitos; mapearlo a puntos de enfoque queda para después.

**Qué depende:** el cálculo del cumplimiento del marco (§9) y el módulo de Cumplimiento (§7).

## P9 · Datos del Excel que hay que corregir o confirmar

Dos inconsistencias **dentro del propio archivo del comité**, que el seed carga tal cual sin adivinar (D38):

- **Pruebas de aplicación.** La matriz *Análisis TEST x Control* asigna a 17+5+1+2+1+1 = 27 pares control↔prueba
  seis pruebas `T-APP-001…006` que no existen en la hoja *Pruebas* (la hoja marca *"FALTAN 6"*), y la hoja
  *Pruebas* tiene seis sin usar en la matriz: `T-SRV-011…014`, `T-BD-009` y `T-BD-010`. Sus controles coinciden
  en 94-100%, así que probablemente son las mismas pruebas con otro código y otra dimensión. **Hoy la
  dimensión Aplicación no tiene ninguna prueba.** ¿Son pruebas de aplicación (se recodifican a `T-APP` y
  `app`) o de servidores/BD (se corrige la matriz)?
- **Diez causas sin riesgo.** F003, F004, F016, F020, F026, F034, F042, F045, F053 y F054 no aparecen en ninguna
  de las 92 relaciones riesgo↔causa. ¿A qué riesgo(s) pertenecen o se descartan?

**Qué depende:** la dimensión Aplicación del cálculo (§2, §9) y qué causas ve el cliente al clonar (§7.2).

## P11 · El nombre del proveedor en los textos de las pruebas

Las 61 pruebas del comité nombran al proveedor del motor de monitoreo en 15 de sus 23 columnas (25 de 61 en
*herramienta*, 19 en *limitaciones*, 14 en *prerrequisitos*…) y en 4 nombres de prueba, lo que choca con la regla
de confidencialidad frente al cliente final. Se guardan tal cual (son la fuente) y **ningún texto de prueba sale a
la UI, a un reporte ni a la IA**. Falta decidir qué ve el cliente de una prueba: ¿solo su resultado y un nombre
neutro? ¿el comité entrega una versión sin el nombre del proveedor?

---

## P12 · Cómo se conecta Monkey a la sonda (paso 3 del control técnico)

**Estado:** abierto desde 2026-10-02 (D48). Bloquea el rediseño del paso 3 (DT-31 a DT-36); no bloquea el resto del onboarding.

Preguntas para Nelson, Bryan y el comité:

*Respondidas: quién instala y qué canales ofrece (D53 punto 4) y cómo se aísla cada cliente (D54).*

3. **¿Cómo lee Monkey los resultados?** ¿Base de la sonda, API o ambas? ¿Con un usuario de solo lectura por grupo?
4. **¿Quién configura la nube** (AWS/GCP/Azure) y con qué modelo (rol entre cuentas / federación de identidad)? Las integraciones de la sonda son de registros, no de configuración. **Actualización 2026-10-07:** se probó un escaneo de configuración de AWS con un usuario IAM de solo lectura y llaves estáticas (método de prueba, no el definitivo). Qué motor lo ejecuta y cómo se conecta en producción es **P14**.
5. **¿Qué se promete a un cliente con un sistema que no sea Ubuntu 22.04, Ubuntu 14.04 o Windows 11?** Hoy no hay pruebas para él.
6. **¿Se autoriza la IP de desarrollo** en la API de la sonda para poder probar un adaptador real?

---

## P14 · Motores de evaluación: rol de cada uno y cómo se relacionan con el modelo

**Estado:** abierto desde 2026-10-07. Nace de una prueba real: un escaneo de configuración de una cuenta de AWS
(292 hallazgos, 70 checks, 8 servicios, 17 regiones) hecho con una herramienta distinta de la sonda. Choca con la
decisión de «validador único» (D13, `wazuh.md`): **no se cierra D13 hasta que el comité responda A1**. Bloquea el
adaptador de nube y el cálculo de cobertura en nube; no bloquea el módulo de Cumplimiento.

**Propuesta de desarrollo (no decidida):** el catálogo, los checks y su mapeo a controles son de Monkey; los motores
son adaptadores intercambiables que solo entregan resultados crudos en un formato único (`check_results`). La sonda
cubriría servidores, BD y endpoints; un motor de configuración, la nube.

**A. Rol de los motores**
1. ¿Se acepta que un motor distinto cubra la nube y se cierra D13? ¿La sonda queda solo con servidores, BD y endpoints?
2. ¿Cómo se llama ese motor frente al cliente? La regla de confidencialidad aplica igual.
3. ¿Hay un tercer motor previsto (Azure, GCP, SaaS)?

**B. Unidad de evaluación** *(B1 y B3 respondidas en D53: el activo es la cuenta y se evalúan solo las regiones declaradas)*
2. Una instancia en la nube es también un servidor (`ac_02`). ¿Se enlaza el recurso hallado con el activo del servidor, o son cosas separadas?
4. Un check que falla en 3 de 5 discos, ¿es 1 evaluación fallida o 3?

**C. Conexión y credenciales**
1. ¿Rol entre cuentas sin llaves guardadas en producción (propuesta), en vez de usuario con llaves estáticas?
2. Permisos mínimos que se piden al cliente y quién los crea.
3. ¿Dónde corre el motor? Hoy en el mismo servidor que la sonda y con llaves del cliente guardadas allí.
4. Frecuencia, duración y coste en llamadas a la API (`ac_01` fija 6-24 h).
5. ¿Azure y GCP producen el mismo formato de salida y alguien los probó?

**D. Catálogo y mapeo**
1. ¿Se cargan al catálogo los 70 checks, o solo los que el comité elija, y con qué `origin`?
2. El motor trae su propio mapeo a SOC 2. Si no coincide con el del comité, gana el del comité (regla del brain); ¿se guarda el otro como mapeo con procedencia?
3. Los `T-CLD-*` nombran a la sonda como herramienta (ver P11). ¿Se reescriben?
4. Estados del motor que no existen en el modelo: `MANUAL` ya se trata como `not_run` (confirmado). Falta el **silenciado**: propuesta, un silencio con justificación aprobada.

**E. Producto y legal**
1. Licencia y forma de uso del motor (redistribuir o ofrecer como servicio). No verificado.
2. Quién revisa el texto de IA antes de que llegue al cliente y quién responde por un falso positivo.

**Qué depende:** columnas nuevas de `check_results` (recurso, región, detalle), carga de checks, `Evaluation` en nube y el paso 3 del onboarding para nube (DT-35).
## P13 · Ratificar lo que desarrollo decidió en las correcciones del 2026-10-05 (D50, D51)

**Estado:** abierto desde 2026-10-06. No bloquea nada: todo está construido y funcionando; falta que el comité lo confirme.

1. **Lista de 7 marcos ofrecidos** (SOC 2, ISO 27001, HIPAA, GDPR, PCI DSS, NIST CSF, SOC 1) y su orden. La armó desarrollo con datos de demanda de proveedores de cumplimiento (Drata, ACC 2025), no el comité. ¿Es la lista correcta para la oferta comercial?
2. **Lista de 18 normas de protección de datos** (DT-40): ¿se ratifica que salga PCI DSS, que HIPAA y GLBA se queden, y las 5 que entraron (Ley 21.719 CL, UY, EC, PA, CR)? ¿Faltan otras (p. ej. Ley 1266 de Colombia)?
3. **Categorías por marco** (D50, DT-38): confirmada la opción de que cada marco use las suyas. Falta que el comité entregue **cuáles son** las de cada marco (ISO 27001: ¿4 temas del Anexo A? PCI DSS: ¿12 requisitos? NIST CSF: ¿6 funciones?) y si «seguridad siempre obligatoria» se generaliza a un dominio obligatorio por marco.
4. **Contacto de ventas** (DT-41): ¿qué canal real recibe el interés cuando un cliente toca un marco que no contrató?
5. **Textos «auditoría» → «consultoría»** (DT-42): ¿se cambian también en Inicio y «Mis servicios»?
6. **Certificación previa:** ¿las 8 opciones son las correctas para una «certificación o evaluación» previa?

---

## P15 · Cómo se mapean los checks de nube que quedan fuera

**Estado:** abierto desde 2026-10-08 (D56). No bloquea nada: lo que no tiene la cadena completa **no cuenta** hasta que el comité responda.

Del catálogo de 662 checks de AWS, lo que no llega a un control:

1. **104 checks sin prueba**: no encajan en ninguna `T-CLD`. ¿A qué prueba van, o se descartan? (Lista: los que no aparecen en `test_checks` tras `npm run cloud:load`.)
2. **Las pruebas `T-CLD-004` a `007` no tienen ningún check.** ¿Se cubren con checks que aún no se han buscado o quedan manuales por activo?
3. **Seis requisitos que el motor cita** no los alcanza ninguna prueba de nube: CC1.3, CC3.1, CC3.2, CC5.2, CC7.3 y CC7.5. ¿Se añade el vínculo o quedan como cobertura no alcanzada?
4. **Ratificar las 569 asignaciones propuestas** (`monkey_proposed`): se pide por prueba (11 `T-CLD`), no check por check.

**Qué depende:** que esos checks cuenten para el cumplimiento (§9) y la cobertura técnica real de la nube.

---

## Cómo se cierra un pendiente

1. El comité responde.
2. La decisión se escribe en `modelo-datos-decisiones.md`, con la fuente y el porqué, y si
   cambia una tabla o el cálculo, se ajusta `modelo-datos.md`.
3. Se borra de este archivo.
4. Se cierra el ticket de Jira correspondiente en el proyecto `MD`, con la decisión y su
   fuente en un comentario.

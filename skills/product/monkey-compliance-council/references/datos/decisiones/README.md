		

# Modelo de datos — registro de decisiones

Bitácora de las decisiones que cerraron el modelo relacional, desde el 15 de
septiembre de 2026, con la fuente y el razonamiento de cada una.

Esto no es el modelo: el modelo está en **`modelo-datos.md`**, y ahí se lee qué hay que
construir. Este archivo existe para responder *"¿por qué se decidió así?"* sin volver a
discutirlo, y para que si alguna decisión resulta equivocada se pueda revisar sabiendo en
qué se apoyaba.

Lo que sigue abierto está en **`datos/pendientes/README.md`**.

> Este contenido estuvo hasta el 16 de septiembre de 2026 en una sección "§8" de
> `modelo-datos.md`. Si un ticket de Jira o un comentario viejo apunta a "§8", se refiere
> a este archivo — no a la §8 actual de `modelo-datos.md`, que es Control Técnico.

---

## Las decisiones

Aquí viven las decisiones **ya cerradas** del modelo relacional, con su fuente y su
razonamiento. Las que siguen abiertas **no están aquí**: viven en
`datos/pendientes/README.md` y se numeran P1, P2, P3.

La numeración A/B/C/D es histórica y tiene huecos (no existen B3, B5 ni D15-D22): son
preguntas que se plantearon y se descartaron o se fusionaron con otras antes de cerrarse.
Un hueco no es una decisión pendiente.
Cada una se resolvió con la opción que (a) tiene respaldo en una fuente del comité,
(b) no obliga a rehacer lo ya construido, y (c) sigue el flujo real de la aplicación.
Las tres que quedan abiertas están al final: son las que nadie puede decidir por el
comité.

**Estas decisiones ya no son pendientes.** Se construye sobre ellas. Si alguna resulta
equivocada, se corrige con el comité — pero no se re-abre el debate en cada sprint.

---

## Dónde está cada ficha

**Un módulo, un archivo**, con los mismos nombres que [`arquitectura/`](../../arquitectura/README.md) (`STANDARD.md` §2b). Busca el ID en el **Índice** de abajo: su columna *Archivo* dice dónde está.

| Archivo | Decisiones | Módulo |
|---|--:|---|
| [`aislamiento-tenant.md`](aislamiento-tenant.md) | 3 | [Aislamiento multi-tenant](../../arquitectura/aislamiento-tenant/README.md) |
| [`empresas.md`](empresas.md) | 5 | [Empresas](../../arquitectura/empresas/README.md) |
| [`autenticacion.md`](autenticacion.md) | 4 | [Autenticación](../../arquitectura/autenticacion/README.md) |
| [`roles-permisos.md`](roles-permisos.md) | 6 | [Roles y permisos](../../arquitectura/roles-permisos/README.md) |
| [`gestion-usuarios.md`](gestion-usuarios.md) | 4 | [Gestión de usuarios](../../arquitectura/gestion-usuarios/README.md) |
| [`catalogo-maestro.md`](catalogo-maestro.md) | 12 | [Catálogo maestro](../../arquitectura/catalogo-maestro/README.md) |
| [`onboarding/`](onboarding/README.md) | 15 | [Onboarding](../../arquitectura/onboarding/README.md): índice + 3 componentes |
| [`control-tecnico.md`](control-tecnico.md) | 10 | [Control técnico](../../arquitectura/control-tecnico/README.md) |
| [`cumplimiento/`](cumplimiento/README.md) | 15 | [Cumplimiento](../../arquitectura/cumplimiento/README.md): índice + 6 componentes |
| [`integraciones.md`](integraciones.md) | 1 | [Integraciones](../../arquitectura/integraciones/README.md) |
| [`trazabilidad.md`](trazabilidad.md) | 4 | [Trazabilidad](../../arquitectura/trazabilidad/README.md) |
| [`plataforma.md`](plataforma.md) | 6 | [Plataforma](../../arquitectura/plataforma/README.md) |
| [`entrega.md`](entrega.md) | 4 | **ninguno**: CI, despliegue, entornos y pool |
| [`historico-a-d.md`](historico-a-d.md) | 23 | **ninguno**: los bloques A–D de septiembre de 2026 |

---

## Contexto de las fuentes

Dos notas de procedencia que valían para un grupo entero de decisiones y que, al repartirlas por módulo, se
quedan aquí:

- **D26 a D32 — revisión de migraciones contra el modelo (2026-09-29).** Al auditar las migraciones del Backend
  contra el modelo salieron huecos que no dependían del comité. **Son decisiones de desarrollo** (Héctor,
  2026-09-29): corrigen el schema para que respete lo que el modelo ya decía, o cierran un punto donde el modelo se
  contradecía a sí mismo. Si el comité no está de acuerdo con alguna, se revisa con él; ninguna toca cómo se
  calcula el cumplimiento.
- **D69 a D94 — cierres del 2026-10-10 al 20.** Las propuso desarrollo y las **aprobó el responsable de producto el
  2026-10-10**. Son decisiones de producto o de ingeniería: ninguna depende del comité.

---

### Índice

| ID  | Decisión                                                                                                                                                                                                                                      | Archivo |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| A1  | El responsable de una evidencia es cargo *y* persona, en planos distintos                                                                                                                                                                    | [histórico](historico-a-d.md) |
| A2  | Un activo puede pertenecer a varios servicios (`N:M`)                                                                                                                                                                                        | [histórico](historico-a-d.md) |
| A3  | ~~La exclusión la propone el consultor y la aprueba el cliente~~ (D78: la propone la empresa y la aprueba el consultor); vence con el periodo de evaluación                                                                                 | [histórico](historico-a-d.md) |
| A4  | El catálogo maestro se versiona, y cada evaluación guarda contra qué versión se midió                                                                                                                                                     | [histórico](historico-a-d.md) |
| B1  | No se pondera por nivel de riesgo                                                                                                                                                                                                              | [histórico](historico-a-d.md) |
| B2  | El requisito es binario, igual que el control                                                                                                                                                                                                  | [histórico](historico-a-d.md) |
| B6  | La regla del schedule la editan `admin_monkey` y `admin_empresa`                                                                                                                                                                           | [histórico](historico-a-d.md) |
| C1  | La evidencia es válida si cae dentro del periodo de evaluación                                                                                                                                                                               | [histórico](historico-a-d.md) |
| D2  | Peso lineal, y punto (en el MVP)                                                                                                                                                                                                               | [histórico](historico-a-d.md) |
| D3  | `client_controls` es una entidad propia                                                                                                                                                                                                      | [histórico](historico-a-d.md) |
| D4  | Hay un cuarto tipo: `technical_manual`                                                                                                                                                                                                       | [histórico](historico-a-d.md) |
| D5  | Se mantienen las 5 dimensiones                                                                                                                                                                                                                 | [histórico](historico-a-d.md) |
| D6  | El mapeo de checks es por política                                                                                                                                                                                                            | [histórico](historico-a-d.md) |
| D7  | Vulnerabilidades: solo insumo en el MVP                                                                                                                                                                                                        | [histórico](historico-a-d.md) |
| D8  | El muestreo se modela como dato, no como texto                                                                                                                                                                                                 | [histórico](historico-a-d.md) |
| D9  | Monkey cura el catálogo central; la matriz RBAC aplica al escenario del cliente                                                                                                                                                               | [histórico](historico-a-d.md) |
| D10 | `regulations` es una entidad propia y no se puntúa                                                                                                                                                                                          | [histórico](historico-a-d.md) |
| D11 | `csocs` y `cuecs` son entidades propias, marcadas como no medibles por Monkey                                                                                                                                                              | [histórico](historico-a-d.md) |
| D12 | Se guarda el mapeo completo, en una tabla `check_mappings` (`check_id`, `framework_code`, `framework_version`, `requirem…                                                                                                             | [histórico](historico-a-d.md) |
| D13 | La nube se reporta como cobertura pendiente *(ajustada por D100: la nube la mide Prowler)*                                                                                                                                                                                                  | [histórico](historico-a-d.md) |
| D1  | El 40/60 de la matriz ya no bloquea nada: el comité especificó la fórmula completa                                                                                                                                                          | [histórico](historico-a-d.md) |
| A4  | El comité aceptó la recomendación, con dos matices que la completan                                                                                                                                                                         | [histórico](historico-a-d.md) |
| D14 | Es híbrido: el cliente elige, no Monkey                                                                                                                                                                                                       | [histórico](historico-a-d.md) |
| D23 | No es un 4º componente del onboarding                                                                                                                                                                                                         | [onboarding/README](onboarding/README.md) |
| D24 | Monkey Admin y Monkey Platform son dos aplicaciones distintas; el registro del tenant define nombre y aislamiento                                                                                                                              | [empresas](empresas.md) |
| D25 | Una sola base de datos por defecto, no dos planos separados                                                                                                                                                                                    | [aislamiento-tenant](aislamiento-tenant.md) |
| D26 | Tipos enum en `snake_case`                                                                                                                                                                                                                   | [catalogo-maestro](catalogo-maestro.md) |
| D27 | Qué dice una evaluación, y por qué es inmutable de verdad                                                                                                                                                                                   | [trazabilidad](trazabilidad.md) |
| D28 | Riesgos y causas: plantilla en el catálogo, copia por cliente                                                                                                                                                                                 | [catalogo-maestro](catalogo-maestro.md) |
| D29 | Búsquedas previas al tenant: funciones `SECURITY DEFINER`, email único global                                                                                                                                                              | [aislamiento-tenant](aislamiento-tenant.md) |
| D30 | Cargos, clonado de evidencia y de tests (cierra P4)                                                                                                                                                                                            | [onboarding/contexto-organizacional](onboarding/contexto-organizacional.md) |
| D31 | RLS también en `catalog` (escritura), `companies`, `access_keys` y `audit_logs`                                                                                                                                                       | [aislamiento-tenant](aislamiento-tenant.md) |
| D32 | Las `N:M` de dominios de monitoreo, explícitas                                                                                                                                                                                              | [catalogo-maestro](catalogo-maestro.md) |
| D33 | Riesgos: categoría de 11 valores y evaluación 5×5 que hace el cliente                                                                                                                                                                       | [cumplimiento/riesgos](cumplimiento/riesgos.md) |
| D34 | Los enums que estaban como texto, cerrados                                                                                                                                                                                                     | [catalogo-maestro](catalogo-maestro.md) |
| D35 | Siembra del catálogo de SOC 2 (MD-65): dominio del control, publicador opcional y estrategia                                                                                                                                                  | [catalogo-maestro](catalogo-maestro.md) |
| D36 | Controles del cliente completos, clonado y plantillas de evidencia                                                                                                                                                                             | [catalogo-maestro](catalogo-maestro.md) |
| D37 | El MVP contempla solo SOC 2                                                                                                                                                                                                                    | [catalogo-maestro](catalogo-maestro.md) |
| D38 | El dato real manda: cómo se siembra y qué se encontró                                                                                                                                                                                       | [catalogo-maestro](catalogo-maestro.md) |
| D39 | Dimensiones por control y políticas del catálogo (cierra P10)                                                                                                                                                                                | [catalogo-maestro](catalogo-maestro.md) |
| D40 | Reglas del clonado del catálogo al elegir marco (MD-80)                                                                                                                                                                                       | [catalogo-maestro](catalogo-maestro.md) |
| D41 | El audit trail es inmutable en la base de datos y se retiene 7 años (MD-92); **D97: no aplica a una empresa dada de baja, que se purga con su plazo**                                                                                   | [trazabilidad](trazabilidad.md) |
| D42 | Cómo viaja una migración a staging (MD-91)                                                                                                                                                                                                   | [entrega](entrega.md) |
| D43 | La clave de acceso se canjea una sola vez, y solo con el correo administrativo                                                                                                                                                                 | [empresas](empresas.md) |
| D44 | Componente 1 del onboarding: huecos del contrato resueltos por desarrollo                                                                                                                                                                      | [onboarding/contexto-organizacional](onboarding/contexto-organizacional.md) |
| D45 | Componente 2 del onboarding: ajustes del schema y huecos resueltos por desarrollo                                                                                                                                                              | [onboarding/contexto-servicio](onboarding/contexto-servicio.md) |
| D46 | Componente 3 del onboarding: huecos cerrados por desarrollo                                                                                                                                                                                    | [onboarding/conexion-activos](onboarding/conexion-activos.md) |
| D47 | El marco se contrata al registrar la empresa (revierte el veto de §6.1)                                                                                                                                                                       | [empresas](empresas.md) |
| D48 | Paso 3 del control técnico: lo verificado contra la sonda real y por qué el flujo actual es provisional                                                                                                                                      | [control-tecnico](control-tecnico.md) |
| D49 | Las peticiones esperan hasta 10 s por una conexión del pool                                                                                                                                                                                   | [plataforma](plataforma.md) |
| D50 | Todos los marcos se ofrecen, solo SOC 2 se contrata; cada marco con sus categorías                                                                                                                                                            | [catalogo-maestro](catalogo-maestro.md) |
| D51 | Correcciones al Componente 2 y a la activación de cuenta                                                                                                                                                                                      | [onboarding/contexto-servicio](onboarding/contexto-servicio.md) |
| D52 | La auditoría se escribe en la misma transacción que la acción (cierra DT-28, SEG-36)                                                                                                                                                        | [trazabilidad](trazabilidad.md) |
| D53 | Conexión con la nube: alcance, activo, regiones, canales y retención                                                                                                                                                                         | [control-tecnico](control-tecnico.md) |
| D54 | La sonda de servidores: un manager, un grupo por cliente, agente pre-registrado por Monkey (responde P12.2; 2026-10-07)                                                                                                                        | [control-tecnico](control-tecnico.md) |
| D55 | Entorno de desarrollo del control técnico: motor de nube y manager en la VPS                                                                                                                                                                  | [entrega](entrega.md) |
| D56 | El control técnico de la nube en el modelo: recurso hijo, procedencia del mapeo y checks sin filas                                                                                                                                            | [control-tecnico](control-tecnico.md) |
| D57 | Quién ejecuta el motor de nube: un trabajador aislado                                                                                                                                                                                         | [control-tecnico](control-tecnico.md) |
| D58 | El flujo de conexión de una cuenta de nube: validación real a través del trabajador                                                                                                                                                         | [control-tecnico](control-tecnico.md) |
| D59 | La conexión descubre los activos de la cuenta y los muestra al cliente                                                                                                                                                                        | [onboarding/conexion-activos](onboarding/conexion-activos.md) |
| D60 | Se retira el scope declarado («cuántos tienes») y el servicio muestra sus conexiones                                                                                                                                                        | [onboarding/conexion-activos](onboarding/conexion-activos.md) |
| D61 | Cada recurso descubierto es un activo del cliente, y el servicio elige cuáles son suyos                                                                                                                                                       | [onboarding/conexion-activos](onboarding/conexion-activos.md) |
| D62 | El cumplimiento se cuenta: dimensión → control → categoría → marco                                                                                                                                                                        | [cumplimiento/motor](cumplimiento/motor.md) |
| D63 | El auditor es un rol aparte *(ajustada por D96)*                                                                                                                                                                                             | [roles-permisos](roles-permisos.md) |
| D64 | Hay cinco roles: el consultor prepara, el auditor certifica *(reemplazada por D96)*                                                                                                                                                          | [roles-permisos](roles-permisos.md) |
| D65 | Controles propios y cambios de controles con aprobación del consultor (cierra P8) *(reemplazada por D96)*                                                                                                                                   | [cumplimiento/controles](cumplimiento/controles.md) |
| D66 | MFA obligatoria para los 5 roles *(ajustada por D96 (4 roles))*                                                                                                                                                                              | [autenticacion](autenticacion.md) |
| D67 | El paso 3 es un marketplace de plataformas y el catálogo de conexiones vive en la base de datos                                                                                                                                               | [onboarding/conexion-activos](onboarding/conexion-activos.md) |
| D68 | El motor de evaluación del comité es la regla del cálculo                                                                                                                                                                                   | [cumplimiento/motor](cumplimiento/motor.md) |
| D69 | El paso 3 se completa al definir dónde vive el servicio, e «Inicio» invita a conectar (cierra P17)                                                                                                                                          | [onboarding/conexion-activos](onboarding/conexion-activos.md) |
| D70 | El cliente ve el resultado de una prueba con un nombre neutro; los textos del comité son internos (cierra P11)                                                                                                                                | [control-tecnico](control-tecnico.md) |
| D71 | Cómo lee Monkey a la sonda y qué se promete (cierra P12)                                                                                                                                                                                     | [control-tecnico](control-tecnico.md) |
| D72 | El Postgres de producción vive separado de la app (cierra P7); respaldos con rotación de 35 días (D97)                                                                                                                                      | [entrega](entrega.md) |
| D73 | La lista de modelos de negocio es de 19, más «otro» (cierra P6)                                                                                                                                                                             | [onboarding/contexto-organizacional](onboarding/contexto-organizacional.md) |
| D74 | Exclusiones de activos y controles vencidos (decisiones 3 y 7 del Excel, P22)                                                                                                                                                                  | [cumplimiento/exclusiones](cumplimiento/exclusiones.md) |
| D75 | Se adopta la fórmula del riesgo residual del comité, y se cierran tres decisiones del Excel por su recomendación o por lo ya decidido                                                                                                       | [cumplimiento/riesgos](cumplimiento/riesgos.md) |
| D76 | Respuestas del comité sobre el motor, y qué significa el mapa de calor                                                                                                                                                                       | [cumplimiento/riesgos](cumplimiento/riesgos.md) |
| D77 | La evaluación del consultor y la del auditor: el auditor va aparte, el consultor suma un veredicto general (cierra P23) *(en pausa por D96)*                                                                                                | [roles-permisos](roles-permisos.md) |
| D78 | Quién propone y quién aprueba una exclusión: la empresa propone, el consultor aprueba *(reemplazada por D96)*                                                                                                                             | [cumplimiento/exclusiones](cumplimiento/exclusiones.md) |
| D79 | Columnas que faltaban para los contratos de Cumplimiento (MD-108)                                                                                                                                                                              | [cumplimiento/motor](cumplimiento/motor.md) |
| D80 | La superficie habla el lenguaje del dominio GRC, los códigos se muestran siempre y el porcentaje de avance es visible                                                                                                                         | [cumplimiento/README](cumplimiento/README.md) |
| D81 | El administrador de la empresa ve la vista técnica mientras no se definan los permisos por pantalla *(ajustada por D96)*                                                                                                                    | [roles-permisos](roles-permisos.md) |
| D82 | Cada prueba lleva, junto a su nombre neutro, una descripción corta que ve el cliente                                                                                                                                                          | [catalogo-maestro](catalogo-maestro.md) |
| D83 | Sin consultor, la exclusión espera; y la exclusión lleva su servicio (cierra P24) *(reemplazada por D96)*                                                                                                                                  | [cumplimiento/exclusiones](cumplimiento/exclusiones.md) |
| D84 | La empresa solo aporta la evidencia: la revisan el consultor y el auditor, cada uno en su momento (cierra parte de P25) *(reemplazada por D96)*                                                                                              | [roles-permisos](roles-permisos.md) |
| D85 | El veredicto de un test manual o documental vale para todos los controles que lo usan *(ajustada por D96)*                                                                                                                                   | [cumplimiento/veredictos](cumplimiento/veredictos.md) |
| D86 | No hay un staging propio: un solo entorno desplegado, y lo que dependa de un staging se congela                                                                                                                                                | [entrega](entrega.md) |
| D87 | El período auditado lo declara la empresa y la fecha de corte es «hoy» hasta que se congela (responde P26, provisional)                                                                                                                     | [cumplimiento/resumen](cumplimiento/resumen.md) |
| D90 | De una prueba técnica el cliente ve qué falló y cómo corregirlo, con la guía del catálogo traducida con IA y sin nombrar al proveedor                                                                                                    | [control-tecnico](control-tecnico.md) |
| D89 | El onboarding es solo el contexto de la empresa; los servicios se declaran después y sus riesgos se evalúan antes de declarar activos (ajusta D23, reemplaza D69)                                                                            | [onboarding/contexto-servicio](onboarding/contexto-servicio.md) |
| D88 | Una prueba documental se valida en su control, con la evidencia que se sube para esa prueba (ajusta D85, cierra P25) *(ajustada por D96)*                                                                                                    | [cumplimiento/veredictos](cumplimiento/veredictos.md) |
| D91 | Todo cambio de estado de un control deja un evento inmutable (cumple REQ-043 y REQ-044)                                                                                                                                                        | [trazabilidad](trazabilidad.md) |
| D92 | El cliente no declara dónde vive su servicio: elige la plataforma del catálogo y se le ofrecen las seis conexiones (ajusta D46 y D60; se aparta del bloque 2A del Excel, por ratificar)                                                      | [onboarding/conexion-activos](onboarding/conexion-activos.md) |
| D93 | Al evaluar los riesgos de un servicio nuevo se puede retirar el que no aplica (con motivo) o volver a incluirlo, y agregar un riesgo propio con sus causas; retirar un riesgo no retira causas ni controles (amplía D89)                      | [onboarding/contexto-servicio](onboarding/contexto-servicio.md) |
| D94 | Segundo factor TOTP con 10 códigos de recuperación para los 5 roles *(ajustada por D96: 4 roles)*; ingreso en dos pasos con desafío de 5 min; QR dibujado en el navegador; el admin de la empresa restablece a su equipo y Monkey al admin por script; cierra DT-23       | [autenticacion](autenticacion.md) |
| D95 | El consultor se activa con un código de un solo uso y entra a sus empresas asignadas eligiendo de una lista, sin token por empresa (cierra P29 y P30; **reemplazada en parte por D96**: solo sobrevive el código de activación)       | [autenticacion](autenticacion.md) |
| D96 | Cuatro roles: el administrador de la empresa es el experto en compliance, valida y decide; el `funcional` ejecuta por dimensión; el auditor revisa sin calificar (reemplaza D64, D65, D78, D83, D84, D85, D88; pausa D77; cierra P28 y P31) *(ajustada por D102: el reparto por dimensión y la revisión única)* | [roles-permisos](roles-permisos.md) |
| D97 | Archivar una empresa (corta accesos y motores, reversible) y borrarla definitivamente al vencer un plazo elegido (6 meses por defecto); solo queda un rastro mínimo; enmienda D41 y D72: los respaldos generales rotan a 35 días             | [empresas](empresas.md) |
| D98 | El funcional atiende todo lo de sus especialidades; toda cuenta lleva nombre; un administrador crea a otro *(reemplazada en parte por D102)*                                                                                                                                   | [gestion-usuarios](gestion-usuarios.md) |
| D99 | La clave de acceso solo se entrega por correo al `admin_email` (ya no se muestra en pantalla); si no llega se reenvía con una clave nueva; el alta no depende del correo (enmienda D24; cierra P2b y MD-69 para la clave) | [empresas](empresas.md) |
| D100 | Prowler maneja la nube; Wazuh sigue con servidores, BD y endpoints (configuración, amenazas en tiempo real, incidentes); cierra P14 A1 y A2 y acota el «validador único» *(ajusta D13)* | [control-tecnico](control-tecnico.md) |
| D101 | La contraseña no vence por calendario; la persona la cambia cuando quiere (con su contraseña y segundo factor) y la recupera con enlace por correo + segundo factor *(enmienda §5.3, SEG-14)* | [autenticacion](autenticacion.md) |
| D102 | Cadena de asignación `admin_empresa` → `responsable` → `delegado`: el dueño de cada control es una persona, la unidad es el control completo y la revisión es de dos niveles *(reemplaza en parte a D98, ajusta D96; cierra P38)* | [gestion-usuarios](gestion-usuarios.md) |
| D103 | Monkey solo tiene `admin_monkey` y fija el cupo de usuarios (`companies.max_users`) de cada empresa *(cierra P40)* | [gestion-usuarios](gestion-usuarios.md) |
| D104 | El responsable vive en «Responsables» y su equipo de delegados lo crea él (o el administrador por él); no nace con su cuenta *(ajusta D102)* | [gestion-usuarios](gestion-usuarios.md) |
| D105 | La fecha de corte deja de ser una opción: siempre es «hoy» y se muestra la última revisión automática; las fechas del período se eligen en un calendario *(ajusta D87)* | [cumplimiento/resumen](cumplimiento/resumen.md) |
| D106 | Un solo sistema de diseño para Frontend y Frontend-Platform *(la aplicó desarrollo; Rod, no el comité)* | [plataforma](plataforma.md) |
| D107 | Navegación por grupos del menú lateral *(la aplicó desarrollo; Rod, no el comité)* | [plataforma](plataforma.md) |
| D108 | El banner con degradado solo se permite en el encabezado del shell de Cumplimiento *(la aplicó desarrollo; Rod, no el comité)* | [plataforma](plataforma.md) |
| D109 | Una sola tabla para todo el producto *(la aplicó desarrollo; Rod, no el comité)* | [plataforma](plataforma.md) |
| D110 | Integraciones es un módulo propio, con su sección en el menú y una interfaz única de conector *(la aprobó Rod, no el comité)* | [integraciones](integraciones.md) |
| D111 | Cada persona guarda su idioma y los correos salen en él; cambiar de idioma recarga la app *(la aprobó Rod, no el comité)* | [plataforma](plataforma.md) |
| D112 | GCP se conecta por federación de identidad desde el rol de AWS de Monkey (sesión = ID del cliente), sin claves; el motor solo recibe un token de 1 h | [control-tecnico](control-tecnico.md) |
| D113 | **Borrador.** La sonda de servidores en el Backend: la lee el trabajador aislado, cada servidor es un agente de su empresa (grupo = `tenant_id`, nombre = ID del activo) y `check_results` conserva una fila por check y corrida *(ajusta D54 y D71)* | [control-tecnico](control-tecnico.md) |
| D114 | Las opciones de conexión de GCP (alcance y método) las sirve el Backend con su disponibilidad y etiquetas; el frontend no las escribe *(la decidió Rod, no el comité)* | [control-tecnico](control-tecnico.md) |
| D115 | Un solo badge de rectángulo redondeado (código, atributo, estado) en las dos apps; color fijo por valor y punto en el estado *(la decidió Rod, no el comité)* | [plataforma](plataforma.md) |
| D116 | Esqueleton para el contenido que carga; spinner solo en procesos y en botones ocupados (`appBusy`), hasta recibir la respuesta *(la decidió Rod, no el comité)* | [plataforma](plataforma.md) |
| D117 | Un `admin_monkey` invita y desactiva a otros administradores; la baja dura 7 días y luego se borra; la auditoría conserva un sello (id, nombre y rol) *(amplía D103)* | [gestion-usuarios](gestion-usuarios.md) |
| D118 | El resumen del `responsable` y del `delegado` solo trae los marcos y las categorías donde tienen controles, calculados sobre los suyos *(concreta D102)* | [cumplimiento/resumen](cumplimiento/resumen.md) |
| D119 | El historial de un control dado de baja (evidencia, veredictos y observaciones) se sigue leyendo; solo desaparece de la lista y del detalle | [cumplimiento/controles](cumplimiento/controles.md) |
| D120 | En local se prueba solo lo que se toca (unitarias e integración de lo afectado); la suite completa es del CI; e2e con base plantilla y en paralelo | [entrega](entrega.md) |
| D121 | El veredicto manual se registra y se revisa en dos niveles, como la evidencia; el `admin_empresa` cuenta su propia aprobación *(concreta D102)* | [cumplimiento/veredictos](cumplimiento/veredictos.md) |

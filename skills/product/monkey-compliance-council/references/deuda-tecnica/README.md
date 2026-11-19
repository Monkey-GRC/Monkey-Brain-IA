# Deuda técnica — lo que está parchado y hay que revisar

Aquí vive lo que **se construyó a medias, con un supuesto o con un atajo** para no detener el
sprint, y que debe volver a revisarse. No es una lista de errores: cada deuda es una decisión
consciente con su razón, su riesgo y qué la cierra.

**Cómo se distingue de los otros documentos**

| Documento | Qué guarda |
|---|---|
| `datos/decisiones/README.md` | Lo que **ya se decidió** y por qué (incluye cómo se cubrió cada hueco: D43 a D46) |
| `datos/pendientes/README.md` | Preguntas de producto que **solo el comité o Nelson pueden responder** |
| **esta carpeta** | Parches de **desarrollo**: lo que funciona hoy pero no es la forma definitiva |

**Reglas:** una deuda se **borra** cuando se cierra (deja constancia en el commit o en la decisión que
la cierra). Los ID (`DT-n`) no se reutilizan. Si una deuda depende del comité, enlaza su pregunta en
`datos/pendientes/README.md` o pídela ahí: no se resuelve por cuenta propia.

**Severidad:** 🔴 **Crítica**: puede causar daño o engaño si se ignora · 🟠 **Importante**: limita el producto o al equipo ·
🟡 **Mejora**: pendiente sin urgencia.


---

## Dónde está cada ficha

**Un módulo, un archivo.** Son los mismos nombres de módulo que usa
[`../arquitectura/`](../arquitectura/README.md): si sabes de qué parte del producto hablas, sabes dónde buscar.

| Archivo | Fichas | El módulo que tendría que arreglarlo |
|---|---|---|
| [`autenticacion.md`](autenticacion.md) | 3 | [Autenticación](../arquitectura/autenticacion/README.md) |
| [`catalogo-maestro.md`](catalogo-maestro.md) | 5 | [Catálogo maestro](../arquitectura/catalogo-maestro/README.md) |
| [`control-tecnico.md`](control-tecnico.md) | 20 | [Control técnico](../arquitectura/control-tecnico/README.md) |
| [`cumplimiento.md`](cumplimiento.md) | 6 | [Cumplimiento](../arquitectura/cumplimiento/README.md) |
| [`empresas.md`](empresas.md) | 5 | [Empresas](../arquitectura/empresas/README.md) |
| [`gestion-usuarios.md`](gestion-usuarios.md) | 3 | [Gestión de usuarios](../arquitectura/gestion-usuarios/README.md) |
| [`notificaciones.md`](notificaciones.md) | 1 | [Notificaciones](../arquitectura/notificaciones/README.md) |
| [`onboarding.md`](onboarding.md) | 15 | [Onboarding](../arquitectura/onboarding/README.md) y sus tres componentes |
| [`plataforma.md`](plataforma.md) | 3 | [Plataforma](../arquitectura/plataforma/README.md) |
| [`roles-permisos.md`](roles-permisos.md) | 1 | [Roles y permisos](../arquitectura/roles-permisos/README.md) |
| [`trazabilidad.md`](trazabilidad.md) | 4 | [Trazabilidad](../arquitectura/trazabilidad/README.md) |
| [`entrega.md`](entrega.md) | 6 | **Ninguno**: pruebas, CI, despliegue, respaldos y runtime |

**La regla para clasificar una deuda nueva:** va al módulo **donde está el código que hay que cambiar**. Si toca
varios, al más específico. Y si la deuda es de una **capacidad compartida** (la subida de archivos, el cifrado,
el límite de peticiones), va al módulo que posee esa capacidad, una sola vez. Una deuda cuyo arreglo no vive en el producto (CI, despliegue, respaldos) va a
`entrega.md`.

Al crear una deuda: siguiente `DT-n` libre, su ficha en el archivo de su módulo, y una línea en el tablero de abajo,
en su severidad. Los requisitos de seguridad que una deuda incumple están en
[`../seguridad/`](../seguridad/README.md) (`SEG-n`), que apunta de vuelta a su `DT-n`.

## Tablero

Ordenado por severidad: empieza por arriba. Cada ID lleva a su ficha (qué está parchado, por qué y qué lo cierra).

### 🔴 Críticas

Pueden causar daño o engaño si se ignoran.

| ID | Qué | Módulo |
|---|---|---|
| [DT-43](control-tecnico.md#dt-43--el-motor-de-nube-se-probó-en-el-mismo-servidor-que-la-sonda-y-con-llaves-estáticas-del-cliente-guardadas-allí) | El motor de nube se probó en el mismo servidor que la sonda y con llaves estáticas del cliente guardadas allí | [Control técnico](control-tecnico.md) |

### 🟠 Importantes

Limitan el producto o al equipo.

| ID | Qué | Módulo |
|---|---|---|
| [DT-2](control-tecnico.md#dt-2--n18-y-checks_available-son-constantes) | «n/18» y `checks_available` son constantes | [Control técnico](control-tecnico.md) |
| [DT-3](onboarding.md#dt-3--ac_04-a-ac_06-se-completaron-por-analogía) | `ac_04` a `ac_06` se completaron por analogía | [Onboarding](onboarding.md) |
| [DT-4](onboarding.md#dt-4--credenciales-por-conexión-definidas-por-desarrollo) | Credenciales por conexión definidas por desarrollo | [Onboarding](onboarding.md) |
| [DT-5](plataforma.md#dt-5--llave-de-cifrado-en-el-env) | Llave de cifrado en el `.env` | [Plataforma](plataforma.md) |
| [DT-12](onboarding.md#dt-12--descripción-del-sistema-el-archivo-se-guarda-d51-pero-no-se-procesa) | Descripción del Sistema: el archivo se guarda (D51) pero no se procesa | [Onboarding](onboarding.md) |
| [DT-20](entrega.md#dt-20--las-pruebas-automáticas-están-a-medias-en-los-repositorios) | Las pruebas automáticas están a medias en los repositorios | [Entrega](entrega.md) |
| [DT-21](plataforma.md#dt-21--traducciones-al-inglés-hechas-por-desarrollo) | Traducciones al inglés hechas por desarrollo | [Plataforma](plataforma.md) |
| [DT-22](empresas.md#dt-22--base-de-datos-dedicada--no-disponible) | Base de datos dedicada → «no disponible» | [Empresas](empresas.md) |
| [DT-26](empresas.md#dt-26--los-marcos-se-contratan-solo-al-registrar-la-empresa) | Los marcos se contratan solo al registrar la empresa | [Empresas](empresas.md) |
| [DT-36](entrega.md#dt-36--el-env-de-pruebas-usa-el-superusuario-de-la-base-de-la-sonda-y-un-usuario-de-api-con-permisos-amplios) | El `.env` de pruebas usa el superusuario de la base de la sonda y un usuario de API con permisos amplios | [Entrega](entrega.md) |
| [DT-37](autenticacion.md#dt-37--el-límite-de-intentos-con-la-clave-de-acceso-vive-en-la-memoria-de-la-instancia) | El límite de intentos con la clave de acceso vive en la memoria de la instancia | [Autenticación](autenticacion.md) |
| [DT-38](catalogo-maestro.md#dt-38--las-categorías-de-cada-marco-siguen-siendo-las-5-de-soc-2) | Las categorías de cada marco siguen siendo las 5 de SOC 2 | [Catálogo maestro](catalogo-maestro.md) |
| [DT-44](control-tecnico.md#dt-44--check_results-no-guarda-recurso-ni-región) | `check_results` no guarda recurso ni región | [Control técnico](control-tecnico.md) |
| [DT-45](control-tecnico.md#dt-45--el-escaneo-por-todas-las-regiones-infla-resultados) | El escaneo por todas las regiones infla resultados | [Control técnico](control-tecnico.md) |
| [DT-46](entrega.md#dt-46--el-ci-no-bloquea-el-merge-ni-el-despliegue) | El CI no bloquea el merge ni el despliegue | [Entrega](entrega.md) |
| [DT-48](control-tecnico.md#dt-48--check_results-no-tiene-política-de-retención-ni-de-partición) | `check_results` no tiene política de retención ni de partición | [Control técnico](control-tecnico.md) |
| [DT-49](control-tecnico.md#dt-49--el-módulo-de-operación-continua-no-tiene-contrato) | El módulo de operación continua no tiene contrato | [Control técnico](control-tecnico.md) |
| [DT-50](control-tecnico.md#dt-50--el-intérprete-check_results--evaluations-solo-cubre-el-motor-de-nube) | El intérprete `check_results → evaluations` solo cubre el motor de nube | [Control técnico](control-tecnico.md) |
| [DT-51](control-tecnico.md#dt-51--el-trabajador-usa-un-proxy-de-docker-que-filtra-por-ruta-no-por-contenido) | El trabajador usa un proxy de Docker que filtra por ruta, no por contenido | [Control técnico](control-tecnico.md) |
| [DT-54](entrega.md#dt-54--el-backend-el-ci-y-el-dockerfile-corren-en-node-20) | El Backend, el CI y el `Dockerfile` corren en Node 20 | [Entrega](entrega.md) |
| [DT-59](control-tecnico.md#dt-59--el-sistema-operativo-de-un-servidor-de-la-nube-es-una-inferencia) | El sistema operativo de un servidor de la nube es una inferencia | [Control técnico](control-tecnico.md) |
| [DT-60](control-tecnico.md#dt-60--sin-límite-de-uso-ni-cola-justa-en-la-comprobación-y-la-evaluación) | Sin límite de uso ni cola justa en la comprobación y la evaluación | [Control técnico](control-tecnico.md) |
| [DT-61](control-tecnico.md#dt-61--las-llaves-base-de-aws-identidad-monkey-audit-son-de-larga-vida-y-viven-en-varios-sitios) | Las llaves base de AWS (identidad `monkey-audit`) son de larga vida y viven en varios sitios: | [Control técnico](control-tecnico.md) |
| [DT-63](onboarding.md#dt-63--un-activo-descubierto-no-se-puede-editar) | Un activo descubierto no se puede editar | [Onboarding](onboarding.md) |
| [DT-66](control-tecnico.md#dt-66--el-estado-de-preparación-de-un-activo-se-calcula-por-severidad) | El estado de preparación de un activo se calcula por severidad | [Control técnico](control-tecnico.md) |
| [DT-69](catalogo-maestro.md#dt-69--las-dimensiones-de-cada-control-no-coinciden-con-las-que-define-el-comité) | Las dimensiones de cada control no coinciden con las que define el comité | [Catálogo maestro](catalogo-maestro.md) |
| [DT-100](catalogo-maestro.md#dt-100--el-catálogo-del-comité-solo-está-en-español) | El catálogo del comité solo está en español | [Catálogo maestro](catalogo-maestro.md) |
| [DT-71](cumplimiento.md#dt-71--la-lectura-de-controles-fija-valores-que-el-modelo-ya-prevé) | La lectura de controles fija valores que el modelo ya prevé | [Cumplimiento](cumplimiento.md) |
| [DT-76](cumplimiento.md#dt-76--las-plantillas-de-evidencia-del-catálogo-no-dicen-a-qué-prueba-sirve-cada-documento-y-el-estado-documental-por-control-se-apartó-de-rn-13) | Las plantillas de evidencia del catálogo no dicen a qué prueba sirve cada documento, y el estado documental por control se apartó de RN-13 | [Cumplimiento](cumplimiento.md) |
| [DT-77](onboarding.md#dt-77--evaluar-los-riesgos-antes-de-declarar-activos-se-exige-solo-en-la-pantalla) | Evaluar los riesgos antes de declarar activos se exige solo en la pantalla | [Onboarding](onboarding.md) |
| [DT-78](control-tecnico.md#dt-78--la-guía-de-corrección-de-una-prueba-técnica-es-una-traducción-automática-sin-revisar-y-el-filtro-del-proveedor-es-una-red-de-seguridad) | La guía de corrección de una prueba técnica es una traducción automática sin revisar, y el filtro del proveedor es una red de seguridad | [Control técnico](control-tecnico.md) |
| [DT-79](trazabilidad.md#dt-79--solo-algunas-escrituras-dejan-el-evento-de-cambio-de-estado-de-un-control) | Solo algunas escrituras dejan el evento de cambio de estado de un control | [Trazabilidad](trazabilidad.md) |
| [DT-81](onboarding.md#dt-81--el-escenario-de-despliegue-ya-no-se-pregunta-pero-su-columna-y-sus-tablas-siguen-en-la-base) | El escenario de despliegue ya no se pregunta, pero su columna y sus tablas siguen en la base | [Onboarding](onboarding.md) |
| [DT-83](notificaciones.md#dt-83--falta-el-aviso-a-los-admin_monkey-de-que-una-empresa-está-por-borrarse) | Falta el aviso a los `admin_monkey` de que una empresa está por borrarse | [Notificaciones](notificaciones.md) |
| [DT-84](entrega.md#dt-84--el-respaldo-con-rotación-a-35-días-solo-existe-como-script-de-staging-y-nada-comprueba-que-corra) | El respaldo con rotación a 35 días solo existe como script de staging, y nada comprueba que corra | [Entrega](entrega.md) |
| [DT-85](empresas.md#dt-85--la-clave-de-acceso-viaja-en-claro-por-un-servicio-de-correo-externo-y-el-resultado-del-envío-no-se-guarda) | La clave de acceso viaja en claro por un servicio de correo externo y el resultado del envío no se guarda | [Empresas](empresas.md) |

### 🟡 Mejoras

Pendientes sin urgencia.

| ID | Qué | Módulo |
|---|---|---|
| [DT-112](roles-permisos.md#dt-112--los-grupos-de-permiso-por-rol-están-repetidos-en-cada-pantalla-de-platform) | Los grupos de permiso por rol están repetidos en cada pantalla de Platform | [Roles y permisos](roles-permisos.md) |
| [DT-111](autenticacion.md#dt-111--bcrypt-sin-tope-de-comparaciones-simultáneas-ante-ráfagas-de-login) | `bcrypt` sin tope de comparaciones simultáneas ante ráfagas de login | [Autenticación](autenticacion.md) |
| [DT-109](trazabilidad.md#dt-109--technical-control-importa-el-registrador-de-cambios-de-estado-desde-dentro-de-compliance) | `technical-control` importa el registrador de cambios de estado desde dentro de `compliance` | [Trazabilidad](trazabilidad.md) |
| [DT-103](control-tecnico.md#dt-103--no-se-ha-probado-que-la-identidad-de-aws-de-monkey-asuma-el-rol-de-una-cuenta-de-aws-de-otro-dueño) | No se ha probado que la identidad de AWS de Monkey asuma el rol de una cuenta de AWS de otro dueño | [Control técnico](control-tecnico.md) |
| [DT-102](control-tecnico.md#dt-102--la-conexión-de-gcp-no-descubre-los-recursos-del-proyecto-al-validar) | La conexión de GCP no descubre los recursos del proyecto al validar | [Control técnico](control-tecnico.md) |
| [DT-7](onboarding.md#dt-7--híbrido-ofrece-las-6-conexiones) | «Híbrido» ofrece las 6 conexiones | [Onboarding](onboarding.md) |
| [DT-8](onboarding.md#dt-8--el-tipo-del-activo-se-deduce-de-la-conexión) | El tipo del activo se deduce de la conexión | [Onboarding](onboarding.md) |
| [DT-11](onboarding.md#dt-11--un-activo-dado-de-baja-no-se-puede-ver-ni-restaurar) | Un activo dado de baja no se puede ver ni restaurar | [Onboarding](onboarding.md) |
| [DT-14](onboarding.md#dt-14--el-clonado-es-síncrono) | El clonado es síncrono | [Onboarding](onboarding.md) |
| [DT-15](onboarding.md#dt-15--el-nombre-único-del-servicio-por-empresa-lo-impone-la-aplicación) | El nombre único del servicio por empresa lo impone la aplicación | [Onboarding](onboarding.md) |
| [DT-16](onboarding.md#dt-16--evaluation_period--trimestre-natural-de-la-contratación) | `evaluation_period` = trimestre natural de la contratación | [Onboarding](onboarding.md) |
| [DT-17](onboarding.md#dt-17--trust_criterion_required-del-contrato-no-se-usa) | `TRUST_CRITERION_REQUIRED` del contrato no se usa | [Onboarding](onboarding.md) |
| [DT-18](onboarding.md#dt-18--sin-guardado-parcial-en-el-servidor) | Sin guardado parcial en el servidor | [Onboarding](onboarding.md) |
| [DT-27](empresas.md#dt-27--el-contrato-guarda-solo-el-marco-y-la-fecha) | El contrato guarda solo el marco y la fecha | [Empresas](empresas.md) |
| [DT-29](trazabilidad.md#dt-29--authlogin_failed-se-guarda-con-tenant_id-nulo) | `auth.login_failed` se guarda con `tenant_id` nulo | [Trazabilidad](trazabilidad.md) |
| [DT-30](entrega.md#dt-30--las-pruebas-de-jest-no-corren-en-máquinas-windows-sin-el-runtime-de-visual-c) | Las pruebas de jest no corren en máquinas Windows sin el runtime de Visual C++ | [Entrega](entrega.md) |
| [DT-40](catalogo-maestro.md#dt-40--la-lista-de-18-normas-de-protección-de-datos-la-depuró-desarrollo-no-el-comité) | La lista de 18 normas de protección de datos la depuró desarrollo, no el comité | [Catálogo maestro](catalogo-maestro.md) |
| [DT-41](empresas.md#dt-41--contactar-a-mercadeo-es-un-mock) | «Contactar a mercadeo» es un mock | [Empresas](empresas.md) |
| [DT-47](trazabilidad.md#dt-47--los-cierres-automáticos-de-sesión-no-dejan-rastro) | Los cierres automáticos de sesión no dejan rastro | [Trazabilidad](trazabilidad.md) |
| [DT-52](control-tecnico.md#dt-52--el-trabajador-solo-conoce-aws-una-corrida-a-la-vez-por-réplica-y-el-canal-de-llaves-entrega-llaves-de-larga-vida) | El trabajador solo conoce AWS, una corrida a la vez por réplica, y el canal de llaves entrega llaves de larga vida | [Control técnico](control-tecnico.md) |
| [DT-53](control-tecnico.md#dt-53--la-imagen-del-motor-pesa-33-gb) | La imagen del motor pesa 3,3 GB: | [Control técnico](control-tecnico.md) |
| [DT-55](onboarding.md#dt-55--la-plantilla-del-rol-se-descarga-y-se-crea-a-mano) | La plantilla del rol se descarga y se crea a mano | [Onboarding](onboarding.md) |
| [DT-62](control-tecnico.md#dt-62--no-se-ha-verificado-que-el-identificador-de-un-recurso-descubierto-coincida-con-el-que-trae-la-evaluación) | No se ha verificado que el identificador de un recurso descubierto coincida con el que trae la evaluación | [Control técnico](control-tecnico.md) |
| [DT-64](control-tecnico.md#dt-64--la-preparación-por-servicio-no-tiene-pantalla) | La preparación por servicio no tiene pantalla | [Control técnico](control-tecnico.md) |
| [DT-68](catalogo-maestro.md#dt-68--los-logos-no-vienen-del-kit-de-cada-marca) | Los logos no vienen del kit de cada marca | [Catálogo maestro](catalogo-maestro.md) |
| [DT-72](cumplimiento.md#dt-72--el-vencimiento-de-una-exclusión-no-deja-evento-de-cumplimiento) | El vencimiento de una exclusión no deja evento de cumplimiento | [Cumplimiento](cumplimiento.md) |
| [DT-73](cumplimiento.md#dt-73--evaluationsresult-no-distingue-error-ni-excluded) | `evaluations.result` no distingue `error` ni `excluded` | [Cumplimiento](cumplimiento.md) |
| [DT-74](cumplimiento.md#dt-74--la-exclusión-de-un-check-no-tiene-endpoint) | La exclusión de un check no tiene endpoint | [Cumplimiento](cumplimiento.md) |
| [DT-80](cumplimiento.md#dt-80--el-veredicto-manual-usa-el-tipo-de-la-dimensión-del-control) | El veredicto manual usa el tipo de la dimensión del control | [Cumplimiento](cumplimiento.md) |
| [DT-90](gestion-usuarios.md#dt-90--el-envío-de-la-invitación-es-directo-sin-cola-ni-reintentos-y-su-resultado-no-se-guarda) | El envío de la invitación es directo, sin cola ni reintentos, y su resultado no se guarda | [Gestión de usuarios](gestion-usuarios.md) |
| [DT-107](gestion-usuarios.md#dt-107--la-función-que-lista-los-administradores-por-purgar-no-comprueba-el-rol-dentro-de-ella) | La función que lista los administradores por purgar no comprueba el rol dentro de ella | [Gestión de usuarios](gestion-usuarios.md) |
| [DT-108](gestion-usuarios.md#dt-108--el-filtro-de-estado-y-el-rol-de-la-invitación-de-administradores-se-escriben-en-el-frontend) | El filtro de estado y el rol de la invitación de administradores se escriben en el frontend | [Gestión de usuarios](gestion-usuarios.md) |
| [DT-106](control-tecnico.md#dt-106--el-retiro-del-agente-de-un-servidor-dado-de-baja-caduca-a-los-2-minutos-si-no-hay-trabajador) | El retiro del agente de un servidor dado de baja caduca a los 2 minutos si no hay trabajador | [Control técnico](control-tecnico.md) |
| [DT-99](plataforma.md#dt-99--lint-de-los-frontends-reglas-apagadas-y-dependencias-de-desarrollo-con-avisos) | Lint de los frontends: reglas apagadas y dependencias de desarrollo con avisos | [Plataforma](plataforma.md) |

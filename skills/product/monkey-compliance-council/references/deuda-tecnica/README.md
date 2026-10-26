# Deuda técnica — lo que está parchado y hay que revisar

Aquí vive lo que **se construyó a medias, con un supuesto o con un atajo** para no detener el
sprint, y que debe volver a revisarse. No es una lista de errores: cada deuda es una decisión
consciente con su razón, su riesgo y qué la cierra.

**Cómo se distingue de los otros documentos**

| Documento | Qué guarda |
|---|---|
| `modelo-datos-decisiones.md` | Lo que **ya se decidió** y por qué (incluye cómo se cubrió cada hueco: D43 a D46) |
| `modelo-datos-pendientes.md` | Preguntas de producto que **solo el comité o Nelson pueden responder** |
| **esta carpeta** | Parches de **desarrollo**: lo que funciona hoy pero no es la forma definitiva |

**Reglas:** una deuda se **borra** cuando se cierra (deja constancia en el commit o en la decisión que
la cierra). Los ID (`DT-n`) no se reutilizan. Si una deuda depende del comité, enlaza su pregunta en
`modelo-datos-pendientes.md` o pídela ahí: no se resuelve por cuenta propia.

**Severidad:** 🔴 **Crítica**: puede causar daño o engaño si se ignora · 🟠 **Importante**: limita el producto o al equipo ·
🟡 **Mejora**: pendiente sin urgencia.


---

## Dónde está cada cosa

| Archivo | Qué cubre |
|---|---|
| [`control-tecnico.md`](control-tecnico.md) | Componente 3 del onboarding: conexión de activos, la sonda, el paso 3, la nube y su ejecución |
| [`onboarding.md`](onboarding.md) | Componentes 1 y 2 del onboarding y el registro de empresa |
| [`transversal.md`](transversal.md) | Pruebas y CI, auditoría, traducciones, entorno y funcionalidad sin contrato |

Cada deuda tiene su ficha en el archivo de su **área**. Al crear una deuda nueva: siguiente `DT-n` libre, en el archivo que corresponda,
y una línea en el tablero de abajo, en su severidad. Los requisitos de seguridad que una deuda incumple están en
[`../seguridad/requisitos.md`](../seguridad/requisitos.md) (`SEG-n`), que apunta de vuelta a su `DT-n`.

## Tablero

Ordenado por severidad: empieza por arriba. Cada ID lleva a su ficha (qué está parchado, por qué y qué lo cierra).

### 🔴 Críticas

Pueden causar daño o engaño si se ignoran.

| ID | Qué | Área |
|---|---|---|
| [DT-1](control-tecnico.md#dt-1--la-sonda-es-simulada-o-no-está-disponible) | La sonda es simulada o no está disponible | [Control técnico](control-tecnico.md) |
| [DT-32](control-tecnico.md#dt-32--no-hay-vínculo-activo--agente) | No hay vínculo activo ↔ agente | [Control técnico](control-tecnico.md) |
| [DT-33](control-tecnico.md#dt-33--aislamiento-entre-empresas-sin-imponer) | Aislamiento entre empresas sin imponer | [Control técnico](control-tecnico.md) |
| [DT-43](control-tecnico.md#dt-43--el-motor-de-nube-se-probó-en-el-mismo-servidor-que-la-sonda-y-con-llaves-estáticas-del-cliente-guardadas-allí) | El motor de nube se probó en el mismo servidor que la sonda y con llaves estáticas del cliente guardadas allí | [Control técnico](control-tecnico.md) |

### 🟠 Importantes

Limitan el producto o al equipo.

| ID | Qué | Área |
|---|---|---|
| [DT-2](control-tecnico.md#dt-2--n18-y-checks_available-son-constantes) | «n/18» y `checks_available` son constantes | [Control técnico](control-tecnico.md) |
| [DT-3](control-tecnico.md#dt-3--ac_04-a-ac_06-se-completaron-por-analogía) | `ac_04` a `ac_06` se completaron por analogía | [Control técnico](control-tecnico.md) |
| [DT-4](control-tecnico.md#dt-4--credenciales-por-conexión-definidas-por-desarrollo) | Credenciales por conexión definidas por desarrollo | [Control técnico](control-tecnico.md) |
| [DT-5](control-tecnico.md#dt-5--llave-de-cifrado-en-el-env) | Llave de cifrado en el `.env` | [Control técnico](control-tecnico.md) |
| [DT-9](control-tecnico.md#dt-9--responsible_id-se-acepta-en-la-api-pero-no-hay-forma-de-crear-cargos) | `responsible_id` se acepta en la API pero no hay forma de crear cargos | [Control técnico](control-tecnico.md) |
| [DT-10](control-tecnico.md#dt-10--la-ui-promete-te-avisaremos-cuando-la-evaluación-automática-esté-disponible-y-no-existe-ningún-aviso) | La UI promete «te avisaremos» cuando la evaluación automática esté disponible, y no existe ningún aviso | [Control técnico](control-tecnico.md) |
| [DT-12](onboarding.md#dt-12--descripción-del-sistema-el-archivo-se-guarda-d51-pero-no-se-procesa) | Descripción del Sistema: el archivo se guarda (D51) pero no se procesa | [Onboarding](onboarding.md) |
| [DT-20](transversal.md#dt-20--las-pruebas-automáticas-están-a-medias-en-los-repositorios) | Las pruebas automáticas están a medias en los repositorios | [Transversal](transversal.md) |
| [DT-21](transversal.md#dt-21--traducciones-al-inglés-hechas-por-desarrollo) | Traducciones al inglés hechas por desarrollo | [Transversal](transversal.md) |
| [DT-22](transversal.md#dt-22--base-de-datos-dedicada--no-disponible) | Base de datos dedicada → «no disponible» | [Transversal](transversal.md) |
| [DT-25](transversal.md#dt-25--ver-el-catálogo-maestro-soc-2-en-monkey-admin-y-poder-crear-un-control-riesgo-o-causa-nuevos) | Ver el catálogo maestro SOC 2 en Monkey Admin y poder crear un control, riesgo o causa nuevos | [Transversal](transversal.md) |
| [DT-26](onboarding.md#dt-26--los-marcos-se-contratan-solo-al-registrar-la-empresa) | Los marcos se contratan solo al registrar la empresa | [Onboarding](onboarding.md) |
| [DT-34](control-tecnico.md#dt-34--cobertura-honesta-de-plataformas) | Cobertura honesta de plataformas | [Control técnico](control-tecnico.md) |
| [DT-35](control-tecnico.md#dt-35--conexión-a-la-nube-diferida) | Conexión a la nube diferida | [Control técnico](control-tecnico.md) |
| [DT-36](control-tecnico.md#dt-36--el-env-de-pruebas-usa-el-superusuario-de-la-base-de-la-sonda-y-un-usuario-de-api-con-permisos-amplios) | El `.env` de pruebas usa el superusuario de la base de la sonda y un usuario de API con permisos amplios | [Control técnico](control-tecnico.md) |
| [DT-37](onboarding.md#dt-37--el-límite-de-intentos-con-la-clave-de-acceso-vive-en-la-memoria-de-la-instancia) | El límite de intentos con la clave de acceso vive en la memoria de la instancia | [Onboarding](onboarding.md) |
| [DT-38](onboarding.md#dt-38--las-categorías-de-cada-marco-siguen-siendo-las-5-de-soc-2) | Las categorías de cada marco siguen siendo las 5 de SOC 2 | [Onboarding](onboarding.md) |
| [DT-44](control-tecnico.md#dt-44--check_results-no-guarda-recurso-ni-región) | `check_results` no guarda recurso ni región | [Control técnico](control-tecnico.md) |
| [DT-45](control-tecnico.md#dt-45--el-escaneo-por-todas-las-regiones-infla-resultados) | El escaneo por todas las regiones infla resultados | [Control técnico](control-tecnico.md) |
| [DT-46](transversal.md#dt-46--el-ci-no-bloquea-el-merge-ni-el-despliegue) | El CI no bloquea el merge ni el despliegue | [Transversal](transversal.md) |
| [DT-48](transversal.md#dt-48--check_results-no-tiene-política-de-retención-ni-de-partición) | `check_results` no tiene política de retención ni de partición | [Transversal](transversal.md) |
| [DT-49](transversal.md#dt-49--el-módulo-de-operación-continua-no-tiene-contrato) | El módulo de operación continua no tiene contrato | [Transversal](transversal.md) |
| [DT-50](transversal.md#dt-50--el-intérprete-check_results--evaluations-solo-cubre-el-motor-de-nube) | El intérprete `check_results → evaluations` solo cubre el motor de nube | [Transversal](transversal.md) |
| [DT-51](control-tecnico.md#dt-51--el-trabajador-usa-un-proxy-de-docker-que-filtra-por-ruta-no-por-contenido) | El trabajador usa un proxy de Docker que filtra por ruta, no por contenido | [Control técnico](control-tecnico.md) |
| [DT-54](transversal.md#dt-54--el-backend-el-ci-y-el-dockerfile-corren-en-node-20) | El Backend, el CI y el `Dockerfile` corren en Node 20 | [Transversal](transversal.md) |
| [DT-57](control-tecnico.md#dt-57--el-canal-de-agente-solo-existe-como-diseño) | El canal de agente solo existe como diseño: | [Control técnico](control-tecnico.md) |
| [DT-59](control-tecnico.md#dt-59--el-sistema-operativo-de-un-servidor-de-la-nube-es-una-inferencia) | El sistema operativo de un servidor de la nube es una inferencia | [Control técnico](control-tecnico.md) |
| [DT-60](control-tecnico.md#dt-60--sin-límite-de-uso-ni-cola-justa-en-la-comprobación-y-la-evaluación) | Sin límite de uso ni cola justa en la comprobación y la evaluación | [Control técnico](control-tecnico.md) |
| [DT-61](control-tecnico.md#dt-61--las-llaves-base-de-aws-identidad-monkey-audit-son-de-larga-vida-y-viven-en-varios-sitios) | Las llaves base de AWS (identidad `monkey-audit`) son de larga vida y viven en varios sitios: | [Control técnico](control-tecnico.md) |
| [DT-63](control-tecnico.md#dt-63--un-activo-descubierto-no-se-puede-editar) | Un activo descubierto no se puede editar | [Control técnico](control-tecnico.md) |
| [DT-66](control-tecnico.md#dt-66--el-estado-de-preparación-de-un-activo-se-calcula-por-severidad) | El estado de preparación de un activo se calcula por severidad | [Control técnico](control-tecnico.md) |
| [DT-69](control-tecnico.md#dt-69--las-dimensiones-de-cada-control-no-coinciden-con-las-que-define-el-comité) | Las dimensiones de cada control no coinciden con las que define el comité | [Control técnico](control-tecnico.md) |
| [DT-71](transversal.md#dt-71--la-lectura-de-controles-fija-valores-que-el-modelo-ya-prevé) | La lectura de controles fija valores que el modelo ya prevé | [Transversal](transversal.md) |
| [DT-76](transversal.md#dt-76--las-plantillas-de-evidencia-del-catálogo-no-dicen-a-qué-prueba-sirve-cada-documento-y-el-estado-documental-por-control-se-apartó-de-rn-13) | Las plantillas de evidencia del catálogo no dicen a qué prueba sirve cada documento, y el estado documental por control se apartó de RN-13 | [Transversal](transversal.md) |
| [DT-77](transversal.md#dt-77--evaluar-los-riesgos-antes-de-declarar-activos-se-exige-solo-en-la-pantalla) | Evaluar los riesgos antes de declarar activos se exige solo en la pantalla | [Transversal](transversal.md) |
| [DT-78](transversal.md#dt-78--la-guía-de-corrección-de-una-prueba-técnica-es-una-traducción-automática-sin-revisar-y-el-filtro-del-proveedor-es-una-red-de-seguridad) | La guía de corrección de una prueba técnica es una traducción automática sin revisar, y el filtro del proveedor es una red de seguridad | [Transversal](transversal.md) |
| [DT-79](transversal.md#dt-79--solo-algunas-escrituras-dejan-el-evento-de-cambio-de-estado-de-un-control) | Solo algunas escrituras dejan el evento de cambio de estado de un control | [Transversal](transversal.md) |
| [DT-80](transversal.md#dt-80--el-veredicto-manual-usa-el-tipo-de-la-dimensión-del-control-y-no-exige-explicar-las-observaciones-abiertas) | El veredicto manual usa el tipo de la dimensión del control y no exige explicar las observaciones abiertas | [Transversal](transversal.md) |
| [DT-81](control-tecnico.md#dt-81--el-escenario-de-despliegue-ya-no-se-pregunta-pero-su-columna-y-sus-tablas-siguen-en-la-base) | El escenario de despliegue ya no se pregunta, pero su columna y sus tablas siguen en la base | [Control técnico](control-tecnico.md) |
| [DT-82](transversal.md#dt-82--la-lista-de-servicios-lee-cada-servicio-por-separado-y-solo-aguanta-porque-se-alargó-el-tiempo-de-la-transacción) | La lista de servicios lee cada servicio por separado y solo aguanta porque se alargó el tiempo de la transacción | [Transversal](transversal.md) |

### 🟡 Mejoras

Pendientes sin urgencia.

| ID | Qué | Área |
|---|---|---|
| [DT-7](control-tecnico.md#dt-7--híbrido-ofrece-las-6-conexiones) | «Híbrido» ofrece las 6 conexiones | [Control técnico](control-tecnico.md) |
| [DT-8](control-tecnico.md#dt-8--el-tipo-del-activo-se-deduce-de-la-conexión) | El tipo del activo se deduce de la conexión | [Control técnico](control-tecnico.md) |
| [DT-11](control-tecnico.md#dt-11--un-activo-dado-de-baja-no-se-puede-ver-ni-restaurar) | Un activo dado de baja no se puede ver ni restaurar | [Control técnico](control-tecnico.md) |
| [DT-14](onboarding.md#dt-14--el-clonado-es-síncrono) | El clonado es síncrono | [Onboarding](onboarding.md) |
| [DT-15](onboarding.md#dt-15--el-nombre-único-del-servicio-por-empresa-lo-impone-la-aplicación) | El nombre único del servicio por empresa lo impone la aplicación | [Onboarding](onboarding.md) |
| [DT-16](onboarding.md#dt-16--evaluation_period--trimestre-natural-de-la-contratación) | `evaluation_period` = trimestre natural de la contratación | [Onboarding](onboarding.md) |
| [DT-17](onboarding.md#dt-17--trust_criterion_required-del-contrato-no-se-usa) | `TRUST_CRITERION_REQUIRED` del contrato no se usa | [Onboarding](onboarding.md) |
| [DT-18](onboarding.md#dt-18--sin-guardado-parcial-en-el-servidor) | Sin guardado parcial en el servidor | [Onboarding](onboarding.md) |
| [DT-24](transversal.md#dt-24--tailwind-avisa-de-clases-canónicas-darkbg-white003--darkbg-white3-en-platfor) | Tailwind avisa de clases canónicas (`dark:bg-white/[0.03]` → `dark:bg-white/3`) en Platfor | [Transversal](transversal.md) |
| [DT-27](onboarding.md#dt-27--el-contrato-guarda-solo-el-marco-y-la-fecha) | El contrato guarda solo el marco y la fecha | [Onboarding](onboarding.md) |
| [DT-29](transversal.md#dt-29--authlogin_failed-se-guarda-con-tenant_id-nulo) | `auth.login_failed` se guarda con `tenant_id` nulo | [Transversal](transversal.md) |
| [DT-30](transversal.md#dt-30--las-pruebas-de-jest-no-corren-en-máquinas-windows-sin-el-runtime-de-visual-c) | Las pruebas de jest no corren en máquinas Windows sin el runtime de Visual C++ | [Transversal](transversal.md) |
| [DT-40](onboarding.md#dt-40--la-lista-de-18-normas-de-protección-de-datos-la-depuró-desarrollo-no-el-comité) | La lista de 18 normas de protección de datos la depuró desarrollo, no el comité | [Onboarding](onboarding.md) |
| [DT-41](onboarding.md#dt-41--contactar-a-mercadeo-es-un-mock) | «Contactar a mercadeo» es un mock | [Onboarding](onboarding.md) |
| [DT-42](onboarding.md#dt-42--los-textos-auditoría-de-inicio-y-de-mis-servicios-no-se-cambiaron-a-consultoría) | Los textos «auditoría» de Inicio y de «Mis servicios» no se cambiaron a «consultoría» | [Onboarding](onboarding.md) |
| [DT-47](transversal.md#dt-47--los-cierres-automáticos-de-sesión-no-dejan-rastro) | Los cierres automáticos de sesión no dejan rastro | [Transversal](transversal.md) |
| [DT-52](control-tecnico.md#dt-52--el-trabajador-solo-conoce-aws-una-corrida-a-la-vez-por-réplica-y-el-canal-de-llaves-entrega-llaves-de-larga-vida) | El trabajador solo conoce AWS, una corrida a la vez por réplica, y el canal de llaves entrega llaves de larga vida | [Control técnico](control-tecnico.md) |
| [DT-53](control-tecnico.md#dt-53--la-imagen-del-motor-pesa-33-gb) | La imagen del motor pesa 3,3 GB: | [Control técnico](control-tecnico.md) |
| [DT-55](control-tecnico.md#dt-55--la-plantilla-del-rol-se-descarga-y-se-crea-a-mano) | La plantilla del rol se descarga y se crea a mano | [Control técnico](control-tecnico.md) |
| [DT-58](control-tecnico.md#dt-58--frontend-platform-no-tiene-pruebas-automáticas) | `Frontend-Platform` no tiene pruebas automáticas | [Control técnico](control-tecnico.md) |
| [DT-62](control-tecnico.md#dt-62--no-se-ha-verificado-que-el-identificador-de-un-recurso-descubierto-coincida-con-el-que-trae-la-evaluación) | No se ha verificado que el identificador de un recurso descubierto coincida con el que trae la evaluación | [Control técnico](control-tecnico.md) |
| [DT-64](control-tecnico.md#dt-64--la-preparación-por-servicio-no-tiene-pantalla) | La preparación por servicio no tiene pantalla | [Control técnico](control-tecnico.md) |
| [DT-68](control-tecnico.md#dt-68--los-logos-no-vienen-del-kit-de-cada-marca) | Los logos no vienen del kit de cada marca | [Control técnico](control-tecnico.md) |
| [DT-72](transversal.md#dt-72--el-vencimiento-de-una-exclusión-no-deja-evento-de-cumplimiento) | El vencimiento de una exclusión no deja evento de cumplimiento | [Transversal](transversal.md) |
| [DT-73](transversal.md#dt-73--evaluationsresult-no-distingue-error-ni-excluded) | `evaluations.result` no distingue `error` ni `excluded` | [Transversal](transversal.md) |
| [DT-74](transversal.md#dt-74--la-exclusión-de-un-check-no-tiene-endpoint) | La exclusión de un check no tiene endpoint | [Transversal](transversal.md) |

# Deuda técnica — lo que está parchado y hay que revisar

Aquí vive lo que **se construyó a medias, con un supuesto o con un atajo** para no detener el
sprint, y que debe volver a revisarse. No es una lista de errores: cada fila es una decisión
consciente con su razón, su riesgo y qué la cierra.

**Cómo se distingue de los otros documentos**

| Documento | Qué guarda |
|---|---|
| `modelo-datos-decisiones.md` | Lo que **ya se decidió** y por qué (incluye cómo se cubrió cada hueco: D43 a D46) |
| `modelo-datos-pendientes.md` | Preguntas de producto que **solo el comité o Nelson pueden responder** |
| **esta carpeta** | Parches de **desarrollo**: lo que funciona hoy pero no es la forma definitiva |

**Reglas:** una fila se **borra** cuando se cierra (deja constancia en el commit o en la decisión que
la cierra). Los ID (`DT-n`) no se reutilizan. Si una fila depende del comité, enlaza su pregunta en
`modelo-datos-pendientes.md` o pídela ahí: no se resuelve por cuenta propia.

**Severidad:** 🔴 puede causar daño o engaño si se ignora · 🟠 limita el producto o el equipo ·
🟡 mejora pendiente.


---

## Dónde está cada cosa

| Archivo | Qué cubre | Filas |
|---|---|---|
| [`control-tecnico.md`](control-tecnico.md) | Componente 3 del onboarding: conexión de activos, la sonda, el paso 3, la nube y su ejecución | 27 |
| [`onboarding.md`](onboarding.md) | Componentes 1 y 2 del onboarding y el registro de empresa | 16 |
| [`transversal.md`](transversal.md) | Pruebas y CI, auditoría, traducciones, entorno y funcionalidad sin contrato | 15 |

Una fila vive en el archivo de su **área**. Al crear una deuda nueva: siguiente `DT-n` libre, en el archivo que corresponda,
y una línea en el índice de abajo. Los requisitos de seguridad que una deuda incumple están en
[`../seguridad/requisitos.md`](../seguridad/requisitos.md) (`SEG-n`), que apunta de vuelta a su `DT-n`.

## Índice de todas las deudas

58 filas (incluye las cerradas, tachadas). Severidad: ✅ 2 · 🔴 6 · 🟠 28 · 🟡 22.

| ID | | Qué | Archivo |
|---|---|---|---|
| DT-1 | 🔴 | La sonda es simulada o no está disponible. | [control-tecnico](control-tecnico.md) |
| DT-2 | 🟠 | «n/18» y checks_available son constantes | [control-tecnico](control-tecnico.md) |
| DT-3 | 🟠 | ac_04 a ac_06 se completaron por analogía | [control-tecnico](control-tecnico.md) |
| DT-4 | 🟠 | Credenciales por conexión definidas por desarrollo | [control-tecnico](control-tecnico.md) |
| DT-5 | 🟠 | Llave de cifrado en el .env. | [control-tecnico](control-tecnico.md) |
| DT-7 | 🟡 | «Híbrido» ofrece las 6 conexiones | [control-tecnico](control-tecnico.md) |
| DT-8 | 🟡 | El tipo del activo se deduce de la conexión. | [control-tecnico](control-tecnico.md) |
| DT-9 | 🟠 | responsible_id se acepta en la API pero no hay forma de crear cargos | [control-tecnico](control-tecnico.md) |
| DT-10 | 🟠 | La UI promete «te avisaremos» cuando la evaluación automática esté disponible, y no existe ningún aviso | [control-tecnico](control-tecnico.md) |
| DT-11 | 🟡 | Un activo dado de baja no se puede ver ni restaurar | [control-tecnico](control-tecnico.md) |
| DT-12 | 🟠 | Descripción del Sistema: el archivo se guarda (D51) pero no se procesa. | [onboarding](onboarding.md) |
| DT-13 | ✅ | Controles clonados `manual` y sin dimensiones Cerrada: Héctor sembró `control_dimensions` (D39) y su clonado ( | [onboarding](onboarding.md) |
| DT-14 | 🟡 | El clonado es síncrono | [onboarding](onboarding.md) |
| DT-15 | 🟡 | El nombre único del servicio por empresa lo impone la aplicación | [onboarding](onboarding.md) |
| DT-16 | 🟡 | evaluation_period = trimestre natural de la contratación | [onboarding](onboarding.md) |
| DT-17 | 🟡 | no se usa | [onboarding](onboarding.md) |
| DT-18 | 🟡 | Sin guardado parcial en el servidor. | [onboarding](onboarding.md) |
| DT-19 | 🟡 | business_model trae 19 de «40+» | [onboarding](onboarding.md) |
| DT-20 | 🟠 | Las pruebas automáticas están a medias en los repositorios. | [transversal](transversal.md) |
| DT-21 | 🟠 | Traducciones al inglés hechas por desarrollo | [transversal](transversal.md) |
| DT-22 | 🟠 | Base de datos dedicada → «no disponible» | [transversal](transversal.md) |
| DT-23 | 🟠 | Sin MFA | [transversal](transversal.md) |
| DT-24 | 🟡 | Tailwind avisa de clases canónicas (dark:bg-white/[0.03] → dark:bg-white/3) en Platform | [transversal](transversal.md) |
| DT-25 | 🟠 | Ver el catálogo maestro SOC 2 en Monkey Admin y poder crear un control, riesgo o causa nuevos. | [transversal](transversal.md) |
| DT-26 | 🟠 | Los marcos se contratan solo al registrar la empresa. | [onboarding](onboarding.md) |
| DT-27 | 🟡 | El contrato guarda solo el marco y la fecha | [onboarding](onboarding.md) |
| DT-28 | ✅ | La auditoría de login, canje y registro de empresa se escribía después de la acción, no en la misma transacció | [transversal](transversal.md) |
| DT-29 | 🟡 | auth.login_failed se guarda con tenant_id nulo | [transversal](transversal.md) |
| DT-30 | 🟡 | Las pruebas de jest no corren en máquinas Windows sin el runtime de Visual C++ | [transversal](transversal.md) |
| DT-31 | 🔴 | El formulario de «Conectar mi primer sistema» pide credenciales que el modelo real no usa. | [control-tecnico](control-tecnico.md) |
| DT-32 | 🔴 | No hay vínculo activo ↔ agente. | [control-tecnico](control-tecnico.md) |
| DT-33 | 🔴 | Aislamiento entre empresas sin imponer. | [control-tecnico](control-tecnico.md) |
| DT-34 | 🟠 | Cobertura honesta de plataformas. | [control-tecnico](control-tecnico.md) |
| DT-35 | 🟠 | Conexión a la nube diferida. | [control-tecnico](control-tecnico.md) |
| DT-36 | 🟠 | El .env de pruebas usa el superusuario de la base de la sonda y un usuario de API con permisos amplios | [control-tecnico](control-tecnico.md) |
| DT-37 | 🟠 | El límite de intentos con la clave de acceso vive en la memoria de la instancia. | [onboarding](onboarding.md) |
| DT-38 | 🟠 | Las categorías de cada marco siguen siendo las 5 de SOC 2. | [onboarding](onboarding.md) |
| DT-39 | 🔴 | El adaptador de almacenamiento (S3 / minio) no se ha probado contra un minio real. | [onboarding](onboarding.md) |
| DT-40 | 🟡 | La lista de 18 normas de protección de datos la depuró desarrollo, no el comité. | [onboarding](onboarding.md) |
| DT-41 | 🟡 | «Contactar a mercadeo» es un mock. | [onboarding](onboarding.md) |
| DT-42 | 🟡 | Los textos «auditoría» de Inicio y de «Mis servicios» no se cambiaron a «consultoría». | [onboarding](onboarding.md) |
| DT-43 | 🔴 | El motor de nube se probó en el mismo servidor que la sonda y con llaves estáticas del cliente guardadas allí | [control-tecnico](control-tecnico.md) |
| DT-44 | 🟠 | check_results no guarda recurso ni región. | [control-tecnico](control-tecnico.md) |
| DT-45 | 🟠 | El escaneo por todas las regiones infla resultados. | [control-tecnico](control-tecnico.md) |
| DT-46 | 🟠 | El CI no bloquea el merge ni el despliegue. | [transversal](transversal.md) |
| DT-47 | 🟡 | Los cierres automáticos de sesión no dejan rastro. | [transversal](transversal.md) |
| DT-54 | 🟠 | El Backend, el CI y el Dockerfile corren en Node 20 (sin actualizaciones de seguridad desde abril de 2026). | [transversal](transversal.md) |
| DT-55 | 🟡 | La plantilla del rol se descarga y se crea a mano (sin enlace de «un clic»). | [control-tecnico](control-tecnico.md) |
| DT-56 | 🟠 | La API aún acepta el formulario provisional del paso 3, único camino para servidores y bases de datos. | [control-tecnico](control-tecnico.md) |
| DT-57 | 🟠 | El canal de agente solo existe como diseño. | [control-tecnico](control-tecnico.md) |
| DT-58 | 🟡 | `Frontend-Platform` no tiene pruebas automáticas. | [control-tecnico](control-tecnico.md) |
| DT-59 | 🟠 | El sistema operativo del servidor es una inferencia de su imagen; el inventario cubre 4 servicios y solo se refresca al volver a comprobar. | [control-tecnico](control-tecnico.md) |
| DT-60 | 🟠 | Sin límite de uso ni cola justa entre empresas en la comprobación y la evaluación. | [control-tecnico](control-tecnico.md) |
| DT-61 | 🟠 | Las llaves base de AWS son de larga vida, viven en varios sitios y se compartieron: rotarlas. | [control-tecnico](control-tecnico.md) |
| DT-62 | 🟡 | Sin verificar que el id de un recurso descubierto coincide con el de la evaluación. | [control-tecnico](control-tecnico.md) |
| DT-63 | 🟠 | Un activo descubierto no se puede editar (criticidad, responsable). | [control-tecnico](control-tecnico.md) |
| DT-64 | 🟡 | La preparación por servicio no tiene pantalla; sin etiquetas de S3/Lambda; activos de regiones retiradas siguen activos. | [control-tecnico](control-tecnico.md) |
| DT-48 | 🟠 | `check_results` sin política de retención ni partición. | [transversal](transversal.md) |
| DT-49 | 🟠 | La operación continua (§8) no tiene contrato. | [transversal](transversal.md) |
| DT-50 | 🟠 | El intérprete `check_results → evaluations` no está especificado. | [transversal](transversal.md) |
| DT-51 | 🟠 | El trabajador usa un proxy de Docker que filtra por ruta, no por contenido. | [control-tecnico](control-tecnico.md) |
| DT-52 | 🟡 | El trabajador solo conoce AWS, una corrida a la vez por réplica, y el canal de llaves entrega llaves de larga vida. | [control-tecnico](control-tecnico.md) |
| DT-53 | 🟡 | La imagen del motor pesa 3,3 GB y un redespliegue a mitad de una corrida la pierde. | [control-tecnico](control-tecnico.md) |

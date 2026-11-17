# Decisiones — Entrega

Por qué Entrega es como es. **Se consulta para reabrir, no para construir**: lo vigente está en `schema-implementacion.md` y en `datos/modelo/`. Índice de todas las decisiones: [`README.md`](README.md).

## D42 · Cómo viaja una migración a staging (MD-91)

**Decisión:**
1. **El deploy migra solo, antes de levantar el backend**, con `prisma migrate deploy` en un contenedor desechable
   construido de la etapa `build` del Dockerfile. La imagen de runtime **no** lleva el CLI de Prisma ni credenciales de
   dueño.
2. **El rol dueño llega solo a ese paso** (secret `MIGRATE_DATABASE_URL`); el `.env` del backend sigue con `APP_DATABASE_URL`
   (rol `monkey_app`, sujeto a RLS).
3. **Respaldo con `pg_dump` antes de cada migración** si la base ya tiene datos, verificado (no vacío y legible), con las
   últimas 14 copias en `~/backups/monkey/`.
4. **Si falla, el deploy se aborta** y el backend anterior sigue corriendo.
5. **No hay "deshacer": se corrige hacia adelante**; si hubo pérdida de datos, se restaura el respaldo. Una migración
   aplicada nunca se edita.
6. **Una migración nueva lleva fecha posterior a la última de `develop`**, y **la base compartida de dev solo se migra desde
   `develop`**, no desde ramas.

**Por qué:** el workflow no migraba y la base de staging nació vacía; hacerlo a mano en cada deploy es justo lo que se
olvida. Separar el rol dueño del runtime evita que un fallo de la app tenga permisos para cambiar el esquema. La regla 6
sale de un síntoma real: la base de dev tenía 3 migraciones aplicadas que el repo no tiene.

**Falta acordar con Carlos** la regla 6 (hoy los dos aplican migraciones en la base compartida desde sus ramas).

**Fuente:** decisión de Héctor, 2026-10-01. Implementación: `Backend/scripts/deploy/migrate.sh`,
`Backend/.github/workflows/deploy-dev.yml`; procedimiento y primer arranque: `schema-implementacion.md` §7, §8 y §13.

---

## D55 · Entorno de desarrollo del control técnico: motor de nube y manager en la VPS (2026-10-08)

**Decisión** (Héctor, 2026-10-08; desarrollo; **pendiente de ratificar**; no cambia el modelo de datos). Lo verificado:

1. **Motor de nube:** contenedor efímero (`toniblyx/prowler:5.44.0`) en la VPS de desarrollo, con 2 GB de memoria y 2 CPU. Un escaneo
   completo de AWS (655 checks, 2 regiones) tardó unos 2 minutos. Las llaves se pasan por la entrada estándar (`--env-file /dev/stdin`),
   no se escriben en disco ni en el repo, y el contenedor se elimina al terminar (el `docker inspect` las conserva).
2. **Manager de la sonda:** `wazuh/wazuh-manager:4.14.6` (la versión de la sonda de pruebas), **sin indexador ni dashboard**, con ~0,5 GB
   de memoria en reposo y límite de 2 GB. La API (55000) escucha solo en `127.0.0.1`; solo el puerto de agentes (1514) está publicado.
   La contraseña de la API se generó en el servidor (`~/wazuh-manager/.env`, modo 600).
3. **D54 verificado:** la API pre-registra un agente (`POST /agents/insert` devuelve `id` y `key`) y se le asigna un grupo
   (`PUT /agents/{id}/group/{grupo}`). El enrolamiento abierto (1515) **no se publica**: no hace falta si Monkey entrega la clave.
4. **Lo que NO está resuelto:** el firewall de la VPS está inactivo y el SSH acepta contraseña; MinIO está publicado a todo internet.

**Fuente:** conversación de desarrollo del 2026-10-08; D53, D54, P12, P14, DT-33, DT-43.

---

## D72 · El Postgres de producción vive separado de la app (cierra P7)

**Decisión.** En producción, el Postgres va en un **servidor o servicio administrado separado** del servidor de la aplicación (ni la VPS actual ni una nueva compartida), dedicado solo a la base y con **respaldos y recuperación a un punto en el tiempo, con rotación de 35 días** (D97; los 7 años del audit trail los sostiene la base viva, D41). No cambia el modelo (RLS, 4 schemas, roles). Qué proveedor concreto se elige al preparar el lanzamiento, con esta restricción.

**Por qué.** Compartir servidor amplía la superficie de ataque (n8n, minio), disputa recursos y, sobre todo, deja los respaldos y la recuperación a cargo del equipo. Los respaldos dependen de dónde vivan.

**Cierra** `P7`. Condiciona `SEG-35`.

**Fuente:** responsable de producto, 2026-10-10 (la recomendación ya planteada en `P7`); D41, `schema-implementacion.md`.

---

---

## D86 · No hay un staging propio: un solo entorno desplegado, y todo lo que dependa de un staging se congela (2026-10-17)

**Decisión.**
1. Hay **un solo entorno desplegado**: el stack `~/monkey-dev` de la VPS, que se actualiza con cada push a `develop`. No existe un backend de staging separado (ni un workflow para `main`, ni un segundo `.env`).
2. Lo que **solo tendría sentido con un staging propio** se congela hasta que el proyecto lo necesite: el bucket, la política y la cuenta de servicio `monkey-staging…` de MinIO, un `.env` y un backend aparte, y repetir las pruebas del almacenamiento en un segundo entorno. Lo que ya existe no se borra por esta decisión.
3. Las menciones a «staging» que describen **ese único entorno** (`postgres-staging`, `bootstrap-staging.sh`, `MIGRATE_DATABASE_URL`) se quedan como están: hoy son el entorno desplegado. Se renombrarán el día que haya dos.

**Por qué.** Es un proyecto pequeño que usa una VPS y GitHub Actions. Un entorno que no tiene backend no se puede probar, y mantener su configuración (cuentas, claves, buckets) agrega superficie de ataque y trabajo sin dar nada a cambio.

**Lo que no cambia.** `migrate deploy` en lo desplegado y `migrate dev` solo en local (D42); la privacidad del almacenamiento (SEG-59).

**Qué cambia.** El alcance de MD-110 queda en el entorno desplegado; `schema-implementacion.md` §8 lo dice de forma explícita; la prueba del 2026-10-17 **cierra DT-39** (que se borra) y SEG-59; la limpieza de seguridad de la VPS (secretos rotados, puertos de MinIO cerrados al exterior, red permanente, credenciales fuera de los compose y consola restringida) se hizo el mismo día y **cierra DT-75** (MD-179), que se borra.

**Fuente:** responsable de desarrollo, 2026-10-17.

---

## D120 · En local se prueba solo lo que se toca; la suite completa es del CI (2026-11-17)

**Decisión.**
1. **Un ticket se verifica en local con las unitarias relacionadas y la integración (e2e) de lo afectado**: las suites de la feature cambiada, las de los módulos que llaman a sus rutas y las de los que importan su código. Las elige `skills/process/monkey-dev-flow/scripts/affected-tests.py`.
2. **La regresión completa la corre el CI de GitHub Actions** en cada PR de los tres repos. Nadie la corre ni la repite en local.
3. **El e2e del Backend usa una base fija** (`monkey-test-pg`, `npm run test:db -- up`). Es una plantilla con migraciones y catálogos que se reconstruye solo si cambian, y cada worker recibe su copia (`CREATE DATABASE … TEMPLATE`). Corre en paralelo: 2 workers en local, para no quitarle la RAM a la máquina de desarrollo, y 3 en el CI.
4. Frontend: Karma con `ng test --include`. Pasar a Vitest se evaluará aparte.

**Por qué.** MD-193 tardó ~4 h y la mayor parte se fue en correr el e2e completo (~8 min) unas 13 veces, cada vez sobre un Postgres montado desde cero. Con esta decisión, el e2e completo baja de 7:59 a 3:57 (2 workers), clonar una base cuesta 49 ms y verificar un cambio acotado tarda ~30 s.

**Qué cambia.** `monkey-dev-flow` (pasos 2b, 5, 6 y 7), los agentes `qa`, `backend-senior` y `frontend-senior`, las skills `senior-backend-engineer` y `senior-frontend-engineer`, `monkey-closeout` (el mapa `test-map.json`), `CLAUDE.md`, y en el Backend `scripts/dev/test-db.sh`, `scripts/dev/e2e.js`, `test/jest-e2e.config.js` y el workflow del CI (MD-216).

**Fuente:** Héctor Ríos (Rod), 2026-11-17: «no es nada productivo esperar 4 horas para poder hacer un ticket»; «la idea es que se pruebe con pruebas unitarias y de integración lo que se está tocando, y con el CI se hace la corrida completa»; «con el CI de GitHub Actions es más que suficiente».

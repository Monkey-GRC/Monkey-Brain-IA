# Deuda técnica — Entrega

Parches de pruebas, CI, despliegue, respaldos y runtime. **No es un módulo de producto**: existe porque esta deuda existe. Tablero y reglas: [`README.md`](README.md).

## Paso 3 del control técnico: el modelo de conexión (D48)

### DT-36 · El `.env` de pruebas usa el superusuario de la base de la sonda y un usuario de API con permisos amplios

🟠 Importante

- **Por qué:** Se puso para investigar
- **Qué lo cierra:** Pedir un usuario de base **solo lectura** y un rol de API de solo lectura por grupo; autorizar la IP de desarrollo en la API si se quiere probar

## Flujo de conexión de la nube (D58)

## Transversal

### DT-20 · Las pruebas automáticas están a medias en los repositorios

🟠 Importante

- **Qué está parchado:** *Hecho (2026-10-07, PR #17 del Backend):* CI en GitHub (`ci.yml`: lint, build, unitarias, migraciones desde cero, verificadores de catálogo/clonado/audit) y 18 pruebas de aislamiento entre empresas a nivel de base de datos (`Backend/test/aislamiento/`). *Hecho (en `develop`, PR #18 y #19):* 20 pruebas por **HTTP con supertest** que levantan la app real contra Postgres y comprueban que una empresa no lee, modifica ni enlaza nada de otra, y que `admin_monkey` y `admin_empresa` no se cruzan. *Hecho además (rama `feat/audit-in-same-transaction`):* auditoría atómica (19 pruebas) y autenticación (12), con mutaciones que prueban que fallan cuando el requisito se rompe. *Falta:* el recorrido por **navegador (Playwright en `Frontend-Platform`)** sigue fuera del repo y sin CI; y las demás rutas (evidencias, riesgos, usuarios) cuando existan
- **Por qué:** Velocidad del sprint
- **Qué lo cierra:** Llevar el recorrido de navegador a `Frontend-Platform` y correrlo en CI; ampliar el HTTP con cada módulo nuevo

### DT-30 · Las pruebas de jest no corren en máquinas Windows sin el runtime de Visual C++

🟡 Mejora

- **Qué está parchado:** (jest 30 carga un resolvedor nativo; da «Module ts-jest … was not found»). Se validaron con un runner mínimo
- **Por qué:** Dependencia del entorno
- **Qué lo cierra:** Documentar el requisito (VC++ Redistributable) o fijar un resolvedor sin binario nativo

### DT-46 · El CI no bloquea el merge ni el despliegue

🟠 Importante

- **Qué está parchado:** La protección de rama exige el plan GitHub Team (la organización es privada y no lo tiene): un PR en rojo se puede mergear, y `deploy-dev.yml` corre en paralelo al CI, no después
- **Por qué:** Coste de la suscripción
- **Qué lo cierra:** Plan Team + marcar `verificar` como check obligatorio; o, sin pagar, hacer que el deploy dependa del CI (`needs`). Acuerdo de equipo: no mergear con el check en rojo

### DT-54 · El Backend, el CI y el `Dockerfile` corren en Node 20

🟠 Importante

- **Qué está parchado:** , que según el calendario de Node dejó de recibir actualizaciones de seguridad en abril de 2026. El SDK de AWS ya avisa en el registro del trabajador (2026-10-09) de que exigirá Node ≥ 22 desde enero de 2027
- **Por qué:** Se heredó; subir de versión mezclado con otro cambio habría ensuciado el lock y el despliegue
- **Qué lo cierra:** Un PR aparte: Node 22 en `Dockerfile`, `ci.yml` y `.nvmrc`, regenerando el lock con esa versión. Probar las pruebas de aislamiento y el trabajador antes de mergear

## Funcionalidad que el brain menciona y aún no tiene contrato

### DT-84 · El respaldo con rotación a 35 días solo existe como script de staging, y nada comprueba que corra

🟠 Importante

- **Qué está parchado:** D97 y D72 prometen que los respaldos generales rotan y que los datos de una empresa borrada desaparecen de ellos en máximo 35 días. Hoy solo existe `scripts/deploy/backup-staging.sh` (`pg_dump` nocturno a MinIO, expira a 30 días, deja 7 copias en la VPS). Que se ejecute cada noche no se verifica desde el repo, ninguna prueba lo ejecuta y para producción no hay nada construido.
- **Por qué:** es lo mínimo para tener respaldo en staging mientras se construye producción; la promesa de D97 (y el texto de términos del servicio que la repite) depende de esto, por eso no es una mejora.
- **Qué lo cierra:** programar el respaldo de staging y avisar si una noche falla; construir en producción el respaldo con recuperación a un punto en el tiempo y rotación de 35 días como máximo; y dejar una comprobación que falle si el respaldo más reciente tiene más de un día o el más antiguo pasa de 35. Al cerrarla, SEG-35 pasa a ✅ y se borra esta entrada.

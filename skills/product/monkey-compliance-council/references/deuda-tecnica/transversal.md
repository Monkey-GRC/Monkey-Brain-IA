# Deuda técnica — Transversal

Lo que no pertenece a un solo módulo (pruebas, CI, auditoría, traducciones, entorno) y la funcionalidad que el brain menciona sin contrato. Contexto: [`README.md`](README.md).

## Transversal

### DT-20 · Las pruebas automáticas están a medias en los repositorios

🟠 Importante

- **Qué está parchado:** *Hecho (2026-10-07, PR #17 del Backend):* CI en GitHub (`ci.yml`: lint, build, unitarias, migraciones desde cero, verificadores de catálogo/clonado/audit) y 18 pruebas de aislamiento entre empresas a nivel de base de datos (`Backend/test/aislamiento/`). *Hecho (en `develop`, PR #18 y #19):* 20 pruebas por **HTTP con supertest** que levantan la app real contra Postgres y comprueban que una empresa no lee, modifica ni enlaza nada de otra, y que `admin_monkey` y `admin_empresa` no se cruzan. *Hecho además (rama `feat/audit-in-same-transaction`):* auditoría atómica (19 pruebas) y autenticación (12), con mutaciones que prueban que fallan cuando el requisito se rompe. *Falta:* el recorrido por **navegador (Playwright en `Frontend-Platform`)** sigue fuera del repo y sin CI; y las demás rutas (evidencias, riesgos, usuarios) cuando existan
- **Por qué:** Velocidad del sprint
- **Qué lo cierra:** Llevar el recorrido de navegador a `Frontend-Platform` y correrlo en CI; ampliar el HTTP con cada módulo nuevo

### DT-46 · El CI no bloquea el merge ni el despliegue

🟠 Importante

- **Qué está parchado:** La protección de rama exige el plan GitHub Team (la organización es privada y no lo tiene): un PR en rojo se puede mergear, y `deploy-dev.yml` corre en paralelo al CI, no después
- **Por qué:** Coste de la suscripción
- **Qué lo cierra:** Plan Team + marcar `verificar` como check obligatorio; o, sin pagar, hacer que el deploy dependa del CI (`needs`). Acuerdo de equipo: no mergear con el check en rojo

### DT-48 · `check_results` no tiene política de retención ni de partición

🟠 Importante

- **Qué está parchado:** Es la tabla de mayor volumen (11.352 checks posibles × activos × corrida cada 6 h) y D41 fija 7 años solo para la auditoría. Sin decidir qué se conserva (¿toda corrida, o solo cambios de estado?), RLS y los índices se degradan y el almacenamiento crece sin tope
- **Por qué:** Se omitió al diseñar §8
- **Qué lo cierra:** Decidir retención (propuesta: cada corrida un periodo corto y, para el histórico largo, solo transiciones de estado + la última foto) y particionar por mes. Registrarlo como decisión `D-n`

### DT-49 · El módulo de operación continua no tiene contrato

🟠 Importante

- **Qué está parchado:** *2026-10-08: propuesta escrita en `contracts/modules/control-tecnico-operacion.md` (la conexión quedó en `onboarding-technical-control.md`); falta acordarla con frontend.*  `contracts/modules/` solo cubre el onboarding C3. No hay forma acordada de listar ejecuciones, resultados, reglas de programación ni el Centro de Control Técnico (§8)
- **Por qué:** Se construyó primero el alta de activos
- **Qué lo cierra:** Acordar `contracts/modules/control-tecnico-operacion.md` con frontend **antes** de construir endpoints

### DT-50 · El intérprete `check_results → evaluations` no está especificado

🟠 Importante

- **Qué está parchado:** *2026-10-09: construido el intérprete puro, el calculador de preparación por activo y la persistencia de una corrida (`executions`, `check_results`, `asset_resources`, en una transacción con su rastro; 8 pruebas contra Postgres). Falta quien ejecute el motor y el paso a `evaluations`, que depende del módulo de Cumplimiento. Los umbrales del activo son los de D62 (DT-66).*  R-04 dice que «Monkey interpreta el criterio», pero no está escrito dónde vive el criterio (`tests.compliance_criterion` es texto libre), cómo se determinan los activos aplicables de un control (R-02), qué pasa con un resultado sin check conocido (hoy se descartaría en silencio) ni cómo se registran las exclusiones
- **Por qué:** §9 especifica el cálculo, no la interpretación
- **Qué lo cierra:** §9 ya fija cómo se lee la sonda (`passed` → cumple, `failed` → no cumple, `invalid` → error, `not_run` → pendiente) y el estado del test (D68). Falta el paso a `evaluations` y probarlo con los 8 casos del comité

### DT-54 · El Backend, el CI y el `Dockerfile` corren en Node 20

🟠 Importante

- **Qué está parchado:** , que según el calendario de Node dejó de recibir actualizaciones de seguridad en abril de 2026. El SDK de AWS ya avisa en el registro del trabajador (2026-10-09) de que exigirá Node ≥ 22 desde enero de 2027
- **Por qué:** Se heredó; subir de versión mezclado con otro cambio habría ensuciado el lock y el despliegue
- **Qué lo cierra:** Un PR aparte: Node 22 en `Dockerfile`, `ci.yml` y `.nvmrc`, regenerando el lock con esa versión. Probar las pruebas de aislamiento y el trabajador antes de mergear

### DT-47 · Los cierres automáticos de sesión no dejan rastro

🟡 Mejora

- **Qué está parchado:** Cuando el sistema cierra una sesión por inactividad (30 min), expiración (8 h) o usuario inactivo, no se escribe en `audit_logs`; solo se auditan el login y el logout que pide el usuario (D52). CC7.2 podría pedirlos
- **Por qué:** Son frecuentes y no son una acción del usuario; el comité no los ha pedido
- **Qué lo cierra:** Decidir con el comité si se registran (`SessionRepository.revoke` ya acepta una `AuditIntent`; hoy se pasa `null`)

### DT-21 · Traducciones al inglés hechas por desarrollo

🟠 Importante

- **Qué está parchado:** y sin revisar; Monkey Platform no tiene i18n (todo en español)
- **Por qué:** El Excel solo trae español
- **Qué lo cierra:** Revisión del comité; instalar i18n en Platform

### DT-22 · Base de datos dedicada → «no disponible»

🟠 Importante

- **Qué está parchado:** ; sin regenerar clave ni editar empresa
- **Por qué:** P2(b)(c)(d)
- **Qué lo cierra:** Respuestas del comité y el aprovisionamiento

### DT-23 · Sin MFA

🟠 Importante

- **Qué está parchado:** para ninguno de los 5 roles (MD-94, sprint de acceso y usuarios)
- **Por qué:** Fuera del alcance de MD-64
- **Qué lo cierra:** Su propio ticket

### DT-29 · `auth.login_failed` se guarda con `tenant_id` nulo

🟡 Mejora

- **Qué está parchado:** (no se sabe de qué empresa es un intento fallido hasta autenticar) y los nombres de acción siguen `<recurso>.<verbo>` salvo este
- **Por qué:** El email inexistente no identifica empresa
- **Qué lo cierra:** Decidir con Héctor si se resuelve el tenant por email cuando existe

### DT-30 · Las pruebas de jest no corren en máquinas Windows sin el runtime de Visual C++

🟡 Mejora

- **Qué está parchado:** (jest 30 carga un resolvedor nativo; da «Module ts-jest … was not found»). Se validaron con un runner mínimo
- **Por qué:** Dependencia del entorno
- **Qué lo cierra:** Documentar el requisito (VC++ Redistributable) o fijar un resolvedor sin binario nativo

### DT-24 · Tailwind avisa de clases canónicas (`dark:bg-white/[0.03]` → `dark:bg-white/3`) en Platfor

🟡 Mejora

- **Qué está parchado:** Tailwind avisa de clases canónicas (`dark:bg-white/[0.03]` → `dark:bg-white/3`) en Platform
- **Por qué:** Solo estético
- **Qué lo cierra:** Una pasada de limpieza


## Funcionalidad que el brain menciona y aún no tiene contrato

### DT-25 · Ver el catálogo maestro SOC 2 en Monkey Admin y poder crear un control, riesgo o causa nuevos

🟠 Importante

- **Qué:** El principio está en `modelo-datos.md` §3 y D9/D31, pero no hay contrato, pantallas ni épico
- **Nota:** Primero un contrato en `contracts/modules/` (qué campos, cómo se vincula un control nuevo, cuándo se publica la versión, A4)

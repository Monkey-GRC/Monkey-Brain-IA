# Registro de decisiones — D48–D52

> Parte de [`modelo-datos-decisiones.md`](../modelo-datos-decisiones.md) (índice). Paso 3 provisional contra la sonda real, pool de conexiones, correcciones del comité, auditoría atómica.
> Los identificadores (`D-n`, `A1`…) no cambian: se citan por su ID, no por la posición.

## D48 · Paso 3 del control técnico: lo verificado contra la sonda real y por qué el flujo actual es provisional

**Qué se verificó** (Carlos y desarrollo, 2026-10-02, con el `.env` de pruebas y la documentación pública de la sonda):

1. **Monkey no instala ni se conecta a los equipos del cliente.** El agente corre en el equipo del cliente, habla **hacia
   afuera** con el manager (1514/1515) y las pruebas de configuración (SCA) corren **en el agente**. Lo que Monkey lee es lo que
   el manager ya tiene: su base y su API. La base de referencia del repo (`prueba_wazuh`: `cis_checks`, `cis_check_results`,
   `wazuh_agents`) es el destino de esa sincronización; no tiene columna de empresa y guarda solo la última foto.
2. **Las integraciones de AWS y Azure de la sonda son ingestión de registros**, no evaluación de la configuración de la cuenta.
   No equivalen al modelo de Vanta (rol entre cuentas en AWS, federación de identidad en GCP, registro de aplicación en Azure,
   sin contraseñas).
3. **El aislamiento entre clientes no lo da la sonda.** La clave de inscripción es global y el agente puede declarar su propio
   grupo: Monkey debe imponer que un agente solo se asocie a la empresa que lo inscribió. La API permite roles de solo lectura
   por grupo.
4. **Cobertura real de plataformas hoy:** 3 políticas (Ubuntu 22.04, Ubuntu 14.04, Windows 11). Cualquier otro sistema no tiene
   pruebas de configuración.
5. Desde la máquina de desarrollo la API de la sonda no respondió (todos los puertos): probable lista de IP permitidas. No se
   envió ninguna credencial.

**Consecuencia:** el formulario actual del paso 3 (credenciales por conexión: rol de lectura, usuario de base, llave SSH) lo
definió desarrollo (D46, DT-4) **antes** de esta verificación y **no coincide** con el modelo real. Se deja como está y se
declara provisional; no se promete a ningún cliente. Qué cambia y en qué orden queda como pendiente del comité (**P12**) y como
deuda (**DT-31 a DT-36**).

**Por qué no se cambió ya:** rediseñarlo sin saber quién instala los agentes, cómo se asigna cada cliente a su grupo y quién
configura la nube sería inventar; el brain manda y ante un vacío se pregunta.

---

## D49 · Las peticiones esperan hasta 10 s por una conexión del pool

`PrismaService.withScope` fija `maxWait` en 10 s (antes 2 s por defecto). Con la base remota a ~200 ms por consulta, una ráfaga
de peticiones paralelas agotaba la espera y el cliente recibía `500 INTERNAL_ERROR` («Unable to start a transaction in the
given time») aunque la base estuviera sana; ocurría hasta en los endpoints públicos de catálogos. Ahora se encolan. No cambia el
límite de duración de la transacción (`timeoutMs`).

**Fuente:** hallazgo de las pruebas de navegador, 2026-10-02.

---

## D50 · Todos los marcos se ofrecen, solo SOC 2 se contrata; cada marco con sus categorías

**Decisión** (comité, correcciones del 2026-10-05; categorías confirmadas por Carlos). Cuatro puntos:

1. **Se ofrecen 7 marcos y solo SOC 2 se puede contratar.** Monkey Admin y la pantalla del servicio muestran todos como
   gancho comercial (SOC 2, ISO 27001, HIPAA, GDPR, PCI DSS, NIST CSF y SOC 1, en orden de demanda), pero **solo se habilita lo
   que está construido** (hoy, SOC 2) y, en el servicio, lo que la empresa contrató. Si el cliente toca un marco que no tiene
   contratado, no se selecciona: se abre un aviso que lo invita a hablar con mercadeo (mock, DT-41).
2. **`catalog.frameworks.availability`** (`available` | `coming_soon`, migración `20261005220000_correcciones_onboarding_d50_d51`): `soc2` es `available`; los otros seis se
   siembran con `npm run reference:load` como `coming_soon` y **sin requisitos ni controles**. El registro de empresa rechaza un
   `coming_soon` con `409 FRAMEWORK_NOT_AVAILABLE`. `GET /v1/catalogs/frameworks` los trae todos, con `availability`.
3. **Qué marcos y por qué esos.** Los más demandados hoy: SOC 2 es el estándar del SaaS B2B; ISO 27001 es la expansión más
   común (32 % de los clientes de Drata con SOC 2 la suman), seguida de HIPAA (20 %) y GDPR (19 %); PCI DSS lo exigen fintech y
   pagos; NIST CSF es el marco de referencia citado en Colombia; SOC 1 es el hermano financiero de SOC 2. Los siete tienen ficha
   en `frameworks/*.md`. Se dejan fuera CIS Controls (vetado) y FedRAMP, CMMC, DORA y NIS2 (nicho o de otra región).
4. **Categorías: cada marco usa las suyas (opción 2).** ISO 27001:2022 se organiza en 4 temas, PCI DSS en 12 requisitos y NIST
   CSF 2.0 en 6 funciones; forzarlas a las 5 categorías de SOC 2 (seguridad, disponibilidad, confidencialidad, integridad,
   privacidad) distorsiona la cobertura y la lectura del auditor, y ISO ni siquiera tiene un tema «disponibilidad». Es coherente
   con el principio de que el **control es atómico e independiente del marco**: los controles no cambian, solo cómo se agrupan
   los requisitos de cada marco. **La base actual no permite la opción 1** ni sin migrar: `requirements.trust_criterion_id` es una
   FK a un enum de 5 valores.

**Qué no se hizo y por qué:** no se migró el schema. Con SOC 2 como único marco construido, generalizar `trust_criteria` a
dominios por marco sería un cambio grande sin uso. Queda como **DT-38**, y se hace al sembrar el primer marco que no sea SOC 2:
`trust_criteria` → dominios con `framework_id`, `code`, `name` e `is_mandatory`, y `service_trust_criteria` →
`service_framework_domains` (la regla «seguridad siempre» pasa a ser `is_mandatory` del dominio).

**La pantalla del marco:** el texto dice **consultoría**, no auditoría (Monkey acompaña al cliente; no audita). Cada categoría de
SOC 2 trae qué significa y qué se revisará (sin códigos técnicos, `philosophy.md`). Si el cliente no selecciona todas las
categorías, se le avisa que lo recomendable es cubrirlas todas; si decide continuar, se respeta.

**Fuente:** correcciones del comité del 2026-10-05; Carlos confirmó la opción 2 y la lista de marcos. Demanda: Drata (clientes con
SOC 2), ACC 2025, guías sectoriales de cumplimiento.

---

## D51 · Correcciones al Componente 2 y a la activación de cuenta (2026-10-05)

**Decisión** (comité, confirmada por Carlos). Revierte parte de D45 y D43:

1. **Activación en dos pasos y sin nombre.** El primer paso pide solo el código y, al comprobarlo
   (`POST /v1/auth/redeem/lookup`), muestra la razón social y el correo que Monkey Admin ya fijó; el segundo pide solo la
   contraseña y su confirmación. El administrador se identifica por su correo: **`users.name` y `users.last_name` pasan a
   ser opcionales** y `redeem` ya no los recibe. El nuevo endpoint es público y revela razón social y correo a quien tenga el
   código, así que tiene un freno de 10 fallos / 15 min por dirección compartido con el canje (DT-37); antes, `redeem` no tenía
   ninguno.
2. **La regulación ya no se declara por servicio.** Las leyes de protección de datos aplican a la **empresa**, y ya se declaran
   en el Componente 1 (`organization_regulations`). Se retira `service_regulations` (misma migración `20261005220000`), `regulation_codes` del
   servicio y su pregunta. Revierte D45 (que la había añadido «por analogía»). Quedan 12 campos obligatorios.
3. **La lista de regulaciones solo trae normas de protección de datos.** Salió PCI DSS (estándar de la industria de tarjetas,
   no una ley; ya es un marco). HIPAA y GLBA se quedan: son leyes sectoriales de EE. UU. que protegen datos de salud y
   financieros. Entraron la Ley 21.719 de Chile (vigente desde el 1-dic-2026, reemplaza a la 19.628) y las de Uruguay (18.331),
   Ecuador (LOPDP), Panamá (Ley 81) y Costa Rica (8968): 18 en total. La migración borra la marca PCI DSS de las empresas que la
   habían elegido. **Falta que el comité ratifique la lista** (DT-40).
4. **Descripción del Sistema: enlace, archivo, o los dos.** `system_descriptions.file_path` se reemplaza por `link_url` y
   `file_key` (ambos opcionales, `CHECK` de que haya al menos uno). El archivo (PDF o .docx, 25 MB, validado por extensión y por
   firma) se guarda en S3 / minio detrás del puerto `FileStorage`; sin `S3_*` la app arranca y la subida responde 503. Como el
   archivo necesita el servicio, `system_description` pasa a ser **opcional al crear**: con archivo se crea el servicio y
   luego se sube. La llave del objeto nunca sale; se baja con un enlace temporal de 5 minutos. Se borra el objeto al reemplazarlo
   y al eliminar el servicio. **No está probado contra el minio real** (DT-39).
5. **El nombre del proveedor ya no se pregunta** (el tipo —AWS, Azure…— ya lo dice). `subservice_organizations.provider`
   sigue existiendo y opcional; hoy no se captura.
6. **Certificación previa:** pasa de 4 a 8 valores (SOC 2, SOC 1, ISO 27001, PCI DSS, HIPAA, NIST CSF, GDPR, ninguna), preguntando
   por una «certificación o evaluación» porque algunos no se certifican como tal.

**Por qué:** el comité revisó el onboarding con el producto delante y pidió estos ajustes; ninguno contradice una regla del modelo
(el control sigue siendo atómico, el cumplimiento se sigue derivando).

**Fuente:** correcciones del comité del 2026-10-05, pasadas por Carlos el mismo día.

---

## D52 · La auditoría se escribe en la misma transacción que la acción (cierra DT-28, SEG-36)

**Decisión** (desarrollo, 2026-10-07; **pendiente de ratificar con el comité**; no cambia el modelo de datos). D41 y
`contracts/conventions.md` ya exigían que el rastro se escribiera en la misma transacción que la acción. No se cumplía: los
casos de uso llamaban al repositorio y **después** al escritor de auditoría, en otra transacción y con el error tragado. Si
fallaba entre las dos, la acción quedaba sin rastro.

**Cómo quedó:**

1. **`AuditIntent<T>`** (`common/audit/audit-log.writer.ts`): una función `(resultado) => AuditEntry | AuditEntry[]` que el caso de
   uso construye con lo que ya sabe (usuario, IP, estado anterior) y **entrega al repositorio**. El repositorio, dentro de la
   transacción que ya abre con `withScope`, escribe el efecto, arma el resultado y llama a `insertAuditLog(tx, audit(resultado))`.
2. **El parámetro es obligatorio** en todo método que cambia datos: servicios (crear, modificar, descripción, eliminar),
   contexto organizacional, empresa, escenario y alcance, activos (registrar, validar, activar, programar), sesión (login y
   logout) y canje de la clave. Un método nuevo sin él no compila.
3. **Falla cerrado:** si el insert del rastro falla, **toda la acción se revierte** y la respuesta es un `500`. Es la lectura
   correcta de SOC 2 (CC7.2, CC9.2): una acción sin rastro es peor que una acción rechazada.
4. **Dónde NO aplica**, a propósito: (a) los **intentos fallidos** (`auth.login_failed`, canje fallido): no hay efecto con el que ser
   atómico y no deben romper la respuesta, así que siguen con `AuditLogWriter.write`, de mejor esfuerzo; (b) los **cierres
   automáticos de sesión** (inactividad, expiración, usuario inactivo): se pasa `null` explícito y hoy no se registran (**DT-47**).
5. **Una validación fallida de un activo sí es un cambio** (pasa la conexión a `failed`): su rastro `result = error` se escribe en
   la misma transacción.

**Alternativas descartadas:**

- **Transacción ambiental** (`AsyncLocalStorage` + `withScope` que se une a la abierta): menos cambios en los casos de uso, pero
  oculta cuándo hay transacción, y el repositorio del canje atrapa un error de la base (`P2002`) para devolver `email_taken`; unido
  a una transacción externa, el error la dejaría abortada. Se prefirió el parámetro explícito.
- **Dejar el escritor aparte con reintento:** no da atomicidad, solo disminuye la ventana.

**Qué cuesta:** una caída de `audit_logs` ahora **detiene** las acciones que cambian datos (disponibilidad a cambio de
integridad del rastro). `audit_logs` es la misma base que los datos, así que no hay un punto de fallo nuevo en la práctica.

**Cómo se comprueba:** `Backend/test/auditoria/audit-atomica.e2e-spec.ts` (19 pruebas). Fuerza que el rastro se inserte y luego
falle, y comprueba que no queda ni el efecto ni la fila. Una mutación que escribe el rastro después de confirmar el cambio hace
fallar la prueba correspondiente.

**Fuente:** D41, `contracts/conventions.md` («Se escribe en la misma transacción que la acción»), DT-28 y MD-113.

---

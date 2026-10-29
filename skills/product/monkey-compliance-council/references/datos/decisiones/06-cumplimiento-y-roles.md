# Registro de decisiones — D62–D68, D95 y D96

> Parte de [`modelo-datos-decisiones.md`](../modelo-datos-decisiones.md) (índice). Cómo se cuenta el cumplimiento, el auditor, los cinco roles, controles propios, MFA y la entrada del consultor.
> Los identificadores (`D-n`, `A1`…) no cambian: se citan por su ID, no por la posición.

## D62 · El cumplimiento se cuenta: dimensión → control → categoría → marco (2026-10-09)

**Decisión.** El responsable de producto fijó la fórmula, basada en cómo se mide SOC 2 (5 categorías, compuestas por controles, que se
evalúan con tests en 5 dimensiones). Cada nivel cuenta lo cumplido contra el total del nivel y **se cumple solo al 100%**:

- **Dimensión de un control:** cumple solo si todos sus tests con resultado, sobre todos sus activos aplicables, cumplen.
- **Control:** % = dimensiones que cumplen / dimensiones aplicables. Con una falla de cinco, 80% y no cumple.
- **Categoría:** % = controles que cumplen / controles aplicables (5 de 10 fallan → 50%; 45 de 156 fallan → 71,15%). Se logra solo al 100%.
- **Marco del servicio:** % = categorías logradas / categorías **contratadas** (1 de 5 → 20%; 1 de 2 → 50%). Una categoría sin controles aplicables se anula y no entra.
- **Solo se mide lo que ya tiene resultado.** Un test `pending` o `not_applicable` no afecta ningún cálculo hasta que tenga un resultado.
- **Una categoría con controles aplicables pero ninguno medido no está lograda** y cuenta en el denominador del marco; sin ningún control aplicable, se anula.
- **Cobertura:** siempre un número aparte al lado del porcentaje. Un 100% con algo pendiente se muestra como «100% de lo medido» y nunca como Preparado.
- **El activo** se lee con la misma regla: tests con resultado cumplidos / tests con resultado, con los cortes de 100% y 80%.
- **Pesos iguales** en todos los niveles. No hay porcentaje de la empresa.
- **Semáforo:** Preparado = 100% · Casi listo = de 80% a menos de 100% · Requiere trabajo = menos de 80%.
- **Vocabulario:** *dimensión* es solo el eje técnico (documental, servidores, bases de datos, aplicación, nube); *categoría* es solo el criterio de confianza.

**Por qué.** Una certificación solo se emite con todo en regla, así que el estado es binario en cada nivel; el porcentaje es el
diagnóstico que se le muestra al cliente. Una categoría al 99% se ve como 99%, se le dice que falla y qué le falta, y se logra cuando llega a 100%.

**Qué cierra.** P16 y P18.
**Fuente:** responsable de producto, 2026-10-09; `modelo-datos.md` §9.

> **Reemplazada en parte por D68 (2026-10-10).** La agregación (dimensión como nivel, % del control por dimensiones, % del marco por categorías, «solo se mide lo que tiene resultado») la sustituye el motor del comité. Se conservan los pesos iguales, el par servicio × marco, el semáforo y la cobertura aparte.

---

## D63 · El auditor es un rol aparte (2026-10-09)

> **Ajustada por D96 (2026-10-27).** Se mantiene todo lo del auditor, salvo dos cosas: la vista técnica es del `auditor` y del `admin_empresa` (ya no hay consultor) y su evaluación —certificar o no— queda en pausa. Lo crea `admin_empresa` para una auditoría concreta y, al terminar, la empresa lo desactiva.

**Decisión.**

- `auditor` es un rol con permisos propios y su propia experiencia al entrar; la vista técnica es suya (y del consultor, D64), no un modo que active el cliente *(D81: mientras `P3` siga abierta, también la pide `admin_empresa`)*.
- Lo crea **solo `admin_empresa`**. Su cuenta pertenece a la empresa (`users.company_id`); la persona suele ser externa, pero dentro de Monkey es parte de la empresa.
- Ve **todo el cumplimiento de todos los servicios** de su empresa, en solo lectura, con la **vista técnica**. `admin_empresa` y `funcional` solo ven la vista de negocio *(D81: `admin_empresa` también puede pedir la técnica)*.
- Escribe **observaciones** (observación, recomendación, solicitud de información). Estados: `open` → `answered` (la empresa responde y deja constancia) → `closed` (solo quien
  la escribió). Si no queda conforme, vuelve a `open`; una cerrada no se reabre. Mientras no esté cerrada, su autor puede modificarla. No mueven el porcentaje, salvo por el
  camino normal del test documental (R-03).
- Descarga evidencias y exporta reportes en PDF y Excel. MFA obligatoria (D66). Entra al MVP.

**Qué implica para el modelo.** El auditor no tiene tabla de asignación ni excepción de aislamiento: es un usuario más de su empresa, y se le quita el acceso desactivándolo (`CC6.3`).
El hallazgo (`findings`) lo detecta solo el sistema; lo que escribe una persona es `audit_observations` (§7.6).

**Discrepancia con el TSC integral, resuelta a favor del responsable de producto:** su hoja de roles deja a `admin_monkey` crear cualquier usuario y al auditor «según
asignación»; aquí solo `admin_empresa` crea auditores y el auditor ve todos los servicios de su empresa.

**Fuente:** responsable de producto, 2026-10-09; hoja «Modelo de Gestión usuarios» del TSC integral.

---

## D64 · Hay cinco roles: el consultor prepara, el auditor certifica (2026-10-09)

> **Reemplazada por D96 (2026-10-27).** Ya no hay rol de consultor: lo que hacía pasó al `admin_empresa`. El valor `consultor` del enum y la tabla `consultant_assignments` se conservan sin uso, y nada del producto los toca.

**Decisión.** Se añade el rol `consultor` y se descartan los roles personalizados: los 5 roles son fijos.

- **Consultoría** prepara al cliente para la auditoría; **auditoría** es el examen final que da la certificación del marco. Hacen prácticamente lo mismo; el consultor prepara el terreno.
- El consultor es de **Next** (la empresa dueña de Monkey). Es **una sola cuenta con un solo correo**, que **crea `admin_monkey` desde Monkey Admin** y asigna a las empresas que atiende
  (`consultant_assignments`). La asignación dura hasta que se quita.
- Al iniciar sesión **elige la empresa en la que trabaja** y ve una a la vez; el sistema comprueba su asignación en cada petición. Cambiar de empresa queda en la auditoría.
- **La empresa puede suspender** a un consultor asignado (`CC6.3`) y ve la lista de los que tiene, en solo lectura. **Una suspensión de la empresa solo la reactiva la empresa**: `admin_monkey` no puede, porque anularía el control de la empresa sobre sus propios datos.
- Ve todo el cumplimiento de la empresa con la **vista técnica**, registra observaciones (las cierra quien las escribió) y exporta reportes como el auditor.
- **Da el veredicto** de los tests documentales y manuales (R-03; la IA solo sugiere), **aprueba las exclusiones** que propone la empresa (D78, que invirtió A3) y **aprueba los cambios de controles** (D65).
- MFA obligatoria (D66).
- **El auditor es distinto:** lo crea `admin_empresa` y pertenece a una sola empresa (D63).
- **Sin roles personalizados** (`custom_roles` y `users.custom_role_id` salen del modelo). Si sobra tiempo más adelante, se vuelve a plantear.

**Por qué.** Las reglas del comité decían «el consultor evalúa» y «el consultor propone», pero ese rol no existía entre los 4 y A3 lo equiparaba con `admin_monkey`. Un consultor de Next atiende a varios clientes:
una cuenta única evita un correo por empresa (el correo es único en todo el sistema, D29) y permite que Monkey gestione quién atiende a quién.
**Qué cierra.** Quién da el veredicto de los tests manuales, quién propone exclusiones y P19 y P20. **Fuente:** responsable de producto, 2026-10-09.

---

## D65 · Controles propios y cambios de controles con aprobación del consultor (cierra P8) (2026-10-09)

> **Reemplazada por D96 (2026-10-27).** El `admin_empresa` crea, edita y da de baja controles propios y cambios de controles **directamente**, con advertencia y confirmación; ya no se propone ni se aprueba. Se conserva: el control propio es solo documental, va en una categoría que elige la empresa y cuenta para el porcentaje.

**Decisión.**

- El cliente puede **proponer** crear un control propio, darlo de baja y editar las dimensiones o la interpretación de cualquier control suyo. **Decide el consultor.**
- Un control propio es **solo documental** (dimensión `policy`, tipo `manual`) y el cliente lo **ubica en una categoría** (`client_controls.trust_criterion`).
- **Cuenta para el porcentaje** de su categoría y del marco, incluso mientras está pendiente de aprobación; si se rechaza, se da de baja y deja de contar. Las bajas y las ediciones
  no se aplican hasta que se aprueban.
- No tiene punto de enfoque, así que **no cierra ningún requisito**: solo aporta al porcentaje.

**Por qué.** El cliente conoce su operación y puede tener controles que el catálogo no trae, pero cambiar lo que se mide cambia el porcentaje, así que lo valida quien prepara la auditoría.
**Fuente:** responsable de producto, 2026-10-09; `modelo-datos.md` §7.1.

---

## D66 · MFA obligatoria para los 5 roles (2026-10-09)

> **Ajustada por D96 (2026-10-27).** Los roles activos son cuatro (`admin_monkey`, `admin_empresa`, `funcional`, `auditor`); la MFA sigue obligatoria para todos. D96 no la relaja para el `funcional`, aunque el Excel lo hace.

**Decisión.** La autenticación de dos factores (TOTP) es obligatoria para `admin_monkey`, `admin_empresa`, `funcional`, `consultor` y `auditor`, y el resto de políticas del TSC integral
(§5.3) aplican a todos. Es un requisito de seguridad sin excepciones; se construye en el sprint de acceso y usuarios, no en el de Cumplimiento.
**Por qué.** La hoja de roles del TSC la exigía solo a admin y auditor y dejaba al `funcional` sin ella; el responsable de producto la extendió a todos.
**Fuente:** responsable de producto, 2026-10-09.


## D68 · El motor de evaluación del comité es la regla del cálculo (2026-10-10)

> **Ajustada por D96 (2026-10-27).** Cambian dos puntos: el 8 (la exclusión por activo la decide el `admin_empresa`, no el consultor) y el 11 (las evaluaciones del consultor y del auditor quedan en pausa).

**Problema.** El comité entregó la VF2 del TSC integral con tres hojas nuevas que especifican el **motor de evaluación** (`MODELO EVALUACIÓN MONKEY`, `REQUISITOS EVALUACIÓN MONKEY` y un prompt de
desarrollo): estados por nivel, reglas RN-01 a RN-25, 51 requisitos y 8 casos de prueba. D62 había fijado la agregación con otro criterio (la fijó el responsable de producto porque el Excel de la
fórmula no la reflejaba, §0). Las dos no coinciden en varios puntos.

**Decisión (el comité manda; se aplica tal cual, salvo lo que se dice al final).**
1. **La regla del cálculo es la del comité** (`modelo-datos.md` §9): activo → test → control → categoría → marco, con «todo o nada» en cada nivel y el porcentaje como **avance**, no como criterio de cumplimiento.
2. **Lo pendiente bloquea el cumplimiento.** Lo sin medir queda `PENDIENTE` o `EN EVALUACIÓN`, nunca cumplido ni ignorado. 45 de 50 servidores conformes y 5 sin evaluar **no es CUMPLE**. Reemplaza a D62 («solo se mide lo que tiene resultado»).
3. **Estados nuevos por nivel**: vencido, error, incompleto, sin tests, sin activos, desactivado, fuera de alcance y en revisión, además de los que ya había (`contracts/enums.md`).
4. **La dimensión deja de ser un nivel con estado propio** y sigue siendo obligatoria: una dimensión requerida sin test vigente deja el control `INCOMPLETO`. Las dimensiones requeridas salen de la hoja `Controles Monkey` del comité
   (columnas L a P). **Ajusta D39** (que las derivó de las pruebas): en los datos del comité coinciden en la forma, pero las cifras no (`DT-69`).
5. **El control** es `EFECTIVO` solo con todos sus tests obligatorios, vigentes y aplicables cumplidos y ninguna dimensión sin test; su **avance** son los tests cumplidos sobre (tests + dimensiones sin test). **El marco** se evalúa sobre los
   **controles únicos** de las categorías en alcance (uno compartido cuenta una vez) y su avance es efectivos / controles únicos. Reemplaza al «% del marco = categorías logradas / contratadas» de D62.
6. **La evaluación** es servicio + marco + versión + período + fecha de corte, y un resultado se calcula **una vez** y lo reutilizan todos los controles que usan el test.
7. **Relación control–test con atributos** (obligatorio, vigente, fechas, justificación) y **desactivación controlada** con rastro. **Evidencias** validadas por atributo, y solo una validada por una persona puede ser `CUMPLE`.
8. **Excluir un activo** exige justificación, aprobador y vigencia: es la exclusión que ya existía (A3; la propone la empresa y la aprueba el consultor, D78), ahora también por activo.
9. **El error técnico** de un activo deja el test en `ERROR`; no es un incumplimiento ni un cumplido. Una corrida que no llegó a la cuenta del cliente (D57) sigue sin guardar resultados.
10. **Causas y riesgos**: se adoptan los estados de mitigación (RN-20, RN-21) y el riesgo inherente = probabilidad × impacto (RN-22). **El riesgo residual, el apetito y el mapa de calor no se adoptan todavía**: el comité mismo los marca como
    propuesta con parámetros sin aprobar. *(D75, 2026-10-13: se adopta la fórmula y el valor inicial del apetito; faltan datos y el aprobador, `P22`; ticket MD-151, fuera del sprint.)* El residual y el mapa son vista del consultor y del auditor, no del cliente (`philosophy.md`).
11. **El consultor y el auditor hacen cada uno una evaluación del cumplimiento, con distinto enfoque** (el consultor prepara, el auditor certifica). **Lo agregó el responsable de producto**: el Excel no la contempla, y su «validada por
    auditor» (RN-03) se entiende como «validada por una persona». Su diseño lo cerró D77.

**Lo que no se adopta.** El **prompt de desarrollo** del Excel se lee como referencia: pide una API `/api/v1` y «TypeScript/Node o Go», y aquí rigen `contracts/` (`/v1`) y la pila ya elegida. Las **diez decisiones pendientes** que trae la hoja
(para «el equipo Monkey») **se registran, no se resuelven**: `P22`. *(Revisadas después: cinco se cerraron en D74 y D75; quedan cinco para el comité en `P22`.)*

**Se conserva de D62:** pesos iguales en todos los niveles, la unidad (servicio × marco) sin número de empresa, el semáforo cualitativo y la cobertura siempre aparte.

**Por qué.** El comité hizo el análisis funcional, y CLAUDE.md dice que ante un conflicto manda el documento fuente. D62 había llenado un hueco que el Excel de la fórmula no cubría; ahora el comité lo cubrió y su regla es más estricta y más
trazable (cada estado se explica con una regla numerada y casos de prueba). La evaluación del consultor y del auditor es un hecho del producto que el Excel omitió.

**Qué cambia.** `modelo-datos.md` §9 (reescrita), §2, §7.1, §7.4, §7.5 y el glosario; `contracts/enums.md` (estados de evaluación); `sprint-cumplimiento.md` y `mvp-roadmap.md`; `DT-66` (la
preparación por severidad se escribe contra esta regla; `DT-65`, el calculador que promediaba, se retiró porque ese código ya no existe) y `DT-69` (dimensiones); pendiente `P22` (`P23` lo cerró D77).

**Fuente:** comité funcional, `assets/TSC INTERGRAL SOC 2 DETALLADO VF2.xlsx` (hojas `MODELO EVALUACIÓN MONKEY` y `REQUISITOS EVALUACIÓN MONKEY`), 2026-10-10; evaluación del consultor y del auditor: responsable de producto, 2026-10-10.

---

## D95 · El consultor se activa con un código de un solo uso y entra a sus empresas asignadas eligiendo de una lista, sin token por empresa (2026-10-27)

> **Reemplazada en parte por D96 (2026-10-27).** Sin consultor no hay empresa activa ni asignaciones. **Sobrevive el mecanismo de activación**: el estado `pending`, la tabla `user_activation_codes` y el código de un solo uso, que ahora emite el `admin_empresa` para invitar a `funcional` y `auditor`.

**Decisión.**

- `admin_monkey` crea al consultor solo con su correo (cuenta en la empresa interna de Monkey, D64). Recibe un **código de activación de un solo uso**, ligado a ese correo, que `admin_monkey` le entrega a mano (el correo sigue aplazado, MD-69). Con él pone su contraseña y configura el segundo factor (D94), igual que el `admin_empresa` con su clave de acceso (D43, D51).
- Al iniciar sesión (contraseña y segundo factor) el consultor ve **solo las empresas con asignación `active`** y elige una; con una sola, entra directo. **No hay un token de ingreso por empresa.**
- La sesión guarda la empresa activa (`sessions.active_company_id`). La asignación y el estado de la empresa se comprueban en **cada petición**; todo se abre con la empresa activa y lo que el consultor escribe lleva **su** id como autor, nunca el de la empresa. Elegir o cambiar de empresa queda en la auditoría.
- Cortar el acceso es cambiar el estado de la asignación: `admin_monkey` la retira o la empresa la suspende (D64), y aplica en la siguiente petición.
- La empresa interna de Monkey existe: la crea `bootstrap:admin` junto al primer `admin_monkey`, y es donde viven `admin_monkey` y `consultor`.

**Por qué.** Un token por empresa no agrega seguridad (la asignación y el segundo factor ya se comprueban en cada petición), obliga a entregar un secreto por cada par consultor–empresa sin servicio de correo, y revocarlo exige rastrear cuál sigue en circulación. La lista solo contiene las empresas asignadas, así que nunca expone la cartera de Monkey. Clasificación del Consejo: **MUST** asignación, elección de empresa, comprobación en cada petición y auditoría; **LATER** asignaciones con vencimiento; **NO BUILD** token de ingreso por empresa.

**Qué cierra.** `P29` (cómo activa su cuenta un consultor) y `P30` (dónde vive y cómo se aísla cuando trabaja en un cliente).

**También aprobado el 2026-10-27** (al revisar el contrato): el estado `pending` en `users` (la cuenta existe desde el alta, así se le puede asignar empresas antes de que active y se ve quién falta), la tabla `user_activation_codes` (la reutilizarán `funcional` y `auditor` en MD-131), desactivar y reactivar la cuenta de un consultor (`CC6.3`, fila «Desactivar / reactivar usuario» del Excel), reemitir un código perdido y la vigencia de 7 días del código (`ACTIVATION_CODE_TTL_HOURS`, el mismo supuesto de la clave de acceso, P2b).

**Qué cambia al construirlo.** `users.status` suma `pending`; tabla `user_activation_codes`; `sessions.active_company_id`; el rol se comprueba **antes** que la empresa elegida (un consultor que llama a una ruta que no es suya recibe 403, no 409); una empresa puede leer la cuenta de los consultores que tienen o tuvieron una asignación con ella (sin eso no se puede decir quién firmó un veredicto); y el trigger de asignaciones ya no deja que `admin_empresa` mueva una asignación que Monkey retiró (antes solo miraba `suspended → active`). El contrato de este corte (`users-consultant-access.md`) se retiró con D96; solo sobrevive lo del código de activación en `contracts/modules/users-team.md` y `SEG-64`.

**Fuente:** Carlos Castaño, 2026-10-27; `modelo-datos.md` §5.1 y §5.2 (D63, D64).

---

## D96 · Cuatro roles: el administrador de la empresa es el experto en compliance y el trabajo se reparte por dimensión (2026-10-27)

**Contexto.** Carlos Castaño (2026-10-27): no hay rol de consultor, por ahora. Monkey es para que **la empresa** vea cómo va con SOC 2 (y luego otros marcos); el experto en compliance es el administrador de la empresa. El auditor es un perfil que la empresa crea cuando va a certificarse, para que revise cómo lleva sus cuentas en Monkey. Quien hace el trabajo son los `funcional`, y hay muchos con especialidades distintas. El cerebro estaba desactualizado frente al Excel del comité: desde aquí, **ante una duda de roles y permisos manda la hoja «Modelo de Gestión usuarios»**.

**Decisión.**

1. **Cuatro roles activos:** `admin_monkey`, `admin_empresa`, `funcional` y `auditor`. `consultor` se conserva en el enum `user_role` y en `consultant_assignments`, **sin uso**: no se crea, no se asigna, no aparece en ninguna pantalla, contrato ni mensaje. Volver a usarlo se decide aparte.
2. **`admin_empresa` es el experto en compliance de su empresa.** Es quien:
   - invita, edita y desactiva a `funcional` y `auditor`;
   - **asigna responsables por dimensión** (punto 5);
   - **valida la evidencia** de cada prueba, en **una sola revisión humana** (`HUMAN_VALIDATED`), y la rechaza con motivo;
   - da el **veredicto** de las pruebas manuales que no son documentales;
   - **decide las exclusiones** (punto 7);
   - crea, edita y da de baja controles, riesgos y causas **directamente** (punto 8).
   Puede subir evidencia, pero no es su foco.
3. **`funcional` es quien ejecuta.** Sube la evidencia de su dimensión, arregla lo que falle en servidores, bases de datos, aplicación o nube, y lo marca listo. **No valida nada.** Tiene una o más **especialidades**, que son las cinco dimensiones del modelo: documental (`policy`), aplicación, servidores, bases de datos y nube.
4. **`auditor` revisa, no califica.** Lo crea el `admin_empresa` para una auditoría y la empresa lo desactiva al terminar. Lee **todo** el cumplimiento de la empresa con la vista técnica, descarga evidencias, exporta reportes y **registra observaciones**; no valida, no ejecuta pruebas y no edita. **Su calificación (certificar o no) queda fuera por ahora**; volverá según el Excel.
5. **El responsable es por dimensión, no por control.** Un control mezcla pruebas de varias dimensiones (el Excel tiene una columna por dimensión) y quien lleva las políticas no es quien lleva los servidores.
   - Cada **servicio** tiene **un responsable principal por dimensión** (un `funcional` con esa especialidad).
   - El `admin_empresa` puede asignar a otro `funcional` un **control puntual en una dimensión**; esa asignación manda sobre la del servicio.
   - **El responsable efectivo** de (control, dimensión) es la asignación del control si existe; si no, el responsable del servicio para esa dimensión; si tampoco, nadie, y el admin lo ve como «sin responsable». No se materializa una fila por control: cambiar al responsable del servicio cambia a todos los controles que no tienen excepción.
   - El `funcional` ve **solo las pruebas de las que es responsable** (su bandeja); lo automático que falla en una dimensión le llega al responsable de esa dimensión.
6. **Cómo se llega a «cumple» una prueba manual.** El `funcional` sube → queda **en revisión** → el `admin_empresa` valida (cumple) o rechaza con motivo → el `funcional` rehace. Una versión nueva no pisa la anterior. **La IA sugiere y nunca decide.**
7. **Exclusiones.** El `admin_empresa` las propone y las decide **en un solo acto**: la exclusión nace aprobada, con justificación, vigencia y quién la aprobó. Los estados «pendiente» y «rechazada» quedan sin uso. Dejar sin efecto una exclusión vigente antes de que venza es `LATER`.
8. **Cambios a controles, riesgos y causas.** El `admin_empresa` los hace **directamente**, con advertencia y confirmación en pantalla. «Eliminar» es **dar de baja, no borrar**: las evaluaciones son inmutables y un auditor necesita el historial. El detalle de las advertencias se valida después (`P33`).
9. **Las evaluaciones del consultor y del auditor (D77) quedan en pausa.** Sin tabla nueva ni endpoint.
10. **MFA TOTP para los cuatro roles** (D66 se mantiene). **D96 se aparta del Excel en un punto**: la hoja marca la MFA como «No» para el `funcional`. Queda por ratificar con el comité; no se ha borrado nada.
11. **Activación de cuentas** (D95 sobrevive solo en esto): quien crea una cuenta emite un **código de un solo uso**, ligado al correo de la cuenta, que la persona canjea para poner su contraseña (la cuenta nace `pending`). Para `funcional` y `auditor` lo emite el `admin_empresa`; el primer `admin_empresa` sigue entrando con la clave de acceso de su empresa (D43).

**Por qué.** La hoja «Modelo de Gestión usuarios» del Excel tiene cuatro roles; deja al `admin_empresa` crear usuarios, **asignar controles**, aprobar evidencia, y crear, editar y eliminar controles y riesgos; y al `funcional`, solo lo asignado. Lo único que el Excel no resuelve es que un control mezcla dimensiones, y de ahí sale el responsable por dimensión; como la dimensión no depende del marco, sigue sirviendo cuando lleguen ISO 27001 o PCI DSS. Sin consultor, quien valida la evidencia es la propia empresa: la contrapartida es el `auditor` externo, que revisa sin poder cambiar nada, y el rastro de cada validación con nombre (`P34`).

**Qué reemplaza.** D64 y D65 enteras; D78 y D83; D84 (quién revisa); D85 y D88 (quién da el veredicto y valida); D77 queda en pausa; ajusta D63, D66, D68 (puntos 8 y 11), D81 y D95. Cierra `P28` (por obsoleta) y `P31` (gana el Excel).

**Qué sigue abierto.** `P33` (advertencias y confirmación al editar o dar de baja), `P34` (separar a quien sube de quien valida cuando es la misma persona) y `P35` (calificación del auditor).

**Qué cambia.** `modelo/05-usuarios.md` (roles, tablas, matriz), `modelo/07-cumplimiento.md`, `modelo/09`, los contratos de Cumplimiento y `users-team.md` (reemplaza a `users-consultant-access.md`), `enums.md`, el registro de seguridad y los documentos de producto.

**Fuente:** Carlos Castaño, 2026-10-27; hoja «Modelo de Gestión usuarios» del TSC integral.

---

## D98 · El funcional atiende todo lo de sus especialidades; toda cuenta lleva nombre; un administrador puede crear a otro (2026-10-29)

**Contexto.** Carlos Castaño (2026-10-29), al probar el flujo: confundía el «responsable» con el `funcional` y no quería que el trabajo dependiera de que alguien se lo asignara. **Ajusta D96** (puntos 5 y 6) y no toca lo demás.

**Decisión.**

1. **Un `funcional` atiende todo lo de sus especialidades, sin asignación.** Si lo crean como «servidores», al entrar ve de una vez los controles, las evidencias que debe subir, los fallos que debe corregir y los hallazgos de esa dimensión, en **todos** los servicios de su empresa. Si dos personas comparten una especialidad, **las dos** ven y atienden lo mismo (ninguna le quita nada a la otra). El administrador sigue validando.
2. **El reparto a personas concretas queda aparte.** El responsable principal de un servicio por dimensión y la excepción por control (D96, punto 5) **se conservan en la base y en la API**, pero **no cambian lo que nadie ve** y la interfaz los tiene apagados. Volverán cuando se decida cómo usarlos (ver «Pendiente»).
3. **Toda cuenta lleva nombre y apellido** al crearla (obligatorios, máx. 100); el correo sigue siendo lo que la identifica. El administrador puede **corregirlos** después, en cualquier persona del equipo y en sí mismo.
4. **El `admin_empresa` puede crear a otro `admin_empresa`** (con nombre, sin especialidades; se activa con su código, como los demás). Puede **desactivar y reactivar a otro administrador**, nunca a sí mismo; así la empresa no se queda sin administrador.
5. **Un correo no se registra dos veces.** Es único en toda la plataforma. Si ya está en el equipo de la empresa, la pantalla lo dice antes de enviar y ofrece corregir su nombre; si es de otra empresa, el servidor responde `409 EMAIL_TAKEN` (no se revela de quién).
6. **Un servicio lo lee el `funcional` que tiene alguna especialidad que ese servicio lleva, y el `auditor`** (D96 ya lo daba); crearlo, editarlo y borrarlo siguen siendo solo del administrador.

**No cambia.** Los cargos responsables (`organization_responsibles`, D30) siguen separados del equipo; su relación con las personas con cuenta se decide aparte.

**Pendiente (Carlos, luego).** Cómo asignar trabajo a personas concretas dentro de una especialidad, y si el cargo responsable puede enlazarse a una cuenta del equipo.

**Qué cambia.** `users-team.md`, `modelo/05-usuarios.md`, `compliance-controls.md` y `compliance-audit.md` (quién ve qué), `seguridad/requisitos.md` (SEG-66).

**Fuente:** Carlos Castaño, 2026-10-29; hoja «Modelo de Gestión usuarios» del TSC integral (el `funcional` es el «Control Owner»: ejecuta y sube evidencia de lo suyo).

---
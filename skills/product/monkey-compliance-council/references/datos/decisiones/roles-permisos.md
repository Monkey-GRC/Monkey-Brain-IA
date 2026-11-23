# Decisiones — Roles y permisos

Por qué Roles y permisos es como es. **Se consulta para reabrir, no para construir**: lo vigente está en [`arquitectura/roles-permisos/`](../../arquitectura/roles-permisos/README.md) y en `datos/modelo/`. Índice de todas las decisiones: [`README.md`](README.md).

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

---

## D77 · La evaluación del consultor y la del auditor (2026-10-13, cierra `P23`)

> **En pausa por D96 (2026-10-27).** Ninguna de las dos evaluaciones (la del consultor ni la del auditor) se construye por ahora. La del auditor volverá según el Excel, sin cambiar el estado calculado; la del consultor desaparece. La tabla `framework_assessments` y sus endpoints quedan sin uso.

**Decisión.**
1. **La evaluación del auditor va aparte.** Es su opinión sobre el cumplimiento del servicio y no cambia el estado calculado por Monkey: el estado solo lo mueven los datos medidos (§9).
   Se muestra al lado del estado, no en su lugar.
2. **El consultor, además del veredicto por test, da uno general por servicio y marco:** «lista» o «no lista para la auditoría», con su justificación. El veredicto por test sigue como estaba (R-03).
3. **Cada evaluación queda ligada a la evaluación del servicio** (`service_frameworks`: servicio + marco + versión + período + fecha de corte), para que diga sobre qué datos se hizo. Una vez emitida no se
   edita: si cambia de opinión emite otra, y la vigente es la última. Cada rol emite solo la suya (`SEG-56`).
4. **Qué ve el cliente** de estas evaluaciones queda dentro de `P3` (permisos por pantalla), no se decide aquí.

**Por qué.** Lo pidió el responsable de producto: el consultor prepara y el auditor certifica, y el Excel del comité no lo contempla. Separar el resultado del auditor evita que dos personas vean el mismo dato con
estados distintos; el veredicto general completa lo que hoy es solo prueba por prueba.

**Cierra** `P23`. Cambia §7.5 y §9 (tabla `framework_assessments`), el glosario, MD-155 y deja el ticket de la evaluación del auditor por crear.

**Fuente:** responsable de producto, 2026-10-13; D63, D64, D68.

---

---

## D81 · El administrador de la empresa ve la vista técnica mientras no se definan los permisos por pantalla (2026-10-16)

> **Ajustada por D96 (2026-10-27).** Sin consultor, la vista técnica es del `auditor` y del `admin_empresa`; el `funcional` sigue sin ella.

**Decisión.** `admin_empresa` puede pedir `?view=technical` en Cumplimiento (controles, riesgos y causas) y recibe lo mismo que el `auditor` y el `consultor`: códigos de requisito y de control, puntos de enfoque, estado del control y **todas las pruebas del control con su estado** (también las que aún no tienen activos conectados, que salen «Sin activos»). El `funcional` sigue recibiendo la vista de negocio y `403` si pide la técnica.

**Por qué.** El administrador de la empresa es quien conoce el cumplimiento y necesita ver, en cada control, **todo lo que se le pide para cumplirlo**: las pruebas documentales y las que valida la sonda, junto a las evidencias que debe aportar. Antes solo lo veían el auditor y el consultor (D63, D64). Los permisos finos por pantalla siguen abiertos (`P3`); cuando el comité los entregue se vuelven a ajustar.

**Lo que no cambia.** Ver no es hacer: el veredicto de una prueba, la decisión sobre las propuestas de cambio y las observaciones siguen siendo del consultor y del auditor (D64, D65), para que quien se evalúa no se califique a sí mismo. Los textos de las pruebas del comité y el proveedor de la sonda siguen sin salir (D70).

**Qué cambia.** `TECHNICAL_ROLES` en `Backend/src/features/compliance/application/shared/view-access.ts` y `TECHNICAL_VIEW_ROLES` en Frontend-Platform; las tablas «Quién puede qué» de `contracts/cumplimiento/controles.md`, `contracts/cumplimiento/resumen.md` y `contracts/cumplimiento/README.md` (el listado de pruebas de un control); `conventions.md`, `enums.md`, `contracts/control-tecnico.md`, `contracts/onboarding/contexto-servicio.md`, la matriz de `05-usuarios.md`, `09-calculo-cumplimiento.md`, `philosophy.md`, `mvp-roadmap.md`, `sprint-cumplimiento.md`, `flujo-end-to-end.md`, `CLAUDE.md` y SEG-54. Las decisiones D63, D64 y D80 conservan su texto original y apuntan aquí. **Hecho en el backend (MD-162, 2026-10-16):** `TECHNICAL_ROLES` incluye a `admin_empresa` y las pruebas e2e de `controles` y `riesgos` esperan la vista técnica para el administrador y `403` para el `funcional`.

**Fuente:** Carlos Castaño, 2026-10-16.

---

---

## D84 · La empresa solo aporta la evidencia: la revisan el consultor y el auditor, cada uno en su momento (2026-10-17, cierra parte de P25)

> **Reemplazada por D96 (2026-10-27).** La evidencia la sube el `funcional` responsable de esa dimensión y la valida el `admin_empresa`, en **una sola revisión**; el auditor lee, no revisa. Se conserva: la IA nunca valida sola y una versión nueva no pisa la anterior.

**Decisión.**
1. La empresa (`admin_empresa` y `funcional`) **aporta** la evidencia y nada más: nadie en la empresa la aprueba ni la rechaza. Se retiran `validation_status`, `approved_by`, `approved_at` y `decision_note` de `evidence_submissions` y el endpoint de aprobar o rechazar. Esto reemplaza la regla «solo `admin_empresa` aprueba evidencia».
2. El **consultor** y el **auditor** la revisan, **cada uno la suya**: los seis atributos y la validación humana, en una tabla nueva `evidence_reviews` (una fila por entrega y por rol). Son **dos momentos distintos**: la consultoría prepara a la empresa y la auditoría certifica (D63, D64). Ninguna revisión depende de la otra, y una evidencia no necesita las dos para cumplir.
3. **Transparencia.** Al auditor no se le muestra la revisión del consultor ni se le dice que existió; el consultor tampoco recibe la del auditor. La empresa, en la vista técnica (D81), ve la del consultor; la del auditor no, hasta que `P3` lo decida (igual que D77).
4. **Estado calculado.** El estado de la evidencia (`evidence_state`) que consume el motor sale de la revisión del consultor. La del auditor da el estado en la vista del auditor y no mueve el cálculo (D77). `ai_prevalidated` deja de guardarse: se deriva (la entrega tiene `ai_verdict` y ninguna revisión humana).
5. **Tipos de archivo.** PDF, DOCX, XLSX, PNG y JPG, hasta 25 MB (SEG-60). Lo que dice SEG-43 sobre la Descripción del Sistema no cambia.

**Por qué.** La evidencia es el sustento que la empresa entrega para que un tercero juzgue si cumple; que la propia empresa la apruebe la volvía juez de lo suyo y chocaba con SEG-58 cuando el administrador era quien la subía. Consultoría y auditoría son momentos distintos: el auditor no puede depender de lo que opinó el consultor.

**Lo que no cambia.** Una versión nueva nunca pisa la anterior; la IA sugiere y nunca decide (`ai_verdict`); la evidencia es válida si cae dentro del período de evaluación (C1); el veredicto del test sigue siendo del consultor (R-03, D77).

**Qué cambia.** `modelo/07-cumplimiento.md` (§7.3), `modelo/05-usuarios.md`, `enums.md`, `contracts/cumplimiento/evidencia.md`, `contracts/cumplimiento/README.md`, `contracts/cumplimiento/controles.md`, `conventions.md`, SEG-58, SEG-60 y SEG-61, `sprint-cumplimiento.md` y `P25`. Como MD-126 y MD-127 aún no se construyen, no hay migración que deshacer: **MD-127 deja de ser «aprobar o rechazar» y pasa a ser la revisión por consultor y auditor**.

**Sigue abierto en `P25`:** si validar las evidencias de un test documental es lo mismo que dar su veredicto.

**Fuente:** responsable de producto, 2026-10-17; D63, D64, D77.

---

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

**Qué cambia.** `modelo/05-usuarios.md` (roles, tablas, matriz), `modelo/07-cumplimiento.md`, `modelo/09`, los contratos de Cumplimiento y `contracts/gestion-usuarios.md` (reemplaza a `users-consultant-access.md`), `enums.md`, el registro de seguridad y los documentos de producto.

**Fuente:** Carlos Castaño, 2026-10-27; hoja «Modelo de Gestión usuarios» del TSC integral.

---

## D136 · Seis roles: se agrega `colaborador`, y la matriz de permisos es la Tabla 2 de la VF18 (2026-11-22; amplía D102 y ajusta D102, D103 y D104)

**Decisión** (`Modelo de Gestión usuarios`, Tablas 1 y 2; RC-13 y RC-14):

1. **Roles**: `admin_monkey`, `admin_empresa`, `responsable`, `delegado`, `auditor` y el nuevo **`colaborador`**: empleados y contratistas que deben conocer los documentos. **Lee y acepta los documentos que le asignan; no accede a controles, riesgos ni evidencia.** La cadena de asignación `admin_empresa` → `responsable` → `delegado` de D102 se mantiene.
2. **MFA obligatoria para los seis roles** (D66, D94).
3. **La matriz de permisos es la Tabla 2** y reemplaza a la de §5.5. Lo que cambia frente a lo construido:
   - **Solo `admin_monkey` y `admin_empresa` crean, editan, desactivan usuarios y asignan roles.** El `responsable` ya no crea a sus delegados (ajusta el punto 2 de D102 y D104); sigue **delegando** un control en un usuario de su equipo.
   - **`admin_monkey` gestiona usuarios de una empresa** (crear, editar, desactivar, asignar roles y controles), asigna el responsable de un documento y **ve** controles, riesgos, evidencia, documentos, resultados de pruebas, el registro de auditoría y los tableros, y exporta reportes. Hoy no entraba al cumplimiento de un cliente (D103, §5.1): ajusta D103 y responde en parte `P47`.
   - El `responsable` **edita sus controles y sus riesgos** (⊗), da la **primera aprobación** del cumplimiento, gestiona la MFA de su equipo (⊗) y ve el registro de auditoría de lo suyo (⊗). La aprobación final es solo del `admin_empresa` (D132).
   - El `delegado` ve y carga evidencia solo en lo que le delegaron, ejecuta sus pruebas (⊗) y **no ve** el tablero ni el registro de auditoría.
   - El `auditor` ejecuta pruebas con restricción (⊗) y sigue siendo el único con el módulo de auditoría.
   - **Módulo Documentos** (D133): asignar responsable; crear, importar y versionar; definir el flujo; enviar o cancelar; aprobar o rechazar; definir la aceptación; aceptar; ver el vigente y el historial; archivar. El `responsable` actúa sobre los documentos de los que es responsable y aprueba solo si lo eligieron como aprobador; el `colaborador` ve solo los documentos que le asignan.
   - Se quita «Aprobar evidencia»: la aprobación es del control (D132).
4. **«Eliminar» se sigue leyendo como dar de baja**, sin borrar (evidencia y controles): las versiones y el historial son inmutables (D96, D119).
5. **El cupo de usuarios** (`companies.max_users`, D103) cuenta a todos los roles de la empresa, también al colaborador: el libro no lo cambia (DEV-16).

**Por qué.** Es la matriz del comité. El módulo Documentos necesita que el personal que no trabaja en controles pueda aceptar las políticas sin ver lo demás.

**Qué cambia.** §5.1 y §5.5, `contracts/enums/roles-permisos.md`, `contracts/gestion-usuarios.md`, el RLS y los roles de base de datos (`schema-implementacion.md`: `admin_monkey` lee datos de una empresa) y los requisitos de seguridad de roles cuando se construya (RC-13, RC-14). Confirma `P38` (D102).

**Fuente:** comité funcional, VF18 (`Modelo de Gestión usuarios`, Tablas 1 y 2), 2026-11-22; Héctor Ríos (Rod), 2026-11-22: «se hace como lo quiera el comité». Los puntos 4 y 5 los dejó desarrollo según DEV-16.

---

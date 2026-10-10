# Registro de decisiones — D62–D66

> Parte de [`modelo-datos-decisiones.md`](../modelo-datos-decisiones.md) (índice). Cómo se cuenta el cumplimiento, el auditor, los cinco roles, controles propios y MFA.
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

---

## D63 · El auditor es un rol aparte (2026-10-09)

**Decisión.**

- `auditor` es un rol con permisos propios y su propia experiencia al entrar; la vista técnica es suya (y del consultor, D64), no un modo que active el cliente.
- Lo crea **solo `admin_empresa`**. Su cuenta pertenece a la empresa (`users.company_id`); la persona suele ser externa, pero dentro de Monkey es parte de la empresa.
- Ve **todo el cumplimiento de todos los servicios** de su empresa, en solo lectura, con la **vista técnica**. `admin_empresa` y `funcional` solo ven la vista de negocio.
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

**Decisión.** Se añade el rol `consultor` y se descartan los roles personalizados: los 5 roles son fijos.

- **Consultoría** prepara al cliente para la auditoría; **auditoría** es el examen final que da la certificación del marco. Hacen prácticamente lo mismo; el consultor prepara el terreno.
- El consultor es de **Next** (la empresa dueña de Monkey). Es **una sola cuenta con un solo correo**, que **crea `admin_monkey` desde Monkey Admin** y asigna a las empresas que atiende
  (`consultant_assignments`). La asignación dura hasta que se quita.
- Al iniciar sesión **elige la empresa en la que trabaja** y ve una a la vez; el sistema comprueba su asignación en cada petición. Cambiar de empresa queda en la auditoría.
- **La empresa puede suspender** a un consultor asignado (`CC6.3`) y ve la lista de los que tiene, en solo lectura. **Una suspensión de la empresa solo la reactiva la empresa**: `admin_monkey` no puede, porque anularía el control de la empresa sobre sus propios datos.
- Ve todo el cumplimiento de la empresa con la **vista técnica**, registra observaciones (las cierra quien las escribió) y exporta reportes como el auditor.
- **Da el veredicto** de los tests documentales y manuales (R-03; la IA solo sugiere), **propone las exclusiones** (las aprueba el cliente, A3) y **aprueba los cambios de controles** (D65).
- MFA obligatoria (D66).
- **El auditor es distinto:** lo crea `admin_empresa` y pertenece a una sola empresa (D63).
- **Sin roles personalizados** (`custom_roles` y `users.custom_role_id` salen del modelo). Si sobra tiempo más adelante, se vuelve a plantear.

**Por qué.** Las reglas del comité decían «el consultor evalúa» y «el consultor propone», pero ese rol no existía entre los 4 y A3 lo equiparaba con `admin_monkey`. Un consultor de Next atiende a varios clientes:
una cuenta única evita un correo por empresa (el correo es único en todo el sistema, D29) y permite que Monkey gestione quién atiende a quién.
**Qué cierra.** Quién da el veredicto de los tests manuales, quién propone exclusiones y P19 y P20. **Fuente:** responsable de producto, 2026-10-09.

---

## D65 · Controles propios y cambios de controles con aprobación del consultor (cierra P8) (2026-10-09)

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

**Decisión.** La autenticación de dos factores (TOTP) es obligatoria para `admin_monkey`, `admin_empresa`, `funcional`, `consultor` y `auditor`, y el resto de políticas del TSC integral
(§5.3) aplican a todos. Es un requisito de seguridad sin excepciones; se construye en el sprint de acceso y usuarios, no en el de Cumplimiento.
**Por qué.** La hoja de roles del TSC la exigía solo a admin y auditor y dejaba al `funcional` sin ella; el responsable de producto la extendió a todos.
**Fuente:** responsable de producto, 2026-10-09.

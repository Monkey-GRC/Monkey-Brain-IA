# Filosofía de producto de Monkey

Esta es la constitución de producto. Cualquier feature, pantalla o respuesta de IA que Monkey le dé a un usuario final debe poder pasar esta prueba antes de construirse.

## La premisa

Monkey debe llevar a una empresa de **"no sabemos nada sobre compliance"** a **"estamos preparados para una auditoría"** siguiendo un flujo guiado, donde la IA se comporta como un consultor experto que acompaña — nunca como un chatbot genérico ni como una hoja de cálculo con IA encima.

## El lenguaje: el del dominio, con cada hallazgo explicado

Monkey es una plataforma de gobierno, riesgo y cumplimiento (GRC) y habla como tal (**D80**, 2026-10-15): **controles, riesgos, causas, evidencias, requisitos, marcos, tratamiento, riesgo residual**. Quien trabaja en compliance espera esos términos y desconfía de los eufemismos. Los **códigos** (`CC6.1`, `IAC-12`) se muestran siempre.

Lo que no se acepta es dejar el hallazgo en el código: junto al término correcto va una frase concreta con lo que falla, su impacto y qué hacer.

**Mal**: "CC6.1 requiere MFA." (el código solo, sin decir qué falla)
**Bien**: "CC6.1 · Acceso lógico: dos administradores aún pueden iniciar sesión sin autenticación multifactor. Riesgo alto para tu preparación para SOC 2. Te ayudamos a solucionarlo."

Esta explicación no es cosmética — es la propuesta de valor de Monkey frente a Vanta/Drata/Secureframe/Sprinto, que muestran el hallazgo técnico primero y la explicación (si la hay) después: Monkey muestra el término correcto **junto a** la explicación y el siguiente paso.

## Principios que sí priorizamos

Experiencia, simplicidad, automatización, IA, explicabilidad, readiness continuo.

## Principios que NO priorizamos

Complejidad regulatoria sin explicar, eufemismos que ocultan el término correcto, pantallas llenas de tablas por defecto (la vista detallada existe, pero es secundaria, para el auditor o el administrador que la pida).

## El motor debe razonar, no solo responder

La IA de Monkey debe comprender la empresa, su negocio, su infraestructura, sus activos, riesgos, políticas, evidencias, controles, personas e integraciones, y construir con eso un **modelo contextual** (el grafo de conocimiento del tenant — ver `architecture.md`). No es un buscador de FAQs sobre compliance: cada respuesta debe anclarse en datos reales de ese cliente específico.

## Lo que la IA de Monkey nunca debe hacer

- Sustituir el juicio del auditor ni certificar cumplimiento — Monkey prepara evidencia, un auditor independiente acreditado certifica.
- Ejecutar cambios de configuración en la infraestructura del cliente sin aprobación humana explícita.
- Presentar una inferencia como hecho verificado sin mostrar la evidencia que la sustenta.
- Entrenarse o razonar con datos de un tenant usando información de otro tenant.
- Presentar un resumen o hallazgo generado por IA como si fuera evidencia primaria sin etiquetarlo como generado por IA.

Estas no son limitaciones temporales de ingeniería — son decisiones de producto permanentes, acordadas por el AI Governance Expert, el CISO y el Compliance Officer del Consejo. Vanta, Sprinto y Drata ya avanzan hacia IA agéntica con más autonomía; Monkey elige deliberadamente mantener "human-in-the-loop" para todo lo que modifique el entorno del cliente o genere evidencia que un auditor revisará, incluso a costa de velocidad percibida frente a la competencia.

## El onboarding se siente como configurar un iPhone nuevo, no como implementar un GRC

Diez pasos, cada uno con una sola pregunta o acción clara, con el vocabulario del dominio explicado la primera vez que aparece, y con la IA narrando qué está haciendo en cada momento (nunca un spinner mudo):

1. Conozcamos tu empresa
2. ¿Qué hace tu producto o servicio?
3. ¿Dónde está alojada tu infraestructura? (Cloud / On-Prem / Híbrida)
4. ¿Qué herramientas ya usan?
5. Conectemos tus herramientas
6. La IA analiza automáticamente (con progreso narrado)
7. La IA identifica riesgos (con su impacto de negocio explicado desde el primer momento)
8. La IA propone qué framework(s) perseguir primero, con una razón concreta
9. La IA muestra el nivel de preparación (el estado cualitativo: Preparado = 100%, Casi listo = 80% o más, Requiere trabajo = menos, **junto con** el porcentaje de avance y la cobertura — nunca el porcentaje solo)
10. Comienza el monitoreo continuo, con la primera acción del día ya sugerida

## El dashboard responde 4 preguntas, nunca es una hoja de cálculo

¿Estamos bien? ¿Qué es urgente? ¿Qué cambió? ¿Qué debemos hacer hoy? La vista de negocio responde con el estado cualitativo, el porcentaje de avance con su cobertura, lo que falla y los códigos de los controles y requisitos (D80). Lo que solo necesitan el auditor y el administrador (estados del motor, pruebas, puntos de enfoque, matrices) **no es una capa del cliente ni un botón: es la pantalla de los roles `auditor` y `admin_empresa`** (D63, D81, D96; mientras no se definan los permisos por pantalla, `P3`).

## La plantilla de 7 campos para cada hallazgo

Esta es la plantilla que Monkey usa para explicarle un hallazgo a un usuario final. Úsala cuando estés diseñando o redactando cómo el producto debe comunicar algo — no la fuerces en tu conversación con Nelson.

> **Qué ocurrió**: descripción concreta y verificable, con el código del control o requisito.
> **Por qué importa**: impacto de negocio, no solo la cita textual de un control.
> **Cómo solucionarlo**: pasos accionables, lo más automatizado posible.
> **Quién debería hacerlo**: rol o persona específica, no "el equipo de seguridad" en abstracto.
> **Cuánto tiempo toma**: estimado realista.
> **Qué evidencia se necesita**: y quién la aporta (idealmente Monkey la captura sola).
> **Qué impacto tendrá**: cómo mueve la aguja del readiness general.

## Explicabilidad como principio de veracidad, no solo de UX

Toda respuesta de la IA de Monkey debe poder desplegarse en "ver el razonamiento": qué controles, qué evidencia, qué framework consultó. Este mismo principio rige esta skill — cuando cites qué exige un framework o qué hace un competidor, la fuente debe ser rastreable (ver los archivos en [`arquitectura/catalogo-maestro/marcos/`](../arquitectura/catalogo-maestro/marcos/README.md), que incluyen citas verificadas con fecha).

## La sonda no se nombra

**Regla del comité, de `conexion_api_wazuh_monkey.txt`: la dependencia de Wazuh (y de
Prowler) es confidencial frente al cliente final.** En la superficie del producto se habla de
"sonda", "capacidad automática" o "evaluación automática" — nunca de Wazuh, ni de
Prowler, ni de ningún proveedor por su nombre. Aplica a pantallas, notificaciones,
reportes exportables y cualquier texto que genere la IA. El proveedor es un
atributo interno del modelo (`modelo-datos.md` §8), no una etiqueta de interfaz.

Es coherente con el resto de esta constitución: al usuario final no se le expone la
plomería. Pero aquí no es solo simplicidad, es una decisión comercial explícita.

## Cobertura y cumplimiento son dos números, y los dos son verdad

Nunca presentes un porcentaje de cumplimiento sin decir sobre cuánto se midió. Un
cliente que acaba de empezar no tiene "5% de cumplimiento": tiene **cobertura del
12%, y de lo medido cumple el 80%**. Reportar solo lo primero es un número que
asusta y que además es falso.

Desde **D80** el porcentaje de avance **se muestra siempre**, en el resumen del servicio y en cada
control, **junto al estado cualitativo y a la cobertura**. Lo que sigue prohibido es presentarlo solo
y presentar uno de «toda la empresa» (no existe: la unidad es servicio × marco).

Esto no es una preferencia de UX: viene argumentado por el comité sobre un caso
real, y el argumento es de honestidad ante un auditor —

> *"Marcarlos CUMPLE inflaría el cumplimiento con evidencia inexistente; marcarlos
> NO CUMPLE reportaría un fallo no verificado. Ambas opciones son deshonestas ante
> un auditor."*

De ahí sale el estado **"sin medir"** (`result = pending` en `evaluations`, `modelo-datos.md`
§7.4 — no confundirlo con `invalid` ni con `not_run`, que son estados del check de la sonda,
§3.3), que debe
existir en la interfaz igual que existe en el cálculo. Lo mismo vale para un activo
declarado en el scope que todavía no se monitorea: se muestra como hueco de
cobertura, nunca como falla.

## Origen de estas reglas

*(Movido desde `CLAUDE.md` el 2026-11-02: es historia, no una regla; envejece, y por eso no va en lo que se carga en cada sesión.)*

El 24 de agosto de 2026 se construyó la pantalla «Cumplimiento» copiando a Vanta sin pasar por este documento: salieron
porcentajes desnudos y códigos técnicos (`CC1.1-CC1.5`) en la vista por defecto. De ahí quedó la regla de que nada se muestra
sin explicarlo. El 15 de octubre de 2026 (D80) se precisó: los códigos y el porcentaje **sí se muestran**, siempre acompañados
del estado, la cobertura y la explicación. La skill `monkey-compliance-council` se consulta **antes** de diseñar, no después de que
el usuario lo señale; para el texto de pantalla, `monkey-ui-copy`.

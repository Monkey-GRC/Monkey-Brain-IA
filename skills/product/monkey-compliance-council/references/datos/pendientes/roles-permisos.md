# Pendientes del comité — Roles y permisos

Preguntas abiertas que afectan a [Roles y permisos](../../arquitectura/roles-permisos/README.md). **Si una sigue aquí, no se resuelve por cuenta propia: se pregunta.** Tablero y reglas: [`README.md`](README.md).

## P3 · Qué ve y qué hace cada rol en cada pantalla de Cumplimiento

**Estado:** abierto. El comité entrega un Excel con los permisos **por pantalla**; hasta que llegue, la matriz de `modelo-datos.md` §5.5 es la vigente y los tickets que dependen de ella esperan.

Lo que ya está decidido: los 4 roles son fijos y no hay roles personalizados (D96); Cumplimiento vive **dentro de cada servicio**; el `funcional` ve solo sus controles y las evidencias que debe aportar.
Lo que falta: el detalle por pantalla de cada rol.

**Qué depende:** las pantallas y los endpoints de Cumplimiento por rol.

---

## P34 · Quien sube la evidencia y quien la valida son la misma persona

**Estado:** abierto desde 2026-10-27 (D96). El `admin_empresa` valida la evidencia y también puede subirla. Aunque su foco no es subirla, puede pasar, y entonces se califica a sí mismo.

*Recomendación: no bloquear por ahora; que cada validación quede en el rastro con quien subió y quien validó, y que el `auditor` externo sea el contrapeso. Si hace falta, más adelante: que no pueda validar lo que él mismo subió, o que un segundo administrador lo confirme.*

**Qué depende:** nada del código inmediato. Es `LATER`.

---

---

## P35 · La calificación del auditor

**Estado:** abierto desde 2026-10-27 (D96). La evaluación del auditor (certificar o no, D77) queda en pausa. Cuando vuelva, se diseña según lo que pida el Excel del comité, sin cambiar el estado calculado del servicio.

**Qué depende:** nada del código inmediato. Es `LATER`.

---

## P36 · La independencia del auditor: qué ve de la evidencia y cómo se crea su cuenta

**Estado:** abierto desde 2026-10-28 (MD-183, reducido por D96). El auditor es independiente en la práctica real: forma su propio juicio sobre lo que la empresa presenta como final. Hoy la empresa lo crea y puede ver todo, incluidas las versiones rechazadas de una evidencia.

1. **¿El auditor ve solo la versión vigente de cada evidencia?** *Recomendación: sí; las anteriores se piden aparte, de forma explícita, y consultarlas queda en el rastro.*
2. **¿La revisión de una evidencia pasa a ser histórico inmutable?** Hoy `PUT …/review` reemplaza la fila de la entrega (el rastro guarda el antes y el después). *Recomendación: se agrega una revisión nueva y la vigente es la última.*
3. **¿Hace falta una declaración de independencia al crear al auditor?** *Recomendación: sí, con quién la creó y cuándo.*

**Qué depende:** MD-183. No bloquea la API de observaciones (MD-154). Es `LATER`.

# Pendientes del comité — Roles y permisos

Preguntas abiertas que afectan a [Roles y permisos](../../arquitectura/roles-permisos/README.md). **Si una sigue aquí, no se resuelve por cuenta propia: se pregunta.** Tablero y reglas: [`README.md`](README.md).

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

---

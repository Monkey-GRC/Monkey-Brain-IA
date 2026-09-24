# Modelo de datos — lo que falta decidir

Las decisiones **del modelo relacional** están todas cerradas, con su fuente y su
razonamiento, en **`modelo-datos-decisiones.md`**. Lo que queda abierto es lo de abajo:
preguntas de producto que **solo el comité o Nelson pueden responder**. Antes de construir
algo que dependa de una, consúltala — si sigue aquí, no la resuelvas por tu cuenta.

## P1 · Cumplimiento fuera del onboarding — falta el visto bueno del comité

**Estado:** propuesto y documentado como decisión D23, **pendiente de confirmación.**

Se decidió que el módulo de Cumplimiento (configurar riesgos, causas y controles) **no es
un 4º componente del onboarding** y no bloquea el resto del producto. El razonamiento
completo está en D23. Héctor lo iba a debatir con el comité el 2026-09-20.

**Qué depende de esto:** el épico 8 de `assets/PROPUESTA-JIRA-MVP-MONKEY.md`. Los épicos
1-7 y 9-12 no dependen de la respuesta y se pueden desglosar ya.

**Si el comité dice otra cosa:** hay que ajustar D23, `modelo-datos.md` §3.5 y §7, y la
nota de `modulos/onboarding.md`.

## P2 · El flujo de la clave de acceso — 5 detalles sin definir

La decisión de fondo está cerrada (D24: Monkey Admin registra el tenant, la clave se manda
al `admin_email`). Falta el detalle operativo, y **condiciona la pantalla del día 1-2 del
sprint de onboarding**:

| # | Pregunta |
|---|---|
| a | ¿La clave es un código que el cliente escribe a mano, o un link con token en la URL? Cambia qué pantalla hay que construir |
| b | ¿Cuánto dura antes de expirar, y puede `admin_monkey` regenerarla o reenviarla si el correo se perdió? |
| c | Si `admin_monkey` se equivoca escribiendo el nombre de la empresa o el correo, ¿se puede corregir desde Monkey Admin antes de que el cliente entre? Importa porque ese nombre queda **bloqueado** en el Componente 1 |
| d | Si se marca "base de datos dedicada", ¿aprovisionarla es instantáneo o toma tiempo? Si toma tiempo, ¿se manda la clave de una vez o se espera? |
| e | ¿Puede haber más de un correo administrativo por empresa desde el registro, o el resto de usuarios se invita después desde adentro? |

Las más urgentes son **(a)** y **(c)**.

## P3 · Detalle fino de dos módulos

Ninguna de las dos bloquea el sprint de onboarding, pero sí el desarrollo de su módulo:

- **Usuarios:** qué permisos concretos puede llevar un `custom_role`, más allá del ejemplo
  ya documentado ("Revisor de evidencia").
- **Cumplimiento:** los permisos dentro del módulo más allá de "es de `admin_empresa`", y
  si necesita su propia pantalla o vive dentro de la vista de cada servicio.

---

## Cómo se cierra un pendiente

1. El comité responde.
2. La decisión se escribe en `modelo-datos-decisiones.md`, con la fuente y el porqué, y si
   cambia una tabla o el cálculo, se ajusta `modelo-datos.md`.
3. Se borra de este archivo.
4. Se cierra el ticket de Jira correspondiente en el proyecto `MD`, con la decisión y su
   fuente en un comentario.

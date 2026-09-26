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


## P4 · `responsible_id` apunta a un catálogo de cargos que no existe

**Estado:** hueco estructural del modelo, detectado al auditar el repo el 2026-09-26.

`modelo-datos.md` §7.3 define `evidence_requirements.responsible_id` como FK al **cargo, no
a la persona**, y §5.4 afirma que *"el cargo vive en el catálogo y es estable"*. Pero la
única tabla de cargos del modelo es `organization_responsibles` (§5.2), que lleva
`organization_id` — es decir, vive en el escenario del cliente, no en el catálogo maestro.
No existe ninguna entidad global a la que `responsible_id` pueda apuntar.

**La pregunta:** ¿se añade una tabla de cargos al catálogo maestro (§3), o `responsible_id`
apunta a `organization_responsibles` y entonces `evidence_requirements` deja de ser
clonable tal cual?

**Qué depende:** el clonado de `evidence_requirements` (§3.5) y la asignación de responsable
de una evidencia (decisión A1).

## P5 · Dos cifras de la documentación de Wazuh sin universo definido

**Estado:** detectadas al medir el Excel contra el repo el 2026-09-26. No se corrigieron a
ojo porque no se puede saber a qué se refieren.

- `wazuh.md` dice *"869 checks, 646 con mapeo nativo, 223 inferidos por Monkey"*. El catálogo
  del archivo maestro tiene **11.352 checks**, de los que 6.479 traen `SOC 2` no vacío.
  869 no corresponde a ningún subconjunto identificable. ¿De qué plataforma o política sale?
- `manifest.json` dice ruleset Wazuh **v4.14.7**; `infraestructura.md` dice despliegue
  **4.12**. Puede ser ruleset vs versión instalada, pero nadie lo escribió.

---

## Cómo se cierra un pendiente

1. El comité responde.
2. La decisión se escribe en `modelo-datos-decisiones.md`, con la fuente y el porqué, y si
   cambia una tabla o el cálculo, se ajusta `modelo-datos.md`.
3. Se borra de este archivo.
4. Se cierra el ticket de Jira correspondiente en el proyecto `MD`, con la decisión y su
   fuente en un comentario.

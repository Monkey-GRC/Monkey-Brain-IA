# Modelo de datos — lo que falta decidir

Las decisiones **del modelo relacional** están todas cerradas, con su fuente y su
razonamiento, en **`modelo-datos-decisiones.md`**. Lo que queda abierto es lo de abajo:
preguntas de producto que **solo el comité o Nelson pueden responder**. Antes de construir
algo que dependa de una, consúltala — si sigue aquí, no la resuelvas por tu cuenta.

**Los números son estables: una pregunta cerrada no se reutiliza ni renumera el resto**, para
que las referencias desde `contracts/`, Jira o un comentario viejo sigan valiendo.

Cerradas hasta hoy:

| | Pregunta | Cerrada |
|---|---|---|
| **P1** | Cumplimiento fuera del onboarding | 2026-09-26 — el comité confirmó D23: el onboarding se queda en 3 componentes |
| **P4** | `responsible_id` sin catálogo de cargos | 2026-09-29 — cerrada por desarrollo en D30: el cargo es `organization_responsibles`. **Falta ratificarla con el comité**; no bloquea nada |

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


## P6 · La lista completa de `business_model`

`modelo-datos.md` dice "40+ opciones" y **el propio Excel del comité también lo dice**, pero su hoja
*Contexto Empresa* lista solo 19. ¿Cuáles son las que faltan? Mientras tanto valen las 19 y `other`
(`contracts/enums.md`). No bloquea nada.

## P7 · Dónde se aloja el Postgres de producción

Decisión de infraestructura que se dejó para cuando se hable de lanzamiento con el comité. La
recomendación planteada (no decidida) es **no alojarlo en el mismo servidor que corre la app** —ni
la VPS actual ni una nueva compartida—: superficie de ataque compartida con n8n y minio, contención
de recursos y, sobre todo, backups y recuperación (un servicio administrado tipo RDS los trae; auto-
alojado hay que operarlos). Alternativa: un servidor separado, dedicado solo a la base. No afecta al
modelo (RLS, 4 schemas, roles).

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

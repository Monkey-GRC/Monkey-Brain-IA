---
name: monkey-security-review
description: >-
  Revisa un cambio de Monkey contra los requisitos de seguridad registrados (SEG-n) cuando crea un endpoint, una tabla,
  un flujo de archivos, manejo de credenciales, cambios de rol o texto que pueda nombrar a un proveedor. No usar para
  cambios sin superficie de seguridad (estilos, refactor interno, documentación) ni como pentest.
argument-hint: "[módulo o cambio a revisar]"
---

# Revisión de seguridad de un cambio

Dice **qué requisito del registro aplica y si el cambio lo cumple**. No es una auditoría ni un pentest
(`references/seguridad/README.md`). Lo determinista ya lo hacen los hooks de `.claude/` (credenciales, commits, nombre del
proveedor en superficie de producto); esta revisión cubre el **diseño**.

## 1. Qué mirar según lo que cambia

Los requisitos viven **una sola vez, en el módulo que posee la capacidad**: abre el archivo indicado, no busques por pantalla.

| El cambio… | Revisa | Pregunta clave |
|---|---|---|
| Añade un **endpoint** | `seguridad/roles-permisos.md`, `seguridad/trazabilidad.md` | ¿Lleva `@Roles`? ¿El rol se lee de la base? ¿Deja el rastro **en la misma transacción** (`AuditIntent`)? |
| Añade o cambia una **tabla** de cliente | `seguridad/aislamiento-tenant.md` | ¿Tiene `tenant_id`/`company_id`, RLS activa y forzada, y toda consulta va en `withScope`? ¿Una FK a otra tabla de tenant lee antes el padre bajo RLS? |
| Sube, guarda o entrega **archivos** | `seguridad/plataforma.md` | Tipo, tamaño y **contenido** validados; bucket privado; descarga por enlace firmado; huella SHA-256 |
| Toca **credenciales o secretos** | `seguridad/plataforma.md`, `seguridad/entrega.md` | ¿Cifradas en reposo y nunca en una respuesta, log ni auditoría? ¿Alguna llave de larga vida? |
| Toca **sesión, login, contraseña o segundo factor** | `seguridad/autenticacion.md` | ¿Cookie `httpOnly`, bloqueo, MFA, tokens solo como HMAC? |
| Toca **roles o permisos** | `seguridad/roles-permisos.md`, `seguridad/gestion-usuarios.md` | ¿El `funcional` queda acotado a sus especialidades? ¿Solo el rol permitido valida/da veredicto? **Decisión crítica: pregunta.** |
| Toca la **sonda, el motor de nube o el trabajador** | `seguridad/control-tecnico.md` | ¿Credenciales temporales? ¿API interna solo con su token? ¿Aislado? |
| Escribe **texto que verá el cliente** | `seguridad/control-tecnico.md` (confidencialidad) y `monkey-ui-copy` | ¿Nombra al proveedor del motor? |

## 2. Cómo revisar

1. Corre `monkey-preflight` del módulo para ver sus `SEG-n`.
2. Lee **solo** los `SEG-n` de la tabla de arriba y su columna *Verificación*: dice qué prueba lo comprueba.
3. Para cada uno: **cumple / no cumple / no aplica**, citando `archivo:línea` del código revisado.
4. Un requisito en 🔴 o 🟠 que el cambio **empeora** es un bloqueo; uno que ya estaba así se queda como estaba.

## 3. Salida

```
Seguridad: <módulo> · <cambio en una línea>
Cumple: SEG-xx, SEG-yy
No cumple: SEG-zz → <qué falla, archivo:línea, cómo se arregla>
No aplica: <los descartados, solo si no es obvio>
Nuevo requisito: <sí/no> (si sí, añádelo con monkey-registry, tipo SEG)
```

Si el cambio crea un requisito que no existe, **se registra en el mismo cambio** (`monkey-registry`); no se deja como comentario.

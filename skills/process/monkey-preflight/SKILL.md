---
name: monkey-preflight
description: >-
  Antes de tocar un módulo de Monkey, imprime todo lo que el cerebro sabe de él (contrato, enums, decisiones, pendientes
  abiertas, deuda, seguridad). Úsala al empezar trabajo sobre un módulo o cuando haya duda de si algo está decidido. No
  usar para módulos que no existen en arquitectura/.
argument-hint: "<módulo>"
---

# Contexto de un módulo

Es una consulta determinista: no interpreta nada, solo junta lo que ya está escrito.

```bash
python3 skills/process/monkey-preflight/scripts/module-context.py --list          # módulos disponibles
python3 skills/process/monkey-preflight/scripts/module-context.py <módulo>        # p. ej. cumplimiento, onboarding/contexto-servicio
```

## Cómo leer la salida

| Línea | Qué hacer |
|---|---|
| `contracts/…` | Es el contrato que hay que cumplir y, si falta el endpoint, acordarlo antes |
| `Decisiones (D-n)` | Lo decidido. Se abre solo para reabrir, no para construir |
| **`ABIERTA  P-n`** | **Si tu tarea depende de ella, pregunta; no la resuelvas** |
| `Deuda vigente` | Los atajos ya registrados del módulo; si usas uno nuevo, regístralo (`monkey-registry`) |
| `Requisitos de seguridad` | Los `SEG-n` que el cambio no puede violar |

Un módulo con componentes (`onboarding`, `cumplimiento`) se consulta por el componente: `onboarding/conexion-activos`.
Los registros de deuda, seguridad y pendientes salen del módulo padre.

## Si la salida no basta

El README del módulo (`references/arquitectura/<módulo>/README.md`) dice dónde está cada dato; el índice completo es
`references/arquitectura/README.md`. La regla de oro del cerebro: **un dato vive en un solo archivo**; los demás lo enlazan.

---
name: monkey-closeout
description: >-
  Cierra una tarea de desarrollo de Monkey: comprueba que contrato, enums, registros (D/P/DT/SEG) y documentos afectados
  quedaron al día y corre la verificación de integridad del cerebro. Úsala al terminar cualquier cambio de código o de
  documentación. No usar a mitad de una tarea ni para decidir qué construir.
---

# Cierre de una tarea

Un cambio no termina hasta cerrar lo que toca, **en el mismo cambio** (`STANDARD.md` §5). La plantilla de PR del cerebro tiene la
misma lista; esta skill la hace ejecutable.

## 1. Estado de los repos

```bash
for r in Monkey-Brain-IA Backend Frontend Frontend-Platform; do echo "== $r"; (cd ../$r && git status --short | head -20); done
```

Lo que aparezca es lo que Rod tendrá que commitear. **Claude no hace commits ni PRs.**

## 2. Lista de cierre

Marca solo lo que aplique y revisa en el archivo, no de memoria:

- [ ] **Contrato:** el endpoint o formulario está en `contracts/<módulo>.md`; si toca el sobre, un error o un enum, `conventions.md` o `contracts/enums/<módulo>.md`.
- [ ] **Decisión (`D-n`):** si se decidió algo, está en `datos/decisiones/` con su fuente (quién y cuándo).
- [ ] **Pendiente (`P-n`):** si el cambio cierra o abre una pregunta, `datos/pendientes/` está al día. **No se cierra por cuenta propia.**
- [ ] **Deuda (`DT-n`):** un atajo está registrado; una deuda que se cierra se **borró**.
- [ ] **Seguridad (`SEG-n`):** requisito nuevo o cambio de estado reflejado en `seguridad/<módulo>.md` y su resumen.
- [ ] **Documentos afectados:** `modelo-datos.md` y su módulo, `arquitectura/<módulo>/`, `context/backend.md` o `context/frontend.md`, el roadmap.
- [ ] **Confidencialidad:** ninguna pantalla, texto o contrato nombra al proveedor de la sonda ni copia credenciales.

Para cada hueco usa `monkey-registry` (altas y cierres). Cada dato vive en **un solo archivo**; los demás lo enlazan.

## 3. Integridad del cerebro (determinista)

```bash
python3 skills/process/monkey-closeout/scripts/check-brain.py
```

Comprueba enlaces y anclajes, bloques de código sin cerrar, tablas partidas, `manifest.json` e IDs duplicados. Un `FALLO` se corrige
antes de terminar; un `AVISO` (archivo >25 KB) se evalúa. El hook `Stop` corre esta misma comprobación y **no te deja terminar** si
el cerebro quedó roto.

## 4. Si el cambio tocó la automatización

Si cambiaste `CLAUDE.md`, `.claude/`, una skill o un subagente, corre también
`python3 skills/process/monkey-closeout/scripts/check-claude-config.py` y sigue `STANDARD.md` §9 (los subagentes se leen al arrancar:
las pruebas van en una sesión nueva).

## 5. Reporte

```
Cierre: <tarea>
Actualizado: <contrato, D/P/DT/SEG, docs>
Verificación: <check-brain OK | qué falló>
Sin commitear: <repos con cambios>
```

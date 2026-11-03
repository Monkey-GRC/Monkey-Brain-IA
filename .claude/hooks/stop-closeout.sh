#!/bin/bash
# Stop. Si el Brain tiene cambios sin commitear, comprueba su integridad (enlaces, anclajes, fences, tablas, manifest, IDs únicos).
# Bloquea (exit 2) solo si queda ROTO: Claude lo ve y lo corrige antes de terminar. Un fallo que no se arregla no se repite
# indefinidamente: stop_hook_active corta el bucle, y Claude Code lo anula tras 8 bloqueos seguidos.
INPUT=$(cat)
[ "$(printf '%s' "$INPUT" | jq -r '.stop_hook_active // false')" = "true" ] && exit 0
ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
CHANGED=$(git -C "$ROOT" status --porcelain 2>/dev/null | grep -E '\.(md|json)$|\.claude/' | head -1)
[ -z "$CHANGED" ] && exit 0
OUT=$(CLAUDE_PROJECT_DIR="$ROOT" python3 "$ROOT/skills/process/monkey-closeout/scripts/check-brain.py" --quiet 2>&1)
if [ $? -ne 0 ]; then
  echo "El cerebro quedó roto; corrígelo antes de terminar (cierra con la skill monkey-closeout):" >&2
  echo "$OUT" | head -20 >&2
  exit 2
fi
exit 0

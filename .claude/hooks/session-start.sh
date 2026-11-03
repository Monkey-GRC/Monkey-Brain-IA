#!/bin/bash
# SessionStart (startup|resume). Inyecta una vez el estado de los repos para que Claude no tenga que adivinarlo.
ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
PARENT="$(dirname "$ROOT")"
OUT="Entorno Monkey (se trabaja siempre desde el Brain; los repos hermanos se alcanzan por additionalDirectories). Estado de los repos:"
for r in Monkey-Brain-IA Backend Frontend Frontend-Platform; do
  d="$PARENT/$r"
  [ -d "$d/.git" ] || continue
  br=$(git -C "$d" branch --show-current 2>/dev/null)
  n=$(git -C "$d" status --porcelain 2>/dev/null | wc -l | tr -d ' ')
  OUT="$OUT
- $r: rama ${br:-?}, $n archivo(s) sin commitear"
done
OUT="$OUT
Las tareas de desarrollo entran por la skill monkey-dev-flow (/monkey-dev). Claude no hace commits ni PRs."
jq -n --arg c "$OUT" '{hookSpecificOutput:{hookEventName:"SessionStart",additionalContext:$c}}'

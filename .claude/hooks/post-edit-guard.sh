#!/bin/bash
# PostToolUse · Edit|Write. Dos comprobaciones sobre el archivo que acaba de escribirse:
#   1) CONFIDENCIALIDAD (bloquea, exit 2): la superficie de producto no nombra al proveedor de la sonda ni del motor de nube.
#   2) CONTRATO PRIMERO (aviso, exit 0): se editó un controller del Backend y contracts/ no tiene cambios.
INPUT=$(cat)
F=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // empty')
[ -z "$F" ] || [ ! -f "$F" ] && exit 0
ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"

# 1) Superficie de producto = lo que el CLIENTE FINAL ve o recibe (Frontend-Platform, correos, i18n del API, contratos). Quedan fuera lo interno: docs (motores/, referencias), el runner y Frontend (panel de Monkey Admin, solo personal de Monkey).
case "$F" in
  */Monkey-Brain-IA/contracts/*|*/Frontend-Platform/src/*|*/Backend/i18n/*|*/Backend/src/common/mail/*)
    if grep -Eiq 'wazuh|prowler' "$F"; then
      LINES=$(grep -Ein 'wazuh|prowler' "$F" | head -3 | cut -c1-120)
      echo "Confidencialidad: $F nombra al proveedor del motor (Wazuh/Prowler) en la superficie de producto. Di «sonda», «capacidad automática» o «evaluación automática». Líneas:" >&2
      echo "$LINES" >&2
      exit 2
    fi ;;
esac

# 2) Contrato primero
case "$F" in
  */Backend/src/features/*/presentation/*.controller.ts)
    if [ -z "$(git -C "$ROOT" status --porcelain -- contracts 2>/dev/null)" ]; then
      jq -n '{hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:"Editaste un controller del Backend y contracts/ no tiene cambios. El contrato va antes que el código: confirma que el endpoint ya está en contracts/ (o acuérdalo primero) y revisa conventions.md y los enums."}}'
    fi ;;
esac
exit 0

#!/bin/bash
# PreToolUse · Bash. Bloquea (exit 2) lo que Rod decidió que Claude no hace, incluso en comandos compuestos:
#   1) commits, pushes y PRs   2) leer o copiar archivos de credenciales.
# Refuerza permissions.deny, que no cubre todas las formas de escribir el comando.
INPUT=$(cat)
CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty')
[ -z "$CMD" ] && exit 0

if printf '%s' "$CMD" | grep -Eq '(^|[;&|(`[:space:]])git([[:space:]]+-C[[:space:]]+[^[:space:]]+)?[[:space:]]+(commit|push)([[:space:]]|$)|(^|[;&|(`[:space:]])gh[[:space:]]+pr[[:space:]]+(create|merge)'; then
  echo "Bloqueado: Claude no hace commits, pushes ni PRs en Monkey (decisión de Rod). Deja los cambios sin commitear y avisa qué hay que commitear." >&2
  exit 2
fi

# .env.example es una plantilla sin secretos: se quita antes de buscar archivos sensibles.
SAFE=$(printf '%s' "$CMD" | sed -E 's/\.env\.example//g')
SENSITIVE='(^|[/[:space:]"'"'"'=])(\.env(\.(local|development|staging|production|test))?|runner\.env|[^/[:space:]]*credentials[^/[:space:]]*\.json|conexion_api_[^/[:space:]]*|[^/[:space:]]+\.pem|id_rsa[^/[:space:]]*)([[:space:]"'"'"';|&)]|$)'
if printf '%s' "$SAFE" | grep -Eq "$SENSITIVE"; then
  echo "Bloqueado: el comando toca un archivo de credenciales (.env, runner.env, *credentials*.json, conexion_api_*, *.pem, id_rsa*). Los secretos no se leen ni se copian; usa .env.example para saber qué variables existen." >&2
  exit 2
fi
exit 0

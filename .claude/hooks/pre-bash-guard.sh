#!/bin/bash
# PreToolUse · Bash. Bloquea (exit 2) lo que Rod decidió que Claude no hace, incluso en comandos compuestos:
#   1) commits, pushes y PRs   2) leer o copiar archivos de credenciales   3) servidores en los puertos de Rod (3000, 4200, 4201)
#   4) la suite completa en local (D120: es del CI)   5) `prisma migrate dev` (la base de dev tiene drift) y `migrate deploy` de migraciones destructivas sin fusionar   6) git worktrees.
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
# 3) Los puertos 3000 (Backend), 4200 (Platform) y 4201 (Admin) son de Rod: él prueba ahí. Un servidor propio va en otro puerto.
if printf '%s' "$CMD" | grep -Eq '(--port[= ]+|PORT=)(3000|4200|4201)([^0-9]|$)'; then
  echo "Bloqueado: los puertos 3000, 4200 y 4201 son de Rod. Usa otro (p. ej. 3100 o 4300) y avísale." >&2
  exit 2
fi
if printf '%s' "$CMD" | grep -Eq '(^|[;&|(`[:space:]])(npx[[:space:]]+)?ng[[:space:]]+serve([[:space:]]|$)' && ! printf '%s' "$CMD" | grep -Eq -- '--port[= ]+[0-9]+'; then
  echo "Bloqueado: \`ng serve\` sin \`--port\` toma el 4200, que es de Rod. Usa \`--port 4300\` (u otro)." >&2
  exit 2
fi
if printf '%s' "$CMD" | grep -Eq '(^|[;&|(`[:space:]])(npm[[:space:]]+run[[:space:]]+start(:[a-z]+)?|(npx[[:space:]]+)?nest[[:space:]]+start)([[:space:]]|$)' && ! printf '%s' "$CMD" | grep -Eq 'PORT=[0-9]+'; then
  echo "Bloqueado: el Backend sin \`PORT=\` toma el 3000, que es de Rod. Lánzalo con \`PORT=3100\` (u otro)." >&2
  exit 2
fi

# 4) D120: en local se prueba solo lo tocado; la suite completa la corre el CI del PR.
if printf '%s' "$CMD" | grep -Eq '(^|[;&|(`[:space:]])npm[[:space:]]+run[[:space:]]+(-s[[:space:]]+)?test:e2e([[:space:]]*($|[;&|)]))'; then
  echo "Bloqueado: el e2e completo es del CI (D120). Pasa las suites afectadas: \`npm run test:e2e -- <rutas>\` (las da skills/process/monkey-dev-flow/scripts/affected-tests.py)." >&2
  exit 2
fi
if printf '%s' "$CMD" | grep -Eq '(^|[;&|(`[:space:]])(npx[[:space:]]+)?ng[[:space:]]+test([[:space:]]|$)|(^|[;&|(`[:space:]])npm[[:space:]]+(run[[:space:]]+)?test([[:space:]]*($|[;&|)])|[[:space:]]+--[[:space:]])' && printf '%s' "$CMD" | grep -Eq '(ng[[:space:]]+test|npm[[:space:]]+(run[[:space:]]+)?test)' && ! printf '%s' "$CMD" | grep -Eq -- '--include|--findRelatedTests|--testPathPattern|\.spec\.ts'; then
  if [ -f "$(pwd)/angular.json" ] || printf '%s' "$CMD" | grep -Eq 'ng[[:space:]]+test'; then
    echo "Bloqueado: la suite completa del frontend es del CI (D120). Usa \`ng test --watch=false --include=<specs>\` (los da affected-tests.py)." >&2
    exit 2
  fi
fi

# 5) La base remota de dev tiene drift: solo `prisma migrate deploy`.
if printf '%s' "$CMD" | grep -Eq 'prisma[[:space:]]+migrate[[:space:]]+(dev|reset)|npm[[:space:]]+run[[:space:]]+prisma:migrate([[:space:]]|$)'; then
  echo "Bloqueado: usa \`npx prisma migrate deploy\`; \`migrate dev\`/\`reset\` reescriben la base de dev, que tiene drift." >&2
  exit 2
fi

# 5b) La base de Rod es la de dev COMPARTIDA (la del backend desplegado). `migrate deploy` contra ella solo con migraciones aditivas: si una
#     migración de la rama (no fusionada en develop) borra o renombra algo, el `develop` desplegado se rompe. Esas las aplica el despliegue al
#     fusionar (MD-500, 2026-11-23). La base de prueba (`test:db`, TEST_DATABASE_URL) no pasa por aquí.
if printf '%s' "$CMD" | grep -Eq 'prisma[[:space:]]+migrate[[:space:]]+deploy|prisma:migrate:deploy' && ! printf '%s' "$CMD" | grep -Eq 'TEST_DATABASE_URL|test:db'; then
  BACKEND="${CLAUDE_PROJECT_DIR:-$(pwd)}/../Backend"
  NEW=$(git -C "$BACKEND" diff --name-only origin/develop -- prisma/migrations 2>/dev/null; git -C "$BACKEND" ls-files --others --exclude-standard -- prisma/migrations 2>/dev/null)
  DESTRUCTIVE=$(for f in $NEW; do [ -f "$BACKEND/$f" ] && grep -lEi 'DROP[[:space:]]+(COLUMN|TABLE|TYPE|INDEX|CONSTRAINT)|RENAME[[:space:]]+(COLUMN|TO)|ALTER[[:space:]]+COLUMN[^;]*(TYPE|SET[[:space:]]+NOT[[:space:]]+NULL)' "$BACKEND/$f"; done | sed "s#^$BACKEND/##")
  if [ -n "$DESTRUCTIVE" ]; then
    echo "Bloqueado: la base de Rod es la de dev compartida y estas migraciones sin fusionar borran o renombran: $DESTRUCTIVE. Rompería el develop desplegado; las aplica el despliegue al fusionar." >&2
    exit 2
  fi
fi

# 6) Rod prueba desde las carpetas normales de cada repo: nada de worktrees.
if printf '%s' "$CMD" | grep -Eq '(^|[;&|(`[:space:]])git([[:space:]]+-C[[:space:]]+[^[:space:]]+)?[[:space:]]+worktree[[:space:]]+add'; then
  echo "Bloqueado: nada de git worktrees; Rod prueba desde ~/Documentos/Monkey/<repo>. Trabaja en la carpeta normal." >&2
  exit 2
fi
exit 0

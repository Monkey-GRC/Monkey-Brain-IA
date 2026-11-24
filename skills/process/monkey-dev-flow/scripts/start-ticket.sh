#!/bin/bash
# Arranca un ticket: pone al día la rama de integración de cada repo, borra las ramas locales ya fusionadas y crea la
# rama de trabajo. Rod commitea; Claude no (CLAUDE.md). Sin worktrees: todo en ~/Documentos/Monkey/<repo>.
#
# Uso: start-ticket.sh MD-196 slug-corto brain backend [frontend] [platform]
#   brain    → Monkey-Brain-IA, desde main,    rama docs/MD-n-slug
#   backend  → Backend,         desde develop, rama feat/MD-n-slug
#   frontend → Frontend,        desde develop, rama feat/MD-n-slug
#   platform → Frontend-Platform, desde develop, rama feat/MD-n-slug
# Los repos que no se nombran solo se ponen al día. Se detiene si un repo tiene cambios sin commitear.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../../../.." && pwd)"
TICKET="${1:?falta el ticket (MD-n)}"; SLUG="${2:?falta el slug}"; shift 2
[[ "$TICKET" =~ ^MD-[0-9]+$ ]] || { echo "El ticket debe ser MD-n" >&2; exit 1; }
declare -A DIR=([brain]=Monkey-Brain-IA [backend]=Backend [frontend]=Frontend [platform]=Frontend-Platform)
declare -A BASE=([brain]=main [backend]=develop [frontend]=develop [platform]=develop)
declare -A KIND=([brain]=docs [backend]=feat [frontend]=feat [platform]=feat)
WANT=" $* "

for key in brain backend frontend platform; do
  repo="$ROOT/${DIR[$key]}"; base="${BASE[$key]}"
  if [ -n "$(git -C "$repo" status --porcelain)" ]; then
    echo "✗ ${DIR[$key]} tiene cambios sin commitear: que Rod los commitee o los guarde antes de empezar $TICKET." >&2; exit 1
  fi
  # Estado de los PR de cada rama local (gh, solo lectura): uno abierto detiene el arranque (un ticket por vez).
  for b in $(git -C "$repo" for-each-ref --format='%(refname:short)' refs/heads); do
    case "$b" in main|develop) continue ;; esac
    states="$(cd "$repo" && gh pr list --head "$b" --state all --json state --jq '.[].state' 2>/dev/null | sort -u | tr '\n' ' ')"
    if [[ " $states" == *" OPEN "* ]]; then
      echo "✗ ${DIR[$key]}: la rama $b tiene un PR abierto; que Rod lo fusione antes de empezar $TICKET." >&2; exit 1
    fi
    echo "  ${DIR[$key]}: $b → PR ${states:-sin PR}"
  done
  git -C "$repo" checkout -q "$base" && git -C "$repo" pull -q --ff-only
  for b in $(git -C "$repo" for-each-ref --format='%(refname:short)' refs/heads); do
    case "$b" in main|develop) continue ;; esac
    if git -C "$repo" merge-base --is-ancestor "$b" "origin/$base" \
       || (cd "$repo" && gh pr list --head "$b" --state merged --json headRefOid --jq '.[].headRefOid' 2>/dev/null) \
            | grep -qx "$(git -C "$repo" rev-parse "$b")"; then
      # Fusionada (o squash de un PR cuya punta es justo esta rama: no se pierde ningún commit local).
      git -C "$repo" branch -q -D "$b"
    else
      echo "  ⚠ ${DIR[$key]}: $b no está fusionada; se conserva." >&2
    fi
  done
  line="${DIR[$key]}: $base @ $(git -C "$repo" log --oneline -1 | cut -c1-60)"
  if [[ "$WANT" == *" $key "* ]]; then
    branch="${KIND[$key]}/$TICKET-$SLUG"
    git -C "$repo" checkout -q -b "$branch"
    line="$line → $branch"
  fi
  echo "$line"
done
"$(dirname "$0")/ticket-clock.sh" "$TICKET" inicio >/dev/null
echo "Reloj de $TICKET iniciado (ticket-clock.sh $TICKET <fase> para marcar cada fase)."

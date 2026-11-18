#!/bin/bash
# Mide cada fase de un ticket para la tabla de métricas del cierre (monkey-dev-flow, paso 10).
#
# Uso:
#   ticket-clock.sh MD-196 <fase>     marca el fin de la fase anterior y el inicio de <fase>
#                                     (inicio · planificacion · implementacion · verificacion · ajustes · cierre · fin)
#   ticket-clock.sh MD-196 report     imprime la tabla de duraciones y la compara con MD-193 (línea base)
# El registro vive fuera del repo: ~/.cache/monkey-tickets/MD-n.log
set -euo pipefail
TICKET="${1:?falta el ticket}"; PHASE="${2:?falta la fase o report}"
DIR="${XDG_CACHE_HOME:-$HOME/.cache}/monkey-tickets"; mkdir -p "$DIR"; LOG="$DIR/$TICKET.log"

if [ "$PHASE" != report ]; then
  echo "$(date +%s) $PHASE" >> "$LOG"; echo "$TICKET · $PHASE · $(date +%H:%M:%S)"; exit 0
fi
[ -f "$LOG" ] || { echo "Sin registro para $TICKET" >&2; exit 1; }
python3 - "$LOG" "$TICKET" <<'EOF'
import sys
rows = [l.split(maxsplit=1) for l in open(sys.argv[1]) if l.strip()]
marks = [(int(t), p.strip()) for t, p in rows]
print(f"| Fase ({sys.argv[2]}) | Duración |\n|---|---|")
total = 0
for (t0, p), (t1, _) in zip(marks, marks[1:]):
    d = t1 - t0; total += d
    print(f"| {p} | {d // 60} min {d % 60:02d} s |")
print(f"| **Total** | **{total // 60} min** |")
print("\nLínea base MD-193 (antes de D120): ~3 h 50 min de agentes, ~2 h de ellas en pruebas.")
EOF

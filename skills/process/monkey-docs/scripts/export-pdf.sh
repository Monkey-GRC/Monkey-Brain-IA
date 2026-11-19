#!/usr/bin/env bash
# Exporta a PDF las historias (04) y los casos de uso (05) de un módulo, con su diagrama UML, para entregar al comité o a un
# auditor (MD-246). El PDF es una ENTREGA: la fuente sigue siendo el cerebro (Markdown + PlantUML). No se versiona.
#
# Uso: export-pdf.sh <módulo> [carpeta-de-salida]     p. ej. export-pdf.sh autenticacion
#      export-pdf.sh --all [carpeta-de-salida]        todos los módulos que ya tienen 04 y 05
# Salida por defecto: exports/<módulo>-historias-y-casos-de-uso-<fecha>.pdf (exports/ está en .gitignore).
# Requiere Node (marked, versión fija, vía npx), Python 3 y Google Chrome (lo imprime sin interfaz). La presentación
# (portada con logo, encabezado, pie con páginas, tablas, etiquetas de estado y limpieza de flechas y rayas) la arma
# build-pdf-html.py; los logos están en ../assets/.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
ARCH="$ROOT/skills/product/monkey-compliance-council/references/arquitectura"
MARKED=marked@15.0.6
CHROME="$(command -v google-chrome || command -v chromium || true)"
[ -n "$CHROME" ] || { echo "✗ falta Google Chrome o Chromium para imprimir el PDF" >&2; exit 1; }

if [ "${1:-}" = "--all" ]; then
  mapfile -t MODS < <(for d in "$ARCH"/*/; do [ -f "$d/04-historias.md" ] && [ -f "$d/05-casos-de-uso.md" ] && basename "$d"; done)
else
  MODS=("${1:?falta el módulo (p. ej. autenticacion) o --all}")
fi
OUT="${2:-$ROOT/exports}"; mkdir -p "$OUT"
"$ROOT/skills/process/monkey-docs/scripts/render-uml.sh" >/dev/null

for m in "${MODS[@]}"; do
  dir="$ARCH/$m"
  [ -f "$dir/04-historias.md" ] && [ -f "$dir/05-casos-de-uso.md" ] || { echo "✗ $m no tiene 04-historias.md y 05-casos-de-uso.md" >&2; exit 1; }
  title="$(head -1 "$dir/README.md" | sed 's/^# //')"
  tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
  for f in 04-historias 05-casos-de-uso; do npx -y "$MARKED" --gfm -i "$dir/$f.md" -o "$tmp/$f.html"; done
  # Las historias partidas por componente (STANDARD.md §3, p. ej. onboarding/conexion-activos/) van después de las del módulo.
  for c in "$dir"/*/04-historias.md; do
    [ -f "$c" ] || continue
    npx -y "$MARKED" --gfm -i "$c" -o "$tmp/comp.html" && cat "$tmp/comp.html" >> "$tmp/04-historias.html"
  done
  python3 "$(dirname "$0")/build-pdf-html.py" "$dir" "$title" "$tmp/04-historias.html" "$tmp/05-casos-de-uso.html" "$tmp/doc.html"
  pdf="$OUT/$m-historias-y-casos-de-uso-$(date +%Y-%m-%d).pdf"
  "$CHROME" --headless=new --no-sandbox --disable-gpu --no-pdf-header-footer --allow-file-access-from-files \
    --print-to-pdf="$pdf" "file://$tmp/doc.html" >/dev/null 2>&1
  [ -s "$pdf" ] || { echo "✗ no se generó $pdf" >&2; exit 1; }
  echo "✓ ${pdf#$ROOT/}"
  rm -rf "$tmp"; trap - EXIT
done

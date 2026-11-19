#!/usr/bin/env bash
# Genera el SVG de cada diagrama UML (*.puml) del cerebro con PlantUML (MD-246). El .puml es la fuente; el .svg se commitea al lado
# para que se vea en GitHub, en el Brain y en los PDF. Usa el motor interno de PlantUML (`!pragma layout smetana`): sin Graphviz.
#
# Uso: render-uml.sh [archivo.puml ...]   (sin argumentos: todos los .puml de references/arquitectura)
#      render-uml.sh --check                (falla si algún .svg falta o es más viejo que su .puml; lo usa check-doc-drift)
# Requiere Java 17+. El jar (versión fija, sha1 verificado) se baja una sola vez a tools/plantuml/ (fuera de git).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
V=1.2026.9
SHA1=c2598e381d3ea0f2e46e56c654fc99ac113193a8
JAR="$ROOT/tools/plantuml/plantuml-$V.jar"
ARCH="$ROOT/skills/product/monkey-compliance-council/references/arquitectura"

mapfile -t FILES < <(if [ $# -gt 0 ] && [ "$1" != "--check" ]; then printf '%s\n' "$@"; else find "$ARCH" -name '*.puml' | sort; fi)

if [ "${1:-}" = "--check" ]; then
  bad=0
  for f in "${FILES[@]}"; do
    svg="${f%.puml}.svg"
    if [ ! -f "$svg" ] || [ "$f" -nt "$svg" ]; then echo "✗ falta generar ${svg#$ROOT/} (corre render-uml.sh)"; bad=1; fi
  done
  exit $bad
fi

if [ ! -f "$JAR" ]; then
  mkdir -p "$(dirname "$JAR")"
  curl -fsSL -m 180 -o "$JAR.tmp" "https://repo1.maven.org/maven2/net/sourceforge/plantuml/plantuml/$V/plantuml-$V.jar"
  [ "$(sha1sum "$JAR.tmp" | cut -c1-40)" = "$SHA1" ] || { rm -f "$JAR.tmp"; echo "✗ el jar de PlantUML no coincide con su sha1" >&2; exit 1; }
  mv "$JAR.tmp" "$JAR"
fi

for f in "${FILES[@]}"; do
  java -Djava.awt.headless=true -jar "$JAR" -tsvg -charset UTF-8 -failfast2 "$f"
  echo "✓ ${f%.puml}.svg" | sed "s|$ROOT/||"
done

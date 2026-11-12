#!/usr/bin/env bash
# Read-only. Fails (exit 1) if the shared part of styles.css or a base component differs between an app and the
# canonical copy. Also counts the forbidden anti-patterns of sync.md per app: warnings by default, failures with --strict.
#   check-design-system.sh [--strict] [--verbose] [--limit N] [--only admin|platform]
set -euo pipefail
exec python3 -I "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/ds.py" check "$@"

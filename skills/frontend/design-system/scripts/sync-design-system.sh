#!/usr/bin/env bash
# Copies the canonical design system (../src) to Frontend and Frontend-Platform, keeping each app's
# `app-specific` block of styles.css. Default is a dry-run; nothing is written without --apply.
#   sync-design-system.sh [--apply] [--force] [--diff] [--only admin|platform] [--verbose]
set -euo pipefail
exec python3 -I "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/ds.py" sync "$@"

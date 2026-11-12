#!/usr/bin/env bash
# Self-test of ds.py in a temp dir: (1) uncommitted file is blocked, (2) duplicate marker is an error, (3) lost lines are listed.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
t="$(mktemp -d)"; trap 'rm -rf "$t"' EXIT
S='/* app-specific:start */'; E='/* app-specific:end */'
mkdir -p "$t/canon" "$t/m/Frontend/src" "$t/m/Frontend-Platform/src"
printf 'a\n%s\n%s\nz\n' "$S" "$E" > "$t/canon/styles.css"
echo "canon" > "$t/canon/x.txt"
for a in Frontend Frontend-Platform; do
  printf 'a\n%s\nmine\n%s\nz\nextra\n' "$S" "$E" > "$t/m/$a/src/styles.css"
  echo old > "$t/m/$a/src/x.txt"
  git -C "$t/m/$a" init -q; git -C "$t/m/$a" add -A
  git -C "$t/m/$a" -c user.email=t@t -c user.name=t commit -qm init
done
run() { DS_CANON="$t/canon" DS_MONKEY="$t/m" python3 -I "$here/ds.py" sync "$@"; }
fail() { echo "SELFTEST FAIL: $1"; exit 1; }
# (3) lost lines in dry-run
run --only admin | grep -q -- '- extra' || fail "lost line not listed"
# (1) dirty file blocked
echo dirty >> "$t/m/Frontend/src/x.txt"
if out=$(run --apply --only admin); then fail "dirty file was not blocked"; fi
echo "$out" | grep -q 'BLOCKED' || fail "no BLOCKED message"
grep -q dirty "$t/m/Frontend/src/x.txt" || fail "blocked file was overwritten"
run --apply --force --only admin >/dev/null || fail "--force failed"
grep -q canon "$t/m/Frontend/src/x.txt" || fail "--force did not write"
# (2) duplicate marker
printf 'a\n%s\n%s\n%s\nz\n' "$S" "$E" "$E" > "$t/m/Frontend-Platform/src/styles.css"
out=$(run --only platform) && fail "duplicate marker accepted"
echo "$out" | grep -q 'expected exactly 1' || fail "no marker error"
# (4) check rules: disabled opacity, opacity on a control, hand-made danger button, native select, missing i18n key, es/en out of step
c="$t/chk"; mkdir -p "$c/canon" "$c/m"
cp "$here/../src/styles.css" "$c/canon/styles.css"
for a in Frontend Frontend-Platform; do
  mkdir -p "$c/m/$a/src/app" "$c/m/$a/public/i18n/es" "$c/m/$a/public/i18n/en"
  cp "$here/../src/styles.css" "$c/m/$a/src/styles.css"
done
cat > "$c/m/Frontend-Platform/src/app/a.html" <<'H'
<button class="text-action disabled:opacity-50">x</button>
<button class="opacity-60">y</button>
<button class="mk-btn bg-bad! hover:bg-bad/90!">{{ 'NO.SUCH_KEY' | translate }}</button>
<select class="mk-input"><option>a</option></select>
<input type="text" class="border bg-surface px-3" />
<button class="enabled:hover:underline disabled:text-ink-faint">{{ 'OK.KEY' | translate }}</button>
H
echo '{"OK":{"KEY":"a","ONLY_ES":"b"}}' > "$c/m/Frontend-Platform/public/i18n/es/a.json"
echo '{"OK":{"KEY":"a"}}' > "$c/m/Frontend-Platform/public/i18n/en/a.json"
chk() { DS_CANON="$c/canon" DS_MONKEY="$c/m" python3 -I "$here/ds.py" check --strict "$@"; }
if out=$(chk --verbose); then fail "strict check accepted the new anti-patterns"; fi
echo "$out" | grep -Eq 'disabled:opacity-\*[[:space:]]+0[[:space:]]+1' || fail "disabled:opacity-* not counted"
echo "$out" | grep -Eq 'opacity-NN on a control[[:space:]]+0[[:space:]]+2' || fail "opacity-NN not counted"
echo "$out" | grep -Eq 'danger button by hand[[:space:]]+0[[:space:]]+1' || fail "danger by hand not counted"
echo "$out" | grep -Eq 'native <select>[[:space:]]+0[[:space:]]+1' || fail "native select not counted"
echo "$out" | grep -Eq 'input without text colour[[:space:]]+0[[:space:]]+1' || fail "input without text colour not counted"
echo "$out" | grep -q 'MISSING NO.SUCH_KEY' || fail "missing i18n key not reported"
echo "$out" | grep -q 'ONLY-ES OK.ONLY_ES' || fail "es/en pair out of step not reported"
echo "$out" | grep -q 'MISSING OK.KEY' && fail "an existing key was reported"
echo "SELFTEST OK"

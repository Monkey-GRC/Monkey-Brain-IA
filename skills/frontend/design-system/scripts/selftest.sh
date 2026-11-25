#!/usr/bin/env bash
# Self-test of ds.py in a temp dir: (1) uncommitted file is blocked, (2) duplicate marker is an error, (3) lost lines are listed, (4)-(8) the rules of the check.
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
<textarea rows="3" class="mk-textarea"></textarea>
<button class="enabled:hover:underline disabled:text-ink-faint">{{ 'OK.KEY' | translate }}</button>
<app-loading-spinner />
<app-loading-spinner data-long-process />
<span class="animate-spin">a</span>
<span class="animate-spin" data-long-process>b</span>
H
mkdir -p "$c/m/Frontend-Platform/src/app/testing"
echo "export const fixture = { codes: ['CC6.1', 'FIXTURE.ONLY_KEY'] };" > "$c/m/Frontend-Platform/src/app/testing/fixtures.ts"
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
echo "$out" | grep -q 'MISSING FIXTURE.ONLY_KEY' && fail "a test fixture (testing/) was scanned for i18n keys"
# (5) D116 allowlist: a spinner marked data-long-process is not counted; an unmarked one is
echo "$out" | grep -Eq 'app-loading-spinner[[:space:]]+0[[:space:]]+1' || fail "unmarked app-loading-spinner not counted, or the marked one was"
echo "$out" | grep -Eq 'animate-spin by hand[[:space:]]+0[[:space:]]+1' || fail "unmarked animate-spin not counted, or the marked one was"
# (6) MD-483 contrast pairs: the old ink-faint (light) and white on the dark action must be seen in red (proof that it measures)
bad="$t/bad"; mkdir -p "$bad"
sed 's/--color-ink-faint: #596579;/--color-ink-faint: #667085;/; s/--color-on-action: #05080f;/--color-on-action: #ffffff;/' "$here/../src/styles.css" > "$bad/styles.css"
out=$(DS_CANON="$bad" DS_MONKEY="$c/m" python3 -I "$here/ds.py" check 2>&1) && fail "the old contrast was accepted"
echo "$out" | grep -q 'FAIL: ink-faint on canvas (light)' || fail "ink-faint on canvas not measured"
echo "$out" | grep -q 'FAIL: ink-faint on tint (light)' || fail "ink-faint on tint not measured"
echo "$out" | grep -q 'FAIL: on-action on action (dark)' || fail "on-action on action (dark) not measured"
# (7) MD-483 visual rules at 0 fail the check even without --strict: italic, weight 900, a loose hex, dark: with colour, text-[11px], a status colour as text, a CDN font
cat > "$c/m/Frontend-Platform/src/app/b.html" <<'H'
<p class="italic font-black text-[11px] text-bad dark:bg-gray-900" style="color:#ff0000">x</p>
<link href="https://fonts.googleapis.com/css2?family=X">
H
out=$(DS_CANON="$c/canon" DS_MONKEY="$c/m" python3 -I "$here/ds.py" check 2>&1) && fail "visual rules at 0 did not fail the check"
for r in 'italic' 'weight 800/900/100/200' 'loose hex' 'dark: with colour in a view' 'text-\[10\|11px\]' 'status colour as text' 'remote font or CDN'; do
  echo "$out" | grep -Eq "^  $r.*FAIL[[:space:]]+0[[:space:]]+[1-9]" || fail "rule not counted: $r"
done
rm "$c/m/Frontend-Platform/src/app/b.html"
# (8) MD-485: transition-all, ease-in-out, h-screen, z-[N], app-modal in a view and javascript:void fail without --strict; a canonical base component (the same file in the
#     canonical copy) may build on app-modal, a view may not
cat > "$c/m/Frontend-Platform/src/app/b.html" <<'H'
<div class="transition-all ease-in-out h-screen z-[60]"><app-modal [open]="x" labelledBy="t"></app-modal><a href="javascript:void(0)">x</a></div>
<h1 class="text-3xl font-semibold">t</h1><span class="material-symbols-rounded text-[18px]">info</span><span class="material-symbols-rounded text-[20px]">ok</span>
H
mkdir -p "$c/canon/app/base"
echo '<app-modal [open]="open()" labelledBy="t"><ng-content /></app-modal>' > "$c/canon/app/base/base.html"
for a in Frontend Frontend-Platform; do mkdir -p "$c/m/$a/src/app/base"; cp "$c/canon/app/base/base.html" "$c/m/$a/src/app/base/base.html"; done
out=$(DS_CANON="$c/canon" DS_MONKEY="$c/m" python3 -I "$here/ds.py" check 2>&1) && fail "the MD-485 rules did not fail the check"
for r in 'transition-all' 'ease-in-out / linear / in' 'h-screen / 100vh' 'arbitrary z-\[N\]' 'javascript:void' 'h1 text-3xl / bold' 'icon size off the scale'; do
  echo "$out" | grep -Eq "^  $r.*FAIL[[:space:]]+0[[:space:]]+[1-9]" || fail "MD-485 rule not counted as FAIL: $r"
done
echo "$out" | grep -Eq '^  app-modal in a view[[:space:]]+FAIL[[:space:]]+0[[:space:]]+1([[:space:]]|$)' || fail "app-modal: the view must count once and the canonical base component never"
rm -r "$c/m/Frontend-Platform/src/app/b.html" "$c/canon/app" "$c/m/Frontend/src/app/base" "$c/m/Frontend-Platform/src/app/base"
echo "SELFTEST OK"

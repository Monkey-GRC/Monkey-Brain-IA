#!/usr/bin/env python3
"""Engine of sync-design-system.sh and check-design-system.sh (standard library only).

Canonical copy: <brain>/skills/frontend/design-system/src/. It mirrors `src/` of each app, file by file.
`styles.css` is merged: everything is canonical except the block between `/* app-specific:start */` and `/* app-specific:end */`,
which each app keeps as it is.
"""
import argparse
import difflib
import json
import os
import re
import subprocess
import sys

START = '/* app-specific:start */'
END = '/* app-specific:end */'
CSS = 'styles.css'

HERE = os.path.dirname(os.path.abspath(__file__))
# DS_CANON and DS_MONKEY exist only so the self-test can run against a temp dir.
CANON = os.environ.get('DS_CANON') or os.path.normpath(os.path.join(HERE, '..', 'src'))
MONKEY = os.environ.get('DS_MONKEY') or os.path.normpath(os.path.join(HERE, '..', '..', '..', '..', '..'))
APPS = {'Frontend': 'admin', 'Frontend-Platform': 'platform'}

# Anti-patterns of sync.md (outside status-indicator). name -> (regex, extensions, what to do instead)
ANTI = [
    ('mk-hero', r'\bmk-hero', ('.ts', '.html', '.css'), 'page-header without background'),
    ('mk-card', r'\bmk-card\b', ('.ts', '.html', '.css'), 'section: 1 px border, no shadow'),
    ('border-l/t colour', r'\bborder-[lt]-[a-z]', ('.ts', '.html', '.css'), 'neutral thin line; status goes in status-indicator'),
    ('tag-badge', r'\btag-badge\b', ('.ts', '.html', '.css'), 'tag (neutral gray)'),
    ('rounded-full px-', r'\brounded-full px-', ('.ts', '.html'), 'plain text or status-indicator'),
    ('bg-linear-to-', r'\bbg-linear-to-', ('.ts', '.html'), 'no gradients in banners'),
    ('shadow-card', r'\bshadow-card', ('.ts', '.html', '.css'), '1 px border'),
    ('shadow-xl', r'\bshadow-xl\b', ('.ts', '.html'), '1 px border; shadow only in floating layers'),
    ('status colour name', r'\b(?:green|amber|red)-\d{2,3}\b', ('.ts', '.html'), 'tokens ok/bad/warn/neutral'),
    # Decorative hues and the old status ramps: a colour is a token (status ok/warn/bad, risk-*, data-1..5, action, tint) or neutral, never a hue name.
    ('decorative hue', r'\b(?:bg|text|border|ring|from|to|via|fill|stroke|divide|outline|marker:text)-(?:sky|violet|indigo|emerald|teal|rose|purple|pink|cyan|lime|fuchsia|blue|yellow|orange|slate|zinc|stone)-\d', ('.ts', '.html'), 'tokens (action, tint, data-*, risk-*)'),
    ('legacy status ramp', r'\b(?:bg|text|border|ring|from|to|via|divide|outline)-(?:error|success|warning)-\d', ('.ts', '.html'), 'tokens ok/bad/warn and ok-ink/bad-ink/warn-ink'),
    ('bg-gradient-to-', r'\bbg-gradient-to-', ('.ts', '.html'), 'no gradients in views'),
    # Disabled is a token state, never an opacity: `disabled:cursor-not-allowed disabled:text-ink-faint` (+ `disabled:bg-tint`), hover only with `enabled:`.
    ('disabled:opacity-*', r'\bdisabled:(?:[a-z-]+:)?opacity-\d', ('.ts', '.html'), 'disabled:cursor-not-allowed disabled:text-ink-faint (+ disabled:bg-tint)'),
    ('opacity-NN on a control', r'(?<![\w-])(?:[a-z-]+:)?opacity-(?:[1-9]\d?|100)\b', ('.ts', '.html'), 'tokens: ink-faint / tint; no opacity on buttons and inputs'),
    ('danger button by hand', r'\bbg-bad!|\bhover:bg-bad\b', ('.ts', '.html'), 'mk-btn-danger (enabled-only hover, tokenised disabled)'),
]
TEAL = re.compile(r'rgba\(\s*4\s*,\s*164\s*,\s*156')


def read(path):
    with open(path, encoding='utf-8', newline='') as fh:
        return fh.read()


def walk(root):
    for base, _dirs, files in os.walk(root):
        for name in sorted(files):
            full = os.path.join(base, name)
            yield os.path.relpath(full, root).replace(os.sep, '/')


def block_of(text):
    """The app-specific block, markers included, or None when the file has no markers."""
    i, j = text.find(START), text.find(END)
    if i < 0 or j < i:
        return None
    return text[i:j + len(END)]


def check_markers(text, who):
    """Each marker must appear exactly once, start before end."""
    for marker in (START, END):
        n = text.count(marker)
        if n != 1:
            raise ValueError('%s: marker `%s` appears %d time(s), expected exactly 1' % (who, marker, n))
    if text.find(START) > text.find(END):
        raise ValueError('%s: `%s` comes after `%s`' % (who, START, END))


def merge_css(canon_text, app_text):
    """Canonical styles.css with the block of the app. Raises ValueError if the app file has no markers."""
    if app_text is None:
        raise ValueError('has no `%s` ... `%s` markers: add them (and move the app rules inside) before syncing' % (START, END))
    check_markers(canon_text, 'canonical styles.css')
    check_markers(app_text, 'app styles.css')
    mine = block_of(app_text)
    canon_block = block_of(canon_text)
    return canon_text.replace(canon_block, mine)


def expected(rel, canon_text, app_path):
    if rel != CSS:
        return canon_text
    app_text = read(app_path) if os.path.exists(app_path) else None
    return merge_css(canon_text, app_text)


def outside_block(text):
    """Text without the app-specific block (all of it when the file has no block)."""
    b = block_of(text)
    return text.replace(b, '') if b else text


def lost_lines(have, want):
    """Non-blank lines of the app file, outside its app-specific block, that the new content does not contain."""
    keep = set(l.strip() for l in outside_block(want).splitlines())
    return [l.strip() for l in outside_block(have).splitlines() if l.strip() and l.strip() not in keep]


def dirty_files(root):
    """Paths (relative to the repo root) with uncommitted changes, from `git status --porcelain`. Not a repo -> empty."""
    try:
        out = subprocess.run(['git', '-C', root, 'status', '--porcelain', '--untracked-files=all'],
                             capture_output=True, text=True, encoding='utf-8', check=True).stdout
    except (OSError, subprocess.CalledProcessError):
        return set()
    return set(l[3:].split(' -> ')[-1].strip().strip('"') for l in out.splitlines() if len(l) > 3)


def targets(only):
    out = []
    for folder in APPS:
        if only and only not in (folder, APPS[folder]):
            continue
        root = os.path.join(MONKEY, folder)
        if not os.path.isdir(os.path.join(root, 'src')):
            sys.exit('error: %s not found (expected next to the Brain)' % root)
        out.append((folder, root))
    return out


def compare(only):
    """-> list of (folder, rel, state, new_text, old_text); state in same|differs|missing|error:<msg>."""
    rows = []
    for folder, root in targets(only):
        for rel in walk(CANON):
            canon_text = read(os.path.join(CANON, rel))
            dest = os.path.join(root, 'src', rel)
            try:
                want = expected(rel, canon_text, dest)
            except ValueError as err:
                rows.append((folder, rel, 'error: ' + str(err), None, None))
                continue
            if not os.path.exists(dest):
                rows.append((folder, rel, 'missing', want, None))
                continue
            have = read(dest)
            rows.append((folder, rel, 'same' if have == want else 'differs', want, have))
    return rows


def cmd_sync(args):
    rows = compare(args.only)
    pending = failed = 0
    blocked = []
    dirty = {}
    for folder, rel, state, want, have in rows:
        if state == 'same':
            if args.verbose:
                print('  same     %s/src/%s' % (folder, rel))
            continue
        if state.startswith('error'):
            failed += 1
            print('  ERROR    %s/src/%s  %s' % (folder, rel, state))
            continue
        pending += 1
        label = '%s/src/%s' % (folder, rel)
        print('  %-8s %s' % ('create' if state == 'missing' else 'update', label))
        if have is not None:
            lost = lost_lines(have, want)
            if lost:
                print('    WARNING: %d line(s) outside the app-specific block would disappear:' % len(lost))
                for l in lost[:10]:
                    print('      - %s' % l[:110])
                if len(lost) > 10:
                    print('      ... and %d more' % (len(lost) - 10))
        if args.diff and have is not None:
            sys.stdout.writelines(difflib.unified_diff(have.splitlines(True), want.splitlines(True), 'app', 'canonical', n=1))
        if args.apply:
            if folder not in dirty:
                dirty[folder] = dirty_files(os.path.join(MONKEY, folder))
            if 'src/' + rel in dirty[folder] and not args.force:
                blocked.append(label)
                continue
            dest = os.path.join(MONKEY, folder, 'src', rel)
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            with open(dest, 'w', encoding='utf-8', newline='') as fh:
                fh.write(want)
    if blocked:
        print('\nBLOCKED (uncommitted changes in the app repo, not written; review them or pass --force):')
        for b in blocked:
            print('  ' + b)
    mode = 'applied' if args.apply else 'dry-run (nothing written; use --apply)'
    print('%s: %d file(s) to change, %d blocked, %d error(s)' % (mode, pending, len(blocked), failed))
    return 1 if failed or blocked else 0


def scan(root):
    """-> {pattern: [(file, line_no, line)]} for the anti-patterns, in src/app (and teal in styles.css)."""
    hits = {name: [] for name, *_ in ANTI}
    hits['teal glow (off palette)'] = []
    src = os.path.join(root, 'src')
    for rel in walk(os.path.join(src, 'app')):
        if rel.endswith('.spec.ts') or 'status-indicator' in rel:
            continue
        ext = os.path.splitext(rel)[1]
        text = read(os.path.join(src, 'app', rel))
        for n, line in enumerate(text.splitlines(), 1):
            for name, rx, exts, _ in ANTI:
                if ext in exts and re.search(rx, line):
                    hits[name].append(('src/app/' + rel, n, line.strip()))
    css = os.path.join(src, CSS)
    if os.path.exists(css):
        for n, line in enumerate(read(css).splitlines(), 1):
            if TEAL.search(line):
                hits['teal glow (off palette)'].append(('src/styles.css', n, line.strip()))
    return hits


def _hex_vars(css_block):
    return {m.group(1): m.group(2) for m in re.finditer(r'--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;', css_block)}


def _resolve(value, table):
    m = re.fullmatch(r'var\(--color-([a-z0-9-]+)\)', value.strip())
    return table.get(m.group(1)) if m else (value.strip() if re.fullmatch(r'#[0-9a-fA-F]{6}', value.strip()) else None)


def _lum(hexcolor):
    r, g, b = [int(hexcolor[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    f = lambda c: c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)


def contrast(a, b):
    x, y = sorted((_lum(a), _lum(b)), reverse=True)
    return (x + 0.05) / (y + 0.05)


def contrast_report():
    """WCAG contrast of the risk scale and of the status-as-text tokens, from the canonical styles.css: -> [(label, ratio)] (all must be >= 4.5)."""
    css = read(os.path.join(CANON, CSS))
    i = css.find('\n.dark {')
    light_text, dark_text = css[:i], css[i:css.find('\n}', i)]
    light = _hex_vars(light_text)
    dark = dict(light)
    dark.update(_hex_vars(dark_text))
    refs = {}
    for text, table, key in ((light_text, light, 'light'), (dark_text, dark, 'dark')):
        for m in re.finditer(r'--color-([a-z0-9-]+):\s*(var\(--color-[a-z0-9-]+\))\s*;', text):
            v = _resolve(m.group(2), table)
            if v:
                refs[(key, m.group(1))] = v
    out = []
    for mode, table in (('light', light), ('dark', dark)):
        def get(name):
            return refs.get((mode, name)) or table.get(name)
        surface = get('surface') or get('gray-900' if mode == 'dark' else 'white')
        for level in ('low', 'moderate', 'high', 'critical'):
            base, on, bg, ink = (get('risk-' + level + s) for s in ('', '-on', '-bg', '-ink'))
            if all((base, on, bg, ink)):
                out.append(('risk-%s on its fill (%s)' % (level, mode), contrast(on, base)))
                out.append(('risk-%s ink on its soft fill (%s)' % (level, mode), contrast(ink, bg)))
        for st in ('ok', 'warn', 'bad'):
            ink = get(st + '-ink')
            if ink and surface:
                out.append(('%s-ink on surface (%s)' % (st, mode), contrast(ink, surface)))
    return out


I18N_KEY = re.compile(r"""(['"`])([A-Z][A-Z0-9_]*(?:\.[A-Z0-9_]+)+)\1""")


def _flatten(node, prefix, out):
    for k, v in node.items():
        key = k if not prefix else prefix + "." + k
        if isinstance(v, dict):
            _flatten(v, key, out)
        else:
            out.add(key)


def i18n_keys(root, lang):
    """Every key of public/i18n/<lang>/*.json (the files are merged at the root, as the loader does)."""
    out = set()
    base = os.path.join(root, 'public', 'i18n', lang)
    if os.path.isdir(base):
        for name in sorted(os.listdir(base)):
            if name.endswith('.json'):
                _flatten(json.loads(read(os.path.join(base, name))), '', out)
    return out


def i18n_used(root):
    """-> {key: [(file, line)]} for the literal keys (UPPER.DOTTED in quotes) of templates and .ts. Dynamic ones (`${}`, concatenated) never match: they are partial."""
    used = {}
    src = os.path.join(root, 'src')
    for rel in walk(os.path.join(src, 'app')):
        if rel.endswith('.spec.ts') or os.path.splitext(rel)[1] not in ('.ts', '.html'):
            continue
        for n, line in enumerate(read(os.path.join(src, 'app', rel)).splitlines(), 1):
            if line.lstrip().startswith(('*', '//', '/*')):
                continue  # documentation examples are not usages
            for m in I18N_KEY.finditer(line):
                tail = line[m.end():m.end() + 3].lstrip()
                if tail.startswith('+'):
                    continue  # 'A.B' + x: a prefix, not a whole key
                used.setdefault(m.group(2), []).append(('src/app/' + rel, n))
    return used


def i18n_report(root):
    """-> (missing {key: [(file, line)]}, only_es [keys], only_en [keys])."""
    es, en = i18n_keys(root, 'es'), i18n_keys(root, 'en')
    used = i18n_used(root)
    # A literal that is the start of an existing key (a namespace or a prefix completed at run time: `...IMPACT.L` + 1 + `.LABEL`) is not a missing leaf.
    known = sorted(es | en)
    missing = {k: v for k, v in used.items() if (k not in es or k not in en) and not any(x.startswith(k) for x in known)}
    return missing, sorted(es - en), sorted(en - es)


def cmd_check(args):
    rows = compare(args.only)
    drift = 0
    print('Shared part and base components against the canonical copy:')
    for folder, rel, state, _want, _have in rows:
        if state == 'same':
            continue
        drift += 1
        print('  %-8s %s/src/%s' % ('MISSING' if state == 'missing' else ('DRIFT' if state == 'differs' else 'ERROR'), folder, rel), '' if state in ('missing', 'differs') else state)
    if drift == 0:
        print('  OK: %d file(s) per app are identical to the canonical copy.' % len(list(walk(CANON))))

    print('\nAnti-patterns (sync.md), outside status-indicator and *.spec.ts:')
    total = 0
    folders = [f for f, _ in targets(args.only)]
    results = {f: scan(os.path.join(MONKEY, f)) for f in folders}
    names = [n for n, *_ in ANTI] + ['teal glow (off palette)']
    print('  %-26s' % 'pattern' + ''.join('%12s' % APPS[f] for f in folders))
    for name in names:
        counts = [len(results[f][name]) for f in folders]
        total += sum(counts)
        print('  %-26s' % name + ''.join('%12d' % c for c in counts))
    if args.verbose:
        for f in folders:
            for name in names:
                for file, n, line in results[f][name][:args.limit]:
                    print('    [%s] %s: %s:%d  %s' % (APPS[f], name, file, n, line[:110]))
    ratios = contrast_report()
    low = [(label, r) for label, r in ratios if r < 4.5]
    print('\nContrast of the risk scale and of the status-as-text tokens (WCAG AA, 4.5:1): ' + ('%d measured, lowest %.1f:1.' % (len(ratios), min(r for _, r in ratios)) if ratios else 'NOT MEASURED.'))
    for label, r in low:
        print('  FAIL: %s is %.2f:1' % (label, r))
    if args.verbose:
        for label, r in ratios:
            print('    %-48s %.1f:1' % (label, r))
    print('\ni18n (informative): literal keys used in templates and .ts that are missing in es or en, and es/en pairs out of step:')
    i18n_total = 0
    for f in folders:
        missing, only_es, only_en = i18n_report(os.path.join(MONKEY, f))
        n = len(missing) + len(only_es) + len(only_en)
        i18n_total += n
        print('  %-9s missing key(s): %d, only in es: %d, only in en: %d' % (APPS[f], len(missing), len(only_es), len(only_en)))
        for k, where in sorted(missing.items())[:args.limit]:
            print('    MISSING %s  (%s:%d)' % (k, where[0][0], where[0][1]))
        for k in only_es[:args.limit]:
            print('    ONLY-ES %s' % k)
        for k in only_en[:args.limit]:
            print('    ONLY-EN %s' % k)
    level = 'ERROR' if args.strict else 'WARNING'
    if i18n_total:
        print('\n%s: %d i18n key problem(s).' % (level, i18n_total))
    if total:
        print('\n%s: %d anti-pattern hit(s). The migration is incremental; --strict turns them into a failure.' % (level, total))
    else:
        print('\nOK: no anti-patterns.')
    if drift:
        print('FAIL: %d file(s) differ from the canonical copy. Edit src/ in the Brain and run sync-design-system.sh --apply.' % drift)
    return 1 if drift or low or not ratios or (args.strict and (total or i18n_total)) else 0


def main():
    ap = argparse.ArgumentParser(prog='design-system')
    sub = ap.add_subparsers(dest='cmd', required=True)
    s = sub.add_parser('sync')
    s.add_argument('--apply', action='store_true', help='write the files (default is a dry-run)')
    s.add_argument('--force', action='store_true', help='with --apply, overwrite files that have uncommitted changes in the app repo')
    s.add_argument('--diff', action='store_true', help='show the diff of every file that would change')
    s.add_argument('--only', help='Frontend | Frontend-Platform | admin | platform')
    s.add_argument('--verbose', action='store_true')
    c = sub.add_parser('check')
    c.add_argument('--strict', action='store_true', help='anti-patterns fail the check (default: warnings)')
    c.add_argument('--verbose', action='store_true', help='list the lines of each anti-pattern')
    c.add_argument('--limit', type=int, default=15, help='lines listed per pattern and app with --verbose')
    c.add_argument('--only')
    args = ap.parse_args()
    sys.exit(cmd_sync(args) if args.cmd == 'sync' else cmd_check(args))


if __name__ == '__main__':
    main()

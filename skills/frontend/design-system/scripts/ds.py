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
    # A chip written by hand (a span/li with `rounded-control`, a 1 px border, horizontal and vertical padding): code, attribute and status are `app-badge`.
    ('hand-made chip', r'<(?:span|li)\b(?=[^>]*\brounded-control\b)(?=[^>]*\bborder\b)(?=[^>]*\bpx-[\d.]+)(?=[^>]*\bpy-(?:0\.5|1)\b)(?![^>]*\bborder-white)[^>]*>', ('.ts', '.html'), 'app-badge (kind code, attribute or status)'),
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
    ('native <select>', r'<select\b', ('.ts', '.html'), 'app-select (or app-table-filter in a toolbar): the system select, with its own panel'),
    ('danger button by hand', r'\bbg-bad!|\bhover:bg-bad\b', ('.ts', '.html'), 'mk-btn-danger (enabled-only hover, tokenised disabled)'),
]
# Informative only (D116), never a failure, not even with --strict: loading is a skeleton, a button that runs a process is `appBusy`, the spinner is for long processes.
# Not counted inside shared/presentation/ (the canonical components and directives write them on purpose), nor on a line that carries the attribute `data-long-process` (the
# allowlist: a spinner of a long process such as connecting a provider or running an evaluation, marked on the same line as the spinner). name -> (regex, extensions, what to do instead)
INFO = [
    ('app-loading-spinner', r'<app-loading-spinner\b', ('.ts', '.html'), 'app-skeleton (data) or loading in app-data-table; the spinner only for long processes'),
    ('animate-spin by hand', r'\banimate-spin\b', ('.ts', '.html'), 'appBusy on the button (or app-skeleton); not a hand-made spinner'),
]
# Visual rules of the audit (MD-483). severity `fail` = the check fails (0 today, keep it at 0); `warn` = informative, becomes `fail` when its block of the audit is done.
# name -> (regex, extensions, what to do instead, severity). Scanned in src/app, src/styles.css and src/index.html, never in *.spec.ts or comment lines.
RULES = [
    ('remote font or CDN', r'fonts\.googleapis|fonts\.gstatic|cdnjs\.cloudflare', ('.ts', '.html', '.css'), 'fonts come from npm (@fontsource-variable), never a CDN', 'fail'),
    ('Outfit', r'\bOutfit\b|font-outfit', ('.ts', '.html', '.css'), 'font-sans (Geist)', 'fail'),
    ('italic', r'(?<![\w.-])italic(?![\w-])|font-style:\s*italic', ('.ts', '.html', '.css'), 'emphasis by weight, size or colour', 'fail'),
    ('weight 800/900/100/200', r'(?<![\w-])(?:[a-z-]+:)*font-(?:extrabold|black|thin|extralight)\b', ('.ts', '.html', '.css'), '400, 500 or 600', 'fail'),
    ('loose hex / rgb()', r'(?<![&\w])#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?\b|\brgba?\(', ('.ts', '.html'), 'a token (text-ink, bg-surface, text-bad-ink...)', 'fail'),
    ('dark: with colour in a view', r'\bdark:(?:[a-z-]+:)*(?:bg|text|border|ring|fill|stroke|from|to|via|divide|shadow|placeholder)-', ('.ts', '.html'), 'tokens redefined under .dark (allowlist: device-icon, MD-217)', 'fail'),
    ('text-[10|11px]', r'text-\[1[01]px\]', ('.ts', '.html'), 'text-xs (12 px)', 'fail'),
    ('gray-NNN in a view', r'(?<![\w-])(?:[a-z-]+:)*(?:bg|text|border|ring|divide|outline)-gray-\d', ('.ts', '.html'), 'tokens (line, line-control, surface, ink-*)', 'fail'),
    ('status colour as text', r'(?<![\w-])(?:[a-z-]+:)*text-(?:bad|ok|warn)(?![\w-])', ('.ts', '.html'), 'text-bad-ink / text-ok-ink / text-warn-ink', 'fail'),
    ('uppercase in a label', r'(?<![\w-])(?:[a-z-]+:)*uppercase(?![\w-])', ('.ts', '.html'), 'sentence case (code inputs that normalise what is typed are excluded)', 'fail'),
    ('font-bold (700)', r'(?<![\w-])(?:[a-z-]+:)*font-bold\b', ('.ts', '.html'), 'font-semibold (700 only in the main figure of a card)', 'warn'),
    ('arbitrary text-[Npx]', r'text-\[\d+(?:\.\d+)?(?:px|rem)\]', ('.ts', '.html'), 'the type scale (text-xs/sm/base, text-kpi); icon sizes are excluded', 'warn'),
    ('h1 text-3xl / bold', r'<h1\b[^>]*(?:text-3xl|font-bold)', ('.ts', '.html'), 'one title step: text-2xl, the one of page-header (MD-485, 6.1 A)', 'fail'),
    ('big figure without tabular-nums', r'^(?!.*tabular-nums)(?!.*<h[1-6]\b)(?!.*mk-input).*\btext-(?:3xl|4xl|kpi)\b', ('.ts', '.html'), 'tabular-nums', 'warn'),
    # MD-485 (points 4 and 5): motion, full-height, z-index, modals and fake links are done; they FAIL from now on.
    ('transition-all', r'\btransition-all\b', ('.ts', '.html'), 'transition-colors / transition-opacity / transform (app-progress-line for a bar)', 'fail'),
    ('ease-in-out / linear / in', r'(?<![\w-])(?:[a-z-]+:)*ease-(?:in-out|linear|in)\b|\[[^\]]*ease-in-out', ('.ts', '.html'), 'the single curve of the system', 'fail'),
    ('h-screen / 100vh', r'\b(?:min-)?h-screen\b|100vh', ('.ts', '.html'), 'min-h-dvh / h-dvh', 'fail'),
    ('arbitrary z-[N]', r'(?<![\w-])(?:[a-z-]+:)*-?z-\[', ('.ts', '.html'), 'the --z-* scale of the theme', 'fail'),
    ('rounded-md/lg/xl', r'\brounded-(?:sm|md|lg|xl|2xl|3xl)\b', ('.ts', '.html'), 'rounded-control / card / panel / badge', 'warn'),
    ('app-modal in a view', r'<app-modal\b', ('.html',), 'app-form-modal / side-drawer', 'fail'),
    ('javascript:void / href="#"', r'href="(?:javascript:void\(0\)|#)"', ('.ts', '.html'), 'a real link, or aria-disabled', 'fail'),
    ('icon size off the scale', r'material-symbols[^>]*\btext-\[(?!(?:16|20|24|28|32|44)px\])\d+(?:\.\d+)?px\]', ('.ts', '.html'), '16 / 20 / 24 px (28 metric, 32 empty state, 44 final screen)', 'fail'),
    ('static style=""', r'(?<![\[\w.-])style="', ('.ts', '.html'), 'classes', 'warn'),
]
# Files where a rule is allowed on purpose (documented exceptions).
RULE_ALLOW = {'dark: with colour in a view': ('device-icon.ts',), 'uppercase in a label': ('password-rules.ts',)}
# Rules that a canonical base component (a file that also exists in the canonical copy, e.g. notice-dialog, second-factor-dialog) may break on purpose: they are the
# building blocks a view uses instead (`app-form-modal`, `app-side-drawer` and these dialogs are built on `app-modal`). Platform- or Admin-only components still count.
RULE_CANON_OK = {'app-modal in a view'}
# A text input that normalises what is typed may keep `uppercase`.
RULE_LINE_SKIP = {'uppercase in a label': re.compile(r'<input|mk-input|<code\b')}
ICON_LINE = re.compile(r'material-symbols')
PROVIDER = re.compile(r'wazuh|prowler', re.I)

# A text field written by hand (not `mk-input`) must set its own text colour, or the browser's black shows on the dark surface.
INPUT_TAG = re.compile(r'<(?:input|textarea)\b[^>]*>', re.S)
INPUT_OK = re.compile(r'\bmk-input\b|\bmk-checkbox\b|\btext-(?:ink|ink-muted|white|action|bad|ok|warn)\b|type="(?:checkbox|radio|file|hidden|range|color)"')
INPUT_RULE = 'input without text colour'
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
    hits[INPUT_RULE] = []
    src = os.path.join(root, 'src')
    for rel in walk(os.path.join(src, 'app')):
        if rel.endswith('.spec.ts') or 'status-indicator' in rel:
            continue
        ext = os.path.splitext(rel)[1]
        text = read(os.path.join(src, 'app', rel))
        if ext in ('.ts', '.html'):
            for m in INPUT_TAG.finditer(text):
                if not INPUT_OK.search(m.group(0)):
                    hits[INPUT_RULE].append(('src/app/' + rel, text.count('\n', 0, m.start()) + 1, ' '.join(m.group(0).split())[:140]))
        for n, line in enumerate(text.splitlines(), 1):
            for name, rx, exts, _ in ANTI:
                if ext in exts and re.search(rx, line) and 'data-long-process' not in line:
                    hits[name].append(('src/app/' + rel, n, line.strip()))
    css = os.path.join(src, CSS)
    if os.path.exists(css):
        for n, line in enumerate(read(css).splitlines(), 1):
            if TEAL.search(line):
                hits['teal glow (off palette)'].append(('src/styles.css', n, line.strip()))
    return hits


def scan_info(root):
    """-> {name: [(file, line_no, line)]} for INFO, in src/app outside shared/presentation/ and *.spec.ts."""
    hits = {name: [] for name, *_ in INFO}
    app = os.path.join(root, 'src', 'app')
    for rel in walk(app):
        if rel.endswith('.spec.ts') or rel.startswith('shared/presentation/'):
            continue
        ext = os.path.splitext(rel)[1]
        if ext not in ('.ts', '.html'):
            continue
        for n, line in enumerate(read(os.path.join(app, rel)).splitlines(), 1):
            for name, rx, exts, _ in INFO:
                if ext in exts and re.search(rx, line) and 'data-long-process' not in line:
                    hits[name].append(('src/app/' + rel, n, line.strip()))
    return hits


def _rule_files(root):
    """-> [(relative path for display, text)]: src/app (without specs), src/styles.css and src/index.html."""
    src = os.path.join(root, 'src')
    out = []
    for rel in walk(os.path.join(src, 'app')):
        if not rel.endswith('.spec.ts') and os.path.splitext(rel)[1] in ('.ts', '.html'):
            out.append(('src/app/' + rel, read(os.path.join(src, 'app', rel))))
    for rel in (CSS, 'index.html'):
        path = os.path.join(src, rel)
        if os.path.exists(path):
            out.append(('src/' + rel, read(path)))
    return out


def _is_canonical(rel):
    """`rel` is 'src/app/...': True when the same file lives in the canonical copy (a synced base component)."""
    return rel.startswith('src/') and os.path.isfile(os.path.join(CANON, rel[len('src/'):]))


def scan_rules(root):
    """-> {rule name: [(file, line_no, line)]} for RULES (+ `font-mono` without `--font-mono`)."""
    hits = {name: [] for name, *_ in RULES}
    hits['font-mono without --font-mono'] = []
    files = _rule_files(root)
    css_text = next((tx for rel, tx in files if rel == 'src/' + CSS), '')
    mono_defined = '--font-mono' in css_text
    for rel, text in files:
        ext = os.path.splitext(rel)[1]
        base = os.path.basename(rel)
        for n, line in enumerate(text.splitlines(), 1):
            stripped = line.lstrip()
            if stripped.startswith(('*', '//', '/*', '<!--')):
                continue
            if not mono_defined and ext in ('.ts', '.html') and re.search(r'(?<![\w-])font-mono\b', line):
                hits['font-mono without --font-mono'].append((rel, n, line.strip()))
            for name, rx, exts, _hint, _sev in RULES:
                if ext not in exts or base in RULE_ALLOW.get(name, ()):
                    continue
                if name in RULE_LINE_SKIP and RULE_LINE_SKIP[name].search(line):
                    continue
                if name == 'arbitrary text-[Npx]' and ICON_LINE.search(line):
                    continue
                if name in RULE_CANON_OK and _is_canonical(rel):
                    continue
                if re.search(rx, line):
                    hits[name].append((rel, n, line.strip()))
    return hits


def scan_provider(root):
    """The probe/cloud-engine vendor in what the end client sees (Platform: src/app and public/i18n). -> [(file, line_no, line)]."""
    out = []
    for rel, text in _rule_files(root):
        if rel.startswith('src/app/'):
            for n, line in enumerate(text.splitlines(), 1):
                if PROVIDER.search(line):
                    out.append((rel, n, line.strip()))
    base = os.path.join(root, 'public', 'i18n')
    if os.path.isdir(base):
        for rel in walk(base):
            for n, line in enumerate(read(os.path.join(base, rel)).splitlines(), 1):
                if PROVIDER.search(line):
                    out.append(('public/i18n/' + rel, n, line.strip()))
    return out


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


def _mix(a, b, pct):
    ca, cb = [int(a[i:i + 2], 16) for i in (1, 3, 5)], [int(b[i:i + 2], 16) for i in (1, 3, 5)]
    return '#%02x%02x%02x' % tuple(round(x * pct / 100 + y * (100 - pct) / 100) for x, y in zip(ca, cb))


def _badge_pairs(css, mode):
    """Evaluates the `--color-*` tokens of the canonical styles.css (hex, var() and color-mix(in srgb, A p%, B)) for the badge tokens: -> [(label, ratio)]."""
    i = css.find('\n.dark {')
    light_text, dark_text = css[:i], css[i:css.find('\n}', i)]
    decl = {}
    for text in ((light_text,) if mode == 'light' else (light_text, dark_text)):
        for m in re.finditer(r'--color-([a-z0-9-]+):\s*([^;]+);', text):
            decl[m.group(1)] = m.group(2).strip()

    def ev(v, depth=0):
        v = v.strip()
        if re.fullmatch(r'#[0-9a-fA-F]{6}', v):
            return v
        m = re.fullmatch(r'var\(--color-([a-z0-9-]+)\)', v)
        if m:
            return ev(decl[m.group(1)], depth + 1) if m.group(1) in decl and depth < 12 else None
        m = re.fullmatch(r'color-mix\(in srgb,\s*(.+?)\s+(\d+)%,\s*(.+)\)', v)
        if m:
            a, b = ev(m.group(1), depth + 1), ev(m.group(3), depth + 1)
            return _mix(a, b, int(m.group(2))) if a and b else None
        return None

    out = []
    for name in sorted(decl):
        m = re.fullmatch(r'badge-(.+)-bg', name)
        if m:
            x = m.group(1)
            bg, ink = ev(decl[name]), ev(decl.get('badge-%s-ink' % x, ''))
            if bg and ink:
                out.append(('badge-%s ink on its tint (%s)' % (x, mode), contrast(ink, bg)))
    return out


def _decls(css, mode):
    """`--color-*` declarations of the canonical styles.css for `light` or `dark` (the `.dark` block overrides the light one) and an evaluator of hex, var() and color-mix(in srgb, A p%, B)."""
    i = css.find('\n.dark {')
    light_text, dark_text = css[:i], css[i:css.find('\n}', i)]
    decl = {}
    for text in ((light_text,) if mode == 'light' else (light_text, dark_text)):
        for m in re.finditer(r'--color-([a-z0-9-]+):\s*([^;]+);', text):
            decl[m.group(1)] = m.group(2).strip()

    def ev(v, depth=0):
        v = v.strip()
        if re.fullmatch(r'#[0-9a-fA-F]{6}', v):
            return v
        m = re.fullmatch(r'var\(--color-([a-z0-9-]+)\)', v)
        if m:
            return ev(decl[m.group(1)], depth + 1) if m.group(1) in decl and depth < 12 else None
        m = re.fullmatch(r'color-mix\(in srgb,\s*(.+?)\s+(\d+)%,\s*(.+)\)', v)
        if m:
            a, b = ev(m.group(1), depth + 1), ev(m.group(3), depth + 1)
            return _mix(a, b, int(m.group(2))) if a and b else None
        return None

    return decl, lambda name: ev(decl[name]) if name in decl else None


def pair_report(css=None):
    """MD-483 pairs, from the canonical styles.css, light and dark: -> [(label, ratio, minimum, severity)], severity `fail` | `warn`.
    Text 4.5:1; non-text (control border, status fills) 3:1; `ink` on a state card 12:1. `warn` is informative (ink-faint on tint-strong in dark: only for surface, canvas and tint; the light status fills ok/warn/neutral are dots that always travel with their word)."""
    css = css if css is not None else read(os.path.join(CANON, CSS))
    out = []
    for mode in ('light', 'dark'):
        _decl, get = _decls(css, mode)

        def add(label, fg, bg, minimum, severity='fail'):
            a, b = (fg if fg.startswith('#') else get(fg)), (bg if bg.startswith('#') else get(bg))
            if a and b:
                out.append(('%s on %s (%s)' % (fg, bg, mode), contrast(a, b), minimum, severity))
        for fg in ('ink', 'ink-muted', 'ink-faint', 'action', 'tint-ink'):
            for bg in ('surface', 'canvas', 'tint'):
                if fg == 'tint-ink' and bg != 'tint':
                    continue
                add(label=None, fg=fg, bg=bg, minimum=4.5)
        add(None, 'ink', 'tint-strong', 4.5)
        add(None, 'ink-muted', 'tint-strong', 4.5)
        add(None, 'tint-ink', 'tint-strong', 4.5)
        add(None, 'ink-faint', 'tint-strong', 4.5, 'fail' if mode == 'light' else 'warn')
        add(None, 'on-action', 'action', 4.5)
        add(None, 'on-action', 'action-hover', 4.5)
        add(None, '#ffffff', 'bad', 4.5)
        add(None, '#ffffff', 'brand-panel', 4.5)
        for n in range(1, 6):
            for bg in ('surface', 'tint'):
                add(None, 'data-%d' % n, bg, 4.5)
        for st in ('ok', 'bad', 'warn', 'neutral'):
            add(None, st, 'surface', 3.0)  # MD-485 (6.14): warn and neutral pass 3:1 in light too; it fails now
        for bg in ('surface', 'canvas', 'tint'):
            add(None, 'line-control', bg, 3.0)
        # Icon of a metric card on its circle (D127): a graphic object, not text -> 3:1 (WCAG 1.4.11).
        for name in sorted(_decl):
            m = re.fullmatch(r'metric-(.+)-bg', name)
            if m and get('badge-%s-ink' % m.group(1)):
                add(None, 'badge-%s-ink' % m.group(1), name, 3.0)
        # Toast (MD-485): the icon (a graphic, 3:1) and the title and message (text, 4.5:1) on the strongest point of the wash, its left edge.
        for wash, icon in (('ok', 'ok-ink'), ('warn', 'warn-ink'), ('bad', 'bad-ink'), ('info', 'action')):
            if get('toast-%s-wash' % wash):
                add(None, icon, 'toast-%s-wash' % wash, 3.0)
                add(None, 'ink', 'toast-%s-wash' % wash, 4.5)
                add(None, 'ink-muted', 'toast-%s-wash' % wash, 4.5)
        surface = get('surface')
        for st, pct in (('ok', 8), ('warn', 10), ('bad', 8), ('neutral', 10)):
            base = get(st)
            if base and surface:
                out.append(('ink on mk-surface-state-%s (%s)' % (st, mode), contrast(get('ink'), _mix(base, surface, pct)), 12.0, 'fail'))
    return out


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
    for mode in ('light', 'dark'):
        out.extend(_badge_pairs(css, mode))
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
    names = [n for n, *_ in ANTI] + [INPUT_RULE, 'teal glow (off palette)']
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
    infos = {f: scan_info(os.path.join(MONKEY, f)) for f in folders}
    print('\nInformative (D116, never fails): loading outside the shared components:')
    print('  %-26s' % 'pattern' + ''.join('%12s' % APPS[f] for f in folders))
    for name, _rx, _exts, hint in INFO:
        print('  %-26s' % name + ''.join('%12d' % len(infos[f][name]) for f in folders) + '   -> ' + hint)
        if args.verbose:
            for f in folders:
                for file, n, line in infos[f][name][:args.limit]:
                    print('    [%s] %s: %s:%d  %s' % (APPS[f], name, file, n, line[:110]))
    rules = {f: scan_rules(os.path.join(MONKEY, f)) for f in folders}
    rule_names = [n for n, *_ in RULES] + ['font-mono without --font-mono']
    sev = {n: s for n, _r, _e, _h, s in RULES}
    sev['font-mono without --font-mono'] = 'fail'
    hints = {n: h for n, _r, _e, h, _s in RULES}
    hints['font-mono without --font-mono'] = 'define --font-mono in styles.css'
    provider = {f: scan_provider(os.path.join(MONKEY, f)) for f in folders if APPS[f] == 'platform'}
    rule_fail = 0
    print('\nVisual rules (MD-483): FAIL rules must stay at 0; WARN rules are informative until their block of the audit is done:')
    print('  %-34s %-5s' % ('rule', 'level') + ''.join('%12s' % APPS[f] for f in folders))
    for name in rule_names:
        counts = [len(rules[f][name]) for f in folders]
        if sev[name] == 'fail':
            rule_fail += sum(counts)
        print('  %-34s %-5s' % (name, sev[name].upper()) + ''.join('%12d' % c for c in counts) + ('   -> ' + hints[name] if sum(counts) else ''))
    for f, hits in provider.items():
        rule_fail += len(hits)
        print('  %-34s %-5s' % ('probe/cloud vendor name', 'FAIL') + ''.join('%12d' % (len(hits) if g == f else 0) for g in folders))
    if args.verbose:
        for f in folders:
            for name in rule_names:
                for file, n, line in rules[f][name][:args.limit]:
                    print('    [%s] %s: %s:%d  %s' % (APPS[f], name, file, n, line[:110]))
            for file, n, line in provider.get(f, [])[:args.limit]:
                print('    [%s] vendor name: %s:%d  %s' % (APPS[f], file, n, line[:110]))
    pairs = pair_report()
    pair_low = [(l, r, m) for l, r, m, s in pairs if r < m and s == 'fail']
    pair_warn = [(l, r, m) for l, r, m, s in pairs if r < m and s == 'warn']
    print('\nContrast pairs of the MD-483 tokens (text 4.5:1, control border and status fills 3:1, ink on a state card 12:1): ' + ('%d measured, %d fail, %d warn.' % (len(pairs), len(pair_low), len(pair_warn)) if pairs else 'NOT MEASURED.'))
    for label, r, m in pair_low:
        print('  FAIL: %s is %.2f:1 (needs %.1f:1)' % (label, r, m))
    for label, r, m in pair_warn:
        print('  WARN: %s is %.2f:1 (needs %.1f:1; informative: do not use that pair for text)' % (label, r, m))
    if args.verbose:
        for label, r, m, s in pairs:
            print('    %-44s %5.2f:1  (min %.1f)%s' % (label, r, m, '' if r >= m else '  <--'))
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
    if rule_fail:
        print('FAIL: %d hit(s) of a visual rule that must stay at 0 (see the table above).' % rule_fail)
    return 1 if drift or low or not ratios or not pairs or pair_low or rule_fail or (args.strict and (total or i18n_total)) else 0


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

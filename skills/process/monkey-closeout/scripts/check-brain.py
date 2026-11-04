#!/usr/bin/env python3
"""Verifica la integridad del cerebro (Monkey-Brain-IA). Salida 0 = íntegro, 1 = hay fallos.

Comprueba: enlaces relativos y anclajes de los .md, bloques ``` balanceados, tablas partidas por una línea en blanco,
manifest.json (JSON válido y rutas internas existentes) e identificadores D/P/DT/SEG sin duplicar entre fichas.
Tamaño >25 KB solo avisa (STANDARD.md §3 declara sus excepciones).

Uso: check-brain.py [--root RUTA] [--quiet]
"""
import argparse, json, os, re, sys, collections

SKIP_DIRS = {'.git', 'node_modules'}
SIZE_LIMIT = 25 * 1024
SIZE_EXCEPTIONS = ('schema-implementacion.md', 'datos/decisiones/README.md')


def slug(h):
    s = re.sub(r'^#+\s*', '', h.strip()).lower()
    return ''.join(c for c in s if c.isalnum() or c in ' -_').replace(' ', '-')


def md_files(root):
    for dp, dn, fn in os.walk(root):
        dn[:] = [d for d in dn if d not in SKIP_DIRS]
        for f in fn:
            if f.endswith('.md'):
                yield os.path.join(dp, f)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--root', default=os.environ.get('CLAUDE_PROJECT_DIR') or os.getcwd())
    ap.add_argument('--quiet', action='store_true')
    a = ap.parse_args()
    root = os.path.abspath(a.root)
    errors, warns = [], []
    rel = lambda p: os.path.relpath(p, root)
    files = list(md_files(root))
    anchors = {}

    for p in files:
        anchors[p] = {slug(l) for l in open(p, encoding='utf-8').read().split('\n') if re.match(r'^#{1,6} ', l)}

    link = re.compile(r'\]\(([^)#\s]+)(#[^)]*)?\)')
    for p in files:
        t = open(p, encoding='utf-8').read()
        if t.count('```') % 2:
            errors.append(f'{rel(p)}: bloque ``` sin cerrar')
        lines = t.split('\n')
        for i in range(1, len(lines) - 1):
            if lines[i].strip() == '' and lines[i - 1].startswith('|') and lines[i + 1].startswith('|'):
                # Dos tablas seguidas son válidas: la segunda empieza con su encabezado y su fila separadora.
                if i + 2 < len(lines) and re.match(r'^\|[\s:|-]+\|\s*$', lines[i + 2]) and '---' in lines[i + 2]:
                    continue
                errors.append(f'{rel(p)}:{i + 1}: tabla partida por una línea en blanco')
        for m in link.finditer(t):
            u, anc = m.group(1), (m.group(2) or '')[1:]
            if re.match(r'^[a-z]+:', u) or u.startswith('/'):
                continue
            target = os.path.normpath(os.path.join(os.path.dirname(p), u))
            if not os.path.exists(target):
                errors.append(f'{rel(p)}: enlace roto -> {u}')
            elif anc and target.endswith('.md') and target in anchors and anc not in anchors[target]:
                errors.append(f'{rel(p)}: anclaje roto -> {u}#{anc}')
        r = rel(p)
        if r.startswith('contracts' + os.sep):
            fence = False
            # Formato de enums: una tabla por enum, nunca una línea corrida («`low` Baja · `high` Alta»).
            if r.startswith('contracts' + os.sep + 'enums' + os.sep):
                for i, l in enumerate(lines):
                    if l.startswith('```'):
                        fence = not fence
                    if not fence and re.match(r'^`[a-z0-9_]+`\s+[^|`]+\s·\s`[a-z0-9_]+`', l):
                        errors.append(f'{r}:{i + 1}: enum en línea corrida; usa una tabla (contracts/README.md, «Formato de un enum»)')
            # Formato de contratos: cada ficha de endpoint trae su fila «Quién» (contracts/README.md, «Formato de un contrato»).
            elif os.path.basename(p) not in ('README.md', 'conventions.md', 'enums.md'):
                for i, l in enumerate(lines):
                    if l.startswith('```'):
                        fence = not fence
                    if not fence and re.match(r'^#{2,4} (GET|POST|PUT|PATCH|DELETE) /', l) and not any('**Quién**' in x for x in lines[i + 1:i + 8]):
                        warns.append(f'{r}:{i + 1}: ficha de endpoint sin fila «Quién» ({l[:60]})')
        size = len(t.encode('utf-8'))
        if size > SIZE_LIMIT and not any(rel(p).endswith(x) for x in SIZE_EXCEPTIONS):
            warns.append(f'{rel(p)}: {size // 1024} KB (>25 KB, STANDARD.md §3)')

    mp = os.path.join(root, 'manifest.json')
    if os.path.exists(mp):
        try:
            m = json.load(open(mp, encoding='utf-8'))
            paths = []
            def walk(o):
                if isinstance(o, dict):
                    for k, v in o.items():
                        if k == 'path' and isinstance(v, str): paths.append(v)
                        elif k == 'consumedBy' and isinstance(v, list): paths.extend(v)
                        else: walk(v)
                elif isinstance(o, list):
                    [walk(x) for x in o]
            walk(m)
            for pth in paths:
                if pth.startswith('..'):
                    continue  # fuentes externas al repo (documentadas en modelo-datos §0)
                if not os.path.exists(os.path.join(root, pth)):
                    errors.append(f'manifest.json: ruta inexistente -> {pth}')
        except json.JSONDecodeError as e:
            errors.append(f'manifest.json: JSON inválido ({e})')

    ref = os.path.join(root, 'skills/product/monkey-compliance-council/references')
    defs = {'D': r'^## D(\d+)[ (]', 'P': r'^## P(\d+) ', 'DT': r'^### DT-(\d+) ', 'SEG': r'^\| \*\*SEG-(\d+)\*\*'}
    folders = {'D': 'datos/decisiones', 'P': 'datos/pendientes', 'DT': 'deuda-tecnica', 'SEG': 'seguridad'}
    for kind, pat in defs.items():
        seen = collections.defaultdict(list)
        for p in files:
            if not rel(p).startswith(os.path.relpath(os.path.join(ref, folders[kind]), root) + os.sep):
                continue
            for l in open(p, encoding='utf-8').read().split('\n'):
                m = re.match(pat, l)
                if m:
                    seen[int(m.group(1))].append(rel(p))
        for n, where in seen.items():
            if len(where) > 1:
                errors.append(f'{kind}-{n} definido {len(where)} veces: {", ".join(where)}')

    if not a.quiet:
        for w in warns:
            print('AVISO  ' + w)
    for e in errors:
        print('FALLO  ' + e)
    if errors:
        print(f'\n{len(errors)} fallo(s) en {len(files)} archivos .md', file=sys.stderr)
        return 1
    if not a.quiet:
        print(f'OK: {len(files)} archivos .md, enlaces y anclajes, fences, tablas, manifest e IDs únicos')
    return 0


sys.exit(main())

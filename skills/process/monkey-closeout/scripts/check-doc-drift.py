#!/usr/bin/env python3
"""Deriva de la documentación del cerebro frente al código y a sus propias reglas (lo que check-brain.py no ve).

Comprueba:
  1. Rutas de código citadas entre comillas invertidas (`src/...`, `test/...`, `prisma/...`, `scripts/...`, `Backend/...`,
     `Frontend/...`, `Frontend-Platform/...`, `skills/...`, `contracts/...`) que ya no existen en el cerebro ni en los repos
     hermanos, y `archivo:línea` que apunta más allá del final del archivo.
  2. IDs citados (`D12`, `P-3`, `DT-40`, `SEG-84`) que no están definidos en su registro (inventados o ya cerrados y borrados).
  3. La numeración fija de los archivos de un módulo (arquitectura/README.md): 01-c4 · 02-modelo · 03-flujos ·
     04-historias · 05-casos-de-uso · 06-mejoras · 07-estudio. Ningún otro `NN-` en una carpeta de módulo.
  4. El índice: cada módulo y componente de arquitectura/ aparece en arquitectura/README.md, y cada archivo numerado de un
     módulo está enlazado desde su README.

Uso: check-doc-drift.py [--root RAÍZ] [--strict]
  Sin --strict, las rutas de código rotas y los IDs desconocidos son AVISO (puede haber texto histórico a propósito).
  Con --strict, todo es FALLO. Las reglas 3 y 4 siempre son FALLO.
Lo invoca el subagente `docs-guardian` y `monkey-closeout` (paso 3). MD-217.
"""
import argparse
import os
import re
import sys

MODULE_FILES = {'01-c4.md', '02-modelo.md', '03-flujos.md', '04-historias.md', '05-casos-de-uso.md', '06-mejoras.md', '07-estudio.md'}
SIBLINGS = ('Backend', 'Frontend', 'Frontend-Platform', 'monkey-cis-sync')
CODE_PREFIXES = ('src/', 'test/', 'prisma/', 'scripts/', 'deploy/', 'public/i18n/', 'i18n/', '.github/')
# Rutas que el texto cita a propósito aunque ya no existan (histórico, otro proyecto, ejemplos): se ignoran.
IGNORE_SUBSTR = ('<', '*', '{', '…', '...', 'ejemplo', 'example', 'MD-n', 'NN-')
# P con 1–3 cifras: P2002 o P3009 son códigos de error de Prisma, no pendientes.
ID_RE = re.compile(r'(?<![\w/#-])(DT-\d+|SEG-\d+|P-?\d{1,3}|D\d+)(?![\w-])')
TICK_RE = re.compile(r'`([^`\n]+)`')


def md_files(root):
    for d, dirs, fs in os.walk(root):
        dirs[:] = [x for x in dirs if not x.startswith('.') and x not in ('node_modules', 'design-system')]
        for f in fs:
            if f.endswith('.md'):
                yield os.path.join(d, f)


def defined_ids(ref):
    # Además de su ficha, las decisiones antiguas viven en la tabla de histórico («| D2 |») y los pendientes resueltos en la de
    # resueltos («| **P3** |»): citarlos es válido (historia), no un ID inventado.
    pats = {'D': (r'^(?:## D(\d+)[ (·]|\| \**D(\d+)\**\s*\|)', 'datos/decisiones'), 'P': (r'^(?:## P-?(\d+)\b|\| \**P-?(\d+)\**\s*\|)', 'datos/pendientes'),
            'DT': (r'^### DT-(\d+) ', 'deuda-tecnica'), 'SEG': (r'^\| \*\*SEG-(\d+)\*\*', 'seguridad')}
    out = {k: set() for k in pats}
    for kind, (pat, folder) in pats.items():
        base = os.path.join(ref, folder)
        for p in md_files(base):
            for l in open(p, encoding='utf-8'):
                m = re.match(pat, l)
                if m:
                    out[kind].add(int(next(g for g in m.groups() if g)))
    return out


def resolve(path, src_file, brain, monkey):
    """Devuelve la ruta existente o None. Prueba: relativa al archivo, al cerebro, a cada repo hermano y a Monkey/."""
    cands = [os.path.join(os.path.dirname(src_file), path), os.path.join(brain, path), os.path.join(monkey, path)]
    cands += [os.path.join(monkey, s, path) for s in SIBLINGS]
    for c in cands:
        if os.path.exists(c):
            return c
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--root', default=os.environ.get('CLAUDE_PROJECT_DIR') or os.getcwd())
    ap.add_argument('--strict', action='store_true')
    a = ap.parse_args()
    brain = os.path.abspath(a.root)
    monkey = os.path.dirname(brain)
    ref = os.path.join(brain, 'skills/product/monkey-compliance-council/references')
    arch = os.path.join(ref, 'arquitectura')
    rel = lambda p: os.path.relpath(p, brain)
    errors, warns = [], []
    soft = errors if a.strict else warns

    # 1 y 2 · rutas de código e IDs citados.
    ids = defined_ids(ref)
    line_count = {}
    for p in md_files(brain):
        r = rel(p)
        if r.startswith(('skills/frontend/design-system/src', 'assets')):
            continue
        historical = '/decisiones/' in r  # las decisiones citan código de su época a propósito
        for n, l in enumerate(open(p, encoding='utf-8'), 1):
            for m in TICK_RE.finditer(l):
                tok = m.group(1).strip()
                path, _, line = tok.partition(':')
                if ' ' in path or any(s in tok for s in IGNORE_SUBSTR):
                    continue
                looks_code = path.startswith(CODE_PREFIXES + SIBLINGS) or path.startswith(('skills/', 'contracts/', 'context/', '.claude/'))
                if not looks_code or not re.search(r'\.[a-z]{1,5}$|/$', path):
                    continue
                hit = resolve(path, p, brain, monkey)
                if not hit:
                    if not historical:
                        soft.append(f'{r}:{n}: ruta que ya no existe -> {path}')
                    continue
                if line.isdigit() and os.path.isfile(hit):
                    total = line_count.setdefault(hit, sum(1 for _ in open(hit, encoding='utf-8', errors='ignore')))
                    if int(line) > total:
                        soft.append(f'{r}:{n}: {path}:{line} pasa del final del archivo ({total} líneas)')
            if r.startswith('skills/product/monkey-compliance-council/references/datos/decisiones'):
                continue
            for m in ID_RE.finditer(l):
                tok = m.group(1)
                kind, num = (tok.split('-')[0], tok.split('-')[1]) if '-' in tok else (tok[0], tok[1:])
                kind = 'P' if kind == 'P' else kind
                # Una cita histórica a propósito («la antigua DT-94», «antes figuraba como DT-97», «DT-31 cerrada») no es deriva.
                if re.search(r'(antigu[ao]s?|antes (era|figuraba)|cerrad[ao]s?|retirad[ao]s?)\W{0,3}[^.]{0,40}' + re.escape(tok) + r'|' + re.escape(tok) + r'\W{0,3}(cerrad[ao]|retirad[ao])', l):
                    continue
                if kind in ids and ids[kind] and int(num) not in ids[kind]:
                    # D-n y P-n se borran al cerrarse solo en su índice de pendientes; un D inexistente sí es un error de cita.
                    if kind in ('DT', 'P'):
                        soft.append(f'{r}:{n}: {tok} ya no existe en su registro (¿cerrado y borrado?): quita o actualiza la cita')
                    else:
                        soft.append(f'{r}:{n}: {tok} no está definido en su registro')

    # 3 · numeración fija en cada carpeta de módulo o componente.
    modules = []
    for d, dirs, fs in os.walk(arch):
        dirs[:] = [x for x in dirs if not x.startswith('.')]
        if d == arch:
            for f in fs:
                if re.match(r'^\d\d-', f):
                    errors.append(f'{rel(os.path.join(d, f))}: un archivo numerado en la raíz de arquitectura/ se confunde con los de los módulos; usa un nombre sin número (c4-*.md)')
            continue
        if 'README.md' in fs:
            modules.append(d)
        for f in fs:
            # El diagrama UML de un archivo numerado va a su lado con el mismo nombre (05-casos-de-uso.puml y su .svg, MD-246).
            stem = re.sub(r'\.(puml|svg)$', '.md', f)
            if f.endswith('.puml') and not os.path.exists(os.path.join(d, f[:-5] + '.svg')):
                errors.append(f'{rel(os.path.join(d, f))}: falta su .svg; genéralo con skills/process/monkey-docs/scripts/render-uml.sh')
            if re.match(r'^\d\d-', f) and stem not in MODULE_FILES:
                errors.append(f'{rel(os.path.join(d, f))}: número fuera de la convención (solo {", ".join(sorted(MODULE_FILES))}); si es otra cosa, va en un componente o sin número')

    # 4 · índice de arquitectura y README de cada módulo.
    index = open(os.path.join(arch, 'README.md'), encoding='utf-8').read()
    for d in modules:
        sub = os.path.relpath(d, arch).replace(os.sep, '/')
        if f'({sub}/README.md)' not in index:
            errors.append(f'arquitectura/README.md: falta {sub}/ en el índice numerado')
        readme = open(os.path.join(d, 'README.md'), encoding='utf-8').read()
        for f in sorted(os.listdir(d)):
            if f in MODULE_FILES and f'({f})' not in readme and f'(./{f})' not in readme:
                errors.append(f'{rel(os.path.join(d, "README.md"))}: no enlaza {f}')

    for w in warns:
        print('AVISO  ' + w)
    for e in errors:
        print('FALLO  ' + e)
    print(f'{"OK" if not errors else "FALLO"}: deriva de la documentación ({len(errors)} fallos, {len(warns)} avisos; {len(modules)} módulos y componentes)')
    return 1 if errors else 0


if __name__ == '__main__':
    sys.exit(main())

#!/usr/bin/env python3
"""Siguiente identificador libre: D, P, DT o SEG. Los IDs no se reutilizan ni se renumeran (STANDARD.md §4).

Como una deuda cerrada se borra de su ficha, el máximo se busca en TODO el cerebro (menciones incluidas), no solo en las
fichas vivas: así nunca se reutiliza un número cerrado.

Uso: next-id.py D|P|DT|SEG
"""
import os, re, sys

ROOT = os.environ.get('CLAUDE_PROJECT_DIR') or os.getcwd()
PAT = {'D': r'\bD(\d{1,3})\b', 'P': r'\bP(\d{1,3})\b', 'DT': r'\bDT-(\d{1,3})\b', 'SEG': r'\bSEG-(\d{1,3})\b'}
FICHA = {'D': 'datos/decisiones/<módulo>.md', 'P': 'datos/pendientes/<módulo>.md',
         'DT': 'deuda-tecnica/<módulo>.md', 'SEG': 'seguridad/<módulo>.md'}


def main():
    if len(sys.argv) != 2 or sys.argv[1] not in PAT:
        print(__doc__); return 2
    kind = sys.argv[1]
    best, where = 0, ''
    for dp, dn, fn in os.walk(ROOT):
        dn[:] = [d for d in dn if d not in ('.git', 'node_modules', 'assets')]
        for f in fn:
            if not f.endswith('.md'):
                continue
            p = os.path.join(dp, f)
            for m in re.finditer(PAT[kind], open(p, encoding='utf-8', errors='ignore').read()):
                n = int(m.group(1))
                if n > best:
                    best, where = n, os.path.relpath(p, ROOT)
    label = f'{kind}-{best + 1}' if kind in ('DT', 'SEG') else f'{kind}{best + 1}'
    print(label)
    print(f'(el mayor visto es {best}, en {where}; la ficha va en references/{FICHA[kind]})', file=sys.stderr)
    return 0


sys.exit(main())

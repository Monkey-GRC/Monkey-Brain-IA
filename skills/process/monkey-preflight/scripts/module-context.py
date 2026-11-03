#!/usr/bin/env python3
"""Imprime todo lo que el cerebro sabe de un módulo: contrato, enums, decisiones, PENDIENTES ABIERTAS, deuda y seguridad.

Uso: module-context.py <módulo>            p. ej. cumplimiento · onboarding/contexto-servicio · autenticacion
     module-context.py --list              lista los módulos disponibles
"""
import os, re, sys

ROOT = os.environ.get('CLAUDE_PROJECT_DIR') or os.getcwd()
ARQ = os.path.join(ROOT, 'skills/product/monkey-compliance-council/references/arquitectura')
PEND = os.path.join(ROOT, 'skills/product/monkey-compliance-council/references/datos/pendientes')
KEYS = ('contracts/', 'Decisiones', 'Pendientes', 'Deuda vigente', 'Requisitos de seguridad', 'Valores de los enums')


def modules():
    out = []
    for dp, dn, fn in os.walk(ARQ):
        if 'README.md' in fn and dp != ARQ and 'motores' not in dp and 'marcos' not in dp:
            out.append(os.path.relpath(dp, ARQ))
    return sorted(out)


def main():
    if len(sys.argv) != 2:
        print(__doc__); return 2
    if sys.argv[1] == '--list':
        print('\n'.join(modules())); return 0
    mod = sys.argv[1].strip('/')
    readme = os.path.join(ARQ, mod, 'README.md')
    if not os.path.exists(readme):
        print(f'No existe el módulo «{mod}». Disponibles:\n  ' + '\n  '.join(modules()), file=sys.stderr)
        return 1
    text = open(readme, encoding='utf-8').read()
    title = text.split('\n', 1)[0].lstrip('# ').strip()
    print(f'# {title}  (arquitectura/{mod}/README.md)\n')
    for l in text.split('\n'):
        if l.startswith('|') and any(k in l for k in KEYS) and 'Dato | Dueño' not in l:
            print(l)
    top = mod.split('/')[0]
    if top != mod:  # un componente hereda los registros de su módulo: decisiones, deuda, seguridad
        ptext = open(os.path.join(ARQ, top, 'README.md'), encoding='utf-8').read()
        print(f'\n## Registros del módulo padre ({top})')
        for l in ptext.split('\n'):
            if l.startswith('|') and any(k in l for k in KEYS) and 'Dato | Dueño' not in l:
                print(l)
    pf = os.path.join(PEND, top + '.md')
    print('\n## Pendientes del comité')
    if os.path.exists(pf):
        heads = re.findall(r'^## (P\d+ · .+)$', open(pf, encoding='utf-8').read(), re.M)
        for h in heads:
            print(f'  ABIERTA  {h}')
        print('\n  → Si lo que vas a construir depende de una de estas, NO la resuelvas: pregunta.')
    else:
        print('  ninguna abierta para este módulo')
    return 0


sys.exit(main())

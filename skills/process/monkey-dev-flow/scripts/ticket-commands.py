#!/usr/bin/env python3
"""Arma los `git add` y `git commit` de cierre de un ticket a partir de `git status` de cada repo, nunca de memoria
(en MD-194 quedó fuera `i18n/` por armarlos a mano). Claude no commitea: Rod copia y ejecuta (CLAUDE.md).

Agrupa cada repo en commits por tipo y deja el mensaje para completar, en inglés y sin atribución:
- Brain:            docs(brain)        → todo
- Backend:          feat(<módulo>)     → prisma/, src/, i18n/
                    test(<módulo>)     → test/, scripts/
                    chore(ci)          → .github/, package*.json, README y lo demás
- Frontend/Platform: feat(<módulo>)    → src/ (salvo *.spec.ts)
                    test(<módulo>)     → *.spec.ts
                    chore              → lo demás
Al final comprueba que ningún archivo cambiado quedó sin `git add`.

Uso: ticket-commands.py MD-196 [--scope compliance]
"""
import argparse
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[5]
REPOS = [('Monkey-Brain-IA', 'brain'), ('Backend', 'backend'), ('Frontend', 'front'), ('Frontend-Platform', 'front')]


def status(repo: Path) -> list[str]:
    out = subprocess.run(['git', '-C', str(repo), 'status', '--porcelain'], capture_output=True, text=True).stdout
    paths = []
    for line in out.splitlines():
        path = line[3:]
        if ' -> ' in path:
            path = path.split(' -> ', 1)[1]
        paths.append(path.strip('"'))
    return paths


def groups(kind: str, files: list[str], scope: str) -> list[tuple[str, list[str]]]:
    if kind == 'brain':
        return [('docs(brain)', files)]
    if kind == 'backend':
        feat = [f for f in files if f.startswith(('prisma/', 'src/', 'i18n/'))]
        test = [f for f in files if f.startswith(('test/', 'scripts/'))]
    else:
        test = [f for f in files if f.endswith('.spec.ts')]
        feat = [f for f in files if f.startswith('src/') and f not in test]
    rest = [f for f in files if f not in feat and f not in test]
    return [(t, g) for t, g in ((f'feat({scope})', feat), (f'test({scope})', test), ('chore(ci)' if kind == 'backend' else 'chore', rest)) if g]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('ticket')
    ap.add_argument('--scope', default='<módulo>')
    args = ap.parse_args()
    for name, kind in REPOS:
        repo = ROOT / name
        files = status(repo)
        if not files:
            continue
        branch = subprocess.run(['git', '-C', str(repo), 'branch', '--show-current'], capture_output=True, text=True).stdout.strip()
        print(f'**{name}** (`{branch}`)\n```bash\ncd ~/Documentos/Monkey/{name}')
        added: set[str] = set()
        for prefix, paths in groups(kind, files, args.scope):
            dirs = sorted(paths)  # `git status` ya resume una carpeta nueva como `dir/`
            print('git add ' + ' '.join(dirs))
            print(f'git commit -m "{prefix}: <qué cambia, en inglés> ({args.ticket})"')
            added |= set(paths)
        missing = [f for f in files if f not in added]
        print('```')
        if missing:
            print('⚠ Sin agrupar: ' + ', '.join(missing))
        print()


if __name__ == '__main__':
    main()

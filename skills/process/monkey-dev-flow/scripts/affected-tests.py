#!/usr/bin/env python3
"""MD-216 · Qué pruebas correr según lo que cambió (niveles N1 y N2 de monkey-dev-flow).

Lee el diff de cada repo contra su rama de integración (lo commiteado en la rama, lo que está en el índice, lo que no
y los archivos nuevos) y devuelve los comandos que prueban **solo lo tocado**:

- Backend: unitarias relacionadas (`jest --findRelatedTests`) y las suites e2e de las features afectadas: las dueñas
  (test-map.json) y las que llaman a sus rutas (se detectan leyendo los controladores).
- Frontend y Frontend-Platform: los specs de lo cambiado y de sus consumidores directos (`ng test --include`).

La suite completa la corre el CI del PR (N3); este script nunca la propone.

Uso:
  affected-tests.py                       # los cuatro repos, solo imprime
  affected-tests.py --repo backend        # uno: backend | frontend | platform
  affected-tests.py --base main           # otra base (por defecto develop)
  affected-tests.py --repo backend --run  # además los ejecuta, y dice cuánto tardó cada uno
"""
from __future__ import annotations

import argparse
import json
import re
import shlex
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[5]  # .../Monkey
BRAIN = ROOT / 'Monkey-Brain-IA'
REPOS = {'backend': ROOT / 'Backend', 'frontend': ROOT / 'Frontend', 'platform': ROOT / 'Frontend-Platform'}
MAP = json.loads((Path(__file__).with_name('test-map.json')).read_text())

# Más archivos e2e que esto, y conviene avisar: el cambio es transversal y quizá sea mejor dejarlo al CI.
E2E_WARN = 25
SPEC_WARN = 120


def git(repo: Path, *args: str) -> str:
    return subprocess.run(['git', '-C', str(repo), *args], capture_output=True, text=True, check=False).stdout


def changed_files(repo: Path, base: str) -> list[str]:
    """Lo que difiere de la base: commits de la rama, índice, árbol de trabajo y archivos nuevos (sin borrados)."""
    ref = base if git(repo, 'rev-parse', '--verify', '-q', base).strip() else f'origin/{base}'
    merge_base = git(repo, 'merge-base', ref, 'HEAD').strip() or ref
    files = set(git(repo, 'diff', '--name-only', '--diff-filter=d', merge_base).split())
    files |= set(git(repo, 'ls-files', '--others', '--exclude-standard').split())
    return sorted(f for f in files if (repo / f).exists())


# ---------------------------------------------------------------- Backend

IMPORT = re.compile(r"""from\s+['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]""")
ROUTE_DECORATOR = re.compile(r"@(Controller|Get|Post|Put|Patch|Delete)\(\s*(?:'([^']*)'|\"([^\"]*)\")?")


LAYERS = ('presentation', 'application', 'domain', 'infrastructure')


def touched_controllers(repo: Path, feature: str, files: list[str]) -> list[Path]:
    """Los controladores de la parte de la feature que cambió. En una feature organizada por subcarpetas
    (`compliance/<capa>/<sub>/`), un cambio en `<sub>` toca solo los controladores de `presentation/<sub>/`; lo que cambia
    fuera de una subcarpeta con controlador (lo compartido, el motor) toca todos los de la feature."""
    base = repo / 'src/features' / feature
    every = sorted(base.rglob('*.controller.ts'))
    subs: set[str] = set()
    for f in files:
        parts = f.split('/')
        if len(parts) < 4 or parts[1] != 'features' or parts[2] != feature:
            continue
        if len(parts) >= 6 and parts[3] in LAYERS:
            sub = parts[4]
            if (base / 'presentation' / sub).is_dir():
                subs.add(sub)
                continue
        return every
    return [c for c in every if any((base / 'presentation' / s) in c.parents for s in subs)]


def controller_routes(ctrl: Path) -> list[re.Pattern[str]]:
    """Cada ruta del controlador como patrón que encuentra su llamada en un e2e con el MISMO método
    (`.get(`/v1/…`)`): así no cuentan las suites que solo crean datos con un POST para preparar su escenario."""
    patterns: list[re.Pattern[str]] = []
    prefix = ''
    for kind, a, b in ROUTE_DECORATOR.findall(ctrl.read_text()):
        path = (a or b or '').strip('/')
        if kind == 'Controller':
            prefix = path
            continue
        full = '/'.join(p for p in (prefix, path) if p)
        segs = full.split('/') if full else []
        if not any(not seg.startswith(':') for seg in segs):
            continue  # sin un tramo literal propio no dice nada
        literal = '/'.join(re.escape(seg) if not seg.startswith(':') else r'[^/\'"`?]+' for seg in segs)
        patterns.append(re.compile(r'\.' + kind.lower() + r'\(\s*[\'"`]/v1/' + literal + r'(?=[\'"`?/])'))
    return patterns


def expand(repo: Path, entries: list[str]) -> set[str]:
    out: set[str] = set()
    for e in entries:
        p = repo / e
        if p.is_dir():
            out |= {str(f.relative_to(repo)) for f in p.rglob('*.e2e-spec.ts')}
        elif p.exists():
            out.add(e)
    return out


def backend_importers(repo: Path, changed: list[str]) -> set[str]:
    """Los archivos de OTRA feature (o de fuera de features) que importan un archivo cambiado."""
    targets = {str((repo / f).with_suffix('').resolve()): f for f in changed}
    found: set[str] = set()
    for ts in (repo / 'src').rglob('*.ts'):
        if ts.name.endswith(('.spec.ts', '.module.ts')):  # un módulo Nest solo cablea: no es integración
            continue
        rel = str(ts.relative_to(repo))
        for a, b in IMPORT.findall(ts.read_text()):
            target = a or b
            if not target.startswith('.'):
                continue
            hit = targets.get(str((ts.parent / target).resolve()))
            if hit and feature_of(hit) != feature_of(rel):
                found.add(rel)
                break
    return found


def feature_of(path: str) -> str:
    parts = path.split('/')
    return parts[2] if len(parts) > 3 and parts[1] == 'features' else parts[1] if len(parts) > 1 else path


def backend(repo: Path, files: list[str]) -> tuple[list[str], list[str]]:
    unit_inputs = [f for f in files if f.startswith('src/') and f.endswith('.ts')]
    e2e: set[str] = {f for f in files if f.endswith('.e2e-spec.ts')}
    notes: list[str] = []
    all_e2e = sorted(str(f.relative_to(repo)) for f in (repo / 'test').rglob('*.e2e-spec.ts'))

    # Integración sin HTTP: otra feature (o el runner) que importa un archivo cambiado también queda afectada,
    # con el archivo que importa como si hubiera cambiado (un nivel). Así entra, p. ej., technical-control cuando cambia
    # el registrador de estados de compliance que usa por dentro (DT-109).
    # Solo desde código de una feature: src/common y src/infrastructure los importa todo, y su efecto lo cubren test-map.json (paths) y las unitarias.
    importers = backend_importers(repo, [f for f in files if f.startswith('src/features/') and f.endswith('.ts') and not f.endswith('.spec.ts')])
    for imp in sorted(importers - set(files)):
        notes.append(f'`{imp}` importa algo cambiado: se suman sus pruebas')
    files = sorted(set(files) | importers)
    features = sorted({f.split('/')[2] for f in files if f.startswith('src/features/') and f.count('/') >= 3})
    for feat in features:
        owners = expand(repo, MAP['backend']['features'].get(feat, []))
        if feat not in MAP['backend']['features']:
            notes.append(f'la feature `{feat}` no está en test-map.json: añádela (monkey-closeout)')
        touched = touched_controllers(repo, feat, files)
        narrowed = len(touched) < len(list((repo / 'src/features' / feat).rglob('*.controller.ts')))
        routes = [r for c in touched for r in controller_routes(c)]
        hits = {t for t in all_e2e if any(r.search((repo / t).read_text()) for r in routes)}
        # Acotado a una parte de la feature: de sus suites dueñas, solo las que llaman a esas rutas.
        e2e |= hits | (set() if narrowed and hits else owners)
    for prefix, entries in MAP['backend']['paths'].items():
        if any(f.startswith(prefix) for f in files):
            e2e |= expand(repo, entries)

    # Un helper de test cambiado: las suites que lo importan.
    for helper in [f for f in files if f.startswith('test/support/')]:
        stem = Path(helper).stem
        for t in all_e2e:
            if re.search(rf"from '\.\./support/{re.escape(stem)}'", (repo / t).read_text()):
                e2e.add(t)

    cmds: list[str] = []
    if unit_inputs:
        # TODAS las unitarias del Backend (~6 s): así no se escapa ningún test global que arme la app o recorra el catálogo,
        # que --findRelatedTests no elige (`always_unit` de test-map.json; el CI de MD-195 cayó por api-docs.spec.ts).
        cmds.append('npx jest')
        api = [f for f in unit_inputs if f.endswith(('.controller.ts', '.responses.ts', '.dto.ts', '.query.ts'))]
        if api:
            notes.append('cambió la API pública: `src/common/swagger/api-docs.spec.ts` exige actualizar el conteo de rutas y una `description` en cada propiedad de Swagger')
    if e2e:
        cmds.append('npm run -s test:db -- up && TEST_DATABASE_URL=${TEST_DATABASE_URL:-postgresql://postgres:test@localhost:55432/monkey_template} npm run test:e2e -- ' + ' '.join(shlex.quote(f) for f in sorted(e2e)))
        if len(e2e) > E2E_WARN:
            notes.append(f'{len(e2e)} suites e2e: el cambio es transversal. Corre las de la feature principal y deja el resto al CI')
    if any(f.startswith('prisma/') for f in files):
        notes.append('cambió prisma/: `npm run test:db -- up` reconstruye la plantilla sola al detectar migraciones nuevas')
    if unit_inputs or e2e:
        # Los mismos pasos baratos del CI (MD-217): el lint de TODO el repo (`lint:ci`, ~5 s; el de solo lo cambiado no ve
        # `scripts/` ni lo que rompe un import), los tipos con las pruebas y el `nest build` (~11 s).
        cmds.insert(0, 'npx tsc --noEmit && npm run -s lint:ci && npm run -s build')
    return cmds, notes


# ---------------------------------------------------------------- Frontend



def owning_ts(repo: Path, f: str) -> Path | None:
    """El .ts de un componente cuando cambia su .html o .css."""
    p = repo / f
    if p.suffix == '.ts':
        return p
    cand = p.with_suffix('.ts')
    return cand if cand.exists() else None


def spec_of(ts: Path) -> Path | None:
    if ts.name.endswith('.spec.ts'):
        return ts
    s = ts.with_name(ts.stem + '.spec.ts')
    return s if s.exists() else None


def frontend(repo: Path, files: list[str]) -> tuple[list[str], list[str]]:
    src = [f for f in files if f.startswith('src/')]
    touched = {t for f in src if (t := owning_ts(repo, f))}
    specs: set[Path] = {s for t in touched if (s := spec_of(t))}
    notes: list[str] = []

    # Consumidores directos: los .ts que importan un archivo tocado (por ruta relativa o por alias, comparando el final de la ruta).
    stems = {t.with_suffix('').as_posix() for t in touched if not t.name.endswith('.spec.ts')}
    if stems:
        for ts in (repo / 'src').rglob('*.ts'):
            if ts.name.endswith('.spec.ts') or ts in touched:
                continue
            for a, b in IMPORT.findall(ts.read_text()):
                target = (a or b)
                if target.startswith('.'):
                    resolved = (ts.parent / target).resolve().as_posix()
                    hit = resolved in stems
                else:
                    tail = target.split('/', 1)[-1]
                    hit = any(s.endswith('/' + tail) for s in stems)
                if hit:
                    if (s := spec_of(ts)):
                        specs.add(s)
                    break

    cmds: list[str] = []
    lint = [f for f in src if f.endswith(('.ts', '.html'))]
    if lint:
        # `ng lint --lint-file-patterns` no existe en el builder de esta versión del CLI (MD-217): eslint directo sobre lo cambiado.
        cmds.append('npx eslint ' + ' '.join(shlex.quote(f) for f in lint))
    if specs:
        rel = sorted(str(s.relative_to(repo)) for s in specs)
        cmds.append('npx ng test --watch=false --browsers=ChromeHeadless ' + ' '.join(f'--include={shlex.quote(r)}' for r in rel))
        if len(rel) > SPEC_WARN:
            notes.append(f'{len(rel)} specs: el cambio es transversal (core/shared). Corre los de la vista principal y deja el resto al CI')
    elif src:
        notes.append('lo cambiado no tiene spec propio ni consumidores con spec: ¿falta una prueba?')
    if any(f.startswith('src/') for f in files):
        cmds.append('npx ng build')
    return cmds, notes


# ---------------------------------------------------------------- main

def ci_npm_version(repo: Path) -> str:
    """El npm que trae el Node del CI del repo (`node-version` de .github/workflows/ci.yml)."""
    wf = repo / '.github' / 'workflows' / 'ci.yml'
    m = re.search(r'node-version:\s*["\']?(\d+)', wf.read_text(encoding='utf-8')) if wf.exists() else None
    return {'18': '10', '20': '10.8.2', '22': '10', '24': '11'}.get(m.group(1) if m else '', '10')


def lockfile_check(repo: Path, files: list[str]) -> str | None:
    """MD-217: el CI cayó en `npm ci` porque el lockfile se regeneró con otro npm y con `legacy-peer-deps=true` del
    ~/.npmrc de Rod (faltaban las peers `react`/`react-dom` de Prisma Studio). Ninguna prueba local lo veía. Se valida igual
    que el CI: el npm de su Node, sin la configuración de usuario, en una copia aparte para no tocar node_modules."""
    if not any(f in ('package.json', 'package-lock.json') for f in files):
        return None
    v = ci_npm_version(repo)
    return ('d=$(mktemp -d) && cp package.json package-lock.json "$d"/ && (cd "$d" && NPM_CONFIG_USERCONFIG=/dev/null '
            f'npx -y npm@{v} ci --dry-run --ignore-scripts --no-audit --no-fund >/dev/null); r=$?; rm -rf "$d"; exit $r')


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--repo', choices=[*REPOS, 'all'], default='all')
    ap.add_argument('--base', default='develop')
    ap.add_argument('--run', action='store_true', help='ejecuta los comandos y mide cada uno')
    args = ap.parse_args()

    failed = False
    for name in (REPOS if args.repo == 'all' else [args.repo]):
        repo = REPOS[name]
        files = changed_files(repo, args.base)
        print(f'## {name} ({repo.name}) · {len(files)} archivos cambiados frente a {args.base}')
        if not files:
            print('   sin cambios\n')
            continue
        cmds, notes = (backend if name == 'backend' else frontend)(repo, files)
        if (lock := lockfile_check(repo, files)):
            cmds.insert(0, lock)
            notes.append('cambió package.json o package-lock.json: se comprueba con el npm del CI y sin el ~/.npmrc local (MD-217)')
        for c in cmds:
            print(f'   $ {c}' if len(c) < 400 else f'   $ {c[:400]}… ({len(c)} caracteres)')
        for n in notes:
            print(f'   ! {n}')
        if args.run:
            for c in cmds:
                t0 = time.time()
                r = subprocess.run(c, shell=True, cwd=repo)
                print(f'   {"OK " if r.returncode == 0 else "FAIL"} {time.time() - t0:5.0f} s · {c[:80]}…')
                failed |= r.returncode != 0
        print()
    print('La regresión completa la corre el CI del PR (N3).')
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main())

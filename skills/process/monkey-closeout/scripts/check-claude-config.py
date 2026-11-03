#!/usr/bin/env python3
"""Verifica la configuración de Claude Code del Brain: settings.json, hooks, skills, subagentes y CLAUDE.md.
Salida 0 = correcta, 1 = hay fallos. Uso: check-claude-config.py [--root RUTA]

Reglas comprobadas (todas salen de la documentación de Claude Code):
- settings.json es JSON estricto y cada hook apunta a un script existente y ejecutable.
- Cada skill registrada en .claude/skills es una carpeta con SKILL.md; `name` coincide con la carpeta; `description` presente y
  ≤1536 caracteres (límite del listado).
- Cada subagente en .claude/agents tiene `name` (minúsculas y guiones) y `description`; `tools` y `model` válidos.
- Los subagentes no reciben campos que se ignoran en silencio sin avisarlo (aviso, no fallo).
- CLAUDE.md < 200 líneas y todas las rutas que cita existen.
"""
import argparse, json, os, re, sys

try:
    import yaml
except ImportError:
    yaml = None

TOOLS = {'Read', 'Grep', 'Glob', 'Edit', 'Write', 'Bash', 'WebFetch', 'WebSearch', 'NotebookEdit', 'Agent', 'Task', 'TodoWrite'}
MODELS = {'sonnet', 'opus', 'haiku', 'fable', 'inherit'}
KNOWN = {'name', 'description', 'tools', 'disallowedTools', 'model', 'permissionMode', 'maxTurns', 'skills', 'mcpServers', 'hooks',
         'memory', 'background', 'omitClaudeMd', 'effort', 'isolation', 'color', 'initialPrompt', 'autoCompactWindow', 'experimental'}
CUSTOM_OK = {'title', 'type', 'applies_to', 'reports_to', 'consults', 'consulted_by', 'delegates_to', 'escalates_to', 'supervises', 'note', 'id'}


def frontmatter(path):
    t = open(path, encoding='utf-8').read()
    m = re.match(r'^---\n(.*?)\n---\n', t, re.S)
    if not m:
        return None
    if yaml:
        try:
            return yaml.safe_load(m.group(1)) or {}
        except Exception as e:
            return {'_error': str(e)}
    out, key = {}, None
    for l in m.group(1).split('\n'):
        mm = re.match(r'^([A-Za-z_-]+):\s*(.*)$', l)
        if mm:
            key = mm.group(1); out[key] = mm.group(2).strip()
        elif key and l.startswith(' '):
            out[key] = (str(out[key]) + ' ' + l.strip()).strip()
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--root', default=os.environ.get('CLAUDE_PROJECT_DIR') or os.getcwd())
    root = os.path.abspath(ap.parse_args().root)
    errs, warns, info = [], [], []
    P = lambda *a: os.path.join(root, *a)

    # settings + hooks
    try:
        s = json.load(open(P('.claude/settings.json')))
        for ev, groups in (s.get('hooks') or {}).items():
            for g in groups:
                for h in g.get('hooks', []):
                    cmd = h.get('command', '').replace('${CLAUDE_PROJECT_DIR}', root)
                    if not os.path.exists(cmd):
                        errs.append(f'hook {ev}: no existe {cmd}')
                    elif not os.access(cmd, os.X_OK):
                        errs.append(f'hook {ev}: no es ejecutable {cmd}')
        for d in s.get('permissions', {}).get('additionalDirectories', []):
            if not os.path.isdir(os.path.normpath(os.path.join(root, d))):
                errs.append(f'additionalDirectories: no existe {d}')
    except Exception as e:
        errs.append(f'.claude/settings.json: {e}')

    # skills
    total = 0
    sk = P('.claude/skills')
    for n in sorted(os.listdir(sk)) if os.path.isdir(sk) else []:
        d = os.path.join(sk, n)
        f = os.path.join(d, 'SKILL.md')
        if not os.path.exists(f):
            errs.append(f'skill {n}: sin SKILL.md (symlink roto o carpeta vacía)'); continue
        fm = frontmatter(f)
        if not fm or '_error' in fm:
            errs.append(f'skill {n}: frontmatter ausente o inválido {fm}'); continue
        if fm.get('name') != n:
            errs.append(f'skill {n}: name «{fm.get("name")}» no coincide con la carpeta')
        desc = ' '.join(str(fm.get('description', '')).split()) + ' ' + str(fm.get('when_to_use', ''))
        if not fm.get('description'):
            errs.append(f'skill {n}: sin description')
        if len(desc) > 1536:
            errs.append(f'skill {n}: description de {len(desc)} caracteres (>1536, se trunca)')
        total += len(desc)
    info.append(f'descripciones de skills: {total} caracteres en total (costo fijo de contexto por sesión)')

    # subagentes
    ag = P('.claude/agents')
    names = set()
    for fn in sorted(os.listdir(ag)) if os.path.isdir(ag) else []:
        f = os.path.join(ag, fn)
        if not os.path.exists(f):
            errs.append(f'agente {fn}: symlink roto'); continue
        fm = frontmatter(f)
        if not fm or '_error' in fm:
            errs.append(f'agente {fn}: frontmatter ausente o inválido {fm}'); continue
        nm = fm.get('name')
        if not nm or not re.match(r'^[a-z][a-z0-9-]*$', str(nm)):
            errs.append(f'agente {fn}: name inválido «{nm}»')
        if nm in names:
            errs.append(f'agente {fn}: name duplicado {nm}')
        names.add(nm)
        if not fm.get('description'):
            errs.append(f'agente {fn}: sin description (Claude Code lo ignora)')
        tools = fm.get('tools')
        if isinstance(tools, str):
            tools = [x.strip() for x in tools.split(',') if x.strip()]
        for t in tools or []:
            if t not in TOOLS:
                errs.append(f'agente {fn}: tool desconocida «{t}»')
        if fm.get('model') and fm['model'] not in MODELS:
            errs.append(f'agente {fn}: model «{fm["model"]}» no válido')
        for k in fm:
            if k not in KNOWN and k not in CUSTOM_OK:
                warns.append(f'agente {fn}: campo «{k}» se ignora en silencio')
        for sname in fm.get('skills') or []:
            if not os.path.exists(P('.claude/skills', sname, 'SKILL.md')):
                errs.append(f'agente {fn}: precarga una skill inexistente «{sname}»')
    info.append(f'subagentes registrados: {len(names)}')

    # CLAUDE.md
    cm = P('CLAUDE.md')
    t = open(cm, encoding='utf-8').read()
    n = t.count('\n') + 1
    info.append(f'CLAUDE.md: {n} líneas')
    if n >= 200:
        errs.append(f'CLAUDE.md tiene {n} líneas (objetivo < 200)')
    allf = []
    for dp, dn, fn in os.walk(root):
        dn[:] = [d for d in dn if d not in ('.git', 'node_modules')]
        allf += [os.path.relpath(os.path.join(dp, x), root) for x in fn]
        allf += [os.path.relpath(os.path.join(dp, d), root) + '/' for d in dn]
    for pth in sorted(set(re.findall(r'`([^`\s]+\.(?:md|json)|[A-Za-z0-9_.\-/<>]+/)`', t))):
        if '<' in pth or '*' in pth or pth == 'SKILL.md':
            continue
        # existe tal cual, o es una ruta relativa a un subárbol (p. ej. a references/): basta que algún archivo termine así
        if not os.path.exists(P(pth)) and not any(('/' + f).endswith('/' + pth.lstrip('/')) or ('/' + f).endswith('/' + pth) for f in allf):
            errs.append(f'CLAUDE.md cita una ruta que no existe: {pth}')

    for i in info: print('INFO   ' + i)
    for w in warns: print('AVISO  ' + w)
    for e in errs: print('FALLO  ' + e)
    print('OK: configuración de Claude Code correcta' if not errs else f'\n{len(errs)} fallo(s)')
    return 1 if errs else 0


sys.exit(main())

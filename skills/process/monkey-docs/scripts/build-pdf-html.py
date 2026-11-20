#!/usr/bin/env python3
"""Arma el HTML imprimible de las historias y los casos de uso de un módulo (lo llama export-pdf.sh).

Uso: build-pdf-html.py <dir-del-módulo> <título> <04.html> <05.html> <salida.html>

Toma el HTML que genera marked desde el Markdown del cerebro y le da la presentación de entrega: portada con el logo de
Monkey, encabezado y pie con número de página, tablas con diseño y el estado como etiqueta de color. Además limpia los
signos que en el cerebro son atajos de escritura y en un documento formal se ven raros: flechas (→ ⇒), raya larga (—),
guion de rango (–) y puntos suspensivos (…). La fuente no cambia: el Markdown sigue siendo el que manda.
"""
import datetime
import html
import re
import sys
from pathlib import Path

ASSETS = Path(__file__).resolve().parent.parent / "assets"
MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre",
         "noviembre", "diciembre"]

# Estado → (clase, etiqueta). Las de SEG (🟠 🔴) aparecen al citar un requisito de seguridad.
ESTADOS = {
    "✅": ("ok", "Construida"),
    "🟡": ("warn", "Parcial"),
    "🟠": ("warn", "Parcial"),
    "🔴": ("bad", "No implementado"),
    "⚪": ("todo", "Por construir"),
}
# La palabra que a veces sigue al emoji en la leyenda («✅ construida»): se absorbe para no repetirla.
PALABRA_ESTADO = r"(?:\s+(?:construidas?|parcial(?:es)?|por construir|no implementado|no verificable[^·<]*))?"


def limpiar_texto(t: str) -> str:
    """Signos de atajo → puntuación normal. Solo sobre texto, nunca dentro de <code> o <pre>."""
    t = re.sub(r"\s*(?:→|⇒)\s*", ": ", t)
    t = re.sub(r"\s*←\s*", ": ", t)
    t = re.sub(r"(\d|§[\d.]+)\s*–\s*(?=\d|§)", r"\1 a ", t)  # 0–100 → 0 a 100; §4.3–§4.4 → §4.3 a §4.4
    t = t.replace("–", "-")
    t = re.sub(r"\s+—\s+", ", ", t)                             # inciso con raya → coma
    t = t.replace("—", "-")
    t = t.replace("…", "...")
    t = re.sub(r":\s*:", ":", t)
    return t


def limpiar_html(h: str) -> str:
    partes = re.split(r"(<pre[\s\S]*?</pre>|<code>[\s\S]*?</code>|<[^>]+>)", h)
    out = []
    for p in partes:
        if not p:
            continue
        if p.startswith("<"):
            out.append(p)
        else:
            out.append(limpiar_texto(p))
    h = "".join(out)
    # Una celda que solo tenía la raya («sin dato») queda con un guion discreto.
    h = re.sub(r"<td>\s*-\s*</td>", '<td class="vacio">-</td>', h)
    return h


def estados_a_etiquetas(h: str) -> str:
    def rep(m):
        cls, label = ESTADOS[m.group(1)]
        return f'<span class="st st-{cls}">{label}</span>'
    return re.sub(r"(✅|🟡|🟠|🔴|⚪)️?" + PALABRA_ESTADO, rep, h, flags=re.I)


def enlaces_a_texto(h: str) -> str:
    # Los enlaces internos del repo no sirven en papel: quedan como texto con estilo. Los http(s) se conservan.
    h = re.sub(r'<a href="(?!https?:)[^"]*">([\s\S]*?)</a>', r'<span class="ref">\1</span>', h)
    return h


def tablas(h: str) -> str:
    # Las tablas de ficha de un caso («| | |») tienen la cabecera vacía: se marcan para dibujarlas como ficha.
    h = re.sub(r"<table>\s*<thead>\s*<tr>\s*(?:<th[^>]*>\s*</th>\s*)+</tr>\s*</thead>",
               '<table class="ficha">', h)
    h = h.replace("<table>", '<table class="datos">')
    # Celdas cortas (un ID, un ticket, un estado) no se parten en dos líneas.
    return re.sub(r"<td>([^<]{1,14})</td>", r'<td class="nw">\1</td>', h)


def procesar(h: str) -> str:
    h = enlaces_a_texto(h)
    h = limpiar_html(h)
    h = estados_a_etiquetas(h)
    h = tablas(h)
    return h


def main():
    mod_dir, titulo, f04, f05, salida = sys.argv[1:6]
    hoy = datetime.date.today()
    fecha = f"{hoy.day} de {MESES[hoy.month - 1]} de {hoy.year}"
    cuerpo04 = procesar(Path(f04).read_text(encoding="utf-8"))
    cuerpo05 = procesar(Path(f05).read_text(encoding="utf-8"))
    logo_h = (ASSETS / "logo-cabecera.svg").as_uri()
    logo_b = (ASSETS / "logo-blanco.svg").as_uri()
    t = html.escape(titulo)
    doc = f"""<!doctype html><html lang="es"><head><meta charset="utf-8">
<base href="{Path(mod_dir).resolve().as_uri()}/">
<title>{t} · Historias de usuario y casos de uso</title>
<style>
  :root {{ --navy:#013362; --brand:#046cc4; --tint:#eef4fb; --ink:#1a202c; --muted:#4a5568; --faint:#718096;
          --line:#dbe3ee; --zebra:#f7f9fc; }}
  @page {{ size: A4; margin: 24mm 16mm 20mm;
    @top-left {{ content: url("{logo_h}"); width: 50mm; vertical-align: bottom; padding-bottom: 3mm; }}
    @top-right {{ content: "{t} · Historias de usuario y casos de uso"; font: 7.5pt "Noto Sans", sans-serif; color: #718096; white-space: nowrap; width: 120mm; text-align: right; vertical-align: bottom; padding-bottom: 4mm; }}
    @bottom-left {{ white-space: nowrap; width: 120mm; content: "Monkey · Ciberseguridad y cumplimiento · Documento confidencial"; font: 7.5pt 'Noto Sans', sans-serif; color: #718096; }}
    @bottom-right {{ white-space: nowrap; content: "Página " counter(page) " de " counter(pages); font: 7.5pt 'Noto Sans', sans-serif; color: #718096; }}
  }}
  @page portada {{ margin: 0; @top-left {{ content: none; }} @top-right {{ content: none; }} @bottom-left {{ content: none; }} @bottom-right {{ content: none; }} }}
  * {{ box-sizing: border-box; }}
  html {{ -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
  body {{ margin: 0; font-family: 'Noto Sans', 'Liberation Sans', Arial, sans-serif; font-size: 9.6pt; color: var(--ink); line-height: 1.5; }}
  .cabecera {{ position: running(cabecera); display: flex; align-items: center; justify-content: space-between;
              width: 178mm; border-bottom: 1px solid var(--line); padding-bottom: 2.5mm; }}
  .cabecera img {{ height: 8mm; }}
  .cabecera span {{ font-size: 7.5pt; color: var(--faint); letter-spacing: .02em; }}

  /* Portada */
  .portada {{ page: portada; height: 297mm; background: var(--navy); color: #fff; padding: 34mm 24mm 22mm;
             display: flex; flex-direction: column; break-after: page; position: relative; overflow: hidden; }}
  .portada::after {{ content: ""; position: absolute; right: -60mm; bottom: -60mm; width: 170mm; height: 170mm;
                    border-radius: 50%; background: rgba(255,255,255,.04); }}
  .portada .logo {{ height: 34mm; align-self: flex-start; }}
  .portada .tipo {{ margin-top: auto; font-size: 10pt; letter-spacing: .18em; text-transform: uppercase; color: rgba(255,255,255,.7); }}
  .portada h1 {{ font-size: 34pt; line-height: 1.1; margin: 4mm 0 3mm; color: #fff; border: 0; }}
  .portada .sub {{ font-size: 13pt; color: rgba(255,255,255,.85); margin: 0; }}
  .portada .barra {{ width: 22mm; height: 1.2mm; background: var(--brand); margin: 9mm 0; }}
  .portada dl {{ display: grid; grid-template-columns: 34mm 1fr; gap: 2mm 6mm; font-size: 9pt; margin: 0; }}
  .portada dt {{ color: rgba(255,255,255,.6); }} .portada dd {{ margin: 0; }}
  .portada .nota {{ margin-top: 14mm; font-size: 7.5pt; color: rgba(255,255,255,.55); max-width: 130mm; }}

  /* Texto */
  h1 {{ color: var(--navy); font-size: 18pt; margin: 0 0 4mm; padding-bottom: 2.5mm; border-bottom: 2px solid var(--navy); break-before: page; }}
  h2 {{ color: var(--navy); font-size: 12.5pt; margin: 7mm 0 2.5mm; }}
  h3 {{ font-size: 10.5pt; color: var(--navy); margin: 6mm 0 2mm; padding: 1.8mm 3mm; background: var(--tint);
       border-left: 3px solid var(--brand); border-radius: 0 3px 3px 0; break-after: avoid; }}
  p {{ margin: 0 0 2.5mm; }}
  ul, ol {{ margin: 0 0 3mm; padding-left: 5.5mm; }} li {{ margin-bottom: 1mm; }}
  blockquote {{ margin: 3mm 0; padding: 2.5mm 4mm; background: #fffaf0; border-left: 3px solid #d69e2e; color: var(--muted); border-radius: 0 3px 3px 0; }}
  blockquote p:last-child {{ margin: 0; }}
  code {{ font-family: 'DejaVu Sans Mono', monospace; font-size: 8pt; background: #f1f5f9; color: #2d3748; padding: .2mm 1.2mm; border-radius: 2px; }}
  .ref {{ color: var(--brand); }}
  hr {{ border: 0; border-top: 1px solid var(--line); margin: 5mm 0; }}
  img {{ max-width: 100%; display: block; margin: 4mm auto; }}

  /* Tablas */
  table {{ width: 100%; border-collapse: separate; border-spacing: 0; margin: 3mm 0 5mm; font-size: 8.3pt;
          border: 1px solid var(--line); border-radius: 4px; overflow: hidden; }}
  table.datos thead th {{ background: var(--navy); color: #fff; font-weight: 600; text-align: left; padding: 2.2mm 2.5mm; }}
  table.datos tbody tr:nth-child(even) td {{ background: var(--zebra); }}
  td {{ padding: 2mm 2.5mm; vertical-align: top; border-top: 1px solid var(--line); }}
  table.datos td:first-child {{ white-space: nowrap; font-weight: 600; color: var(--navy); }}
  table.datos tr {{ break-inside: avoid; }}
  td.nw {{ white-space: nowrap; }}
  td.vacio {{ color: var(--faint); text-align: center; }}
  table.ficha {{ break-inside: avoid; }}
  table.ficha tr:first-child td {{ border-top: 0; }}
  table.ficha td:first-child {{ width: 32mm; background: var(--tint); color: var(--navy); font-weight: 600; }}

  /* Estado */
  .st {{ display: inline-block; font-size: 7pt; font-weight: 700; letter-spacing: .02em; padding: .5mm 2mm;
        border-radius: 8px; border: 1px solid; white-space: nowrap; vertical-align: 1px; }}
  .st-ok {{ color: #22543d; background: #f0fff4; border-color: #9ae6b4; }}
  .st-warn {{ color: #744210; background: #fffaf0; border-color: #f6d58e; }}
  .st-bad {{ color: #822727; background: #fff5f5; border-color: #feb2b2; }}
  .st-todo {{ color: #4a5568; background: #f7fafc; border-color: #cbd5e0; }}
</style></head><body>
<section class="portada">
  <img class="logo" src="{logo_b}" alt="Monkey">
  <div class="tipo">Documento de producto</div>
  <h1>{t}</h1>
  <p class="sub">Historias de usuario y casos de uso</p>
  <div class="barra"></div>
  <dl><dt>Fecha</dt><dd>{fecha}</dd><dt>Clasificación</dt><dd>Confidencial</dd>
      <dt>Contenido</dt><dd>Historias con criterios de aceptación, casos de uso y diagrama UML</dd></dl>
  <p class="nota">Generado desde la base de conocimiento de producto de Monkey. La versión vigente es siempre la del
  repositorio; este documento es una copia a la fecha indicada.</p>
</section>
{cuerpo04}
{cuerpo05}
</body></html>"""
    Path(salida).write_text(doc, encoding="utf-8")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Inline every shared asset into four standalone HTML files."""
import pathlib, sys

HERE = pathlib.Path(__file__).parent
SRC  = HERE / "src"
OUT  = HERE / "dist"
OUT.mkdir(exist_ok=True)
sys.path.insert(0, str(SRC))

def r(name): return (SRC / name).read_text()

BASE_CSS   = r("base.css")
STUDY_CSS  = r("study.css")
ICONS      = r("icons.html")
STUDY_CORE = r("study-core.js")

FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n'
         '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
         '<link href="https://fonts.googleapis.com/css2?'
         'family=Outfit:wght@400;500;600;700'
         '&family=Inter:wght@400;500;600'
         '&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">')

def icon(i, cls=""):
    c = f' class="{cls}"' if cls else ""
    return f'<svg{c} viewBox="0 0 24 24" aria-hidden="true"><use href="#i-{i}"/></svg>'


# ---------------------------------------------------------------- study pages
import study_template

IOAA = dict(
    theme="ioaa", subject="IOAA", glyph="orbit", protocol="450-day gold protocol",
    tagline="A 450-day training system for the International Olympiad on Astronomy and Astrophysics.",
    homeGreeting="Mission control", journalName="Study journal",
    journalPlaceholder="What clicked today? What's still unclear? What will you focus on tomorrow?",
    currSub="AO Guide · Aniket Sule · 28 chapters to IOAA gold",
    resSub="Everything you need to prepare for IOAA",
    sibling="ipho-study.html", siblingGlyph="atom", siblingName="IPhO system",
    data="data-ioaa.js", library="lib-ioaa.html",
    phases=[
        dict(name="Foundation",        **{"from":1,"to":90},   note="Math · positional · photometry",   short="Foundation"),
        dict(name="Core astrophysics", **{"from":91,"to":240}, note="Celestial mech · stellar · binary", short="Core"),
        dict(name="Advanced + data",   **{"from":241,"to":360},note="Galactic · cosmology · papers",     short="Advanced"),
        dict(name="Peak performance",  **{"from":361,"to":450},note="Mocks · weak spots · observation",  short="Peak"),
    ],
    tracks=[
        dict(key="pos",label="Positional astro"), dict(key="photo",label="Photometry"),
        dict(key="mech",label="Celestial mech"),  dict(key="stellar",label="Stellar astro"),
        dict(key="galactic",label="Galactic + cosmo"), dict(key="papers",label="Past papers"),
    ],
)

IPHO = dict(
    theme="ipho", subject="IPhO", glyph="atom", protocol="450-day monarch protocol",
    tagline="A 450-day training system for the International Physics Olympiad.",
    homeGreeting="Monarch's command", journalName="Shadow journal",
    journalPlaceholder="What concept did you master today? What problem stumped you? What will you attack tomorrow?",
    currSub="HRK in 60 days → Kevin Zhou → IPhO gold",
    resSub="Everything you need to become IPhO Monarch",
    sibling="ioaa-study.html", siblingGlyph="orbit", siblingName="IOAA system",
    data="data-ipho.js", library="lib-ipho.html", flow="flow-ipho.html",
    phases=[
        dict(name="HRK + MIT OCW",       **{"from":1,"to":60},   note="All 52 chapters compressed",       short="HRK"),
        dict(name="Kevin Zhou core",     **{"from":61,"to":180}, note="Mech · elec · thermo",             short="KZ core"),
        dict(name="Kevin Zhou advanced", **{"from":181,"to":280},note="Relativity · waves · modern",      short="KZ adv"),
        dict(name="IPhO training",       **{"from":281,"to":360},note="Ivanov · PhODS · hard problems",   short="Training"),
        dict(name="Mock exams",          **{"from":361,"to":400},note="USAPhO · full timed mocks",        short="Mocks"),
        dict(name="Past papers",         **{"from":401,"to":430},note="IPhO 2015–2024 timed",             short="Papers"),
        dict(name="Peak performance",    **{"from":431,"to":450},note="Formula audit · review · rest",    short="Peak"),
    ],
    tracks=[
        dict(key="hrk",label="HRK + MIT OCW"), dict(key="kzcore",label="Kevin Zhou core"),
        dict(key="kzadv",label="Kevin Zhou adv"), dict(key="ipho",label="IPhO training"),
        dict(key="mocks",label="Mock exams"), dict(key="papers",label="Past papers"),
    ],
)

for cfg, name in ((IOAA, "ioaa-study.html"), (IPHO, "ipho-study.html")):
    (OUT / name).write_text(
        study_template.build(cfg, r, icon, FONTS, BASE_CSS, STUDY_CSS, ICONS, STUDY_CORE))


# ------------------------------------------------------- index + practice
def simple(name, extra_css=(), scripts=()):
    html = r(name)
    css = BASE_CSS + "\n" + "\n".join(r(c) for c in extra_css)
    js = "\n".join(f"<script>\n{r(s)}\n</script>" for s in scripts)
    html = (html.replace("<!--@FONTS-->", FONTS)
                .replace("<!--@CSS-->", css)
                .replace("<!--@ICONS-->", ICONS)
                .replace("<!--@SCRIPTS-->", js))
    (OUT / name).write_text(html)

simple("index.html", extra_css=("index.css",), scripts=("index-core.js",))
simple("practice.html", extra_css=("practice.css",),
       scripts=("katex-bundle.js", "archive.js", "practice-core.js"))

print("built:", *(p.name for p in sorted(OUT.glob("*.html"))))

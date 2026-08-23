#!/usr/bin/env python3
"""Rewrite the original resource-library markup into the new component markup."""
import re, pathlib, html

SRC = pathlib.Path(__file__).parent
UP  = pathlib.Path("/root/.claude/uploads/b6120003-eae3-53dd-9254-c424515a28a6")

EXT = '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-external"/></svg>'
BULB = '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-bulb"/></svg>'

TAG_CLASS = {
    'free':      'chip chip-xs chip-ok',
    'book':      'chip chip-xs',
    'essential': 'chip chip-xs chip-pri',
    'phase':     'chip chip-xs chip-pri',
    '':          'chip chip-xs',
}


def convert_card(inner: str) -> str:
    tags = re.findall(r'<span class="res-tag ?([a-z]*)">(.*?)</span>', inner)
    title = re.search(r'<div class="res-title">(.*?)</div>', inner, re.S)
    desc  = re.search(r'<div class="res-desc">(.*?)</div>', inner, re.S)
    link  = re.search(r'<a class="res-link" href="([^"]+)"[^>]*>(.*?)</a>', inner, re.S)
    note  = re.search(r'<div style="font-size:12px;color:var\(--text2\)">(.*?)</div>', inner, re.S)

    out = ['<article class="res-card">']
    if tags:
        chips = ''.join(f'<span class="{TAG_CLASS.get(k, TAG_CLASS[""])}">{v}</span>' for k, v in tags)
        out.append(f'      <div class="res-tags">{chips}</div>')
    if title:
        out.append(f'      <h4 class="res-title">{title.group(1).strip()}</h4>')
    if desc:
        out.append(f'      <p class="res-desc">{desc.group(1).strip()}</p>')
    if link:
        url = link.group(1)
        label = link.group(2).replace('→', '').replace('&rarr;', '').strip()
        out.append(f'      <a class="res-link" href="{url}" target="_blank" rel="noopener">{label} {EXT}</a>')
    elif note:
        out.append(f'      <p class="res-note">{note.group(1).strip()}</p>')
    out.append('    </article>')
    return '\n'.join(out)


def convert_library(raw: str) -> str:
    """res-sec + res-grid blocks -> lib-sec sections."""
    blocks = []
    pattern = re.compile(
        r'<div class="res-sec">(.*?)</div>\s*<div class="res-grid">(.*?)</div>\s*(?=<div class="res-sec">|$)',
        re.S)
    for m in pattern.finditer(raw):
        name = m.group(1).strip()
        body = m.group(2)
        cards = re.findall(r'<div class="res-card">(.*?)</div>\s*(?=<div class="res-card">|$)', body, re.S)
        if not cards:
            cards = re.split(r'<div class="res-card">', body)[1:]
        rendered = '\n    '.join(convert_card(c) for c in cards)
        blocks.append(
            f'  <section class="lib-sec">\n'
            f'    <h3>{name}</h3>\n'
            f'    <div class="res-grid">\n    {rendered}\n    </div>\n'
            f'  </section>')
    return '\n'.join(blocks)


def convert_flow(raw: str, heading: str) -> str:
    steps = re.findall(
        r'<div class="rp-num">(\d+)</div>\s*<div class="rp-content">(.*?)</div>', raw, re.S)
    rows = []
    for num, body in steps:
        body = body.strip()
        body = re.sub(r'<strong>(.*?)</strong>\s*—\s*', r'<strong>\1</strong>', body, flags=re.S)
        rows.append(
            f'    <div class="flow-step">\n'
            f'      <span class="flow-num">{num}</span>\n'
            f'      <div class="flow-body">{body}</div>\n'
            f'    </div>')
    return ('<section class="card">\n'
            f'  <div class="card-head"><p class="overline">{heading}</p></div>\n'
            '  <div class="flow">\n' + '\n'.join(rows) + '\n  </div>\n</section>')


ioaa_raw = (UP / '87b756c7-ioaastudy.html').read_text()
ipho_raw = (UP / '5b18917e-iphostudy.html').read_text()

ioaa_lib = '\n'.join(ioaa_raw.splitlines()[555:591])
ipho_lib = '\n'.join(ipho_raw.splitlines()[631:674])
ipho_rp  = '\n'.join(ipho_raw.splitlines()[409:436])

(SRC / 'lib-ioaa.html').write_text(convert_library(ioaa_lib) + '\n')
(SRC / 'lib-ipho.html').write_text(convert_library(ipho_lib) + '\n')
(SRC / 'flow-ipho.html').write_text(convert_flow(ipho_rp, 'Reading pattern — the path to Monarch') + '\n')

for f in ('lib-ioaa.html', 'lib-ipho.html', 'flow-ipho.html'):
    t = (SRC / f).read_text()
    print(f, len(t), 'cards:', t.count('res-card'), 'steps:', t.count('flow-step'))

# -*- coding: utf-8 -*-
"""把 redlayer/figNN-red-K.png 分片以 base64 <image> 内嵌进 ahb-fig03~05.svg,
删除手绘红虚线(path.wr / polygon.arr), 保留矢量红色文字。幂等。
"""
import base64
import json
import os

ROOT = os.path.dirname(os.path.abspath(__file__))


def embed(name):
    svg_path = os.path.join(ROOT, "public", "fig", f"ahb-{name}.svg")
    meta = json.load(open(os.path.join(ROOT, "redlayer", f"{name}-pieces.json")))
    imgs = ["  <!-- 原图红层提取叠加(虚线+箭头), 分片仿射 -->"]
    for pm in meta:
        b64 = base64.b64encode(
            open(os.path.join(ROOT, "redlayer", pm["file"]), "rb").read()).decode()
        imgs.append(
            f'  <image x="{pm["x"]:.1f}" y="{pm["y"]:.1f}" width="{pm["w"]:.1f}" '
            f'height="{pm["h"]:.1f}" preserveAspectRatio="none" '
            f'href="data:image/png;base64,{b64}"/>')
    lines = open(svg_path, encoding="utf-8").read().splitlines()
    out = []
    inserted = False
    skip_img = False
    for ln in lines:
        s = ln.strip()
        if s.startswith('<path class="wr"') or s.startswith('<polygon class="arr"'):
            continue
        if '原图红层提取叠加' in ln:
            skip_img = True
            continue
        if skip_img and s.startswith('<image '):
            continue
        skip_img = False
        out.append(ln)
        if (not inserted) and "电流路径高亮" in ln:
            out.extend(imgs)
            inserted = True
    open(svg_path, "w", encoding="utf-8").write("\n".join(out) + "\n")
    print("embedded", name, len(meta), "pieces")


if __name__ == "__main__":
    for k in ("fig03", "fig04", "fig05"):
        embed(k)

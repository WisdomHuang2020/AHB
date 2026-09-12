# -*- coding: utf-8 -*-
"""生成 ahb-fig06/07/08.svg —— AHB 反激工作阶段等效电路(手工矢量重绘)
同一底图布局,仅高亮路径/灰化/标注随阶段变化。
"""
import os

BLACK = "#000"
GREY = "#BCBCBC"
RED = "#C0392B"

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public", "fig")


def vt(x, y, main, sub=None, fill=BLACK, size=26, rotate=None, anchor=None):
    """变量文本:斜体 serif,可带下标。"""
    a = f'<text x="{x}" y="{y}" font-family="Georgia,\'Times New Roman\',serif" font-style="italic" font-size="{size}" fill="{fill}"'
    if anchor:
        a += f' text-anchor="{anchor}"'
    if rotate:
        a += f' transform="rotate({rotate} {x} {y})"'
    a += f'>{main}'
    if sub:
        a += f'<tspan dy="6" font-size="65%">{sub}</tspan>'
    return a + '</text>'


def p(d, stroke=BLACK, w=2.2, dash=None, cap="round"):
    s = f'<path d="{d}" stroke="{stroke}" stroke-width="{w}" fill="none" stroke-linecap="{cap}"'
    if dash:
        s += f' stroke-dasharray="{dash}"'
    return s + '/>'


def dot(x, y, fill=BLACK):
    return f'<circle cx="{x}" cy="{y}" r="4" fill="{fill}"/>'


def tri(points, fill=BLACK):
    return f'<polygon points="{points}" fill="{fill}"/>'


def mosfet(yd, c_sym, c_gate, c_box, c_diode, c_cap):
    """N-MOSFET(栅朝左) + 右侧并联盒(体二极管 || CDS)。yd=漏极 y,源极 yd+55。"""
    ys = yd + 55
    f = []
    # 漏/源极引出线(从竖母线 x=245 向左)
    f.append(p(f"M245,{yd} L221,{yd}", c_sym, 2.2))
    f.append(p(f"M245,{ys} L221,{ys}", c_sym, 2.2))
    # 沟道三段竖线
    f.append(p(f"M221,{yd-5} L221,{yd+18} M221,{yd+26} L221,{yd+42} M221,{yd+49} L221,{ys+5}", c_sym, 2.5))
    # 栅极竖条 + 栅极引线(向左)
    f.append(p(f"M213,{yd+8} L213,{ys-8}", c_sym, 2.5))
    f.append(p(f"M213,{yd+28} L160,{yd+28}", c_gate, 2.2))
    # 并联盒
    f.append(p(f"M245,{yd} L291,{yd} L291,{ys} L245,{ys}", c_box, 2.2))
    # 体二极管(阳极在下,阴极在上)
    f.append(p(f"M263,{yd} L263,{yd+14}", c_diode, 2.2))
    f.append(p(f"M255,{yd+14} L271,{yd+14}", c_diode, 2.5))
    f.append(tri(f"255,{yd+32} 271,{yd+32} 263,{yd+16}", c_diode))
    f.append(p(f"M263,{yd+32} L263,{ys}", c_diode, 2.2))
    # CDS 电容
    f.append(p(f"M279,{yd} L279,{yd+22}", c_cap, 2.2))
    f.append(p(f"M270,{yd+24} L288,{yd+24}", c_cap, 2.5))
    f.append(p(f"M270,{yd+34} L288,{yd+34}", c_cap, 2.5))
    f.append(p(f"M279,{yd+34} L279,{ys}", c_cap, 2.2))
    return "\n  ".join(f)


def base(cfg):
    """公共底图。cfg 控制各部分颜色(黑/灰)。"""
    f = []
    # ---------- 输入源回路 ----------
    f.append(p("M75,218 L75,20 L245,20", cfg["vin"], 2.2))          # 源顶 -> 顶母线
    f.append(p("M245,20 L245,130", cfg["vin"], 2.2))                 # 母线上段(至 S1 漏)
    f.append(p("M75,272 L75,455 L245,455", cfg["vin"], 2.2))         # 源底 -> 底母线左段
    f.append(f'<circle cx="75" cy="245" r="27" stroke="{cfg["vin"]}" stroke-width="2.5" fill="none"/>')
    f.append(p("M69,232 L81,232 M75,226 L75,238", cfg["vin"], 2.2))  # 源内 +
    f.append(p("M69,260 L81,260", cfg["vin"], 2.2))                  # 源内 −
    f.append(vt(22, 252, "V", "in", cfg["vin"], 26))
    # ---------- 半桥 ----------
    f.append(mosfet(130, cfg["s1"], cfg["s1"], cfg["s1box"], cfg["s1dio"], cfg["cds1"]))
    f.append(mosfet(295, cfg["s2"], cfg["s2"], cfg["s2box"], cfg["s2dio"], cfg["cds2"]))
    f.append(vt(168, 146, "S", "1", cfg["s1"], 26))
    f.append(vt(300, 152, "C", "DS1", cfg["cds1"], 24))
    f.append(vt(168, 311, "S", "2", cfg["s2"], 26))
    f.append(vt(300, 317, "C", "DS2", cfg["cds2"], 24))
    # 母线中段/下段 + Vmid 节点
    f.append(p("M245,185 L245,295", BLACK, 2.2))
    f.append(p("M245,350 L245,455", BLACK, 2.2))
    f.append(dot(245, 262))
    f.append(dot(245, 455))
    f.append(vt(*cfg["vmid_xy"], "V", "mid", BLACK, 26))
    # ---------- Lr + 顶线 ----------
    f.append(p("M245,262 L370,262", BLACK, 2.2))
    f.append(p("M370,262 a11,11 0 0 1 22,0 a11,11 0 0 1 22,0 a11,11 0 0 1 22,0 a11,11 0 0 1 22,0", BLACK, 2.5))
    f.append(p("M458,262 L640,262", BLACK, 2.2))
    f.append(vt(398, 238, "L", "r", BLACK, 26))
    # ---------- 变压器 ----------
    f.append(dot(640, 262))
    f.append(p("M640,262 L640,285", BLACK, 2.2))
    f.append(p("M640,285 a16,15 0 0 0 0,30 a16,15 0 0 0 0,30 a16,15 0 0 0 0,30 a16,15 0 0 0 0,30 a16,15 0 0 0 0,30", BLACK, 2.5))
    f.append(p("M640,435 L640,455", BLACK, 2.2))
    f.append(dot(640, 455))
    f.append(p("M700,282 L700,438", BLACK, 2.5))   # 铁芯
    f.append(p("M713,282 L713,438", BLACK, 2.5))
    f.append(p("M735,265 L735,285", BLACK, 2.2))
    f.append(p("M735,285 a16,15 0 0 1 0,30 a16,15 0 0 1 0,30 a16,15 0 0 1 0,30 a16,15 0 0 1 0,30 a16,15 0 0 1 0,30", BLACK, 2.5))
    f.append(p("M735,435 L735,455", BLACK, 2.2))
    # 同名端 * / T / 匝比
    f.append(f'<text x="666" y="300" font-family="Georgia,serif" font-size="28" fill="{BLACK}">*</text>')
    f.append(f'<text x="712" y="472" font-family="Georgia,serif" font-size="28" fill="{BLACK}">*</text>')
    f.append(vt(666, 474, "T", None, BLACK, 26))
    f.append(vt(545, 385, "L", "m", BLACK, 26))
    f.append(vt(662, 392, "n", None, BLACK, 26))
    f.append(vt(720, 382, "1", None, BLACK, 26))
    # ---------- 底母线 + Cr ----------
    f.append(p("M245,455 L392,455", BLACK, 2.2))
    f.append(p("M392,438 L392,472", BLACK, 2.5))
    f.append(p("M408,438 L408,472", BLACK, 2.5))
    f.append(p("M408,455 L640,455", BLACK, 2.2))
    f.append(vt(412, 442, "C", "r", BLACK, 26))
    # ---------- 副边整流 ----------
    f.append(p("M735,265 L812,265", BLACK, 2.2))
    f.append(tri("812,251 812,279 842,265", cfg["d1"]))              # D1 三角
    f.append(p("M842,249 L842,281", cfg["d1"], 2.5))                 # D1 阴极杠
    f.append(vt(806, 236, "D", "1", cfg["d1"], 26))
    f.append(p("M842,265 L1095,265", BLACK, 2.2))
    f.append(dot(960, 265))
    # Co 支路
    f.append(p("M960,265 L960,368", BLACK, 2.2))
    f.append(p("M938,370 L982,370", BLACK, 2.5))
    f.append(p("M938,384 L982,384", BLACK, 2.5))
    f.append(p("M960,384 L960,455", BLACK, 2.2))
    f.append(dot(960, 455))
    f.append(vt(896, 384, "C", "o", BLACK, 26))
    # 负载
    f.append(p("M1095,265 L1095,300", BLACK, 2.2))
    f.append(f'<rect x="1081" y="300" width="28" height="120" fill="#fff" stroke="{BLACK}" stroke-width="2.2"/>')
    f.append(p("M1095,420 L1095,455", BLACK, 2.2))
    f.append(p("M1095,455 L735,455", BLACK, 2.2))
    # Vo 标注
    f.append(f'<text x="1114" y="314" font-family="Georgia,serif" font-size="24" fill="{BLACK}">+</text>')
    f.append(f'<text x="1114" y="436" font-family="Georgia,serif" font-size="24" fill="{BLACK}">−</text>')
    f.append(vt(1130, 332, "V", "o", BLACK, 26, rotate=90))
    return "\n  ".join(f)


def loop_primary_fig06():
    f = []
    f.append(p("M293,295 L452,295 Q460,295 460,303 L460,407 Q460,415 452,415 "
               "L293,415 Q285,415 285,407 L285,303 Q285,295 293,295 Z", RED, 2.2, dash="9 7"))
    # S2 导通向上箭头(独立,位于 S2 并联盒处)
    f.append(p("M273,370 L273,334", RED, 2.5))
    f.append(tri("266,336 280,336 273,318", RED))
    return "\n  ".join(f)


def loop_outer(left_arrow=True, up_arrow=True):
    """经电源的大回路:Vmid 上 -> 顶 -> 左 -> 下 -> 回 Vmid。"""
    f = [p("M240,258 L240,40 Q240,28 228,28 L157,28 Q145,28 145,40 "
           "L145,242 Q145,254 157,254 L236,254", RED, 2.2, dash="9 7")]
    if up_arrow:
        f.append(tri("233,124 247,124 240,106", RED))
    if left_arrow:
        f.append(tri("200,21 200,35 184,28", RED))
    return "\n  ".join(f)


def loop_ilr_fig07():
    """fig07 Ilr 回路:带左边(经 CDS2 向下)及底部左延。"""
    f = [p("M240,292 L457,292 Q465,292 465,300 L465,407 Q465,415 457,415 L115,415",
           RED, 2.2, dash="9 7")]
    f.append(p("M215,292 L215,415", RED, 2.2, dash="9 7"))
    f.append(tri("208,376 222,376 215,392", RED))   # 向下箭头
    return "\n  ".join(f)


def loop_ilr_fig08():
    """fig08 Ilr 回路:开环,底部延至电源侧。"""
    return p("M240,292 L457,292 Q465,292 465,300 L465,407 Q465,415 457,415 L115,415",
             RED, 2.2, dash="9 7")


def ilm_arrow(direction):
    """Ilm 红色虚线箭头,direction: down / up。"""
    if direction == "down":
        return "\n  ".join([p("M652,305 L652,398", RED, 2.2, dash="9 7"),
                            tri("645,396 659,396 652,412", RED),
                            vt(660, 340, "I", "lm", RED, 24)])
    return "\n  ".join([p("M652,312 L652,405", RED, 2.2, dash="9 7"),
                        tri("645,314 659,314 652,298", RED),
                        vt(660, 340, "I", "lm", RED, 24)])


def vlm(sign_top):
    """Vlm 标注;sign_top: '-' 或 '+'。"""
    sign_bot = "+" if sign_top == "-" else "-"
    return "\n  ".join([
        f'<text x="598" y="248" font-family="Georgia,serif" font-size="26" fill="{RED}">{sign_top if sign_top=="+" else "−"}</text>',
        vt(626, 250, "V", "lm", RED, 26),
        f'<text x="598" y="502" font-family="Georgia,serif" font-size="26" fill="{RED}">{sign_bot if sign_bot=="+" else "−"}</text>',
    ])


def loop_id():
    f = [p("M778,300 L1037,300 Q1045,300 1045,308 L1045,417 Q1045,425 1037,425 "
           "L778,425 Q770,425 770,417 L770,308 Q770,300 778,300 Z", RED, 2.2, dash="9 7")]
    f.append(tri("763,364 777,364 770,348", RED))   # 左边向上箭头
    f.append(vt(795, 408, "I", "d", RED, 26))
    return "\n  ".join(f)


def loop_io(box, arrow_x, label):
    x1, y1, x2, y2 = box
    f = [p(f"M{x1+8},{y1} L{x2-8},{y1} Q{x2},{y1} {x2},{y1+8} L{x2},{y2-8} Q{x2},{y2} {x2-8},{y2} "
           f"L{x1+8},{y2} Q{x1},{y2} {x1},{y2-8} L{x1},{y1+8} Q{x1},{y1} {x1+8},{y1} Z",
           RED, 2.2, dash="9 7")]
    f.append(tri(f"{arrow_x-7},{y1+64} {arrow_x+7},{y1+64} {arrow_x},{y1+48}", RED))
    f.append(vt(*label, "I", "O", RED, 26))
    return "\n  ".join(f)


def ilr_label():
    return vt(415, 340, "I", "lr", RED, 26)


def build(name, cfg, extras):
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1160 520" width="1160" height="520">
  <rect x="0" y="0" width="1160" height="520" fill="#ffffff"/>
  {base(cfg)}
  {extras}
</svg>
'''
    path = os.path.join(OUT, name)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(svg)
    print("written", path)


# ---------------- fig06:阶段4 能量传递,S2 导通 ----------------
cfg06 = dict(vin=GREY, s1=GREY, s1box=GREY, s1dio=GREY, cds1=GREY,
             s2=BLACK, s2box=BLACK, s2dio=BLACK, cds2=GREY, d1=BLACK,
             vmid_xy=(150, 270))
extras06 = "\n  ".join([loop_primary_fig06(), ilm_arrow("down"), vlm("-"),
                        loop_id(), loop_io((1003, 312, 1068, 423), 1003, (1022, 358)),
                        ilr_label()])
build("ahb-fig06.svg", cfg06, extras06)

# ---------------- fig07:阶段5 S2 ZVS / Id->0 ----------------
cfg07 = dict(vin=BLACK, s1=GREY, s1box=BLACK, s1dio=BLACK, cds1=BLACK,
             s2=GREY, s2box=BLACK, s2dio=BLACK, cds2=BLACK, d1=BLACK,
             vmid_xy=(150, 282))
extras07 = "\n  ".join([loop_outer(True, True), loop_ilr_fig07(), ilm_arrow("up"), vlm("-"),
                        loop_id(), loop_io((1003, 312, 1068, 423), 1003, (1022, 358)),
                        ilr_label()])
build("ahb-fig07.svg", cfg07, extras07)

# ---------------- fig08:阶段6 S1 体二极管导通 ----------------
cfg08 = dict(vin=BLACK, s1=GREY, s1box=GREY, s1dio=BLACK, cds1=GREY,
             s2=GREY, s2box=GREY, s2dio=GREY, cds2=GREY, d1=GREY,
             vmid_xy=(150, 282))
extras08 = "\n  ".join([loop_outer(True, False), loop_ilr_fig08(), ilm_arrow("up"), vlm("+"),
                        loop_io((1000, 300, 1072, 425), 1000, (1026, 354)),
                        ilr_label()])
build("ahb-fig08.svg", cfg08, extras08)

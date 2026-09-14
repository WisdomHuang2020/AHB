# -*- coding: utf-8 -*-
"""从原图提取红色虚线层, 按区域分片(每片独立 x 仿射, y 全图统一),
输出 redlayer/figNN-red-K.png(全尺寸透明 PNG) + redlayer/pieces.json(嵌入参数)。
x_svg = a*x_orig + b ; y_svg = c*y_orig + d
"""
import json
import os
import numpy as np
from PIL import Image
from scipy import ndimage

SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), "AHB反激式原理介绍_配图")
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "redlayer")
os.makedirs(OUT, exist_ok=True)

FIGS = {
    "fig03": "fig03_阶段1_t0-t1.jpg",
    "fig04": "fig04_阶段2_t1-t2.jpg",
    "fig05": "fig05_阶段3_t2-t3.jpg",
    "fig06": "fig06_阶段4_t3-t4.jpg",
    "fig07": "fig07_阶段5_t4-t5.jpg",
    "fig08": "fig08_阶段6_t5-t7.jpg",
}

MASKS = {
    "fig03": [(535, 205, 650, 252), (596, 285, 645, 330), (438, 288, 472, 330),
              (1018, 296, 1066, 342), (536, 452, 568, 480)],
    "fig04": [(545, 218, 658, 262), (601, 296, 645, 340), (438, 302, 478, 342),
              (1033, 302, 1076, 360), (540, 465, 576, 502)],
    "fig05": [(434, 208, 546, 250), (491, 284, 534, 326), (333, 285, 366, 328),
              (695, 360, 730, 405), (918, 303, 958, 346), (432, 454, 460, 486)],
    "fig06": [(545, 230, 660, 276), (602, 308, 650, 352), (440, 310, 476, 356),
              (812, 388, 848, 432), (1038, 330, 1080, 374), (540, 480, 580, 520),
              (700, 452, 714, 470)],
    "fig07": [(524, 214, 634, 258), (580, 296, 620, 336), (417, 296, 452, 335),
              (781, 362, 816, 407), (1004, 306, 1044, 350), (518, 458, 554, 495)],
    "fig08": [(514, 216, 630, 262), (577, 296, 618, 342), (416, 298, 454, 338),
              (1012, 306, 1034, 346), (1034, 322, 1054, 356), (518, 466, 546, 488)],
}

# 每图: y 全局 (c,d) + 分片 [(rects[(x0,y0,x1,y1)...], a, b), ...]
# rect 之间必须不相交(跨片), 虚线段不被 rect 边界切割
PIECES = {
    "fig03": dict(y=(1.0, 10.0), pieces=[
        ([(0, 0, 218, 290)], 1.0, 0.0),          # S1 环
        ([(218, 240, 700, 440)], 0.7803, 90.0),  # Ilr 环 + Ilm
        ([(700, 240, 1161, 460)], 0.85, 139.0),  # Io 环
    ]),
    "fig04": dict(y=(0.9208, 52.2), pieces=[
        ([(0, 0, 260, 292)], 1.0, 3.0),          # 左上进 Vmid 环
        ([(260, 55, 340, 292)], 1.0, 31.0),      # CDS1 段
        ([(260, 310, 340, 417)], 1.0, 31.0),     # CDS2 段
        ([(180, 292, 340, 310), (340, 285, 700, 440), (0, 417, 340, 440)],
         0.7811, 87.1),                          # Ilr 环 + Ilm
        ([(700, 250, 1179, 445)], 0.9659, 5.5),  # Io 环
    ]),
    "fig05": dict(y=(1.0743, -1.2), pieces=[
        ([(0, 240, 560, 440)], 0.6415, 226.5),   # Ilr 环 + Ilm
        ([(560, 240, 1060, 440)], 1.0304, 12.6), # Id + Io 环
    ]),
    "fig06": dict(y=(0.919, 36.8), pieces=[
        ([(0, 240, 700, 470)], 1.1518, -23.9),   # Ilr 环 + Ilm
        ([(700, 250, 1185, 470)], 0.95, 26.4),   # Id + Io 环
    ]),
    "fig07": dict(y=(1.0722, -11.4), pieces=[
        ([(0, 0, 260, 280)], 1.0, 5.0),          # 左上环
        ([(260, 40, 340, 300)], 1.0, 4.0),       # CDS1 段
        ([(260, 300, 340, 430)], 1.0, 4.0),      # CDS2 段
        ([(180, 282, 700, 440), (0, 400, 180, 440)], 1.0877, 37.9),  # Ilr 环 + Ilm
        ([(700, 240, 1162, 440)], 0.8667, 119.8),  # Id + Io 环
    ]),
    "fig08": dict(y=(1.0604, -8.4), pieces=[
        ([(0, 0, 260, 300)], 1.0, 5.0),          # 左上环
        ([(180, 280, 700, 445), (0, 400, 180, 445)], 1.0993, 32.3),  # Ilr 环 + Ilm
        ([(700, 250, 1153, 445)], 0.7711, 249.6),  # Io 环
    ]),
}

RED_RGB = (192, 57, 43)


def extract(name):
    img = np.asarray(Image.open(os.path.join(SRC, FIGS[name])).convert("RGB")).astype(np.int16)
    H, W = img.shape[:2]
    r, g, b = img[..., 0], img[..., 1], img[..., 2]
    redness = r - (g + b) / 2.0
    m = (redness > 22) & (r > 125)
    lab, n = ndimage.label(m)
    if n:
        sizes = ndimage.sum(m, lab, range(1, n + 1))
        kill = {i + 1 for i, s in enumerate(sizes) if s < 6}
        if kill:
            m[np.isin(lab, list(kill))] = False
    alpha = np.clip((redness - 10) / 38.0, 0, 1) * 255
    alpha[~m] = 0
    for (x0, y0, x1, y1) in MASKS[name]:
        alpha[y0:y1, x0:x1] = 0

    cfg = PIECES[name]
    c, d = cfg["y"]
    meta = []
    for k, (rects, a, bb) in enumerate(cfg["pieces"]):
        pm = np.zeros((H, W), bool)
        for (x0, y0, x1, y1) in rects:
            pm[y0:y1, x0:x1] = True
        pa = np.where(pm, alpha, 0).astype(np.uint8)
        rgba = np.zeros((H, W, 4), dtype=np.uint8)
        rgba[..., 0], rgba[..., 1], rgba[..., 2] = RED_RGB
        rgba[..., 3] = pa
        fn = f"{name}-red-{k}.png"
        Image.fromarray(rgba).save(os.path.join(OUT, fn))
        meta.append(dict(file=fn, x=bb, y=d, w=a * W, h=c * H))
        # 预览(白底)
        bg = np.full((H, W, 3), 255, np.uint8)
        af = pa[..., None].astype(np.float32) / 255
        comp = (rgba[..., :3] * af + bg * (1 - af)).astype(np.uint8)
        Image.fromarray(comp).save(os.path.join(OUT, f"{name}-red-{k}-preview.png"))
    json.dump(meta, open(os.path.join(OUT, f"{name}-pieces.json"), "w"))
    print(name, "pieces:", len(meta))


if __name__ == "__main__":
    for k in FIGS:
        extract(k)

import base64, pathlib

root = pathlib.Path(__file__).parent
png = root / "AHB反激式原理介绍_配图" / "fig12_实测_副边Vds与Id.png"
b64 = base64.b64encode(png.read_bytes()).decode("ascii")

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 816 520" width="816" height="520">
  <style>
    .lg  {{ font: 15px 'Microsoft YaHei', 'SimHei', sans-serif; fill:#333; }}
    .lgr {{ font: 15px 'Microsoft YaHei', 'SimHei', sans-serif; fill:#C00000; }}
    .rd  {{ font: 14px Consolas, 'Courier New', monospace; fill:#455A64; }}
    .vds {{ stroke:#D4A017; stroke-width:3; fill:none; stroke-linecap:round; }}
    .id  {{ stroke:#1E88E5; stroke-width:3; fill:none; stroke-linecap:round; }}
  </style>

  <!-- 白底卡片 -->
  <rect x="0" y="0" width="816" height="520" fill="#ffffff"/>

  <!-- 原始示波器位图（波形逐像素保留，无叠加层） -->
  <image x="0" y="0" width="816" height="440"
         href="data:image/png;base64,{b64}"/>

  <!-- 分隔线 -->
  <path d="M0,447 L816,447" stroke="#CFD8DC" stroke-width="1"/>

  <!-- 矢量文字条：图例 -->
  <path class="vds" d="M24,472 L56,472"/>
  <text class="lg" x="64" y="477">副边 Vds（黄）</text>
  <path class="id" d="M196,472 L228,472"/>
  <text class="lg" x="236" y="477">副边电流 Id（蓝）</text>
  <text class="lgr" x="392" y="477">A 点 = 谐振峰值</text>
  <text class="lgr" x="560" y="477">B 点 = ZCS 判断点</text>

  <!-- 矢量文字条：读数 -->
  <text class="rd" x="24" y="506">V: 196.0 V&#160;&#160;&#160;&#916;V: 89.00 V&#160;&#160;&#160;&#916;t: 100.0 ns</text>
</svg>
'''

out = root / "public" / "fig" / "ahb-fig12.svg"
out.write_text(svg, encoding="utf-8")
print("written", out, out.stat().st_size, "bytes")

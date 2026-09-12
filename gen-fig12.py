import base64, pathlib

root = pathlib.Path(__file__).parent
png = root / "AHB反激式原理介绍_配图" / "fig12_实测_副边Vds与Id_高清.png"  # 1684x960
b64 = base64.b64encode(png.read_bytes()).decode("ascii")

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1684 1070" width="1684" height="1070">
  <style>
    .lg  {{ font: 30px 'Microsoft YaHei', 'SimHei', sans-serif; fill:#333; }}
    .lgr {{ font: 30px 'Microsoft YaHei', 'SimHei', sans-serif; fill:#C00000; }}
    .rd  {{ font: 28px Consolas, 'Courier New', monospace; fill:#455A64; }}
    .vds {{ stroke:#D4A017; stroke-width:6; fill:none; stroke-linecap:round; }}
    .id  {{ stroke:#1E88E5; stroke-width:6; fill:none; stroke-linecap:round; }}
  </style>

  <!-- 白底卡片 -->
  <rect x="0" y="0" width="1684" height="1070" fill="#ffffff"/>

  <!-- 原始示波器位图（波形逐像素保留，无叠加层） -->
  <image x="0" y="0" width="1684" height="960"
         href="data:image/png;base64,{b64}"/>

  <!-- 分隔线 -->
  <path d="M0,974 L1684,974" stroke="#CFD8DC" stroke-width="2"/>

  <!-- 矢量文字条：图例 -->
  <path class="vds" d="M48,1024 L112,1024"/>
  <text class="lg" x="128" y="1034">副边 Vds（黄）</text>
  <path class="id" d="M392,1024 L456,1024"/>
  <text class="lg" x="472" y="1034">副边电流 Id（蓝）</text>
  <text class="lgr" x="784" y="1034">A 点 = 谐振峰值</text>
  <text class="lgr" x="1120" y="1034">B 点 = ZCS 判断点</text>
</svg>
'''

out = root / "public" / "fig" / "ahb-fig12.svg"
out.write_text(svg, encoding="utf-8")
print("written", out, out.stat().st_size, "bytes")

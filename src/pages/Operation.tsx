import MathBlock from '@/components/MathBlock'
import InlineMath from '@/components/InlineMath'
import { Activity } from 'lucide-react'

/** 关键波形示意：Vsw、iLm、iSec、VQ1 驱动 */
function WaveformSvg() {
  const W = 760
  const left = 60
  const right = 730
  const span = right - left
  const d1 = left + span * 0.45 // 死区1结束 / Q1 导通
  const d2 = left + span * 0.5  // Q1 关断
  const d3 = left + span * 0.55 // Q2 导通
  const d4 = right - span * 0.05 // Q2 关断

  const row = (y: number) => `M ${left} ${y} L ${right} ${y}`

  return (
    <svg viewBox={`0 0 ${W} 420`} className="w-full h-auto" role="img" aria-label="AHB关键波形">
      {/* 时间轴虚线 */}
      {[d1, d2, d3, d4].map((x, i) => (
        <line key={i} x1={x} y1="30" x2={x} y2="390" stroke="#404040" strokeWidth="1" strokeDasharray="4 4" />
      ))}

      {/* Vgs Q1 */}
      <text x="8" y="72" fill="#a3a3a3" fontSize="12">Vgs Q1</text>
      <path d={row(80)} stroke="#262626" strokeWidth="1" fill="none" />
      <path
        d={`M ${left} 80 L ${d1} 80 L ${d1} 50 L ${d2} 50 L ${d2} 80 L ${right} 80`}
        fill="none" stroke="#14b8a6" strokeWidth="2"
      />

      {/* Vgs Q2 */}
      <text x="8" y="132" fill="#a3a3a3" fontSize="12">Vgs Q2</text>
      <path d={row(140)} stroke="#262626" strokeWidth="1" fill="none" />
      <path
        d={`M ${left} 140 L ${d3} 140 L ${d3} 110 L ${d4} 110 L ${d4} 140 L ${right} 140`}
        fill="none" stroke="#f59e0b" strokeWidth="2"
      />

      {/* Vsw */}
      <text x="8" y="192" fill="#a3a3a3" fontSize="12">Vsw</text>
      <path d={row(200)} stroke="#262626" strokeWidth="1" fill="none" />
      <path
        d={`M ${left} 170 L ${d2} 170 Q ${(d2 + d3) / 2} 210 ${d3} 200 L ${d4} 200 Q ${(d4 + right - 8) / 2} 165 ${right - 8} 170 L ${right} 170`}
        fill="none" stroke="#14b8a6" strokeWidth="2"
      />
      <text x={d2 + 8} y="222" fill="#737373" fontSize="10">谐振换流（死区）</text>

      {/* iLm */}
      <text x="8" y="262" fill="#a3a3a3" fontSize="12">i<tspan dy="3" fontSize="9">Lm</tspan></text>
      <path d={row(265)} stroke="#262626" strokeWidth="1" fill="none" />
      <path
        d={`M ${left} 250 L ${d2} 220 L ${d4} 300 L ${right} 250`}
        fill="none" stroke="#14b8a6" strokeWidth="2"
      />
      <line x1={left} y1="265" x2={right} y2="265" stroke="#404040" strokeWidth="1" strokeDasharray="6 4" />
      <text x={d2 + 6} y="214" fill="#14b8a6" fontSize="11">I<tspan dy="3" fontSize="8">pk</tspan></text>
      <text x={d4 - 66} y="318" fill="#f59e0b" fontSize="11">I<tspan dy="3" fontSize="8">valley</tspan>（&lt;0，ZVS 能量来源）</text>

      {/* iD 副边 */}
      <text x="8" y="362" fill="#a3a3a3" fontSize="12">i<tspan dy="3" fontSize="9">D</tspan></text>
      <path d={row(375)} stroke="#262626" strokeWidth="1" fill="none" />
      <path
        d={`M ${left} 375 L ${d3} 375 L ${d3} 330 L ${d4} 372 L ${right} 375`}
        fill="none" stroke="#f59e0b" strokeWidth="2"
      />
      <text x={(d3 + d4) / 2 - 30} y="322" fill="#a3a3a3" fontSize="10">副边二极管电流</text>

      {/* 模态标注 */}
      <text x={(left + d1) / 2 - 20} y="20" fill="#737373" fontSize="11">死区</text>
      <text x={(d1 + d2) / 2 - 30} y="20" fill="#14b8a6" fontSize="11">模态① Q1导通</text>
      <text x={(d2 + d3) / 2 - 20} y="20" fill="#737373" fontSize="11">死区</text>
      <text x={(d3 + d4) / 2 - 30} y="20" fill="#f59e0b" fontSize="11">模态② Q2导通</text>
    </svg>
  )
}

const modes = [
  {
    id: '①',
    title: 'Q1 导通（储能阶段，D·T）',
    color: 'text-primary-light',
    body: (
      <>
        <p>
          高边管 Q1 导通，开关节点 SW = V<InlineMath latex="_{in}" />。隔直电容电压
          <InlineMath latex="V_{Cb} = D V_{in}" /> 与输入叠加后，励磁电感承受正向电压
          <InlineMath latex="V_{in}(1-D)" />，励磁电流从谷值线性上升。
        </p>
        <p>
          此阶段副边二极管承受反压 <InlineMath latex="V_o + V_{in}/n" /> 而截止，
          输出负载由输出电容 <InlineMath latex="C_o" /> 供电。能量以磁场形式储存在变压器中。
        </p>
      </>
    ),
    math: String.raw`\frac{di_{Lm}}{dt} = \frac{V_{in}(1-D)}{L_m}`,
  },
  {
    id: '②',
    title: '死区 1（Q1 关断 → Q2 开通，谐振换流）',
    color: 'text-text-secondary',
    body: (
      <>
        <p>
          Q1 关断后，正向励磁峰值电流给开关节点等效电容 <InlineMath latex="C_{oss,eq}" />
          放电（Q2 的 Coss 放电、Q1 的 Coss 充电），Vsw 从 V<InlineMath latex="_{in}" /> 谐振下降到 0。
        </p>
        <p>
          当 Vsw 过零后 Q2 的体二极管导通，此时给 Q2 门极信号即为零电压开通。
          死区时间必须大于谐振换流所需时间。
        </p>
      </>
    ),
    math: String.raw`t_{dead} \;\ge\; \frac{\pi}{2}\sqrt{L_m C_{oss,eq}}`,
  },
  {
    id: '③',
    title: 'Q2 导通（释能阶段，(1−D)·T）',
    color: 'text-accent-light',
    body: (
      <>
        <p>
          低边管 Q2 导通，SW = 0，励磁电感承受反向电压 <InlineMath latex="-D V_{in}" />
          （等于副边反射电压 <InlineMath latex="-n(V_o+V_d)" />），励磁电流线性下降。
        </p>
        <p>
          副边二极管正偏导通，变压器储存的能量释放到输出。励磁电流过零后继续下降，
          在关断时刻形成负向谷值电流 <InlineMath latex="I_{valley}" />。
        </p>
      </>
    ),
    math: String.raw`\frac{di_{Lm}}{dt} = -\frac{n(V_o + V_d)}{L_m} = -\frac{D\,V_{in}}{L_m}`,
  },
  {
    id: '④',
    title: '死区 2（Q2 关断 → Q1 开通，谐振换流）',
    color: 'text-text-secondary',
    body: (
      <>
        <p>
          Q2 关断后，负向谷值电流 <InlineMath latex="I_{valley}" /> 成为换流动力：
          它把开关节点电容的电荷抽走，Vsw 从 0 谐振上升到 V<InlineMath latex="_{in}" />，
          Q1 体二极管导通后 Q1 零电压开通。
        </p>
        <p>
          这是 AHB 反激最关键的瞬间：只有 <InlineMath latex="I_{valley}" />
          储能足够（½·L<InlineMath latex="_m" />·I<InlineMath latex="_{valley}" />²
          ≥ ½·C<InlineMath latex="_{oss,eq}" />·V<InlineMath latex="_{in}" />²），
          高压侧的 ZVS 才能完成。
        </p>
      </>
    ),
    math: String.raw`\frac{1}{2} L_m I_{valley}^2 \;\ge\; \frac{1}{2} C_{oss,eq} V_{in}^2`,
  },
]

export default function Operation() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-text-primary mb-2">工作原理</h1>
      <p className="text-text-secondary mb-10">一个开关周期内 AHB 反激的四个工作模态与关键波形。</p>

      <section className="mb-12">
        <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary-light" /> 关键波形
        </h2>
        <div className="card-surface p-6">
          <WaveformSvg />
          <p className="text-text-muted text-sm mt-4">
            上排：Q1/Q2 互补驱动信号（含死区）；中排：开关节点电压 Vsw 在死区内谐振换流；
            下排：励磁电流 i<sub>Lm</sub> 双向摆动，负向谷值为 ZVS 提供能量；副边二极管仅在 Q2 导通期间流过电流。
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-text-primary mb-6">开关模态分析</h2>
        <div className="space-y-6">
          {modes.map((m) => (
            <div key={m.id} className="derivation-step">
              <div className="derivation-step-marker">{m.id}</div>
              <div className="derivation-step-content">
                <h3 className={`font-semibold mb-3 ${m.color}`}>{m.title}</h3>
                <div className="space-y-3 text-text-secondary text-sm leading-relaxed">
                  {m.body}
                </div>
                <MathBlock latex={m.math} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

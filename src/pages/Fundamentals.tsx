import MathBlock from '@/components/MathBlock'
import InlineMath from '@/components/InlineMath'
import { Zap, GitCompare, Layers, Lightbulb } from 'lucide-react'

/** AHB 反激拓扑结构 SVG 示意图 */
function TopologySvg() {
  return (
    <svg viewBox="0 0 760 340" className="w-full h-auto" role="img" aria-label="AHB反激拓扑结构图">
      {/* 输入 */}
      <line x1="40" y1="60" x2="180" y2="60" stroke="#525252" strokeWidth="2" />
      <line x1="40" y1="300" x2="180" y2="300" stroke="#525252" strokeWidth="2" />
      <text x="40" y="45" fill="#f5f5f5" fontSize="14">V<tspan dy="4" fontSize="10">in</tspan></text>
      {/* 高边 Q1 */}
      <rect x="180" y="60" width="70" height="60" rx="6" fill="#171717" stroke="#14b8a6" strokeWidth="2" />
      <text x="215" y="95" fill="#f5f5f5" fontSize="14" textAnchor="middle">Q1</text>
      {/* 低边 Q2 */}
      <rect x="180" y="240" width="70" height="60" rx="6" fill="#171717" stroke="#f59e0b" strokeWidth="2" />
      <text x="215" y="275" fill="#f5f5f5" fontSize="14" textAnchor="middle">Q2</text>
      {/* 桥臂中点 SW */}
      <line x1="180" y1="120" x2="180" y2="240" stroke="#525252" strokeWidth="2" />
      <line x1="250" y1="90" x2="250" y2="150" stroke="#525252" strokeWidth="2" />
      <line x1="250" y1="270" x2="250" y2="210" stroke="#525252" strokeWidth="2" />
      <line x1="250" y1="180" x2="330" y2="180" stroke="#525252" strokeWidth="2" />
      <circle cx="250" cy="180" r="4" fill="#14b8a6" />
      <text x="258" y="170" fill="#a3a3a3" fontSize="12">SW</text>
      {/* 隔直电容 Cb */}
      <line x1="330" y1="180" x2="370" y2="180" stroke="#525252" strokeWidth="2" />
      <line x1="370" y1="158" x2="370" y2="202" stroke="#f59e0b" strokeWidth="3" />
      <line x1="382" y1="158" x2="382" y2="202" stroke="#f59e0b" strokeWidth="3" />
      <line x1="382" y1="180" x2="420" y2="180" stroke="#525252" strokeWidth="2" />
      <text x="356" y="150" fill="#fbbf24" fontSize="13">C<tspan dy="4" fontSize="9">b</tspan></text>
      {/* 变压器原边 */}
      <line x1="420" y1="180" x2="450" y2="180" stroke="#525252" strokeWidth="2" />
      <path d="M450 180 a14 14 0 0 1 28 0 a14 14 0 0 1 28 0 a14 14 0 0 1 28 0" fill="none" stroke="#14b8a6" strokeWidth="2" />
      <line x1="534" y1="180" x2="560" y2="180" stroke="#525252" strokeWidth="2" />
      <line x1="560" y1="180" x2="560" y2="300" stroke="#525252" strokeWidth="2" />
      <line x1="180" y1="300" x2="560" y2="300" stroke="#525252" strokeWidth="2" />
      <circle cx="456" cy="160" r="3.5" fill="#f5f5f5" />
      <text x="478" y="160" fill="#a3a3a3" fontSize="12">L<tspan dy="4" fontSize="9">m</tspan> + L<tspan dy="4" fontSize="9">r</tspan></text>
      {/* 变压器副边 */}
      <path d="M590 180 a14 14 0 0 1 28 0 a14 14 0 0 1 28 0 a14 14 0 0 1 28 0" fill="none" stroke="#14b8a6" strokeWidth="2" />
      <line x1="590" y1="180" x2="560" y2="180" stroke="#525252" strokeWidth="0" />
      <line x1="674" y1="180" x2="700" y2="180" stroke="#525252" strokeWidth="2" />
      <line x1="590" y1="180" x2="560" y2="180" stroke="none" />
      <circle cx="668" cy="160" r="3.5" fill="#f5f5f5" />
      {/* 磁芯 */}
      <line x1="556" y1="150" x2="584" y2="150" stroke="#737373" strokeWidth="2" />
      <line x1="556" y1="210" x2="584" y2="210" stroke="#737373" strokeWidth="2" />
      {/* 副边回路与二极管 */}
      <line x1="700" y1="180" x2="700" y2="120" stroke="#525252" strokeWidth="2" />
      <polygon points="690,120 710,120 700,104" fill="none" stroke="#f59e0b" strokeWidth="2" />
      <line x1="690" y1="104" x2="710" y2="104" stroke="#f59e0b" strokeWidth="3" />
      <line x1="700" y1="104" x2="700" y2="80" stroke="#525252" strokeWidth="2" />
      <line x1="700" y1="80" x2="740" y2="80" stroke="#525252" strokeWidth="2" />
      <text x="712" y="122" fill="#fbbf24" fontSize="13">D</text>
      {/* 输出 */}
      <line x1="646" y1="180" x2="700" y2="180" stroke="none" />
      <line x1="646" y1="180" x2="646" y2="300" stroke="#525252" strokeWidth="2" transform="translate(28,0)" />
      <line x1="674" y1="180" x2="674" y2="300" stroke="#525252" strokeWidth="2" />
      <line x1="674" y1="300" x2="740" y2="300" stroke="#525252" strokeWidth="2" />
      <line x1="740" y1="80" x2="740" y2="300" stroke="#525252" strokeWidth="2" />
      {/* 输出电容 */}
      <line x1="716" y1="240" x2="716" y2="252" stroke="#14b8a6" strokeWidth="3" />
      <line x1="706" y1="258" x2="726" y2="258" stroke="#14b8a6" strokeWidth="3" />
      <text x="700" y="285" fill="#a3a3a3" fontSize="12">C<tspan dy="4" fontSize="9">o</tspan></text>
      <text x="700" y="60" fill="#f5f5f5" fontSize="14">V<tspan dy="4" fontSize="10">o</tspan></text>
      {/* 标注 */}
      <text x="100" y="325" fill="#737373" fontSize="11">Q1 导通 D·T，Q2 导通 (1−D)·T，互补驱动带死区</text>
    </svg>
  )
}

const compareRows = [
  { item: '原边结构', trad: '单管 + RCD 钳位', acf: '单管 + 有源钳位支路', ahb: '半桥双管互补驱动' },
  { item: '开关管数量', trad: '1', acf: '2（主 + 钳位）', ahb: '2（半桥）' },
  { item: 'ZVS 实现', trad: '否', acf: '是（依赖钳位管时序）', ahb: '是（励磁电流自然换流）' },
  { item: '变压器励磁', trad: '单向励磁', acf: '单向励磁', ahb: '双向对称励磁，磁芯利用率高' },
  { item: '电压应力', trad: 'Vin + 尖峰', acf: 'Vin / (1−D)', ahb: 'Vin（被桥臂钳位）' },
  { item: '典型应用', trad: '低成本小功率', acf: '45~100W 快充', ahb: '45~140W 高密度快充 / PD 适配器' },
]

export default function Fundamentals() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-text-primary mb-2">拓扑基础</h1>
      <p className="text-text-secondary mb-10">AHB（Asymmetric Half-Bridge）不对称半桥反激变换器的电路构成与基本特性。</p>

      {/* 拓扑结构 */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary-light" /> 电路结构
        </h2>
        <div className="card-surface p-6 mb-6">
          <TopologySvg />
        </div>
        <div className="space-y-4 text-text-secondary leading-relaxed">
          <p>
            AHB 反激由原边半桥（Q1、Q2 互补驱动，占空比分别为 <InlineMath latex="D" /> 与 <InlineMath latex="1-D" />）、
            串联隔直电容 <InlineMath latex="C_b" />、变压器（励磁电感 <InlineMath latex="L_m" /> 与漏感 <InlineMath latex="L_r" />）、
            副边整流二极管 D 与输出电容 <InlineMath latex="C_o" /> 构成。
          </p>
          <p>
            隔直电容 <InlineMath latex="C_b" /> 同时承担两个角色：一是稳态隔直（伏秒平衡使
            <InlineMath latex="V_{Cb} = D \cdot V_{in}" />），二是与漏感 <InlineMath latex="L_r" />
            构成谐振回路，在死区时间内完成开关节点电容的充放电，实现两个开关管的零电压开通（ZVS）。
          </p>
        </div>
        <MathBlock
          label="AHB 反激一阶直流增益"
          important
          latex={String.raw`M = \frac{V_o}{V_{in}} = \frac{D}{n} \qquad (n = N_p/N_s)`}
        />
      </section>

      {/* 对比 */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-primary-light" /> 与传统反激 / 有源钳位反激对比
        </h2>
        <div className="card-surface overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-5 py-3 text-text-muted font-medium">对比项</th>
                <th className="px-5 py-3 text-text-muted font-medium">传统反激</th>
                <th className="px-5 py-3 text-text-muted font-medium">有源钳位反激 (ACF)</th>
                <th className="px-5 py-3 text-primary-light font-medium">AHB 反激</th>
              </tr>
            </thead>
            <tbody>
              {compareRows.map((r) => (
                <tr key={r.item} className="border-b border-border/50 last:border-0">
                  <td className="px-5 py-3 text-text-primary font-medium">{r.item}</td>
                  <td className="px-5 py-3 text-text-secondary">{r.trad}</td>
                  <td className="px-5 py-3 text-text-secondary">{r.acf}</td>
                  <td className="px-5 py-3 text-text-primary">{r.ahb}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 为什么双向励磁 */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-primary-light" /> 关键特性：双向对称励磁
        </h2>
        <div className="space-y-4 text-text-secondary leading-relaxed">
          <p>
            由于隔直电容 <InlineMath latex="C_b" /> 的存在，变压器原边在导通期承受
            <InlineMath latex="V_{in}(1-D)" />、关断期承受 <InlineMath latex="-D \cdot V_{in}" />，
            磁通在正负两个方向对称摆动。相比传统反激的单向励磁，磁芯的 B-H 曲线利用率约提高一倍，
            同等功率下可选用更小型号的磁芯。
          </p>
          <p>
            励磁电流在一个周期内过零反向：峰值 <InlineMath latex="I_{pk}" /> 为正、谷值
            <InlineMath latex="I_{valley}" /> 为负。负向谷值电流正是实现 ZVS 的能量来源——
            死区内它把开关节点电容上的电荷抽走，使开关管在体二极管导通后零电压开通。
          </p>
        </div>
        <MathBlock
          label="ZVS 能量条件"
          important
          latex={String.raw`\frac{1}{2} L_m I_{valley}^2 \;\ge\; \frac{1}{2} C_{oss,eq} V_{in}^2`}
        />
      </section>

      {/* 应用场景 */}
      <section>
        <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary-light" /> 适用场景
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card-surface p-5">
            <h3 className="font-semibold text-text-primary mb-2">优势场景</h3>
            <ul className="text-text-secondary text-sm space-y-1.5 list-disc list-inside">
              <li>45–140 W USB-PD 快充与高密度适配器</li>
              <li>配合 GaN 开关管实现 200–500 kHz 高频化</li>
              <li>宽输入电压范围（如 90–264 Vac 整流后母线）</li>
              <li>对 EMI 与效率同时有严苛要求的场合</li>
            </ul>
          </div>
          <div className="card-surface p-5">
            <h3 className="font-semibold text-text-primary mb-2">设计挑战</h3>
            <ul className="text-text-secondary text-sm space-y-1.5 list-disc list-inside">
              <li>需要高边驱动与精确的死区时间控制</li>
              <li>增益同时依赖占空比与匝比，控制策略比单管反激复杂</li>
              <li>ZVS 在轻载下可能丢失，需要配合频率折返或突发模式</li>
              <li>谐振参数（Lr·Cb）设计需兼顾纹波与换流速度</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}

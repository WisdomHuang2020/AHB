import MathBlock from '@/components/MathBlock'
import InlineMath from '@/components/InlineMath'
import FigureCard from '@/components/FigureCard'
import { Zap, GitCompare, Layers, Lightbulb } from 'lucide-react'

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
          <FigureCard
            src="./fig/ahb-fig01.svg"
            alt="不对称半桥反激变换器拓扑结构"
            caption="不对称半桥反激变换器拓扑结构：方波产生器（S1/S2 半桥）、谐振网络（Lr、Lm、Cr）、理想变压器、整流网络与负载"
            source="《AHB不对称半桥反激电路设计（一）拓扑工作过程详细解读》，p1"
          />
        </div>
        <div className="space-y-4 text-text-secondary leading-relaxed">
          <p>
            AHB 反激由原边半桥（S1、S2 互补驱动，占空比分别为 <InlineMath latex="D" /> 与 <InlineMath latex="1-D" />）、
            串联隔直（谐振）电容 <InlineMath latex="C_r" />（亦称隔直电容 C_b）、变压器（励磁电感 <InlineMath latex="L_m" /> 与谐振电感 <InlineMath latex="L_r" />）、
            副边整流二极管 D 与输出电容 <InlineMath latex="C_o" /> 构成。
          </p>
          <p>
            隔直电容 <InlineMath latex="C_r" /> 同时承担两个角色：一是稳态隔直（伏秒平衡使
            <InlineMath latex="V_{Cb} = D \cdot V_{in}" />），二是与谐振电感 <InlineMath latex="L_r" />
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
            由于隔直电容 <InlineMath latex="C_r" /> 的存在，变压器原边在导通期承受
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

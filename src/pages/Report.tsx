import { useDesign } from '@/lib/DesignContext'
import { AhbOperatingPoint } from '@/lib/ahbMath'
import MathBlock from '@/components/MathBlock'
import { FileText, Printer, CheckCircle2, AlertTriangle } from 'lucide-react'

function Row({ k, v }: { k: string; v: string }) {
  return (
    <tr className="border-b border-border/40 last:border-0">
      <td className="py-2 text-text-muted text-sm">{k}</td>
      <td className="py-2 text-text-primary text-sm text-right font-mono">{v}</td>
    </tr>
  )
}

function PointSection({ title, p }: { title: string; p: AhbOperatingPoint }) {
  return (
    <div>
      <h3 className="font-semibold text-text-primary text-sm mb-2">{title}</h3>
      <table className="w-full">
        <tbody>
          <Row k="占空比 D" v={`${(p.duty * 100).toFixed(2)} %`} />
          <Row k="励磁平均电流" v={`${p.iLmAvg.toFixed(3)} A`} />
          <Row k="纹波电流 ΔI (p-p)" v={`${p.deltaI.toFixed(3)} A`} />
          <Row k="峰值 / 谷值电流" v={`${p.iPk.toFixed(3)} / ${p.iValley.toFixed(3)} A`} />
          <Row k="原边 RMS / 副边 RMS" v={`${p.iPriRms.toFixed(3)} / ${p.iSecRms.toFixed(3)} A`} />
          <Row k="输出电容纹波电流" v={`${p.iCoRms.toFixed(3)} A`} />
          <Row k="谐振电容电压 / 纹波" v={`${p.vCb.toFixed(1)} V / ${p.deltaVCb.toFixed(2)} V`} />
          <Row k="S2关断 iLr / 副边残流 is" v={`${p.iLrEnd.toFixed(3)} A / ${p.isEnd.toFixed(3)} A${p.isEnd < 0.1 ? '（ZCS ✓）' : ''}`} />
          <Row k="ZVS 能量裕量" v={`${p.zvsMargin.toFixed(2)} ×`} />
          <Row k="所需死区时间" v={`≥ ${(p.deadtimeNeed * 1e9).toFixed(0)} ns`} />
          <Row k="死区下限 Td1min / Td2min（文献式）" v={`${(p.td1min * 1e9).toFixed(0)} / ${p.td2min === Infinity ? '∞' : (p.td2min * 1e9).toFixed(0)} ns`} />
          <Row k="ZVS 结论" v={p.zvsEnergyOk && p.deadtimeOk ? '满足' : '不满足'} />
        </tbody>
      </table>
    </div>
  )
}

export default function Report() {
  const { inputs, result } = useDesign()
  const today = new Date().toLocaleDateString('zh-CN')
  const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0'

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-10 no-print">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-3">
            <FileText className="w-7 h-7 text-primary-light" /> 设计报告
          </h1>
          <p className="text-text-secondary">汇总当前设计参数与全部计算结果，可直接打印或另存为 PDF。</p>
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-light text-white text-sm font-medium transition-colors"
        >
          <Printer className="w-4 h-4" /> 打印 / 导出 PDF
        </button>
      </div>

      <div className="card-surface p-8 space-y-10">
        {/* 抬头 */}
        <div className="border-b border-border pb-6">
          <h2 className="text-2xl font-bold text-text-primary">AHB 不对称半桥反激变换器设计报告</h2>
          <p className="text-text-muted text-sm mt-2">生成日期：{today} · 工具版本 v{version}</p>
        </div>

        {/* 输入规格 */}
        <section>
          <h3 className="text-lg font-semibold text-text-primary mb-3">1. 设计输入</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
            <table className="w-full">
              <tbody>
                <Row k="输入电压范围" v={`${inputs.vinMin} ~ ${inputs.vinMax} V（额定 ${inputs.vinNom} V）`} />
                <Row k="输出电压 / 功率" v={`${inputs.vout} V / ${inputs.pout} W`} />
                <Row k="输出电流" v={`${result.iout.toFixed(2)} A`} />
                <Row k="二极管压降 Vd" v={`${inputs.vd} V`} />
              </tbody>
            </table>
            <table className="w-full">
              <tbody>
                <Row k="开关频率" v={`${(inputs.fs / 1000).toFixed(0)} kHz`} />
                <Row k="目标效率" v={`${(inputs.eta * 100).toFixed(1)} %`} />
                <Row k="纹波系数 Kr / 标称占空比" v={`${inputs.kRipple} / ${inputs.dNom}`} />
                <Row k="Coss 等效 / 死区时间" v={`${(inputs.cEq * 1e12).toFixed(0)} pF / ${(inputs.deadtime * 1e9).toFixed(0)} ns`} />
              </tbody>
            </table>
          </div>
        </section>

        {/* 设计结果 */}
        <section>
          <h3 className="text-lg font-semibold text-text-primary mb-3">2. 磁性与谐振参数设计结果</h3>
          <table className="w-full max-w-lg">
            <tbody>
              <Row k="变压器匝比 n = Np/Ns" v={result.n.toFixed(2)} />
              <Row k="励磁电感 Lm" v={`${(result.lm * 1e6).toFixed(1)} µH`} />
              <Row k="漏感+串感 Lr（≈3% Lm）" v={`${(result.lr * 1e6).toFixed(2)} µH`} />
              <Row k="隔直/谐振电容 Cr（ZCS 调谐）" v={`${(result.cb * 1e9).toFixed(1)} nF`} />
              <Row k="Lr·Cr 谐振频率 fr" v={`${(result.fr / 1000).toFixed(1)} kHz（fs = ${(inputs.fs / 1000).toFixed(0)} kHz，调谐比 fr/fs ≈ ${(result.fr / inputs.fs).toFixed(2)}）`} />
              <Row k="MOSFET 电压应力" v={`${result.vMos.toFixed(0)} V`} />
              <Row k="二极管电压应力" v={`${result.vDiode.toFixed(1)} V`} />
            </tbody>
          </table>
        </section>

        {/* 工作点 */}
        <section>
          <h3 className="text-lg font-semibold text-text-primary mb-4">3. 稳态工作点验证</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PointSection title={`低压输入 ${inputs.vinMin} V`} p={result.points.min} />
            <PointSection title={`额定输入 ${inputs.vinNom} V`} p={result.points.nom} />
            <PointSection title={`高压输入 ${inputs.vinMax} V`} p={result.points.max} />
          </div>
        </section>

        {/* 关键公式 */}
        <section>
          <h3 className="text-lg font-semibold text-text-primary mb-2">4. 关键设计公式</h3>
          <MathBlock label="直流增益" latex={String.raw`V_o = \frac{D\,V_{in}}{n} - V_d`} />
          <MathBlock label="谐振电容电压" latex={String.raw`V_{Cr} = D \cdot V_{in}`} />
          <MathBlock label="励磁电感设计" latex={String.raw`L_m = \frac{V_{in}(1-D)\,D}{K_r \cdot I_{Lm,avg} \cdot f_s}`} />
          <MathBlock label="ZCS 调谐条件（文献八）" important latex={String.raw`i_{Lr}(T_{off}) = I_{Lm\text{-}min} \;\Rightarrow\; i_s(T_{off}) = n\,(I_{Lm\text{-}min} - i_{Lr}) = 0`} />
          <MathBlock label="ZVS 能量条件" important latex={String.raw`\frac{1}{2} L_m I_{valley}^2 \ge \frac{1}{2} C_{oss,eq} V_{in}^2`} />
          <MathBlock label="死区时间下限" latex={String.raw`t_{dead} \ge \frac{\pi}{2}\sqrt{L_m C_{oss,eq}}`} />
          <MathBlock label="最小死区（文献八，线性充电式）" latex={String.raw`T_{d1min} = \frac{2 C_{oss} V_{in}}{I_{Lm\text{-}max}}, \qquad T_{d2min} = \frac{2 C_{oss} V_{in}}{|I_{Lm\text{-}min}|}`} />
        </section>

        {/* 结论 */}
        <section>
          <h3 className="text-lg font-semibold text-text-primary mb-3">5. 设计结论</h3>
          {result.warnings.length === 0 ? (
            <p className="text-success text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              本设计在全部输入电压范围内满足 ZVS 能量与死区时间要求；谐振电容 Cr 已按文献（八）ZCS 调谐条件求解，调谐点处 S2 关断时刻副边电流归零。
            </p>
          ) : (
            <ul className="space-y-2 text-sm text-text-secondary">
              {result.warnings.map((w, i) => (
                <li key={i} className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-danger shrink-0 mt-0.5" /> {w}
                </li>
              ))}
            </ul>
          )}
          <p className="text-text-muted text-xs mt-6">
            注：本报告基于一阶稳态分析，未计入漏感尖峰、PCB 寄生参数与磁芯损耗；样机阶段需实测验证 ZVS 波形与温升。
          </p>
        </section>
      </div>
    </div>
  )
}

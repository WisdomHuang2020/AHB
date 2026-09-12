import { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { useDesign } from '@/lib/DesignContext'
import { dcGain, resonantWaveform } from '@/lib/ahbMath'
import { TrendingUp, Waves, CheckCircle2, AlertTriangle } from 'lucide-react'

const axisStyle = { fill: '#a3a3a3', fontSize: 12 }
const gridStroke = '#262626'

const tooltipStyle = {
  backgroundColor: '#171717',
  border: '1px solid #404040',
  borderRadius: 8,
  fontSize: 12,
}

export default function Curves() {
  const { inputs, result } = useDesign()
  const { n, lm, lr, cb } = result

  // 1. 增益-占空比曲线：不同匝比
  const gainData = useMemo(() => {
    const ratios = [n * 0.75, n * 0.875, n, n * 1.125, n * 1.25].map((v) => Math.max(v, 0.5))
    const pts: Record<string, number>[] = []
    for (let d = 0.05; d <= 0.7; d += 0.01) {
      const row: Record<string, number> = { duty: Number(d.toFixed(3)) }
      ratios.forEach((r, i) => {
        row[`n${i}`] = Number(dcGain(d, r).toFixed(4))
      })
      pts.push(row)
    }
    return { pts, ratios }
  }, [n])

  // 2. 精确谐振波形（标称输入点，式6/19 + 分相释能模型）
  const waveData = useMemo(
    () => resonantWaveform(inputs, n, lm, lr, cb, inputs.vinNom).pts.map((p) => ({
      t: Number(p.t.toFixed(3)),
      iLm: Number(p.iLm.toFixed(4)),
      iLr: Number(p.iLr.toFixed(4)),
      is: Number(p.is.toFixed(4)),
    })),
    [inputs, n, lm, lr, cb],
  )

  // 3. ZVS 边界：谷值电流 vs 负载（三个输入电压）
  const zvsData = useMemo(() => {
    const vs = [
      { vin: inputs.vinMin, key: 'z0' },
      { vin: inputs.vinNom, key: 'z1' },
      { vin: inputs.vinMax, key: 'z2' },
    ]
    const rows: Record<string, number>[] = []
    for (let p = 5; p <= 110; p += 5) {
      const row: Record<string, number> = { load: p }
      vs.forEach((v) => {
        const inp = { ...inputs, pout: (inputs.pout * p) / 100 }
        const duty = (n * (inp.vout + inp.vd)) / v.vin
        const iAvg = inp.pout / (inp.eta * v.vin * duty)
        const deltaI = (v.vin * (1 - duty) * duty) / (lm * inp.fs)
        row[v.key] = Number((iAvg - deltaI / 2).toFixed(4))
      })
      rows.push(row)
    }
    // 各输入电压下的 ZVS 临界谷值电流：I_crit = -Vin·√(C_eq/Lm)
    const crits = vs.map((v) => -v.vin * Math.sqrt(inputs.cEq / lm))
    return { rows, crits, labels: vs.map((v) => `${v.vin} V`) }
  }, [inputs, n, lm])

  const colors = ['#14b8a6', '#f59e0b', '#ef4444', '#60a5fa', '#a78bfa']

  // ZCS 匹配表数据
  const zcsRows = [
    { label: `低压 ${inputs.vinMin} V`, p: result.points.min },
    { label: `额定 ${inputs.vinNom} V`, p: result.points.nom },
    { label: `高压 ${inputs.vinMax} V`, p: result.points.max },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-text-primary mb-2">特性曲线</h1>
      <p className="text-text-secondary mb-10">
        基于当前设计参数（n = {n.toFixed(2)}，L<sub>m</sub> = {(lm * 1e6).toFixed(0)} µH，
        C<sub>r</sub> = {(cb * 1e9).toFixed(1)} nF，f<sub>r2</sub> = {(result.fr / 1000).toFixed(0)} kHz）实时绘制，
        与公式推导页式 6 / 19 / 21 完全对应。
      </p>

      {/* 增益曲线 */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-light" /> 直流增益 M = D/n（不同匝比）
        </h2>
        <div className="card-surface p-6">
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={gainData.pts} margin={{ top: 10, right: 24, bottom: 10, left: 10 }}>
              <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
              <XAxis dataKey="duty" tick={axisStyle} label={{ value: '占空比 D', position: 'insideBottomRight', offset: -4, fill: '#737373' }} />
              <YAxis tick={axisStyle} label={{ value: 'M = Vo/Vin', angle: -90, position: 'insideLeft', fill: '#737373' }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => v.toFixed(4)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {gainData.ratios.map((r, i) => (
                <Line
                  key={i}
                  type="monotone"
                  dataKey={`n${i}`}
                  name={`n = ${r.toFixed(2)}${i === 2 ? '（当前）' : ''}`}
                  stroke={colors[i]}
                  strokeWidth={i === 2 ? 3 : 1.5}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <p className="text-text-muted text-sm mt-3">
            增益随占空比线性增长，斜率为 1/n（推导页 §1）。输入电压变化时控制器调节 D 保持输出稳定。
          </p>
        </div>
      </section>

      {/* 精确谐振波形 */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Waves className="w-5 h-5 text-primary-light" /> 精确谐振波形（额定输入 {inputs.vinNom} V，一个开关周期）
        </h2>
        <div className="card-surface p-6">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={waveData} margin={{ top: 10, right: 24, bottom: 10, left: 10 }}>
              <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
              <XAxis dataKey="t" tick={axisStyle} label={{ value: '时间 (µs)', position: 'insideBottomRight', offset: -4, fill: '#737373' }} />
              <YAxis yAxisId="pri" tick={axisStyle} label={{ value: 'i_Lm / i_Lr (A)', angle: -90, position: 'insideLeft', fill: '#737373' }} />
              <YAxis yAxisId="sec" orientation="right" tick={axisStyle} label={{ value: 'i_s (A)', angle: 90, position: 'insideRight', fill: '#737373' }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => [`${v.toFixed(3)} A`, name]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <ReferenceLine yAxisId="pri" y={0} stroke="#525252" strokeDasharray="6 4" />
              <Line yAxisId="pri" type="monotone" dataKey="iLm" name="i_Lm 励磁电流（式6）" stroke="#ef4444" strokeWidth={2} dot={false} />
              <Line yAxisId="pri" type="monotone" dataKey="iLr" name="i_Lr 谐振腔电流（式19）" stroke="#14b8a6" strokeWidth={2} dot={false} />
              <Line yAxisId="sec" type="monotone" dataKey="is" name="i_s 副边电流（式21，右轴）" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="text-text-muted text-sm mt-3 space-y-1.5">
            <p>· 储能阶段（0 ~ D·T<sub>s</sub>）：三元件谐振近似线性，i<sub>Lr</sub> 与 i<sub>Lm</sub> 重合上升（式 6 第一支路）。</p>
            <p>· 释能阶段（D·T<sub>s</sub> ~ T<sub>s</sub>）：i<sub>Lm</sub> 被副边反射电压钳位线性下降；i<sub>Lr</sub> 按 L<sub>r</sub>-C<sub>r</sub> 二元件谐振正弦下凹（式 19），低于 i<sub>Lm</sub> 的区间 D1 导通。</p>
            <p>· 副边电流 i<sub>s</sub> = n·(i<sub>Lm</sub> − i<sub>Lr</sub>) 呈半正弦谐振脉冲（式 21，符号约定见推导页式 21 注）；C<sub>r</sub> 按文献八 ZCS 调谐，S2 关断时刻 i<sub>Lr</sub> 恰好回到 I<sub>Lm-min</sub>，i<sub>s</sub> 归零；归零后（t<sub>z</sub> ~ T<sub>s</sub>）i<sub>Lr</sub> 与 i<sub>Lm</sub> 汇合缓慢回落，周期末闭合到谷值。</p>
          </div>
        </div>
      </section>

      {/* ZCS 匹配表 */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-text-primary mb-4">ZCS 调谐匹配（C<sub>r</sub> 在额定点调谐）</h2>
        <div className="card-surface overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-5 py-3 text-text-muted font-medium">工作点</th>
                <th className="px-5 py-3 text-text-muted font-medium">占空比 D</th>
                <th className="px-5 py-3 text-text-muted font-medium">I_Lm-min（谷值）</th>
                <th className="px-5 py-3 text-text-muted font-medium">i_Lr(T_off) 关断时刻</th>
                <th className="px-5 py-3 text-text-muted font-medium">副边残存电流 i_s(T_off)</th>
                <th className="px-5 py-3 text-text-muted font-medium">ZCS 状态</th>
              </tr>
            </thead>
            <tbody>
              {zcsRows.map((r) => {
                const ok = r.p.isEnd < 0.1
                const early = ok && r.p.isEndRaw < -0.05 // 谐振弧提前回到谷值（t_z < T_off）
                return (
                  <tr key={r.label} className="border-b border-border/50 last:border-0">
                    <td className="px-5 py-3 text-text-primary font-medium">{r.label}</td>
                    <td className="px-5 py-3 text-text-secondary font-mono">{(r.p.duty * 100).toFixed(1)} %</td>
                    <td className="px-5 py-3 text-text-secondary font-mono">{r.p.iValley.toFixed(3)} A</td>
                    <td className="px-5 py-3 text-text-secondary font-mono">{r.p.iLrEnd.toFixed(3)} A</td>
                    <td className="px-5 py-3 text-text-secondary font-mono">{r.p.isEnd.toFixed(3)} A</td>
                    <td className="px-5 py-3">
                      {ok ? (
                        <span className="inline-flex items-center gap-1 text-success text-xs"><CheckCircle2 className="w-3.5 h-3.5" /> {early ? 'ZCS（提前归零）' : 'ZCS 成立（调谐点）'}</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-accent-light text-xs"><AlertTriangle className="w-3.5 h-3.5" /> 漂移（关断残流）</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="text-text-muted text-sm mt-3">
          固定频率 PWM 下占空比随输入电压变化，释能谐振弧长随之改变，ZCS 只在调谐点（额定输入）严格成立。
          高压点 T<sub>off</sub> 变长，谐振弧提前回到谷值（t<sub>z</sub> &lt; T<sub>off</sub>，提前 ZCS，其后原边仅励磁分量环流）；
          低压点 T<sub>off</sub> 变短，谐振弧来不及回谷，S2 关断时仍有残流（ZCS 丢失，低压点残流可达数安）——
          这是 AHB 反激的固有特性，残流越小换流损耗越低。
        </p>
      </section>

      {/* ZVS 边界 */}
      <section>
        <h2 className="text-xl font-semibold text-text-primary mb-4">ZVS 边界：谷值电流 vs 负载</h2>
        <div className="card-surface p-6">
          <ResponsiveContainer width="100%" height={380}>
            <LineChart data={zvsData.rows} margin={{ top: 10, right: 24, bottom: 10, left: 10 }}>
              <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
              <XAxis dataKey="load" tick={axisStyle} label={{ value: '负载 (%)', position: 'insideBottomRight', offset: -4, fill: '#737373' }} />
              <YAxis tick={axisStyle} label={{ value: 'I_valley (A)', angle: -90, position: 'insideLeft', fill: '#737373' }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v.toFixed(3)} A`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <ReferenceLine y={0} stroke="#525252" strokeDasharray="6 4" />
              {zvsData.crits.map((c, i) => (
                <ReferenceLine
                  key={`c${i}`}
                  y={c}
                  stroke={colors[i]}
                  strokeDasharray="4 4"
                  strokeOpacity={0.6}
                />
              ))}
              {zvsData.labels.map((lb, i) => (
                <Line
                  key={i}
                  type="monotone"
                  dataKey={`z${i}`}
                  name={`Vin = ${lb}（虚线为其 ZVS 临界）`}
                  stroke={colors[i]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <p className="text-text-muted text-sm mt-3">
            {/* 审核修订 P0-6：图注改为与曲线数据一致的中性表述，并标注固定 D 示意 */}
            固定 D 示意（D 由输入电压决定，与负载无关）：实线低于同色虚线（临界值
            I_crit = −V_in·√(C_eq/L_m)，推导页 §6 能量判据）时 ZVS 成立。
            固定占空比下纹波 ΔI 不变而励磁平均电流随负载减轻而下降，轻载时谷值电流变深（更负）、
            ZVS 能量更充足；实际轻载策略（降频、突发模式）的影响不在本图覆盖范围内。
          </p>
        </div>
      </section>
    </div>
  )
}

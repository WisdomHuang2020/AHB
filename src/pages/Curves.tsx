import { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { useDesign } from '@/lib/DesignContext'
import { dcGain, magnetizingWaveform, operatingPoint } from '@/lib/ahbMath'
import { TrendingUp } from 'lucide-react'

const axisStyle = { fill: '#a3a3a3', fontSize: 12 }
const gridStroke = '#262626'
const colors = ['#14b8a6', '#f59e0b', '#ef4444', '#60a5fa', '#a78bfa']

const tooltipStyle = {
  backgroundColor: '#171717',
  border: '1px solid #404040',
  borderRadius: 8,
  fontSize: 12,
}

export default function Curves() {
  const { inputs, result } = useDesign()
  const { n, lm, cb } = result

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

  // 2. 励磁电流波形（一个开关周期，三个输入电压）
  const waveData = useMemo(() => {
    const vs = [
      { vin: inputs.vinMin, label: 'min' },
      { vin: inputs.vinNom, label: 'nom' },
      { vin: inputs.vinMax, label: 'max' },
    ]
    const waves = vs.map((v) => ({ ...v, pts: magnetizingWaveform(inputs, n, lm, v.vin) }))
    const len = waves[0].pts.length
    const merged: Record<string, number>[] = []
    for (let k = 0; k < len; k++) {
      const row: Record<string, number> = { t: Number(waves[0].pts[k].t.toFixed(3)) }
      waves.forEach((w, i) => {
        row[`w${i}`] = Number(w.pts[k].i.toFixed(4))
      })
      merged.push(row)
    }
    return { merged, labels: vs.map((v) => `${v.vin} V`) }
  }, [inputs, n, lm])

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
        const pt = operatingPoint(inp, n, lm, cb, v.vin)
        row[v.key] = Number(pt.iValley.toFixed(4))
      })
      rows.push(row)
    }
    // 各输入电压下的 ZVS 临界谷值电流：I_crit = -Vin·√(C_eq/Lm)
    const crits = vs.map((v) => -v.vin * Math.sqrt(inputs.cEq / lm))
    return { rows, crits, labels: vs.map((v) => `${v.vin} V`) }
  }, [inputs, n, lm, cb])

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-text-primary mb-2">特性曲线</h1>
      <p className="text-text-secondary mb-10">
        基于当前设计参数（n = {n.toFixed(2)}，L<sub>m</sub> = {(lm * 1e6).toFixed(0)} µH）实时绘制的特性曲线。
        在设计工具页修改参数后，本页曲线会同步更新。
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
            增益随占空比线性增长，斜率为 1/n。输入电压变化时，控制器通过调节 D 保持输出稳定：
            低压输入对应大占空比，高压输入对应小占空比。
          </p>
        </div>
      </section>

      {/* 励磁电流波形 */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-text-primary mb-4">励磁电流波形（一个开关周期）</h2>
        <div className="card-surface p-6">
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={waveData.merged} margin={{ top: 10, right: 24, bottom: 10, left: 10 }}>
              <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
              <XAxis dataKey="t" tick={axisStyle} label={{ value: '时间 (µs)', position: 'insideBottomRight', offset: -4, fill: '#737373' }} />
              <YAxis tick={axisStyle} label={{ value: 'i_Lm (A)', angle: -90, position: 'insideLeft', fill: '#737373' }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v.toFixed(3)} A`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <ReferenceLine y={0} stroke="#525252" strokeDasharray="6 4" />
              {waveData.labels.map((lb, i) => (
                <Line
                  key={i}
                  type="linear"
                  dataKey={`w${i}`}
                  name={`Vin = ${lb}`}
                  stroke={colors[i]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <p className="text-text-muted text-sm mt-3">
            三角波双向摆动：谷值低于零的部分是 ZVS 换流的能量来源。输入电压越低占空比越大，平均电流越高。
          </p>
        </div>
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
            实线低于同色虚线（临界值 <InlineMathFallback />）时 ZVS 成立。负载减轻后平均电流下降，
            谷值电流变浅，ZVS 逐渐丢失——这是 AHB 反激轻载效率下降的主要原因，工程上通常配合降频或突发模式。
          </p>
        </div>
      </section>
    </div>
  )
}

function InlineMathFallback() {
  return (
    <span className="font-mono text-text-secondary">I_crit = −Vin·√(C_eq/Lm)</span>
  )
}

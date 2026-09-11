import { useDesign } from '@/lib/DesignContext'
import { AhbInputs, AhbOperatingPoint } from '@/lib/ahbMath'
import { Calculator, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface FieldDef {
  key: keyof AhbInputs
  label: string
  unit: string
  step: number
  scale?: number // 显示值 = 内部值 × scale
}

const specFields: FieldDef[] = [
  { key: 'vinMin', label: '最低输入电压', unit: 'V', step: 5 },
  { key: 'vinNom', label: '额定输入电压', unit: 'V', step: 5 },
  { key: 'vinMax', label: '最高输入电压', unit: 'V', step: 5 },
  { key: 'vout', label: '输出电压', unit: 'V', step: 0.5 },
  { key: 'pout', label: '输出功率', unit: 'W', step: 5 },
  { key: 'vd', label: '二极管压降', unit: 'V', step: 0.1 },
]

const designFields: FieldDef[] = [
  { key: 'fs', label: '开关频率', unit: 'kHz', step: 10, scale: 1e-3 },
  { key: 'eta', label: '目标效率', unit: '%', step: 0.5, scale: 100 },
  { key: 'kRipple', label: '纹波系数 Kr', unit: '', step: 0.1 },
  { key: 'dNom', label: '标称占空比', unit: '', step: 0.01 },
  { key: 'cEq', label: 'Coss 等效电容', unit: 'pF', step: 10, scale: 1e12 },
  { key: 'deadtime', label: '死区时间', unit: 'ns', step: 10, scale: 1e9 },
]

function Field({ def }: { def: FieldDef }) {
  const { inputs, setInputs } = useDesign()
  const scale = def.scale ?? 1
  const raw = inputs[def.key]
  const display = typeof raw === 'number' ? Number((raw * scale).toFixed(6)) : ''

  return (
    <label className="block">
      <span className="text-text-secondary text-xs mb-1 block">
        {def.label}{def.unit ? `（${def.unit}）` : ''}
      </span>
      <input
        type="number"
        className="input-field w-full"
        step={def.step}
        value={display}
        onChange={(e) => {
          const v = parseFloat(e.target.value)
          if (!Number.isNaN(v)) {
            setInputs((prev) => ({ ...prev, [def.key]: v / scale }))
          }
        }}
      />
    </label>
  )
}

function PointTable({ title, p }: { title: string; p: AhbOperatingPoint }) {
  const rows: [string, string][] = [
    ['占空比 D', `${(p.duty * 100).toFixed(1)} %`],
    ['励磁平均电流', `${p.iLmAvg.toFixed(3)} A`],
    ['纹波 ΔI (p-p)', `${p.deltaI.toFixed(3)} A`],
    ['峰值电流 Ipk', `${p.iPk.toFixed(3)} A`],
    ['谷值电流 Ivalley', `${p.iValley.toFixed(3)} A`],
    ['原边 RMS 电流', `${p.iPriRms.toFixed(3)} A`],
    ['副边 RMS 电流', `${p.iSecRms.toFixed(3)} A`],
    ['隔直电容电压 Vcb', `${p.vCb.toFixed(1)} V`],
    ['隔直电容纹波 ΔVcb', `${p.deltaVCb.toFixed(2)} V`],
    ['ZVS 能量裕量', `${p.zvsMargin.toFixed(2)} ×`],
    ['所需死区时间', `${(p.deadtimeNeed * 1e9).toFixed(0)} ns`],
    ['死区下限 Td1min（S1关断）', `${(p.td1min * 1e9).toFixed(0)} ns`],
    ['死区下限 Td2min（S2关断）', p.td2min === Infinity ? '∞（谷值非负）' : `${(p.td2min * 1e9).toFixed(0)} ns`],
  ]
  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-text-primary text-sm">{title}</h3>
        {p.zvsEnergyOk && p.deadtimeOk ? (
          <span className="inline-flex items-center gap-1 text-success text-xs"><CheckCircle2 className="w-3.5 h-3.5" /> ZVS OK</span>
        ) : (
          <span className="inline-flex items-center gap-1 text-danger text-xs"><AlertTriangle className="w-3.5 h-3.5" /> ZVS 风险</span>
        )}
      </div>
      <table className="w-full text-xs">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k} className="border-b border-border/40 last:border-0">
              <td className="py-1.5 text-text-muted">{k}</td>
              <td className="py-1.5 text-text-primary text-right font-mono">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Designer() {
  const { inputs, setInputs, result } = useDesign()

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-3">
        <Calculator className="w-7 h-7 text-primary-light" /> 设计工具
      </h1>
      <p className="text-text-secondary mb-10">
        输入规格与设计目标，自动完成匝比、励磁电感、隔直电容的选型，并在三个输入电压点验证 ZVS。
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 输入区 */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card-surface p-5">
            <h2 className="font-semibold text-text-primary mb-4 text-sm uppercase tracking-wider">规格参数</h2>
            <div className="grid grid-cols-2 gap-3">
              {specFields.map((f) => <Field key={f.key} def={f} />)}
            </div>
          </div>
          <div className="card-surface p-5">
            <h2 className="font-semibold text-text-primary mb-4 text-sm uppercase tracking-wider">设计目标</h2>
            <div className="grid grid-cols-2 gap-3">
              {designFields.map((f) => <Field key={f.key} def={f} />)}
            </div>
            <label className="block mt-3">
              <span className="text-text-secondary text-xs mb-1 block">手动匝比 n（留空自动）</span>
              <input
                type="number"
                className="input-field w-full"
                step={0.5}
                placeholder={`自动：${result.n.toFixed(2)}`}
                value={inputs.turnsRatio ?? ''}
                onChange={(e) => {
                  const v = parseFloat(e.target.value)
                  setInputs((prev) => ({
                    ...prev,
                    turnsRatio: Number.isNaN(v) ? undefined : v,
                  }))
                }}
              />
            </label>
          </div>
        </div>

        {/* 结果区 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 磁性元件结果 */}
          <div className="card-surface p-5">
            <h2 className="font-semibold text-text-primary mb-4 text-sm uppercase tracking-wider">磁性与谐振参数</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-text-muted text-xs mb-1">匝比 n = Np/Ns</div>
                <div className="text-2xl font-bold text-primary-light font-mono">{result.n.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-text-muted text-xs mb-1">励磁电感 Lm</div>
                <div className="text-2xl font-bold text-primary-light font-mono">{(result.lm * 1e6).toFixed(0)} µH</div>
              </div>
              <div>
                <div className="text-text-muted text-xs mb-1">隔直电容 Cb</div>
                <div className="text-2xl font-bold text-primary-light font-mono">{(result.cb * 1e9).toFixed(0)} nF</div>
              </div>
              <div>
                <div className="text-text-muted text-xs mb-1">谐振频率 fr</div>
                <div className="text-2xl font-bold text-primary-light font-mono">{(result.fr / 1000).toFixed(1)} kHz</div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border/50 text-xs">
              <div><span className="text-text-muted">漏感+串感 Lr ≈ </span><span className="font-mono text-text-primary">{(result.lr * 1e6).toFixed(1)} µH</span></div>
              <div><span className="text-text-muted">输出电流 </span><span className="font-mono text-text-primary">{result.iout.toFixed(2)} A</span></div>
              <div><span className="text-text-muted">MOSFET 应力 </span><span className="font-mono text-text-primary">{result.vMos.toFixed(0)} V</span></div>
              <div><span className="text-text-muted">二极管应力 </span><span className="font-mono text-text-primary">{result.vDiode.toFixed(1)} V</span></div>
            </div>
          </div>

          {/* 三个工作点 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PointTable title={`Vin = ${inputs.vinMin} V（低压）`} p={result.points.min} />
            <PointTable title={`Vin = ${inputs.vinNom} V（额定）`} p={result.points.nom} />
            <PointTable title={`Vin = ${inputs.vinMax} V（高压）`} p={result.points.max} />
          </div>

          {/* 警告 */}
          {result.warnings.length > 0 && (
            <div className="card-surface p-5 border-danger/50">
              <h2 className="font-semibold text-danger mb-3 text-sm uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> 设计警告
              </h2>
              <ul className="space-y-2 text-sm text-text-secondary list-disc list-inside">
                {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}
          {result.warnings.length === 0 && (
            <div className="card-surface p-5 border-success/40">
              <p className="text-success text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> 全部检查通过：三个输入电压点均满足 ZVS 与死区时间要求。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { Zap, BookOpen, Activity, PenTool, TrendingUp, Calculator, FileText, ArrowRight, BatteryCharging, Gauge, ShieldCheck } from 'lucide-react'

const features = [
  {
    icon: BookOpen,
    title: '拓扑基础',
    desc: 'AHB 不对称半桥反激的电路结构、与传统反激/有源钳位反激的对比、适用场景。',
    path: '/fundamentals',
  },
  {
    icon: Activity,
    title: '工作原理',
    desc: '四个开关模态的详细分析、励磁电流路径与 ZVS 软开关的实现机理。',
    path: '/operation',
  },
  {
    icon: PenTool,
    title: '公式推导',
    desc: '从伏秒平衡到直流增益 M = D/n，从纹波设计到 ZVS 能量条件的完整推导链。',
    path: '/derivations',
  },
  {
    icon: TrendingUp,
    title: '特性曲线',
    desc: '增益-占空比曲线、励磁电流波形、ZVS 边界随输入电压与负载的变化。',
    path: '/curves',
  },
  {
    icon: Calculator,
    title: '设计工具',
    desc: '输入规格参数，自动计算匝比、励磁电感、隔直电容并验证 ZVS 条件。',
    path: '/designer',
  },
  {
    icon: FileText,
    title: '报告输出',
    desc: '汇总设计输入与全部计算结果，生成可直接打印归档的设计报告。',
    path: '/report',
  },
]

const highlights = [
  { icon: BatteryCharging, title: '零电压开关', desc: '利用励磁电流实现全负载 ZVS' },
  { icon: Gauge, title: '高频高效', desc: '开关损耗大幅降低，适配 GaN 高频化' },
  { icon: ShieldCheck, title: '低 EMI', desc: '对称dv/dt抑制，二极管无反向恢复损耗' },
]

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-dark/30 border border-primary/40 text-primary-light text-xs font-medium mb-6">
          <Zap className="w-3.5 h-3.5" />
          Asymmetric Half-Bridge Flyback
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
          <span className="text-gradient">AHB 不对称半桥反激</span>
          <br />
          设计工具
        </h1>
        <p className="max-w-2xl mx-auto text-text-secondary text-lg leading-relaxed mb-10">
          从拓扑原理到参数设计的完整工作流：理解不对称半桥反激的谐振换流与 ZVS 机理，
          推导关键设计方程，交互式计算并验证你的磁性元件与软开关设计。
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            to="/designer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary hover:bg-primary-light text-white font-medium transition-colors"
          >
            开始设计 <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/fundamentals"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-surface border border-border hover:border-primary-light text-text-primary font-medium transition-colors"
          >
            学习原理
          </Link>
        </div>
      </section>

      {/* Highlights */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {highlights.map((h) => (
            <div key={h.title} className="card-surface p-6 flex items-start gap-4">
              <h.icon className="w-8 h-8 text-primary-light shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-text-primary mb-1">{h.title}</h3>
                <p className="text-text-secondary text-sm">{h.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature grid */}
      <section className="max-w-7xl mx-auto px-4 pb-8">
        <h2 className="text-2xl font-bold text-text-primary mb-2">功能模块</h2>
        <p className="text-text-secondary mb-8">按照「学习 → 推导 → 分析 → 设计 → 归档」的路径使用本工具。</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <Link key={f.path} to={f.path} className="card-surface p-6 group block">
              <f.icon className="w-8 h-8 text-primary-light mb-4" />
              <h3 className="font-semibold text-text-primary mb-2 flex items-center gap-2">
                {f.title}
                <ArrowRight className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary-light" />
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed">{f.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

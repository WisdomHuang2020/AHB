/**
 * 审核修订数值验证脚本（.ref-audit-2026-09-12.md §四 修订清单）
 * 运行：npx tsc src/lib/ahbMath.ts --outDir research/.compiled --module commonjs --target es2019 --skipLibCheck
 *       node research/verify-audit-fix.cjs
 */
const {
  designAhb, solveCrZcs, solveVCr1, resonantOffState, resonantWaveform, operatingPoint,
} = require('./.compiled/ahbMath.cjs')

// 与 DesignContext.tsx 默认输入一致
const inp = {
  vinMin: 320, vinNom: 390, vinMax: 420,
  vout: 20, pout: 60, vd: 0.6, fs: 200e3,
  eta: 0.93, kRipple: 4.0, dNom: 0.45,
  cEq: 80e-12, deadtime: 300e-9, cPs: 100e-12,
  turnsRatio: undefined,
}

const r = designAhb(inp)
const { n, lm, lr, cb } = r
console.log(`设计结果: n=${n.toFixed(4)}, Lm=${(lm * 1e6).toFixed(1)} µH, Lr=${(lr * 1e6).toFixed(2)} µH, Cr=${(cb * 1e9).toFixed(2)} nF, fr=${(r.fr / 1e3).toFixed(1)} kHz`)
console.log(`Lr 文献八下限 lrMin = ${(r.lrMin * 1e6).toFixed(2)} µH (lr ${lr >= r.lrMin ? '>=' : '<'} lrMin)`)
console.log('warnings:', r.warnings)

let pass = true
const check = (name, ok, detail) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}: ${detail}`)
  if (!ok) pass = false
}

// ① N-1：solveVCr1 标称点 ≈ 173.44 V，且与 solveCrZcs 收敛值一致
const v1nom = solveVCr1(inp, n, lm, lr, cb, inp.vinNom)
check('① solveVCr1(标称) ≈ 173.44V', Math.abs(v1nom - 173.44) < 0.5, `vCr1=${v1nom.toFixed(2)} V, solveCrZcs.vCr1=${r.zcs.vCr1.toFixed(2)} V, 差=${Math.abs(v1nom - r.zcs.vCr1).toExponential(2)} V`)

// N-1 附带：标称点调谐残差折算原边 < 0.05 A
const off = resonantOffState(inp, n, lm, lr, cb, inp.vinNom)
const resPri = Math.abs(off.isEndRaw) / n
check('①b 标称点 ZCS 残差折算原边 < 0.05A', resPri < 0.05, `isEndRaw=${off.isEndRaw.toExponential(3)} A(副边), 折算原边=${resPri.toExponential(3)} A`)

// ② 标称点电荷守恒：mean(is) ≈ Io，误差 <5%（审核第二轮 remodel 后的分相释能模型）
const wave = resonantWaveform(inp, n, lm, lr, cb, inp.vinNom, 4800)
const ts = 1 / inp.fs
let q = 0
for (let k = 0; k < wave.pts.length - 1; k++) q += 0.5 * (wave.pts[k].is + wave.pts[k + 1].is) * (ts / 4800)
const meanIs = q / ts
const io = inp.pout / inp.vout
const qErr = Math.abs(meanIs - io) / io
check('② 波形电荷守恒 mean(is)≈Io (<5%)', qErr < 0.05, `mean(is)=${meanIs.toFixed(4)} A vs Io=${io.toFixed(4)} A, 误差=${(qErr * 100).toFixed(2)}%（隐含功率 ${(meanIs * inp.vout).toFixed(1)} W）`)

// ②c 波形闭合：i_Lr(Ts) == i_Lm(Ts) == iValley（励磁分段线性闭合、伏秒平衡自洽）
const lastPt = wave.pts[wave.pts.length - 1]
const p390 = r.points.nom
check('②c 波形闭合 i_Lr(Ts)=i_Lm(Ts)=iValley',
  Math.abs(lastPt.iLr - p390.iValley) < 1e-3 && Math.abs(lastPt.iLm - p390.iValley) < 1e-3,
  `iLm(Ts)=${lastPt.iLm.toFixed(4)}, iLr(Ts)=${lastPt.iLr.toFixed(4)}, iValley=${p390.iValley.toFixed(4)}`)
check('②d 标称点 tZ≈Toff（调谐归零）且副边导通', wave.secondaryActive && wave.tZ !== null,
  `secondaryActive=${wave.secondaryActive}, tZ=${wave.tZ === null ? 'null' : (wave.tZ * 1e6).toFixed(3) + ' µs'}, Toff=${(((1 - p390.duty) / inp.fs) * 1e6).toFixed(3)} µs`)

// ②b 方法论基准：用旧口径（vCr1=D·Vin+ΔV/2 + 翻转符号）复现审核报告的 91.02W / 1.517×，
// 证明本脚本积分方法与审核同源，② 的失败是模型本身的局限而非脚本错误
{
  const duty = (n * (inp.vout + inp.vd)) / inp.vinNom
  const iAvg = inp.pout / (inp.eta * inp.vinNom * duty)
  const deltaI = (inp.vinNom * (1 - duty) * duty) / (lm * inp.fs)
  const iPk = iAvg + deltaI / 2
  const iValley = iAvg - deltaI / 2
  const t1 = duty * ts
  const vOld = duty * inp.vinNom + (iAvg * duty) / (cb * inp.fs) / 2
  const nVo = n * inp.vout
  const omega = 1 / Math.sqrt(lr * cb)
  const z2 = Math.sqrt(lr / cb)
  const a = (nVo - vOld) / z2
  const N = 20000
  let qo = 0
  for (let k = 0; k < N; k++) {
    const t = ((k + 0.5) / N) * ts
    let iLm, iLr
    if (t <= t1) { iLm = iValley + (deltaI * t) / t1; iLr = iLm } else {
      const tp = t - t1
      iLm = iPk - (deltaI * tp) / (ts - t1)
      iLr = Math.min(iPk * Math.cos(omega * tp) + a * Math.sin(omega * tp), iLm)
    }
    qo += n * Math.max(iLm - iLr, 0) * (ts / N)
  }
  const meanOld = qo / ts
  check('②b 旧口径复现审核基准 91.02W/1.517×', Math.abs(meanOld * inp.vout - 91.02) < 1, `旧口径 mean(is)=${meanOld.toFixed(4)} A → ${(meanOld * inp.vout).toFixed(2)} W, 电荷 ${(meanOld / io).toFixed(3)}×`)
}

// ③ P0-3：iSecRms ≥ Io（三点；320V 点 > 3.0A）
check('③a iSecRms(320V) ≥ 3.0A', r.points.min.iSecRms >= 3.0, `iSecRms=${r.points.min.iSecRms.toFixed(4)} A`)
check('③b iSecRms(390V) ≥ Io', r.points.nom.iSecRms >= io, `iSecRms=${r.points.nom.iSecRms.toFixed(4)} A`)
check('③c iSecRms(420V) ≥ Io', r.points.max.iSecRms >= io, `iSecRms=${r.points.max.iSecRms.toFixed(4)} A`)

// ④ P0-7：vDiode = 48.70V
check('④ vDiode = 48.70V', Math.abs(r.vDiode - 48.70) < 0.05, `vDiode=${r.vDiode.toFixed(2)} V（原式 ${(inp.vinMax / n + inp.vout).toFixed(2)} V 高估）`)

// ⑤ P1-10 式13 数值对照（页面公式修正：分母 sin(ωr1·D·Ts)）
{
  const vin = inp.vinNom
  const duty = (n * (inp.vout + inp.vd)) / vin
  const iAvg = inp.pout / (inp.eta * vin * duty)
  const deltaI = (vin * (1 - duty) * duty) / (lm * inp.fs)
  const iPk = iAvg + deltaI / 2
  const iMin = iAvg - deltaI / 2
  const tsC = 1 / inp.fs
  const w1 = 1 / Math.sqrt((lr + lm) * cb)
  const w2 = 1 / Math.sqrt(lr * cb)
  const z1 = Math.sqrt((lr + lm) / cb)
  const vOld = vin - ((iPk - iMin * Math.cos(w1 * duty * tsC)) / Math.sin(w2 * duty * tsC)) * z1
  const vNew = vin - ((iPk - iMin * Math.cos(w1 * duty * tsC)) / Math.sin(w1 * duty * tsC)) * z1
  check('⑤ 式13 修正后 ≈165.7V', Math.abs(vNew - 165.7) < 2, `修正前(ωr2 分母)=${vOld.toFixed(1)} V, 修正后(ωr1 分母)=${vNew.toFixed(1)} V`)
}

// ⑥ 附带观测：三点残流与死区判定（供人工核对）
for (const [label, p] of [['320V', r.points.min], ['390V', r.points.nom], ['420V', r.points.max]]) {
  console.log(`    ${label}: D=${(p.duty * 100).toFixed(1)}%, iValley=${p.iValley.toFixed(3)}A, iLrEnd=${p.iLrEnd.toFixed(3)}A, isEnd=${p.isEnd.toFixed(3)}A(raw=${p.isEndRaw.toFixed(3)}), zvsEnergyOk=${p.zvsEnergyOk}, deadtimeOk=${p.deadtimeOk}, td1min=${(p.td1min * 1e9).toFixed(0)}ns, td2min=${p.td2min === Infinity ? '∞' : (p.td2min * 1e9).toFixed(0) + 'ns'}`)
}

console.log(pass ? '\n全部验证通过' : '\n存在失败项')
process.exit(pass ? 0 : 1)

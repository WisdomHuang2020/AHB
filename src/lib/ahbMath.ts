/**
 * AHB（不对称半桥）反激变换器核心计算库
 *
 * 拓扑约定：半桥 S1/S2 互补驱动，原边绕组串联隔直（谐振）电容 Cr 接至开关节点，
 * 励磁电感 Lm 与谐振电感 Lr 参与谐振实现 ZVS/ZCS，副边二极管整流。
 *
 * 公式依据（项目知识库文献）：
 *   伏秒平衡：V_Cr = D·V_in；直流增益 V_o ≈ D·V_in/n
 *   文献七式(6)：励磁电流分段线性（三元件段 Lm+Lr，钳位段 Lm）
 *   文献七式(19)：释能阶段 Lr-Cr 二元件谐振 i_Lr(t)
 *   文献七式(21)：副边电流 i_s = n·(i_Lm − i_Lr)
 *   文献八：ZCS 调谐——S2 关断时刻 i_Lr 恰好等于 I_Lm-min
 *   文献八：死区线性充电式 T_dmin = C_eq·V_in/I
 */

export interface AhbInputs {
  vinMin: number      // 最低输入电压 (V)
  vinNom: number      // 额定输入电压 (V)
  vinMax: number      // 最高输入电压 (V)
  vout: number        // 输出电压 (V)
  pout: number        // 输出功率 (W)
  vd: number          // 副边二极管压降 (V)
  fs: number          // 开关频率 (Hz)
  eta: number         // 目标效率 (0~1)
  kRipple: number     // 励磁电流纹波系数 ΔI / I_avg（标称点）
  dNom: number        // 标称占空比设计目标
  cEq: number         // 开关节点等效电容 Coss_eq (F)
  deadtime: number    // 控制器死区时间 (s)
  turnsRatio?: number // 手动指定匝比；undefined 时按 dNom 自动计算
}

export interface AhbOperatingPoint {
  vin: number
  duty: number          // D = n(Vo+Vd)/Vin
  iLmAvg: number        // 励磁电流平均值 (A)
  deltaI: number        // 励磁电流峰-峰纹波 (A)
  iPk: number           // 励磁电流峰值 (A)
  iValley: number       // 励磁电流谷值（<0 提供 ZVS 能量）(A)
  iPriRms: number       // 原边电流有效值 (A)
  iSecAvg: number       // 副边二极管平均电流 (A)
  iSecPk: number        // 副边峰值电流 (A)
  iSecRms: number       // 副边电流有效值 (A)
  iCoRms: number        // 输出电容纹波电流有效值 (A)
  vCb: number           // 隔直电容电压（直流分量）(V)
  deltaVCb: number      // 隔直电容电压纹波峰-峰值 (V)
  iLrEnd: number        // S2 关断时刻谐振腔电流（ZCS 调谐下应等于 iValley）(A)
  isEnd: number         // S2 关断时刻副边残存电流（=0 则 ZCS 完美）(A)
  zvsEnergyOk: boolean  // ZVS 能量判据
  zvsMargin: number     // ZVS 能量裕量（储能/需求）
  deadtimeOk: boolean   // 死区时间是否满足谐振换流要求
  deadtimeNeed: number  // 谐振换流所需死区 ≈ (π/2)·√(Lm·C_eq) (s)
  td1min: number        // 文献式最小死区（S1 关断，线性充电）: C_eq·V_in/I_pk (s)
  td2min: number        // 文献式最小死区（S2 关断，线性充电）: C_eq·V_in/|I_valley| (s)
}

export interface ZcsSolution {
  omega: number       // 二元件谐振角频率 ω_r2 (rad/s)
  fr: number          // 谐振频率 (Hz)
  cb: number          // ZCS 调谐隔直/谐振电容 (F)
  z2: number          // 特征阻抗 √(Lr/Cr) (Ω)
  vCr1: number        // S1→S2 切换时刻 Cr 电压 (V)
  vCrEnd: number      // S2 关断时刻 Cr 电压 (V)
  deltaVCr: number    // Cr 电压纹波峰-峰值 (V)
  converged: boolean
}

export interface AhbDesignResult {
  n: number             // 匝比 Np/Ns
  lm: number            // 励磁电感 (H)
  cb: number            // 隔直/谐振电容（ZCS 调谐值）(F)
  lr: number            // 参与谐振的漏感+串感 (H)
  fr: number            // Lr·Cr 谐振频率 (Hz)
  zcs: ZcsSolution
  points: {
    min: AhbOperatingPoint    // V_in = vinMin
    nom: AhbOperatingPoint    // V_in = vinNom
    max: AhbOperatingPoint    // V_in = vinMax
  }
  iout: number          // 输出电流 (A)
  vDiode: number        // 副边二极管电压应力 (V)
  vMos: number          // MOSFET 电压应力 (V)
  warnings: string[]
}

/** 标称占空比下的励磁电感设计（满足纹波系数 kRipple） */
export function designLm(inp: AhbInputs, n: number): number {
  const iAvg = inp.pout / (inp.eta * inp.vinNom * inp.dNom)
  const deltaI = inp.kRipple * iAvg
  // ΔI = Vin(1-D)·D / (Lm·fs)
  return (inp.vinNom * (1 - inp.dNom) * inp.dNom) / (deltaI * inp.fs)
}

/**
 * 释能阶段（S2 导通）二元件谐振：式(19)
 *   i_Lr(t') = I0·cos(ω t') + (nVo − V_Cr1)/Z2 · sin(ω t')，t' = t − D·Ts
 * 返回 S2 关断时刻的 i_Lr 与副边残存电流 i_s。
 */
export function resonantOffState(
  inp: AhbInputs, n: number, lm: number, lr: number, cb: number, vin: number,
): { duty: number; iPk: number; iValley: number; iLrEnd: number; isEnd: number; vCr1: number } {
  const duty = (n * (inp.vout + inp.vd)) / vin
  const iLmAvg = inp.pout / (inp.eta * vin * duty)
  const deltaI = (vin * (1 - duty) * duty) / (lm * inp.fs)
  const iPk = iLmAvg + deltaI / 2
  const iValley = iLmAvg - deltaI / 2
  const deltaV = (iLmAvg * duty) / (cb * inp.fs)
  const vCr1 = duty * vin + deltaV / 2       // 切换时刻 Cr 电压（峰值）
  const nVo = n * inp.vout
  const omega = 1 / Math.sqrt(lr * cb)
  const z2 = Math.sqrt(lr / cb)
  const tOff = (1 - duty) / inp.fs
  const th = omega * tOff
  const a = (nVo - vCr1) / z2
  const iLrEnd = iPk * Math.cos(th) + a * Math.sin(th)
  const isEnd = Math.max(n * (iValley - iLrEnd), 0)
  return { duty, iPk, iValley, iLrEnd, isEnd, vCr1 }
}

/**
 * 文献八 ZCS 调谐求解器（标称输入点）：
 * 求解 ω_r2 与 V_Cr1，使 S2 关断时刻 i_Lr(T_off) = I_Lm-min（副边电流恰好归零），
 * 同时满足 Cr 电荷平衡（导通期充电 = 释能期放电）。
 * 不动点迭代：V_Cr1 → 二分求 θ∈(π,2π) 的调谐根 → Cr → 新的 V_Cr1。
 */
export function solveCrZcs(inp: AhbInputs, n: number, lm: number, lr: number): ZcsSolution {
  const vin = inp.vinNom
  const duty = (n * (inp.vout + inp.vd)) / vin
  const iAvg = inp.pout / (inp.eta * vin * duty)
  const deltaI = (vin * (1 - duty) * duty) / (lm * inp.fs)
  const iPk = iAvg + deltaI / 2
  const iValley = iAvg - deltaI / 2
  const tOff = (1 - duty) / inp.fs
  const nVo = n * inp.vout

  let v1 = duty * vin
  let omega = 2 * Math.PI * inp.fs
  let converged = false

  for (let iter = 0; iter < 60; iter++) {
    // f(θ) = iPk·cosθ + (nVo−v1)·tOff/(θ·lr)·sinθ − iValley，在 (π, 2π) 上二分
    const f = (th: number) =>
      iPk * Math.cos(th) + ((nVo - v1) * tOff) / (th * lr) * Math.sin(th) - iValley
    let lo = Math.PI + 1e-9
    let hi = 2 * Math.PI - 1e-9
    if (f(lo) * f(hi) > 0) break // 无解（如谷值过深），保持上次值
    for (let k = 0; k < 80; k++) {
      const mid = (lo + hi) / 2
      if (f(lo) * f(mid) <= 0) hi = mid
      else lo = mid
    }
    const th = (lo + hi) / 2
    omega = th / tOff
    const cb = 1 / (omega * omega * lr)
    const z2 = omega * lr
    // Cr 电荷平衡：释能期末电压 + 导通期充电量 = 下一周期切换时刻电压
    const vCrEnd = nVo - (nVo - v1) * Math.cos(th) + z2 * iPk * Math.sin(th)
    const deltaV = (iAvg * duty) / (cb * inp.fs)
    const v1New = vCrEnd + deltaV
    if (Math.abs(v1New - v1) < 1e-6 * Math.max(v1, 1)) {
      v1 = v1New
      converged = true
      break
    }
    v1 = v1New
  }

  const cb = 1 / (omega * omega * lr)
  const z2 = Math.sqrt(lr / cb)
  const deltaV = (iAvg * duty) / (cb * inp.fs)
  const vCrEnd = nVo - (nVo - v1) * Math.cos(omega * tOff) + z2 * iPk * Math.sin(omega * tOff)
  return {
    omega,
    fr: omega / (2 * Math.PI),
    cb,
    z2,
    vCr1: v1,
    vCrEnd,
    deltaVCr: deltaV,
    converged,
  }
}

/** 给定 Vin 计算一个稳态工作点 */
export function operatingPoint(inp: AhbInputs, n: number, lm: number, lr: number, cb: number, vin: number): AhbOperatingPoint {
  const duty = (n * (inp.vout + inp.vd)) / vin
  // 计入效率的工程形式；文献七式(9) I_Lm-avg = I_o/n 为其 η=1、Vd=0 的理想形式
  // （因 Vin·D = n(Vo+Vd)，P/(η·Vin·D) = Io·Vo/(η·n(Vo+Vd)) ≈ Io/(η·n)）
  const iLmAvg = inp.pout / (inp.eta * vin * duty)
  const deltaI = (vin * (1 - duty) * duty) / (lm * inp.fs)
  const iPk = iLmAvg + deltaI / 2
  const iValley = iLmAvg - deltaI / 2

  // 梯形波有效值（式22的工程近似）：I_rms = √(D·(I_avg² + ΔI²/12))
  const iPriRms = Math.sqrt(duty * (iLmAvg * iLmAvg + (deltaI * deltaI) / 12))
  const iSecAvg = inp.pout / inp.vout
  const iSecPk = n * iPk
  // 副边 RMS 按梯形波保守近似（未计入式19/21 的半正弦谐振形状，结果偏大，对绕组选型有利）
  const iSecRms = Math.sqrt((1 - duty) * ((n * iLmAvg) ** 2 + ((n * deltaI) ** 2) / 12))
  const iCoRms = Math.sqrt(Math.max(iSecRms * iSecRms - iSecAvg * iSecAvg, 0))

  const vCb = duty * vin
  const deltaVCb = (iLmAvg * duty) / (cb * inp.fs)

  // 释能阶段谐振：S2 关断时刻的 i_Lr 与副边残存电流（式19/21）
  const { iLrEnd, isEnd } = resonantOffState(inp, n, lm, lr, cb, vin)

  // ZVS 能量判据：½·Lm·I_valley² ≥ ½·C_eq·V_in²
  const stored = 0.5 * lm * iValley * iValley
  const needed = 0.5 * inp.cEq * vin * vin
  const zvsEnergyOk = iValley < 0 && stored >= needed
  const zvsMargin = needed > 0 ? stored / needed : Infinity

  // 死区时间：谐振换流需要约 (π/2)·√(Lm·C_eq)
  const deadtimeNeed = (Math.PI / 2) * Math.sqrt(lm * inp.cEq)
  const deadtimeOk = zvsEnergyOk && inp.deadtime >= deadtimeNeed

  // 文献（八）线性充电近似：T_dmin = C_eq·V_in / I
  const td1min = (inp.cEq * vin) / Math.max(iPk, 1e-9)
  const td2min = iValley < 0 ? (inp.cEq * vin) / Math.abs(iValley) : Infinity

  return {
    vin, duty, iLmAvg, deltaI, iPk, iValley,
    iPriRms, iSecAvg, iSecPk, iSecRms, iCoRms,
    vCb, deltaVCb, iLrEnd, isEnd, zvsEnergyOk, zvsMargin, deadtimeOk, deadtimeNeed,
    td1min, td2min,
  }
}

/** 完整设计流程 */
export function designAhb(inp: AhbInputs): AhbDesignResult {
  const n = inp.turnsRatio && inp.turnsRatio > 0
    ? inp.turnsRatio
    : (inp.dNom * inp.vinNom) / (inp.vout + inp.vd)

  const lm = designLm(inp, n)

  // 漏感+串感取 Lm 的 3%（典型值）
  const lr = 0.03 * lm

  // 隔直/谐振电容：文献八 ZCS 调谐（S2 关断时刻 i_Lr = I_Lm-min）
  const zcs = solveCrZcs(inp, n, lm, lr)
  const cb = zcs.cb
  const fr = zcs.fr

  const points = {
    min: operatingPoint(inp, n, lm, lr, cb, inp.vinMin),
    nom: operatingPoint(inp, n, lm, lr, cb, inp.vinNom),
    max: operatingPoint(inp, n, lm, lr, cb, inp.vinMax),
  }

  const iout = inp.pout / inp.vout
  const vDiode = inp.vinMax / n + inp.vout
  const vMos = inp.vinMax

  const warnings: string[] = []
  if (points.min.duty > 0.65) warnings.push(`低压输入占空比 D=${(points.min.duty * 100).toFixed(1)}% 偏大，建议增大匝比 n`)
  if (points.max.duty < 0.15) warnings.push(`高压输入占空比 D=${(points.max.duty * 100).toFixed(1)}% 偏小，建议减小匝比 n`)
  if (!points.max.zvsEnergyOk) warnings.push('高压输入点 ZVS 能量不足：谷值电流提供的励磁储能不足以完成开关节点电容充放电')
  if (!points.min.deadtimeOk) warnings.push(`低压输入点死区时间不足：需要 ≥ ${(points.min.deadtimeNeed * 1e9).toFixed(0)} ns`)
  if (!zcs.converged) warnings.push('ZCS 调谐求解未收敛：当前参数组合下无法使 i_Lr 在 S2 关断时回到 I_Lm-min，请调整纹波系数 Kr 或频率')
  const ripplePct = (zcs.deltaVCr / points.nom.vCb) * 100
  if (ripplePct > 20) warnings.push(`Cr 电压纹波 ${zcs.deltaVCr.toFixed(1)} V 占 V_Cr 的 ${ripplePct.toFixed(0)}%（>20%），注意 Cr 的耐压与 ESR 选型`)

  return {
    n, lm, cb, lr, fr, zcs,
    points, iout, vDiode, vMos, warnings,
  }
}

/** 直流增益 M = D/n（Vo+Vd 归一化到 Vin） */
export function dcGain(duty: number, n: number): number {
  return duty / n
}

/**
 * 精确谐振波形（文献七式 6/19/21）：一个开关周期内
 * i_Lm（三角波）、i_Lr（三元件段随 i_Lm，释能段二元件谐振）、i_s = n·(i_Lm − i_Lr)。
 */
export function resonantWaveform(
  inp: AhbInputs, n: number, lm: number, lr: number, cb: number, vin: number, samples = 240,
): { t: number; iLm: number; iLr: number; is: number }[] {
  const duty = (n * (inp.vout + inp.vd)) / vin
  const iAvg = inp.pout / (inp.eta * vin * duty)
  const deltaI = (vin * (1 - duty) * duty) / (lm * inp.fs)
  const iPk = iAvg + deltaI / 2
  const iValley = iAvg - deltaI / 2
  const ts = 1 / inp.fs
  const t1 = duty * ts
  const deltaV = (iAvg * duty) / (cb * inp.fs)
  const vCr1 = duty * vin + deltaV / 2
  const nVo = n * inp.vout
  const omega = 1 / Math.sqrt(lr * cb)
  const z2 = Math.sqrt(lr / cb)
  const a = (nVo - vCr1) / z2

  const pts: { t: number; iLm: number; iLr: number; is: number }[] = []
  for (let k = 0; k <= samples; k++) {
    const t = (k / samples) * ts
    let iLm: number
    let iLr: number
    if (t <= t1) {
      // 储能阶段：三元件谐振近似线性（式6 第一支路）
      iLm = iValley + (deltaI * t) / t1
      iLr = iLm
    } else {
      // 释能阶段：i_Lm 被钳位线性下降（式6 第二支路），i_Lr 二元件谐振（式19）
      const tp = t - t1
      iLm = iPk - (deltaI * tp) / (ts - t1)
      const iLrRes = iPk * Math.cos(omega * tp) + a * Math.sin(omega * tp)
      // 谐振电流高于励磁电流时副边断流，两者汇合
      iLr = Math.min(iLrRes, iLm)
    }
    const is = n * Math.max(iLm - iLr, 0)
    pts.push({ t: t * 1e6, iLm, iLr, is })
  }
  return pts
}

/**
 * AHB（不对称半桥）反激变换器核心计算库
 *
 * 拓扑约定：半桥 Q1/Q2 互补驱动，原边绕组串联隔直（谐振）电容 Cb 接至开关节点，
 * 励磁电感 Lm 与漏感 Lr 参与谐振实现 ZVS，副边二极管整流。
 *
 * 一阶直流关系（伏秒平衡）：
 *   V_Cb = D · V_in
 *   V_o  = D · V_in / n - V_d        （n = Np/Ns）
 * 导通期 Lm 电压：V_in(1-D)；关断期 Lm 电压：-D·V_in = -n(V_o+V_d)
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
  vCb: number           // 隔直电容电压 (V)
  deltaVCb: number      // 隔直电容电压纹波峰-峰值 (V)
  zvsEnergyOk: boolean  // ZVS 能量判据
  zvsMargin: number     // ZVS 能量裕量（储能/需求）
  deadtimeOk: boolean   // 死区时间是否满足谐振换流要求
  deadtimeNeed: number  // 谐振换流所需死区 ≈ (π/2)·√(Lm·C_eq) (s)
  td1min: number        // 文献式最小死区（S1 关断，线性充电）: C_eq·V_in/I_pk (s)
  td2min: number        // 文献式最小死区（S2 关断，线性充电）: C_eq·V_in/|I_valley| (s)
}

export interface AhbDesignResult {
  n: number             // 匝比 Np/Ns
  lm: number            // 励磁电感 (H)
  cb: number            // 隔直电容（按纹波与谐振约束取值）(F)
  lr: number            // 参与谐振的漏感+串感 (H)
  fr: number            // Lr·Cb 谐振频率 (Hz)
  cbRippleOk: boolean   // Cb 纹波占比 ≤5%
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

/** 给定 Vin 计算一个稳态工作点 */
export function operatingPoint(inp: AhbInputs, n: number, lm: number, cb: number, vin: number): AhbOperatingPoint {
  const duty = (n * (inp.vout + inp.vd)) / vin
  const iLmAvg = inp.pout / (inp.eta * vin * duty)
  const deltaI = (vin * (1 - duty) * duty) / (lm * inp.fs)
  const iPk = iLmAvg + deltaI / 2
  const iValley = iLmAvg - deltaI / 2

  // 梯形波有效值：I_rms = √(D·(I_avg² + ΔI²/12))
  const iPriRms = Math.sqrt(duty * (iLmAvg * iLmAvg + (deltaI * deltaI) / 12))
  const iSecAvg = inp.pout / inp.vout
  const iSecPk = n * iPk
  const iSecRms = Math.sqrt((1 - duty) * ((n * iLmAvg) ** 2 + ((n * deltaI) ** 2) / 12))
  const iCoRms = Math.sqrt(Math.max(iSecRms * iSecRms - iSecAvg * iSecAvg, 0))

  const vCb = duty * vin
  const deltaVCb = (iLmAvg * duty) / (cb * inp.fs)

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
    vCb, deltaVCb, zvsEnergyOk, zvsMargin, deadtimeOk, deadtimeNeed,
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

  // 隔直电容：谐振频率取 fs 的 1/5 以下，同时校验纹波 ≤5% V_Cb
  const cbRes = 1 / ((2 * Math.PI * inp.fs * 0.2) ** 2 * lr)
  let cb = cbRes
  // 迭代：若纹波超标则加大 Cb
  for (let i = 0; i < 20; i++) {
    const p = operatingPoint(inp, n, lm, cb, inp.vinNom)
    if (p.deltaVCb <= 0.05 * p.vCb) break
    cb *= 1.5
  }
  const fr = 1 / (2 * Math.PI * Math.sqrt(lr * cb))

  const points = {
    min: operatingPoint(inp, n, lm, cb, inp.vinMin),
    nom: operatingPoint(inp, n, lm, cb, inp.vinNom),
    max: operatingPoint(inp, n, lm, cb, inp.vinMax),
  }

  const iout = inp.pout / inp.vout
  const vDiode = inp.vinMax / n + inp.vout
  const vMos = inp.vinMax

  const warnings: string[] = []
  if (points.min.duty > 0.65) warnings.push(`低压输入占空比 D=${(points.min.duty * 100).toFixed(1)}% 偏大，建议增大匝比 n`)
  if (points.max.duty < 0.15) warnings.push(`高压输入占空比 D=${(points.max.duty * 100).toFixed(1)}% 偏小，建议减小匝比 n`)
  if (!points.max.zvsEnergyOk) warnings.push('高压输入点 ZVS 能量不足：谷值电流提供的励磁储能不足以完成开关节点电容充放电')
  if (!points.min.deadtimeOk) warnings.push(`低压输入点死区时间不足：需要 ≥ ${(points.min.deadtimeNeed * 1e9).toFixed(0)} ns`)
  if (fr > inp.fs / 3) warnings.push(`Lr·Cb 谐振频率 ${(fr / 1000).toFixed(1)} kHz 偏高（应远低于开关频率），建议增大 Cb`)

  return {
    n, lm, cb, lr, fr,
    cbRippleOk: points.nom.deltaVCb <= 0.05 * points.nom.vCb,
    points, iout, vDiode, vMos, warnings,
  }
}

/** 直流增益 M = D/n（Vo+Vd 归一化到 Vin） */
export function dcGain(duty: number, n: number): number {
  return duty / n
}

/** 生成一个开关周期的励磁电流波形采样点 */
export function magnetizingWaveform(inp: AhbInputs, n: number, lm: number, vin: number, samples = 200) {
  const p = operatingPoint(inp, n, lm, 1e-9, vin) // cb 不影响电流波形
  const t1 = p.duty / inp.fs
  const pts: { t: number; i: number }[] = []
  for (let k = 0; k <= samples; k++) {
    const t = (k / samples) / inp.fs
    let i: number
    if (t <= t1) {
      i = p.iValley + (p.deltaI * t) / t1
    } else {
      i = p.iPk - (p.deltaI * (t - t1)) / (1 / inp.fs - t1)
    }
    pts.push({ t: t * 1e6, i })
  }
  return pts
}

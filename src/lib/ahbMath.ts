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
 *   文献七式(21)：副边电流。本站实现 i_s = n·(i_Lm − i_Lr)（审核第二轮 remodel）：
 *   串联 Cr 隔直 ⇒ ⟨i_Lr⟩=0；输出电荷守恒 ⟨i_s⟩=Io=n·⟨i_Lm⟩，二者在该参考方向下
 *   （i_Lr 储能充电为正、i_s 流出同名端为正）唯一确定此形式；文献七式(21) 字面
 *   写作 n(i_Lr−i_Lm)，差异为参考方向约定（扫描件原图箭头），物理等价。
 *   文献八：ZCS 调谐——S2 关断时刻 i_Lr 恰好等于 I_Lm-min
 *   文献八：死区线性充电式 T_dmin = C_eq·V_in/I（C_eq ≡ 2·C_oss 开关节点总等效电容，审核修订 P1-11）
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
  cEq: number         // 开关节点等效总电容 C_eq ≡ 2·C_oss（两管结电容之和）(F)；Td1min/Td2min 公式中的 2C_oss 即此值（审核修订 P1-11）
  deadtime: number    // 控制器死区时间 (s)
  cPs: number         // 副边整流管结电容原边折算 C_ps（绕组寄生电容）(F)（审核修订 P2-16）
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
  isEnd: number         // S2 关断时刻副边残存电流（=0 则 ZCS 成立；提前归零亦为 0）(A)
  isEndRaw: number      // isEnd 未截断原值 n·(iValley − iLr弧端值)：>0=残流(ZCS丢失)，<0=提前ZCS（审核 remodel）(A)
  zvsEnergyOk: boolean  // ZVS 能量判据
  zvsMargin: number     // ZVS 能量裕量（储能/需求）
  deadtimeOk: boolean   // 死区时间是否满足换流要求（仅判死区，不再与 ZVS 能量合取；审核修订 P0-2/P1-11）
  deadtimeNeed: number  // 谐振换流所需死区 ≈ (π/2)·√(Lm·C_eq)：基于 L_m 的保守估计（所需死区更长），文献八给的是 L_r 口径（审核修订 P1-9）(s)
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
  lrMin: number         // 文献八谐振电感下限（三个工作点取最严者，审核修订 P2-16）(H)
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
 * 审核修订 N-1：按工作点求解切换时刻 Cr 电压 v_Cr1（不动点迭代，与 solveCrZcs 同一更新逻辑）。
 * cb 已定（标称点 ZCS 调谐值）时，对每个 Vin：
 *   不动点方程 v_Cr1 = vCrEnd(v_Cr1) + ΔV
 *   vCrEnd = 释能期二元件谐振末值，ΔV = 导通期充电量。
 * 标称点收敛值与 solveCrZcs 一致（默认算例 ≈173.44 V）；下游一律使用本函数，
 * 不再使用 duty·vin + ΔV/2 的近似（其 184.98 V 跨过副边电流符号阈值 175.65 V，
 * 曾导致副边电流符号翻转、ZCS 残差被掩盖、波形电荷超量 1.517 倍）。
 */
export function solveVCr1(
  inp: AhbInputs, n: number, lm: number, lr: number, cb: number, vin: number,
): number {
  const duty = (n * (inp.vout + inp.vd)) / vin
  const iAvg = inp.pout / (inp.eta * vin * duty)
  const deltaI = (vin * (1 - duty) * duty) / (lm * inp.fs)
  const iPk = iAvg + deltaI / 2
  const tOff = (1 - duty) / inp.fs
  const nVo = n * inp.vout
  const omega = 1 / Math.sqrt(lr * cb)
  const z2 = Math.sqrt(lr / cb)
  const th = omega * tOff
  const sinTh = Math.sin(th)
  const cosTh = Math.cos(th)
  const deltaV = (iAvg * duty) / (cb * inp.fs)
  let v1 = duty * vin
  for (let iter = 0; iter < 60; iter++) {
    // Cr 电荷平衡：释能期末电压 + 导通期充电量 = 下一周期切换时刻电压
    const vCrEnd = nVo - (nVo - v1) * cosTh + z2 * iPk * sinTh
    const v1New = vCrEnd + deltaV
    if (Math.abs(v1New - v1) < 1e-9 * Math.max(v1, 1)) { v1 = v1New; break }
    v1 = v1New
  }
  return v1
}

/**
 * 释能段轨迹原语（resonantOffState 与 resonantWaveform 共享，审核第二轮 remodel）。
 * 副边导通窗口内：i_Lm 被副边反射电压钳位线性下降（斜率 −n(Vo+Vd)/Lm，
 * 文献式6 的 −nVo/Lm 为 Vd=0 理想形式）；i_Lr 走文献七式19 二元件谐振弧
 * （v_Cr1 由 solveVCr1 按工作点求解，审核 N-1）。
 * i_s/n = i_Lm − i_Lr：符号由 Cr 隔直（⟨i_Lr⟩=0）与输出电荷守恒
 * （⟨i_s⟩=n·⟨i_Lm⟩=Io）唯一确定；文献七式21 字面形式 n(i_Lr−i_Lm) 与本站
 * 参考方向相反（扫描件等效电路箭头），物理等价。
 * tC：is 由 0 转正的导通起点；tZ：is 首次归零时刻（ZCS 点），null = 至关断未归零。
 */
interface ReleaseTrajectory {
  duty: number
  iPk: number
  iValley: number
  vCr1: number
  tOff: number
  arc: (tp: number) => number   // 式19 谐振弧 i_Lr(t')
  chord: (tp: number) => number // 钳位 i_Lm(t') 斜线
  tC: number | null
  tZ: number | null
}

function releaseTrajectory(
  inp: AhbInputs, n: number, lm: number, lr: number, cb: number, vin: number,
): ReleaseTrajectory {
  const duty = (n * (inp.vout + inp.vd)) / vin
  const iLmAvg = inp.pout / (inp.eta * vin * duty)
  const deltaI = (vin * (1 - duty) * duty) / (lm * inp.fs)
  const iPk = iLmAvg + deltaI / 2
  const iValley = iLmAvg - deltaI / 2
  const vCr1 = solveVCr1(inp, n, lm, lr, cb, vin)
  const nVo = n * inp.vout
  const omega = 1 / Math.sqrt(lr * cb)
  const z2 = Math.sqrt(lr / cb)
  const tOff = (1 - duty) / inp.fs
  const a = (nVo - vCr1) / z2
  const arc = (tp: number) => iPk * Math.cos(omega * tp) + a * Math.sin(omega * tp)
  const mLm = deltaI / tOff // = Vin·D/Lm = n(Vo+Vd)/Lm
  const chord = (tp: number) => iPk - mLm * tp
  const diff = (tp: number) => chord(tp) - arc(tp) // = is / n

  // 细扫 + 二分定位导通窗口 [tC, tZ]（diff 形状简单：起点 0 → 微小负段 → 正脉冲 → 回零）
  const findZero = (lo: number, hi: number): number => {
    for (let k = 0; k < 60; k++) {
      const mid = (lo + hi) / 2
      if (diff(lo) * diff(mid) <= 0) hi = mid
      else lo = mid
    }
    return (lo + hi) / 2
  }
  const SCAN = 4000
  let tC: number | null = null
  let tZ: number | null = null
  let prevT = 0
  let prev = diff(0)
  for (let k = 1; k <= SCAN; k++) {
    const tp = (k / SCAN) * tOff
    const v = diff(tp)
    if (tC === null && prev <= 0 && v > 0) {
      tC = prev === 0 && prevT === 0 ? 0 : findZero(prevT, tp)
    } else if (tC !== null && tZ === null && prev > 0 && v <= 0) {
      tZ = findZero(prevT, tp)
    }
    prevT = tp
    prev = v
  }
  return { duty, iPk, iValley, vCr1, tOff, arc, chord, tC, tZ }
}

/**
 * 释能阶段（S2 导通）末态：式(19) 谐振弧 + 钳位斜线 + 相位B闭合（审核第二轮 remodel）。
 * 返回 S2 关断时刻的 i_Lr 与副边残存电流 i_s：
 *   tZ 存在（调谐点或提前 ZCS）→ 已汇合，iLrEnd = iValley、isEnd = 0；
 *   tZ 不存在 → 谐振弧至关断未回到谷值，isEnd = 残流（ZCS 丢失）。
 */
export function resonantOffState(
  inp: AhbInputs, n: number, lm: number, lr: number, cb: number, vin: number,
): { duty: number; iPk: number; iValley: number; iLrEnd: number; isEnd: number; isEndRaw: number; vCr1: number } {
  const tr = releaseTrajectory(inp, n, lm, lr, cb, vin)
  const { duty, iPk, iValley, vCr1, tOff, arc, tZ } = tr
  const arcEnd = arc(tOff)
  // 审核 remodel：isEndRaw = n·(I_Lm-min − i_Lr(Toff))，与波形 i_s=n(i_Lm−i_Lr) 同约定。
  // >0 = 关断残流（ZCS 丢失）；≈0 = 调谐点；<0 = 提前 ZCS。不再用 max(…,0) 掩盖残差
  const isEndRaw = n * (iValley - arcEnd)
  const merged = tZ !== null // 已归零并汇合（含调谐点与提前 ZCS）
  const iLrEnd = merged ? iValley : arcEnd
  const isEnd = Math.max(isEndRaw, 0)
  return { duty, iPk, iValley, iLrEnd, isEnd, isEndRaw, vCr1 }
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
  // 审核修订 P0-3：导通期均值取 Io/(1−D)（原误用周期均值 n·I_Lm,avg，曾导致 320V 点
  // iSecRms=2.90 < Io=3.00，违反 RMS ≥ |均值| 的数学硬约束）。梯形波保守近似
  // （未计入式19/21 的半正弦谐振形状），修正后保证 iSecRms ≥ Io
  const iSecOnAvg = iSecAvg / (1 - duty)
  const iSecRms = Math.sqrt((1 - duty) * (iSecOnAvg ** 2 + ((n * deltaI) ** 2) / 12))
  // 输出电容纹波电流：iSecRms² − Io²，max(…,0) 仅为数值下界保护
  const iCoRms = Math.sqrt(Math.max(iSecRms * iSecRms - iSecAvg * iSecAvg, 0))

  const vCb = duty * vin
  const deltaVCb = (iLmAvg * duty) / (cb * inp.fs)

  // 释能阶段谐振：S2 关断时刻的 i_Lr 与副边残存电流（式19/21）
  const { iLrEnd, isEnd, isEndRaw } = resonantOffState(inp, n, lm, lr, cb, vin)

  // ZVS 能量判据：½·Lm·I_valley² ≥ ½·C_eq·V_in²
  const stored = 0.5 * lm * iValley * iValley
  const needed = 0.5 * inp.cEq * vin * vin
  const zvsEnergyOk = iValley < 0 && stored >= needed
  const zvsMargin = needed > 0 ? stored / needed : Infinity

  // 审核修订 P1-9：死区期间副边不导通、Lm 参与谐振，此处保留 Lm（Lm≫Lr），
  // 为「基于 L_m 的保守估计」（所需死区更长）；文献八给的是 L_r 口径
  const deadtimeNeed = (Math.PI / 2) * Math.sqrt(lm * inp.cEq)

  // 文献（八）线性充电近似：T_dmin = C_eq·V_in / I（C_eq ≡ 2·C_oss，与推导页公式一致，审核修订 P1-11）
  const td1min = (inp.cEq * vin) / Math.max(iPk, 1e-9)
  const td2min = iValley < 0 ? (inp.cEq * vin) / Math.abs(iValley) : Infinity

  // 审核修订 P0-2：deadtimeOk 只判死区（不再与 zvsEnergyOk 合取，ZVS 能量在 designAhb 中单独扫三点告警）
  // 审核修订 P1-11：td1min/td2min 纳入判定（td2min=Infinity 时自然不满足，等效于谷值非负无法换流）
  const deadtimeOk = inp.deadtime >= deadtimeNeed && inp.deadtime >= td1min && inp.deadtime >= td2min

  return {
    vin, duty, iLmAvg, deltaI, iPk, iValley,
    iPriRms, iSecAvg, iSecPk, iSecRms, iCoRms,
    vCb, deltaVCb, iLrEnd, isEnd, isEndRaw, zvsEnergyOk, zvsMargin, deadtimeOk, deadtimeNeed,
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
  // 审核修订 P0-7：二极管应力严格式 V_D = Vin_max/n − Vd（等价 Vo + Vin_max(1−D_min)/n），
  // 原式 Vin_max/n + Vo 高估 42%（默认算例 48.70 V vs 原 69.30 V）
  const vDiode = inp.vinMax / n - inp.vd
  const vMos = inp.vinMax

  // 审核修订 P2-16：文献八谐振电感下限校核
  //   Lr ≥ 4·C_oss²·Vin²/(π²·I_Lm-max²) · (2C_oss+C_ps)/(2C_oss·C_ps)，其中 2C_oss ≡ cEq
  const lrMinAt = (p: AhbOperatingPoint) =>
    (inp.cEq * p.vin * p.vin * (inp.cEq + inp.cPs)) / (Math.PI * Math.PI * p.iPk * p.iPk * inp.cPs)
  const lrMin = Math.max(lrMinAt(points.min), lrMinAt(points.nom), lrMinAt(points.max))

  const warnings: string[] = []
  // 审核修订 P0-1：D = n(Vo+Vd)/Vin ⇒ D ∝ n，低压 D 偏大应减小匝比，高压 D 偏小应增大匝比（原方向全反）
  if (points.min.duty > 0.65) warnings.push(`低压输入占空比 D=${(points.min.duty * 100).toFixed(1)}% 偏大，建议减小匝比 n`)
  if (points.max.duty < 0.15) warnings.push(`高压输入占空比 D=${(points.max.duty * 100).toFixed(1)}% 偏小，建议增大匝比 n`)
  // 审核修订 P0-2/P2-13：ZVS 能量判定扫 min/nom/max 三个工作点，哪点不足写哪点
  const zvsFails: string[] = []
  if (!points.min.zvsEnergyOk) zvsFails.push(`低压 ${inp.vinMin} V`)
  if (!points.nom.zvsEnergyOk) zvsFails.push(`额定 ${inp.vinNom} V`)
  if (!points.max.zvsEnergyOk) zvsFails.push(`高压 ${inp.vinMax} V`)
  if (zvsFails.length > 0) warnings.push(`ZVS 能量不足（${zvsFails.join('、')}）：谷值电流提供的励磁储能不足以完成开关节点电容充放电`)
  // 审核修订 P0-2：死区告警只谈死区（谐振换流估计与文献八线性充电下限取大者）
  const dtPoints: [string, AhbOperatingPoint][] = [
    [`低压 ${inp.vinMin} V`, points.min],
    [`额定 ${inp.vinNom} V`, points.nom],
    [`高压 ${inp.vinMax} V`, points.max],
  ]
  for (const [label, p] of dtPoints) {
    if (!p.deadtimeOk) {
      const need = Math.max(p.deadtimeNeed, p.td1min, p.td2min)
      const needTxt = need === Infinity
        ? '∞（谷值非负，S2 关断换流不可行）'
        : `${(need * 1e9).toFixed(0)} ns`
      warnings.push(`${label}输入点死区时间不足：需要 ≥ ${needTxt}`)
    }
  }
  // 审核修订 N-1：标称点调谐残差若折算原边超过 0.05 A 则暴露（修复后应自然 ≈ 0）
  const nomResPri = Math.abs(points.nom.isEndRaw) / n
  if (nomResPri > 0.05) warnings.push(`额定点 ZCS 调谐残差偏大：副边残流折算原边 ${nomResPri.toFixed(3)} A（>0.05 A），谐振模型与调谐解不一致，请复核参数`)
  if (!zcs.converged) warnings.push('ZCS 调谐求解未收敛：当前参数组合下无法使 i_Lr 在 S2 关断时回到 I_Lm-min，请调整纹波系数 Kr 或频率')
  // 审核修订 P2-16：Lr 低于文献八下限时告警
  if (lr < lrMin) warnings.push(`谐振电感 Lr=${(lr * 1e6).toFixed(1)} µH 低于文献八下限 ${(lrMin * 1e6).toFixed(1)} µH（由 T_d1min < T_ωr/2 导出），请增大 Lr 或复核 C_oss/C_ps`)
  const ripplePct = (zcs.deltaVCr / points.nom.vCb) * 100
  if (ripplePct > 20) warnings.push(`Cr 电压纹波 ${zcs.deltaVCr.toFixed(1)} V 占 V_Cr 的 ${ripplePct.toFixed(0)}%（>20%），注意 Cr 的耐压与 ESR 选型`)

  return {
    n, lm, cb, lr, fr, zcs,
    points, iout, vDiode, vMos, lrMin, warnings,
  }
}

/** 直流增益 M = D/n（Vo+Vd 归一化到 Vin） */
export function dcGain(duty: number, n: number): number {
  return duty / n
}

export interface ResonantWavePoint {
  t: number   // 时间 (µs)
  iLm: number // 励磁电流 (A)
  iLr: number // 谐振腔电流 (A)
  is: number  // 副边电流 (A)
}

export interface ResonantWaveResult {
  pts: ResonantWavePoint[]
  /** false = 谐振弧始终不低于 i_Lm（极端参数），副边全段断流、is 恒 0（调用方可据此提示） */
  secondaryActive: boolean
  /** is 首次归零（ZCS）时刻，相对释能起点 t1 (s)；null = 至关断未归零（关断残流） */
  tZ: number | null
}

/**
 * 精确谐振波形（文献七式 6/19 + 审核第二轮 remodel 的分相释能模型）：一个开关周期内
 * i_Lm（三角波闭合）、i_Lr（储能段随 i_Lm；释能段式19 谐振弧）、i_s（副边电流）。
 *
 * 分相释能模型（按 AHB 实际物理）：
 *   相位 A（t1 → t_z）：i_Lm 被副边钳位线性下降；i_Lr 走式19 谐振弧
 *     （v_Cr1 用 solveVCr1，审核 N-1）；i_s = n·(i_Lm − i_Lr)，is>0 时 D1 导通；
 *     弧在弦上方的断流小窗口内两者汇合（i_Lr=i_Lm，is=0）。
 *   相位 B（t_z → Ts）：is 归零（ZCS）后 D1 断流，i_Lr 与 i_Lm 汇合；
 *     Lr+Lm 与 Cr 三元件谐振周期很长，近似为缓慢斜线，周期末强制闭合到
 *     iValley（保证励磁电流分段线性闭合、伏秒平衡自洽）。
 *   符号约定：i_s = n·(i_Lm − i_Lr)，由 Cr 隔直（⟨i_Lr⟩=0）与输出电荷守恒
 *     （⟨i_s⟩=n·⟨i_Lm⟩=Io）唯一确定；标称点实测 mean(is)≈1.04·Io（<5%）。
 *   极端参数（谐振弧始终不低于 i_Lm）下 is 恒 0，返回 secondaryActive=false。
 */
export function resonantWaveform(
  inp: AhbInputs, n: number, lm: number, lr: number, cb: number, vin: number, samples = 240,
): ResonantWaveResult {
  const tr = releaseTrajectory(inp, n, lm, lr, cb, vin)
  const { duty, iPk, iValley, tOff, arc, chord, tC, tZ } = tr
  const ts = 1 / inp.fs
  const t1 = duty * ts
  const deltaI = iPk - iValley
  const active = tC !== null

  const pts: ResonantWavePoint[] = []
  for (let k = 0; k <= samples; k++) {
    const t = (k / samples) * ts
    let iLm: number
    let iLr: number
    let is = 0
    if (t <= t1) {
      // 储能阶段：三元件谐振近似线性（式6 第一支路）
      iLm = iValley + (deltaI * t) / t1
      iLr = iLm
    } else if (!active) {
      // 极端参数退化：全段不导通，i_Lr=i_Lm 沿钳位斜线（恰在 Ts 回到 iValley）
      iLm = chord(t - t1)
      iLr = iLm
    } else if (tZ === null || t - t1 <= tZ) {
      // 相位 A：i_Lm 钳位线性下降（式6 第二支路），i_Lr 二元件谐振弧（式19）
      const tp = t - t1
      iLm = chord(tp)
      const av = arc(tp)
      // 弧在弦上方的断流小窗口内两者汇合（is=0）；弧低于弦时 D1 导通
      iLr = Math.min(av, iLm)
      is = n * Math.max(iLm - av, 0)
    } else {
      // 相位 B：t_z 后汇合，缓慢线性回落，周期末闭合到 iValley
      const tp = t - t1
      const v0 = chord(tZ)
      iLm = v0 + ((iValley - v0) * (tp - tZ)) / (tOff - tZ)
      iLr = iLm
    }
    pts.push({ t: t * 1e6, iLm, iLr, is })
  }
  return { pts, secondaryActive: active, tZ }
}

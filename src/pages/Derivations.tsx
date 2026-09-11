import MathBlock from '@/components/MathBlock'
import InlineMath from '@/components/InlineMath'

const SRC7 = '《AHB不对称半桥反激电路设计（七）推导原副边峰值电流、有效值电流函数表达式》'
const SRC8 = '《AHB不对称半桥反激电路设计（八）死区时间、谐振腔电流、谐振电感函数表达式》'

function SrcTag({ text }: { text: string }) {
  return <span className="text-xs text-text-muted font-normal ml-2">— 依据{text}</span>
}

export default function Derivations() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-text-primary mb-2">公式推导</h1>
      <p className="text-text-secondary mb-10">
        基于项目知识库文献的精确推导链：直流工作点 → 励磁电流分段表达式 → 谐振腔电流精确解 →
        死区寄生谐振 → 电流有效值。符号与文献统一：S1/S2、V<sub>mid</sub>、L<sub>r</sub>、C<sub>r</sub>、L<sub>m</sub>。
      </p>

      {/* 1. 伏秒平衡 */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-text-primary mb-4">1. 伏秒平衡：隔直电容电压 V<sub>Cr</sub></h2>
        <p className="text-text-secondary text-sm leading-relaxed mb-2">
          稳态下励磁电感一个周期内伏秒积为零。S1 导通期（时长 <InlineMath latex="D T_s" />）电感电压为
          <InlineMath latex="V_{in} - V_{Cr}" />；S2 导通期（时长 <InlineMath latex="(1-D) T_s" />）为
          <InlineMath latex="-V_{Cr}" />。
        </p>
        <MathBlock
          stepNumber={1}
          label="伏秒平衡方程"
          latex={String.raw`(V_{in} - V_{Cr}) \cdot D T_s = V_{Cr} \cdot (1-D) T_s`}
        />
        <MathBlock
          stepNumber={2}
          label="隔直（谐振）电容电压"
          important
          latex={String.raw`V_{Cr} = D \cdot V_{in}`}
        />
        <MathBlock
          stepNumber={3}
          label="直流增益（副边反射钳位 n(Vo+Vd) = D·Vin）"
          important
          latex={String.raw`\frac{V_o}{V_{in}} \approx \frac{D}{n}, \qquad D = \frac{n\,(V_o + V_d)}{V_{in}}`}
        />
      </section>

      {/* 2. 励磁电流精确分段表达式 */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-text-primary mb-4">
          2. 励磁电流分段表达式<SrcTag text={SRC7} />
        </h2>
        <p className="text-text-secondary text-sm leading-relaxed mb-2">
          主管 S1 开通期间原边为<b className="text-text-primary">三元件谐振</b>（V<InlineMath latex="_{in}" />、
          L<InlineMath latex="_r" />、L<InlineMath latex="_m" />、C<InlineMath latex="_r" />），
          因 L<InlineMath latex="_m" /> ≫ L<InlineMath latex="_r" />，电流近似线性上升；
          S2 开通期间励磁电感被副边反射电压钳位，电流线性下降：
        </p>
        <MathBlock
          label="一个开关周期内的励磁电流（文献式 6）"
          important
          multiline
          latex={String.raw`i_{Lm}(t) = \begin{cases} I_{Lm\text{-}min} + \dfrac{V_{in}-V_{Cr}}{L_m+L_r}\, t & 0 < t \le D T_s \\[8pt] I_{Lm\text{-}max} + \dfrac{n V_o D T_s}{L_m} - \dfrac{n V_o}{L_m}\, t & D T_s < t \le T_s \end{cases}`}
        />
        <MathBlock
          label="正负峰值（文献式 7、8）"
          multiline
          latex={String.raw`I_{Lm\text{-}max} = I_{Lm\text{-}avg} + \frac{n V_o (1-D) T_s}{2 L_m}, \qquad I_{Lm\text{-}min} = I_{Lm\text{-}avg} - \frac{n V_o (1-D) T_s}{2 L_m}`}
        />
        <MathBlock
          label="变压器功率平衡（文献式 9）"
          latex={String.raw`I_{Lm\text{-}avg} = \frac{I_{Lm\text{-}max} + I_{Lm\text{-}min}}{2} = \frac{I_o}{n}`}
        />
      </section>

      {/* 3. 励磁电感取值 */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-text-primary mb-4">
          3. 励磁电感取值约束<SrcTag text={SRC7} />
        </h2>
        <p className="text-text-secondary text-sm leading-relaxed mb-2">
          L<InlineMath latex="_m" /> 的上下限分别由两个设计目标锁定：
          式 10 以<b className="text-text-primary">防止磁芯饱和、控制磁损</b>为目标限定最大电感电流；
          式 11 以<b className="text-text-primary">抑制副边开通震荡、确保主管软开关</b>为条件设定最小（负向）电感电流。
        </p>
        <MathBlock
          label="由峰值电流约束（文献式 10）"
          important
          latex={String.raw`L_m = \frac{n V_o (1-D) T_s}{2\,\big( I_{Lm\text{-}max} - \frac{I_o}{n} \big)}`}
        />
        <MathBlock
          label="由谷值电流（ZVS）约束（文献式 11）"
          important
          latex={String.raw`L_m = \frac{n V_o (1-D) T_s}{2\,\big( \frac{I_o}{n} - I_{Lm\text{-}min} \big)}`}
        />
      </section>

      {/* 4. 谐振腔电流精确表达式 */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-text-primary mb-4">
          4. 谐振腔电流精确表达式（释能阶段）<SrcTag text={SRC7} />
        </h2>
        <p className="text-text-secondary text-sm leading-relaxed mb-2">
          副管 S2 开通后，励磁电感被副边反射电压钳位退出谐振，原边退化为
          L<InlineMath latex="_r" /> 与 C<InlineMath latex="_r" /> 的<b className="text-text-primary">二元件谐振</b>。
          对两种谐振回路分别定义特征阻抗与角频率：
        </p>
        <MathBlock
          label="三元件谐振（主管开通，文献式 15、16）"
          latex={String.raw`Z_1 = \sqrt{\frac{L_r + L_m}{C_r}}, \qquad \omega_{r1} = \frac{1}{\sqrt{(L_r + L_m)\, C_r}}`}
        />
        <MathBlock
          label="二元件谐振（副管开通，文献式 17、18）"
          important
          latex={String.raw`Z_2 = \sqrt{\frac{L_r}{C_r}}, \qquad \omega_{r2} = \frac{1}{\sqrt{L_r C_r}}`}
        />
        <MathBlock
          label="S2 导通初始时刻谐振电容电压（文献式 13、14）"
          multiline
          latex={String.raw`\begin{aligned} v_{Cr0} &= V_{in} - \frac{I_{Lm\text{-}max} - I_{Lm\text{-}min}\cos(\omega_{r1} D T_s)}{\sin(\omega_{r2} D T_s)} \cdot Z_1 \\ v_{Cr1} &= V_{in} - (V_{in} - v_{Cr0})\cos(\omega_{r1} D T_s) + I_{Lm\text{-}min} Z_1 \sin(\omega_{r1} D T_s) \end{aligned}`}
        />
        <MathBlock
          label="副管导通期间原边谐振电流（文献式 19）"
          important
          latex={String.raw`i_{Lr2}(t) = \frac{n V_o - V_{Cr}(t_1)}{Z_2}\sin\!\big(\omega_{r2}(t-t_1)\big) + I_{Lm\text{-}max}\cos\!\big(\omega_{r2}(t-t_1)\big)`}
        />
        <MathBlock
          label="副边电流 = 原边两电流之差折算（文献式 21）"
          important
          latex={String.raw`i_s(t) = n \cdot \big( i_{Lr}(t) - i_{Lm}(t) \big)`}
        />
        <p className="text-text-secondary text-sm leading-relaxed">
          式 19 解释了副边电流为何呈半正弦谐振脉冲：i<InlineMath latex="_{Lr2}" /> 以
          ω<InlineMath latex="_{r2}" /> 正弦摆动而 i<InlineMath latex="_{Lm}" /> 近似线性，
          二者之差在 I<InlineMath latex="_{Lr}" /> 回落到 I<InlineMath latex="_{Lm}" /> 时归零——二极管 ZCS。
        </p>
      </section>

      {/* 5. 死区时间精确分析 */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-text-primary mb-4">
          5. 死区时间：寄生参数谐振分析<SrcTag text={SRC8} />
        </h2>
        <p className="text-text-secondary text-sm leading-relaxed mb-2">
          两管均关断的死区内，谐振电流给原边开关管结电容（2C<InlineMath latex="_{oss}" />）与
          副边整流管结电容的原边折算值 C<InlineMath latex="_{ps}" /> 充放电。
          由于死区极短，励磁电流视为恒值；谐振由 L<InlineMath latex="_r" /> 与两电容的串联等效决定：
        </p>
        <MathBlock
          label="副边整流管结电容的原边折算"
          latex={String.raw`C_{ps} = \frac{C_{oss,sec}}{n^2}`}
        />
        <MathBlock
          label="寄生谐振角频率与周期（文献式）"
          important
          multiline
          latex={String.raw`\omega_r = \frac{1}{\sqrt{\dfrac{2 C_{oss}\, C_{ps}}{2 C_{oss} + C_{ps}}\, L_r}}, \qquad T_{\omega r} = 2\pi \sqrt{\frac{2 C_{oss}\, C_{ps}}{2 C_{oss} + C_{ps}}\, L_r}`}
        />
        <p className="text-text-secondary text-sm leading-relaxed mb-2">
          S1 关断后，谐振电流按电容电流分配规律在两支路间分配，随时间按余弦演化（S2 关断后形式相同，
          初始条件换为负峰值 I<InlineMath latex="_{Lm-min}" />）：
        </p>
        <MathBlock
          label="S1 关断后谐振腔电流（文献式）"
          important
          multiline
          latex={String.raw`i_{Lr}(t) \approx I_{Lm\text{-}max} \cdot \frac{2 C_{oss}}{2 C_{oss} + C_{ps}} + I_{Lm\text{-}max} \cdot \frac{C_{ps}}{2 C_{oss} + C_{ps}} \cos(\omega_r t)`}
        />
        <MathBlock
          label="S2 关断后谐振腔电流（文献式）"
          multiline
          latex={String.raw`i_{Lr}(t) \approx I_{Lm\text{-}min} \cdot \frac{2 C_{oss}}{2 C_{oss} + C_{ps}} + I_{Lm\text{-}min} \cdot \frac{C_{ps}}{2 C_{oss} + C_{ps}} \cos(\omega_r t)`}
        />
        <MathBlock
          label="最小死区时间（结电容线性充电近似，文献式）"
          important
          latex={String.raw`T_{d1min} = \frac{2 C_{oss} V_{in}}{I_{Lm\text{-}max}}, \qquad T_{d2min} = \frac{2 C_{oss} V_{in}}{|I_{Lm\text{-}min}|}`}
        />
        <div className="card-surface p-5 my-4 border-accent/40">
          <h3 className="text-accent-light font-semibold text-sm mb-2">关键设计约束：T<sub>d1min</sub> &lt; T<sub>ωr</sub>/2</h3>
          <p className="text-text-secondary text-sm leading-relaxed">
            电流跌落可降低副边电流峰值与有效值，但若 S2 导通期间谐振电流跌到等于励磁电流（副边电流 A 点归零），
            会在原边变压器内形成环流、增加损耗，并干扰副边同步整流驱动。因此取最小死区时间接近但不超过
            半个寄生谐振周期，此时电流跌落幅度最大。由此导出谐振电感最小值：
          </p>
          <MathBlock
            label="谐振电感最小值（文献式）"
            important
            latex={String.raw`L_r \;\ge\; \frac{4 C_{oss}^2 V_{in}^2}{\pi^2 I_{Lm\text{-}max}^2} \times \frac{2 C_{oss} + C_{ps}}{2 C_{oss}\, C_{ps}}`}
          />
          <p className="text-text-muted text-xs mt-2">
            谐振电感感值仅影响电流跌落的时间；跌落幅值与时间由原、副边开关管结电容共同决定。
          </p>
        </div>
      </section>

      {/* 6. ZVS 限制条件 */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-text-primary mb-4">
          6. ZVS 限制条件<SrcTag text={SRC7} />
        </h2>
        <p className="text-text-secondary text-sm leading-relaxed mb-2">
          死区时间受控制器芯片最小死区限制；确定 MOSFET 后 C<InlineMath latex="_{ds}" /> 已知，
          即可反解所需的负向励磁峰值电流，再代入式 11 求得 L<InlineMath latex="_m" />：
        </p>
        <MathBlock
          label="ZVS 死区限制（文献式）"
          important
          latex={String.raw`t_{dead} \;\ge\; \frac{2 C_{ds} V_{in}}{|I_{Lm\text{-}min}|}`}
        />
        <MathBlock
          label="能量形式的 ZVS 判据（等价表述）"
          latex={String.raw`\frac{1}{2} L_m I_{Lm\text{-}min}^2 \;\ge\; \frac{1}{2} C_{oss,eq} V_{in}^2`}
        />
      </section>

      {/* 7. 电流有效值 */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-text-primary mb-4">
          7. 原副边电流有效值<SrcTag text={SRC7} />
        </h2>
        <p className="text-text-secondary text-sm leading-relaxed mb-2">
          精确值需对分段函数在周期内做均方根积分（建议用 MathCAD 等工具数值求解）：
        </p>
        <MathBlock
          label="精确均方根积分（文献式 22、23）"
          multiline
          latex={String.raw`I_{prms} = \sqrt{\frac{1}{T_s}\int_0^{T_s} i_p(t)^2\, dt}, \qquad I_{srms} = \sqrt{\frac{1}{T_s}\int_0^{T_s} i_s(t)^2\, dt}`}
        />
        <p className="text-text-secondary text-sm leading-relaxed mb-2">
          工程简易算法按三角波近似（结果略偏大，对变压器绕组线径选择有利）：
        </p>
        <MathBlock
          label="三角波近似有效值（文献式）"
          latex={String.raw`I_{prms} = I_{pk}\sqrt{\frac{D}{3}}, \qquad I_{srms} = I_{sk}\sqrt{\frac{1-D}{3}}`}
        />
      </section>

      {/* 8. 简易算法 */}
      <section>
        <h2 className="text-xl font-semibold text-text-primary mb-4">
          8. 简易设计算法（纹波率法）<SrcTag text={SRC7} />
        </h2>
        <p className="text-text-secondary text-sm leading-relaxed mb-2">
          AHB 能量传递本质与反激类似，可忽略谐振器件影响、直接按反激方法估算，
          但<b className="text-text-primary">必须校核励磁电感取值满足死区时间限制</b>。
          从电感尺寸、器件应力与效率出发，电流纹波率一般取 r = 0.4：
        </p>
        <MathBlock
          label="电流纹波率定义与平均电流（文献式 24、25）"
          latex={String.raw`r = \frac{\Delta I_p}{I_{Lm\text{-}avg}} = 0.4, \qquad I_{Lm\text{-}avg} = \frac{I_o}{n}`}
        />
        <MathBlock
          label="原边纹波电流与励磁电感（文献式 27、28）"
          important
          latex={String.raw`\Delta I_p = 0.4 \cdot \frac{I_o}{n} = \frac{V_{in}\, D}{L_m f_{sw}} \quad\Rightarrow\quad L_m = \frac{V_{in}\, D}{\Delta I_p \cdot f_{sw}}`}
        />
        <p className="text-text-muted text-xs">
          注：式 27 为文献的简化形式；更精确的纹波表达式应计入隔直电容压降，即
          ΔI = V<InlineMath latex="_{in}" />(1−D)D/(L<InlineMath latex="_m" />f<InlineMath latex="_s" />），
          设计工具页采用精确式计算。
        </p>
      </section>

      {/* 9. 谐振电容 ZCS 调谐与器件应力 */}
      <section>
        <h2 className="text-xl font-semibold text-text-primary mb-4">
          9. 谐振电容 C<sub>r</sub> 的 ZCS 调谐与器件应力<SrcTag text={SRC8} />
        </h2>
        <p className="text-text-secondary text-sm leading-relaxed mb-2">
          C<InlineMath latex="_r" /> 既是隔直电容，又与 L<InlineMath latex="_r" /> 构成关断期的谐振腔。
          其取值由 <b className="text-text-primary">ZCS 调谐条件</b>决定——令 S2 关断时刻谐振腔电流
          i<InlineMath latex="_{Lr}" /> 恰好回落到励磁谷值电流，副边电流随之归零（i<InlineMath latex="_s" /> = 0），
          副边整流管实现零电流关断。利用式 19 的谐振状态演化：
        </p>
        <MathBlock
          label="关断期谐振状态（式 19 末值，θ = ωr·Toff）"
          latex={String.raw`i_{Lr}(T_{off}) = I_{Lm\text{-}max}\cos\theta + \frac{V_{Cr1} - nV_o}{Z_2}\sin\theta, \qquad Z_2 = \sqrt{\frac{L_r}{C_r}},\;\; \omega_r = \frac{1}{\sqrt{L_r C_r}}`}
        />
        <MathBlock
          label="ZCS 调谐条件（数值求解 Cr）"
          important
          latex={String.raw`i_{Lr}(T_{off}) = I_{Lm\text{-}min} \;\Leftrightarrow\; i_s(T_{off}) = n\left(I_{Lm\text{-}min} - i_{Lr}(T_{off})\right) = 0`}
        />
        <p className="text-text-secondary text-sm leading-relaxed mb-2">
          该条件对 C<InlineMath latex="_r" /> 是隐式的（V<InlineMath latex="_{Cr1}" /> 依赖谐振轨迹，
          而轨迹又依赖 C<InlineMath latex="_r" />），工具采用不动点迭代求解：猜测 V<InlineMath latex="_{Cr1}" /> →
          在 θ∈(π, 2π) 内二分求根得 ω<InlineMath latex="_r" /> → C<InlineMath latex="_r" /> = 1/(ω<InlineMath latex="_r" />²L
          <InlineMath latex="_r" />) → 由 C<InlineMath latex="_r" /> 电荷平衡更新 V<InlineMath latex="_{Cr1}" />，直至收敛。
          默认算例收敛到 C<InlineMath latex="_r" /> ≈ 44 nF、f<InlineMath latex="_r" /> ≈ 243 kHz（f
          <InlineMath latex="_r" />/f<InlineMath latex="_s" /> ≈ 1.2，即谐振周期略短于开关周期——
          这正是 ZCS 调谐的物理含义，<b className="text-text-primary">而非</b>传统「f
          <InlineMath latex="_r" /> ≪ f<InlineMath latex="_s" />」的解耦约束）。
        </p>
        <MathBlock
          label="电容电压纹波（报告量，非设计约束）"
          latex={String.raw`\Delta V_{Cr} = \frac{I_{Lm\text{-}avg} \cdot D}{C_r \cdot f_s} \quad(\text{工程上建议} \le 20\% \cdot V_{Cr})`}
        />
        <p className="text-text-secondary text-sm leading-relaxed mb-2">
          调谐条件仅在调谐点（默认取额定输入）精确成立；输入电压偏离后，S2 关断时刻的副边残流漂移为固有物理现象，
          低压输入时残流可达数安，可在特性曲线页「ZCS 调谐匹配表」中量化查看。
          器件电压应力由桥臂钳位与副边反射决定——这正是 AHB 相对传统反激的优势（无 RCD 尖峰）：
        </p>
        <MathBlock
          label="器件电压应力"
          important
          latex={String.raw`V_{DS1} = V_{DS2} = V_{in,max}, \qquad V_{D1} = \frac{V_{in,max}}{n} + V_o`}
        />
        <p className="text-text-muted text-xs">
          注：副边二极管/同步整流管选型时，需在上式基础上再计入换流边沿的寄生振铃余量（见工作原理页实测波形 A 点）。
        </p>
      </section>
    </div>
  )
}

import MathBlock from '@/components/MathBlock'
import InlineMath from '@/components/InlineMath'

export default function Derivations() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-text-primary mb-2">公式推导</h1>
      <p className="text-text-secondary mb-10">AHB 反激从伏秒平衡到 ZVS 条件的完整推导链。</p>

      {/* 1. 伏秒平衡与隔直电容电压 */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-text-primary mb-4">1. 伏秒平衡：隔直电容电压 V<tspan>C</tspan><sub>Cb</sub></h2>
        <p className="text-text-secondary text-sm leading-relaxed mb-2">
          稳态下励磁电感 <InlineMath latex="L_m" /> 在一个周期内伏秒积为零。
          导通期（Q1 on，时长 <InlineMath latex="D T_s" />）电感电压为
          <InlineMath latex="V_{in} - V_{Cb}" />；关断期（Q2 on，时长
          <InlineMath latex="(1-D) T_s" />）电感电压为 <InlineMath latex="-V_{Cb}" />。
        </p>
        <MathBlock
          stepNumber={1}
          label="列伏秒平衡方程"
          latex={String.raw`(V_{in} - V_{Cb}) \cdot D T_s \;=\; V_{Cb} \cdot (1-D) T_s`}
        />
        <MathBlock
          stepNumber={2}
          label="解出隔直电容电压"
          important
          latex={String.raw`V_{Cb} = D \cdot V_{in}`}
        />
        <p className="text-text-secondary text-sm leading-relaxed">
          于是导通期励磁电感电压 <InlineMath latex="V_{Lm}^{+} = V_{in}(1-D)" />，
          关断期 <InlineMath latex="V_{Lm}^{-} = -D\,V_{in}" />，二者大小互补、方向相反，形成对称励磁。
        </p>
      </section>

      {/* 2. 直流增益 */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-text-primary mb-4">2. 直流增益 M = D/n</h2>
        <p className="text-text-secondary text-sm leading-relaxed mb-2">
          关断期副边二极管导通，原边绕组被输出反射电压钳位：
          <InlineMath latex="V_{Lm}^{-} = -n(V_o + V_d)" />。
          与 <InlineMath latex="V_{Lm}^{-} = -D V_{in}" /> 联立：
        </p>
        <MathBlock
          stepNumber={1}
          label="反射电压钳位"
          latex={String.raw`n\,(V_o + V_d) = D \cdot V_{in}`}
        />
        <MathBlock
          stepNumber={2}
          label="AHB 反激直流增益"
          important
          latex={String.raw`\frac{V_o}{V_{in}} = \frac{D}{n} - \frac{V_d}{V_{in}} \;\approx\; \frac{D}{n}`}
        />
        <MathBlock
          stepNumber={3}
          label="由此确定占空比与匝比"
          latex={String.raw`D = \frac{n\,(V_o + V_d)}{V_{in}}, \qquad n = \frac{D_{nom}\,V_{in,nom}}{V_o + V_d}`}
        />
      </section>

      {/* 3. 励磁电流纹波 */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-text-primary mb-4">3. 励磁电流：平均值与纹波</h2>
        <p className="text-text-secondary text-sm leading-relaxed mb-2">
          输入功率经导通期注入：平均励磁电流
          <InlineMath latex="I_{Lm,avg} = P_{out} / (\eta\, V_{in} D)" />。
          峰-峰纹波由导通期电压与时间决定：
        </p>
        <MathBlock
          stepNumber={1}
          label="峰-峰纹波"
          important
          latex={String.raw`\Delta I_{Lm} = \frac{V_{in}(1-D)\,D}{L_m \cdot f_s}`}
        />
        <MathBlock
          stepNumber={2}
          label="峰值与谷值"
          latex={String.raw`I_{pk} = I_{Lm,avg} + \frac{\Delta I_{Lm}}{2}, \qquad I_{valley} = I_{Lm,avg} - \frac{\Delta I_{Lm}}{2}`}
        />
        <p className="text-text-secondary text-sm leading-relaxed">
          设计时通常取纹波系数 <InlineMath latex="K_r = \Delta I_{Lm}/I_{Lm,avg} \ge 2" />，
          保证谷值电流为负，从而为 ZVS 提供换流能量。反解励磁电感：
        </p>
        <MathBlock
          stepNumber={3}
          label="励磁电感设计式"
          important
          latex={String.raw`L_m = \frac{V_{in}(1-D)\,D}{K_r \cdot I_{Lm,avg} \cdot f_s}`}
        />
      </section>

      {/* 4. ZVS 条件 */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-text-primary mb-4">4. ZVS 能量条件与死区时间</h2>
        <p className="text-text-secondary text-sm leading-relaxed mb-2">
          Q2 关断后，负向谷值电流须在开关节点完成电荷转移：把
          <InlineMath latex="C_{oss,eq}" /> 从 0 充到 <InlineMath latex="V_{in}" />
          （Q1 侧放电、Q2 侧充电）。能量守恒角度：
        </p>
        <MathBlock
          stepNumber={1}
          label="ZVS 能量判据"
          important
          latex={String.raw`\frac{1}{2} L_m I_{valley}^2 \;\ge\; \frac{1}{2} C_{oss,eq} V_{in}^2`}
        />
        <p className="text-text-secondary text-sm leading-relaxed">
          换流过程近似为 <InlineMath latex="L_m" /> 与 <InlineMath latex="C_{oss,eq}" />
          的谐振，Vsw 从 0 上升到 V<InlineMath latex="_{in}" /> 需要约四分之一谐振周期：
        </p>
        <MathBlock
          stepNumber={2}
          label="死区时间下限"
          latex={String.raw`t_{dead} \;\ge\; \frac{\pi}{2}\sqrt{L_m \, C_{oss,eq}}`}
        />
      </section>

      {/* 5. 隔直电容 */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-text-primary mb-4">5. 隔直电容 C<sub>b</sub> 与谐振频率</h2>
        <p className="text-text-secondary text-sm leading-relaxed mb-2">
          <InlineMath latex="C_b" /> 与漏感 <InlineMath latex="L_r" /> 构成串联谐振，
          谐振频率须远低于开关频率，避免与增益特性耦合：
        </p>
        <MathBlock
          stepNumber={1}
          label="谐振频率约束"
          latex={String.raw`f_r = \frac{1}{2\pi\sqrt{L_r C_b}} \;\le\; \frac{f_s}{5}`}
        />
        <p className="text-text-secondary text-sm leading-relaxed">
          同时 <InlineMath latex="C_b" /> 吸收导通期电流电荷，产生电压纹波：
        </p>
        <MathBlock
          stepNumber={2}
          label="电容电压纹波"
          important
          latex={String.raw`\Delta V_{Cb} = \frac{I_{Lm,avg} \cdot D}{C_b \cdot f_s} \;\le\; 5\% \cdot V_{Cb}`}
        />
      </section>

      {/* 6. 电流应力 */}
      <section>
        <h2 className="text-xl font-semibold text-text-primary mb-4">6. 电流应力汇总</h2>
        <MathBlock
          label="原边电流有效值（梯形波近似）"
          latex={String.raw`I_{pri,rms} = \sqrt{D\left(I_{Lm,avg}^2 + \frac{\Delta I_{Lm}^2}{12}\right)}`}
        />
        <MathBlock
          label="副边电流有效值"
          latex={String.raw`I_{sec,rms} = \sqrt{(1-D)\left((n I_{Lm,avg})^2 + \frac{(n\,\Delta I_{Lm})^2}{12}\right)}`}
        />
        <MathBlock
          label="输出电容纹波电流"
          latex={String.raw`I_{Co,rms} = \sqrt{I_{sec,rms}^2 - I_{out}^2}`}
        />
        <MathBlock
          label="器件电压应力"
          important
          latex={String.raw`V_{DS} = V_{in,max}, \qquad V_{diode} = \frac{V_{in,max}}{n} + V_o`}
        />
      </section>
    </div>
  )
}

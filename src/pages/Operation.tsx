import { ReactNode } from 'react'
import MathBlock from '@/components/MathBlock'
import InlineMath from '@/components/InlineMath'
import FigureCard from '@/components/FigureCard'
import { Activity, Waves, Microscope } from 'lucide-react'

const SRC1 = '《AHB不对称半桥反激电路设计（一）拓扑工作过程详细解读》'
const SRC8 = '《AHB不对称半桥反激电路设计（八）死区时间，谐振腔电流、谐振电感》'
const SRC6 = '《AHB不对称半桥反激电路设计（六）AHB电路调试与器件应力检测》'

interface Stage {
  id: string
  time: string
  title: string
  fig: string
  caption: string
  body: ReactNode
  math?: string
}

const stages: Stage[] = [
  {
    id: '1',
    time: 't₀ ~ t₁',
    title: 'S1 导通：原边储能，副边不导电',
    fig: './fig/ahb-fig03.jpg',
    caption: '(a) 阶段 1（t₀~t₁）：S1 导通、原边储能、副边不导电',
    body: (
      <>
        <p>
          高边管 S1 导通，V<InlineMath latex="_{mid}" /> = V<InlineMath latex="_{in}" />。
          电流路径：V<InlineMath latex="_{in}" /> → S1 → L<InlineMath latex="_r" /> →
          原边绕组 → C<InlineMath latex="_r" />。励磁电感承受正向电压
          <InlineMath latex="V_{Lm} = V_{in} - V_{Cr}" />，励磁电流 I<InlineMath latex="_{Lm}" />
          与谐振电流 I<InlineMath latex="_{Lr}" /> 相等并线性上升，能量储存在变压器磁场中。
        </p>
        <p>
          副边二极管 D1 反向截止，负载电流 I<InlineMath latex="_O" /> 完全由输出电容
          C<InlineMath latex="_o" /> 提供。
        </p>
      </>
    ),
    math: String.raw`\frac{dI_{Lm}}{dt} = \frac{V_{in} - V_{Cr}}{L_m + L_r}, \qquad I_{Lr} = I_{Lm}`,
  },
  {
    id: '2',
    time: 't₁ ~ t₂',
    title: 'S1 关断：结电容充放电，Vmid 谐振下降',
    fig: './fig/ahb-fig04.jpg',
    caption: '(b) 阶段 2（t₁~t₂）：S1 关断、结电容充放电、Vmid 下降',
    body: (
      <>
        <p>
          S1 关断，正向谐振电流 I<InlineMath latex="_{Lr}" /> 无处可走，转而给结电容换流：
          对 C<InlineMath latex="_{DS1}" /> 充电、对 C<InlineMath latex="_{DS2}" /> 放电，
          V<InlineMath latex="_{mid}" /> 从 V<InlineMath latex="_{in}" /> 谐振下降。
        </p>
        <p>
          此阶段励磁电感电压 V<InlineMath latex="_{Lm}" /> 极性反转（上负下正），
          副边仍未导通。换流速度由 I<InlineMath latex="_{Lr}" /> 峰值与结电容总量决定。
        </p>
      </>
    ),
    math: String.raw`I_{Lr}(t_1) = C_{DS,eq} \frac{dV_{mid}}{dt} \quad\Rightarrow\quad V_{mid}: V_{in} \to 0`,
  },
  {
    id: '3',
    time: 't₂ ~ t₃',
    title: 'S2 体二极管导通：副边电压升至 Vo',
    fig: './fig/ahb-fig05.jpg',
    caption: '(c) 阶段 3（t₂~t₃）：S2 体二极管导通、二次电压升至 Vo',
    body: (
      <>
        <p>
          V<InlineMath latex="_{mid}" /> 降到 0 后，S2 的体二极管自然导通，把谐振回路钳位到地。
          原边绕组电压被副边反射钳位到 −n(V<InlineMath latex="_o" />+V<InlineMath latex="_d" />），
          副边二极管 D1 正偏，I<InlineMath latex="_d" /> 开始上升。
        </p>
        <p>
          此刻给 S2 门极信号即为<b className="text-text-primary">零电压开通（ZVS）</b>——
          这是 AHB 反激低边管软开关的完成点。
        </p>
      </>
    ),
  },
  {
    id: '4',
    time: 't₃ ~ t₄',
    title: '能量传递：Cr–Lr 谐振，副边 Id 导通',
    fig: './fig/ahb-fig06.jpg',
    caption: '(d) 阶段 4（t₃~t₄）：能量传递、Cr–Lr 谐振、副边 Id 导通',
    body: (
      <>
        <p>
          S2 导通，变压器储能向副边释放。此阶段 L<InlineMath latex="_r" /> 与
          C<InlineMath latex="_r" /> 构成谐振回路，谐振电流 I<InlineMath latex="_{Lr}" />
          按正弦规律变化，与励磁电流 I<InlineMath latex="_{Lm}" /> 的差值折算到副边即为
          二极管电流：
        </p>
        <p>
          副边电流因此呈谐振脉冲形状（半正弦），而非传统反激的线性下降三角波——
          这是 AHB 反激实现副边 ZCS 的关键。
        </p>
      </>
    ),
    math: String.raw`I_d = n \cdot \big( I_{Lr} - I_{Lm} \big), \qquad f_r = \frac{1}{2\pi\sqrt{L_r C_r}}`,
  },
  {
    id: '5',
    time: 't₄ ~ t₅',
    title: 'S2 ZVS 导通持续：Id 谐振回零，实现 ZCS',
    fig: './fig/ahb-fig07.jpg',
    caption: '(e) 阶段 5（t₄~t₅）：S2 ZVS 导通、Id 降至零实现 ZCS',
    body: (
      <>
        <p>
          谐振继续，I<InlineMath latex="_{Lr}" /> 下降到与 I<InlineMath latex="_{Lm}" />
          相等，副边电流 I<InlineMath latex="_d" /> 自然归零——二极管
          <b className="text-text-primary">零电流关断（ZCS）</b>，彻底消除反向恢复损耗与尖峰。
        </p>
        <p>
          I<InlineMath latex="_d" /> = 0 后，I<InlineMath latex="_{Lr}" /> 与
          I<InlineMath latex="_{Lm}" /> 重新汇合，回路回到仅含励磁分量的状态，等待 S2 关断。
        </p>
      </>
    ),
    math: String.raw`I_{Lr} = I_{Lm} \;\Rightarrow\; I_d = 0 \quad (\text{二极管 ZCS})`,
  },
  {
    id: '6',
    time: 't₅ ~ t₇',
    title: 'S2 关断：Vmid 抬升至 Vin，S1 体二极管导通',
    fig: './fig/ahb-fig08.jpg',
    caption: '(f) 阶段 6（t₅~t₇）：S2 关断、Vmid 抬升至 Vin、S1 体二极管导通',
    body: (
      <>
        <p>
          S2 关断，谐振腔电流（此时已转为负向）给结电容反向换流：C<InlineMath latex="_{DS2}" />
          充电、C<InlineMath latex="_{DS1}" /> 放电，V<InlineMath latex="_{mid}" /> 从 0
          谐振抬升至 V<InlineMath latex="_{in}" />。
        </p>
        <p>
          V<InlineMath latex="_{mid}" /> 到达 V<InlineMath latex="_{in}" /> 后 S1 体二极管导通，
          S1 在下一个周期起点零电压开通，完成整个开关周期。负向谐振电流的储能是否充足，
          决定了高边管 ZVS 的成败。
        </p>
      </>
    ),
    math: String.raw`\frac{1}{2} L_{eq} I_{Lr,valley}^2 \;\ge\; \frac{1}{2} C_{DS,eq} V_{in}^2`,
  },
]

export default function Operation() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-text-primary mb-2">工作原理</h1>
      <p className="text-text-secondary mb-10">
        一个完整开关周期（t₀–t₇）内 AHB 反激的六个工作阶段。电路图与波形均取自项目知识库文献原文。
      </p>

      {/* 关键波形 */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary-light" /> 关键波形（t₀–t₇）
        </h2>
        <div className="card-surface p-6">
          <FigureCard
            src="./fig/ahb-fig02.jpg"
            alt="AHB拓扑关键波形"
            caption="AHB 拓扑关键波形：Vgs1/Vgs2（驱动）、Vds1/Vds2（开关管电压）、ILm（励磁电流）、ILr（谐振腔电流）、Id（副边二极管电流）"
            source={`${SRC1}，p3`}
            maxWidth="max-w-2xl mx-auto"
          />
          <div className="text-text-muted text-sm mt-4 space-y-2">
            <p>
              · <b className="text-text-secondary">I<sub>Lm</sub></b>：三角波双向摆动，t₀ 时刻略为负值（负向谷值是高边 ZVS 的能量来源）。
            </p>
            <p>
              · <b className="text-text-secondary">I<sub>Lr</sub></b>：储能阶段与 I<sub>Lm</sub> 重合线性上升；释能阶段因 C<sub>r</sub>–L<sub>r</sub> 谐振呈正弦下凹，与 I<sub>Lm</sub> 的差值折算为副边电流。
            </p>
            <p>
              · <b className="text-text-secondary">I<sub>d</sub></b>：半正弦谐振脉冲，t₅ 时刻自然归零 → 副边二极管零电流关断（ZCS）。
            </p>
          </div>
        </div>
      </section>

      {/* 六个阶段 */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-text-primary mb-6">六个工作阶段详解</h2>
        <div className="space-y-8">
          {stages.map((s) => (
            <div key={s.id} className="derivation-step">
              <div className="derivation-step-marker">{s.id}</div>
              <div className="derivation-step-content">
                <h3 className="font-semibold text-text-primary mb-1">
                  阶段 {s.id}（{s.time}）：{s.title}
                </h3>
                <div className="card-surface p-5 mt-3">
                  <FigureCard src={s.fig} alt={s.caption} caption={s.caption} source={SRC1} />
                  <div className="space-y-3 text-text-secondary text-sm leading-relaxed mt-4">
                    {s.body}
                  </div>
                  {s.math && <MathBlock latex={s.math} />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 寄生谐振 */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Waves className="w-5 h-5 text-primary-light" /> 死区内的寄生谐振
        </h2>
        <div className="card-surface p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FigureCard
              src="./fig/ahb-fig10.png"
              alt="S1关断等效电路"
              caption="S1 关断后寄生参数谐振过程等效电路"
              source={`${SRC8}，p2`}
            />
            <FigureCard
              src="./fig/ahb-fig11.png"
              alt="S2关断等效电路"
              caption="S2 关断后寄生参数谐振过程等效电路"
              source={`${SRC8}，p3`}
            />
          </div>
          <FigureCard
            src="./fig/ahb-fig09.png"
            alt="寄生谐振电流波形"
            caption="受寄生参数影响的谐振电流波形：iLr（红）与副边电流 is（蓝），含 ΔILr 跌落与 A 点凹陷"
            source={`${SRC8}，p1`}
            maxWidth="max-w-xl mx-auto"
          />
          <div className="space-y-3 text-text-secondary text-sm leading-relaxed mt-2">
            <p>
              计入开关管结电容与绕组寄生参数后，死区内的换流是
              <InlineMath latex="L_r" />/<InlineMath latex="L_m" /> 与
              <InlineMath latex="C_{DS,eq}" /> 的谐振过程：i<InlineMath latex="_{Lr}" />
              在换流瞬间出现 ΔI<InlineMath latex="_{Lr}" /> 的快速跌落，
              副边电流在 A 点处出现凹陷、周期末出现振铃。
            </p>
            <p>
              死区时间的工程整定依据正是这段谐振：过短则 V<InlineMath latex="_{mid}" />
              未摆到位就开通（失去 ZVS），过长则体二极管导通时间增加、损耗上升。
            </p>
          </div>
          <MathBlock
            label="死区时间整定"
            latex={String.raw`t_{dead} \;\ge\; \frac{\pi}{2}\sqrt{L_{eq} \cdot C_{DS,eq}}`}
          />
        </div>
      </section>

      {/* 实测波形 */}
      <section>
        <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Microscope className="w-5 h-5 text-primary-light" /> 实测验证
        </h2>
        <div className="card-surface p-6">
          <FigureCard
            src="./fig/ahb-fig12.png"
            alt="实测副边Vds与Id"
            caption="实测波形：副边 Vds（黄）与副边电流 Id（蓝）；A 点 = 谐振峰值，B 点 = ZCS 判断点"
            source={`${SRC6}，p1`}
          />
          <p className="text-text-secondary text-sm leading-relaxed mt-2">
            样机实测中，副边电流 Id 呈半正弦谐振脉冲并在关断前回到零（B 点），验证 ZCS 成立；
            副边 Vds 在换流边沿出现寄生振铃（A 点），其幅度用于校核二极管电压应力裕量——
            设计工具页给出的二极管应力 V<InlineMath latex="_{diode}" /> = V<InlineMath latex="_{in,max}" />/n + V<InlineMath latex="_o" />
            需在此基础上再留振铃余量选型。
          </p>
        </div>
      </section>
    </div>
  )
}

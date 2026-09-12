import { createContext, useContext, useMemo, useState, ReactNode } from 'react'
import { AhbInputs, AhbDesignResult, designAhb } from './ahbMath'

/** 默认设计输入：60 W USB-PD 规格的 AHB 反激 */
const defaultInputs: AhbInputs = {
  vinMin: 320,
  vinNom: 390,
  vinMax: 420,
  vout: 20,
  pout: 60,
  vd: 0.6,
  fs: 200e3,
  eta: 0.93,
  kRipple: 4.0,
  dNom: 0.45,
  cEq: 80e-12,
  deadtime: 300e-9,
  cPs: 100e-12, // 审核修订 P2-16：副边整流管结电容原边折算（绕组寄生电容）
  turnsRatio: undefined,
}

interface DesignContextValue {
  inputs: AhbInputs
  setInputs: (updater: (prev: AhbInputs) => AhbInputs) => void
  result: AhbDesignResult
}

const DesignContext = createContext<DesignContextValue | null>(null)

export function DesignProvider({ children }: { children: ReactNode }) {
  const [inputs, setInputsState] = useState<AhbInputs>(defaultInputs)

  const setInputs = (updater: (prev: AhbInputs) => AhbInputs) => {
    setInputsState((prev) => updater(prev))
  }

  const result = useMemo(() => designAhb(inputs), [inputs])

  return (
    <DesignContext.Provider value={{ inputs, setInputs, result }}>
      {children}
    </DesignContext.Provider>
  )
}

export function useDesign(): DesignContextValue {
  const ctx = useContext(DesignContext)
  if (!ctx) throw new Error('useDesign must be used within DesignProvider')
  return ctx
}

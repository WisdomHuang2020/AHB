/**
 * AHB 品牌标记 —— 与本站 public/favicon.svg 完全同源。
 *
 * 造型：闪电（本站首页主图标 Zap 的加粗填实版）。
 * 语义：功率开关 / 电能的图形化，与主入口站 sites.json 登记的 icon=zap 一致。
 *
 * ⚠️ 与 public/favicon.svg 使用同一套 path 数据：改一处必须同步另一处。
 * 主形用站群统一 teal #14b8a6；amber 点与深底为站群固定标记，不随文字色变化。
 */
export default function BrandMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="#0a0a0a" />
      <path
        d="M18.2 3.2 L7.6 17.4 A1 1 0 0 0 8.4 19 H14.2 L12.4 28.6 A.6.6 0 0 0 13.5 29 L25 14.2 A1 1 0 0 0 24.1 12.6 H18 L20 3.7 A.6.6 0 0 0 18.2 3.2 Z"
        fill="#14b8a6"
      />
      <circle cx="15.6" cy="15.6" r="1.7" fill="#f59e0b" />
    </svg>
  )
}

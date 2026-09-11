interface FigureCardProps {
  src: string         // 相对路径（base './' 部署，勿用绝对路径）
  alt: string
  caption?: string    // 图注
  source?: string     // 溯源说明
  maxWidth?: string   // 限宽，如 'max-w-2xl'
}

/** 文献配图卡片：白底容器 + 图注 + 溯源信息（适配深色主题下的浅色原图） */
export default function FigureCard({ src, alt, caption, source, maxWidth }: FigureCardProps) {
  return (
    <figure className={`my-4 ${maxWidth ?? ''}`}>
      <div className="bg-white rounded-lg p-3 border border-border">
        <img src={src} alt={alt} className="w-full h-auto rounded" />
      </div>
      {(caption || source) && (
        <figcaption className="mt-2 text-xs text-text-muted leading-relaxed">
          {caption && <span className="text-text-secondary">{caption}</span>}
          {source && <span className="block mt-0.5">来源：{source}</span>}
        </figcaption>
      )}
    </figure>
  )
}

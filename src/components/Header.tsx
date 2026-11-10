import { useState } from 'react'
import ThemeSwitcher from './ThemeSwitcher'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Zap, BookOpen, Activity, Calculator, FileText, PenTool, MessageSquare, House } from 'lucide-react'
import BrandMark from './BrandMark'

const navLinks = [
  { path: '/', label: '首页', icon: Zap },
  { path: '/fundamentals', label: '拓扑基础', icon: BookOpen },
  { path: '/operation', label: '工作原理', icon: Activity },
  { path: '/derivations', label: '公式推导', icon: PenTool },
  { path: '/curves', label: '特性曲线', icon: Activity },
  { path: '/designer', label: '设计工具', icon: Calculator },
  { path: '/report', label: '报告输出', icon: FileText },
  // 留言入口放在末位：读者发现问题时通常在读某一页，导航末位是「找话说」的自然位置。
  { path: '/feedback', label: '留言', icon: MessageSquare },
]

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-surface border-b border-border">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-text-primary hover:text-primary-light transition-colors">
          <BrandMark className="w-6 h-6" />
          <span className="font-bold text-lg tracking-tight">AHB Flyback</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path
            const Icon = link.icon
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  isActive
                    ? 'text-primary-light bg-primary-dark/30'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden lg:inline">{link.label}</span>
              </Link>
            )
          })}
          {/* 站群入口（2026-11-10）：参照 control-mode / motor-lighting / english 三站，
              房子图标 + 「站群入口」，放在页眉右侧主题切换器之前，链接总入口且不开新标签页。
              2026-11-02 加的「返回站群入口」只在页脚，页眉此前没有入口。 */}
          <a
            href="https://power-knowledge.tech/"
            className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-elevated hover:text-primary-light"
            title="返回 power-knowledge.tech 站群入口"
          >
            <House className="h-4 w-4" />
            <span className="hidden lg:inline">站群入口</span>
          </a>
          <ThemeSwitcher />
        </nav>

        <button
          className="md:hidden p-2 text-text-secondary hover:text-text-primary"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-surface border-b border-border">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path
              const Icon = link.icon
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${
                    isActive
                      ? 'text-primary-light bg-primary-dark/30'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {link.label}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </header>
  )
}

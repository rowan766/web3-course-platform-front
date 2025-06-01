import { ConnectButton } from '@rainbow-me/rainbowkit'
import './TopBanner.css'

type PageType = 'products' | 'profile'

interface TopBannerProps {
  onProductClick: () => void
  onProfileClick: () => void
  currentPage?: PageType // 可选的当前页面状态
}

export function TopBanner({ onProductClick, onProfileClick, currentPage = 'products' }: TopBannerProps) {
  return (
    <header className="top-banner">
      <div className="banner-container">
        {/* Logo 部分 */}
        <div className="logo-section">
          <h1 className="app-title">Web3 DApp</h1>
        </div>
        
        {/* 导航菜单 */}
        <nav className="nav-menu">
          <button 
            className={`nav-button ${currentPage === 'products' ? 'active' : ''}`}
            onClick={onProductClick}
          >
            产品
          </button>
          <button 
            className={`nav-button ${currentPage === 'profile' ? 'active' : ''}`}
            onClick={onProfileClick}
          >
            个人中心
          </button>
        </nav>

        {/* 连接钱包按钮 */}
        <div className="connect-section">
          <ConnectButton />
        </div>
      </div>
    </header>
  )
}
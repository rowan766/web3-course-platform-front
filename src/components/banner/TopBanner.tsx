import { useAccount, useReadContract } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import './TopBanner.css'

type PageType = 'products' | 'profile'|'admin'

interface TopBannerProps {
  onProductClick: () => void
  onProfileClick: () => void
  onAdminClick: () => void
  currentPage?: PageType // 可选的当前页面状态
}

// 添加合约ABI和地址
const COURSE_ADMIN_ABI = [
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const

const COURSE_PLATFORM_CONTRACT = import.meta.env.VITE_COURSE_PLATFORM_ADDRESS as `0x${string}`

export function TopBanner({ onProductClick, onProfileClick, onAdminClick, currentPage = 'products' }: TopBannerProps) {
  const { address } = useAccount()
    // 读取合约owner
  const { data: contractOwner } = useReadContract({
    address: COURSE_PLATFORM_CONTRACT,
    abi: COURSE_ADMIN_ABI,
    functionName: 'owner',
  })
    // 检查是否是owner
  const isOwner = address && contractOwner && address.toLowerCase() === contractOwner.toLowerCase()
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
            {isOwner && (  // 只有owner才显示
    <button className={`nav-button ${currentPage === 'admin' ? 'active' : ''}`} onClick={onAdminClick}>
      管理员
    </button>
  )}
        </nav>

        {/* 连接钱包按钮 */}
        <div className="connect-section">
          <ConnectButton />
        </div>
      </div>
    </header>
  )
}
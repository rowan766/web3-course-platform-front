import { useAccount, useBalance, useReadContract } from 'wagmi'
import { useState } from 'react'
import './ProfilePage.css'

// YDToken 合约 ABI（用于读取 YD 代币余额）
const YD_TOKEN_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const

const YD_TOKEN_CONTRACT = import.meta.env.VITE_YD_TOKEN_ADDRESS as `0x${string}`

export function ProfilePage() {
  const { address, isConnected } = useAccount()
  const [activeFeature, setActiveFeature] = useState<string | null>(null)

  const { data: ethBalance } = useBalance({
    address: address,
  })

  // 读取 YD 代币余额
  const { data: ydBalance } = useReadContract({
    address: YD_TOKEN_CONTRACT,
    abi: YD_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  const formatYDBalance = (balance: bigint | undefined) => {
    if (!balance) return '0'
    return (Number(balance) / 1e18).toLocaleString()
  }

  const handleFeatureClick = (feature: string) => {
    setActiveFeature(feature)
    // 这里可以添加具体的功能实现
    setTimeout(() => setActiveFeature(null), 2000)
  }

  const features = [
    {
      id: 'wallet',
      icon: '👛',
      title: '钱包管理',
      description: '查看余额和管理资产',
      status: 'active',
      onClick: () => handleFeatureClick('wallet')
    },
    {
      id: 'transactions',
      icon: '💸',
      title: '转账交易',
      description: '发送 ETH 和代币到其他地址',
      status: 'coming-soon',
      onClick: () => handleFeatureClick('transactions')
    },
    {
      id: 'contracts',
      icon: '📜',
      title: '智能合约',
      description: '与智能合约交互',
      status: 'active',
      onClick: () => handleFeatureClick('contracts')
    },
    {
      id: 'defi',
      icon: '🏦',
      title: 'DeFi 协议',
      description: '去中心化金融功能',
      status: 'coming-soon',
      onClick: () => handleFeatureClick('defi')
    },
    {
      id: 'nft',
      icon: '🎨',
      title: 'NFT 市场',
      description: '购买和出售 NFT',
      status: 'coming-soon',
      onClick: () => handleFeatureClick('nft')
    },
    {
      id: 'analytics',
      icon: '📊',
      title: '投资分析',
      description: '投资组合跟踪和分析',
      status: 'coming-soon',
      onClick: () => handleFeatureClick('analytics')
    },
    {
      id: 'bridge',
      icon: '🌉',
      title: '跨链桥',
      description: '跨链桥接功能',
      status: 'coming-soon',
      onClick: () => handleFeatureClick('bridge')
    },
    {
      id: 'security',
      icon: '🔒',
      title: '安全设置',
      description: '账户安全和隐私设置',
      status: 'active',
      onClick: () => handleFeatureClick('security')
    }
  ]

  if (!isConnected) {
    return (
      <div className="page-container">
        <main className="app-main">
          <div className="connect-prompt">
            <div className="connect-content">
              <h1>个人中心</h1>
              <p>连接钱包以访问所有功能</p>
              
              <div className="connect-benefits">
                <div className="benefit-item">
                  <span className="benefit-icon">💰</span>
                  <span>查看资产余额</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">📈</span>
                  <span>管理投资组合</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">🔄</span>
                  <span>执行交易操作</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">🛡️</span>
                  <span>安全可靠的体验</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="page-container">
      <main className="app-main">
        <div className="profile-section">
          {/* 个人信息头部 */}
          <div className="profile-header">
            <div className="profile-avatar">
              <div className="avatar-circle">
                {address?.slice(2, 4).toUpperCase()}
              </div>
            </div>
            <div className="profile-basic-info">
              <h1>欢迎回来</h1>
              <p className="wallet-address">
                {address ? `${address.slice(0, 8)}...${address.slice(-6)}` : ''}
              </p>
            </div>
          </div>

          {/* 资产概览 */}
          <div className="assets-summary">
            <h2>资产概览</h2>
            <div className="assets-grid">
              <div className="asset-card">
                <div className="asset-header">
                  <span className="asset-icon">⟠</span>
                  <div className="asset-info">
                    <h3>Ethereum</h3>
                    <p>ETH</p>
                  </div>
                </div>
                <div className="asset-balance">
                  {ethBalance ? Number(ethBalance.formatted).toFixed(4) : '0.0000'}
                </div>
              </div>

              <div className="asset-card">
                <div className="asset-header">
                  <span className="asset-icon">🪙</span>
                  <div className="asset-info">
                    <h3>YD Token</h3>
                    <p>YD</p>
                  </div>
                </div>
                <div className="asset-balance">
                  {formatYDBalance(ydBalance)}
                </div>
              </div>

              <div className="asset-card">
                <div className="asset-header">
                  <span className="asset-icon">💎</span>
                  <div className="asset-info">
                    <h3>总价值</h3>
                    <p>USD</p>
                  </div>
                </div>
                <div className="asset-balance">
                  ${((Number(ethBalance?.formatted || 0) * 3500) + 
                     (Number(formatYDBalance(ydBalance)) * 0.1)).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* 功能卡片 */}
          <div className="features-section">
            <h2>可用功能</h2>
            <div className="features-grid">
              {features.map((feature) => (
                <div 
                  key={feature.id} 
                  className={`feature-card ${feature.status} ${activeFeature === feature.id ? 'active' : ''}`}
                  onClick={feature.onClick}
                >
                  <div className="feature-content">
                    <div className="feature-header">
                      <span className="feature-icon">{feature.icon}</span>
                      <h3>{feature.title}</h3>
                    </div>
                    <p className="feature-description">{feature.description}</p>
                  </div>
                  
                  <div className="feature-footer">
                    {feature.status === 'active' ? (
                      <button className="feature-button active">
                        {activeFeature === feature.id ? '处理中...' : '立即使用'}
                      </button>
                    ) : (
                      <button className="feature-button coming-soon" disabled>
                        即将推出
                      </button>
                    )}
                  </div>

                  {feature.status === 'active' && (
                    <div className="feature-status-badge">
                      <span className="status-dot"></span>
                      可用
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 快速操作 */}
          <div className="quick-actions">
            <h2>快速操作</h2>
            <div className="actions-grid">
              <button className="action-item" onClick={() => handleFeatureClick('refresh')}>
                <span className="action-icon">🔄</span>
                <span>刷新余额</span>
              </button>
              <button className="action-item" onClick={() => handleFeatureClick('backup')}>
                <span className="action-icon">💾</span>
                <span>备份钱包</span>
              </button>
              <button className="action-item" onClick={() => handleFeatureClick('settings')}>
                <span className="action-icon">⚙️</span>
                <span>设置</span>
              </button>
              <button className="action-item" onClick={() => handleFeatureClick('help')}>
                <span className="action-icon">❓</span>
                <span>帮助</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
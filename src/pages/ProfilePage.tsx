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

// YDCoursePlatform合约ABI
const COURSE_PLATFORM_ABI = [
  {
    "inputs": [],
    "name": "getAllActiveCourses",
    "outputs": [
      {
        "components": [
          {"internalType": "uint256", "name": "id", "type": "uint256"},
          {"internalType": "string", "name": "title", "type": "string"},
          {"internalType": "string", "name": "description", "type": "string"},
          {"internalType": "string", "name": "contentHash", "type": "string"},
          {"internalType": "uint256", "name": "price", "type": "uint256"},
          {"internalType": "address", "name": "instructor", "type": "address"},
          {"internalType": "bool", "name": "isActive", "type": "bool"},
          {"internalType": "uint256", "name": "createdAt", "type": "uint256"},
          {"internalType": "uint256", "name": "totalSales", "type": "uint256"}
        ],
        "internalType": "struct YDCoursePlatform.Course[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "getUserCourses",
    "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const

const YD_TOKEN_CONTRACT = import.meta.env.VITE_YD_TOKEN_ADDRESS as `0x${string}`
const COURSE_PLATFORM_CONTRACT = import.meta.env.VITE_COURSE_PLATFORM_ADDRESS as `0x${string}`

interface Course {
  id: bigint
  title: string
  description: string
  contentHash: string
  price: bigint
  instructor: string
  isActive: boolean
  createdAt: bigint
  totalSales: bigint
}

export function ProfilePage() {
  const { address, isConnected } = useAccount()
  const [activeFeature, setActiveFeature] = useState<string | null>(null)
  const [viewingContent, setViewingContent] = useState<Course | null>(null)

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

  // 读取所有活跃课程
  const { data: courses } = useReadContract({
    address: COURSE_PLATFORM_CONTRACT,
    abi: COURSE_PLATFORM_ABI,
    functionName: 'getAllActiveCourses',
  })

  // 读取用户购买的课程
  const { data: userCourses } = useReadContract({
    address: COURSE_PLATFORM_CONTRACT,
    abi: COURSE_PLATFORM_ABI,
    functionName: 'getUserCourses',
    args: address ? [address] : undefined,
  })

  const formatYDBalance = (balance: bigint | undefined) => {
    if (!balance) return '0'
    return (Number(balance) / 1e18).toLocaleString()
  }

  // 格式化价格显示
  const formatPrice = (price: bigint) => {
    return Number(price / BigInt(1e18)).toLocaleString()
  }

  // 格式化时间
  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString()
  }

  // 获取文件类型
  const getFileType = (course: Course) => {
    const desc = course.description.toLowerCase()
    const title = course.title.toLowerCase()
    
    if (desc.includes('pdf') || title.includes('pdf')) return 'PDF'
    if (desc.includes('video') || desc.includes('视频') || title.includes('video')) return 'Video'
    if (desc.includes('audio') || desc.includes('音频') || title.includes('audio')) return 'Audio'
    if (desc.includes('word') || desc.includes('doc') || title.includes('word')) return 'Word'
    if (desc.includes('excel') || desc.includes('xls') || title.includes('excel')) return 'Excel'
    return 'Document'
  }

  // 获取文件图标
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'PDF': return '📄'
      case 'Video': return '🎥'
      case 'Audio': return '🎵'
      case 'Word': return '📝'
      case 'Excel': return '📊'
      default: return '📋'
    }
  }

  // 查看课程内容
  const handleViewContent = async (course: Course) => {
    try {
      if (course.contentHash) {
        const fileType = getFileType(course)
        const ipfsUrl = `https://ipfs.io/ipfs/${course.contentHash}`
        
        // PDF、Word、Excel 等文档类型在新窗口打开
        if (['PDF', 'Word', 'Excel'].includes(fileType)) {
          window.open(ipfsUrl, '_blank')
        } else {
          // 视频、音频等在模态框中显示
          setViewingContent(course)
        }
      } else {
        alert('课程内容暂时无法访问')
      }
    } catch (error) {
      console.error('Failed to view content:', error)
      alert('内容加载失败')
    }
  }

  // 获取已购买的课程
  const getPurchasedCourses = () => {
    if (!userCourses || !courses) return []
    return userCourses.map((courseId: bigint) => 
      courses.find((course: Course) => course.id === courseId)
    ).filter(Boolean) as Course[]
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

          {/* 我的课程区域 */}
          {isConnected && userCourses && userCourses.length > 0 && (
            <div className="my-courses-section">
              <h2>我的课程</h2>
              <p className="section-subtitle">在线预览已购买的课程内容</p>
              <div className="my-courses-grid">
                {getPurchasedCourses().map((course) => (
                  <div key={Number(course.id)} className="my-course-card">
                    <div className="course-file-type">
                      <span className="file-icon">{getFileIcon(getFileType(course))}</span>
                      <span className="file-type-label">{getFileType(course)}</span>
                    </div>
                    
                    <div className="my-course-content">
                      <h3>{course.title}</h3>
                      <p className="course-description">{course.description}</p>
                      
                      <div className="course-details">
                        <div className="detail-item">
                          <span className="detail-label">购买价格:</span>
                          <span className="detail-value">{formatPrice(course.price)} YD</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">购买时间:</span>
                          <span className="detail-value">{formatDate(course.createdAt)}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">内容哈希:</span>
                          <span className="detail-value">{course.contentHash.slice(0, 12)}...</span>
                        </div>
                      </div>
                    </div>

                    <div className="my-course-actions">
                      <button 
                        className="view-content-btn"
                        onClick={() => handleViewContent(course)}
                      >
                        <span className="btn-icon">👁️</span>
                        在线预览
                      </button>
                      <button 
                        className="download-btn"
                        onClick={() => window.open(`https://ipfs.io/ipfs/${course.contentHash}`, '_blank')}
                      >
                        <span className="btn-icon">⬇️</span>
                        下载
                      </button>
                    </div>

                    <div className="course-status-badge">
                      <span className="status-indicator"></span>
                      已购买
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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

        {/* 内容查看器 */}
        {viewingContent && (
          <div className="content-viewer-overlay" onClick={() => setViewingContent(null)}>
            <div className="content-viewer" onClick={(e) => e.stopPropagation()}>
              <div className="content-header">
                <div className="content-title">
                  <span className="content-icon">{getFileIcon(getFileType(viewingContent))}</span>
                  <h3>{viewingContent.title}</h3>
                </div>
                <button onClick={() => setViewingContent(null)} className="close-btn">✕</button>
              </div>
              <div className="content-body">
                {viewingContent.contentHash ? (
                  <div className="content-frame">
                    {getFileType(viewingContent) === 'Video' ? (
                      <video 
                        controls 
                        width="100%" 
                        height="100%"
                        src={`https://ipfs.io/ipfs/${viewingContent.contentHash}`}
                      >
                        您的浏览器不支持视频播放
                      </video>
                    ) : getFileType(viewingContent) === 'Audio' ? (
                      <div className="audio-player">
                        <audio 
                          controls 
                          style={{ width: '100%' }}
                          src={`https://ipfs.io/ipfs/${viewingContent.contentHash}`}
                        >
                          您的浏览器不支持音频播放
                        </audio>
                        <div className="audio-info">
                          <h4>🎵 {viewingContent.title}</h4>
                          <p>{viewingContent.description}</p>
                        </div>
                      </div>
                    ) : (
                      <iframe 
                        src={`https://ipfs.io/ipfs/${viewingContent.contentHash}`}
                        width="100%" 
                        height="100%"
                        title={viewingContent.title}
                        style={{ border: 'none' }}
                      />
                    )}
                  </div>
                ) : (
                  <div className="loading-content">
                    <p>内容加载中...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
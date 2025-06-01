import '@rainbow-me/rainbowkit/styles.css'
import './App.css'
import { useState } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, darkTheme, ConnectButton } from '@rainbow-me/rainbowkit'

import { useAccount, useBalance,WagmiProvider } from 'wagmi'

import { config } from './wagmi'

const queryClient = new QueryClient()

// 自定义组件
import { TopBanner } from './components/banner/TopBanner'
import { ProfilePage } from './pages/ProfilePage'
import { ProductsPage } from './pages/ProductsPage'

// 页面类型定义
type PageType = 'products' | 'profile'


                



// 主要内容组件
function MainContent() {
  const [currentPage, setCurrentPage] = useState<PageType>('products')

  // 处理导航按钮点击事件
  const handleProductClick = () => {
    console.log('点击了产品按钮')
    setCurrentPage('products')
  }

  const handleProfileClick = () => {
    console.log('点击了个人中心按钮')
    setCurrentPage('profile')
  }

  return (
    <div className="app-container">
      {/* 顶部导航 Banner */}
      <TopBanner 
        onProductClick={handleProductClick}
        onProfileClick={handleProfileClick}
        currentPage={currentPage} // 传递当前页面状态用于高亮显示
      />
      
      {/* 根据当前页面渲染不同内容 */}
      {currentPage === 'products' && <ProductsPage />}
      {currentPage === 'profile' && <ProfilePage />}
    </div>
  )
}

function App() {
  return (
    <>
    <WagmiProvider config={config}>
      <QueryClientProvider  client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#7b3bf0',
            accentColorForeground: 'white',
            borderRadius: 'medium',
            fontStack: 'system',
            overlayBlur: 'small',
          })}
        >
        <MainContent />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
    </>
  )
}

export default App
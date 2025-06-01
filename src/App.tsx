import '@rainbow-me/rainbowkit/styles.css'
import './App.css'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, darkTheme, ConnectButton } from '@rainbow-me/rainbowkit'

import { useAccount, useBalance,WagmiProvider } from 'wagmi'

import { config } from './wagmi'

const queryClient = new QueryClient()

// 自定义组件
import { ContractInteraction } from './components/ContractInteraction'
import DynamicAccountsList from './components/DynamicAccountsList'

// 主要内容组件
function MainContent() {
  const { address, isConnected } = useAccount()
  
  const { data: balance } = useBalance({
    address: address,
  })

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🌈 My Web3 DApp</h1>
        <p>Built with wagmi & RainbowKit</p>
        <ConnectButton />
      </header>

      <main className="app-main">
        {isConnected ? (
          <div className="connected-content">
             {/* 现有的账户信息 */}
            <div className="account-info">
              <h2>Account Info</h2>
              <p><strong>Address:</strong> {address}</p>
              <p><strong>Balance:</strong> {balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : 'Loading...'}</p>
            </div>
            {/* 添加合约交互组件 */}
            <ContractInteraction></ContractInteraction>
            {/* 当前连接的链所有账户 */}
            <DynamicAccountsList></DynamicAccountsList>
            
            <div className="features">
              <h2>Available Features</h2>
              <div className="feature-grid">
                <div className="feature-card">
                  <h3>💸 Send Transaction</h3>
                  <p>Send ETH to other addresses</p>
                  <button className="feature-button">Coming Soon</button>
                </div>
                
                <div className="feature-card">
                  <h3>📜 Smart Contracts</h3>
                  <p>Interact with smart contracts</p>
                  <button className="feature-button">Coming Soon</button>
                </div>
                
                <div className="feature-card">
                  <h3>🏪 DeFi</h3>
                  <p>Decentralized Finance features</p>
                  <button className="feature-button">Coming Soon</button>
                </div>
                <div className="feature-card">
                  <h3>🏪 DeFi</h3>
                  <p>Decentralized Finance features</p>
                  <button className="feature-button">Coming Soon</button>
                </div>
                <div className="feature-card">
                  <h3>🏪 DeFi</h3>
                  <p>Decentralized Finance features</p>
                  <button className="feature-button">Coming Soon</button>
                </div>
                <div className="feature-card">
                  <h3>🏪 DeFi</h3>
                  <p>Decentralized Finance features</p>
                  <button className="feature-button">Coming Soon</button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="connect-prompt">
            <h2>Welcome to Web3!</h2>
            <p>Connect your wallet to get started</p>
            <div className="connect-features">
              <div className="feature-item">✅ Secure wallet connection</div>
              <div className="feature-item">✅ Multi-chain support</div>
              <div className="feature-item">✅ DeFi integration ready</div>
            </div>
          </div>
        )}
      </main>
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

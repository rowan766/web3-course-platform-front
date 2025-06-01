import { useAccount, useBalance } from 'wagmi'
import { TokenPurchase } from '../components/ydTaken/TokenPurchase'
import './ProductsPage.css'
import {CoursePlatform} from '../components/course/CoursePlatform'

export function ProductsPage() {
  const { address, isConnected } = useAccount()
  const { data: balance } = useBalance({
    address: address,
  })


  function bfDom(){
    return (
              <div className="features">
              <h2>Available Features</h2>
              <div className="feature-grid">
                <div className="feature-card">
                  <div className="feature-card-content">
                    <h3><span className="emoji">💸 Send Transactio</span>n</h3>
                    <p>Send ETH to other addresses</p>
                    <button className="feature-button">Coming Soon</button>
                  </div>
                </div>
                
                <div className="feature-card">
                  <div className="feature-card-content">
                    <h3> <span className="emoji">📜 Smart Contracts</span></h3>
                    <p>Interact with smart contracts</p>
                    <button className="feature-button">Coming Soon</button>
                  </div>
                </div>
                
                <div className="feature-card">
                  <div className="feature-card-content">
                    <h3> <span className="emoji">🏪 DeFi</span></h3>
                    <p>Decentralized Finance features</p>
                    <button className="feature-button">Coming Soon</button>
                  </div>
                </div>
                <div className="feature-card">
                  <div className="feature-card-content">
                    <h3> <span className="emoji">🎮 NFT Marketplace</span></h3>
                    <p>Buy and sell NFTs</p>
                    <button className="feature-button">Coming Soon</button>
                  </div>
                </div>
                <div className="feature-card">
                  <div className="feature-card-content">
                    <h3><span className="emoji">📊 Analytics</span></h3>
                    <p>Portfolio tracking and analytics</p>
                    <button className="feature-button">Coming Soon</button>
                  </div>
                </div>
                <div className="feature-card">
                  <div className="feature-card-content">
                  <h3><span className="emoji">🔗 Cross-chain</span></h3>
                  <p>Cross-chain bridge functionality</p>
                  <button className="feature-button">Coming Soon</button>
                  </div>
                </div>
              </div>
            </div>
    )
  }

  return (
      <main className="app-main">
        {isConnected ? (
          <div className="connected-content"> 
            <TokenPurchase></TokenPurchase>
            <CoursePlatform></CoursePlatform>
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
  )
}
import { useAccount } from 'wagmi'
import { TokenPurchase } from '../components/ydTaken/TokenPurchase'
import './ProductsPage.css'
import {CoursePlatform} from '../components/course/CoursePlatform'

export function ProductsPage() {
  const { isConnected } = useAccount()

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
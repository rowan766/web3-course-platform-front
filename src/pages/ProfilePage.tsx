import { useAccount, useBalance } from 'wagmi'
import './ProfilePage.css'

export function ProfilePage() {
  const { address, isConnected } = useAccount()
  const { data: balance } = useBalance({
    address: address,
  })

  return (
    <div className="page-container">
      <main className="app-main">
        {isConnected ? (
          <div className="connected-content">
            <div className="profile-section">
              <h2>个人中心</h2>
              
              <div className="profile-info">
                <div className="info-card">
                  <h3>钱包信息</h3>
                  <div className="wallet-details">
                    <p><strong>地址:</strong> {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '未连接'}</p>
                    <p><strong>余额:</strong> {balance ? `${Number(balance.formatted).toFixed(4)} ${balance.symbol}` : '0 ETH'}</p>
                  </div>
                </div>

                <div className="info-card">
                  <h3>账户设置</h3>
                  <div className="settings-options">
                    <button className="setting-button">更改网络</button>
                    <button className="setting-button">导出私钥</button>
                    <button className="setting-button">安全设置</button>
                  </div>
                </div>

                <div className="info-card">
                  <h3>交易历史</h3>
                  <div className="transaction-history">
                    <p className="empty-state">暂无交易记录</p>
                    <button className="feature-button">查看详细历史</button>
                  </div>
                </div>

                <div className="info-card">
                  <h3>我的资产</h3>
                  <div className="assets-overview">
                    <div className="asset-item">
                      <span>ETH</span>
                      <span>{balance ? Number(balance.formatted).toFixed(4) : '0'}</span>
                    </div>
                    <div className="asset-item">
                      <span>USDC</span>
                      <span>0</span>
                    </div>
                    <div className="asset-item">
                      <span>USDT</span>
                      <span>0</span>
                    </div>
                  </div>
                </div>

                <div className="info-card">
                  <h3>NFT 收藏</h3>
                  <div className="nft-collection">
                    <p className="empty-state">暂无 NFT 收藏</p>
                    <button className="feature-button">浏览 NFT 市场</button>
                  </div>
                </div>

                <div className="info-card">
                  <h3>DeFi 协议</h3>
                  <div className="defi-protocols">
                    <div className="protocol-item">
                      <span>Uniswap</span>
                      <span className="status">未连接</span>
                    </div>
                    <div className="protocol-item">
                      <span>Aave</span>
                      <span className="status">未连接</span>
                    </div>
                    <div className="protocol-item">
                      <span>Compound</span>
                      <span className="status">未连接</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="connect-prompt">
            <h2>请连接钱包</h2>
            <p>连接钱包后查看个人信息</p>
            <div className="connect-features">
              <div className="feature-item">✅ 查看钱包余额</div>
              <div className="feature-item">✅ 管理资产</div>
              <div className="feature-item">✅ 交易历史</div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
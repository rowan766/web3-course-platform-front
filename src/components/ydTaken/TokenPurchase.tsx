import { useState, useEffect } from 'react'
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import './TokenPurchase.css'

// YDToken合约ABI
const YD_TOKEN_ABI = [
  {
    "inputs": [],
    "name": "buyTokens",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "tokenPrice",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "saleActive",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "maxTokensPerTransaction",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "ethAmount", "type": "uint256"}],
    "name": "calculateTokensFromETH",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenAmount", "type": "uint256"}],
    "name": "calculateETHFromTokens",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const

// 合约地址 - 请替换为你的实际YDToken合约地址
const YD_TOKEN_CONTRACT = '0x23941b01e2F0fDF214d4d440FB4654C00deBb52D' // 替换为你的合约地址

export function TokenPurchase() {
  const { address, isConnected } = useAccount()
  const [purchaseAmount, setPurchaseAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // 读取合约基本信息
  const { data: tokenName } = useReadContract({
    address: YD_TOKEN_CONTRACT,
    abi: YD_TOKEN_ABI,
    functionName: 'name',
  })

  const { data: tokenSymbol } = useReadContract({
    address: YD_TOKEN_CONTRACT,
    abi: YD_TOKEN_ABI,
    functionName: 'symbol',
  })

  const { data: tokenPrice } = useReadContract({
    address: YD_TOKEN_CONTRACT,
    abi: YD_TOKEN_ABI,
    functionName: 'tokenPrice',
  })

  const { data: totalSupply } = useReadContract({
    address: YD_TOKEN_CONTRACT,
    abi: YD_TOKEN_ABI,
    functionName: 'totalSupply',
  })

  const { data: saleActive } = useReadContract({
    address: YD_TOKEN_CONTRACT,
    abi: YD_TOKEN_ABI,
    functionName: 'saleActive',
  })

  const { data: maxTokensPerTransaction } = useReadContract({
    address: YD_TOKEN_CONTRACT,
    abi: YD_TOKEN_ABI,
    functionName: 'maxTokensPerTransaction',
  })

  const { data: ownerAddress } = useReadContract({
    address: YD_TOKEN_CONTRACT,
    abi: YD_TOKEN_ABI,
    functionName: 'owner',
  })

  // 读取用户代币余额
  const { data: userTokenBalance } = useReadContract({
    address: YD_TOKEN_CONTRACT,
    abi: YD_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  // 读取可售代币数量（owner的余额）
  const { data: availableTokens } = useReadContract({
    address: YD_TOKEN_CONTRACT,
    abi: YD_TOKEN_ABI,
    functionName: 'balanceOf',
    args: ownerAddress ? [ownerAddress] : undefined,
  })

  // 计算需要的ETH数量
  const { data: calculatedEthAmount } = useReadContract({
    address: YD_TOKEN_CONTRACT,
    abi: YD_TOKEN_ABI,
    functionName: 'calculateETHFromTokens',
    args: purchaseAmount ? [parseEther(purchaseAmount)] : undefined,
  })

  // 写入合约
  const { 
    writeContract, 
    data: hash,
    error,
    isPending 
  } = useWriteContract()

  // 等待交易确认
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  // 计算需要的ETH数量
  const calculateEthAmount = () => {
    if (!calculatedEthAmount) return '0'
    return formatEther(calculatedEthAmount)
  }

  // 检查购买限制
  const checkPurchaseLimit = () => {
    if (!purchaseAmount || !maxTokensPerTransaction) return true
    try {
      const amount = parseEther(purchaseAmount)
      return amount <= maxTokensPerTransaction
    } catch {
      return false
    }
  }

  // 购买代币
  const handlePurchase = async () => {
    if (!purchaseAmount || !calculatedEthAmount || !isConnected || !saleActive) return
    
    if (!checkPurchaseLimit()) {
      alert(`单次购买数量不能超过 ${maxTokensPerTransaction ? formatEther(maxTokensPerTransaction) : '0'} ${tokenSymbol || 'YD'}`)
      return
    }

    try {
      setIsLoading(true)
      
      writeContract({
        address: YD_TOKEN_CONTRACT,
        abi: YD_TOKEN_ABI,
        functionName: 'buyTokens',
        value: calculatedEthAmount,
      })
    } catch (err) {
      console.error('Purchase failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // 重置购买状态
  useEffect(() => {
    if (isConfirmed) {
      setPurchaseAmount('')
      setIsLoading(false)
    }
  }, [isConfirmed])

  if (!isConnected) {
    return (
      <div className="token-section">
        <div className="token-info">
          <div className="connect-prompt-token">
            <h2>连接钱包购买 {tokenSymbol || 'YD'} 代币</h2>
            <p>请先连接钱包以查看代币信息和购买</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="token-section">
      <div className="token-info">
        <div className="token-header">
          <div className="token-logo">💎</div>
          <div className="token-details">
            <h2>{tokenName || 'YD Token'} ({tokenSymbol || 'YD'})</h2>
            <p className="token-description">
              高质量的去中心化代币，当前价格 {tokenPrice ? formatEther(tokenPrice) : '0.0004'} ETH
            </p>
            <div className="contract-info">
              <span className="contract-label">合约地址:</span>
              <span className="contract-address">
                {YD_TOKEN_CONTRACT.slice(0, 6)}...{YD_TOKEN_CONTRACT.slice(-4)}
              </span>
            </div>
          </div>
        </div>

        {/* 销售状态提示 */}
        {saleActive === false && (
          <div className="sale-inactive">
            ⚠️ 代币销售当前未激活
          </div>
        )}
        
        <div className="token-stats">
          <div className="stat-item">
            <span className="stat-label">总供应量</span>
            <span className="stat-value">
              {totalSupply ? Number(formatEther(totalSupply)).toLocaleString() : '加载中...'} {tokenSymbol || 'YD'}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">代币价格</span>
            <span className="stat-value">
              {tokenPrice ? formatEther(tokenPrice) : '0.0004'} ETH
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">可购买数量</span>
            <span className="stat-value">
              {availableTokens ? Number(formatEther(availableTokens)).toLocaleString() : '加载中...'} {tokenSymbol || 'YD'}
            </span>
          </div>
        </div>

        {/* 用户代币余额 */}
        {userTokenBalance && BigInt(userTokenBalance.toString()) > 0n && (
          <div className="user-balance">
            <span className="balance-label">你的 {tokenSymbol || 'YD'} 余额:</span>
            <span className="balance-value">
              {Number(formatEther(userTokenBalance)).toLocaleString()} {tokenSymbol || 'YD'}
            </span>
          </div>
        )}
        
        <div className="purchase-section">
          <div className="purchase-input">
            <input 
              type="number" 
              placeholder="输入购买数量" 
              className="token-input"
              value={purchaseAmount}
              onChange={(e) => setPurchaseAmount(e.target.value)}
              disabled={isLoading || isPending || isConfirming || !saleActive}
            />
            <span className="input-suffix">{tokenSymbol || 'YD'}</span>
          </div>

          {/* 购买限制提示 */}
          {maxTokensPerTransaction && (
            <p className="max-purchase-note">
              单次最大购买量: {Number(formatEther(maxTokensPerTransaction)).toLocaleString()} {tokenSymbol || 'YD'}
            </p>
          )}
          
          <button 
            className="purchase-button"
            onClick={handlePurchase}
            disabled={!purchaseAmount || !saleActive || isLoading || isPending || isConfirming || !tokenPrice || !checkPurchaseLimit()}
          >
            {!saleActive ? '销售未激活' :
             !checkPurchaseLimit() ? '超出购买限制' :
             isPending ? '确认交易...' : 
             isConfirming ? '等待确认...' : 
             isLoading ? '处理中...' : 
             `用 ETH 购买 ${tokenSymbol || 'YD'}`}
          </button>
          
          <p className="purchase-note">
            预计消耗: <span className="eth-amount">{calculateEthAmount()} ETH</span>
          </p>

          {/* 汇率信息 */}
          {tokenPrice && (
            <p className="exchange-rate">
              汇率: 1 {tokenSymbol || 'YD'} = {formatEther(tokenPrice)} ETH (比例 1:{Math.round(1 / Number(formatEther(tokenPrice)))})
            </p>
          )}

          {error && (
            <div className="error-message">
              购买失败: {error.message.includes('User rejected') ? '用户取消交易' : 
                        error.message.includes('insufficient funds') ? 'ETH余额不足' :
                        error.message.includes('Not enough tokens') ? '可售代币不足' :
                        error.message.includes('Exceeds max tokens') ? '超出单次购买限制' :
                        error.message}
            </div>
          )}

          {isConfirmed && (
            <div className="success-message">
              🎉 购买成功！{purchaseAmount} {tokenSymbol || 'YD'} 已到账
            </div>
          )}

          {hash && (
            <div className="transaction-hash">
              <span>交易哈希: </span>
              <a 
                href={`https://sepolia.etherscan.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hash-link"
              >
                {hash.slice(0, 10)}...{hash.slice(-8)}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
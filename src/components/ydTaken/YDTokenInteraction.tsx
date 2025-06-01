// src/components/YDTokenInteraction.tsx
import React, { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useBalance } from 'wagmi'
import { formatEther, parseEther, formatUnits, parseUnits } from 'viem'
import './YDTokenInteraction.css'

// YDToken 合约 ABI
const YDTOKEN_ABI = [
  // 基本 ERC20 函数
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
    "inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "transfer",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // YDToken 特有功能
  {
    "inputs": [],
    "name": "buyTokens",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenAmount", "type": "uint256"}],
    "name": "sellTokens",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTokenPrice",
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
    "inputs": [],
    "name": "contractETHBalance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "burn",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

// 替换为你的合约地址
const CONTRACT_ADDRESS = import.meta.env.VITE_YD_TOKEN_ADDRESS as `0x${string}`

export const YDTokenInteraction: React.FC = () => {
  const { address, isConnected } = useAccount()
  const [buyAmount, setBuyAmount] = useState<string>('')
  const [sellAmount, setSellAmount] = useState<string>('')
  const [transferTo, setTransferTo] = useState<string>('')
  const [transferAmount, setTransferAmount] = useState<string>('')
  const [burnAmount, setBurnAmount] = useState<string>('')
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>()

  // 读取代币基本信息
  const { data: tokenName } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: YDTOKEN_ABI,
    functionName: 'name',
  })

  const { data: tokenSymbol } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: YDTOKEN_ABI,
    functionName: 'symbol',
  })

  const { data: tokenDecimals } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: YDTOKEN_ABI,
    functionName: 'decimals',
  })

  const { data: totalSupply } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: YDTOKEN_ABI,
    functionName: 'totalSupply',
  })

  // 读取用户代币余额
  const { data: tokenBalance, refetch: refetchTokenBalance } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: YDTOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  })

  // 读取用户 ETH 余额
  const { data: ethBalance } = useBalance({
    address: address,
  })

  // 读取代币价格和销售信息
  const { data: tokenPrice } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: YDTOKEN_ABI,
    functionName: 'getTokenPrice',
  })

  const { data: saleActive } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: YDTOKEN_ABI,
    functionName: 'saleActive',
  })

  const { data: maxTokensPerTx } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: YDTOKEN_ABI,
    functionName: 'maxTokensPerTransaction',
  })

  const { data: contractETHBalance } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: YDTOKEN_ABI,
    functionName: 'contractETHBalance',
  })

  // 计算购买代币数量
  const { data: calculatedTokens } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: YDTOKEN_ABI,
    functionName: 'calculateTokensFromETH',
    args: buyAmount ? [parseEther(buyAmount)] : undefined,
    query: { enabled: !!buyAmount && !isNaN(Number(buyAmount)) }
  })

  // 合约写入操作
  const { writeContract, isPending } = useWriteContract()

  // 等待交易确认
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  // 购买代币
  const handleBuyTokens = async () => {
    if (!buyAmount || !saleActive) return
    
    try {
      const hash = await writeContract({
        address: CONTRACT_ADDRESS,
        abi: YDTOKEN_ABI,
        functionName: 'buyTokens',
        value: parseEther(buyAmount),
      })
      setTxHash(hash)
    } catch (error) {
      console.error('购买失败:', error)
    }
  }

  // 卖出代币
  const handleSellTokens = async () => {
    if (!sellAmount || !saleActive) return
    
    try {
      const hash = await writeContract({
        address: CONTRACT_ADDRESS,
        abi: YDTOKEN_ABI,
        functionName: 'sellTokens',
        args: [parseUnits(sellAmount, tokenDecimals || 18)],
      })
      setTxHash(hash)
    } catch (error) {
      console.error('卖出失败:', error)
    }
  }

  // 转账代币
  const handleTransfer = async () => {
    if (!transferTo || !transferAmount) return
    
    try {
      const hash = await writeContract({
        address: CONTRACT_ADDRESS,
        abi: YDTOKEN_ABI,
        functionName: 'transfer',
        args: [transferTo as `0x${string}`, parseUnits(transferAmount, tokenDecimals || 18)],
      })
      setTxHash(hash)
    } catch (error) {
      console.error('转账失败:', error)
    }
  }

  // 销毁代币
  const handleBurn = async () => {
    if (!burnAmount) return
    
    try {
      const hash = await writeContract({
        address: CONTRACT_ADDRESS,
        abi: YDTOKEN_ABI,
        functionName: 'burn',
        args: [parseUnits(burnAmount, tokenDecimals || 18)],
      })
      setTxHash(hash)
    } catch (error) {
      console.error('销毁失败:', error)
    }
  }

  // 交易确认后刷新数据
  useEffect(() => {
    if (isConfirmed) {
      refetchTokenBalance()
      setTxHash(undefined)
      setBuyAmount('')
      setSellAmount('')
      setTransferAmount('')
      setBurnAmount('')
    }
  }, [isConfirmed, refetchTokenBalance])

  if (!isConnected) {
    return (
      <div className="ydtoken-container">
        <div className="connect-prompt">
          <h2>🔗 请先连接钱包</h2>
          <p>连接钱包后即可与 YDToken 合约交互</p>
        </div>
      </div>
    )
  }

  return (
    <div className="ydtoken-container">
      <div className="ydtoken-header">
        <h2>🪙 {tokenName} ({tokenSymbol}) 交互界面</h2>
        <div className="sale-status">
          销售状态: <span className={saleActive ? 'active' : 'inactive'}>
            {saleActive ? '🟢 开启中' : '🔴 已关闭'}
          </span>
        </div>
      </div>

      {/* 代币信息展示 */}
      <div className="info-grid">
        <div className="info-card">
          <h3>💰 我的余额</h3>
          <div className="balance-info">
            <p><strong>ETH:</strong> {ethBalance ? `${parseFloat(formatEther(ethBalance.value)).toFixed(4)} ETH` : '0 ETH'}</p>
            <p><strong>{tokenSymbol}:</strong> {tokenBalance ? `${parseFloat(formatUnits(tokenBalance, tokenDecimals || 18)).toFixed(2)} ${tokenSymbol}` : `0 ${tokenSymbol}`}</p>
          </div>
        </div>

        <div className="info-card">
          <h3>📊 代币信息</h3>
          <div className="token-info">
            <p><strong>总供应量:</strong> {totalSupply ? `${parseFloat(formatUnits(totalSupply, tokenDecimals || 18)).toLocaleString()} ${tokenSymbol}` : 'Loading...'}</p>
            <p><strong>当前价格:</strong> {tokenPrice ? `${formatEther(tokenPrice)} ETH` : 'Loading...'}</p>
            <p><strong>单次限额:</strong> {maxTokensPerTx ? `${parseFloat(formatUnits(maxTokensPerTx, tokenDecimals || 18)).toLocaleString()} ${tokenSymbol}` : 'Loading...'}</p>
          </div>
        </div>

        <div className="info-card">
          <h3>🏦 合约信息</h3>
          <div className="contract-info">
            <p><strong>合约 ETH:</strong> {contractETHBalance ? `${formatEther(contractETHBalance)} ETH` : '0 ETH'}</p>
            <p><strong>地址:</strong> 
              <a href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer">
                {CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)}
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* 功能操作区 */}
      <div className="actions-grid">
        {/* 购买代币 */}
        <div className="action-card">
          <h3>🛒 购买代币</h3>
          <div className="action-content">
            <input
              type="number"
              value={buyAmount}
              onChange={(e) => setBuyAmount(e.target.value)}
              placeholder="输入 ETH 数量"
              step="0.01"
              min="0"
            />
            {calculatedTokens && buyAmount && (
              <p className="calculation">
                将获得: <strong>{parseFloat(formatUnits(calculatedTokens, tokenDecimals || 18)).toFixed(2)} {tokenSymbol}</strong>
              </p>
            )}
            <button 
              onClick={handleBuyTokens}
              disabled={!buyAmount || !saleActive || isPending || isConfirming}
              className="action-button buy-button"
            >
              {isPending ? '发送中...' : isConfirming ? '确认中...' : '购买代币'}
            </button>
          </div>
        </div>

        {/* 卖出代币 */}
        <div className="action-card">
          <h3>💸 卖出代币</h3>
          <div className="action-content">
            <input
              type="number"
              value={sellAmount}
              onChange={(e) => setSellAmount(e.target.value)}
              placeholder={`输入 ${tokenSymbol} 数量`}
              step="0.01"
              min="0"
            />
            <button 
              onClick={handleSellTokens}
              disabled={!sellAmount || !saleActive || isPending || isConfirming}
              className="action-button sell-button"
            >
              {isPending ? '发送中...' : isConfirming ? '确认中...' : '卖出代币'}
            </button>
          </div>
        </div>

        {/* 转账代币 */}
        <div className="action-card">
          <h3>📤 转账代币</h3>
          <div className="action-content">
            <input
              type="text"
              value={transferTo}
              onChange={(e) => setTransferTo(e.target.value)}
              placeholder="接收地址"
            />
            <input
              type="number"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              placeholder={`${tokenSymbol} 数量`}
              step="0.01"
              min="0"
            />
            <button 
              onClick={handleTransfer}
              disabled={!transferTo || !transferAmount || isPending || isConfirming}
              className="action-button transfer-button"
            >
              {isPending ? '发送中...' : isConfirming ? '确认中...' : '转账'}
            </button>
          </div>
        </div>

        {/* 销毁代币 */}
        <div className="action-card">
          <h3>🔥 销毁代币</h3>
          <div className="action-content">
            <input
              type="number"
              value={burnAmount}
              onChange={(e) => setBurnAmount(e.target.value)}
              placeholder={`销毁 ${tokenSymbol} 数量`}
              step="0.01"
              min="0"
            />
            <button 
              onClick={handleBurn}
              disabled={!burnAmount || isPending || isConfirming}
              className="action-button burn-button"
            >
              {isPending ? '发送中...' : isConfirming ? '确认中...' : '销毁代币'}
            </button>
          </div>
        </div>
      </div>

      {/* 交易状态 */}
      {txHash && (
        <div className="transaction-status">
          <h3>📋 交易状态</h3>
          <p>交易哈希: 
            <a 
              href={`https://sepolia.etherscan.io/tx/${txHash}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="tx-link"
            >
              {txHash.slice(0, 10)}...{txHash.slice(-8)}
            </a>
          </p>
          {isConfirming && <p className="confirming">⏳ 等待交易确认...</p>}
          {isConfirmed && <p className="confirmed">✅ 交易已确认!</p>}
        </div>
      )}
    </div>
  )
}
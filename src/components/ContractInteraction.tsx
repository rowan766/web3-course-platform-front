import './ContractInteraction.css'
import { useState } from 'react'
import { 
  useReadContract, 
  useWriteContract, 
  useWaitForTransactionReceipt,
  useAccount 
} from 'wagmi'

import { parseEther, formatEther } from 'viem'

// 替换为你的实际合约地址
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`

// 红包合约ABI
const REDPACKET_ABI = [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "creator",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "totalAmount",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "count",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "isEqual",
          "type": "bool"
        }
      ],
      "name": "RedPacketCreated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [],
      "name": "RedPacketFinished",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "grabber",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "RedPacketGrabbed",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "count",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "grabbedAmount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [],
      "name": "isEqual",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "isGrabbed",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [],
      "name": "isInitialized",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [],
      "name": "remainingAmount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [],
      "name": "remainingCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [],
      "name": "totalAmount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [],
      "name": "yideng",
      "outputs": [
        {
          "internalType": "address payable",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "c",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "_isEqual",
          "type": "bool"
        }
      ],
      "name": "createRedPacket",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function",
      "payable": true
    },
    {
      "inputs": [],
      "name": "getBalance",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [],
      "name": "grabRedPacket",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "getGrabbedAmount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [],
      "name": "getRedPacketInfo",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "_totalAmount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_count",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_remainingCount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_remainingAmount",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "_isEqual",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "_isInitialized",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [],
      "name": "withdraw",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
] as const

export function ContractInteraction() {
  const { address, isConnected } = useAccount()
  
  // 表单状态
  const [inputAmount, setInputAmount] = useState('')
  const [inputCount, setInputCount] = useState('')
  const [isEqualAmount, setIsEqualAmount] = useState(true)
  const [queryAddress, setQueryAddress] = useState('')

  // 读取红包信息
  const { 
    data: redPacketInfo, 
    refetch: refetchRedPacketInfo,
    isLoading: isLoadingInfo 
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: REDPACKET_ABI,
    functionName: 'getRedPacketInfo',
  })

  // 读取合约创建者
  const { 
    data: creator,
    isLoading: isLoadingCreator 
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: REDPACKET_ABI,
    functionName: 'yideng',
  })

  // 读取合约余额
  const { 
    data: contractBalance,
    refetch: refetchBalance,
    isLoading: isLoadingBalance 
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: REDPACKET_ABI,
    functionName: 'getBalance',
  })

  // 读取当前用户是否已抢过红包
  const { 
    data: hasGrabbed,
    refetch: refetchGrabStatus
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: REDPACKET_ABI,
    functionName: 'isGrabbed',
    args: address ? [address] : undefined,
  })

  // 读取当前用户抢到的金额
  const { 
    data: grabbedAmount,
    refetch: refetchGrabbedAmount
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: REDPACKET_ABI,
    functionName: 'getGrabbedAmount',
    args: address ? [address] : undefined,
  })

  // 查询指定用户抢到的金额
  const { 
    data: queriedAmount,
    refetch: refetchQueriedAmount
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: REDPACKET_ABI,
    functionName: 'getGrabbedAmount',
    args: queryAddress ? [queryAddress as `0x${string}`] : undefined,
  })

  // 写入合约
  const { 
    writeContract, 
    data: hash, 
    error, 
    isPending 
  } = useWriteContract()

  // 等待交易确认
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed 
  } = useWaitForTransactionReceipt({ 
    hash 
  })

  // 解析红包信息
  const totalAmount = redPacketInfo ? formatEther(redPacketInfo[0]) : '0'
  const count = redPacketInfo ? redPacketInfo[1].toString() : '0'
  const remainingCount = redPacketInfo ? redPacketInfo[2].toString() : '0'
  const remainingAmount = redPacketInfo ? formatEther(redPacketInfo[3]) : '0'
  const isEqual = redPacketInfo ? redPacketInfo[4] : false
  const isInitialized = redPacketInfo ? redPacketInfo[5] : false

  // 创建红包
  const handleCreateRedPacket = async () => {
    if (!inputAmount || !inputCount) {
      alert('请输入金额和个数')
      return
    }

    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: REDPACKET_ABI,
        functionName: 'createRedPacket',
        args: [BigInt(inputCount), isEqualAmount],
        value: parseEther(inputAmount), // 发送 ETH
      })
    } catch (err) {
      console.error('创建红包失败:', err)
    }
  }

  // 抢红包
  const handleGrabRedPacket = async () => {
    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: REDPACKET_ABI,
        functionName: 'grabRedPacket',
      })
    } catch (err) {
      console.error('抢红包失败:', err)
    }
  }

  // 提取剩余资金
  const handleWithdraw = async () => {
    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: REDPACKET_ABI,
        functionName: 'withdraw',
      })
    } catch (err) {
      console.error('提取失败:', err)
    }
  }

  // 刷新所有数据
  const handleRefreshAll = () => {
    refetchRedPacketInfo()
    refetchBalance()
    refetchGrabStatus()
    refetchGrabbedAmount()
  }

  // 查询用户
  const handleQueryUser = () => {
    if (!queryAddress) {
      alert('请输入用户地址')
      return
    }
    refetchQueriedAmount()
  }

  if (!isConnected) {
    return (
      <div className="contract-section">
        <h2 className="section-title">🧧 RedPacket Contract</h2>
        <div className="connect-prompt">
          <p>请先连接钱包以与合约交互</p>
        </div>
      </div>
    )
  }

  return (
    <div className="contract-section">
      <h2 className="section-title">🧧 RedPacket Contract</h2>
      
      <div className="contract-grid">
        {/* 合约信息 */}
        <div className="contract-card">
          <div className="card-header">
            <div className="card-icon">📋</div>
            <h3>Contract Info</h3>
            <p>View contract details and status</p>
          </div>
          
          <div className="contract-info">
            <div className="info-item">
              <span className="info-label">Contract Address:</span>
              <code className="info-value">{CONTRACT_ADDRESS}</code>
            </div>
            <div className="info-item">
              <span className="info-label">Creator:</span>
              <code className="info-value">
                {isLoadingCreator ? 'Loading...' : creator ? `${creator.slice(0, 6)}...${creator.slice(-4)}` : 'Not Set'}
              </code>
            </div>
            <div className="info-item">
              <span className="info-label">Contract Balance:</span>
              <span className="balance-value">
                {isLoadingBalance ? 'Loading...' : formatEther(contractBalance || 0n)} ETH
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Current User:</span>
              <code className="info-value">{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'None'}</code>
            </div>
          </div>
          
          <button onClick={handleRefreshAll} className="action-button secondary">
            🔄 Refresh All
          </button>
        </div>

        {/* 红包状态 */}
        <div className="contract-card">
          <div className="card-header">
            <div className="card-icon">📊</div>
            <h3>RedPacket Status</h3>
            <p>Current red packet information</p>
          </div>
          
          <div className="status-grid">
            <div className="status-item">
              <span className="status-label">Initialized:</span>
              <span className={`status-badge ${isInitialized ? 'success' : 'pending'}`}>
                {isLoadingInfo ? 'Loading...' : (isInitialized ? 'Yes' : 'No')}
              </span>
            </div>
            
            <div className="status-item">
              <span className="status-label">Total Amount:</span>
              <span className="status-value">{totalAmount} ETH</span>
            </div>
            
            <div className="status-item">
              <span className="status-label">Total Count:</span>
              <span className="status-value">{count}</span>
            </div>
            
            <div className="status-item">
              <span className="status-label">Remaining:</span>
              <span className="status-value">{remainingCount} / {remainingAmount} ETH</span>
            </div>
            
            <div className="status-item">
              <span className="status-label">Type:</span>
              <span className="status-value">{isEqual ? 'Equal' : 'Random'}</span>
            </div>
          </div>
        </div>

        {/* 创建红包 */}
        {!isInitialized && (
          <div className="contract-card">
            <div className="card-header">
              <div className="card-icon">🎁</div>
              <h3>Create RedPacket</h3>
              <p>Create a new red packet with ETH</p>
            </div>
            
            <div className="input-section">
              <div className="input-group">
                <label className="input-label">Amount (ETH)</label>
                <input
                  type="number"
                  value={inputAmount}
                  onChange={(e) => setInputAmount(e.target.value)}
                  placeholder="0.1"
                  className="contract-input"
                  step="0.001"
                  min="0"
                />
              </div>
              
              <div className="input-group">
                <label className="input-label">Count</label>
                <input
                  type="number"
                  value={inputCount}
                  onChange={(e) => setInputCount(e.target.value)}
                  placeholder="5"
                  className="contract-input"
                  min="1"
                />
              </div>
              
              <div className="input-group">
                <label className="input-label">Distribution Type</label>
                <select 
                  value={isEqualAmount.toString()} 
                  onChange={(e) => setIsEqualAmount(e.target.value === 'true')}
                  className="contract-input"
                >
                  <option value="true">Equal Amount</option>
                  <option value="false">Random Amount</option>
                </select>
              </div>
            </div>
            
            <button 
              onClick={handleCreateRedPacket}
              disabled={isPending || isConfirming || !inputAmount || !inputCount}
              className="action-button primary"
            >
              {isPending ? 'Confirming...' : isConfirming ? 'Processing...' : 'Create RedPacket'}
            </button>
          </div>
        )}

        {/* 抢红包 */}
        {isInitialized && !hasGrabbed && parseInt(remainingCount) > 0 && (
          <div className="contract-card grab-card">
            <div className="card-header">
              <div className="card-icon">🎯</div>
              <h3>Grab RedPacket</h3>
              <p>Claim your red packet share</p>
            </div>
            
            <div className="grab-info">
              <p>🧧 <strong>{remainingCount}</strong> packets left, <strong>{remainingAmount} ETH</strong> remaining</p>
              <p>💡 Type: <strong>{isEqual ? 'Equal Amount' : 'Random Amount'}</strong></p>
            </div>
            
            <button 
              onClick={handleGrabRedPacket}
              disabled={isPending || isConfirming}
              className="action-button grab"
            >
              {isPending ? 'Grabbing...' : isConfirming ? 'Processing...' : '🎯 Grab RedPacket'}
            </button>
          </div>
        )}

        {/* 用户状态 */}
        <div className="contract-card user-card">
          <div className="card-header">
            <div className="card-icon">👤</div>
            <h3>My Status</h3>
            <p>Your red packet participation status</p>
          </div>
          
          <div className="user-status">
            <div className="status-item">
              <span className="status-label">Status:</span>
              <span className={`status-badge ${hasGrabbed ? 'grabbed' : 'available'}`}>
                {hasGrabbed ? 'Already Grabbed' : 'Available'}
              </span>
            </div>
            
            {hasGrabbed && (
              <div className="status-item">
                <span className="status-label">Amount Received:</span>
                <span className="amount-received">{formatEther(grabbedAmount || 0n)} ETH</span>
              </div>
            )}
          </div>
        </div>

        {/* 查询功能 */}
        <div className="contract-card">
          <div className="card-header">
            <div className="card-icon">🔍</div>
            <h3>Query Functions</h3>
            <p>Check specific user information</p>
          </div>
          
          <div className="input-section">
            <div className="input-group">
              <label className="input-label">User Address</label>
              <input
                type="text"
                value={queryAddress}
                onChange={(e) => setQueryAddress(e.target.value)}
                placeholder="0x..."
                className="contract-input"
              />
            </div>
          </div>
          
          <button 
            onClick={handleQueryUser}
            disabled={!queryAddress}
            className="action-button secondary"
          >
            Query Amount
          </button>
          
          {queriedAmount !== undefined && queryAddress && (
            <div className="query-result">
              <span className="result-label">Result:</span>
              <span className="result-value">{formatEther(queriedAmount)} ETH</span>
            </div>
          )}
        </div>

        {/* 提取功能（仅创建者） */}
        {address === creator && parseFloat(remainingAmount) > 0 && (
          <div className="contract-card withdraw-card">
            <div className="card-header">
              <div className="card-icon">💰</div>
              <h3>Withdraw Funds</h3>
              <p>Creator can withdraw remaining funds</p>
            </div>
            
            <div className="withdraw-info">
              <p>⚠️ Only creator can withdraw remaining funds</p>
              <p>💰 Remaining: <strong>{remainingAmount} ETH</strong></p>
            </div>
            
            <button 
              onClick={handleWithdraw}
              disabled={isPending || isConfirming}
              className="action-button warning"
            >
              {isPending ? 'Withdrawing...' : isConfirming ? 'Processing...' : '💰 Withdraw'}
            </button>
          </div>
        )}
      </div>

      {/* 交易状态和错误信息 */}
      {hash && (
        <div className="message-card transaction">
          <div className="message-icon">📋</div>
          <div className="message-content">
            <h4>Transaction Status</h4>
            <p><strong>Hash:</strong> <code>{hash.slice(0, 10)}...{hash.slice(-8)}</code></p>
            <p><strong>Status:</strong> 
              <span className={`tx-status ${isConfirmed ? 'success' : 'pending'}`}>
                {isConfirming ? '⏳ Confirming...' : isConfirmed ? '✅ Confirmed' : '📤 Sent'}
              </span>
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="message-card error">
          <div className="message-icon">❌</div>
          <div className="message-content">
            <h4>Error</h4>
            <p>{error.message}</p>
          </div>
        </div>
      )}

      {isConfirmed && (
        <div className="message-card success">
          <div className="message-icon">✅</div>
          <div className="message-content">
            <h4>Transaction Successful!</h4>
            <p>Your transaction has been confirmed on the blockchain.</p>
            <button onClick={handleRefreshAll} className="refresh-btn">
              🔄 Refresh Data
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
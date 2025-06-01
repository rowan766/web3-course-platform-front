import './DynamicAccountsList.css'
import { useState } from 'react'
import { 
  usePublicClient, 
  useChainId, 
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt
} from 'wagmi'
import { formatEther } from 'viem'

// 红包合约地址和ABI
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`

const REDPACKET_ABI = [
  {
    "inputs": [],
    "name": "getRedPacketInfo",
    "outputs": [
      {"internalType": "uint256", "name": "_totalAmount", "type": "uint256"},
      {"internalType": "uint256", "name": "_count", "type": "uint256"},
      {"internalType": "uint256", "name": "_remainingCount", "type": "uint256"},
      {"internalType": "uint256", "name": "_remainingAmount", "type": "uint256"},
      {"internalType": "bool", "name": "_isEqual", "type": "bool"},
      {"internalType": "bool", "name": "_isInitialized", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "isGrabbed",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "getGrabbedAmount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "grabRedPacket",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

interface AccountWithRedPacket {
  address: string
  balance: string
  hasGrabbed: boolean
  grabbedAmount: string
  isLoading: boolean
}

function DynamicAccountsList() {
  const [accounts, setAccounts] = useState<AccountWithRedPacket[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentGrabbingAccount, setCurrentGrabbingAccount] = useState<string | null>(null)
  
  const publicClient = usePublicClient()
  const chainId = useChainId()
  const { isConnected, address: currentAddress } = useAccount()

  // 读取红包状态
  const { 
    data: redPacketInfo, 
    refetch: refetchRedPacketInfo 
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: REDPACKET_ABI,
    functionName: 'getRedPacketInfo',
  })

  // 写入合约
  const { 
    writeContract, 
    data: hash, 
    error: contractError, 
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
  const remainingCount = redPacketInfo ? redPacketInfo[2].toString() : '0'
  const remainingAmount = redPacketInfo ? formatEther(redPacketInfo[3]) : '0'
  const isEqual = redPacketInfo ? redPacketInfo[4] : false
  const isInitialized = redPacketInfo ? redPacketInfo[5] : false

  // 根据链ID获取对应的RPC URL
  const getRpcUrl = (chainId: number) => {
    const rpcUrls: {[key: number]: string} = {
      1: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
      5: 'https://goerli.infura.io/v3/YOUR_INFURA_KEY',
      11155111: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
      1337: 'http://127.0.0.1:7545',
      31337: 'http://127.0.0.1:8545',
      7545: 'http://127.0.0.1:7545',
    }
    return rpcUrls[chainId] || 'http://127.0.0.1:7545'
  }

  // 获取链名称
  const getChainName = (chainId: number) => {
    const chainNames: {[key: number]: string} = {
      1: 'Ethereum Mainnet',
      5: 'Goerli Testnet', 
      11155111: 'Sepolia Testnet',
      1337: 'Local Ganache',
      31337: 'Local Hardhat',
      7545: 'Ganache GUI',
    }
    return chainNames[chainId] || `Chain ID: ${chainId}`
  }

  // 获取单个账户的红包状态
  const getAccountRedPacketStatus = async (address: string) => {
    try {
      // 检查是否已抢过红包
      const hasGrabbedResponse = await fetch(getRpcUrl(chainId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [{
            to: CONTRACT_ADDRESS,
            data: `0x540b2524${address.slice(2).padStart(64, '0')}` // isGrabbed(address) 函数选择器
          }, 'latest'],
          id: 1,
        }),
      })

      const hasGrabbedData = await hasGrabbedResponse.json()
      const hasGrabbed = hasGrabbedData.result === '0x0000000000000000000000000000000000000000000000000000000000000001'

      let grabbedAmount = '0'
      if (hasGrabbed) {
        // 获取抢到的金额
        const amountResponse = await fetch(getRpcUrl(chainId), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_call',
            params: [{
              to: CONTRACT_ADDRESS,
              data: `0x61b4ab6b${address.slice(2).padStart(64, '0')}` // getGrabbedAmount(address) 函数选择器
            }, 'latest'],
            id: 1,
          }),
        })

        const amountData = await amountResponse.json()
        if (amountData.result && amountData.result !== '0x') {
          grabbedAmount = formatEther(BigInt(amountData.result))
        }
      }

      return { hasGrabbed, grabbedAmount }
    } catch (error) {
      console.error(`获取账户 ${address} 红包状态失败:`, error)
      return { hasGrabbed: false, grabbedAmount: '0' }
    }
  }

  const fetchAccountsWithRedPacketStatus = async () => {
    if (!chainId) {
      setError('未检测到链ID')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const rpcUrl = getRpcUrl(chainId)
      
      // 获取所有账户
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_accounts',
          params: [],
          id: 1,
        }),
      })

      if (!response.ok) {
        throw new Error(`RPC 请求失败: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(`RPC 错误: ${data.error.message}`)
      }

      const addresses = data.result || []
      
      if (addresses.length === 0) {
        setError('当前链没有可用的账户')
        setAccounts([])
        return
      }

      // 并行获取所有账户的余额和红包状态
      const accountPromises = addresses.map(async (address: string) => {
        try {
          // 获取余额
          let balance = '0'
          if (publicClient) {
            const balanceWei = await publicClient.getBalance({ 
              address: address as `0x${string}` 
            })
            balance = formatEther(balanceWei)
          }

          // 获取红包状态
          const { hasGrabbed, grabbedAmount } = await getAccountRedPacketStatus(address)

          return {
            address,
            balance,
            hasGrabbed,
            grabbedAmount,
            isLoading: false
          }
        } catch (error) {
          console.error(`处理账户 ${address} 失败:`, error)
          return {
            address,
            balance: '获取失败',
            hasGrabbed: false,
            grabbedAmount: '0',
            isLoading: false
          }
        }
      })

      const accountsData = await Promise.all(accountPromises)
      setAccounts(accountsData)

    } catch (error) {
      console.error('获取账户失败:', error)
      setError(`获取账户失败: ${error instanceof Error ? error.message : '未知错误'}`)
      setAccounts([])
    } finally {
      setLoading(false)
    }
  }

  // 为特定账户抢红包
  const grabRedPacketForAccount = async (accountAddress: string) => {
    if (!isInitialized) {
      alert('红包尚未初始化')
      return
    }

    if (parseInt(remainingCount) <= 0) {
      alert('红包已抢完')
      return
    }

    setCurrentGrabbingAccount(accountAddress)

    try {
      // 这里需要切换到对应账户，但由于技术限制，我们使用当前连接的账户
      // 在实际应用中，用户需要在MetaMask中手动切换账户
      if (currentAddress !== accountAddress) {
        alert(`请在MetaMask中切换到账户: ${accountAddress.slice(0, 6)}...${accountAddress.slice(-4)}`)
        setCurrentGrabbingAccount(null)
        return
      }

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: REDPACKET_ABI,
        functionName: 'grabRedPacket',
      })
    } catch (err) {
      console.error('抢红包失败:', err)
      setCurrentGrabbingAccount(null)
    }
  }

  // 交易确认后刷新数据
  if (isConfirmed && currentGrabbingAccount) {
    setTimeout(() => {
      fetchAccountsWithRedPacketStatus()
      refetchRedPacketInfo()
      setCurrentGrabbingAccount(null)
    }, 1000)
  }

  // 生成账户图标
  const getAccountIcon = (index: number) => {
    const icons = ['👤', '🧑', '👩', '🧔', '👨', '👵', '👴', '🧑‍💼', '👩‍💻', '👨‍💻']
    return icons[index % icons.length]
  }

  // 检查是否是本地链
  const isLocalChain = () => {
    return [1337, 31337, 7545].includes(chainId)
  }

  return (
    <div className="accounts-container">
      {/* 头部信息 */}
      <div className="header-section">
        <h2 className="section-title">RedPacket Accounts Dashboard</h2>
        <div className="chain-info">
          <p><strong>Current Chain:</strong> {getChainName(chainId)} (ID: {chainId})</p>
          <p><strong>Connection:</strong> {isConnected ? '✅ Connected' : '❌ Disconnected'}</p>
          {isInitialized && (
            <div className="redpacket-info">
              <p><strong>RedPacket Status:</strong> 
                <span className="status-active">🧧 Active</span>
              </p>
              <p><strong>Remaining:</strong> {remainingCount} packets / {remainingAmount} ETH</p>
              <p><strong>Type:</strong> {isEqual ? '等额红包' : '随机红包'}</p>
            </div>
          )}
          {!isLocalChain() && (
            <p className="warning">⚠️ Public networks usually don't support eth_accounts method</p>
          )}
        </div>
        
        <button 
          onClick={fetchAccountsWithRedPacketStatus}
          disabled={loading || !isConnected}
          className="fetch-button"
        >
          {loading ? 'Loading...' : 'Fetch Accounts & RedPacket Status'}
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      {/* 合约错误提示 */}
      {contractError && (
        <div className="error-message">
          ❌ Contract Error: {contractError.message}
        </div>
      )}

      {/* 账户网格 */}
      {accounts.length > 0 && (
        <div className="accounts-grid">
          {accounts.map((account, index) => (
            <div key={account.address} className={`account-card ${account.hasGrabbed ? 'grabbed' : 'available'}`}>
              <div className="account-icon">
                {getAccountIcon(index)}
              </div>
              <h3>Account {index + 1}</h3>
              <p className="account-description">
                {account.hasGrabbed ? '已抢过红包' : '可抢红包'}
              </p>
              
              <div className="account-details">
                <div className="address-section">
                  <span className="label">Address:</span>
                  <code className="address-value">
                    {`${account.address.slice(0, 6)}...${account.address.slice(-4)}`}
                  </code>
                </div>
                
                <div className="balance-section">
                  <span className="label">Balance:</span>
                  <span className="balance-value">
                    {account.balance.includes('失败') ? 
                      account.balance : 
                      `${parseFloat(account.balance).toFixed(4)} ETH`
                    }
                  </span>
                </div>

                {/* 红包状态 */}
                <div className="redpacket-section">
                  <span className="label">RedPacket:</span>
                  {account.hasGrabbed ? (
                    <div className="grabbed-info">
                      <span className="grabbed-badge">✅ Already Grabbed</span>
                      <span className="grabbed-amount">
                        {parseFloat(account.grabbedAmount).toFixed(4)} ETH
                      </span>
                    </div>
                  ) : (
                    <span className="available-badge">🎯 Available</span>
                  )}
                </div>
              </div>

              {/* 操作按钮 */}
              {!account.hasGrabbed && isInitialized && parseInt(remainingCount) > 0 ? (
                <button 
                  onClick={() => grabRedPacketForAccount(account.address)}
                  disabled={
                    isPending || 
                    isConfirming || 
                    currentGrabbingAccount === account.address ||
                    currentAddress !== account.address
                  }
                  className={`grab-button ${currentAddress === account.address ? 'current-account' : 'need-switch'}`}
                >
                  {currentGrabbingAccount === account.address ? (
                    isPending ? '抢红包中...' : isConfirming ? '确认中...' : '🎯 抢红包'
                  ) : currentAddress === account.address ? (
                    '🎯 抢红包'
                  ) : (
                    '切换账户'
                  )}
                </button>
              ) : account.hasGrabbed ? (
                <div className="grabbed-status">
                  <span className="grabbed-text">🎉 已获得红包</span>
                </div>
              ) : !isInitialized ? (
                <div className="disabled-status">
                  <span className="disabled-text">红包未初始化</span>
                </div>
              ) : (
                <div className="disabled-status">
                  <span className="disabled-text">红包已抢完</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 如果没有账户显示占位符 */}
      {accounts.length === 0 && !loading && !error && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No Accounts Found</h3>
          <p>Click "Fetch Accounts & RedPacket Status" to load accounts and their red packet status</p>
        </div>
      )}
    </div>
  )
}

export default DynamicAccountsList
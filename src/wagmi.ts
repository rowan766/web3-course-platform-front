import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { arbitrum, base, mainnet, optimism, polygon, sepolia, localhost } from 'wagmi/chains'

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID'

// 定义本地开发链
const localChain = {
  ...localhost,
  id: 1337, // Ganache 默认链ID，如果使用 Hardhat 通常是 31337
  name: 'Localhost',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:7545'] },
    public: { http: ['http://127.0.0.1:7545'] },
  },
}

// 生产环境和开发环境的链配置
const productionChains = [mainnet, polygon, optimism, arbitrum, base, sepolia]
const developmentChains = [mainnet, polygon, optimism, arbitrum, base, sepolia, localChain]

export const config = getDefaultConfig({
  appName: 'YD Token DApp',
  projectId,
  chains: import.meta.env.DEV ? developmentChains : productionChains,
  ssr: false, // Vite项目设置为false
} as any)

// 支持的链（用于应用内显示）
export const SUPPORTED_CHAINS = productionChains

// 导出当前环境的主要测试网
export const PRIMARY_TESTNET = sepolia

// 添加链信息辅助函数
export const getChainInfo = (chainId: number) => {
  const chainMap = {
    [mainnet.id]: { name: 'Ethereum', symbol: 'ETH' },
    [sepolia.id]: { name: 'Sepolia Testnet', symbol: 'SepoliaETH' },
    [polygon.id]: { name: 'Polygon', symbol: 'MATIC' },
    [optimism.id]: { name: 'Optimism', symbol: 'ETH' },
    [arbitrum.id]: { name: 'Arbitrum', symbol: 'ETH' },
    [base.id]: { name: 'Base', symbol: 'ETH' },
    [localChain.id]: { name: 'Localhost', symbol: 'ETH' },
  }
  return chainMap[chainId] || { name: 'Unknown', symbol: 'ETH' }
}

// 检查是否为测试网
export const isTestnet = (chainId: number): boolean => {
  const testnetIds = [sepolia.id, localChain.id]
  return testnetIds.includes(chainId)
}

// 获取区块浏览器URL
export const getBlockExplorerUrl = (chainId: number): string => {
  const explorerMap: Record<number, string> = {
    [mainnet.id]: 'https://etherscan.io',
    [sepolia.id]: 'https://sepolia.etherscan.io',
    [polygon.id]: 'https://polygonscan.com',
    [optimism.id]: 'https://optimistic.etherscan.io',
    [arbitrum.id]: 'https://arbiscan.io',
    [base.id]: 'https://basescan.org',
  }
  return explorerMap[chainId] || 'https://etherscan.io'
}
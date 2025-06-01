import { getDefaultConfig } from '@rainbow-me/rainbowkit'

import { arbitrum,base,mainnet, optimism,polygon,sepolia,localhost  } from 'wagmi/chains'

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

export const config = getDefaultConfig({
  appName: 'redpacket',
  projectId,
  chains: [
    mainnet,
    polygon,
    optimism,
    arbitrum,
    base,
    ...(import.meta.env.DEV ? [sepolia,localChain] : []), // 开发环境添加测试网
  ],
  ssr: false, // Vite项目设置为false
})

export const SUPPORTED_CHAINS = [mainnet, polygon, optimism, arbitrum, base, sepolia]

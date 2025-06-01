import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseUnits } from 'viem'
import './CourseAdmin.css'

// YDCoursePlatform合约ABI（管理员功能）
const COURSE_ADMIN_ABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "_title", "type": "string"},
      {"internalType": "string", "name": "_description", "type": "string"},
      {"internalType": "string", "name": "_contentHash", "type": "string"},
      {"internalType": "uint256", "name": "_price", "type": "uint256"},
      {"internalType": "address", "name": "_instructor", "type": "address"}
    ],
    "name": "createCourse",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const

const COURSE_PLATFORM_CONTRACT = import.meta.env.VITE_COURSE_PLATFORM_ADDRESS as `0x${string}`

export function CourseAdmin() {
  const { address, isConnected } = useAccount()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    contentHash: '',
    price: '',
    instructor: ''
  })
  
  // 文件上传相关状态
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadMethod, setUploadMethod] = useState<'local' | 'pinata'>('local')
  const [usePresetHash, setUsePresetHash] = useState(false)

  // 预设课程数据
  const presetHashes = [
    { name: '区块链基础课程', hash: 'QmTestHash1234567890abcdef1' },
    { name: 'DeFi开发教程', hash: 'QmTestHash2345678901bcdefg2' },
    { name: 'NFT项目实战', hash: 'QmTestHash3456789012cdefgh3' },
    { name: '智能合约安全', hash: 'QmTestHash4567890123defghi4' }
  ]

  // 检查合约owner
  const { data: contractOwner } = useReadContract({
    address: COURSE_PLATFORM_CONTRACT,
    abi: COURSE_ADMIN_ABI,
    functionName: 'owner',
  })

  // 创建课程
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

  const isOwner = isConnected && address && contractOwner && address.toLowerCase() === contractOwner.toLowerCase()

  // 本地IPFS上传
  const uploadToLocalIPFS = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const response = await fetch('http://127.0.0.1:5001/api/v0/add', {
        method: 'POST',
        body: formData
      })
      const result = await response.json()
      return result.Hash
    } catch (error) {
      throw new Error('本地IPFS连接失败，请确保IPFS节点运行中')
    }
  }

  // Pinata上传
  const uploadToPinata = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('pinataMetadata', JSON.stringify({
      name: `course-${Date.now()}`
    }))
    
    try {
      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_PINATA_JWT}`
        },
        body: formData
      })
      const result = await response.json()
      return result.IpfsHash
    } catch (error) {
      throw new Error('Pinata上传失败，请检查API密钥')
    }
  }

  // 处理文件上传
  const handleFileUpload = async () => {
    if (!uploadedFile) return
    
    setIsUploading(true)
    try {
      let hash: string
      
      if (uploadMethod === 'local') {
        hash = await uploadToLocalIPFS(uploadedFile)
      } else {
        hash = await uploadToPinata(uploadedFile)
      }
      
      setFormData({...formData, contentHash: hash})
      alert(`上传成功！哈希: ${hash}`)
    } catch (error: any) {
      alert(`上传失败: ${error.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  // 快速创建课程数据
  const quickCreateCourse = (type: string) => {
    const courseData: Record<string, any> = {
      blockchain: {
        title: '区块链开发入门',
        description: '从零开始学习区块链开发，包含Solidity基础和实战项目',
        contentHash: 'QmBlockchainCourse123456789',
        price: '1000',
        instructor: address || ''
      },
      defi: {
        title: 'DeFi协议开发实战',
        description: '学习去中心化金融协议开发，包括AMM、借贷协议等',
        contentHash: 'QmDeFiCourse234567890',
        price: '1500',
        instructor: address || ''
      },
      nft: {
        title: 'NFT项目完整开发',
        description: '从合约到前端，完整开发一个NFT项目',
        contentHash: 'QmNFTCourse345678901',
        price: '2000',
        instructor: address || ''
      }
    }
    
    setFormData(courseData[type])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isOwner) {
      alert('只有合约所有者可以创建课程')
      return
    }

    try {
      const priceInWei = parseUnits(formData.price, 18)

      writeContract({
        address: COURSE_PLATFORM_CONTRACT,
        abi: COURSE_ADMIN_ABI,
        functionName: 'createCourse',
        args: [
          formData.title,
          formData.description,
          formData.contentHash,
          priceInWei,
          formData.instructor as `0x${string}`
        ],
      })
    } catch (error) {
      console.error('创建课程失败:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  if (!isConnected) {
    return (
      <div className="course-admin">
        <div className="admin-container">
          <div className="connect-prompt">
            <h2>请先连接钱包</h2>
            <p>需要连接钱包才能访问管理功能</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isOwner) {
    return (
      <div className="course-admin">
        <div className="admin-container">
          <div className="access-denied">
            <h2>访问被拒绝</h2>
            <p>只有合约所有者可以创建课程</p>
            <div className="address-info">
              <p><strong>当前用户:</strong> {address}</p>
              <p><strong>合约所有者:</strong> {contractOwner}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="course-admin">
      <div className="admin-container">
        <h2 className="admin-title">创建新课程</h2>
        
        {/* 快速创建按钮 */}
        <div className="quick-actions">
          <h3>快速创建模板</h3>
          <div className="quick-buttons">
            <button type="button" onClick={() => quickCreateCourse('blockchain')} className="quick-btn">
              🔗 区块链课程
            </button>
            <button type="button" onClick={() => quickCreateCourse('defi')} className="quick-btn">
              💰 DeFi课程
            </button>
            <button type="button" onClick={() => quickCreateCourse('nft')} className="quick-btn">
              🎨 NFT课程
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label className="form-label">课程标题:</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder="输入课程标题"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">课程描述:</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              placeholder="输入课程描述"
              rows={4}
              className="form-textarea"
            />
          </div>

          {/* 内容上传方式选择 */}
          <div className="form-group">
            <label className="form-label">内容上传方式:</label>
            <div className="upload-method-selector">
              <label className="radio-label">
                <input 
                  type="radio" 
                  value="local" 
                  checked={uploadMethod === 'local'}
                  onChange={(e) => setUploadMethod(e.target.value as 'local')}
                />
                📁 本地IPFS (快速)
              </label>
              <label className="radio-label">
                <input 
                  type="radio" 
                  value="pinata" 
                  checked={uploadMethod === 'pinata'}
                  onChange={(e) => setUploadMethod(e.target.value as 'pinata')}
                />
                ☁️ Pinata (稳定)
              </label>
            </div>
          </div>

          {/* 文件上传 */}
          <div className="form-group">
            <label className="form-label">课程文件上传:</label>
            <div className="file-upload-container">
              <input
                type="file"
                accept=".pdf,.mp4,.zip,.txt,.doc,.docx"
                onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                className="file-input"
              />
              <button 
                type="button"
                onClick={handleFileUpload}
                disabled={!uploadedFile || isUploading}
                className="upload-btn"
              >
                {isUploading ? '上传中...' : `上传到${uploadMethod === 'local' ? '本地IPFS' : 'Pinata'}`}
              </button>
            </div>
            {uploadedFile && (
              <p className="file-info">
                选择的文件: {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* 预设哈希选择 */}
          <div className="form-group">
            <label className="form-label">
              <input 
                type="checkbox" 
                checked={usePresetHash}
                onChange={(e) => setUsePresetHash(e.target.checked)}
                className="checkbox-input"
              />
              使用预设课程内容
            </label>
            
            {usePresetHash && (
              <select 
                value={formData.contentHash}
                onChange={handleInputChange}
                name="contentHash"
                className="form-select"
              >
                <option value="">选择预设课程</option>
                {presetHashes.map((preset, index) => (
                  <option key={index} value={preset.hash}>
                    {preset.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 内容哈希输入 */}
          <div className="form-group">
            <label className="form-label">内容哈希 (IPFS或其他存储):</label>
            <input
              type="text"
              name="contentHash"
              value={formData.contentHash}
              onChange={handleInputChange}
              required
              placeholder="文件上传后自动填充，或手动输入哈希 QmXxxxxx..."
              className="form-input hash-input"
              disabled={usePresetHash}
            />
          </div>

          <div className="form-group">
            <label className="form-label">价格 (YD代币数量):</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              required
              placeholder="1000"
              min="0"
              step="0.000000000000000001"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">讲师地址:</label>
            <input
              type="text"
              name="instructor"
              value={formData.instructor}
              onChange={handleInputChange}
              required
              placeholder="0x..."
              className="form-input"
            />
            <button 
              type="button" 
              onClick={() => setFormData({...formData, instructor: address || ''})}
              className="use-current-address"
            >
              使用当前地址
            </button>
          </div>

          <button 
            type="submit" 
            disabled={isPending || isConfirming}
            className={`admin-submit-btn ${isPending || isConfirming ? 'disabled' : ''}`}
          >
            {isPending ? '确认交易...' : isConfirming ? '创建中...' : '创建课程'}
          </button>
        </form>

        {error && (
          <div className="error-message">
            创建失败: {error.message}
          </div>
        )}

        {isConfirmed && (
          <div className="success-message">
            🎉 课程创建成功！
          </div>
        )}

        {hash && (
          <div className="transaction-info">
            交易哈希: 
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
  )
}
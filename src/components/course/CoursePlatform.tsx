import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import './CoursePlatform.css'

// YDCoursePlatform合约ABI
const COURSE_PLATFORM_ABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "courseId", "type": "uint256"}],
    "name": "purchaseCourse",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllActiveCourses",
    "outputs": [
      {
        "components": [
          {"internalType": "uint256", "name": "id", "type": "uint256"},
          {"internalType": "string", "name": "title", "type": "string"},
          {"internalType": "string", "name": "description", "type": "string"},
          {"internalType": "string", "name": "contentHash", "type": "string"},
          {"internalType": "uint256", "name": "price", "type": "uint256"},
          {"internalType": "address", "name": "instructor", "type": "address"},
          {"internalType": "bool", "name": "isActive", "type": "bool"},
          {"internalType": "uint256", "name": "createdAt", "type": "uint256"},
          {"internalType": "uint256", "name": "totalSales", "type": "uint256"}
        ],
        "internalType": "struct YDCoursePlatform.Course[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "user", "type": "address"},
      {"internalType": "uint256", "name": "courseId", "type": "uint256"}
    ],
    "name": "hasUserPurchasedCourse",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "getUserCourses",
    "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPlatformStats",
    "outputs": [
      {"internalType": "uint256", "name": "totalCourses", "type": "uint256"},
      {"internalType": "uint256", "name": "activeCourses", "type": "uint256"},
      {"internalType": "uint256", "name": "totalSales", "type": "uint256"}
    ],
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
    "inputs": [
      {"internalType": "uint256", "name": "courseId", "type": "uint256"},
      {"internalType": "string", "name": "_title", "type": "string"},
      {"internalType": "string", "name": "_description", "type": "string"},
      {"internalType": "uint256", "name": "_price", "type": "uint256"}
    ],
    "name": "updateCourse",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "courseId", "type": "uint256"}],
    "name": "deactivateCourse",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "courseId", "type": "uint256"}],
    "name": "reactivateCourse",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

// YDToken合约ABI（用于授权）
const YD_TOKEN_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "spender", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "owner", "type": "address"},
      {"internalType": "address", "name": "spender", "type": "address"}
    ],
    "name": "allowance",
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
  }
] as const

// 合约地址 - 请替换为你的实际合约地址
const COURSE_PLATFORM_CONTRACT = import.meta.env.VITE_COURSE_PLATFORM_ADDRESS as `0x${string}`
const YD_TOKEN_CONTRACT = import.meta.env.VITE_YD_TOKEN_ADDRESS as `0x${string}`

// 大额授权金额 - 10万个YD代币，基本够用很久
const LARGE_APPROVAL_AMOUNT = parseUnits('100000', 18)

interface Course {
  id: bigint
  title: string
  description: string
  contentHash: string
  price: bigint
  instructor: string
  isActive: boolean
  createdAt: bigint
  totalSales: bigint
}

export function CoursePlatform() {
  const { address, isConnected } = useAccount()
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [isApproving, setIsApproving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [viewingContent, setViewingContent] = useState<Course | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    price: ''
  })

  // 读取所有活跃课程
  const { data: courses, refetch: refetchCourses } = useReadContract({
    address: COURSE_PLATFORM_CONTRACT,
    abi: COURSE_PLATFORM_ABI,
    functionName: 'getAllActiveCourses',
  })

  // 读取用户购买的课程
  const { data: userCourses, refetch: refetchUserCourses } = useReadContract({
    address: COURSE_PLATFORM_CONTRACT,
    abi: COURSE_PLATFORM_ABI,
    functionName: 'getUserCourses',
    args: address ? [address] : undefined,
  })

  // 读取平台统计
  const { data: platformStats, refetch: refetchPlatformStats } = useReadContract({
    address: COURSE_PLATFORM_CONTRACT,
    abi: COURSE_PLATFORM_ABI,
    functionName: 'getPlatformStats',
  })

  // 读取用户YD代币余额
  const { data: userYDBalance, refetch: refetchBalance } = useReadContract({
    address: YD_TOKEN_CONTRACT,
    abi: YD_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  // 检查是否为合约所有者
  const { data: contractOwner } = useReadContract({
    address: COURSE_PLATFORM_CONTRACT,
    abi: COURSE_PLATFORM_ABI,
    functionName: 'owner',
  })

  const isOwner = isConnected && address && contractOwner && 
                  address.toLowerCase() === contractOwner.toLowerCase()

  // 检查用户授权额度
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: YD_TOKEN_CONTRACT,
    abi: YD_TOKEN_ABI,
    functionName: 'allowance',
    args: address ? [address, COURSE_PLATFORM_CONTRACT] : undefined,
  })

  // 授权YD代币 - 使用大额授权
  const { 
    writeContract: approveContract, 
    data: approveHash,
    isPending: isApprovePending 
  } = useWriteContract()

  // 购买课程
  const { 
    writeContract: purchaseContract, 
    data: purchaseHash,
    error: purchaseError,
    isPending: isPurchasePending 
  } = useWriteContract()

  // 更新课程
  const { 
    writeContract: updateContract, 
    data: updateHash,
    isPending: isUpdatePending 
  } = useWriteContract()

  // 停用课程
  const { 
    writeContract: deactivateContract, 
    data: deactivateHash,
    isPending: isDeactivatePending 
  } = useWriteContract()

  // 重新激活课程
  const { 
    writeContract: reactivateContract, 
    data: reactivateHash,
    isPending: isReactivatePending 
  } = useWriteContract()

  // 等待交易确认
  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } = useWaitForTransactionReceipt({
    hash: approveHash,
  })

  const { isLoading: isPurchaseConfirming, isSuccess: isPurchaseConfirmed } = useWaitForTransactionReceipt({
    hash: purchaseHash,
  })

  const { isLoading: isUpdateConfirming, isSuccess: isUpdateConfirmed } = useWaitForTransactionReceipt({
    hash: updateHash,
  })

  const { isSuccess: isDeactivateConfirmed } = useWaitForTransactionReceipt({
    hash: deactivateHash,
  })

  const { isSuccess: isReactivateConfirmed } = useWaitForTransactionReceipt({
    hash: reactivateHash,
  })

  // 检查用户是否已购买某个课程
  const checkUserOwnsCourse = (courseId: bigint) => {
    if (!userCourses) return false
    return userCourses.some((id: bigint) => id === courseId)
  }

  // 刷新所有数据
  const refreshAllData = async () => {
    await Promise.all([
      refetchCourses(),
      refetchUserCourses(), 
      refetchPlatformStats(),
      refetchBalance(),
      refetchAllowance()
    ])
  }

  // 授权YD代币 - 使用大额授权，一次性授权10万个YD
  const handleApprove = async (course: Course) => {
    if (!isConnected) return
    
    try {
      setIsApproving(true)
      setSelectedCourse(course)
      
      // 使用大额授权，10万个YD代币，足够买很多课程
      approveContract({
        address: YD_TOKEN_CONTRACT,
        abi: YD_TOKEN_ABI,
        functionName: 'approve',
        args: [COURSE_PLATFORM_CONTRACT, LARGE_APPROVAL_AMOUNT],
      })
    } catch (error) {
      console.error('Approve failed:', error)
      setIsApproving(false)
    }
  }

  // 购买课程
  const handlePurchase = async (course: Course) => {
    if (!isConnected) return
    
    // 检查授权额度
    if (!allowance || allowance < course.price) {
      await handleApprove(course)
      return
    }

    try {
      setSelectedCourse(course)
      purchaseContract({
        address: COURSE_PLATFORM_CONTRACT,
        abi: COURSE_PLATFORM_ABI,
        functionName: 'purchaseCourse',
        args: [course.id],
      })
    } catch (error) {
      console.error('Purchase failed:', error)
    }
  }

  // 开始编辑课程
  const handleEditCourse = (course: Course) => {
    setEditingCourse(course)
    setEditFormData({
      title: course.title,
      description: course.description,
      price: formatUnits(course.price, 18)
    })
    setIsEditMode(true)
  }

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editingCourse || !isOwner) return

    try {
      const priceInWei = parseUnits(editFormData.price, 18)
      updateContract({
        address: COURSE_PLATFORM_CONTRACT,
        abi: COURSE_PLATFORM_ABI,
        functionName: 'updateCourse',
        args: [
          editingCourse.id,
          editFormData.title,
          editFormData.description,
          priceInWei
        ],
      })
    } catch (error) {
      console.error('Update failed:', error)
    }
  }

  // 取消编辑
  const handleCancelEdit = () => {
    setIsEditMode(false)
    setEditingCourse(null)
    setEditFormData({ title: '', description: '', price: '' })
  }

  // 停用课程
  const handleDeactivateCourse = async (courseId: bigint) => {
    if (!isOwner) return
    
    try {
      deactivateContract({
        address: COURSE_PLATFORM_CONTRACT,
        abi: COURSE_PLATFORM_ABI,
        functionName: 'deactivateCourse',
        args: [courseId],
      })
    } catch (error) {
      console.error('Deactivate failed:', error)
    }
  }

  // 重新激活课程
  const handleReactivateCourse = async (courseId: bigint) => {
    if (!isOwner) return
    
    try {
      reactivateContract({
        address: COURSE_PLATFORM_CONTRACT,
        abi: COURSE_PLATFORM_ABI,
        functionName: 'reactivateCourse',
        args: [courseId],
      })
    } catch (error) {
      console.error('Reactivate failed:', error)
    }
  }

  // 查看课程内容
  const handleViewContent = async (course: Course) => {
    try {
      // 这里实现内容查看逻辑
      // 如果是 IPFS 哈希，可以通过 IPFS 网关访问
      if (course.contentHash) {
        const ipfsUrl = `https://ipfs.io/ipfs/${course.contentHash}`
        
        // 检测文件类型
        const isVideo = course.description.toLowerCase().includes('video') || 
                       course.description.toLowerCase().includes('视频') ||
                       course.title.toLowerCase().includes('video')
        
        const isPDF = course.description.toLowerCase().includes('pdf') || 
                     course.title.toLowerCase().includes('pdf')
        
        if (isPDF) {
          // PDF 在新窗口打开
          window.open(ipfsUrl, '_blank')
        } else if (isVideo) {
          // 视频使用模态框显示
          setViewingContent(course)
        } else {
          // 其他文件类型也在模态框中显示
          setViewingContent(course)
        }
      } else {
        alert('课程内容暂时无法访问')
      }
    } catch (error) {
      console.error('Failed to view content:', error)
      alert('内容加载失败')
    }
  }

  // 获取文件类型
  const getFileType = (course: Course) => {
    const desc = course.description.toLowerCase()
    const title = course.title.toLowerCase()
    
    if (desc.includes('video') || desc.includes('视频') || title.includes('video')) return 'video'
    if (desc.includes('audio') || desc.includes('音频') || title.includes('audio')) return 'audio'
    if (desc.includes('pdf') || title.includes('pdf')) return 'pdf'
    return 'document'
  }

  // 格式化价格显示
  const formatPrice = (price: bigint) => {
    return Number(formatUnits(price, 18)).toLocaleString()
  }

  // 格式化时间
  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString()
  }

  // 格式化授权额度显示
  const formatAllowance = () => {
    if (!allowance) return '0'
    return Number(formatUnits(allowance, 18)).toLocaleString()
  }

  // 获取按钮状态和文本
  const getButtonState = (course: Course) => {
    if (!isConnected) return { text: '连接钱包', disabled: false, onClick: () => {} }
    
    if (checkUserOwnsCourse(course.id)) {
      return { 
        text: '查看内容', 
        disabled: false, 
        onClick: () => handleViewContent(course),
        className: 'owned'
      }
    }

    if (!userYDBalance || userYDBalance < course.price) {
      return { text: 'YD余额不足', disabled: true, onClick: () => {} }
    }

    // 检查授权额度是否足够
    if (!allowance || allowance < course.price) {
      return { 
        text: isApproving || isApprovePending || isApproveConfirming ? '授权中...' : '一键授权', 
        disabled: isApproving || isApprovePending || isApproveConfirming,
        onClick: () => handleApprove(course)
      }
    }

    return { 
      text: isPurchasePending || isPurchaseConfirming ? '购买中...' : `购买 ${formatPrice(course.price)} YD`, 
      disabled: isPurchasePending || isPurchaseConfirming,
      onClick: () => handlePurchase(course)
    }
  }

  // 处理授权成功
  useEffect(() => {
    if (isApproveConfirmed && selectedCourse) {
      setIsApproving(false)
      setSuccessMessage('🎉 授权成功！现在可以购买课程了')
      
      // 刷新授权数据
      refetchAllowance()
      
      // 授权成功后自动进行购买
      setTimeout(() => {
        handlePurchase(selectedCourse)
      }, 2000)

      // 3秒后清除成功消息
      setTimeout(() => {
        setSuccessMessage('')
      }, 5000)
    }
  }, [isApproveConfirmed, selectedCourse])

  // 处理购买成功
  useEffect(() => {
    if (isPurchaseConfirmed) {
      setSuccessMessage('🎉 课程购买成功！')
      setSelectedCourse(null)
      
      // 购买成功后刷新所有数据
      setTimeout(() => {
        refreshAllData()
      }, 2000)

      // 3秒后清除成功消息
      setTimeout(() => {
        setSuccessMessage('')
      }, 3000)
    }
  }, [isPurchaseConfirmed])

  // 处理更新成功
  useEffect(() => {
    if (isUpdateConfirmed) {
      setSuccessMessage('✅ 课程更新成功！')
      setIsEditMode(false)
      setEditingCourse(null)
      
      // 更新成功后刷新所有数据
      setTimeout(() => {
        refreshAllData()
      }, 2000)

      // 3秒后清除成功消息
      setTimeout(() => {
        setSuccessMessage('')
      }, 3000)
    }
  }, [isUpdateConfirmed])

  // 处理停用/激活成功
  useEffect(() => {
    if (isDeactivateConfirmed || isReactivateConfirmed) {
      setSuccessMessage(isDeactivateConfirmed ? '⛔ 课程已停用！' : '✅ 课程已重新激活！')
      
      // 操作成功后刷新所有数据
      setTimeout(() => {
        refreshAllData()
      }, 2000)

      // 3秒后清除成功消息
      setTimeout(() => {
        setSuccessMessage('')
      }, 3000)
    }
  }, [isDeactivateConfirmed, isReactivateConfirmed])

  if (!isConnected) {
    return (
      <div className="course-platform">
        <div className="connect-prompt">
          <h2>YD 课程平台</h2>
          <p>连接钱包查看和购买课程</p>
        </div>
      </div>
    )
  }

  return (
    <div className="course-platform">
      {/* 平台统计 */}
      {platformStats && (
        <div className="platform-stats">
          <div className="stat-card">
            <h3>📚 总课程数</h3>
            <p>{Number(platformStats[0])}</p>
          </div>
          <div className="stat-card">
            <h3>✅ 活跃课程</h3>
            <p>{Number(platformStats[1])}</p>
          </div>
          <div className="stat-card">
            <h3>💰 总销售量</h3>
            <p>{Number(platformStats[2])}</p>
          </div>
          <div className="stat-card">
            <h3>🪙 我的YD余额</h3>
            <p>{userYDBalance ? formatPrice(userYDBalance) : '0'}</p>
          </div>
          <div className="stat-card">
            <h3>🔑 授权额度</h3>
            <p>{formatAllowance()} YD</p>
          </div>
        </div>
      )}

      {/* 课程标题 */}
      <div className="section-header">
        <h2>可购买课程</h2>
        <p>使用 YD 代币购买优质课程内容</p>
          {allowance && allowance > 0n ? (
            <p className="approval-info">
              💡 你已授权 {formatAllowance()} YD，可以直接购买课程
            </p>
          ) : null}
      </div>

      {/* 课程列表 */}
      <div className="courses-grid">
        {courses && courses.length > 0 ? (
          [...courses].reverse().map((course: Course) => {
            const isOwned = checkUserOwnsCourse(course.id)
            return (
              <div key={Number(course.id)} className="course-card">
                {/* 管理员操作按钮 */}
                {isOwner && (
                  <div className="admin-actions">
                    <button 
                      className="edit-btn"
                      onClick={() => handleEditCourse(course)}
                      disabled={isEditMode}
                    >
                      ✏️
                    </button>
                    <button 
                      className="toggle-status-btn"
                      onClick={() => course.isActive ? 
                        handleDeactivateCourse(course.id) : 
                        handleReactivateCourse(course.id)}
                      disabled={isDeactivatePending || isReactivatePending}
                    >
                      {course.isActive ? '⛔' : '✅'}
                    </button>
                  </div>
                )}

                <div className="course-header">
                  {isEditMode && editingCourse?.id === course.id ? (
                    <input
                      className="edit-title-input"
                      value={editFormData.title}
                      onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                      placeholder="课程标题"
                    />
                  ) : (
                    <h3>{course.title}</h3>
                  )}
                  
                  <div className="course-price">
                    {isEditMode && editingCourse?.id === course.id ? (
                      <input
                        className="edit-price-input"
                        value={editFormData.price}
                        onChange={(e) => setEditFormData({...editFormData, price: e.target.value})}
                        placeholder="价格"
                        type="number"
                        min="0"
                        step="0.000000000000000001"
                      />
                    ) : (
                      `${formatPrice(course.price)} YD`
                    )}
                  </div>
                </div>
                
                <div className="course-content">
                  {isEditMode && editingCourse?.id === course.id ? (
                    <textarea
                      className="edit-description-textarea"
                      value={editFormData.description}
                      onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                      placeholder="课程描述"
                      rows={3}
                    />
                  ) : (
                    <p className="course-description">{course.description}</p>
                  )}
                  
                  <div className="course-meta">
                    <div className="meta-item">
                      <span className="meta-label">讲师:</span>
                      <span className="meta-value">
                        {course.instructor.slice(0, 6)}...{course.instructor.slice(-4)}
                      </span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">创建时间:</span>
                      <span className="meta-value">{formatDate(course.createdAt)}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">销售量:</span>
                      <span className="meta-value">{Number(course.totalSales)}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">状态:</span>
                      <span className={`meta-value ${course.isActive ? 'active' : 'inactive'}`}>
                        {course.isActive ? '✅ 活跃' : '⛔ 已停用'}
                      </span>
                    </div>
                    {course.contentHash && (
                      <div className="meta-item">
                        <span className="meta-label">内容类型:</span>
                        <span className="meta-value">
                          {course.description.toLowerCase().includes('pdf') ? 'PDF文档' : 
                           course.description.toLowerCase().includes('video') ? '视频课程' : '数字内容'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="course-footer">
                  {isEditMode && editingCourse?.id === course.id ? (
                    <div className="edit-actions">
                      <button 
                        className="save-edit-btn"
                        onClick={handleSaveEdit}
                        disabled={isUpdatePending || isUpdateConfirming}
                      >
                        {isUpdatePending || isUpdateConfirming ? '保存中...' : '💾 保存'}
                      </button>
                      <button 
                        className="cancel-edit-btn"
                        onClick={handleCancelEdit}
                      >
                        ❌ 取消
                      </button>
                    </div>
                  ) : (
                    (() => {
                      const buttonState = getButtonState(course)
                      return (
                        <button 
                          className={`course-button ${buttonState.className || ''}`}
                          onClick={buttonState.onClick}
                          disabled={buttonState.disabled || !course.isActive}
                        >
                          {!course.isActive ? '课程已停用' : buttonState.text}
                        </button>
                      )
                    })()
                  )}
                </div>

                {isOwned && (
                  <div className="owned-badge">
                    ✅ 已拥有
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div className="no-courses">
            <h3>暂无可购买课程</h3>
            <p>敬请期待更多精彩内容</p>
          </div>
        )}
      </div>

      {/* 内容查看器 */}
      {viewingContent && (
        <div className="content-viewer-overlay" onClick={() => setViewingContent(null)}>
          <div className="content-viewer" onClick={(e) => e.stopPropagation()}>
            <div className="content-header">
              <h3>{viewingContent.title}</h3>
              <button onClick={() => setViewingContent(null)}>✕</button>
            </div>
            <div className="content-body">
              {viewingContent.contentHash ? (
                getFileType(viewingContent) === 'video' ? (
                  <video 
                    controls 
                    width="100%" 
                    height="100%"
                    controlsList="nodownload"
                    style={{ backgroundColor: '#000' }}
                  >
                    <source src={`https://ipfs.io/ipfs/${viewingContent.contentHash}`} type="video/mp4" />
                    <source src={`https://ipfs.io/ipfs/${viewingContent.contentHash}`} type="video/webm" />
                    <source src={`https://ipfs.io/ipfs/${viewingContent.contentHash}`} type="video/ogg" />
                    您的浏览器不支持视频播放
                  </video>
                ) : getFileType(viewingContent) === 'audio' ? (
                  <div className="audio-container">
                    <audio 
                      controls 
                      style={{ width: '100%', marginBottom: '2rem' }}
                    >
                      <source src={`https://ipfs.io/ipfs/${viewingContent.contentHash}`} type="audio/mpeg" />
                      <source src={`https://ipfs.io/ipfs/${viewingContent.contentHash}`} type="audio/ogg" />
                      <source src={`https://ipfs.io/ipfs/${viewingContent.contentHash}`} type="audio/wav" />
                      您的浏览器不支持音频播放
                    </audio>
                    <div className="audio-info">
                      <h4>🎵 {viewingContent.title}</h4>
                      <p>{viewingContent.description}</p>
                    </div>
                  </div>
                ) : (
                  <iframe 
                    src={`https://ipfs.io/ipfs/${viewingContent.contentHash}`}
                    width="100%" 
                    height="500px"
                    title={viewingContent.title}
                    allow="fullscreen; accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen={true}
                    style={{ border: 'none' }}
                  />
                )
              ) : (
                <p>内容加载中...</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 交易状态提示 */}
      {purchaseError && (
        <div className="error-message">
          购买失败: {purchaseError.message}
        </div>
      )}

      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}
    </div>
  )
}
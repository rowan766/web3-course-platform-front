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
const COURSE_PLATFORM_CONTRACT = import.meta.env.VITE_COURSE_PLATFORM_ADDRESS as `0x${string}` // 替换为你的课程平台合约地址
const YD_TOKEN_CONTRACT = import.meta.env.VITE_YD_TOKEN_ADDRESS as `0x${string}` // 替换为你的YD代币合约地址

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

  // 读取所有活跃课程
  const { data: courses, refetch: refetchCourses } = useReadContract({
    address: COURSE_PLATFORM_CONTRACT,
    abi: COURSE_PLATFORM_ABI,
    functionName: 'getAllActiveCourses',
  })

  // 读取用户购买的课程
  const { data: userCourses } = useReadContract({
    address: COURSE_PLATFORM_CONTRACT,
    abi: COURSE_PLATFORM_ABI,
    functionName: 'getUserCourses',
    args: address ? [address] : undefined,
  })

  // 读取平台统计
  const { data: platformStats } = useReadContract({
    address: COURSE_PLATFORM_CONTRACT,
    abi: COURSE_PLATFORM_ABI,
    functionName: 'getPlatformStats',
  })

  // 读取用户YD代币余额
  const { data: userYDBalance } = useReadContract({
    address: YD_TOKEN_CONTRACT,
    abi: YD_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  // 授权YD代币
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

  // 等待交易确认
  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } = useWaitForTransactionReceipt({
    hash: approveHash,
  })

  const { isLoading: isPurchaseConfirming, isSuccess: isPurchaseConfirmed } = useWaitForTransactionReceipt({
    hash: purchaseHash,
  })

  // 检查用户是否已购买某个课程
  const checkUserOwnsCourse = (courseId: bigint) => {
    if (!userCourses) return false
    return userCourses.some((id: bigint) => id === courseId)
  }

  // 检查用户授权额度
  const { data: allowance } = useReadContract({
    address: YD_TOKEN_CONTRACT,
    abi: YD_TOKEN_ABI,
    functionName: 'allowance',
    args: address && selectedCourse ? [address, COURSE_PLATFORM_CONTRACT] : undefined,
  })

  // 授权YD代币
  const handleApprove = async (course: Course) => {
    if (!isConnected) return
    
    try {
      setIsApproving(true)
      approveContract({
        address: YD_TOKEN_CONTRACT,
        abi: YD_TOKEN_ABI,
        functionName: 'approve',
        args: [COURSE_PLATFORM_CONTRACT, course.price],
      })
    } catch (error) {
      console.error('Approve failed:', error)
    } finally {
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

  // 格式化价格显示
  const formatPrice = (price: bigint) => {
    return Number(formatUnits(price, 18)).toLocaleString()
  }

  // 格式化时间
  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString()
  }

  // 获取按钮状态和文本
  const getButtonState = (course: Course) => {
    if (!isConnected) return { text: '连接钱包', disabled: false, onClick: () => {} }
    
    if (checkUserOwnsCourse(course.id)) {
      return { text: '已购买', disabled: true, onClick: () => {} }
    }

    if (!userYDBalance || userYDBalance < course.price) {
      return { text: 'YD余额不足', disabled: true, onClick: () => {} }
    }

    if (!allowance || allowance < course.price) {
      return { 
        text: isApproving || isApprovePending || isApproveConfirming ? '授权中...' : '授权购买', 
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

  // 重新获取数据
  useEffect(() => {
    if (isPurchaseConfirmed) {
      refetchCourses()
    }
  }, [isPurchaseConfirmed, refetchCourses])

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
        </div>
      )}

      {/* 课程标题 */}
      <div className="section-header">
        <h2>可购买课程</h2>
        <p>使用 YD 代币购买优质课程内容</p>
      </div>

      {/* 课程列表 */}
      <div className="courses-grid">
        {courses && courses.length > 0 ? (
          courses.map((course: Course) => (
            <div key={Number(course.id)} className="course-card">
              <div className="course-header">
                <h3>{course.title}</h3>
                <div className="course-price">
                  {formatPrice(course.price)} YD
                </div>
              </div>
              
              <div className="course-content">
                <p className="course-description">{course.description}</p>
                
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
                </div>
              </div>

              <div className="course-footer">
                {(() => {
                  const buttonState = getButtonState(course)
                  return (
                    <button 
                      className={`course-button ${checkUserOwnsCourse(course.id) ? 'owned' : ''}`}
                      onClick={buttonState.onClick}
                      disabled={buttonState.disabled}
                    >
                      {buttonState.text}
                    </button>
                  )
                })()}
              </div>

              {checkUserOwnsCourse(course.id) && (
                <div className="owned-badge">
                  ✅ 已拥有
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="no-courses">
            <h3>暂无可购买课程</h3>
            <p>敬请期待更多精彩内容</p>
          </div>
        )}
      </div>

      {/* 我的课程 */}
      {userCourses && userCourses.length > 0 && (
        <div className="my-courses-section">
          <h3>我的课程</h3>
          <div className="my-courses-list">
            {userCourses.map((courseId: bigint) => {
              const course = courses?.find((c: Course) => c.id === courseId)
              return course ? (
                <div key={Number(courseId)} className="my-course-item">
                  <h4>{course.title}</h4>
                  <p>购买价格: {formatPrice(course.price)} YD</p>
                  <button className="access-button">
                    进入学习
                  </button>
                </div>
              ) : null
            })}
          </div>
        </div>
      )}

      {/* 交易状态提示 */}
      {purchaseError && (
        <div className="error-message">
          购买失败: {purchaseError.message}
        </div>
      )}

      {isPurchaseConfirmed && (
        <div className="success-message">
          🎉 课程购买成功！
        </div>
      )}
    </div>
  )
}
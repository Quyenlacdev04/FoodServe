import { API_BASE_URL } from '../config/api.js'
import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { FiTrendingUp, FiGift, FiAward, FiInfo, FiCheckCircle } from 'react-icons/fi'
import toast from 'react-hot-toast'
import Confetti from 'react-confetti'
import { useWindowSize } from 'react-use'
import { formatPrice } from '../data/mockData'
import { getUserRank, getNextRankInfo } from '../utils/rankUtils'
import { updateCoins } from '../store/slices/authSlice'

const RANK_SALARY = {
  'Đồng': 0,
  'Bạc': 50,
  'Vàng': 200,
  'Kim Cương': 500,
  'Chiến Thần Mua Hàng': 1000
}

export default function LeaderboardPage() {
  const { user, isAuthenticated } = useSelector(s => s.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { width, height } = useWindowSize()
  
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showConfetti, setShowConfetti] = useState(false)
  const [quests, setQuests] = useState([
    { id: 1, name: 'Đăng nhập hôm nay', reward: 10, done: true },
    { id: 2, name: 'Đặt 1 đơn hàng mới', reward: 50, done: false },
    { id: 3, name: 'Chơi 1 lượt Vòng quay', reward: 20, done: false }
  ])

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/auth/leaderboard`)
      .then(res => res.json())
      .then(data => {
        setLeaders(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  const handleClaimSalary = () => {
    if (!isAuthenticated) return navigate('/')
    
    const rank = getUserRank(user?.totalSpent)
    const salary = RANK_SALARY[rank.name] || 0
    
    if (salary === 0) {
      toast.error('Hạng Đồng chưa có đặc quyền nhận lương. Hãy chi tiêu thêm để lên Hạng Bạc nhé!')
      return
    }

    const lastClaim = localStorage.getItem(`daily_salary_${user?._id || user?.id}`)
    const today = new Date().toDateString()
    
    if (lastClaim === today) {
      toast.error(`Bạn đã nhận lương ${salary} Xu hôm nay rồi. Mai quay lại nhé!`)
      return
    }

    dispatch(updateCoins({ userId: user._id || user.id, coins: salary }))
    localStorage.setItem(`daily_salary_${user._id || user.id}`, today)
    
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 5000)
    
    toast.success(`Ting ting! Bạn vừa nhận được Lương Đặc Quyền: ${salary} Xu 💰`, { 
      icon: '🎉',
      duration: 4000
    })
  }

  const myRank = getUserRank(user?.totalSpent)
  const mySalary = RANK_SALARY[myRank?.name] || 0
  const nextRank = getNextRankInfo(user?.totalSpent)

  const top3 = leaders.slice(0, 3)
  const others = leaders.slice(3, 10)

  // Hàm sinh avatar cho user
  const getAvatar = (leader) => {
    // Ưu tiên dùng ảnh từ Redux nếu người dùng đang xem chính mình trên bảng xếp hạng
    if (user && (user._id === leader._id || user.id === leader._id) && user.avatar) {
      return user.avatar;
    }
    if (leader?.avatar) return leader.avatar;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(leader?.name || 'User')}&background=random&color=fff&size=128&bold=true`
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-300 pt-24 pb-12 px-4 relative">
      {showConfetti && <Confetti width={width} height={height} numberOfPieces={300} recycle={false} />}
      
      <div className="max-w-5xl mx-auto">
        <Link to="/" className="text-primary-500 hover:underline text-sm mb-6 inline-block font-medium">← Về trang chủ</Link>
        
        {/* Banner Đặc Quyền & Tiến Trình */}
        <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl p-6 sm:p-10 text-white shadow-xl mb-8 flex flex-col lg:flex-row justify-between gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          
          <div className="flex-1 relative z-10">
            <h1 className="text-3xl font-display font-bold flex items-center gap-2 mb-2">
              <FiTrendingUp /> Bảng Phong Thần
            </h1>
            <p className="text-primary-100 max-w-lg mb-6">
              Tôn vinh những Đại Gia đã đóng góp nhiều nhất cho FoodServe. Hạng càng cao, bổng lộc mỗi ngày càng khủng!
            </p>
            
            {isAuthenticated && nextRank && (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <p className="text-sm text-primary-100 mb-1">Tiến trình thăng hạng</p>
                    <p className="font-bold">Đại gia ơi, chỉ cần chi thêm <span className="text-yellow-400">{formatPrice(nextRank.remainingAmount)}</span> nữa!</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-primary-100">Hạng tiếp theo</span>
                    <p className="font-bold text-yellow-400">{nextRank.nextRankName}</p>
                  </div>
                </div>
                <div className="h-3 w-full bg-black/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-full transition-all duration-1000"
                    style={{ width: `${nextRank.progressPercent}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center shrink-0 w-full lg:w-72 border border-white/20 relative z-10 flex flex-col justify-between">
            <div>
              <p className="text-sm font-semibold mb-3 text-primary-100">Đặc Quyền Của Bạn</p>
              <div className="flex flex-col items-center justify-center gap-2 mb-6">
                <span className="text-5xl drop-shadow-lg mb-1">{myRank.icon}</span>
                <span className={`px-4 py-1.5 rounded-full text-sm font-bold bg-white text-gray-900 shadow-md`}>
                  Hạng {myRank.name}
                </span>
              </div>
            </div>
            <button 
              onClick={handleClaimSalary}
              className="w-full py-3 px-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-950 font-bold rounded-xl hover:from-yellow-300 hover:to-yellow-400 transition-all shadow-[0_4px_15px_rgba(250,204,21,0.5)] transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
            >
              <FiGift /> Nhận Lương ({mySalary} Xu)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cột trái: Nhiệm vụ */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-dark-200 rounded-3xl shadow-card p-6 border border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold dark:text-white flex items-center gap-2 mb-4">
                <FiAward className="text-primary-500" /> Nhiệm vụ hôm nay
              </h2>
              <div className="space-y-3">
                {quests.map(q => (
                  <div key={q.id} className={`flex items-center justify-between p-3 rounded-xl border ${q.done ? 'bg-green-50 border-green-100 dark:bg-green-500/10 dark:border-green-500/20' : 'bg-gray-50 border-gray-100 dark:bg-dark-300 dark:border-gray-700'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${q.done ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}`}>
                        {q.done && <FiCheckCircle size={14} />}
                      </div>
                      <span className={`text-sm font-medium ${q.done ? 'text-green-700 dark:text-green-400 line-through opacity-70' : 'text-gray-700 dark:text-gray-300'}`}>{q.name}</span>
                    </div>
                    <span className="text-xs font-bold text-yellow-600 dark:text-yellow-500 bg-yellow-100 dark:bg-yellow-500/20 px-2 py-1 rounded-lg">+{q.reward} Xu</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-center text-gray-400 mt-4 italic">Hoàn thành nhiệm vụ để tích lũy Xu và thăng hạng nhanh hơn!</p>
            </div>
          </div>

          {/* Cột phải: Leaderboard */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-dark-200 rounded-3xl shadow-card overflow-hidden border border-gray-100 dark:border-gray-800">
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 text-center bg-gray-50 dark:bg-dark-300">
                <h2 className="text-2xl font-bold dark:text-white flex justify-center items-center gap-2">
                  🏆 Top 10 Đại Gia
                </h2>
              </div>
              
              {loading ? (
                <div className="p-12 text-center text-gray-500 animate-pulse">Đang trải thảm đỏ đón các Đại Gia...</div>
              ) : leaders.length === 0 ? (
                <div className="p-12 text-center text-gray-500">Chưa có đại gia nào xuất hiện!</div>
              ) : (
                <div className="p-6">
                  {/* Bục vinh quang Top 3 */}
                  <div className="flex justify-center items-end gap-2 sm:gap-6 mb-12 mt-8">
                    {/* Top 2 */}
                    {top3[1] && (
                      <div className="flex flex-col items-center w-28 sm:w-32">
                        <div className="relative mb-3">
                          <img src={getAvatar(top3[1])} alt={top3[1].name} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-gray-300 shadow-lg object-cover" />
                          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center text-white font-bold border-2 border-white dark:border-dark-200 shadow-sm">2</div>
                        </div>
                        <p className="font-bold text-gray-800 dark:text-white text-center text-sm truncate w-full px-1">{top3[1].name}</p>
                        <p className="text-xs font-bold text-primary-500 mt-1">{formatPrice(top3[1].totalSpent)}</p>
                        <div className="w-full h-24 bg-gradient-to-t from-gray-200 to-gray-50 dark:from-gray-800 dark:to-dark-200 rounded-t-xl mt-3 border-t-4 border-gray-300"></div>
                      </div>
                    )}
                    
                    {/* Top 1 */}
                    {top3[0] && (
                      <div className="flex flex-col items-center w-32 sm:w-40 z-10">
                        <div className="relative mb-3">
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-4xl drop-shadow-md animate-bounce">👑</div>
                          <img src={getAvatar(top3[0])} alt={top3[0].name} className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-yellow-400 shadow-xl object-cover ring-4 ring-yellow-400/30" />
                          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-white dark:border-dark-200 shadow-md">1</div>
                        </div>
                        <p className="font-bold text-gray-900 dark:text-white text-center text-base truncate w-full px-1">{top3[0].name}</p>
                        <p className="text-sm font-bold text-primary-600 dark:text-primary-400 mt-1">{formatPrice(top3[0].totalSpent)}</p>
                        <div className="w-full h-32 bg-gradient-to-t from-yellow-100 to-yellow-50 dark:from-yellow-900/30 dark:to-dark-200 rounded-t-xl mt-3 border-t-4 border-yellow-400 shadow-[0_-5px_15px_rgba(250,204,21,0.2)]"></div>
                      </div>
                    )}

                    {/* Top 3 */}
                    {top3[2] && (
                      <div className="flex flex-col items-center w-28 sm:w-32">
                        <div className="relative mb-3">
                          <img src={getAvatar(top3[2])} alt={top3[2].name} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-orange-400 shadow-lg object-cover" />
                          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold border-2 border-white dark:border-dark-200 shadow-sm">3</div>
                        </div>
                        <p className="font-bold text-gray-800 dark:text-white text-center text-sm truncate w-full px-1">{top3[2].name}</p>
                        <p className="text-xs font-bold text-primary-500 mt-1">{formatPrice(top3[2].totalSpent)}</p>
                        <div className="w-full h-16 bg-gradient-to-t from-orange-100 to-orange-50 dark:from-orange-900/20 dark:to-dark-200 rounded-t-xl mt-3 border-t-4 border-orange-400"></div>
                      </div>
                    )}
                  </div>

                  {/* Danh sách Top 4-10 */}
                  <div className="space-y-3">
                    {others.map((leader, index) => {
                      const rankInfo = getUserRank(leader.totalSpent);
                      const realIndex = index + 4;
                      return (
                        <div key={leader._id} className={`flex items-center gap-4 p-4 rounded-2xl transition-all hover:scale-[1.01] hover:shadow-md ${user?._id === leader._id ? 'bg-primary-50 dark:bg-primary-500/10 border border-primary-200 dark:border-primary-500/30' : 'bg-gray-50 dark:bg-dark-300 border border-transparent'}`}>
                          <div className="w-8 text-center font-bold text-gray-400 shrink-0">#{realIndex}</div>
                          <img src={getAvatar(leader)} alt={leader.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 dark:text-white truncate flex items-center gap-2">
                              {leader.name} {user?._id === leader._id && <span className="text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full">Bạn</span>}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${rankInfo.bg} ${rankInfo.color} shrink-0`}>
                                {rankInfo.icon} {rankInfo.name}
                              </span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold text-gray-900 dark:text-white">{formatPrice(leader.totalSpent)}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

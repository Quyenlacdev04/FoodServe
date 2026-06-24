import { API_BASE_URL } from '../config/api.js'
import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { FiTrendingUp, FiGift, FiAward, FiInfo } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { formatPrice } from '../data/mockData'
import { getUserRank } from '../utils/rankUtils'
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
  
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)

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
    toast.success(`Ting ting! Bạn vừa nhận được Lương Đặc Quyền: ${salary} Xu 💰`, { icon: '🤑' })
  }

  const myRank = getUserRank(user?.totalSpent)
  const mySalary = RANK_SALARY[myRank?.name] || 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-300 pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="text-primary-500 hover:underline text-sm mb-6 inline-block">← Về trang chủ</Link>
        
        {/* Banner */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-500 rounded-3xl p-6 sm:p-10 text-white shadow-lg mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-3xl font-display font-bold flex items-center gap-2 mb-2">
              <FiTrendingUp /> Bảng Phong Thần
            </h1>
            <p className="text-white/90 max-w-lg">
              Tôn vinh những Đại Gia đã đóng góp nhiều nhất cho FoodServe. Hạng càng cao, bổng lộc mỗi ngày càng khủng!
            </p>
          </div>
          
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-center shrink-0 w-full md:w-auto border border-white/30">
            <p className="text-sm font-semibold mb-2">Đặc Quyền Của Bạn</p>
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-2xl">{myRank.icon}</span>
              <span className={`px-3 py-1 rounded-full text-sm font-bold bg-white text-gray-900 shadow-sm`}>
                {myRank.name}
              </span>
            </div>
            <button 
              onClick={handleClaimSalary}
              className="w-full py-2 px-4 bg-yellow-400 text-yellow-900 font-bold rounded-xl hover:bg-yellow-300 transition-colors shadow-[0_4px_10px_rgba(250,204,21,0.4)]"
            >
              Nhận Lương ({mySalary} Xu)
            </button>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-white dark:bg-dark-200 rounded-3xl shadow-card overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
            <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
              <FiAward className="text-yellow-500" /> Top 10 Đại Gia Mua Sắm
            </h2>
          </div>
          
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>
            ) : leaders.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Chưa có đại gia nào xuất hiện!</div>
            ) : (
              leaders.map((leader, index) => {
                const rankInfo = getUserRank(leader.totalSpent);
                const isTop3 = index < 3;
                return (
                  <div key={leader._id} className={`flex items-center gap-4 p-4 sm:p-6 transition-colors hover:bg-gray-50 dark:hover:bg-dark-100 ${user?._id === leader._id ? 'bg-primary-50 dark:bg-primary-500/10' : ''}`}>
                    {/* Rank Number */}
                    <div className="w-10 text-center shrink-0">
                      {index === 0 ? <span className="text-3xl drop-shadow-md">🥇</span> : 
                       index === 1 ? <span className="text-3xl drop-shadow-md">🥈</span> : 
                       index === 2 ? <span className="text-3xl drop-shadow-md">🥉</span> : 
                       <span className="text-xl font-bold text-gray-400">#{index + 1}</span>}
                    </div>
                    
                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shrink-0 ${isTop3 ? 'ring-2 ring-offset-2 ring-yellow-400' : 'bg-gray-100 dark:bg-dark-300 text-gray-500'}`}>
                      {leader.name?.charAt(0).toUpperCase()}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-white truncate flex items-center gap-2">
                        {leader.name} {user?._id === leader._id && <span className="text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full">Bạn</span>}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${rankInfo.bg} ${rankInfo.color} shrink-0`}>
                          {rankInfo.icon} {rankInfo.name}
                        </span>
                      </div>
                    </div>
                    
                    {/* Score (Total Spent) */}
                    <div className="text-right shrink-0">
                      <p className="font-bold text-primary-500">{formatPrice(leader.totalSpent)}</p>
                      <p className="text-xs text-gray-400">Đã chi tiêu</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

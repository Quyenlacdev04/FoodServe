import { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { FiGift, FiAward, FiInfo, FiChevronRight, FiClock } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { updateCoins } from '../store/slices/authSlice'
import { formatPrice } from '../data/mockData'

const VOUCHERS = [
  { id: 'v1', code: 'FOOD50', discount: 50000, cost: 500, label: 'Giảm 50K', minOrder: 150000 },
  { id: 'v2', code: 'FREESHIP', discount: 25000, cost: 250, label: 'Freeship', minOrder: 0 },
  { id: 'v3', code: 'NEW30', discount: 30000, cost: 300, label: 'Giảm 30K', minOrder: 100000 },
  { id: 'v4', code: 'VIP100', discount: 100000, cost: 1000, label: 'Giảm 100K', minOrder: 300000 },
]

const SPIN_PRIZES = [
  { label: '50 Xu', type: 'coin', value: 50, color: '#f59e0b' },
  { label: 'Chúc bạn may mắn', type: 'none', value: 0, color: '#6b7280' },
  { label: '100 Xu', type: 'coin', value: 100, color: '#10b981' },
  { label: '20 Xu', type: 'coin', value: 20, color: '#3b82f6' },
  { label: 'Thêm lượt', type: 'spin', value: 1, color: '#8b5cf6' },
  { label: '500 Xu (Jackpot)', type: 'coin', value: 500, color: '#ef4444' },
]

const PUZZLE_IMAGES = [
  { id: 'pizza', name: '🍕 Pizza thơm giòn', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=400&fit=crop&q=80' },
  { id: 'burger', name: '🍔 Burger bò phô mai', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop&q=80' },
  { id: 'sushi', name: '🍣 Sushi tươi Nhật Bản', url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=400&fit=crop&q=80' }
]

const BLOCK_SHAPES = [
  { id: '1x1', coords: [[0, 0]], color: 'from-red-400 to-red-600', icon: '🍓', name: 'Dâu Tây' },
  { id: '1x2_h', coords: [[0, 0], [0, 1]], color: 'from-orange-400 to-orange-600', icon: '🍊', name: 'Cam Ngọt' },
  { id: '1x2_v', coords: [[0, 0], [1, 0]], color: 'from-orange-400 to-orange-600', icon: '🍊', name: 'Cam Ngọt' },
  { id: '1x3_h', coords: [[0, 0], [0, 1], [0, 2]], color: 'from-yellow-400 to-yellow-600', icon: '🍋', name: 'Chanh Vàng' },
  { id: '1x3_v', coords: [[0, 0], [1, 0], [2, 0]], color: 'from-yellow-400 to-yellow-600', icon: '🍋', name: 'Chanh Vàng' },
  { id: '1x4_h', coords: [[0, 0], [0, 1], [0, 2], [0, 3]], color: 'from-green-400 to-green-600', icon: '🍏', name: 'Táo Xanh' },
  { id: '1x4_v', coords: [[0, 0], [1, 0], [2, 0], [3, 0]], color: 'from-green-400 to-green-600', icon: '🍏', name: 'Táo Xanh' },
  { id: '2x2', coords: [[0, 0], [0, 1], [1, 0], [1, 1]], color: 'from-blue-400 to-blue-600', icon: '🫐', name: 'Việt Quất' },
  { id: 'l_3_1', coords: [[0, 0], [1, 0], [1, 1]], color: 'from-purple-400 to-purple-600', icon: '🍇', name: 'Nho Tím' },
  { id: 'l_3_2', coords: [[0, 0], [0, 1], [1, 0]], color: 'from-purple-400 to-purple-600', icon: '🍇', name: 'Nho Tím' },
  { id: 'l_3_3', coords: [[0, 0], [0, 1], [1, 1]], color: 'from-purple-400 to-purple-600', icon: '🍇', name: 'Nho Tím' },
  { id: 'l_3_4', coords: [[0, 1], [1, 0], [1, 1]], color: 'from-purple-400 to-purple-600', icon: '🍇', name: 'Nho Tím' },
  { id: 't_4', coords: [[0, 0], [0, 1], [0, 2], [1, 1]], color: 'from-pink-400 to-pink-600', icon: '🍑', name: 'Đào Hồng' },
  { id: 'z_4', coords: [[0, 0], [0, 1], [1, 1], [1, 2]], color: 'from-cyan-400 to-cyan-600', icon: '🩵', name: 'Băng Viên' }
]

const playPlaceSound = (ctx) => {
  if (!ctx) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(600, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1)
  gain.gain.setValueAtTime(0.15, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + 0.1)
}

const playBlastSound = (ctx) => {
  if (!ctx) return
  const frequencies = [523.25, 659.25, 783.99, 1046.50]
  frequencies.forEach((freq) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + 0.3)
    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.3)
  })
}

const playMonkeyJumpSound = (ctx) => {
  if (!ctx) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(300, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.12)
  gain.gain.setValueAtTime(0.1, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + 0.12)
}

const playMonkeyEatSound = (ctx) => {
  if (!ctx) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(800, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.08)
  gain.gain.setValueAtTime(0.12, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + 0.08)
}

const playMonkeyHitSound = (ctx) => {
  if (!ctx) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(180, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.35)
  gain.gain.setValueAtTime(0.15, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + 0.35)
}


// Tỉ lệ trúng thưởng (tổng = 100%)
const SPIN_PROBABILITIES = [
  30,     // 50 Xu (30%)
  30,     // Trượt (30%)
  15,     // 100 Xu (15%)
  20,     // 20 Xu (20%)
  4.99,   // Thêm lượt (4.99%)
  0.01    // 500 Xu Jackpot (0.01%)
];

// Audio Generators
const createAudioContext = () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  return AudioContext ? new AudioContext() : null;
};

const playTickSound = (ctx) => {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.05);
};

const playWinSound = (ctx) => {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, ctx.currentTime);
  osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.1);
  osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.2);
  osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.6);
};

const playLoseSound = (ctx) => {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(300, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.5);
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.5);
};

const playCorrectSound = (ctx) => {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
  osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
  osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
  osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.24); // C6
  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.45);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.45);
};

const playIncorrectSound = (ctx) => {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
  osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.3); // A2
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.3);
};

const QUIZ_QUESTIONS = [
  {
    question: "Bánh mì Việt Nam truyền thống thường dùng loại sốt/quết béo ngậy nào dưới đây?",
    options: ["Bơ trắng và Pate gan", "Sốt mayonnaise Pháp", "Phô mai chảy", "Sữa đặc có đường"],
    answer: 0
  },
  {
    question: "Gia vị nào là 'linh hồn' tạo nên nước dùng phở bò thơm ngon truyền thống?",
    options: ["Sả và Tỏi tây", "Hồi, Quế và Thảo quả", "Riềng và Nghệ tươi", "Hạt tiêu đen và Ớt bột"],
    answer: 1
  },
  {
    question: "Loại quả nào được mệnh danh là 'Vua của các loài trái cây' ở khu vực Đông Nam Á?",
    options: ["Măng cụt", "Xoài cát Hòa Lộc", "Dưa hấu không hạt", "Sầu riêng"],
    answer: 3
  },
  {
    question: "Thức uống độc đáo 'Cà phê trứng' nổi tiếng thế giới có nguồn gốc từ thành phố nào?",
    options: ["Hà Nội", "Hội An", "TP. Hồ Chí Minh", "Đà Lạt"],
    answer: 0
  },
  {
    question: "Theo quan điểm dinh dưỡng, chất nào là nguồn cung cấp năng lượng chính và nhanh nhất cho não bộ?",
    options: ["Chất béo (Lipid)", "Đạm (Protein)", "Đường bột (Carbohydrate)", "Chất xơ"],
    answer: 2
  },
  {
    question: "Loại vitamin nào dễ bị phân hủy và hao hụt nhiều nhất khi nấu thức ăn ở nhiệt độ cao trong thời gian dài?",
    options: ["Vitamin C", "Vitamin A", "Vitamin D", "Vitamin B12"],
    answer: 0
  },
  {
    question: "Bún chả thịt nướng trên than hồng là đặc sản ẩm thực nức tiếng của địa phương nào?",
    options: ["Huế", "Hà Nội", "Đà Nẵng", "Cần Thơ"],
    answer: 1
  },
  {
    question: "Món canh chua cá lóc truyền thống của người dân Nam Bộ thường dùng vị chua thanh của quả nào?",
    options: ["Quả Sấu", "Quả Khế", "Quả Me", "Quả Chanh"],
    answer: 2
  },
  {
    question: "Cao Lầu là món mì trộn độc đáo, đậm đà và là biểu tượng ẩm thực của thành phố cổ nào?",
    options: ["Hội An", "Huế", "Hà Nội", "Đà Lạt"],
    answer: 0
  },
  {
    question: "Thực phẩm nào dưới đây chứa hàm lượng Canxi tự nhiên dồi dào và dễ hấp thụ nhất?",
    options: ["Thịt bò phi lê", "Sữa và các chế phẩm từ sữa", "Khoai tây chiên", "Bột mì đa dụng"],
    answer: 1
  },
  {
    question: "Lượng nước lọc khuyến nghị trung bình một người trưởng thành nên uống mỗi ngày để duy trì sức khỏe tốt là bao nhiêu?",
    options: ["Khoảng 0.5 - 1.0 lít", "Khoảng 1.5 - 2.0 lít", "Khoảng 3.5 - 4.5 lít", "Chỉ uống khi thực sự thấy khát"],
    answer: 1
  },
  {
    question: "Món nem cuốn (phở cuốn/gỏi cuốn) của Việt Nam thường được xếp vào nhóm món ăn nào tốt cho sức khỏe?",
    options: ["Món ăn chiên rán nhiều dầu", "Món ăn thanh mát, nhiều rau xanh và protein nhẹ", "Món ăn nhiều tinh bột đường tinh chế", "Món ăn muối chua lên men chua cay"],
    answer: 1
  }
];

export default function GamesPage() {
  const { user, isAuthenticated } = useSelector(s => s.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  
  const [isSpinning, setIsSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [prizeModal, setPrizeModal] = useState(null)
  const [myVouchers, setMyVouchers] = useState([])
  
  // Mystery Box State
  const [boxState, setBoxState] = useState('idle')
  const [boxPrizes, setBoxPrizes] = useState([null, null, null])
  const [selectedBox, setSelectedBox] = useState(null)

  // Sliding Puzzle State
  const [puzzleImage, setPuzzleImage] = useState(PUZZLE_IMAGES[0])
  const [puzzleBoard, setPuzzleBoard] = useState([0, 1, 2, 3, 4, 5, 6, 7, 8])
  const [puzzleState, setPuzzleState] = useState('idle') // 'idle', 'playing', 'won', 'lost'
  const [puzzleTime, setPuzzleTime] = useState(60)
  const [puzzleMoves, setPuzzleMoves] = useState(0)

  // Block Blast State
  const [blockGrid, setBlockGrid] = useState(Array(8).fill(null).map(() => Array(8).fill(null)))
  const [blockChoices, setBlockChoices] = useState([null, null, null])
  const [selectedBlockIdx, setSelectedBlockIdx] = useState(null)
  const [blockScore, setBlockScore] = useState(0)
  const [blockGameState, setBlockGameState] = useState('idle') // 'idle', 'playing', 'gameover'
  const [hoveredCell, setHoveredCell] = useState(null) // [r, c]

  // Custom Modals State
  const [confirmModal, setConfirmModal] = useState(null)
  const [gameResultModal, setGameResultModal] = useState(null)

  // Monkey Climber State
  const [monkeyState, setMonkeyState] = useState('idle') // 'idle', 'playing', 'gameover'
  const [monkeyScore, setMonkeyScore] = useState(0)
  const [monkeyEnergy, setMonkeyEnergy] = useState(100)
  const [treeLevels, setTreeLevels] = useState([])
  const [monkeyPosition, setMonkeyPosition] = useState('left') // 'left' | 'right'
  const [monkeyDifficulty, setMonkeyDifficulty] = useState('normal') // 'easy' | 'normal' | 'hard' | 'extreme'
  const [monkeyCombo, setMonkeyCombo] = useState(0)
  const [monkeyIsWarning, setMonkeyIsWarning] = useState(false)
  const monkeyLastMoveTimeRef = useRef(0)

  // Trivia Game State
  const [quizState, setQuizState] = useState('idle') // 'idle', 'playing', 'ended'
  const [quizScore, setQuizScore] = useState(0)
  const [quizCurrentIndex, setQuizCurrentIndex] = useState(0)
  const [quizTimeLeft, setQuizTimeLeft] = useState(15)
  const [quizSelectedOption, setQuizSelectedOption] = useState(null)
  const [quizQuestions, setQuizQuestions] = useState([])
  const [quizHistory, setQuizHistory] = useState([])

  const quizStateRef = useRef()
  quizStateRef.current = {
    quizState,
    quizScore,
    quizCurrentIndex,
    quizTimeLeft,
    quizSelectedOption,
    quizQuestions,
    quizHistory
  }

  const monkeyStateRef = useRef()
  monkeyStateRef.current = {
    monkeyScore,
    monkeyState,
    monkeyEnergy,
    monkeyDifficulty,
    monkeyCombo
  }


  const showConfirmModal = (title, message, onConfirm) => {
    setConfirmModal({
      title,
      message,
      onConfirm: () => {
        onConfirm()
        setConfirmModal(null)
      }
    })
  }

  const showGameResult = (result) => {
    setGameResultModal(result)
  }

  const generateTreeFloor = (index, prevFloor, currentScore, diff = 'normal') => {
    let obstacleSide = 'none'
    let obstacleType = 'none'

    const scoreVal = currentScore || 0
    
    // Progressive difficulty settings based on selected level
    let baseProb = 0.45
    let maxProb = 0.80
    let scaleFactor = 0.0025
    let rewardProb = 0.60
    
    if (diff === 'easy') {
      baseProb = 0.35
      maxProb = 0.55
      scaleFactor = 0.0015
      rewardProb = 0.70
    } else if (diff === 'normal') {
      baseProb = 0.48
      maxProb = 0.75
      scaleFactor = 0.0025
      rewardProb = 0.55
    } else if (diff === 'hard') {
      baseProb = 0.60
      maxProb = 0.85
      scaleFactor = 0.0035
      rewardProb = 0.40
    } else if (diff === 'extreme') {
      baseProb = 0.75
      maxProb = 0.90
      scaleFactor = 0.005 // Scales difficulty up extremely fast
      rewardProb = 0.25 // Rare food, extreme pressure!
    }

    const obstacleProb = Math.min(maxProb, baseProb + scoreVal * scaleFactor)

    const hasObstacle = index > 1 && Math.random() < obstacleProb
    if (hasObstacle) {
      if (prevFloor && prevFloor.obstacleSide !== 'none') {
        // Higher difficulty -> high chance to alternate side to challenge the player
        // Low difficulty -> high chance to stay on same side or go none
        let alternateProb = 0.5
        if (diff === 'easy') alternateProb = 0.15
        else if (diff === 'normal') alternateProb = 0.40
        else if (diff === 'hard') alternateProb = 0.70
        else if (diff === 'extreme') alternateProb = 0.85

        if (Math.random() < alternateProb) {
          obstacleSide = prevFloor.obstacleSide === 'left' ? 'right' : 'left'
        } else {
          obstacleSide = prevFloor.obstacleSide
        }
      } else {
        // Previous floor was 'none', choose any side randomly
        obstacleSide = Math.random() < 0.5 ? 'left' : 'right'
      }
    }

    if (obstacleSide !== 'none') {
      obstacleType = Math.random() < 0.5 ? 'durian' : 'bee'
    }

    const hasReward = Math.random() < rewardProb
    const rewardSide = obstacleSide === 'none' 
      ? (Math.random() < 0.5 ? 'left' : 'right') 
      : (obstacleSide === 'left' ? 'right' : 'left')
    
    let rewardType = 'none'
    if (hasReward) {
      const rand = Math.random()
      if (rand < 0.55) rewardType = 'banana'
      else if (rand < 0.85) rewardType = 'coconut'
      else rewardType = 'coin'
    }

    return {
      id: index,
      obstacleSide,
      obstacleType,
      rewardSide,
      rewardType
    }
  }

  const generateInitialTree = (diff = 'normal') => {
    const initialLevels = []
    for (let i = 0; i < 10; i++) {
      initialLevels.push(generateTreeFloor(i, initialLevels[i - 1], 0, diff))
    }
    return initialLevels
  }

  const startMonkeyClimb = () => {
    const currentCoins = user?.coins || 0
    if (currentCoins < 20) {
      toast.error('Cần ít nhất 20 Xu để tham gia trò chơi này!')
      return
    }

    dispatch(updateCoins({ userId: user._id || user.id, coins: -20 }))

    const initial = generateInitialTree(monkeyDifficulty)
    setTreeLevels(initial)
    setMonkeyScore(0)
    setMonkeyCombo(0)
    setMonkeyIsWarning(false)
    monkeyLastMoveTimeRef.current = Date.now()
    
    // Starting energy scales with difficulty
    let startEnergy = 100
    if (monkeyDifficulty === 'hard') startEnergy = 80
    else if (monkeyDifficulty === 'extreme') startEnergy = 60
    
    setMonkeyEnergy(startEnergy)
    setMonkeyPosition('left')
    setMonkeyState('playing')
    
    toast.success('Đã trừ 20 Xu. Hãy bắt đầu leo cây thôi nào! 🐒', { icon: '🐒' })
  }

  const handleMonkeyGameOver = (finalScore) => {
    setMonkeyState('gameover')
    const audioCtx = getAudioCtx()
    playMonkeyHitSound(audioCtx)

    const diff = monkeyStateRef.current.monkeyDifficulty || 'normal'

    let coinsReward = 0
    if (diff === 'easy') {
      if (finalScore >= 200) coinsReward = 50
      else if (finalScore >= 100) coinsReward = 30
      else if (finalScore >= 50) coinsReward = 15
    } else if (diff === 'normal') {
      if (finalScore >= 200) coinsReward = 100
      else if (finalScore >= 100) coinsReward = 60
      else if (finalScore >= 50) coinsReward = 30
    } else if (diff === 'hard') {
      if (finalScore >= 200) coinsReward = 200
      else if (finalScore >= 100) coinsReward = 100
      else if (finalScore >= 50) coinsReward = 50
    } else if (diff === 'extreme') {
      if (finalScore >= 200) coinsReward = 350
      else if (finalScore >= 100) coinsReward = 180
      else if (finalScore >= 50) coinsReward = 80
    }

    if (coinsReward > 0) {
      playWinSound(audioCtx)
      dispatch(updateCoins({ userId: user._id || user.id, coins: coinsReward }))
    } else {
      playLoseSound(audioCtx)
    }

    const diffLabel = diff === 'easy' ? 'Dễ' : diff === 'normal' ? 'Vừa' : diff === 'hard' ? 'Khó' : 'Cực hạn ⚠️'

    showGameResult({
      gameName: `Khỉ Leo Cây Thực Thần (${diffLabel})`,
      title: coinsReward > 0 ? 'Thành Tích Phi Thường!' : 'Rớt Đài Mất Rồi!',
      subtitle: coinsReward > 0 
        ? `Chú khỉ háu ăn của bạn đã trèo rất cao ở chế độ ${diffLabel} và đạt ${finalScore} điểm!` 
        : `Rất tiếc! Chú khỉ đã bị trượt chân hoặc hết sạch năng lượng ở chế độ ${diffLabel}.`,
      isWin: coinsReward > 0,
      stats: [
        { label: 'Chế độ chơi', value: diffLabel },
        { label: 'Điểm leo cây', value: finalScore },
        { label: 'Thành tích Xu', value: coinsReward > 0 ? `+${coinsReward} Xu` : '0 Xu' }
      ],
      reward: coinsReward,
      onReplay: startMonkeyClimb
    })
  }

  const handleMonkeyMove = (side) => {
    if (monkeyState !== 'playing') return

    const audioCtx = getAudioCtx()
    const nextLevel = treeLevels[1]
    if (!nextLevel) return

    setMonkeyPosition(side)

    if (nextLevel.obstacleSide === side) {
      handleMonkeyGameOver(monkeyScore)
      return
    }

    playMonkeyJumpSound(audioCtx)

    const diff = monkeyDifficulty

    // Calculate Combo
    const now = Date.now()
    const timeDiff = now - monkeyLastMoveTimeRef.current
    monkeyLastMoveTimeRef.current = now // Update move time

    let nextCombo = 0
    let comboBonusScore = 0
    if (timeDiff <= 450) {
      nextCombo = monkeyCombo + 1
      setMonkeyCombo(nextCombo)
      if (nextCombo >= 5) {
        comboBonusScore = Math.floor(nextCombo / 5)
      }
    } else {
      setMonkeyCombo(0)
    }

    let pointsGained = 1
    let energyGained = 0

    if (diff === 'easy') {
      energyGained = 0.5
    } else if (diff === 'normal') {
      energyGained = 0
    } else if (diff === 'hard') {
      energyGained = -0.5
    } else if (diff === 'extreme') {
      energyGained = -1.0
    }

    if (nextLevel.rewardSide === side && nextLevel.rewardType !== 'none') {
      playMonkeyEatSound(audioCtx)
      
      let bananaPoints = 5
      let bananaEnergy = 12
      let coconutPoints = 10
      let coconutEnergy = 20
      let coinPoints = 2
      let coinEnergy = 15

      // Replenishment energy scales down as difficulty increases
      if (diff === 'easy') {
        bananaEnergy = 15
        coconutEnergy = 25
        coinEnergy = 18
      } else if (diff === 'normal') {
        bananaEnergy = 10
        coconutEnergy = 18
        coinEnergy = 12
      } else if (diff === 'hard') {
        bananaEnergy = 7
        coconutEnergy = 12
        coinEnergy = 8
      } else if (diff === 'extreme') {
        bananaEnergy = 4
        coconutEnergy = 8
        coinEnergy = 5
      }

      if (nextLevel.rewardType === 'banana') {
        pointsGained += bananaPoints
        energyGained += bananaEnergy
        toast.success(`🍌 Ngon quá! +${bananaPoints} Điểm, +${bananaEnergy} Năng lượng`, { id: 'monkey-banana-toast', duration: 1000 })
      } else if (nextLevel.rewardType === 'coconut') {
        pointsGained += coconutPoints
        energyGained += coconutEnergy
        toast.success(`🥥 Tuyệt vời! +${coconutPoints} Điểm, +${coconutEnergy} Năng lượng`, { id: 'monkey-coconut-toast', duration: 1000 })
      } else if (nextLevel.rewardType === 'coin') {
        pointsGained += coinPoints
        energyGained += coinEnergy
        dispatch(updateCoins({ userId: user._id || user.id, coins: 1 }))
        toast.success('🪙 Nhặt được Xu Vàng! +1 Xu vào Ví', { id: 'monkey-coin-toast', duration: 1000 })
      }
    }

    const nextScore = monkeyScore + pointsGained + comboBonusScore
    setMonkeyScore(nextScore)
    
    setMonkeyEnergy(prev => {
      const nextEnergy = prev + energyGained
      if (nextEnergy <= 0) {
        setTimeout(() => handleMonkeyGameOver(nextScore), 0)
        return 0
      }
      return Math.min(100, nextEnergy)
    })

    setTreeLevels(prev => {
      const nextLevels = [...prev]
      nextLevels.shift()
      
      const lastLevel = nextLevels[nextLevels.length - 1]
      const nextId = lastLevel ? lastLevel.id + 1 : 10
      nextLevels.push(generateTreeFloor(nextId, lastLevel, nextScore, diff))
      
      return nextLevels
    })
  }

  const endMonkeyGame = () => {
    if (monkeyState !== 'playing') return

    showConfirmModal(
      "Kết thúc ván leo cây?",
      `Bạn có chắc muốn dừng ván đấu này để nhận thưởng theo số điểm hiện tại (${monkeyScore} điểm) không?`,
      () => {
        handleMonkeyGameOver(monkeyScore)
      }
    )
  }

  const restartMonkeyGame = () => {
    if (monkeyState !== 'playing') return

    showConfirmModal(
      "Chơi lại ván mới?",
      "Ván chơi hiện tại sẽ bị hủy và bạn sẽ tốn thêm 20 Xu để bắt đầu ván mới. Bạn có chắc chắn muốn chơi lại?",
      () => {
        startMonkeyClimb()
      }
    )
  }

  useEffect(() => {
    let timer
    if (monkeyState === 'playing') {
      if (monkeyLastMoveTimeRef.current === 0) {
        monkeyLastMoveTimeRef.current = Date.now()
      }
      timer = setInterval(() => {
        const currentScore = monkeyStateRef.current.monkeyScore
        const diff = monkeyStateRef.current.monkeyDifficulty || 'normal'
        
        let baseDrainPerSec = 5
        if (diff === 'easy') baseDrainPerSec = 4 + (currentScore / 12)
        else if (diff === 'normal') baseDrainPerSec = 6 + (currentScore / 8)
        else if (diff === 'hard') baseDrainPerSec = 9 + (currentScore / 6)
        else if (diff === 'extreme') baseDrainPerSec = 14 + (currentScore / 4)
        
        let drainAmount = baseDrainPerSec / 10

        const now = Date.now()
        const idleTime = now - monkeyLastMoveTimeRef.current
        
        let idleLimit = 1200
        let idlePenaltyRatePer100ms = 8
        
        if (diff === 'easy') {
          idleLimit = 2000
          idlePenaltyRatePer100ms = 4
        } else if (diff === 'normal') {
          idleLimit = 1200
          idlePenaltyRatePer100ms = 7
        } else if (diff === 'hard') {
          idleLimit = 750
          idlePenaltyRatePer100ms = 12
        } else if (diff === 'extreme') {
          idleLimit = 450
          idlePenaltyRatePer100ms = 18
        }

        const isIdleOverLimit = idleTime > idleLimit
        if (isIdleOverLimit) {
          drainAmount += idlePenaltyRatePer100ms
          setMonkeyIsWarning(true)
        } else {
          if (idleTime > idleLimit * 0.65) {
            setMonkeyIsWarning(true)
          } else {
            setMonkeyIsWarning(false)
          }
        }

        setMonkeyEnergy(prev => {
          const nextEnergy = prev - drainAmount
          if (nextEnergy <= 0) {
            clearInterval(timer)
            setTimeout(() => {
              handleMonkeyGameOver(monkeyStateRef.current.monkeyScore)
            }, 0)
            return 0
          }
          return nextEnergy
        })
      }, 100)
    } else {
      setMonkeyIsWarning(false)
    }
    return () => {
      clearInterval(timer)
      setMonkeyIsWarning(false)
    }
  }, [monkeyState])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (monkeyState !== 'playing') return
      
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault()
        handleMonkeyMove('left')
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault()
        handleMonkeyMove('right')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [monkeyState, treeLevels, monkeyScore])

  const startBlockBlast = () => {
    const currentCoins = user?.coins || 0
    if (currentCoins < 20) {
      toast.error('Cần ít nhất 20 Xu để tham gia Block Blast!')
      return
    }
    
    dispatch(updateCoins({ userId: user._id || user.id, coins: -20 }))
    
    setBlockGrid(Array(8).fill(null).map(() => Array(8).fill(null)))
    const initialChoices = [
      BLOCK_SHAPES[Math.floor(Math.random() * BLOCK_SHAPES.length)],
      BLOCK_SHAPES[Math.floor(Math.random() * BLOCK_SHAPES.length)],
      BLOCK_SHAPES[Math.floor(Math.random() * BLOCK_SHAPES.length)]
    ]
    setBlockChoices(initialChoices)
    setSelectedBlockIdx(null)
    setBlockScore(0)
    setBlockGameState('playing')
    setHoveredCell(null)
    
    toast.success('Đã trừ 20 Xu. Bắt đầu xếp thạch Block Blast!', { icon: '🟩' })
  }

  const endBlockBlastGame = () => {
    if (blockGameState !== 'playing') return
    
    showConfirmModal(
      "Kết thúc ván đấu sớm?",
      `Bạn có chắc muốn dừng ván đấu này để nhận thưởng theo số điểm hiện tại (${blockScore} điểm) không?`,
      () => {
        setBlockGameState('ended')
        setSelectedBlockIdx(null)
        setHoveredCell(null)
        
        const audioCtx = getAudioCtx()
        
        // Calculate coin reward
        let coinsReward = 0
        if (blockScore >= 350) {
          coinsReward = 100
        } else if (blockScore >= 200) {
          coinsReward = 60
        } else if (blockScore >= 100) {
          coinsReward = 30
        }
        
        if (coinsReward > 0) {
          playWinSound(audioCtx)
          dispatch(updateCoins({ userId: user._id || user.id, coins: coinsReward }))
        } else {
          playLoseSound(audioCtx)
        }
        
        showGameResult({
          gameName: 'Block Blast Thực Thần',
          title: coinsReward > 0 ? 'Thành Công Rực Rỡ!' : 'Dừng Cuộc Chơi',
          subtitle: coinsReward > 0 ? 'Bạn đã bảo toàn thành công phần thưởng của mình!' : 'Bạn đã kết thúc sớm ván đấu.',
          isWin: coinsReward > 0,
          stats: [
            { label: 'Điểm số', value: blockScore },
            { label: 'Xu thưởng nhận', value: coinsReward > 0 ? `+${coinsReward} Xu` : '0 Xu' }
          ],
          reward: coinsReward,
          onReplay: startBlockBlast
        })
      }
    )
  }

  const restartBlockBlastGame = () => {
    if (blockGameState !== 'playing') return
    
    showConfirmModal(
      "Chơi lại ván mới?",
      "Chơi lại ván mới sẽ hủy ván đấu hiện tại và tiêu tốn thêm 20 Xu của bạn. Bạn chắc chắn muốn chơi lại chứ?",
      () => {
        startBlockBlast()
      }
    )
  }

  const canPlaceBlock = (grid, block, r, c) => {
    if (!block) return false
    for (const [offsetR, offsetC] of block.coords) {
      const targetR = r + offsetR
      const targetC = c + offsetC
      if (targetR < 0 || targetR >= 8 || targetC < 0 || targetC >= 8) return false
      if (grid[targetR][targetC] !== null) return false
    }
    return true
  }

  const checkBlockGameOver = (grid, choices) => {
    if (choices.every(choice => choice === null)) return false
    
    for (let i = 0; i < choices.length; i++) {
      const block = choices[i]
      if (!block) continue
      
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (canPlaceBlock(grid, block, r, c)) {
            return false
          }
        }
      }
    }
    return true
  }

  const handleGridCellClick = (r, c) => {
    if (blockGameState !== 'playing') return
    if (selectedBlockIdx === null) {
      toast.error('Vui lòng chọn một khối thạch bên dưới trước!', { id: 'select-block-toast' })
      return
    }
    
    const selectedBlock = blockChoices[selectedBlockIdx]
    if (!selectedBlock) return
    
    if (!canPlaceBlock(blockGrid, selectedBlock, r, c)) {
      toast.error('Không thể đặt khối thạch tại vị trí này!', { id: 'invalid-place-toast' })
      return
    }
    
    const audioCtx = getAudioCtx()
    playPlaceSound(audioCtx)
    
    const newGrid = blockGrid.map(row => [...row])
    for (const [offsetR, offsetC] of selectedBlock.coords) {
      newGrid[r + offsetR][c + offsetC] = {
        color: selectedBlock.color,
        icon: selectedBlock.icon
      }
    }
    
    let scoreGained = selectedBlock.coords.length
    const rowsToClear = []
    const colsToClear = []
    
    for (let i = 0; i < 8; i++) {
      if (newGrid[i].every(cell => cell !== null)) {
        rowsToClear.push(i)
      }
    }
    
    for (let j = 0; j < 8; j++) {
      let isColFull = true
      for (let i = 0; i < 8; i++) {
        if (newGrid[i][j] === null) {
          isColFull = false
          break
        }
      }
      if (isColFull) {
        colsToClear.push(j)
      }
    }
    
    if (rowsToClear.length > 0 || colsToClear.length > 0) {
      playBlastSound(audioCtx)
      
      rowsToClear.forEach(rIdx => {
        for (let j = 0; j < 8; j++) {
          newGrid[rIdx][j] = null
        }
      })
      colsToClear.forEach(cIdx => {
        for (let i = 0; i < 8; i++) {
          newGrid[i][cIdx] = null
        }
      })
      
      const linesCleared = rowsToClear.length + colsToClear.length
      scoreGained += linesCleared * 15
      
      toast.success(`💥 BLAST! Hủy ${linesCleared} hàng/cột! +${linesCleared * 15} Điểm`, {
        icon: '🔥',
        id: 'blast-toast'
      })
    }
    
    const newScore = blockScore + scoreGained
    setBlockScore(newScore)
    setBlockGrid(newGrid)
    
    const newChoices = [...blockChoices]
    newChoices[selectedBlockIdx] = null
    
    let finalChoices = newChoices
    if (newChoices.every(choice => choice === null)) {
      finalChoices = [
        BLOCK_SHAPES[Math.floor(Math.random() * BLOCK_SHAPES.length)],
        BLOCK_SHAPES[Math.floor(Math.random() * BLOCK_SHAPES.length)],
        BLOCK_SHAPES[Math.floor(Math.random() * BLOCK_SHAPES.length)]
      ]
      setBlockChoices(finalChoices)
toast.success('Đã cấp 3 khối thạch mới!', { icon: '✨', id: 'new-blocks-toast' })
    } else {
      setBlockChoices(newChoices)
    }
    
    setSelectedBlockIdx(null)
    setHoveredCell(null)
    
    if (checkBlockGameOver(newGrid, finalChoices)) {
      setBlockGameState('gameover')
      const audioCtx = getAudioCtx()
      
      let coinsReward = 0
      if (newScore >= 350) {
        coinsReward = 100
      } else if (newScore >= 200) {
        coinsReward = 60
      } else if (newScore >= 100) {
        coinsReward = 30
      }
      
      if (coinsReward > 0) {
        playWinSound(audioCtx)
        dispatch(updateCoins({ userId: user._id || user.id, coins: coinsReward }))
      } else {
        playLoseSound(audioCtx)
      }
      
      showGameResult({
        gameName: 'Block Blast Thực Thần',
        title: coinsReward > 0 ? 'Thành Tích Xuất Sắc!' : 'Không Còn Nước Đi!',
        subtitle: coinsReward > 0 ? 'Bạn đã xuất sắc chinh phục bàn cờ!' : 'Rất tiếc, các khối thạch không còn chỗ trống.',
        isWin: coinsReward > 0,
        stats: [
          { label: 'Điểm số đạt được', value: newScore },
          { label: 'Thành tích Xu', value: coinsReward > 0 ? `+${coinsReward} Xu` : '0 Xu' }
        ],
        reward: coinsReward,
        onReplay: startBlockBlast
      })
    }
  }

  // Thuật toán xáo trộn bàn cờ bảo đảm giải được (Solvable Shuffle)
  const shufflePuzzle = () => {
    let tempBoard = [0, 1, 2, 3, 4, 5, 6, 7, 8]
    let emptyIdx = 8 // Bắt đầu ở góc phải dưới
    
    // Di chuyển ngẫu nhiên 60 lần giữa ô trống và các ô xung quanh
    for (let i = 0; i < 60; i++) {
      const r = Math.floor(emptyIdx / 3)
      const c = emptyIdx % 3
      const validMoves = []
      
      if (r > 0) validMoves.push((r - 1) * 3 + c) // Trên
      if (r < 2) validMoves.push((r + 1) * 3 + c) // Dưới
      if (c > 0) validMoves.push(r * 3 + (c - 1)) // Trái
      if (c < 2) validMoves.push(r * 3 + (c + 1)) // Phải
      
      const nextMoveIdx = validMoves[Math.floor(Math.random() * validMoves.length)]
      
      // Hoán đổi ô trống (giá trị 8) với ô ngẫu nhiên liền kề
      tempBoard[emptyIdx] = tempBoard[nextMoveIdx]
      tempBoard[nextMoveIdx] = 8
      emptyIdx = nextMoveIdx
    }
    return tempBoard
  }

  const startPuzzle = () => {
    const currentCoins = user?.coins || 0
    if (currentCoins < 20) {
      toast.error('Cần ít nhất 20 Xu để tham gia trò chơi này!')
      return
    }
    
    dispatch(updateCoins({ userId: user._id || user.id, coins: -20 }))
    
    const shuffled = shufflePuzzle()
    setPuzzleBoard(shuffled)
    setPuzzleMoves(0)
    setPuzzleTime(60)
    setPuzzleState('playing')
    toast.success('Đã trừ 20 Xu. Hãy xếp hình thật nhanh nào!', { icon: '🧩' })
  }

  const handlePuzzleClick = (index) => {
    if (puzzleState !== 'playing') return
    
    const emptyIdx = puzzleBoard.indexOf(8)
    const r1 = Math.floor(index / 3), c1 = index % 3
    const r2 = Math.floor(emptyIdx / 3), c2 = emptyIdx % 3
    
    const isAdjacent = (Math.abs(r1 - r2) === 1 && c1 === c2) || (r1 === r2 && Math.abs(c1 - c2) === 1)
    
    if (isAdjacent) {
      const audioCtx = getAudioCtx()
      playTickSound(audioCtx)
      
      const newBoard = [...puzzleBoard]
      newBoard[emptyIdx] = newBoard[index]
      newBoard[index] = 8
      setPuzzleBoard(newBoard)
      setPuzzleMoves(prev => prev + 1)
      
      // Kiểm tra xem đã thắng chưa
      const isWon = newBoard.every((val, idx) => val === idx)
      if (isWon) {
        setPuzzleState('won')
        playWinSound(audioCtx)
        dispatch(updateCoins({ userId: user._id || user.id, coins: 80 }))
        
        showGameResult({
          gameName: 'Ghép Hình Thực Thần',
          title: 'Chiến Thắng Tuyệt Đối!',
          subtitle: 'Bạn đã hoàn thành bức tranh một cách xuất sắc!',
          isWin: true,
          stats: [
            { label: 'Số lượt đi', value: puzzleMoves + 1 },
            { label: 'Thời gian còn lại', value: `${puzzleTime}s` }
          ],
          reward: 80,
          onReplay: startPuzzle
        })
      }
    }
  }

  // Effect đếm ngược thời gian cho Puzzle Game
  useEffect(() => {
    let timer
    if (puzzleState === 'playing' && puzzleTime > 0) {
      timer = setInterval(() => {
        setPuzzleTime(prev => {
          if (prev <= 1) {
            setPuzzleState('lost')
            playLoseSound(getAudioCtx())
            
            showGameResult({
              gameName: 'Ghép Hình Thực Thần',
              title: 'Hết Giờ Mất Rồi!',
              subtitle: 'Bạn đã không kịp hoàn thành bức tranh trong thời gian quy định.',
              isWin: false,
              stats: [
                { label: 'Số lượt đi đã thực hiện', value: puzzleMoves },
                { label: 'Thời gian', value: 'Hết giờ (0s)' }
              ],
              reward: 0,
              onReplay: startPuzzle
            })
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [puzzleState, puzzleTime])

  const endPuzzleGame = () => {
    if (puzzleState !== 'playing') return
    
    showConfirmModal(
      "Kết thúc ván ghép hình?",
      "Bạn có chắc muốn dừng ván ghép hình này? Lượt chơi hiện tại sẽ bị hủy và bạn sẽ không nhận được thưởng Xu.",
      () => {
        setPuzzleState('lost')
        const audioCtx = getAudioCtx()
        playLoseSound(audioCtx)
        
        showGameResult({
          gameName: 'Ghép Hình Thực Thần',
          title: 'Đã Đầu Hàng!',
          subtitle: 'Bạn đã dừng ván ghép hình sớm.',
          isWin: false,
          stats: [
            { label: 'Số lượt đi đã đi', value: puzzleMoves },
            { label: 'Thời gian còn lại', value: `${puzzleTime}s` }
          ],
          reward: 0,
          onReplay: startPuzzle
        })
      }
    )
  }

  const restartPuzzleGame = () => {
    if (puzzleState !== 'playing') return
    
    showConfirmModal(
      "Chơi lại ván mới?",
      "Ván chơi hiện tại sẽ bị hủy và bạn sẽ tốn thêm 20 Xu để bắt đầu ván mới. Bạn có chắc chắn muốn chơi lại?",
      () => {
        startPuzzle()
      }
    )
  }

  const startQuizGame = () => {
    const currentCoins = user?.coins || 0
    if (currentCoins < 10) {
      toast.error('Cần ít nhất 10 Xu để tham gia Đố Vui Thực Thần!')
      return
    }

    dispatch(updateCoins({ userId: user._id || user.id, coins: -10 }))

    // Shuffle and select 5 questions
    const shuffled = [...QUIZ_QUESTIONS].sort(() => 0.5 - Math.random())
    const selected = shuffled.slice(0, 5)

    setQuizQuestions(selected)
    setQuizScore(0)
    setQuizCurrentIndex(0)
    setQuizTimeLeft(15)
    setQuizSelectedOption(null)
    setQuizHistory([])
    setQuizState('playing')

    toast.success('Đã trừ 10 Xu. Bắt đầu Đố Vui Thực Thần thôi nào! 🧠', { icon: '🧠' })
  }

  const handleSelectQuizOption = (optIdx) => {
    if (quizState !== 'playing' || quizSelectedOption !== null) return

    const audioCtx = getAudioCtx()
    setQuizSelectedOption(optIdx)

    const currentQuestion = quizQuestions[quizCurrentIndex]
    const isCorrect = optIdx === currentQuestion.answer
    
    let nextScore = quizScore
    if (isCorrect) {
      playCorrectSound(audioCtx)
      nextScore += 10
      setQuizScore(nextScore)
    } else {
      playIncorrectSound(audioCtx)
    }

    // Add to history
    const historyItem = {
      question: currentQuestion.question,
      options: currentQuestion.options,
      correctAnswer: currentQuestion.answer,
      selectedAnswer: optIdx
    }
    setQuizHistory(prev => [...prev, historyItem])

    // Wait 1.5 seconds then advance
    setTimeout(() => {
      advanceQuiz(nextScore)
    }, 1500)
  }

  const advanceQuiz = (scoreVal) => {
    const nextIndex = quizStateRef.current.quizCurrentIndex + 1
    if (nextIndex < 5) {
      setQuizCurrentIndex(nextIndex)
      setQuizTimeLeft(15)
      setQuizSelectedOption(null)
    } else {
      endQuizGame(scoreVal || quizScore)
    }
  }

  const endQuizGame = (finalScore, forceQuit = false) => {
    setQuizState('ended')
    setQuizSelectedOption(null)

    if (forceQuit) {
      playLoseSound(getAudioCtx())
      showGameResult({
        gameName: 'Đố Vui Thực Thần',
        title: 'Đã Đầu Hàng!',
        subtitle: 'Bạn đã hủy lượt đố vui giữa chừng. Không nhận được Xu thưởng!',
        isWin: false,
        stats: [
          { label: 'Số câu đã trả lời', value: `${quizHistory.length}/5` },
          { label: 'Điểm số đạt được', value: 0 },
          { label: 'Xu thưởng', value: '0 Xu' }
        ],
        reward: 0,
        onReplay: startQuizGame
      })
      return
    }

    const audioCtx = getAudioCtx()
    
    // Calculate reward
    let coinsReward = 0
    if (finalScore === 50) coinsReward = 50
    else if (finalScore === 40) coinsReward = 25
    else if (finalScore === 30) coinsReward = 12

    if (coinsReward > 0) {
      playWinSound(audioCtx)
      dispatch(updateCoins({ userId: user._id || user.id, coins: coinsReward }))
    } else {
      playLoseSound(audioCtx)
    }

    showGameResult({
      gameName: 'Đố Vui Thực Thần',
      title: coinsReward > 0 ? 'Trí Tuệ Đỉnh Cao! 🧠' : 'Cố Gắng Lần Sau! 📚',
      subtitle: coinsReward > 0
        ? `Chúc mừng bạn đã trả lời đúng xuất sắc ${finalScore / 10}/5 câu hỏi!`
        : `Bạn chỉ trả lời đúng ${finalScore / 10}/5 câu hỏi. Hãy trau dồi thêm kiến thức nhé!`,
      isWin: coinsReward > 0,
      stats: [
        { label: 'Điểm số', value: `${finalScore}đ` },
        { label: 'Số câu đúng', value: `${finalScore / 10}/5` },
        { label: 'Xu thưởng nhận', value: coinsReward > 0 ? `+${coinsReward} Xu` : '0 Xu' }
      ],
      reward: coinsReward,
      onReplay: startQuizGame
    })
  }

  useEffect(() => {
    let timer
    if (quizState === 'playing' && quizSelectedOption === null) {
      timer = setInterval(() => {
        setQuizTimeLeft(prev => {
          const audioCtx = getAudioCtx()
          if (prev <= 1) {
            clearInterval(timer)
            playIncorrectSound(audioCtx)
            
            const currentQuestion = quizQuestions[quizCurrentIndex]
            const historyItem = {
              question: currentQuestion.question,
              options: currentQuestion.options,
              correctAnswer: currentQuestion.answer,
              selectedAnswer: -1
            }
            
            setQuizHistory(h => [...h, historyItem])
            setQuizSelectedOption(-1)

            setTimeout(() => {
              advanceQuiz(quizScore)
            }, 1500)
            
            return 0
          }

          if (prev <= 6) {
            playTickSound(audioCtx)
          }

          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [quizState, quizCurrentIndex, quizSelectedOption, quizQuestions, quizScore])

  const getAudioCtx = () => {
    if (!window.globalAudioCtx) window.globalAudioCtx = createAudioContext();
    if (window.globalAudioCtx?.state === 'suspended') window.globalAudioCtx.resume();
    return window.globalAudioCtx;
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/')
      toast.error('Vui lòng đăng nhập để săn Xu!')
    }
  }, [isAuthenticated, navigate])

    const lastCheckIn = localStorage.getItem(`daily_checkin_${user?._id || user?.id}`);
    const today = new Date().toDateString();
    const canCheckIn = lastCheckIn !== today;

    const handleCheckIn = () => {
      if (!canCheckIn) return;
      dispatch(updateCoins({ userId: user._id || user.id, spins: 1 }))
      localStorage.setItem(`daily_checkin_${user._id || user.id}`, today);
      toast.success('🎁 Điểm danh thành công! Nhận 1 lượt quay miễn phí.')
    }

  const handleSpin = () => {
    const currentSpins = user?.spins || 0;
    if (currentSpins <= 0) {
      toast.error('Bạn đã hết lượt quay! Hãy đặt món để nhận thêm lượt nhé.')
      return
    }
    
    setIsSpinning(true)
    
    // Deduct 1 spin immediately
    dispatch(updateCoins({ userId: user._id || user.id, spins: -1 }))
    
    const audioCtx = getAudioCtx();
    
    const spinDuration = 4000;
    const startTime = Date.now();
    const tick = () => {
      let elapsed = Date.now() - startTime;
      if (elapsed < spinDuration - 100) {
        playTickSound(audioCtx);
        let nextTick = 30 + Math.pow(elapsed / spinDuration, 2) * 300; 
        setTimeout(tick, nextTick);
      }
    };
    tick();

    // Calculate random prize with weighted probability
    const rand = Math.random() * 100;
    let prizeIndex = 0;
    let cumulative = 0;
    for (let i = 0; i < SPIN_PROBABILITIES.length; i++) {
      cumulative += SPIN_PROBABILITIES[i];
      if (rand <= cumulative) {
        prizeIndex = i;
        break;
      }
    }
    
    const prize = SPIN_PRIZES[prizeIndex]
    
    // Calculate rotation: multiple full spins + angle to stop at prize
    // 360 / 6 segments = 60 degrees per segment.
    // To land on prizeIndex, we need the pointer (at top, 0 deg) to point to the segment.
    const segmentAngle = 360 / SPIN_PRIZES.length
    const targetAngle = 360 - (prizeIndex * segmentAngle) - (segmentAngle / 2)
    
    const totalRotation = rotation + 1800 + targetAngle + (Math.random() * 20 - 10) // 5 full spins + target + random offset
    
    setRotation(totalRotation)
    
    setTimeout(() => {
      setIsSpinning(false)
      setPrizeModal(prize)
      
      // Phát âm thanh kết quả
      if (prize.type === 'coin' || prize.type === 'spin') {
        playWinSound(audioCtx);
      } else {
        playLoseSound(audioCtx);
      }
      
      if (prize.type === 'coin' && prize.value > 0) {
        dispatch(updateCoins({ userId: user._id || user.id, coins: prize.value }))
      } else if (prize.type === 'spin') {
        dispatch(updateCoins({ userId: user._id || user.id, spins: 1 }))
      }
    }, spinDuration) // Match animation duration
  }

  const handleExchangeVoucher = (voucher) => {
    const currentCoins = user?.coins || 0
    if (currentCoins < voucher.cost) {
      toast.error('Bạn không đủ Xu để đổi mã này!')
      return
    }
    
    // Deduct coins and add voucher to user profile in DB
    dispatch(updateCoins({ 
      userId: user._id || user.id, 
      coins: -voucher.cost,
      addVoucher: voucher.code
    }))
    
    toast.success('Đổi mã giảm giá thành công! Mã đã được lưu vào Kho Voucher của bạn.', { icon: '🎉', duration: 4000 })
  }

  const handleOpenBox = (index) => {
    if (boxState !== 'idle') return;
    const currentCoins = user?.coins || 0;
    if (currentCoins < 50) {
      toast.error('Cần ít nhất 50 Xu để tham gia cuộc chơi khốc liệt này!');
      return;
    }
    
    const audioCtx = getAudioCtx();
    dispatch(updateCoins({ userId: user._id || user.id, coins: -50 }));
    
    // THUẬT TOÁN "HÚT MÁU": Tỷ lệ thua 90%!
    const isWin = Math.random() < 0.10; // Chỉ 10% cơ hội thắng
    let wonPrize;
    
    if (isWin) {
      // 90% của cái 10% thắng đó là giải cùi (20 Xu), 10% là Jackpot 500 Xu
      wonPrize = Math.random() < 0.9 
        ? { label: '20 Xu (Lỗ)', value: 20, icon: '🪙' } 
        : { label: '500 Xu (Jackpot)', value: 500, icon: '💎' };
    } else {
      // Thua trắng hoặc... trừ thêm tiền!
      const loseType = Math.random();
      if (loseType < 0.8) {
        wonPrize = { label: 'Trống rỗng', value: 0, icon: '💨' };
      } else {
        wonPrize = { label: 'Bị Cướp -20 Xu', value: -20, icon: '💸' };
      }
    }
    
    // Đổ phần thưởng vào 3 hộp sao cho 2 hộp còn lại cực kỳ mọng nước (để gây ức chế)
    const juicyPrizes = [
      { label: '500 Xu', value: 500, icon: '💎' },
      { label: '200 Xu', value: 200, icon: '💰' },
      { label: '100 Xu', value: 100, icon: '🪙' }
    ];
    
    const roundPrizes = [null, null, null];
    roundPrizes[index] = wonPrize;
    
    for(let i = 0; i < 3; i++) {
      if(i !== index) {
        const jp = juicyPrizes.splice(Math.floor(Math.random() * juicyPrizes.length), 1)[0];
        roundPrizes[i] = jp;
      }
    }
    
    setBoxPrizes(roundPrizes);
    setSelectedBox(index);
    setBoxState('opened');
    
    setTimeout(() => {
      if (wonPrize.value > 0) {
        playWinSound(audioCtx);
        dispatch(updateCoins({ userId: user._id || user.id, coins: wonPrize.value }));
        toast.success(wonPrize.value === 500 ? 'OMG TRÚNG JACKPOT!!!' : `May quá, vớt vát được ${wonPrize.label}`, { icon: wonPrize.icon });
      } else {
        playLoseSound(audioCtx);
        if (wonPrize.value < 0) {
          dispatch(updateCoins({ userId: user._id || user.id, coins: wonPrize.value }));
          toast.error(`Đen thôi đỏ quên đi! ${wonPrize.label}`, { icon: wonPrize.icon });
        } else {
          toast.error('Trống rỗng! Quá tiếc, hộp bên cạnh có 500 Xu kìa!', { icon: '💨' });
        }
      }
    }, 600);
  };
  
  const resetBox = () => {
    setBoxState('idle');
    setSelectedBox(null);
    setBoxPrizes([null, null, null]);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-300 pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="text-primary-500 hover:underline text-sm mb-6 inline-block">← Về trang chủ</Link>
        
        {/* Header Banner */}
        <div className="bg-gradient-primary rounded-3xl p-6 sm:p-10 text-white shadow-glow mb-8 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-3xl font-display font-bold flex items-center gap-2">
              <FiGift /> Săn Xu & Đổi Quà
            </h1>
            <p className="mt-2 text-white/80">Chơi vòng quay may mắn mỗi ngày để nhận Xu và đổi các mã giảm giá cực khủng!</p>
          </div>
          
          <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 text-center shrink-0 w-full sm:w-auto flex flex-col justify-center">
            <p className="text-sm font-semibold mb-1">Số Xu của bạn</p>
            <p className="text-4xl font-bold text-yellow-300 drop-shadow-md mb-3">
              🪙 {user?.coins || 0}
            </p>
            <button 
              onClick={handleCheckIn}
              disabled={!canCheckIn}
              className={`py-2 px-4 rounded-xl text-sm font-bold transition-colors ${canCheckIn ? 'bg-white text-primary-600 hover:bg-gray-100' : 'bg-white/30 text-white cursor-not-allowed'}`}
            >
              {canCheckIn ? '📅 Điểm danh nhận lượt' : '✅ Đã điểm danh hôm nay'}
            </button>
            <button 
              onClick={() => dispatch(updateCoins({ userId: user._id || user.id, coins: 999999 }))} 
              className="mt-2 px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full hover:bg-white/30 transition-colors"
            >
              Hack vô hạn Xu 🤫
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Wheel of Fortune Section */}
          <div className="bg-white dark:bg-dark-100 rounded-3xl p-6 sm:p-8 shadow-card flex flex-col items-center">
            <h2 className="text-xl font-bold dark:text-white mb-2 text-center">Vòng Quay May Mắn</h2>
            <div className="text-center mb-8 flex flex-col items-center gap-2">
              <p className="text-gray-500 text-sm">Bạn còn <span className="font-bold text-primary-500 text-lg">{user?.spins || 0}</span> lượt quay</p>
              <button onClick={() => dispatch(updateCoins({ userId: user._id || user.id, spins: 999999 }))} className="px-3 py-1 bg-red-100 text-red-500 text-xs font-bold rounded-full hover:bg-red-200">
                Hack vô hạn lượt 🤫
              </button>
            </div>
            
            <div className="relative w-72 h-72 sm:w-96 sm:h-96 mb-12 mt-4">
              {/* Premium Pointer */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-30 drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)]">
                <div className="w-10 h-12 bg-gradient-to-b from-red-500 to-red-600" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }}></div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-2 bg-red-700 rounded-t-full"></div>
              </div>
              
              {/* Wheel Container with Gold Border */}
              <div className="absolute inset-0 rounded-full border-[8px] sm:border-[12px] border-yellow-400 shadow-[0_10px_25px_rgba(0,0,0,0.2),inset_0_5px_15px_rgba(0,0,0,0.4)] bg-yellow-400 z-10">
                <motion.div 
                  className="w-full h-full rounded-full overflow-hidden relative"
                  animate={{ rotate: rotation }}
                  transition={{ duration: 4, ease: [0.2, 0.8, 0.1, 1.05] }} // slightly bouncy ease
                  style={{
                    background: 'conic-gradient(#f59e0b 0 60deg, #4b5563 60deg 120deg, #10b981 120deg 180deg, #3b82f6 180deg 240deg, #8b5cf6 240deg 300deg, #ef4444 300deg 360deg)'
                  }}
                >
                  {/* Wheel Segments Text */}
                  {SPIN_PRIZES.map((prize, i) => {
                    const angle = (i * 60) + 30 - 90; // Center of segment mapped to CSS rotation
                    return (
                      <div 
                        key={i}
                        className="absolute top-1/2 left-1/2 w-[50%] h-12 -translate-y-1/2 origin-left flex items-center justify-end pr-6 sm:pr-8 text-white font-bold text-sm sm:text-base drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]"
                        style={{ transform: `rotate(${angle}deg)` }}
                      >
                        <span className="leading-tight max-w-[80%] text-right">{prize.label}</span>
                      </div>
                    )
                  })}
                  
                  {/* Inner Segment Separator Lines */}
                  {SPIN_PRIZES.map((_, i) => (
                    <div 
                      key={`line-${i}`}
                      className="absolute top-1/2 left-1/2 w-[50%] h-[2px] bg-white/30 origin-left -translate-y-1/2"
                      style={{ transform: `rotate(${(i * 60) - 90}deg)` }}
                    />
                  ))}
                </motion.div>
                
                {/* Center Pivot */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.3),inset_0_2px_5px_rgba(0,0,0,0.2)] z-20 flex items-center justify-center border-4 border-yellow-200">
                  <div className="w-4 h-4 sm:w-6 sm:h-6 bg-red-500 rounded-full shadow-inner" />
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleSpin}
              disabled={isSpinning || (user?.spins || 0) <= 0}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-transform ${isSpinning || (user?.spins || 0) <= 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-inner' : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:scale-[1.02] shadow-[0_8px_20px_rgba(245,158,11,0.4)]'}`}
            >
              {isSpinning ? 'Đang quay...' : (user?.spins || 0) > 0 ? '🎰 QUAY NGAY!' : 'HẾT LƯỢT QUAY'}
            </button>
          </div>

          {/* Voucher Exchange Section */}
          <div className="space-y-8">
            <div className="bg-white dark:bg-dark-100 rounded-3xl p-6 sm:p-8 shadow-card">
              <h2 className="text-xl font-bold dark:text-white mb-6 flex items-center gap-2">
                <FiAward className="text-yellow-500" /> Cửa Hàng Đổi Xu
              </h2>
              
              <div className="space-y-4">
                {VOUCHERS.map(voucher => (
                  <div key={voucher.id} className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-dark-200 transition-colors">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="w-16 h-16 rounded-xl bg-orange-500/10 text-orange-500 flex flex-col items-center justify-center shrink-0">
                        <span className="font-bold">{voucher.discount / 1000}K</span>
                      </div>
                      <div>
                        <h4 className="font-bold dark:text-white">{voucher.label}</h4>
                        <p className="text-xs text-gray-400">Đơn tối thiểu {formatPrice(voucher.minOrder)}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleExchangeVoucher(voucher)}
                      disabled={(user?.coins || 0) < voucher.cost}
                      className={`w-full sm:w-auto px-6 py-2 rounded-xl font-bold whitespace-nowrap transition-colors ${
                        (user?.coins || 0) < voucher.cost 
                          ? 'bg-gray-100 text-gray-400 dark:bg-gray-800' 
                          : 'bg-yellow-500 text-white hover:bg-yellow-600 shadow-lg'
                      }`}
                    >
                      {voucher.cost} Xu
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {user?.vouchers?.length > 0 && (
              <div className="bg-white dark:bg-dark-100 rounded-3xl p-6 sm:p-8 shadow-card">
                <h2 className="text-xl font-bold dark:text-white mb-4">Kho Voucher của bạn</h2>
                <div className="grid grid-cols-2 gap-4">
                  {user.vouchers.map((code, idx) => (
                    <div key={idx} className="p-3 border border-dashed border-primary-500 rounded-xl text-center bg-primary-500/5">
                      <span className="font-bold text-primary-500">{code}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-4 text-center">Các mã này đã được lưu vào Giỏ Hàng.</p>
              </div>
            )}
          </div>
        </div>

        {/* Mystery Box Game Section */}
        <div className="bg-white dark:bg-dark-100 rounded-3xl p-6 sm:p-10 shadow-card mb-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-red-600 mb-2">🩸 Hộp Quà Ma Cà Rồng</h2>
            <p className="text-gray-500">Vé vào cửa: <span className="font-bold text-red-500">50 Xu</span>. Cảnh báo: Tỷ lệ mất trắng cực cao!</p>
          </div>
          
          <div className="flex justify-center gap-4 sm:gap-8 mb-8">
            {[0, 1, 2].map((i) => (
              <div 
                key={i} 
                onClick={() => handleOpenBox(i)}
                className={`relative w-24 h-24 sm:w-32 sm:h-32 rounded-2xl cursor-pointer transition-all duration-500 ${boxState === 'idle' ? 'hover:scale-110 hover:-translate-y-2 bg-gradient-to-br from-red-400 to-red-600 shadow-[0_10px_20px_rgba(239,68,68,0.3)] animate-pulse' : 'bg-gray-100 dark:bg-dark-200'} ${boxState === 'opened' && selectedBox !== i ? 'opacity-50 grayscale scale-95' : ''} ${boxState === 'opened' && selectedBox === i ? 'scale-110 ring-4 ring-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.5)]' : ''} flex items-center justify-center`}
              >
                {boxState === 'idle' ? (
                  <span className="text-5xl sm:text-6xl drop-shadow-md">🎁</span>
                ) : (
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center justify-center text-center p-2"
                  >
                    <span className="text-3xl sm:text-4xl mb-1">{boxPrizes[i]?.icon}</span>
                    <span className={`text-xs sm:text-sm font-bold ${boxPrizes[i]?.value > 0 ? 'text-green-500' : 'text-gray-400'}`}>
                      {boxPrizes[i]?.label}
                    </span>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
          
          {boxState === 'opened' && (
            <div className="text-center">
              <button onClick={resetBox} className="bg-gradient-to-r from-red-500 to-red-700 text-white font-bold py-3 px-8 rounded-full shadow-[0_5px_15px_rgba(239,68,68,0.4)] hover:scale-105 transition-transform">
                🔄 Phục thù! (-50 Xu)
              </button>
            </div>
          )}
        </div>

        {/* Sliding Puzzle Game Section */}
        <div className="bg-white dark:bg-dark-100 rounded-3xl p-6 sm:p-10 shadow-card mb-8 border border-gray-100 dark:border-gray-800">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-orange-500 mb-2 flex items-center justify-center gap-2">
              🧩 Trò Chơi Xếp Hình Thực Thần
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Chi phí: <span className="font-bold text-orange-500">20 Xu</span>. Thắng cuộc nhận ngay <span className="font-bold text-green-500">80 Xu</span>!
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-6">
            {/* Cột chọn ảnh & hướng dẫn */}
            <div className="w-full md:w-1/3 flex flex-col gap-4">
              <div className="bg-gray-50 dark:bg-dark-200 p-4 rounded-2xl">
                <h4 className="font-bold mb-2 dark:text-white text-sm">1. Chọn món ăn ưa thích:</h4>
                <div className="flex flex-col gap-2">
                  {PUZZLE_IMAGES.map((img) => (
                    <button
                      key={img.id}
                      disabled={puzzleState === 'playing'}
                      onClick={() => {
                        setPuzzleImage(img)
                        setPuzzleBoard([0, 1, 2, 3, 4, 5, 6, 7, 8])
                        setPuzzleState('idle')
                      }}
                      className={`px-4 py-2 rounded-xl text-left text-sm font-semibold transition-all ${
                        puzzleImage.id === img.id
                          ? 'bg-gradient-primary text-white shadow-md'
                          : 'bg-white dark:bg-dark-100 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                      } disabled:opacity-50`}
                    >
                      {img.name}
                    </button>
                  ))}
                </div>
              </div>

              {puzzleState === 'playing' && (
                <div className="bg-slate-50 dark:bg-dark-200 p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">🎮 Điều khiển:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={restartPuzzleGame}
                      className="py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors shadow-sm"
                    >
                      🔄 Chơi lại
                    </button>
                    <button
                      onClick={endPuzzleGame}
                      className="py-2 px-3 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
                    >
                      🚩 Đầu hàng
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-orange-500/5 border border-orange-500/10 p-4 rounded-2xl text-xs text-orange-600 dark:text-orange-400 leading-relaxed">
                <p className="font-bold mb-1">💡 Hướng dẫn chơi:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Nhấp chuột vào mảnh ghép nằm cạnh ô trống để dịch chuyển nó vào vị trí trống.</li>
                  <li>Sắp xếp các mảnh ghép để tạo thành bức tranh hoàn chỉnh trước khi hết 60 giây.</li>
                  <li>Xem hình mẫu bên dưới hoặc số gợi ý trên từng mảnh để định hướng.</li>
                </ul>
              </div>

              {/* Hình mẫu thu nhỏ */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-bold text-gray-400">Bức tranh đích:</span>
                <img
                  src={puzzleImage.url}
                  alt="Mẫu ghép hình"
                  className="w-24 h-24 rounded-lg object-cover border border-gray-300 dark:border-gray-700 shadow-sm"
                />
              </div>
            </div>

            {/* Bàn cờ xếp hình */}
            <div className="w-72 h-72 sm:w-80 sm:h-80 bg-gray-200 dark:bg-dark-300 rounded-3xl p-3 relative overflow-hidden flex flex-col justify-between shrink-0 shadow-[inset_0_4px_10px_rgba(0,0,0,0.1)]">
              {puzzleState === 'idle' && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-xs z-20 flex flex-col items-center justify-center text-center p-4">
                  <span className="text-4xl mb-2">🧩</span>
                  <p className="text-white font-bold text-sm mb-4">Hãy thử sức cùng bức tranh {puzzleImage.name}</p>
                  <button
                    onClick={startPuzzle}
                    className="bg-gradient-primary text-white font-bold py-2.5 px-6 rounded-xl hover:scale-105 transition-transform shadow-lg"
                  >
                    Bắt đầu chơi (-20 Xu)
                  </button>
                </div>
              )}

              {puzzleState === 'won' && (
                <div className="absolute inset-0 bg-green-500/90 backdrop-blur-xs z-20 flex flex-col items-center justify-center text-center p-4 text-white">
                  <span className="text-5xl mb-2 animate-bounce">🏆</span>
                  <h3 className="text-xl font-bold mb-1">XUẤT SẮC!</h3>
                  <p className="text-sm text-white/90 mb-4">Bạn hoàn thành trong {puzzleMoves} lượt đi!</p>
                  <button
                    onClick={startPuzzle}
                    className="bg-white text-green-600 font-bold py-2.5 px-6 rounded-xl hover:scale-105 transition-transform shadow-lg"
                  >
                    Chơi tiếp (-20 Xu)
                  </button>
                </div>
              )}

              {puzzleState === 'lost' && (
                <div className="absolute inset-0 bg-red-500/90 backdrop-blur-xs z-20 flex flex-col items-center justify-center text-center p-4 text-white">
                  <span className="text-5xl mb-2">😢</span>
                  <h3 className="text-xl font-bold mb-1">Hết giờ mất rồi!</h3>
                  <p className="text-sm text-white/90 mb-4">Đừng nản chí, hãy thử sức lại nhé!</p>
                  <button
                    onClick={startPuzzle}
                    className="bg-white text-red-600 font-bold py-2.5 px-6 rounded-xl hover:scale-105 transition-transform shadow-lg"
                  >
                    Chơi lại (-20 Xu)
                  </button>
                </div>
              )}

              {/* Grid các mảnh ghép */}
              <div className="grid grid-cols-3 gap-1.5 w-full h-full">
                {puzzleBoard.map((val, idx) => {
                  if (val === 8) {
                    // Ô trống
                    return (
                      <div
                        key={`puzzle-cell-empty`}
                        className="bg-gray-300/40 dark:bg-dark-200/40 rounded-xl border border-dashed border-gray-400 dark:border-gray-600 flex items-center justify-center"
                      >
                        <span className="text-gray-400 text-xs font-bold opacity-30">Trống</span>
                      </div>
                    )
                  }
                  
                  // Tính background position cho mảnh ghép
                  const origRow = Math.floor(val / 3)
                  const origCol = val % 3
                  const bgPosX = origCol * 50
                  const bgPosY = origRow * 50
                  
                  return (
                    <motion.div
                      key={`puzzle-cell-${val}`}
                      layout
                      onClick={() => handlePuzzleClick(idx)}
                      className="cursor-pointer rounded-xl overflow-hidden border border-white/10 shadow-sm relative group active:scale-95 transition-transform"
                      style={{
                        backgroundImage: `url(${puzzleImage.url})`,
                        backgroundSize: '300% 300%',
                        backgroundPosition: `${bgPosX}% ${bgPosY}%`,
                      }}
                    >
                      {/* Số gợi ý nhỏ trên mảnh ghép */}
                      <span className="absolute bottom-1 right-2 bg-black/40 text-white text-[9px] px-1 py-0.5 rounded font-mono">
                        {val + 1}
                      </span>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Dải thông tin thời gian và lượt đi */}
          {puzzleState === 'playing' && (
            <div className="max-w-md mx-auto flex flex-col gap-2 mt-4">
              <div className="flex justify-between items-center text-sm font-semibold dark:text-white">
                <span className="flex items-center gap-1">⏰ Thời gian: <span className={`font-bold ${puzzleTime < 15 ? 'text-red-500 animate-pulse' : 'text-orange-500'}`}>{puzzleTime}s</span></span>
                <span>🧩 Lượt đi: <span className="text-primary-500 font-bold">{puzzleMoves}</span></span>
              </div>
              {/* Progress bar thời gian */}
              <div className="w-full h-2.5 bg-gray-100 dark:bg-dark-200 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${puzzleTime < 15 ? 'bg-red-500' : puzzleTime < 30 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  initial={{ width: '100%' }}
                  animate={{ width: `${(puzzleTime / 60) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Gourmet Monkey Climber Game Section */}
        <div className="bg-white dark:bg-dark-100 rounded-3xl p-6 sm:p-10 shadow-card mb-8 border border-gray-100 dark:border-gray-800">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-green-600 mb-2 flex items-center justify-center gap-2">
              🐒 Khỉ Leo Cây Thực Thần
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Chi phí: <span className="font-bold text-green-600">20 Xu</span>. Leo thật cao để nhận thưởng lên tới <span className="font-bold text-yellow-500">100 Xu</span>!
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-6">
            {/* Left Side: Score & Instructions */}
            <div className="w-full md:w-1/3 flex flex-col gap-4">
              <div className="bg-gray-50 dark:bg-dark-200 p-4 rounded-2xl">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold dark:text-white">Điểm leo cây:</span>
                  <span className="text-2xl font-bold text-green-500">{monkeyScore}</span>
                </div>
                <div className="text-xs text-gray-400 space-y-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold dark:text-white">Mốc thưởng Xu:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      monkeyDifficulty === 'easy' ? 'bg-green-100 text-green-700' :
                      monkeyDifficulty === 'normal' ? 'bg-blue-100 text-blue-700' :
                      monkeyDifficulty === 'hard' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      Chế độ: {
                        monkeyDifficulty === 'easy' ? 'Dễ' :
                        monkeyDifficulty === 'normal' ? 'Vừa' :
                        monkeyDifficulty === 'hard' ? 'Khó' : 'Cực hạn'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>🌟 Đạt 50đ:</span>
                    <span className="font-bold text-yellow-500">
                      +{monkeyDifficulty === 'easy' ? 15 : monkeyDifficulty === 'normal' ? 30 : monkeyDifficulty === 'hard' ? 50 : 80} Xu
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>🔥 Đạt 100đ:</span>
                    <span className="font-bold text-yellow-500">
                      +{monkeyDifficulty === 'easy' ? 30 : monkeyDifficulty === 'normal' ? 60 : monkeyDifficulty === 'hard' ? 100 : 180} Xu
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>🏆 Đạt 200đ:</span>
                    <span className="font-bold text-yellow-500">
                      +{monkeyDifficulty === 'easy' ? 50 : monkeyDifficulty === 'normal' ? 100 : monkeyDifficulty === 'hard' ? 200 : 350} Xu
                    </span>
                  </div>
                </div>
              </div>

              {monkeyState === 'playing' && (
                <div className="bg-slate-50 dark:bg-dark-200 p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">🎮 Điều khiển:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={restartMonkeyGame}
                      className="py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors shadow-sm"
                    >
                      🔄 Chơi lại
                    </button>
                    <button
                      onClick={endMonkeyGame}
                      className="py-2 px-3 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
                    >
                      🚩 Đầu hàng
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-green-500/5 border border-green-500/10 p-4 rounded-2xl text-xs text-green-600 dark:text-green-400 leading-relaxed">
                <p className="font-bold mb-1">💡 Hướng dẫn chơi:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Nhấn phím Mũi tên Trái / Phải</strong> hoặc các phím <strong>A / D</strong> để điều khiển chú khỉ nhảy qua lại.</li>
                  <li>Hoặc <strong>Click vào 2 nút ảo (◀ / ▶)</strong> ở hai góc bên dưới màn hình game.</li>
                  <li><strong>Tuyệt đối tránh chướng ngại vật</strong> (Ong vò vẽ 🐝, Sầu riêng gai 🥭) ở các nhánh cây phía trên!</li>
                  <li>Đớp trái cây để nhận điểm thưởng lớn: Chuối 🍌 (+5đ, +12 năng lượng), Dừa 🥥 (+10đ, +20 năng lượng), Xu vàng 🪙 (+2đ, +15 năng lượng và <strong>cộng 1 Xu thật</strong> trực tiếp vào Ví!).</li>
                  <li><strong>Chú ý thanh năng lượng:</strong> Năng lượng tụt liên tục theo thời gian, mỗi bước nhảy thành công giúp hồi lại một lượng năng lượng!</li>
                </ul>
              </div>
            </div>

            {/* Right Side: The Vertically Scrolling Tree Board */}
            <div className={`relative w-72 sm:w-80 h-[380px] bg-gradient-to-b from-sky-400 to-sky-600 dark:from-slate-800 dark:to-slate-900 rounded-3xl flex flex-col justify-between shrink-0 overflow-hidden select-none transition-all duration-200 ${
              monkeyIsWarning 
                ? 'border-red-500 shadow-[inset_0_0_20px_rgba(239,68,68,0.6),0_0_15px_rgba(239,68,68,0.4)] animate-pulse' 
                : 'border-slate-200 dark:border-slate-800 shadow-[inset_0_4px_10px_rgba(0,0,0,0.15)] border'
            }`}>
              {/* Giant Tree Trunk */}
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-8 bg-amber-800/80 shadow-[inset_-2px_0_5px_rgba(0,0,0,0.3)] z-0" />

              {/* Danger Vignette Overlay */}
              {monkeyState === 'playing' && monkeyIsWarning && (
                <div className="absolute inset-0 bg-red-600/10 pointer-events-none z-10 border-2 border-red-500 animate-pulse rounded-3xl" />
              )}

              {/* Combo Badge Display */}
              {monkeyState === 'playing' && monkeyCombo >= 3 && (
                <motion.div
                  key={`combo-${monkeyCombo}`}
                  initial={{ scale: 0.6, y: -10, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  className="absolute top-12 left-1/2 -translate-x-1/2 bg-yellow-500/90 text-slate-900 px-3 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase shadow-[0_0_10px_rgba(234,179,8,0.6)] z-10 flex items-center gap-1 border border-yellow-300"
                >
                  🔥 COMBO x{monkeyCombo}!
                </motion.div>
              )}

              {/* Status Header */}
              {monkeyState === 'playing' && (
                <>
                  {/* Score Tag */}
                  <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold z-10 flex items-center gap-1">
                    Điểm: <span className="text-green-400 font-extrabold">{monkeyScore}</span>
                  </div>

                  {/* Energy Bar */}
                  <div className="absolute top-3 left-3 w-36 h-5 bg-black/30 backdrop-blur-sm rounded-full overflow-hidden z-10 p-0.5 border border-white/10">
                    <motion.div
                      className={`h-full rounded-full ${
                        monkeyEnergy < 30 
                          ? 'bg-gradient-to-r from-red-500 to-orange-500 animate-pulse' 
                          : monkeyEnergy < 60 
                            ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' 
                            : 'bg-gradient-to-r from-green-400 to-emerald-500'
                      }`}
                      style={{ width: `${monkeyEnergy}%` }}
                      transition={{ duration: 0.1 }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                      ⚡ NĂNG LƯỢNG: {monkeyEnergy}%
                    </span>
                  </div>
                </>
              )}

              {/* Idle Overlay */}
              {monkeyState === 'idle' && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-center p-4">
                  <span className="text-5xl mb-2 animate-bounce" style={{ animationDuration: '3s' }}>🐒</span>
                  <p className="text-white font-extrabold text-sm mb-2 max-w-[220px]">Thử thách leo cây thực thần cực kỳ gay cấn!</p>
                  
                  {/* Difficulty Selector */}
                  <div className="w-full max-w-[240px] mb-4 bg-white/10 backdrop-blur-md p-1.5 rounded-xl border border-white/20 flex flex-col gap-1">
                    <span className="text-[9px] text-white/70 font-black uppercase tracking-wider">Chọn độ khó:</span>
                    <div className="grid grid-cols-2 gap-1">
                      {[
                        { id: 'easy', label: '🟢 Dễ', desc: 'Nhẹ nhàng' },
                        { id: 'normal', label: '🔵 Vừa', desc: 'Cân bằng' },
                        { id: 'hard', label: '🟡 Khó', desc: 'Chóng mặt' },
                        { id: 'extreme', label: '🔴 Cực hạn', desc: 'Siêu reflex' }
                      ].map(d => (
                        <button
                          key={d.id}
                          onClick={() => setMonkeyDifficulty(d.id)}
                          className={`py-1 px-1 rounded-lg text-[10px] font-black transition-all ${
                            monkeyDifficulty === d.id
                              ? 'bg-white text-emerald-800 shadow-md scale-102 border border-white'
                              : 'bg-black/25 text-white/80 hover:bg-black/35 hover:text-white border border-transparent'
                          }`}
                        >
                          <div>{d.label}</div>
                          <div className="text-[7px] opacity-65 font-normal leading-none mt-0.5">{d.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={startMonkeyClimb}
                    className="bg-gradient-primary text-white font-bold py-2.5 px-6 rounded-xl hover:scale-105 transition-transform shadow-lg text-sm w-full max-w-[200px]"
                  >
                    Bắt đầu leo (-20 Xu)
                  </button>
                </div>
              )}

              {/* Game Over Overlay */}
              {monkeyState === 'gameover' && (
                <div className="absolute inset-0 bg-red-950/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-center p-4 text-white">
                  <span className="text-5xl mb-2">😢</span>
                  <h3 className="text-xl font-black mb-1 text-red-400">Rớt đài mất rồi!</h3>
                  <p className="text-sm text-white/90 mb-1">Điểm số đạt được: <span className="font-bold text-yellow-400 text-lg">{monkeyScore}</span></p>
                  
                  {/* Quick change difficulty */}
                  <div className="w-full max-w-[240px] my-3 bg-white/5 backdrop-blur-md p-1.5 rounded-xl border border-white/10 flex flex-col gap-1">
                    <span className="text-[9px] text-white/60 font-black uppercase tracking-wider">Đổi độ khó nhanh:</span>
                    <div className="grid grid-cols-4 gap-1">
                      {[
                        { id: 'easy', label: 'Dễ' },
                        { id: 'normal', label: 'Vừa' },
                        { id: 'hard', label: 'Khó' },
                        { id: 'extreme', label: 'Cực hạn' }
                      ].map(d => (
                        <button
                          key={d.id}
                          onClick={() => setMonkeyDifficulty(d.id)}
                          className={`py-1 px-0.5 rounded-md text-[9px] font-black transition-all ${
                            monkeyDifficulty === d.id
                              ? 'bg-red-500 text-white shadow-md'
                              : 'bg-black/25 text-white/70 hover:bg-black/35'
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={startMonkeyClimb}
                    className="bg-white text-red-900 font-extrabold py-2.5 px-6 rounded-xl hover:scale-105 transition-transform shadow-lg text-sm w-full max-w-[200px]"
                  >
                    Leo lại (-20 Xu)
                  </button>
                </div>
              )}

              {/* Tree Branches Layer */}
              {monkeyState === 'playing' && (
                <div className="absolute inset-0 w-full h-full pointer-events-none">
                  {treeLevels.slice(0, 5).map((lvl, index) => {
                    const bottomPx = 40 + index * 68
                    return (
                      <div
                        key={lvl.id}
                        className="absolute left-0 right-0 transition-all duration-300 flex items-center justify-center"
                        style={{ bottom: `${bottomPx}px`, height: '40px' }}
                      >
                        {/* 1. Left Obstacle Branch (Only rendered if obstacle is on the left) */}
                        {lvl.obstacleSide === 'left' && (
                          <div className="absolute right-[calc(50%+10px)] h-2.5 w-14 bg-amber-900/90 rounded-l-full flex items-center justify-start pl-1 shadow-md">
                            {/* Leaves */}
                            <div className="w-4 h-4 bg-emerald-600 rounded-full -mt-2 -ml-1 opacity-90 border border-emerald-500/30" />
                            {/* Obstacle */}
                            {index > 0 && (
                              <div className="absolute -top-6 left-2 text-2xl select-none animate-bounce" style={{ animationDelay: `${lvl.id * 80}ms` }}>
                                {lvl.obstacleType === 'durian' ? '🥭' : '🐝'}
                              </div>
                            )}
                          </div>
                        )}

                        {/* 2. Right Obstacle Branch (Only rendered if obstacle is on the right) */}
                        {lvl.obstacleSide === 'right' && (
                          <div className="absolute left-[calc(50%+10px)] h-2.5 w-14 bg-amber-900/90 rounded-r-full flex items-center justify-end pr-1 shadow-md">
                            {/* Leaves */}
                            <div className="w-4 h-4 bg-emerald-600 rounded-full -mt-2 -mr-1 opacity-90 border border-emerald-500/30" />
                            {/* Obstacle */}
                            {index > 0 && (
                              <div className="absolute -top-6 right-2 text-2xl select-none animate-bounce" style={{ animationDelay: `${lvl.id * 80}ms` }}>
                                {lvl.obstacleType === 'durian' ? '🥭' : '🐝'}
                              </div>
                            )}
                          </div>
                        )}

                        {/* 3. Floating Left Reward (No branch, floats in the air) */}
                        {lvl.rewardSide === 'left' && lvl.rewardType !== 'none' && index > 0 && (
                          <div className="absolute right-[calc(50%+22px)] -top-4 text-2xl select-none animate-bounce" style={{ animationDelay: `${lvl.id * 80}ms` }}>
                            {lvl.rewardType === 'banana' ? '🍌' : lvl.rewardType === 'coconut' ? '🥥' : '🪙'}
                          </div>
                        )}

                        {/* 4. Floating Right Reward (No branch, floats in the air) */}
                        {lvl.rewardSide === 'right' && lvl.rewardType !== 'none' && index > 0 && (
                          <div className="absolute left-[calc(50%+22px)] -top-4 text-2xl select-none animate-bounce" style={{ animationDelay: `${lvl.id * 80}ms` }}>
                            {lvl.rewardType === 'banana' ? '🍌' : lvl.rewardType === 'coconut' ? '🥥' : '🪙'}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* The Monkey 🐒 */}
              {monkeyState === 'playing' && (
                <motion.div
                  key={`${monkeyScore}-${monkeyPosition}`}
                  initial={{ y: 20, scale: 0.8, opacity: 0.5 }}
                  animate={{ y: 0, scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 14 }}
                  className="absolute z-10 text-4xl select-none drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)] filter-none"
                  style={{
                    bottom: '40px',
                    left: monkeyPosition === 'left' ? 'calc(50% - 64px)' : 'calc(50% + 24px)',
                  }}
                >
                  🐒
                </motion.div>
              )}

              {/* Touch Controls (Virtual Buttons) */}
              {monkeyState === 'playing' && (
                <div className="absolute bottom-4 left-0 right-0 px-4 flex justify-between z-20 pointer-events-auto">
                  <button
                    onClick={() => handleMonkeyMove('left')}
                    className="w-12 h-12 rounded-full bg-white/20 active:bg-white/40 active:scale-90 flex items-center justify-center text-white backdrop-blur-md border border-white/20 text-xl font-bold shadow-lg transition-all"
                  >
                    ◀
                  </button>
                  <button
                    onClick={() => handleMonkeyMove('right')}
                    className="w-12 h-12 rounded-full bg-white/20 active:bg-white/40 active:scale-90 flex items-center justify-center text-white backdrop-blur-md border border-white/20 text-xl font-bold shadow-lg transition-all"
                  >
                    ▶
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Block Blast Game Section */}
        <div className="bg-white dark:bg-dark-100 rounded-3xl p-6 sm:p-10 shadow-card mb-8 border border-gray-100 dark:border-gray-800">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-orange-500 mb-2 flex items-center justify-center gap-2">
              🧱 Trận Chiến Khối Thực Thần (Block Blast)
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Chi phí: <span className="font-bold text-orange-500">20 Xu</span>. Bùng nổ thạch để nhận thưởng tới <span className="font-bold text-green-500">100 Xu</span>!
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-6">
            {/* Left Side: Score & Info / Instructions */}
            <div className="w-full md:w-1/3 flex flex-col gap-4">
              <div className="bg-gray-50 dark:bg-dark-200 p-4 rounded-2xl">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold dark:text-white">Điểm số:</span>
                  <span className="text-2xl font-bold text-primary-500">{blockScore}</span>
                </div>
                <div className="text-xs text-gray-400 space-y-1">
                  <p className="font-semibold dark:text-white mb-1">Mốc thưởng Xu:</p>
                  <div className="flex justify-between">
                    <span>🌟 Đạt 100đ:</span>
                    <span className="font-bold text-yellow-500">+30 Xu</span>
                  </div>
                  <div className="flex justify-between">
                    <span>🔥 Đạt 200đ:</span>
                    <span className="font-bold text-yellow-500">+60 Xu</span>
                  </div>
                  <div className="flex justify-between">
                    <span>🏆 Đạt 350đ:</span>
                    <span className="font-bold text-yellow-500">+100 Xu</span>
                  </div>
                </div>
              </div>

              {blockGameState === 'playing' && (
                <div className="bg-slate-50 dark:bg-dark-200 p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">🎮 Điều khiển:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={restartBlockBlastGame}
                      className="py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors shadow-sm"
                    >
                      🔄 Chơi lại
                    </button>
                    <button
                      onClick={endBlockBlastGame}
                      className="py-2 px-3 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
                    >
                      🚩 Đầu hàng
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-orange-500/5 border border-orange-500/10 p-4 rounded-2xl text-xs text-orange-600 dark:text-orange-400 leading-relaxed">
                <p className="font-bold mb-1">💡 Hướng dẫn chơi:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Kéo thả hoặc Bấm chọn</strong> một khối thạch bất kỳ ở hàng dưới.</li>
                  <li><strong>Thả hoặc Nhấp vào lưới 8x8</strong> để đặt khối thạch (dựa trên ô gốc góc trên bên trái của khối).</li>
                  <li>Lấp đầy bất kỳ hàng ngang hoặc cột dọc nào để kích nổ (blast) và giải phóng không gian bàn cờ!</li>
                  <li>Đặt mỗi thạch: +1đ/ô. Nổ mỗi hàng/cột: +15đ.</li>
                  <li>Hệ thống tự động phát hiện thua khi không còn vị trí hợp lệ nào cho các khối thạch hiện có!</li>
                </ul>
              </div>
            </div>

            {/* Right Side: The 8x8 Grid */}
            <div className="relative w-80 h-80 sm:w-96 sm:h-96 bg-gray-900/10 dark:bg-gray-900/40 rounded-3xl p-3 shadow-[inset_0_4px_10px_rgba(0,0,0,0.1)] border border-slate-250 dark:border-slate-800 flex flex-col justify-between shrink-0 overflow-hidden">
              
              {/* Idle Overlay */}
              {blockGameState === 'idle' && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-xs z-20 flex flex-col items-center justify-center text-center p-4">
                  <span className="text-4xl mb-2">🧱</span>
                  <p className="text-white font-bold text-sm mb-4">Thử thách xếp thạch thăng hoa trí tuệ!</p>
                  <button
                    onClick={startBlockBlast}
                    className="bg-gradient-primary text-white font-bold py-2.5 px-6 rounded-xl hover:scale-105 transition-transform shadow-lg"
                  >
                    Bắt đầu chơi (-20 Xu)
                  </button>
                </div>
              )}

              {/* Game Over Overlay */}
              {blockGameState === 'gameover' && (
                <div className="absolute inset-0 bg-red-950/90 backdrop-blur-xs z-20 flex flex-col items-center justify-center text-center p-4 text-white">
                  <span className="text-5xl mb-2 animate-bounce">😢</span>
                  <h3 className="text-xl font-bold mb-1 text-red-400">Không còn nước đi!</h3>
                  <p className="text-sm text-white/90 mb-1">Điểm số đạt được: <span className="font-bold text-yellow-400 text-lg">{blockScore}</span></p>
                  <p className="text-xs text-white/70 mb-4">
                    {blockScore >= 350 ? 'Quá khủng khiếp! Nhận ngay 100 Xu!' : blockScore >= 200 ? 'Rất tuyệt vời! Nhận ngay 60 Xu!' : blockScore >= 100 ? 'Khá tốt! Nhận ngay 30 Xu!' : 'Chúc bạn may mắn lần sau!'}
                  </p>
                  <button
                    onClick={startBlockBlast}
                    className="bg-white text-red-900 font-bold py-2.5 px-6 rounded-xl hover:scale-105 transition-transform shadow-lg"
                  >
                    Chơi lại (-20 Xu)
                  </button>
                </div>
              )}

              {/* Grid 8x8 */}
              <div className="grid grid-cols-8 gap-1 w-full h-full">
                {Array(8).fill(null).map((_, r) => (
                  Array(8).fill(null).map((_, c) => {
                    const cellItem = blockGrid[r][c]
                    
                    // Tính xem ô này có nằm trong preview của khối thạch đang chọn không
                    let isPreview = false
                    let previewColor = ''
                    let previewIcon = ''
                    
                    if (selectedBlockIdx !== null && hoveredCell !== null) {
                      const selectedBlock = blockChoices[selectedBlockIdx]
                      if (selectedBlock) {
                        const [hr, hc] = hoveredCell
                        if (canPlaceBlock(blockGrid, selectedBlock, hr, hc)) {
                          isPreview = selectedBlock.coords.some(([offsetR, offsetC]) => (hr + offsetR === r && hc + offsetC === c))
                          previewColor = selectedBlock.color
                          previewIcon = selectedBlock.icon
                        }
                      }
                    }

                    return (
                      <div
                        key={`block-cell-${r}-${c}`}
                        onClick={() => handleGridCellClick(r, c)}
                        onMouseEnter={() => {
                          if (selectedBlockIdx !== null) setHoveredCell([r, c])
                        }}
                        onMouseLeave={() => {
                          if (selectedBlockIdx !== null) setHoveredCell(null)
                        }}
                        onDragOver={(e) => {
                          e.preventDefault()
                          if (selectedBlockIdx !== null) setHoveredCell([r, c])
                        }}
                        onDragLeave={() => {
                          if (selectedBlockIdx !== null) setHoveredCell(null)
                        }}
                        onDrop={(e) => {
                          e.preventDefault()
                          handleGridCellClick(r, c)
                        }}
                        className={`aspect-square rounded-lg flex items-center justify-center text-sm sm:text-base transition-all cursor-pointer relative overflow-hidden select-none ${
                          cellItem !== null
                            ? `bg-gradient-to-br ${cellItem.color} shadow-md active:scale-95`
                            : isPreview
                              ? `bg-gradient-to-br ${previewColor} opacity-50 border border-dashed border-white animate-pulse`
                              : 'bg-slate-200/50 dark:bg-slate-800/40 hover:bg-slate-300/50 dark:hover:bg-slate-700/40'
                        }`}
                      >
                        {cellItem !== null ? (
                          <span>{cellItem.icon}</span>
                        ) : isPreview ? (
                          <span className="opacity-40">{previewIcon}</span>
                        ) : null}
                      </div>
                    )
                  })
                ))}
              </div>
            </div>
          </div>

          {/* Block Choices Area */}
          {blockGameState === 'playing' && (
            <div className="mt-8 pt-6 border-t border-gray-150 dark:border-slate-800">
              <p className="text-center text-xs font-bold text-gray-400 dark:text-gray-500 mb-4 uppercase tracking-wider">
                👉 Chọn một khối thạch bên dưới để bắt đầu đặt:
              </p>
              <div className="flex justify-center items-center gap-6 sm:gap-10">
                {blockChoices.map((block, idx) => {
                  if (block === null) {
                    return (
                      <div
                        key={`block-choice-empty-${idx}`}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center opacity-30 text-xs font-bold text-gray-400 select-none"
                      >
                        Đã đặt
                      </div>
                    )
                  }

                  let maxR = 0, maxC = 0
                  block.coords.forEach(([r, c]) => {
                    if (r > maxR) maxR = r
                    if (c > maxC) maxC = c
                  })
                  
                  const rows = maxR + 1
                  const cols = maxC + 1
                  const blockGridArray = Array(rows).fill(null).map(() => Array(cols).fill(false))
                  block.coords.forEach(([r, c]) => {
                    blockGridArray[r][c] = true
                  })

                  const isSelected = selectedBlockIdx === idx
                  return (
                    <div
                      key={`block-choice-${idx}`}
                      draggable
                      onDragStart={() => {
                        setSelectedBlockIdx(idx)
                      }}
                      onClick={() => {
                        setSelectedBlockIdx(isSelected ? null : idx)
                      }}
                      className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-300 ${
                        isSelected 
                          ? 'bg-orange-500/10 border-2 border-orange-500 shadow-md scale-110' 
                          : 'bg-white dark:bg-dark-100 hover:bg-slate-50 dark:hover:bg-slate-200/5 border border-slate-200 dark:border-slate-800 shadow-sm hover:scale-105'
                      }`}
                    >
                      <div 
                        className="grid gap-0.5 sm:gap-1 p-2"
                        style={{
                          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
                          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`
                        }}
                      >
                        {Array(rows).fill(null).map((_, r) => (
                          Array(cols).fill(null).map((_, c) => {
                            const hasCell = blockGridArray[r][c]
                            return (
                              <div
                                key={`mini-cell-${r}-${c}`}
                                className={`w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 rounded flex items-center justify-center text-[10px] sm:text-xs select-none ${
                                  hasCell 
                                    ? `bg-gradient-to-br ${block.color} text-white shadow-sm` 
                                    : 'bg-transparent'
                                }`}
                              >
                                {hasCell ? block.icon : ''}
                              </div>
                            )
                          })
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Gourmet Trivia Game Section */}
        <div className="bg-white dark:bg-dark-100 rounded-3xl p-6 sm:p-10 shadow-card mb-8 border border-gray-100 dark:border-gray-800">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-violet-600 dark:text-violet-400 mb-2 flex items-center justify-center gap-2">
              🧠 Đố Vui Thực Thần (Gourmet Trivia)
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Chi phí: <span className="font-bold text-violet-600">10 Xu</span>. Thử tài am hiểu dinh dưỡng và ẩm thực để nhận tới <span className="font-bold text-yellow-500">50 Xu</span>!
            </p>
          </div>

          {quizState === 'idle' && (
            <div className="bg-gradient-to-br from-violet-600 to-indigo-700 text-white rounded-3xl p-6 text-center shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500/30 rounded-full blur-3xl pointer-events-none" />
              
              <span className="text-5xl block mb-3 animate-bounce" style={{ animationDuration: '4s' }}>🧠</span>
              <h3 className="text-xl font-bold mb-2">Thách Thức Trí Tuệ Thực Thần</h3>
              <p className="text-sm text-white/80 max-w-md mx-auto mb-6">
                Vượt qua 5 câu hỏi ngẫu nhiên trong vòng 15 giây mỗi câu về ẩm thực và chế độ dinh dưỡng lành mạnh để khẳng định danh hiệu Thực Thần!
              </p>

              <div className="bg-black/20 p-4 rounded-2xl max-w-sm mx-auto mb-6 text-left text-xs space-y-2 border border-white/10">
                <div className="flex justify-between">
                  <span>🏆 Đúng cả 5 câu:</span>
                  <span className="font-bold text-yellow-300">Nhận ngay 50 Xu</span>
                </div>
                <div className="flex justify-between">
                  <span>🌟 Đúng 4 câu:</span>
                  <span className="font-bold text-yellow-300">Nhận ngay 25 Xu</span>
                </div>
                <div className="flex justify-between">
                  <span>✨ Đúng 3 câu:</span>
                  <span className="font-bold text-yellow-300">Nhận ngay 12 Xu</span>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>❌ Đúng dưới 3 câu:</span>
                  <span>Không được thưởng Xu</span>
                </div>
              </div>

              <button
                onClick={startQuizGame}
                className="bg-white text-indigo-700 font-extrabold py-3 px-8 rounded-2xl hover:scale-105 transition-transform shadow-xl active:scale-98"
              >
                Bắt đầu đố vui (-10 Xu)
              </button>
            </div>
          )}

          {quizState === 'playing' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center text-sm font-semibold dark:text-white">
                <span className="flex items-center gap-2">
                  Câu hỏi: <span className="text-violet-500 font-extrabold text-lg">{quizCurrentIndex + 1}/5</span>
                </span>
                <span className="flex items-center gap-1.5">
                  ⏰ Thời gian: <span className={`font-black text-lg ${quizTimeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-indigo-500'}`}>{quizTimeLeft}s</span>
                </span>
              </div>

              <div className="flex justify-center gap-2.5">
                {Array(5).fill(null).map((_, idx) => {
                  const historyItem = quizHistory[idx]
                  let dotBg = 'bg-gray-200 dark:bg-dark-300 border border-gray-300 dark:border-gray-700'
                  let dotIcon = ''
                  
                  if (idx === quizCurrentIndex) {
                    dotBg = 'bg-violet-500 ring-4 ring-violet-500/30 scale-110 shadow-lg text-white'
                  } else if (historyItem) {
                    const isCorrect = historyItem.selectedAnswer === historyItem.correctAnswer
                    dotBg = isCorrect ? 'bg-green-500 text-white shadow-md' : 'bg-red-500 text-white shadow-md'
                    dotIcon = isCorrect ? '✅' : '❌'
                  }

                  return (
                    <div
                      key={idx}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${dotBg}`}
                    >
                      {dotIcon || idx + 1}
                    </div>
                  )
                })}
              </div>

              <div className="w-full h-3 bg-gray-100 dark:bg-dark-300 rounded-full overflow-hidden border border-gray-200/50 dark:border-gray-800">
                <motion.div
                  className={`h-full ${quizTimeLeft <= 5 ? 'bg-gradient-to-r from-red-500 to-rose-600 animate-pulse' : 'bg-gradient-to-r from-violet-500 to-indigo-600'}`}
                  initial={{ width: '100%' }}
                  animate={{ width: `${(quizTimeLeft / 15) * 100}%` }}
                  transition={{ duration: 0.1, ease: 'linear' }}
                />
              </div>

              <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-dark-200 dark:to-dark-250 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
                <p className="text-base sm:text-lg font-bold text-slate-800 dark:text-white leading-relaxed relative z-10 text-center">
                  {quizQuestions[quizCurrentIndex]?.question}
                </p>
                <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-violet-500/5 rounded-full blur-xl pointer-events-none" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quizQuestions[quizCurrentIndex]?.options.map((option, idx) => {
                  const isSelected = quizSelectedOption === idx
                  const isCorrect = quizQuestions[quizCurrentIndex]?.answer === idx
                  
                  let optionStyle = 'bg-white dark:bg-dark-200 border-slate-200 dark:border-slate-800 hover:border-violet-500 dark:hover:border-violet-500 hover:scale-[1.01] shadow-sm'
                  let stateIcon = ''

                  if (quizSelectedOption !== null) {
                    if (isCorrect) {
                      optionStyle = 'bg-green-500 border-green-500 text-white font-extrabold shadow-[0_0_15px_rgba(34,197,94,0.4)] scale-[1.02]'
                      stateIcon = '✅'
                    } else if (isSelected) {
                      optionStyle = 'bg-red-500 border-red-500 text-white font-extrabold shadow-[0_0_15px_rgba(239,68,68,0.4)] scale-[1.02]'
                      stateIcon = '❌'
                    } else {
                      optionStyle = 'bg-white dark:bg-dark-200 border-slate-100 dark:border-slate-850 opacity-40 scale-98'
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={quizSelectedOption !== null}
                      onClick={() => handleSelectQuizOption(idx)}
                      className={`p-4 rounded-2xl border text-left text-sm font-semibold transition-all duration-300 flex items-center justify-between gap-3 ${optionStyle}`}
                    >
                      <span>{idx === 0 ? 'A.' : idx === 1 ? 'B.' : idx === 2 ? 'C.' : 'D.'} {option}</span>
                      {stateIcon && <span className="text-base shrink-0">{stateIcon}</span>}
                    </button>
                  )
                })}
              </div>

              <div className="flex justify-center pt-2">
                <button
                  onClick={() => {
                    showConfirmModal(
                      "Dừng lượt đố vui?",
                      "Bạn có chắc chắn muốn bỏ dở cuộc đố vui này không? Mọi điểm số tích lũy sẽ bị mất và bạn không nhận được thưởng Xu.",
                      () => endQuizGame(0, true)
                    )
                  }}
                  className="py-2.5 px-6 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 font-extrabold text-xs rounded-xl transition-colors shadow-sm"
                >
                  🏳️ Đầu hàng sớm
                </button>
              </div>
            </div>
          )}

          {quizState === 'ended' && (
            <div className="space-y-6">
              <div className="bg-violet-500/10 border border-violet-500/20 p-6 rounded-3xl text-center space-y-3">
                <span className="text-4xl">🏁</span>
                <h3 className="text-lg font-extrabold text-violet-700 dark:text-violet-400">Cuộc Đua Trí Tuệ Kết Thúc!</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Bạn trả lời đúng <span className="font-extrabold text-green-500">{quizScore / 10}/5</span> câu hỏi và đạt <span className="font-extrabold text-violet-600">{quizScore} điểm</span>.
                </p>
                <button
                  onClick={startQuizGame}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-extrabold py-3 px-8 rounded-2xl hover:scale-105 transition-transform shadow-lg text-sm"
                >
                  Chơi ván mới (-10 Xu)
                </button>
              </div>

              <div className="bg-gray-50 dark:bg-dark-200 rounded-3xl p-4 sm:p-6 border border-gray-100 dark:border-gray-800">
                <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-4 uppercase tracking-wider text-center">
                  📊 Chi Tiết Đáp Án Từng Câu Hỏi
                </h4>
                <div className="space-y-4">
                  {quizHistory.map((item, idx) => {
                    const isCorrect = item.selectedAnswer === item.correctAnswer
                    return (
                      <div key={idx} className="p-4 bg-white dark:bg-dark-100 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-2 shadow-xs">
                        <p className="font-bold text-xs text-slate-500 dark:text-slate-400">
                          Câu {idx + 1}: {item.question}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-dark-200 text-gray-500 dark:text-gray-400">
                            <span className="font-bold block text-[10px] text-gray-400 uppercase">Bạn đã chọn:</span>
                            <span className={item.selectedAnswer === -1 ? 'italic text-red-400 font-bold' : isCorrect ? 'text-green-500 font-extrabold' : 'text-red-500 font-extrabold'}>
                              {item.selectedAnswer === -1 ? 'Hết giờ (Bỏ qua) ⏰' : item.options[item.selectedAnswer]} {item.selectedAnswer === -1 || !isCorrect ? '❌' : '✅'}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-green-500/5 dark:bg-green-500/10 text-green-600 dark:text-green-400 font-semibold border border-green-500/10">
                            <span className="font-bold block text-[10px] text-green-400/80 uppercase">Đáp án chuẩn:</span>
                            <span>{item.options[item.correctAnswer]}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Prize Modal */}
      <AnimatePresence>
        {prizeModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPrizeModal(null)} />
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 50 }}
              className="relative bg-white dark:bg-dark-200 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
            >
              <span className="text-6xl block mb-4">
                {prizeModal.type === 'coin' && prizeModal.value > 0 ? '🪙' : prizeModal.type === 'spin' ? '🔄' : '😢'}
              </span>
              <h3 className="text-2xl font-bold dark:text-white mb-2">
                {prizeModal.type === 'coin' && prizeModal.value > 0 ? 'Tuyệt vời!' : prizeModal.type === 'spin' ? 'Hay quá!' : 'Ôi không!'}
              </h3>
              <p className="text-gray-500 mb-6">
                {prizeModal.type === 'coin' && prizeModal.value > 0 
                  ? `Bạn vừa trúng ${prizeModal.value} Xu. Xu đã được cộng vào tài khoản!` 
                  : prizeModal.type === 'spin'
                    ? 'Bạn nhận được thêm 1 lượt quay miễn phí!'
                    : 'Chúc bạn may mắn lần sau nhé!'}
              </p>
              <button onClick={() => setPrizeModal(null)} className="btn-primary w-full py-3">Tiếp tục</button>
            </motion.div>
          </div>
        )}

        {/* Custom Confirmation Modal */}
        {confirmModal && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setConfirmModal(null)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="relative bg-white/95 dark:bg-dark-200/95 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center backdrop-blur-lg"
            >
              <div className="w-16 h-16 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto mb-4 text-3xl">
                ⚠️
              </div>
              <h3 className="text-xl font-bold dark:text-white mb-2 leading-snug">
                {confirmModal.title}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">
                {confirmModal.message}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setConfirmModal(null)} 
                  className="py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-sm transition-colors"
                >
                  Bỏ qua
                </button>
                <button 
                  onClick={confirmModal.onConfirm}
                  className="py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-sm hover:scale-[1.02] active:scale-98 shadow-[0_5px_15px_rgba(239,68,68,0.3)] transition-all"
                >
                  Xác nhận
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Custom Game Result Modal */}
        {gameResultModal && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
              onClick={() => setGameResultModal(null)}
            />
            <motion.div
              initial={{ scale: 0.85, opacity: 0, rotate: -2 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="relative bg-gradient-to-b from-white to-slate-50 dark:from-dark-100 dark:to-dark-250 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center backdrop-blur-xl overflow-hidden"
            >
              {/* Confetti-like ambient lighting */}
              {gameResultModal.isWin && (
                <div className="absolute -top-12 -left-12 w-32 h-32 bg-yellow-400/20 rounded-full blur-3xl pointer-events-none" />
              )}
              {gameResultModal.isWin && (
                <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
              )}

              {/* Game Label */}
              <span className="text-[10px] uppercase tracking-widest font-black text-gray-400 dark:text-gray-500 block mb-1">
                {gameResultModal.gameName}
              </span>

              {/* Golden Trophy or Sad Emoji */}
              <div className="relative inline-block mb-4">
                {gameResultModal.isWin ? (
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                    className="text-6xl filter drop-shadow-[0_5px_8px_rgba(245,158,11,0.4)]"
                  >
                    🏆
                  </motion.div>
                ) : (
                  <div className="text-6xl filter drop-shadow-[0_5px_8px_rgba(0,0,0,0.15)]">
                    😢
                  </div>
                )}
              </div>

              {/* Modal Title & Subtitle */}
              <h3 className={`text-2xl font-black mb-1 leading-tight tracking-tight ${gameResultModal.isWin ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-700 dark:text-gray-200'}`}>
                {gameResultModal.title}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs mb-6 px-2 leading-relaxed font-semibold">
                {gameResultModal.subtitle}
              </p>

              {/* Stats Box */}
              <div className="bg-slate-100/60 dark:bg-slate-900/40 rounded-2xl p-4 mb-6 border border-slate-200/30 dark:border-slate-800/30 flex flex-col gap-2.5">
                {gameResultModal.stats?.map((stat, sidx) => (
                  <div key={sidx} className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400 font-semibold">{stat.label}</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-100">{stat.value}</span>
                  </div>
                ))}
              </div>

              {/* Reward Spinner 🪙 */}
              {gameResultModal.isWin && gameResultModal.reward > 0 && (
                <div className="flex flex-col items-center justify-center mb-6">
                  <motion.div
                    animate={{ rotateY: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="text-4xl filter drop-shadow-[0_3px_5px_rgba(245,158,11,0.5)] mb-1"
                  >
                    🪙
                  </motion.div>
                  <span className="text-lg font-black text-yellow-500">
                    +{gameResultModal.reward} XU ĐÃ CỘNG VÀO VÍ
                  </span>
                </div>
              )}

              {/* Actions Grid */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setGameResultModal(null)}
                  className="py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-bold text-sm transition-colors"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    setGameResultModal(null)
                    gameResultModal.onReplay()
                  }}
                  className="py-3 px-4 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold text-sm hover:scale-[1.02] active:scale-98 shadow-[0_5px_15px_rgba(245,158,11,0.4)] transition-all"
                >
                  Chơi lại ván mới
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

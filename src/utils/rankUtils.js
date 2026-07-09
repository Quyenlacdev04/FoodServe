export const getUserRank = (totalSpent) => {
  const spent = totalSpent || 0;
  
  if (spent >= 10000000) return { name: 'Chiến Thần Mua Hàng', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-500/20', icon: '🔥' };
  if (spent >= 5000000) return { name: 'Kim Cương', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-500/20', icon: '💎' };
  if (spent >= 2000000) return { name: 'Vàng', color: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-500/20', icon: '🏆' };
  if (spent >= 500000) return { name: 'Bạc', color: 'text-gray-700 dark:text-gray-300', bg: 'bg-gray-200 dark:bg-gray-700', icon: '🥈' };
  
  return { name: 'Đồng', color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-500/20', icon: '🥉' };
};

export const getNextRankInfo = (totalSpent) => {
  const spent = totalSpent || 0;
  
  if (spent >= 10000000) return null; // Max rank reached
  
  let nextRankLimit = 0;
  let nextRankName = '';
  
  if (spent >= 5000000) { nextRankLimit = 10000000; nextRankName = 'Chiến Thần Mua Hàng'; }
  else if (spent >= 2000000) { nextRankLimit = 5000000; nextRankName = 'Kim Cương'; }
  else if (spent >= 500000) { nextRankLimit = 2000000; nextRankName = 'Vàng'; }
  else { nextRankLimit = 500000; nextRankName = 'Bạc'; }
  
  const progressPercent = Math.min(100, Math.floor((spent / nextRankLimit) * 100));
  const remainingAmount = nextRankLimit - spent;
  
  return {
    nextRankName,
    nextRankLimit,
    remainingAmount,
    progressPercent
  };
};

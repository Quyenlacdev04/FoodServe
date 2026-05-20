export const getUserRank = (totalSpent) => {
  const spent = totalSpent || 0;
  
  if (spent >= 10000000) return { name: 'Chiến Thần Mua Hàng', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-500/20', icon: '🔥' };
  if (spent >= 5000000) return { name: 'Kim Cương', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-500/20', icon: '💎' };
  if (spent >= 2000000) return { name: 'Vàng', color: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-500/20', icon: '🏆' };
  if (spent >= 500000) return { name: 'Bạc', color: 'text-gray-700 dark:text-gray-300', bg: 'bg-gray-200 dark:bg-gray-700', icon: '🥈' };
  
  return { name: 'Đồng', color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-500/20', icon: '🥉' };
};

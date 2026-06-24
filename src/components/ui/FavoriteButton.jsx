import { API_BASE_URL } from '../../config/api.js'
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiHeart } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import { useSelector } from 'react-redux';

export default function FavoriteButton({ restaurantId, size = 'md' }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const user = useSelector((state) => state.auth.user);

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  };

  useEffect(() => {
    if (user) {
      checkFavorite();
    }
  }, [user, restaurantId]);

  const checkFavorite = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/favorites/check/${user._id}/${restaurantId}`
      );
      const data = await response.json();
      setIsFavorite(data.isFavorite);
    } catch (error) {
      console.error('Check favorite error:', error);
    }
  };

  const toggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      alert('Vui lòng đăng nhập để sử dụng tính năng yêu thích!');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/favorites/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id,
          restaurantId
        })
      });

      const data = await response.json();
      setIsFavorite(data.isFavorite);
    } catch (error) {
      console.error('Toggle favorite error:', error);
      alert('Có lỗi xảy ra. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      onClick={toggleFavorite}
      disabled={loading}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={`${sizeClasses[size]} rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:shadow-xl transition-all ${
        loading ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {isFavorite ? (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
        >
          <FaHeart className="text-red-500" />
        </motion.div>
      ) : (
        <FiHeart className="text-gray-600" />
      )}
    </motion.button>
  );
}

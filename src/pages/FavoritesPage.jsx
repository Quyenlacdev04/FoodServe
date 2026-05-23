import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHeart, FiMapPin, FiStar, FiClock } from 'react-icons/fi';
import FavoriteButton from '../components/ui/FavoriteButton';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchFavorites();
  }, [user]);

  const fetchFavorites = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/favorites/user/${user._id}`
      );
      const data = await response.json();
      setFavorites(data.favorites);
      setRestaurants(data.restaurants);
    } catch (error) {
      console.error('Fetch favorites error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestaurantClick = (restaurantId) => {
    navigate(`/restaurant/${restaurantId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <FiHeart className="text-3xl" />
            <h1 className="text-3xl font-bold">Yêu thích</h1>
          </div>
          <p className="text-white/80">
            {restaurants.length} nhà hàng bạn đã lưu
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {restaurants.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <FiHeart className="text-6xl text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-700 mb-2">
              Chưa có nhà hàng yêu thích
            </h2>
            <p className="text-gray-500 mb-6">
              Hãy thêm nhà hàng yêu thích để dễ dàng tìm lại sau này!
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
            >
              Khám phá nhà hàng
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((restaurant, index) => (
              <motion.div
                key={restaurant._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleRestaurantClick(restaurant._id)}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all cursor-pointer group"
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={restaurant.image}
                    alt={restaurant.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  {restaurant.discount > 0 && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      -{restaurant.discount}%
                    </div>
                  )}
                  {restaurant.freeship && (
                    <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      Freeship
                    </div>
                  )}
                  <div className="absolute bottom-3 right-3">
                    <FavoriteButton restaurantId={restaurant._id} size="md" />
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-1">
                    {restaurant.name}
                  </h3>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <div className="flex items-center gap-1">
                      <FiStar className="text-yellow-500" />
                      <span className="font-medium">{restaurant.rating}</span>
                      <span className="text-gray-400">
                        ({restaurant.reviews})
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FiClock />
                      <span>{restaurant.deliveryTime}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-sm text-gray-500">
                    <FiMapPin className="mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-1">{restaurant.address}</span>
                  </div>

                  {restaurant.promo && (
                    <div className="mt-3 bg-orange-50 text-orange-600 px-3 py-2 rounded-lg text-sm">
                      🎉 {restaurant.promo}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiFilter, FiX } from 'react-icons/fi';

export default function SearchAndFilter({ onSearch, onFilter }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    minRating: '',
    freeship: false,
    sortBy: 'rating'
  });

  const categories = [
    'Tất cả',
    'Món Việt',
    'FastFood',
    'Đồ uống',
    'Món Á',
    'Món Âu',
    'Lẩu',
    'Buffet',
    'Ăn vặt'
  ];

  const sortOptions = [
    { value: 'rating', label: '⭐ Đánh giá cao' },
    { value: 'orders', label: '🔥 Bán chạy' },
    { value: 'distance', label: '📍 Gần nhất' },
    { value: 'name', label: '🔤 Tên A-Z' }
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(searchQuery, filters);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilter(newFilters);
  };

  const clearFilters = () => {
    const defaultFilters = {
      category: '',
      minRating: '',
      freeship: false,
      sortBy: 'rating'
    };
    setFilters(defaultFilters);
    onFilter(defaultFilters);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-6">
      {/* Search Bar — Light glass design */}
      <form onSubmit={handleSearch} className="relative mb-4">
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm nhà hàng, món ăn..."
            className="w-full pl-12 pr-24 py-4 rounded-2xl bg-white/80 dark:bg-dark-100/80 backdrop-blur-md border border-gray-200/60 dark:border-white/10 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500/40 transition-all shadow-depth-sm"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-xl transition-all ${
                showFilters
                  ? 'bg-primary-500 text-white shadow-glow'
                  : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20'
              }`}
            >
              <FiFilter className="text-xl" />
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-primary rounded-xl text-white font-medium hover:shadow-glow transition-all"
            >
              Tìm
            </button>
          </div>
        </div>
      </form>

      {/* Filter Panel — Light glass */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white/80 dark:bg-dark-100/80 backdrop-blur-md rounded-2xl border border-gray-200/60 dark:border-white/10 p-6 shadow-depth">
              {/* Categories */}
              <div className="mb-6">
                <h3 className="text-gray-800 dark:text-white font-semibold mb-3 flex items-center gap-2">
                  🍽️ Danh mục
                </h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() =>
                        handleFilterChange('category', cat === 'Tất cả' ? '' : cat)
                      }
                      className={`px-4 py-2 rounded-xl transition-all font-medium ${
                        (cat === 'Tất cả' && !filters.category) ||
                        filters.category === cat
                          ? 'bg-primary-500 text-white shadow-glow'
                          : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div className="mb-6">
                <h3 className="text-gray-800 dark:text-white font-semibold mb-3 flex items-center gap-2">
                  ⭐ Đánh giá tối thiểu
                </h3>
                <div className="flex gap-2">
                  {[3, 3.5, 4, 4.5, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => handleFilterChange('minRating', rating)}
                      className={`px-4 py-2 rounded-xl transition-all font-medium ${
                        filters.minRating === rating
                          ? 'bg-primary-500 text-white shadow-glow'
                          : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20'
                      }`}
                    >
                      {rating}+
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort By */}
              <div className="mb-6">
                <h3 className="text-gray-800 dark:text-white font-semibold mb-3 flex items-center gap-2">
                  🔄 Sắp xếp theo
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleFilterChange('sortBy', option.value)}
                      className={`px-4 py-2 rounded-xl transition-all font-medium ${
                        filters.sortBy === option.value
                          ? 'bg-primary-500 text-white shadow-glow'
                          : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Freeship */}
              <div className="mb-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.freeship}
                    onChange={(e) =>
                      handleFilterChange('freeship', e.target.checked)
                    }
                    className="w-5 h-5 rounded accent-primary-500"
                  />
                  <span className="text-gray-700 dark:text-white font-medium">
                    🚚 Chỉ hiển thị nhà hàng Freeship
                  </span>
                </label>
              </div>

              {/* Clear Filters */}
              <button
                onClick={clearFilters}
                className="w-full py-3 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 rounded-xl text-gray-700 dark:text-white font-medium transition-all flex items-center justify-center gap-2"
              >
                <FiX /> Xóa bộ lọc
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

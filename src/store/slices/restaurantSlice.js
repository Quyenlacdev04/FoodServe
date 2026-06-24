import { API_BASE_URL } from '../../config/api.js'
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

export const fetchRestaurants = createAsyncThunk(
  'restaurants/fetchAll',
  async () => {
    const res = await fetch(`${API_BASE_URL}/api/restaurants`)
    if (!res.ok) throw new Error('Lỗi fetch data')
    const data = await res.json()
    // API trả về { restaurants: [...], pagination: {...} }
    const restaurantList = data.restaurants || data
    // Map _id to id to prevent frontend components from breaking
    return restaurantList.map(r => ({ ...r, id: r._id }))
  }
)

export const fetchRestaurantDetails = createAsyncThunk(
  'restaurants/fetchDetails',
  async (id) => {
    const res = await fetch(`${API_BASE_URL}/api/restaurants/${id}`)
    if (!res.ok) throw new Error('Lỗi fetch chi tiết')
    const data = await res.json()
    // Return restaurant with id, and menuItems mapped with id
    return {
      restaurant: { ...data.restaurant, id: data.restaurant._id },
      menuItems: data.menuItems.map(item => ({ ...item, id: item._id, restaurantId: item.restaurantId }))
    }
  }
)

const initialState = {
  restaurants: [],
  menuItems: {}, // Store menu items by restaurantId: { [restId]: [items] }
  filteredRestaurants: [],
  selectedCategory: 'all',
  selectedFilter: 'all',
  searchQuery: '',
  selectedRestaurant: null,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null
}

const restaurantSlice = createSlice({
  name: 'restaurants',
  initialState,
  reducers: {
    setCategory: (state, action) => {
      state.selectedCategory = action.payload
      filterRestaurants(state)
    },
    setFilter: (state, action) => {
      state.selectedFilter = action.payload
      filterRestaurants(state)
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload
      filterRestaurants(state)
    },
    setSelectedRestaurant: (state, action) => {
      state.selectedRestaurant = state.restaurants.find(r => r.id === action.payload) || null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRestaurants.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchRestaurants.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.restaurants = action.payload
        filterRestaurants(state) // apply filters to the newly fetched data
      })
      .addCase(fetchRestaurants.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message
      })
      .addCase(fetchRestaurantDetails.fulfilled, (state, action) => {
        const { restaurant, menuItems } = action.payload
        state.selectedRestaurant = restaurant
        state.menuItems[restaurant.id] = menuItems
      })
  }
})

function filterRestaurants(state) {
  let result = [...state.restaurants]

  if (state.selectedCategory !== 'all') {
    result = result.filter(r =>
      r.categories.some(c => c.toLowerCase() === state.selectedCategory.toLowerCase())
    )
  }

  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase()
    result = result.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.categories.some(c => c.toLowerCase().includes(q))
    )
  }

  switch (state.selectedFilter) {
    case 'nearby':
      result.sort((a, b) => a.distance - b.distance)
      break
    case 'popular':
      result.sort((a, b) => b.orders - a.orders)
      break
    case 'rating':
      result.sort((a, b) => b.rating - a.rating)
      break
    case 'discount':
      result = result.filter(r => r.discount > 0).sort((a, b) => b.discount - a.discount)
      break
    default:
      break
  }

  state.filteredRestaurants = result
}

export const { setCategory, setFilter, setSearchQuery, setSelectedRestaurant } = restaurantSlice.actions
export default restaurantSlice.reducer

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      })
      const data = await res.json()
      if (!res.ok) return rejectWithValue(data.message)
      return data
    } catch (err) {
      return rejectWithValue('Lỗi kết nối server')
    }
  }
)

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })
      const data = await res.json()
      if (!res.ok) return rejectWithValue(data.message)
      return data
    } catch (err) {
      return rejectWithValue('Lỗi kết nối server')
    }
  }
)

export const updateCoins = createAsyncThunk(
  'auth/updateCoins',
  async ({ userId, coins, spins, totalSpent, addVoucher, removeVoucher }, { rejectWithValue }) => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/update-coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, coins, spins, totalSpent, addVoucher, removeVoucher })
      })
      const data = await res.json()
      if (!res.ok) return rejectWithValue(data.message)
      return data // Return updated user data
    } catch (error) {
      return rejectWithValue('Lỗi kết nối server')
    }
  }
)

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);
      return data;
    } catch (error) {
      return rejectWithValue('Lỗi kết nối server');
    }
  }
)

const initialState = {
  user: JSON.parse(localStorage.getItem('foodserve_user') || 'null'),
  token: localStorage.getItem('foodserve_token') || null,
  isAuthenticated: !!localStorage.getItem('foodserve_token'),
  loading: false,
  error: null
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.error = null
      localStorage.removeItem('foodserve_user')
      localStorage.removeItem('foodserve_token')
    },
    setAuth: (state, action) => {
      // Dùng sau khi verify OTP đăng ký thành công
      state.user = action.payload.user
      state.token = action.payload.token
      state.isAuthenticated = true
      state.loading = false
      localStorage.setItem('foodserve_user', JSON.stringify(action.payload.user))
      localStorage.setItem('foodserve_token', action.payload.token)
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload }
      if (action.payload.capabilities) {
        state.user.capabilities = action.payload.capabilities
      }
      localStorage.setItem('foodserve_user', JSON.stringify(state.user))
    },
    setUserCapabilities: (state, action) => {
      if (!state.user) return
      state.user = {
        ...state.user,
        isMerchant: action.payload.isMerchant,
        isShipper: action.payload.isShipper,
        capabilities: action.payload,
      }
      localStorage.setItem('foodserve_user', JSON.stringify(state.user))
    },
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
        localStorage.setItem('foodserve_user', JSON.stringify(action.payload.user))
        localStorage.setItem('foodserve_token', action.payload.token)
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(updateCoins.fulfilled, (state, action) => {
        state.user = action.payload // Cập nhật lại toàn bộ thông tin user (bao gồm coins mới)
        localStorage.setItem('foodserve_user', JSON.stringify(action.payload))
      })
      .addCase(updateProfile.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
        localStorage.setItem('foodserve_user', JSON.stringify(action.payload))
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
        localStorage.setItem('foodserve_user', JSON.stringify(action.payload.user))
        localStorage.setItem('foodserve_token', action.payload.token)
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export const { logout, updateUser, clearError, setUserCapabilities, setAuth } = authSlice.actions
export default authSlice.reducer

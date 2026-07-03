import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  darkMode: false,
  mobileMenuOpen: false,
  searchOpen: false,
  authModalOpen: false,
  authModalTab: 'login',
  loading: true,
  healthyMode: localStorage.getItem('foodserve_healthy') === 'true',
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode
      if (state.darkMode) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('foodserve_dark', 'true')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('foodserve_dark', 'false')
      }
    },
    setDarkMode: (state, action) => {
      state.darkMode = action.payload
      if (action.payload) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('foodserve_dark', 'true')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('foodserve_dark', 'false')
      }
    },
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen
    },
    closeMobileMenu: (state) => {
      state.mobileMenuOpen = false
    },
    toggleSearch: (state) => {
      state.searchOpen = !state.searchOpen
    },
    openAuthModal: (state, action) => {
      state.authModalOpen = true
      state.authModalTab = action.payload || 'login'
    },
    closeAuthModal: (state) => {
      state.authModalOpen = false
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    toggleHealthyMode: (state) => {
      state.healthyMode = !state.healthyMode
      localStorage.setItem('foodserve_healthy', state.healthyMode ? 'true' : 'false')
    },
    setHealthyMode: (state, action) => {
      state.healthyMode = action.payload
      localStorage.setItem('foodserve_healthy', action.payload ? 'true' : 'false')
    },
  },
})

export const {
  toggleDarkMode, setDarkMode, toggleMobileMenu, closeMobileMenu,
  toggleSearch, openAuthModal, closeAuthModal, setLoading,
  toggleHealthyMode, setHealthyMode
} = uiSlice.actions
export default uiSlice.reducer

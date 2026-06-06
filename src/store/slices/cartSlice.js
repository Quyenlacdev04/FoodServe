import { createSlice } from '@reduxjs/toolkit'
import toast from 'react-hot-toast'

const initialState = {
  items: JSON.parse(localStorage.getItem('foodserve_cart') || '[]'),
  isOpen: false,
  voucher: null,
  discount: 0,
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const item = action.payload
      const existing = state.items.find(
        (i) => i.id === item.id && i.restaurantId === item.restaurantId
      )
      if (existing) {
        existing.quantity += 1
      } else {
        state.items.push({ ...item, quantity: 1 })
      }
      localStorage.setItem('foodserve_cart', JSON.stringify(state.items))
      toast.success(`Đã thêm ${item.name} vào giỏ hàng!`, { icon: '🛒' })
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter((i) => i.id !== action.payload)
      localStorage.setItem('foodserve_cart', JSON.stringify(state.items))
    },
    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload
      const item = state.items.find((i) => i.id === id)
      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter((i) => i.id !== id)
        } else {
          item.quantity = quantity
        }
      }
      localStorage.setItem('foodserve_cart', JSON.stringify(state.items))
    },
    toggleCart: (state) => {
      state.isOpen = !state.isOpen
    },
    openCart: (state) => {
      state.isOpen = true
    },
    closeCart: (state) => {
      state.isOpen = false
    },
    clearCart: (state) => {
      state.items = []
      state.voucher = null
      state.discount = 0
      localStorage.removeItem('foodserve_cart')
    },
    applyVoucher: (state, action) => {
      // action.payload = { code, discountAmount, voucherInfo }
      // Đã validate từ API trước khi dispatch
      const { code, discountAmount, voucherInfo } = action.payload
      state.voucher = { code, ...voucherInfo }
      state.discount = discountAmount
      toast.success(`Áp dụng mã ${code} thành công! 🎉`, { icon: '🎫' })
    },
    removeVoucher: (state) => {
      state.voucher = null
      state.discount = 0
    },
  },
})

export const {
  addToCart, removeFromCart, updateQuantity,
  toggleCart, openCart, closeCart, clearCart,
  applyVoucher, removeVoucher
} = cartSlice.actions

export const selectCartTotal = (state) =>
  state.cart.items.reduce((total, item) => total + item.price * item.quantity, 0)

export const selectCartCount = (state) =>
  state.cart.items.reduce((count, item) => count + item.quantity, 0)

export default cartSlice.reducer

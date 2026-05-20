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
      const vouchers = {
        'SALE10': { discount: 0, type: 'percent', value: 10, label: 'Giảm 10%', minOrder: 0 },
        'FOOD50': { discount: 50000, label: 'Giảm 50K', minOrder: 150000 },
        'FREESHIP': { discount: 25000, label: 'Freeship 25K', minOrder: 0 },
        'NEW30': { discount: 30000, label: 'Giảm 30K', minOrder: 100000 },
        'VIP100': { discount: 100000, label: 'Giảm 100K', minOrder: 300000 },
        'SALE20': { discount: 20000, label: 'Giảm 20K', minOrder: 0 }
      }
      
      const code = action.payload.toUpperCase()
      const voucherInfo = vouchers[code]
      
      if (voucherInfo) {
        // Calculate subtotal to check minOrder
        const subtotal = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

        if (subtotal < (voucherInfo.minOrder || 0)) {
          toast.error(`Đơn hàng tối thiểu ${new Intl.NumberFormat('vi-VN').format(voucherInfo.minOrder)}đ để áp dụng mã này!`)
          return
        }

        state.voucher = { code, ...voucherInfo }
        if (voucherInfo.type === 'percent') {
          state.discount = (subtotal * voucherInfo.value) / 100
        } else {
          state.discount = voucherInfo.discount
        }
        
        toast.success(`Áp dụng mã ${code} thành công!`, { icon: '🎉' })
      } else {
        toast.error('Mã giảm giá không hợp lệ hoặc đã hết hạn!')
      }
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

// API Configuration - tự động detect URL dựa trên môi trường
// Development: dùng localhost:5000
// Production: dùng cùng domain (hoặc cấu hình qua biến môi trường nếu chạy chéo domain)

const isDev = import.meta.env.DEV

export const API_BASE_URL = isDev 
  ? 'http://localhost:5000' 
  : (import.meta.env.VITE_API_BASE_URL || '')  // Mặc định dùng relative URL nếu cùng domain

export const SOCKET_URL = isDev 
  ? 'http://localhost:5000' 
  : (import.meta.env.VITE_SOCKET_URL || window.location.origin)  // Mặc định dùng current origin

export default API_BASE_URL;

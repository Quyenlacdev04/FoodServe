// API Configuration - tự động detect URL dựa trên môi trường
// Development: dùng localhost:5000
// Production: dùng cùng domain (vì server serve cả frontend)

const isDev = import.meta.env.DEV

export const API_BASE_URL = isDev 
  ? 'http://localhost:5000' 
  : ''  // Production: same origin, dùng relative URL

export const SOCKET_URL = isDev 
  ? 'http://localhost:5000' 
  : window.location.origin  // Production: dùng current origin

export default API_BASE_URL

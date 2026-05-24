import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { Toaster } from 'react-hot-toast'
import { store } from './store/store.js'
import AdminLoginPage from './pages/AdminLoginPage.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('admin-login-root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <AdminLoginPage />
      <Toaster position="top-center" />
    </Provider>
  </React.StrictMode>,
)

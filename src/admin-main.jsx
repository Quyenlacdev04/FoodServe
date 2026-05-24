import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { store } from './store/store.js'
import AdminPage from './pages/AdminPage.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('admin-root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="*" element={<AdminPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" />
    </Provider>
  </React.StrictMode>,
)
import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { store } from './store/store.js'
import AdminPage from './pages/AdminPage.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('admin-root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <AdminPage />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
)
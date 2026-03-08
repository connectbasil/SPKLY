import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Survey from './pages/Survey'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import Contacts from './pages/Contacts'
import Sidebar from './components/Sidebar'

function AppLayout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg-base)' }}>
        {children}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/survey/:id" element={<Survey />} />
        <Route
          path="/dashboard"
          element={
            <AppLayout>
              <Dashboard />
            </AppLayout>
          }
        />
        <Route
          path="/admin"
          element={
            <AppLayout>
              <Admin />
            </AppLayout>
          }
        />
        <Route
          path="/contacts"
          element={
            <AppLayout>
              <Contacts />
            </AppLayout>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import AppLayout from './components/AppLayout'
import Home from './pages/Home'
import Whitepaper from './pages/Whitepaper'
import Help from './pages/Help'
import Login from './pages/Login'
import Register from './pages/Register'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import Miners from './pages/Miners'
import MinerDetail from './pages/MinerDetail'
import Exchange from './pages/Exchange'
import C2C from './pages/C2C'
import Withdraw from './pages/Withdraw'
import Dashboard from './pages/Dashboard'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="whitepaper" element={<Whitepaper />} />
          <Route path="help" element={<Help />} />
          <Route path="terms" element={<Terms />} />
          <Route path="privacy" element={<Privacy />} />
        </Route>
        <Route element={<AppLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="miner-center" element={<Miners />} />
          <Route path="miners" element={<Navigate to="/miner-center" replace />} />
          <Route path="miners/:id" element={<MinerDetail />} />
          <Route path="exchange" element={<Exchange />} />
          <Route path="c2c" element={<C2C />} />
          <Route path="withdraw" element={<Withdraw />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

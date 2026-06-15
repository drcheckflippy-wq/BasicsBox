import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import CustomerAuth from './auth/CustomerAuth'
import MerchantAuth from './auth/MerchantAuth'
import Admin from './auth/Admin'
import Home from './pages/Home'
import AdminDashboard from './dashboard/AdminDashboard'
import MerchantDashboard from './dashboard/MerchantDashboard'
import YourOrders from './pages/YourOrders'
import AdminTransactions from './pages/AdminTransactions'
import PaymentCallback from './pages/PaymentCallback'
import ResetPassword from './auth/ResetPassword'

export default function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/customer" element={<CustomerAuth />} />
        <Route path="/merchant" element={<MerchantAuth />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/" element={<Home />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/merchant/dashboard" element={<MerchantDashboard />} />
        <Route path="/your-orders" element={<YourOrders />} />
        <Route path="/admin/transactions" element={<AdminTransactions />} />
        <Route path="/payment-callback" element={<PaymentCallback />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </ThemeProvider>
  )
}
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import LoginWalletSection from '../components/auth/LoginWalletSection'
import { useAuth } from '../auth/AuthProvider'
import { useI18n } from '../i18n/I18nProvider'

const inputClass =
  'w-full h-12 px-4 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 transition-all'

export default function Login() {
  const { t } = useI18n()
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const a = (key: string) => t(`auth.login.${key}`)

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : a('submit'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title={a('title')} subtitle={a('subtitle')}>
      {error && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">{a('email')}</label>
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={a('emailPlaceholder')}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">{a('password')}</label>
          <input
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={a('passwordPlaceholder')}
            required
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 disabled:opacity-50 transition-all"
        >
          {loading ? '...' : a('submit')}
        </button>
      </form>

      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-white/[0.08]" />
        <span className="text-gray-600 text-xs">{a('or')}</span>
        <div className="flex-1 h-px bg-white/[0.08]" />
      </div>

      <LoginWalletSection
        browserWalletLabel={a('browserWallet')}
        desktopHint={a('desktopHint')}
      />

      <p className="text-center mt-6 text-gray-500 text-sm">
        {a('noAccount')}{' '}
        <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-medium">
          {a('register')}
        </Link>
      </p>
    </AuthLayout>
  )
}

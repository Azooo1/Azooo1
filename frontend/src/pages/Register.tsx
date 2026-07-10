import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { useI18n } from '../i18n/I18nProvider'
import { register as apiRegister } from '../api/client'

const inputClass =
  'w-full h-12 px-4 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 transition-all'

export default function Register() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const a = (key: string) => t(`auth.register.${key}`)

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const fields = [
    { key: 'username', type: 'text', label: a('username'), placeholder: a('usernamePlaceholder'), value: username, onChange: setUsername },
    { key: 'email', type: 'email', label: a('email'), placeholder: a('emailPlaceholder'), value: email, onChange: setEmail },
    { key: 'password', type: 'password', label: a('password'), placeholder: a('passwordPlaceholder'), value: password, onChange: setPassword },
    { key: 'confirmPassword', type: 'password', label: a('confirmPassword'), placeholder: a('confirmPasswordPlaceholder'), value: confirmPassword, onChange: setConfirmPassword },
    { key: 'inviteCode', type: 'text', label: a('inviteCode'), placeholder: a('inviteCodePlaceholder'), value: inviteCode, onChange: setInviteCode },
  ]

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!username.trim() || !email.trim() || !password) {
      setError(a('fieldRequired'))
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(a('emailInvalid'))
      return
    }
    if (password.length < 6) {
      setError(t('auth.register.errors.passwordTooShort'))
      return
    }
    if (password !== confirmPassword) {
      setError(a('passwordMismatch'))
      return
    }
    if (!inviteCode.trim()) {
      setError(t('auth.register.errors.inviteCodeRequired'))
      return
    }

    setLoading(true)
    try {
      const res = await apiRegister(username.trim(), email.trim(), password, inviteCode.trim().toUpperCase())
      navigate('/login', { state: { message: res.message } })
    } catch (err) {
      setError(err instanceof Error ? err.message : a('registerFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title={a('title')}
      subtitle={a('subtitle')}
      headerExtra={
        <div className="inline-flex items-center gap-1 px-3 py-1 mt-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
          🎁 {a('bonus')}
        </div>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        {fields.map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-400 mb-2">{field.label}</label>
            <input
              type={field.type}
              placeholder={field.placeholder}
              className={inputClass}
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              autoComplete={field.key === 'password' || field.key === 'confirmPassword' ? 'new-password' : field.key}
            />
            {field.key === 'inviteCode' && (
              <p className="text-xs text-gray-600 mt-1">{a('inviteCodeHint')}</p>
            )}
          </div>
        ))}

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all mt-2 disabled:opacity-60"
        >
          {loading ? t('common.loading') : a('submitButton')}
        </button>
      </form>

      <p className="text-center text-gray-500 text-sm mt-6">
        {a('hasAccount')}{' '}
        <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
          {a('loginNow')}
        </Link>
      </p>
    </AuthLayout>
  )
}

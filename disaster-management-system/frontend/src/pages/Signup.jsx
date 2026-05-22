import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../lib/api'
import OtpModal from '../components/OtpModal'
import Navbar from '../components/Navbar'

export default function Signup() {
  const navigate = useNavigate()
  const [pendingEmail, setPendingEmail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const fd = new FormData(e.target)
    const data = Object.fromEntries(fd)
    try {
      await authApi.register(data)
      setPendingEmail(data.email)
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (otp) => {
    setLoading(true)
    setError('')
    try {
      const res = await authApi.verifyOtp(pendingEmail, otp)
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('role', res.data.role)
      localStorage.setItem('username', res.data.username)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-accent-blue outline-none text-headline'

  return (
    <div className="min-h-screen bg-cinematic-black">
      <Navbar />
      <div className="pt-24 pb-16 px-4 flex justify-center">
        <form onSubmit={handleRegister} className="glass max-w-lg w-full rounded-2xl p-8 space-y-4">
          <h1 className="text-2xl font-bold text-headline">Create Account</h1>
          {['username', 'email', 'password', 'confirmPassword', 'location', 'state', 'city'].map((f) => (
            <input
              key={f}
              name={f}
              type={f.includes('password') ? 'password' : f === 'email' ? 'email' : 'text'}
              placeholder={f.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
              className={inputClass}
              required
            />
          ))}
          {error && <p className="text-neon-red text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-accent-blue font-medium disabled:opacity-50"
          >
            {loading ? 'Sending OTP...' : 'Send Verification OTP'}
          </button>
          <p className="text-body text-sm text-center">
            Have an account? <Link to="/login" className="text-accent-blue">Login</Link>
          </p>
        </form>
      </div>
      {pendingEmail && (
        <OtpModal
          email={pendingEmail}
          onVerify={handleVerify}
          onClose={() => setPendingEmail(null)}
          loading={loading}
          error={error}
        />
      )}
    </div>
  )
}

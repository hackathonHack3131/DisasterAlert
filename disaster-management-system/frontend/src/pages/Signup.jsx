import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../lib/api'
import Navbar from '../components/Navbar'

export default function Signup() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1) // 1 = Registration form, 2 = OTP form
  const [email, setEmail] = useState('')

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const fd = new FormData(e.target)
    const data = Object.fromEntries(fd)
    if (data.password !== data.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }
    try {
      const res = await authApi.register(data)
      if (res.data.requireOtp) {
        setEmail(data.email)
        setStep(2)
      } else {
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('role', res.data.role)
        localStorage.setItem('username', res.data.username)
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const otp = e.target.otp.value
    try {
      const res = await authApi.verifyOtp(email, otp)
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('role', res.data.role)
      localStorage.setItem('username', res.data.username)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'OTP verification failed')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-accent-blue outline-none text-headline'

  if (step === 2) {
    return (
      <div className="min-h-screen bg-cinematic-black">
        <Navbar />
        <div className="pt-24 pb-16 px-4 flex justify-center">
          <form onSubmit={handleVerifyOtp} className="glass max-w-md w-full rounded-2xl p-8 space-y-4">
            <h1 className="text-2xl font-bold text-headline">Verify Email</h1>
            <p className="text-body text-sm">
              We have sent a 6-digit verification code to <strong className="text-accent-blue">{email}</strong>. Please enter it below to verify your account.
            </p>
            <input
              name="otp"
              type="text"
              pattern="[0-9]{6}"
              placeholder="Enter 6-digit OTP"
              className={inputClass}
              maxLength={6}
              required
            />
            {error && <p className="text-neon-red text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-accent-blue font-medium disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Register'}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full py-2 text-center text-sm text-body hover:text-white transition-colors"
            >
              Go Back
            </button>
          </form>
        </div>
      </div>
    )
  }

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
            {loading ? 'Sending verification...' : 'Create Account'}
          </button>
          <p className="text-body text-sm text-center">
            Have an account? <Link to="/login" className="text-accent-blue">Login</Link>
          </p>
        </form>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { orgApi } from '../lib/api'
import OtpModal from '../components/OtpModal'
import Navbar from '../components/Navbar'

export default function OrgSignup() {
  const navigate = useNavigate()
  const [pendingEmail, setPendingEmail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fields = [
    'organisationName', 'email', 'password', 'confirmPassword',
    'country', 'state', 'city', 'headquartersLocation',
  ]

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const data = Object.fromEntries(new FormData(e.target))
    try {
      await orgApi.register(data)
      setPendingEmail(data.email)
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (otp) => {
    setLoading(true)
    try {
      const res = await orgApi.verifyOtp(pendingEmail, otp)
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('role', res.data.role)
      localStorage.setItem('username', res.data.username)
      navigate('/org/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cinematic-black">
      <Navbar />
      <div className="pt-24 pb-16 px-4 flex justify-center">
        <form onSubmit={handleRegister} className="glass max-w-lg w-full rounded-2xl p-8 space-y-4">
          <h1 className="text-2xl font-bold text-headline">Organisation Registration</h1>
          {fields.map((f) => (
            <input
              key={f}
              name={f}
              type={f.includes('password') ? 'password' : f === 'email' ? 'email' : 'text'}
              placeholder={f.replace(/([A-Z])/g, ' $1')}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-accent-orange"
              required
            />
          ))}
          {error && <p className="text-neon-red text-sm">{error}</p>}
          <button type="submit" className="w-full py-3 rounded-xl bg-accent-orange font-medium">
            Send OTP to Official Email
          </button>
          <Link to="/org/login" className="block text-center text-body text-sm">Already registered?</Link>
        </form>
      </div>
      {pendingEmail && (
        <OtpModal email={pendingEmail} onVerify={handleVerify} onClose={() => setPendingEmail(null)} loading={loading} error={error} />
      )}
    </div>
  )
}

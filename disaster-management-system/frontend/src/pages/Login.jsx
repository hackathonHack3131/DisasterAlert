import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../lib/api'
import Navbar from '../components/Navbar'

export default function Login() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const fd = new FormData(e.target)
    try {
      const res = await authApi.login(fd.get('username'), fd.get('password'))
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('role', res.data.role)
      localStorage.setItem('username', res.data.username)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cinematic-black">
      <Navbar />
      <div className="pt-24 pb-16 px-4 flex justify-center">
        <form onSubmit={handleSubmit} className="glass max-w-md w-full rounded-2xl p-8 space-y-4">
          <h1 className="text-2xl font-bold text-headline">Login</h1>
          <input name="username" placeholder="Username" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-accent-blue" required />
          <input name="password" type="password" placeholder="Password" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-accent-blue" required />
          <p className="text-body text-xs">Demo admin: admin / admin123</p>
          {error && <p className="text-neon-red text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-accent-blue font-medium">
            {loading ? 'Logging in...' : 'Login'}
          </button>
          <p className="text-body text-sm text-center">
            <Link to="/signup" className="text-accent-blue">Create account</Link>
          </p>
        </form>
      </div>
    </div>
  )
}

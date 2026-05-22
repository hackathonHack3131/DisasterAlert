import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { orgApi } from '../lib/api'
import Navbar from '../components/Navbar'

export default function OrgLogin() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    try {
      const res = await orgApi.login(fd.get('email'), fd.get('password'))
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('role', res.data.role)
      localStorage.setItem('username', res.data.username)
      navigate('/org/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen bg-cinematic-black">
      <Navbar />
      <div className="pt-24 pb-16 px-4 flex justify-center">
        <form onSubmit={handleSubmit} className="glass max-w-md w-full rounded-2xl p-8 space-y-4">
          <h1 className="text-2xl font-bold text-headline">Organisation Login</h1>
          <p className="text-body text-xs">Demo: relief@demo.org / org123</p>
          <input name="email" type="email" placeholder="Official Email" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-accent-orange" required />
          <input name="password" type="password" placeholder="Password" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none" required />
          {error && <p className="text-neon-red text-sm">{error}</p>}
          <button type="submit" className="w-full py-3 rounded-xl bg-accent-orange font-medium">Login</button>
          <Link to="/org/signup" className="block text-center text-sm text-body">Register organisation</Link>
        </form>
      </div>
    </div>
  )
}

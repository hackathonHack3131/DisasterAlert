import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Shield } from 'lucide-react'
import { motion } from 'framer-motion'

const links = [
  { label: 'Home', href: '/#hero' },
  { label: 'Features', href: '/#features' },
  { label: 'About', href: '/#about' },
  { label: 'Dashboard', to: '/dashboard' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const isLanding = location.pathname === '/'

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5"
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold text-headline">
          <Shield className="w-6 h-6 text-accent-blue" />
          <span>DisasterAlert</span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm text-body">
          {links.map((l) =>
            l.to ? (
              <Link key={l.label} to={l.to} className="hover:text-white transition-colors">
                {l.label}
              </Link>
            ) : (
              <a key={l.label} href={isLanding ? l.href : `/${l.href}`} className="hover:text-white transition-colors">
                {l.label}
              </a>
            )
          )}
          <Link to="/org/login" className="hover:text-accent-orange transition-colors">
            Org Login
          </Link>
          <Link to="/org/signup" className="hover:text-accent-orange transition-colors">
            Org Signup
          </Link>
          <Link to="/login" className="px-4 py-2 rounded-full border border-white/20 hover:border-accent-blue transition-colors">
            Login
          </Link>
          <Link
            to="/signup"
            className="px-4 py-2 rounded-full bg-accent-blue text-white font-medium hover:shadow-glow transition-shadow"
          >
            Signup
          </Link>
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="md:hidden glass border-t border-white/10 p-4 flex flex-col gap-3">
          {links.map((l) =>
            l.to ? (
              <Link key={l.label} to={l.to} onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ) : (
              <a key={l.label} href={l.href} onClick={() => setOpen(false)}>
                {l.label}
              </a>
            )
          )}
          <Link to="/org/login" onClick={() => setOpen(false)}>Org Login</Link>
          <Link to="/org/signup" onClick={() => setOpen(false)}>Org Signup</Link>
          <Link to="/login" onClick={() => setOpen(false)}>Login</Link>
          <Link to="/signup" onClick={() => setOpen(false)}>Signup</Link>
        </div>
      )}
    </motion.nav>
  )
}

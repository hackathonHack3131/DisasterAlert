import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AlertTriangle, LogOut, MapPin, Radio, Shield, Activity, Globe, Zap, Bell,
  Clock3, Cpu, Database, Menu, UserCircle,
} from 'lucide-react'
import { eventsApi, rescueApi, shelterApi } from '../lib/api'
import { createStompClient, subscribeAlerts, subscribeShelters } from '../lib/websocket'
import ClimateIntelligenceMap from '../components/ClimateIntelligenceMap'

const SIM_TYPES = ['FLOOD', 'FIRE', 'EARTHQUAKE', 'CYCLONE', 'LANDSLIDE']
const DEFAULT_CENTER = { lat: 19.076, lng: 72.8777 }

function nearbyDemoShelters(origin) {
  return [
    {
      id: 'demo-shelter-1',
      name: 'North Relief Command',
      status: 'ACTIVE',
      availableBeds: 148,
      latitude: origin.lat + 0.08,
      longitude: origin.lng - 0.07,
    },
    {
      id: 'demo-shelter-2',
      name: 'Metro High-Ground Shelter',
      status: 'ACTIVE',
      availableBeds: 92,
      latitude: origin.lat - 0.11,
      longitude: origin.lng + 0.09,
    },
    {
      id: 'demo-shelter-3',
      name: 'Emergency Medical Camp',
      status: 'STANDBY',
      availableBeds: 64,
      latitude: origin.lat + 0.15,
      longitude: origin.lng + 0.12,
    },
  ]
}

export default function Dashboard() {
  const navigate = useNavigate()
  const demoMode = new URLSearchParams(window.location.search).get('demo') === 'true'
  const role = localStorage.getItem('role') || (demoMode ? 'ADMIN' : null)
  const username = localStorage.getItem('username') || (demoMode ? 'Mission Lead' : null)
  const [alerts, setAlerts] = useState([])
  const [shelters, setShelters] = useState([])
  const [events, setEvents] = useState([])
  const [localEvents, setLocalEvents] = useState([])
  const [localAlerts, setLocalAlerts] = useState([])
  const [userLocation, setUserLocation] = useState(null)
  const [simulating, setSimulating] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const activeLocation = userLocation || DEFAULT_CENTER
  const visibleShelters = useMemo(
    () => (shelters.length ? shelters : nearbyDemoShelters(activeLocation)),
    [activeLocation.lat, activeLocation.lng, shelters]
  )
  const visibleEvents = useMemo(
    () => [...localEvents, ...events],
    [events, localEvents]
  )
  const visibleAlerts = useMemo(() => [...localAlerts, ...alerts], [alerts, localAlerts])

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      if (demoMode) {
        localStorage.setItem('token', 'demo-token')
        localStorage.setItem('role', 'ADMIN')
        localStorage.setItem('username', 'Mission Lead')
      } else {
        navigate('/login')
        return
      }
    }
    loadData()
    const client = createStompClient((c) => {
      subscribeAlerts(c, (a) => {
        setAlerts((prev) => [a, ...prev].slice(0, 20))
        loadData()
      })
      subscribeShelters(c, (s) => {
        setShelters((prev) => {
          const idx = prev.findIndex((x) => x.id === s.id)
          if (idx >= 0) {
            const copy = [...prev]
            copy[idx] = s
            return copy
          }
          return [...prev, s]
        })
      })
    })
    return () => client.deactivate()
  }, [demoMode, navigate])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const loadData = () => {
    eventsApi.active().then((r) => setEvents(r.data)).catch(() => {})
    shelterApi.list().then((r) => setShelters(r.data)).catch(() => {})
  }

  const simulate = async (type) => {
    setSimulating(true)
    try {
      await eventsApi.simulate({
        type,
        severity: 9,
        location: `Simulated ${type} — ${userLocation?.city || userLocation?.region || 'Live Region'}`,
        latitude: activeLocation.lat,
        longitude: activeLocation.lng,
        affectedRadius: 30,
      })
      loadData()
    } catch (err) {
      const drillEvent = {
        id: `local-${Date.now()}`,
        disasterType: type,
        message: `${type} drill activated near live user location`,
        location: userLocation?.label || 'Live GPS sector',
        latitude: activeLocation.lat,
        longitude: activeLocation.lng,
        severity: 9,
      }
      setLocalEvents((prev) => [drillEvent, ...prev].slice(0, 8))
      setLocalAlerts((prev) => [
        {
          id: `local-alert-${Date.now()}`,
          disasterType: type,
          message: 'Local simulation overlay activated while backend is offline',
          location: drillEvent.location,
        },
        ...prev,
      ].slice(0, 8))
    } finally {
      setSimulating(false)
    }
  }

  const requestHelp = async () => {
    try {
      await rescueApi.request({
        userId: 'demo-user',
        description: `Need immediate evacuation assistance at ${userLocation?.label || 'current GPS location'}`,
        priority: 'HIGH',
        latitude: activeLocation.lat,
        longitude: activeLocation.lng,
      })
      setLocalEvents((prev) => [
        {
          id: `sos-event-${Date.now()}`,
          disasterType: 'SOS',
          message: 'Emergency SOS marker from live user location',
          latitude: activeLocation.lat,
          longitude: activeLocation.lng,
          severity: 10,
        },
        ...prev,
      ].slice(0, 8))
      setLocalAlerts((prev) => [
        {
          id: `sos-${Date.now()}`,
          disasterType: 'SOS',
          message: 'SOS sent with live user coordinates',
          location: userLocation?.label || 'Live GPS sector',
        },
        ...prev,
      ].slice(0, 8))
      alert('Rescue request sent to nearby organisations')
    } catch {
      setLocalEvents((prev) => [
        {
          id: `sos-event-${Date.now()}`,
          disasterType: 'SOS',
          message: 'Emergency SOS marker from live user location',
          latitude: activeLocation.lat,
          longitude: activeLocation.lng,
          severity: 10,
        },
        ...prev,
      ].slice(0, 8))
      setLocalAlerts((prev) => [
        {
          id: `sos-alert-${Date.now()}`,
          disasterType: 'SOS',
          message: 'SOS staged locally and shown on operations map',
          location: userLocation?.label || 'Live GPS sector',
        },
        ...prev,
      ].slice(0, 8))
      alert('SOS staged locally while backend is offline')
    }
  }

  const logout = () => {
    localStorage.clear()
    navigate('/')
  }

  return (
    <div className="min-h-screen dashboard-bg relative">
      {/* Grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,80,255,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,80,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      <header className="sticky top-0 z-50 border-b border-white/5 backdrop-blur-xl bg-[#030308]/80">
        <div className="max-w-[1700px] mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 min-w-0"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-accent-blue/30 blur-xl rounded-full" />
              <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-accent-blue/30 to-cyan-500/10 border border-accent-blue/30">
                <Shield className="w-5 h-5 text-accent-blue" />
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-headline tracking-tight truncate max-w-[145px] sm:max-w-none">
                Climate Intelligence Command
              </h1>
              <p className="hidden sm:flex text-[11px] text-body items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
                Satellite-assisted realtime disaster intelligence
              </p>
            </div>
          </motion.div>

          <nav className="hidden xl:flex items-center gap-1 p-1 rounded-full bg-white/[0.03] border border-white/10">
            {['Command', 'Heatmap', 'Operations', 'Alerts'].map((item, index) => (
              <button
                key={item}
                type="button"
                className={`px-4 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.18em] transition-all ${
                  index === 0 ? 'bg-accent-blue/20 text-white shadow-[0_0_20px_rgba(0,80,255,0.28)]' : 'text-body hover:text-white'
                }`}
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10">
              <Clock3 className="w-4 h-4 text-accent-blue" />
              <span className="font-mono text-xs text-headline">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <button
              type="button"
              className="relative hidden sm:grid place-items-center w-9 h-9 rounded-xl bg-white/[0.03] border border-white/10 text-body hover:text-white hover:border-accent-blue/40 transition-all"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-neon-red shadow-[0_0_12px_rgba(255,45,85,0.85)]" />
            </button>
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10">
              <UserCircle className="w-6 h-6 text-accent-blue" />
              <div className="text-right">
                <p className="text-xs font-medium text-headline leading-tight">{username || 'Operator'}</p>
                <p className="text-[9px] text-accent-blue uppercase tracking-wider">{role || 'FIELD UNIT'}</p>
              </div>
            </div>
            <Link
              to="/"
              className="hidden sm:inline-flex px-3 py-1.5 rounded-lg text-xs text-body hover:text-white hover:bg-white/5 transition-colors"
            >
              Home
            </Link>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-body hover:text-neon-red hover:bg-neon-red/10 border border-transparent hover:border-neon-red/30 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
            <button
              type="button"
              className="grid xl:hidden place-items-center w-9 h-9 rounded-xl bg-white/[0.03] border border-white/10 text-body"
              aria-label="Open navigation menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative max-w-[1700px] mx-auto px-4 py-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="climate-command-header overflow-hidden"
        >
          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.22em] text-neon-green bg-neon-green/10 border border-neon-green/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
                  Live monitoring
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.22em] text-accent-blue bg-accent-blue/10 border border-accent-blue/20">
                  <Database className="w-3 h-3" />
                  Sync online
                </span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight text-headline">
                Climate Intelligence Command
              </h2>
              <p className="mt-3 text-sm md:text-base text-body max-w-2xl">
                Satellite-assisted realtime disaster intelligence across rainfall, humidity,
                flood zones, resource deployment, and AI threat prediction.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 min-w-0 lg:min-w-[420px]">
              {[
                { icon: Globe, label: 'Orbital feed', value: 'SAT-12' },
                { icon: Cpu, label: 'AI model', value: 'RiskNet 4.2' },
                { icon: Activity, label: 'Heartbeat', value: '1.8s' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="mission-stat-tile">
                  <Icon className="w-4 h-4 text-accent-blue" />
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <ClimateIntelligenceMap
          events={visibleEvents}
          shelters={visibleShelters}
          center={DEFAULT_CENTER}
          onUserLocationChange={setUserLocation}
        />

        <div className="grid lg:grid-cols-12 gap-4">
          {role === 'ADMIN' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-7 glow-card p-5"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-accent-orange/20">
                  <Radio className="w-5 h-5 text-accent-orange" />
                </div>
                <div>
                  <h3 className="font-semibold text-headline">Disaster Drill Simulation</h3>
                  <p className="text-xs text-body">Trigger live overlays, alerts, shelter activation</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {SIM_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => simulate(t)}
                    disabled={simulating}
                    className="group relative px-5 py-2.5 rounded-xl text-sm font-medium overflow-hidden disabled:opacity-50 transition-all hover:scale-105"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-accent-orange/30 to-red-500/20 group-hover:from-accent-orange/50 transition-all" />
                    <span className="absolute inset-0 border border-accent-orange/40 rounded-xl" />
                    <span className="relative flex items-center gap-1.5 text-accent-orange">
                      <Zap className="w-3.5 h-3.5" />
                      {t}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <div className={`space-y-4 ${role === 'ADMIN' ? 'lg:col-span-5' : 'lg:col-span-12 lg:grid lg:grid-cols-3 lg:gap-4 lg:space-y-0'}`}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="glow-card p-5"
            >
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-neon-red/20">
                  <AlertTriangle className="w-4 h-4 text-neon-red" />
                </div>
                Live Alerts
              </h3>
              <div className="space-y-2 max-h-44 overflow-y-auto custom-scrollbar">
                {[...visibleAlerts, ...visibleEvents].slice(0, 6).map((a, i) => (
                  <div
                    key={a.id || i}
                    className="p-3 rounded-xl bg-gradient-to-r from-neon-red/10 to-transparent border border-neon-red/20 text-sm"
                  >
                    <span className="text-neon-red font-bold text-xs tracking-wide">{a.disasterType}</span>
                    <p className="text-body text-xs mt-1 line-clamp-2">{a.message || a.location}</p>
                  </div>
                ))}
                {visibleAlerts.length === 0 && visibleEvents.length === 0 && (
                  <div className="text-center py-6 text-body text-sm">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No active alerts
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glow-card p-5"
            >
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-accent-blue/20">
                  <MapPin className="w-4 h-4 text-accent-blue" />
                </div>
                Shelters
              </h3>
              <div className="space-y-2 max-h-44 overflow-y-auto">
                {visibleShelters.map((s) => (
                  <div key={s.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-accent-blue/30 transition-colors">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-headline font-medium">{s.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          s.status === 'ACTIVE' ? 'bg-neon-green/20 text-neon-green' : 'bg-white/10 text-body'
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>
                    <p className="text-body text-xs mt-1">{s.availableBeds} beds available</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="glow-card p-5 flex flex-col justify-between min-h-[180px]"
            >
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-neon-green" />
                  Emergency SOS
                </h3>
                <p className="text-body text-xs">Broadcast help request to nearby rescue organisations.</p>
              </div>
              <button
                type="button"
                onClick={requestHelp}
                className="mt-4 w-full py-4 rounded-xl font-bold text-white relative overflow-hidden group"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-neon-red via-red-600 to-neon-red bg-[length:200%_100%] group-hover:animate-[shimmer_2s_linear_infinite]" />
                <span className="absolute inset-0 shadow-[0_0_40px_-5px_rgba(255,45,85,0.8)]" />
                <span className="relative">SOS — Request Help</span>
              </button>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}
